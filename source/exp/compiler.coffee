# Compile a rules json to typescript

strDefs = []
reDefs = []

defineTerminal = (lit) ->
  id = "$L#{strDefs.length}"
  strDefs.push lit

  return id

defineRe = (re) ->
  id = "$R#{reDefs.length}"
  reDefs.push re

  return id

compileOp = (tuple) ->
  if Array.isArray(tuple)
    [op, args, h] = tuple
    switch op
      when "L"
        defineTerminal(args)
      when "R"
        defineRe(args)
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

regExpHandlerParams = [0...10].map (_, i) -> "$#{i}"
regularHandlerParams = ["$loc", "$0", "$1"]

compileHandler = (name, arg) ->
  return unless Array.isArray(arg)
  [op, args, h] = arg

  if h?.f? # function mapping
    if op is "S"
      parameters = ["$loc", "$0"].concat args.map (_, i) -> "$#{i+1}"

      return """
        const #{name}_handler = makeResultHandler_S(function(#{parameters.join(", ")}) {#{h.f}});
      """
    else if op is "R"
      parameters = ["$loc"].concat regExpHandlerParams

      return """
        const #{name}_handler = makeResultHandler_R(function(#{parameters.join(", ")}) {#{h.f}});
      """
    else
      parameters = regularHandlerParams

      return """
        const #{name}_handler = makeResultHandler(function(#{parameters.join(", ")}) {#{h.f}});
      """
  else if h # other mapping
    # TODO: opportunity for precompiling this more
    return """
      const #{name}_handler = makeStructuralHandler(#{JSON.stringify(h)});
    """
  else
    if op is "R"
      return """
        const #{name}_handler = defaultRegExpHandler;
      """

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
        "#{compileOp(arg)}(state)"
    .join(" || ")

    """
      #{handlers.join("\n")}
      function #{name}(state) {
        return #{options}
      }
    """

  else
    handler = compileHandler(name, rule)

    if handler
      """
        #{handler}
        function #{name}(state) {
          return #{name}_handler(#{compileOp(rule)}(state));
        }
      """
    else
      """
        function #{name}(state) {
          return #{compileOp(rule)}(state);
        }
      """

header = """
  import {
    $L, $R, $C, $S, $E, $P, $Q, $N, $Y,
    defaultRegExpHandler,
    makeResultHandler_R,
    makeResultHandler_S,
    makeResultHandler,
    makeStructuralHandler,
  } from "./machine"
"""

module.exports =
  typeScript: (rules) ->

    body = Object.keys(rules).map (name) ->
      compileRule(name, rules[name])
    .join("\n\n")

    """
    #{header}

    #{ strDefs.map (str, i) ->
      """
        const $l#{i} = #{JSON.stringify(str)};
        function $L#{i}(state) { return $L(state, $l#{i}) }
      """
    .join "\n" }

    #{ reDefs.map (r, i) ->
      """
        const $r#{i} = new RegExp(#{JSON.stringify(r)}, 'suy');
        function $R#{i}(state) { return $R(state, $r#{i}) }
      """

    .join "\n" }

    #{body}
    """
