hera = require "./main"

module.exports =
  # Convert the rules to source text in hera grammar
  decompile: (rules) ->
    Object.keys(rules).map (name) ->
      value = toS rules[name]
      "#{name}\n  #{value}\n"
    .join("\n")

# handler to source
hToS = (h) ->
  return "" unless h?

  " -> " + switch typeof h
    when "number"
      h
    when "string"
      JSON.stringify(h)
    when "object"
      if Array.isArray(h)
        JSON.stringify(h)
      else
        "\n#{h.f.replace(/^|\n/g, "$&    ")}"

# toS and decompile generate a source document from the rules AST
toS = (rule, depth=0) ->
  if Array.isArray(rule)
    [f, v, h] = rule
    switch f
      when "*", "+", "?"
        toS(v, depth+1) + f + hToS(h)
      when "&", "!"
        f + toS(v, depth+1)
      when "L"
        '"' + v + '"' + hToS(h)
      when "R"
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
