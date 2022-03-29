{decompile} = require "../source/util"
hera = require "../source/main"
rules = require "../source/rules"

describe "util", ->
  it "should parse decompiled rules", ->
    grammar = decompile(rules)

    # console.log grammar
    parsedRules = hera.parse grammar
    # console.log parsedRules, rules

    Object.keys(parsedRules).forEach (key) ->
      assert.deepEqual(parsedRules[key], rules[key], "#{key} rule doesn't match")

    # strip trailing whitespace before compare
    grammar = grammar.replace(/[ ]+\n/g, '\n')
    assert.equal grammar, readFile("samples/hera.hera")

  it "should decompile nested choices", ->
    rules = hera.parse """
      Rule
        ("A" / "C") ("B" / "D")
        "Z" -> "z"
        "N" -> 0
    """

    decompiled = decompile rules
    assert.deepEqual hera.parse(decompiled), rules

  it "currently throws an error when decompiling to an object format", ->
    rules = hera.parse """
      Rule
        "X" -> 0
    """

    rules.Rule[2] = {
      o: "TODO"
    }

    console.log rules

    assert.throws ->
      decompile rules
    , /TODO/

  it "should throw an error when decompiling an unknown format", ->
    rules = hera.parse """
      Rule
        "X" -> 0
    """

    rules.Rule[2] = {
      yo: "wat"
    }

    console.log rules

    assert.throws ->
      decompile rules
    , /Unknown/
