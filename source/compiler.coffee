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

# Pretty print a string or RegExp literal
prettyPrint = (name, terminal, re) ->
  if re
    pv = "/#{terminal}/"
  else
    pv = JSON.stringify(terminal)

  return "#{name} #{pv}"

#
###*
# @param tuple {HeraAST}
# @param defaultHandler:boolean
###
compileOp = (tuple, name, defaultHandler, types) ->
  # TODO: should nested levels have default handler set to true? (only comes into play on regexps)
  if Array.isArray(tuple)
    [op, args] = tuple
    switch op
      when "L"
        "$EXPECT(#{defineTerminal(args)}, fail, #{JSON.stringify(prettyPrint(name, args))})"
      when "R"
        f = "$EXPECT(#{defineRe(args)}, fail, #{JSON.stringify(prettyPrint(name, args, true))})"
        if defaultHandler
          f ="$R$0(#{f})#{reType(types, args)}"

        return f
      when "/"
        src = args.map (arg) ->
          compileOp(arg, name, defaultHandler, types)
        .join(", ")
        "$C(#{src})"
      when "S"
        src = args.map (arg) ->
          compileOp(arg, name, defaultHandler, types)
        .join(", ")
        "$S(#{src})"
      when "*"
        "$Q(#{compileOp(args, name, defaultHandler, types)})"
      when "+"
        "$P(#{compileOp(args, name, defaultHandler, types)})"
      when "?"
        "$E(#{compileOp(args, name, defaultHandler, types)})"
      when "$"
        # Inside text can ignore all handlers since they are disregarded anyway
        "$TEXT(#{compileOp(args, name, false, types)})"
      when "&"
        "$Y(#{compileOp(args, name, defaultHandler, types)})"
      when "!"
        "$N(#{compileOp(args, name, defaultHandler, types)})"
      else
        throw new Error "Unknown op: #{op} #{JSON.stringify(args)}"
  else # rule reference
    tuple

# Only rules have handlers, either one per choice line,
# or one for the whole deal

regExpHandlerParams = ["$loc"].concat [0...10].map (_, i) -> "$#{i}"

#
###*
# @type ["$loc", "$0", "$1"]
###
regularHandlerParams = ["$loc", "$0", "$1"]

# Offset is so sequences start at the first item in the array
# and regexps start at the second because the first is the entire match
# TODO: is 0 valid to select the entire sequence result?
# TODO: remove offset and unify handlings
compileStructuralHandler = (mapping, source, single=false, offset) ->
  offset ?= -1

  switch typeof mapping
    when "string"
      JSON.stringify(mapping)
    when "object"
      if Array.isArray mapping
        "[#{mapping.map((m) -> compileStructuralHandler(m, source, single, offset)).join(', ')}]"
      else if mapping is null
        "null"
      else if mapping.v?
        if single
          source
        else
          "#{source}[#{mapping.v+offset}]"
      else if mapping.o
        o = mapping.o
        "{" + Object.keys(mapping.o).map (key) ->
          "#{JSON.stringify(key)}: #{compileStructuralHandler(o[key], source, single, offset)}"
        .join(", ") + "}"
      else
        throw new Error "unknown object mapping"
    else # number, boolean, null, undefined
      String(mapping)

compileHandler = (options, arg, name) ->
  if typeof arg is "string"
    return arg # reference to other named parser function

  return unless Array.isArray(arg)

  [op, args, h] = arg

  if h?.f? # function mapping
    parser = compileOp(arg, name, false, options.types)
    if op is "S"
      parameters = ["$loc", "$0"].concat args.map (_, i) -> "$#{i+1}"

      return """
        $TS(#{parser}, function(#{parameters.join(", ")}) {#{h.f}})
      """
    else if op is "R"
      return """
        $TR(#{parser}, function(#{regExpHandlerParams.join(", ")}) {#{h.f}})
      """
    else
      return """
        $TV(#{parser}, function(#{regularHandlerParams.join(", ")}) {#{h.f}})
      """
  else if h? # structural mapping
    parser = compileOp(arg, name, false, options.types)
    if op is "S"
      return """
        $T(#{parser}, function(value) { return #{compileStructuralHandler(h, "value")} })
      """
    else if op is "R"
      return """
        $T(#{parser}, function(value) { return #{compileStructuralHandler(h, "value", false, 0)} })
      """
    else
      return """
        $T(#{parser}, function(value) { return #{compileStructuralHandler(h, "value", true)} })
      """
  else
    return compileOp(arg, name, true, options.types)

compileRule = (options, name, rule) ->
  [op, args, h] = rule

  if options.types
    stateType = ": ParseState"
  else
    stateType = ""

  # first level choice may have nested handlings
  if op is "/" and !h
    fns = args.map (arg, i) ->
      "const #{name}$#{i} = #{compileHandler options, arg, name};"

    options = args.map (_, i) ->
      "#{name}$#{i}(state)"
    .join(" || ")

    """
      #{fns.join("\n")}
      function #{name}(state#{stateType}) {
        return #{options}
      }
    """

  else
    """
      const #{name}$0 = #{compileHandler(options, rule, name)};
      function #{name}(state#{stateType}) {
        return #{name}$0(state);
      }
    """

compileRulesObject = (ruleNames) ->
  meat = ruleNames.map (name) ->
    "#{name}: #{name}"
  .join(",\n")

  """
  {
    #{meat}
  }
  """

# TODO: bundling for esbuild
tsMachine = require('fs').readFileSync(__dirname + "/machine.ts", "utf8")
jsMachine = require('fs').readFileSync(__dirname + "/machine.js", "utf8")

defaultOptions =
  types: false

module.exports =
  #
  ###*
  # @param rules {[k: string]: HeraAST}
  ###
  compile: (rules, options=defaultOptions) ->
    { types } = options
    ruleNames = Object.keys(rules)

    body = ruleNames.map (name) ->
      compileRule(options, name, rules[name])
    .join("\n\n")

    if types
      header = tsMachine
    else
      header = jsMachine

    """
    #{header}

    const { parse } = parserState(#{compileRulesObject(ruleNames)})

    #{ strDefs.map (str, i) ->
      """
        const $L#{i} = $L("#{str}");
      """
    .join "\n" }

    #{ reDefs.map (r, i) ->
      """
        const $R#{i} = $R(new RegExp(#{JSON.stringify(r)}, 'suy'));
      """

    .join "\n" }

    #{body}

    module.exports = {
      parse: parse
    }
    """

isSimple = /^[^.*+?{}()\[\]^\\]*$/
isSimpleCharacterClass = /^\[[^-^\\]*\]$/

reType = (types, str) ->
  if types
    specifics =
      if str.match(isSimple)
        str.split("|").map (s) ->
          JSON.stringify(s)
      else if str.match(isSimpleCharacterClass)
        str.substring(1, str.length-1).split("").map (s) ->
          JSON.stringify(s)

    if specifics
      " as Parser<#{specifics.join("|")}>"
    else
      ""
  else
    ""
