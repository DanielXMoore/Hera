# Compile a rules json to typescript

#
###*
@typedef {import("./machine").HeraAST} HeraAST
@typedef {import("./machine").StructuralHandling} StructuralHandling
###

#
###* @type {string[]} ###
strDefs = []
#
###* @type {string[]} ###
reDefs = []

#
###*
Define a literal string terminal

@param lit {string}
###
defineTerminal = (lit) ->
  index = strDefs.indexOf(lit)

  if index >= 0
    id = "$L#{index}"
  else
    id = "$L#{strDefs.length}"
    strDefs.push lit

  return id

#
###*
Define a RegExp terminal

@param re {string}
###
defineRe = (re) ->
  index = reDefs.indexOf(re)

  if index >= 0
    id = "$R#{index}"
  else
    id = "$R#{reDefs.length}"
    reDefs.push re

  return id

#
###*
Pretty print a string or RegExp literal

@param name {string}
@param terminal {string}
@param [re] {boolean} Whether this terminal is a regexp or not.
###
prettyPrint = (name, terminal, re) ->
  if re
    pv = "/#{terminal}/"
  else
    pv = JSON.stringify(terminal)

  return "#{name} #{pv}"

#
###*
Compile an operator to a JS or TS string.

@param tuple {HeraAST}
@param name {string}
@param defaultHandler {boolean}
@param types {boolean}
@return {string}
###
compileOp = (tuple, name, defaultHandler, types) ->
  # TODO: should nested levels have default handler set to true? (only comes into play on regexps)
  if Array.isArray(tuple)
    switch tuple[0]
      when "L"
        args = tuple[1]
        "$EXPECT(#{defineTerminal(args)}, fail, #{JSON.stringify(prettyPrint(name, args))})"
      when "R"
        args = tuple[1]
        f = "$EXPECT(#{defineRe(args)}, fail, #{JSON.stringify(prettyPrint(name, args, true))})"
        if defaultHandler
          f ="$R$0(#{f})#{reType(types, args)}"

        return f
      when "/"
        src = tuple[1].map (arg) ->
          compileOp(arg, name, defaultHandler, types)
        .join(", ")
        "$C(#{src})"
      when "S"
        src = tuple[1].map (arg) ->
          compileOp(arg, name, defaultHandler, types)
        .join(", ")
        "$S(#{src})"
      when "*"
        "$Q(#{compileOp(tuple[1], name, defaultHandler, types)})"
      when "+"
        "$P(#{compileOp(tuple[1], name, defaultHandler, types)})"
      when "?"
        "$E(#{compileOp(tuple[1], name, defaultHandler, types)})"
      when "$"
        # Inside text can ignore all handlers since they are disregarded anyway
        "$TEXT(#{compileOp(tuple[1], name, false, types)})"
      when "&"
        "$Y(#{compileOp(tuple[1], name, defaultHandler, types)})"
      when "!"
        "$N(#{compileOp(tuple[1], name, defaultHandler, types)})"
      else
        throw new Error "Unknown op: #{tuple[0]} #{JSON.stringify(tuple[1])}"
  else # rule reference
    tuple

# Only rules have handlers, either one per choice line,
# or one for the whole deal

regExpHandlerParams = ["$skip", "$loc"].concat [0...10].map (_, i) -> "$#{i}"

#
###*
# @type ["$skip", "$loc", "$0", "$1"]
###
regularHandlerParams = ["$skip", "$loc", "$0", "$1"]

# Offset is so sequences start at the first item in the array
# and regexps start at the second because the first is the entire match
# TODO: is 0 valid to select the entire sequence result?
# TODO: remove offset and unify handlings
#
###*
@param mapping {StructuralHandling}
@param source {any}
@param [single] {boolean}
@param [offset] {number}
@return {string}
###
compileStructuralHandler = (mapping, source, single=false, offset) ->
  #
  ###* @type {{[key: string]: StructuralHandling}} ###
  #@ts-ignore CoffeeSense workaround
  o = null
  offset ?= -1

  switch typeof mapping
    when "string"
      JSON.stringify(mapping)
    when "object"
      if Array.isArray mapping
        "[#{mapping.map((m) -> compileStructuralHandler(m, source, single, offset)).join(', ')}]"
      else if mapping is null
        "null"
      else if "v" of mapping
        if single
          source
        else
          "#{source}[#{mapping.v+offset}]"
      else if "o" of mapping
        o = mapping.o
        "{" + Object.keys(mapping.o).map (key) ->
          "#{JSON.stringify(key)}: #{compileStructuralHandler(o[key], source, single, offset)}"
        .join(", ") + "}"
      else
        throw new Error "unknown object mapping"
    else # number, boolean, null, undefined
      String(mapping)

#
###*

@param options {{types: boolean}}
@param arg {HeraAST}
@param name {string}
###
compileHandler = (options, arg, name) ->
  if typeof arg is "string"
    return arg # reference to other named parser function

  if arg[2]
    h = arg[2]
    if typeof h is "object" and "f" of h # function mapping
      parser = compileOp(arg, name, false, options.types)
      if arg[0] is "S"
        parameters = ["$skip", "$loc", "$0"].concat arg[1].map (_, i) -> "$#{i+1}"

        return """
          $TS(#{parser}, function(#{parameters.join(", ")}) {#{h.f}})
        """
      else if arg[0] is "R"
        return """
          $TR(#{parser}, function(#{regExpHandlerParams.join(", ")}) {#{h.f}})
        """
      else
        return """
          $TV(#{parser}, function(#{regularHandlerParams.join(", ")}) {#{h.f}})
        """
    else # structural mapping
      parser = compileOp(arg, name, false, options.types)
      if arg[0] is "S"
        return """
          $T(#{parser}, function(value) { return #{compileStructuralHandler(h, "value")} })
        """
      else if arg[0] is "R"
        return """
          $T(#{parser}, function(value) { return #{compileStructuralHandler(h, "value", false, 0)} })
        """
      else
        return """
          $T(#{parser}, function(value) { return #{compileStructuralHandler(h, "value", true)} })
        """

  return compileOp(arg, name, true, options.types)

#
###*

@param options {{types: boolean}}
@param name {string}
@param rule {HeraAST}
###
compileRule = (options, name, rule) ->
  if options.types
    stateType = ": ParseState"
  else
    stateType = ""

  # first level choice may have nested handlings
  if typeof rule is "string" or !(rule[0] is "/" and !rule[2])
    """
      const #{name}$0 = #{compileHandler(options, rule, name)};
      function #{name}(state#{stateType}) {
        return #{name}$0(state);
      }
    """
  else
    args = rule[1]
    fns = args.map (arg, i) ->
      "const #{name}$#{i} = #{compileHandler options, arg, name};"

    choices = args.map (_, i) ->
      "#{name}$#{i}(state)"
    .join(" || ")

    """
      #{fns.join("\n")}
      function #{name}(state#{stateType}) {
        return #{choices}
      }
    """

#
###*
@param ruleNames {string[]}
###
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
  @param rules {{[k: string]: HeraAST}}
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

#
###*
Generate a more specific TypeScript type for Regular expressions that consist of
limited productions. Returns an empty string if `types` is `false`.

@param types {boolean}
@param str {string}
###
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
