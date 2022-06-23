hera = require "./main"

module.exports =
  ###*
  Convert HeraRules to a Hera source text
  @param rules {import("./machine").HeraRules}
  ###
  decompile: (rules) ->
    Object.keys(rules).map (name) ->
      value = toS rules[name]
      "#{name}\n  #{value}\n"
    .join("\n")

#
###*
@param mapping {import("./machine").StructuralHandling}
@return {string}
###
structuralToSource = (mapping) ->
  switch typeof mapping
    when "number"
      mapping.toString()
    when "string"
      JSON.stringify(mapping)
    when "object"
      if Array.isArray(mapping)
        "[" + mapping.map (m) ->
          structuralToSource(m)
        .join(", ") + "]"
      else if "v" of mapping
        "$#{mapping.v}"
      else if "o" of mapping
        throw new Error "TODO"
      else
        throw new Error "Unknown mapping object"

#
###*
handler to source
@param h {import("./machine").Handler | undefined}
###
hToS = (h) ->
  return "" unless h?

  " -> " +
  if typeof h is "object" and "f" of h # functional handler
    "\n#{h.f.replace(/^|\n/g, "$&    ")}"
  else # structural handler
    structuralToSource(h)

#
###*
Generate a source document from the rules AST

@param rule {import("./machine").HeraAST}
@return {string}
###
toS = (rule, depth=0) ->
  if Array.isArray(rule)
    [ , , h] = rule
    switch rule[0]
      when "*", "+", "?"
        toS(rule[1], depth+1) + rule[0] + hToS(h)
      when "$", "&", "!"
        rule[0] + toS(rule[1], depth+1) + hToS(h)
      when "L"
        '"' + rule[1] + '"' + hToS(h)
      when "R"
        v = rule[1]
        if v is "."
          return v + hToS(h)

        try
          hera.parse v,
            startRule: "CharacterClassExpression"
          v + hToS(h)
        catch
          '/' + v + '/' + hToS(h)

      when "S"
        terms = rule[1].map (i) ->
          toS i, depth+1

        if depth < 1
          terms.join(" ") + hToS(h)
        else
          "( " + terms.join(" ") + " )"

      when "/"
        terms = rule[1].map (i) ->
          toS i, depth and depth+1

        if depth is 0 and !h
          terms.join("\n  ")
        else
          "( " + terms.join(" / ") + " )" + hToS(h)
  else # String name of the rule
    rule
