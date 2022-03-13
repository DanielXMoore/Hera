# Convert the rules to source text in hera grammar
module.exports =
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
    f = rule[0]
    h = rule[2]
    switch f
      when "*", "+", "?"
        toS(rule[1], depth+1) + f + hToS(h)
      when "&", "!"
        f + toS(rule[1], depth+1)
      when "L"
        '"' + rule[1] + '"' + hToS(h)
      when "R"
        '/' + rule[1] + '/' + hToS(h)
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
