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
      when "$"
        "$TEXT(#{compileOp(args)})"
      when "&"
        "$Y(#{compileOp(args)})"
      when "!"
        "$N(#{compileOp(args)})"
      else
        throw new Error "Unknown op: #{op} ", args
  else # rule reference
    tuple

# Only rules have handlers, either one per choice line,
# or one for the whole deal

regExpHandlerParams = ["$loc"].concat [0...10].map (_, i) -> "$#{i}"
regularHandlerParams = ["$loc", "$0", "$1"]

compileStructuralHandler = (mapping, source, single=false) ->
  switch typeof mapping
    when "string"
      JSON.stringify(mapping)
    when "number"
      if single
        source
      else
        "#{source}[#{mapping-1}]"
    when "object"
      if Array.isArray mapping
        "[#{mapping.map((m) -> compileStructuralHandler(m, source, single)).join(', ')}]"
    else
      throw new Error "Unknown mapping: #{mapping}"

compileHandler = (options, name, arg) ->
  return unless Array.isArray(arg)

  types = options.types

  if types
    locType = ": Loc"
    vType = ": V"
    resultType = ": MaybeResult<V>"
    typeVariable = "<V extends any[]>"
  else
    locType = ""
    vType = ""
    resultType = ""
    typeVariable = ""

  [op, args, h] = arg

  if h?.f? # function mapping
    if op is "S"
      parameters = ["$loc#{locType}", "$0#{vType}"].concat args.map (_, i) ->
        if types
          "$#{i+1}:V[#{i}]"
        else
          "$#{i+1}"

      if types
        returnConversion = " as unknown as MaybeResult<ReturnType<typeof #{name}_handler_fn>>"
      else
        returnConversion = ""

      return """
        function #{name}_handler_fn#{typeVariable}(#{parameters.join(", ")}){#{h.f}}
        function #{name}_handler#{typeVariable}(result#{resultType}) {
          if (result) {
            //@ts-ignore
            result.value = #{name}_handler_fn(result.loc, result.value, ...result.value);
            return result#{returnConversion}
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

      if types
        returnType = ": MaybeResult<#{compileStructuralHandler(h, "V")}>"
      else
        returnType = ""

      return """
        function #{name}_handler#{typeVariable}(result#{resultType})#{returnType} {
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
      parameters = regularHandlerParams

      if types
        typeVariable = "<V>"
        returnType = ": MaybeResult<#{compileStructuralHandler(h, "V", true)}>"
      else
        returnType = ""

      return """
        function #{name}_handler#{typeVariable}(result#{resultType})#{returnType} {
          if (result) {
            const { value } = result
            const mappedValue = #{compileStructuralHandler(h, "value", true)}

            //@ts-ignore
            result.value = mappedValue
            //@ts-ignore
            return result
          }
        };
      """

  # no mapping
  return


compileRule = (options, name, rule) ->
  [op, args, h] = rule

  if options.types
    stateType = ": ParseState"
  else
    stateType = ""

  # choice may have nested handlings?
  if op is "/" and !h
    handlers = args.map (arg, i) ->
      compileHandler options, "#{name}_#{i}", arg

    options = args.map (arg, i) ->
      if handlers[i]
        "#{name}_#{i}_handler(#{compileOp(arg)}(state))"
      else
        "#{compileOp(arg, true)}(state)"
    .join(" || ")

    """
      #{handlers.join("\n")}
      function #{name}(state#{stateType}) {
        return #{options}
      }
    """

  else
    handler = compileHandler(options, name, rule)

    if handler
      """
        #{handler}
        function #{name}(state#{stateType}) {
          return #{name}_handler(#{compileOp(rule)}(state));
        }
      """
    else
      """
        function #{name}(state#{stateType}) {
          return #{compileOp(rule, true)}(state);
        }
      """

module.exports =
  compile: (rules, options={}) ->
    { types } = options
    ruleNames = Object.keys(rules)

    body = ruleNames.map (name) ->
      compileRule(options, name, rules[name])
    .join("\n\n")

    if types
      stateType = ": ParseState"
      header = """
      import {
        $C, $S, $E, $P, $Q, $TEXT, $N, $Y,
        Loc,
        MaybeResult,
        ParseState,
        defaultRegExpTransform,
        makeResultHandler_R,
        makeResultHandler,
        parserState,
      } from "./machine"

      const { parse, $L, $R } = parserState(#{ruleNames[0]})
      """
    else
      stateType = ""
      header = """
      const {
        $C, $S, $E, $P, $Q, $TEXT, $N, $Y,
        parserState,
        defaultRegExpTransform,
        makeResultHandler_R,
        makeResultHandler,
      } = require("./machine")

      const { parse, $L, $R } = parserState(#{ruleNames[0]})
      """

    """
    #{header}

    #{ strDefs.map (str, i) ->
      """
        const $l#{i} = "#{str}";
        function $L#{i}(state#{stateType}) { return $L(state, $l#{i}) }
      """
    .join "\n" }

    #{ reDefs.map (r, i) ->
      """
        const $r#{i} = new RegExp(#{JSON.stringify(r)}, 'suy');
        function $R#{i}(state#{stateType}) { return $R(state, $r#{i}) }
      """

    .join "\n" }

    #{body}

    module.exports = {
      parse: parse
    }
    """
