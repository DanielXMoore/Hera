import assert from "assert"
import { decompile, grammarToEBNF } from "../source/util.civet"
import {parse} from "../source/main.civet"
`import rules from "../source/rules.json" assert { type: "json" }`

describe "util", ->
  it "should parse decompiled rules", ->
    grammar = decompile(rules)

    # console.log grammar
    parsedRules = parse grammar
    # console.log parsedRules, rules

    Object.keys(parsedRules).forEach (key) ->
      assert.deepEqual(parsedRules[key], rules[key], "#{key} rule doesn't match")

    # strip trailing whitespace before compare
    grammar = grammar.replace(/[ ]+\n/g, '\n')
    assert.equal grammar, readFile("source/hera.hera")

  it "should convert to ebnf", ->
    grammarToEBNF(rules)

  it "should decompile nested choices", ->
    rules = parse """
      Rule
        ("A" / "C") ("B" / "D")
        "Z" -> "z"
        "N" -> 0
    """

    decompiled = decompile rules
    assert.deepEqual parse(decompiled), rules

  it "should decompile literal undefined", ->
    grammar = """
      Rule
        "X" -> undefined

    """
    rules = parse grammar
    assert.equal decompile(rules), grammar

  it "decompiles to an object format", ->
    grammar = """
      Rule
        "X" -> {a: 1, b: null}

    """
    rules = parse grammar

    assert.equal decompile(rules), grammar

  it "should throw an error when decompiling an unknown format", ->
    rules = parse """
      Rule
        "X" -> 0
    """

    rules.Rule[2] = {
      yo: "wat"
    }

    assert.throws ->
      decompile rules
    , /Unknown/

  it "should throw an error when decompiling an unknown object", ->
    rules = parse """
      Rule
        "X" -> 0
    """

    rules.Rule[2] = ->

    assert.throws ->
      decompile rules
    , /Unknown/

  it "should throw an error when decompiling an unknown rule type", ->
    rules = parse """
      Rule
        "X" -> 0
    """

    rules.Rule[0] = "XXX"

    assert.throws ->
      decompile rules
    , /Unknown/
