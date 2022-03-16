# Compile a rules json to typescript

strDefs = []
reDefs = []

defineTerminal = (lit) ->
  index = strDefs.indexOf(lit)

  if index >= 0
    id = "$L#{index}"
  else
    id = "$L#{strDefs.length}"
    strDefs.push lit

  return id

defineRe = (re) ->
  index = reDefs.indexOf(re)

  if index >= 0
    id = "$R#{index}"
  else
    id = "$R#{reDefs.length}"
    reDefs.push re

  return id

compileOp = (tuple, defaultHandler) ->
  if Array.isArray(tuple)
    [op, args, h] = tuple
    switch op
      when "L"
        defineTerminal(args)
      when "R"
        f = defineRe(args)
        if defaultHandler
          "defaultRegExpTransform(#{f})"
        else
          f
      when "/"
        "$C(#{args.map(compileOp).join(", ")})"
      when "S"
        "$S(#{args.map(compileOp).join(", ")})"
      when "*"
        "$Q(#{compileOp(args)})"
      when "+"
        "$P(#{compileOp(args)})"
      when "?"
        "$E(#{compileOp(args)})"
      when "&"
        "$Y(#{compileOp(args)})"
      when "!"
        "$N(#{compileOp(args)})"
      else
        "TODO" + JSON.stringify(tuple)
  else # rule reference
    tuple

# Only rules have handlers, either one per choice line,
# or one for the whole deal

regExpHandlerParams = ["$loc"].concat [0...10].map (_, i) -> "$#{i}"
regularHandlerParams = ["$loc", "$0", "$1"]

compileStructuralHandler = (mapping, source) ->
  switch typeof mapping
    when "string"
      JSON.stringify(mapping)
    when "number"
      "#{source}[#{mapping-1}]"
    when "object"
      if Array.isArray mapping
        "[#{mapping.map((m) -> compileStructuralHandler(m, source)).join(',')}]"
    else
      throw new Error "Unknown mapping: #{mapping}"

compileHandler = (name, arg) ->
  return unless Array.isArray(arg)
  [op, args, h] = arg

  if h?.f? # function mapping
    if op is "S"
      parameters = ["$loc:Loc", "$0:V"].concat args.map (_, i) -> "$#{i+1}:V[#{i}]"

      return """
        function #{name}_handler<V extends any[]>(result: MaybeResult<V>) {
          if (result) {
            function fn(#{parameters.join(", ")}){#{h.f}}

            //@ts-ignore
            result.value = fn(result.loc, result.value, ...result.value);

            return result as unknown as MaybeResult<ReturnType<typeof fn>>
          }
        };
      """
    else if op is "R"
      parameters = regExpHandlerParams

      return """
        const #{name}_handler = makeResultHandler_R(function(#{parameters.join(", ")}) {#{h.f}});
      """
    else
      parameters = regularHandlerParams

      return """
        const #{name}_handler = makeResultHandler(function(#{parameters.join(", ")}) {#{h.f}});
      """
  else if h # other mapping
    if op is "S" or op is "R"
      parameters = regExpHandlerParams
      return """
        function #{name}_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<#{compileStructuralHandler(h, "V")}> {
          if (result) {
            const { value } = result
            const mappedValue = #{compileStructuralHandler(h, "value")}

            //@ts-ignore
            result.value = mappedValue
            //@ts-ignore
            return result
          }
        };
      """
    else
      throw new Error "Structural handling doesn't make sense for #{JSON.stringify(arg)}"

  # no mapping
  return


compileRule = (name, rule) ->
  [op, args, h] = rule

  # choice may have nested handlings?
  if op is "/" and !h
    handlers = args.map (arg, i) ->
      compileHandler "#{name}_#{i}", arg

    options = args.map (arg, i) ->
      if handlers[i]
        "#{name}_#{i}_handler(#{compileOp(arg)}(state))"
      else
        "#{compileOp(arg, true)}(state)"
    .join(" || ")

    """
      #{handlers.join("\n")}
      function #{name}(state: ParseState) {
        return #{options}
      }
    """

  else
    handler = compileHandler(name, rule)

    if handler
      """
        #{handler}
        function #{name}(state: ParseState) {
          return #{name}_handler(#{compileOp(rule)}(state));
        }
      """
    else
      """
        function #{name}(state: ParseState) {
          return #{compileOp(rule, true)}(state);
        }
      """

header = """
  import {
    $L, $R, $C, $S, $E, $P, $Q, $N, $Y,
    Loc,
    MaybeResult,
    ParseState,
    defaultRegExpTransform,
    makeResultHandler_R,
    makeResultHandler,
    parse as heraParse,
  } from "./machine"
"""

module.exports =
  typeScript: (rules) ->
    ruleNames = Object.keys(rules)

    body = ruleNames.map (name) ->
      compileRule(name, rules[name])
    .join("\n\n")

    """
    #{header}

    #{ strDefs.map (str, i) ->
      """
        const $l#{i} = "#{str}";
        function $L#{i}(state: ParseState) { return $L(state, $l#{i}) }
      """
    .join "\n" }

    #{ reDefs.map (r, i) ->
      """
        const $r#{i} = new RegExp(#{JSON.stringify(r)}, 'suy');
        function $R#{i}(state: ParseState) { return $R(state, $r#{i}) }
      """

    .join "\n" }

    #{body}

    export function parse(input:string) {
      return heraParse(#{ruleNames[0]}, input);
    }
    """
