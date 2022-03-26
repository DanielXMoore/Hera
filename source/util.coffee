hera = require "../"

module.exports =
  # Convert the rules to source text in hera grammar
  decompile: (rules) ->
    Object.keys(rules).map (name) ->
      value = toS rules[name]
      "#{name}\n  #{value}\n"
    .join("\n")

structuralToSource = (mapping) ->
  switch typeof mapping
    when "number"
      mapping
    when "string"
      JSON.stringify(mapping)
    when "object"
      if Array.isArray(mapping)
        "[" + mapping.map (m) ->
          structuralToSource(m)
        .join(", ") + "]"
      else if mapping.v?
        "$#{mapping.v}"
      else if mapping.o?
        throw new Error "TODO"

# handler to source
hToS = (h) ->
  return "" unless h?

  " -> " + if h.f? # functional handler
    "\n#{h.f.replace(/^|\n/g, "$&    ")}"
  else # structural handler
    structuralToSource(h)

# toS and decompile generate a source document from the rules AST
toS = (rule, depth=0) ->
  if Array.isArray(rule)
    [f, v, h] = rule
    switch f
      when "*", "+", "?"
        toS(v, depth+1) + f + hToS(h)
      when "$", "&", "!"
        f + toS(v, depth+1) + hToS(h)
      when "L"
        '"' + v + '"' + hToS(h)
      when "R"
        if v is "."
          return v + hToS(h)

        try
          hera.parse v,
            startRule: "CharacterClassExpression"
          v + hToS(h)
        catch
          '/' + v + '/' + hToS(h)

      when "S"
        terms = v.map (i) ->
          toS i, depth+1

        if depth < 1
          terms.join(" ") + hToS(h)
        else
          "( " + terms.join(" ") + " )"

      when "/"
        terms = v.map (i) ->
          toS i, depth and depth+1

        if depth is 0 and !h
          terms.join("\n  ")
        else
          "( " + terms.join(" / ") + " )" + hToS(h)
  else # String name of the rule
    rule
