hera = require "../source/main"
test = it

compile = (src) ->
  hera.generate hera.parse(src), true

describe "Hera", ->
  it "should do math example", ->
    grammar = readFile("samples/math.hera")

    rules = hera.parse(grammar)
    parser = hera.generate(rules, true)

    result = parser.parse """
      8 + 3 / (2 + 5)
    """

    assert.equal result, 8 + 3 / 7

  it "should do url example", ->
    grammar = readFile("samples/url.hera")

    rules = hera.parse(grammar)
    parser = hera.generate(rules, true)

    {scheme, fragment, host, path, port, query} = parser.parse """
      http://danielx.net:443/%21?query#fragment
    """

    assert.equal scheme, "http"
    assert.equal host, "danielx.net"
    assert.equal port, "443"
    assert.equal path, "/!"
    assert.equal query, "query"
    assert.equal fragment, "fragment"

  it "should compile to js string", ->
    assert hera.compile readFile("samples/math.hera")

  it "should consume blank lines as part of EOS", ->
    grammar = """
      Grammar
        Rule+ ->
          a = 5

          return a

      Rule
        Name StringLiteral? EOS (Indent Choice)+

    """

    assert hera.parse(grammar)

  it "should handle comments", ->
    grammar = """
      # Comment!
      # Comment


      Grammar # Comment!
        Rule # Another Comment!
      # 2Comment!
      Rule#Comment
        "a"#rad

      # comment
    """

    parser = hera.generate hera.parse(grammar), true
    assert parser.parse("a")

  it "should handle rules that are aliases", ->
    grammar = """
      Grammar
        Alias Alias*

      Alias
        Terminal

      Terminal
        "."
    """

    parser = hera.generate hera.parse(grammar), true
    assert parser.parse(".")

  it "should recursively generate itself", ->
    f = hera.generate(hera.rules)
    parser = hera.generate(hera.rules, true)
    # console.log f.length, f
    # console.log hera.decompile hera.rules
    assert.equal f, parser.generate(hera.rules)

    grammar = """
      Grammar
        Rule+

      Rule
        Name StringLiteral? EOS (Indent Choice)+

    """
    assert.deepEqual(parser.parse(grammar), hera.parse(grammar))

  test "numbered regex groups in mappings", ->
    grammar = """
      Start
        Group1
        Group2
        Group3
        Group4

      Group1
        /(a+)(b+)/ -> [1, 2]

      Group2
        /(c+)(d+)/ ->
          return [$1, $2];

      Group3
        /123((456)789)/ -> [3, 1, 2, 0]

      Group4
        /pp(qq)/ ->
          return $0 + $1
    """

    parser = hera.generate hera.parse(grammar), true

    assert.deepEqual parser.parse("aab"), ["aa", "b"]
    assert.deepEqual parser.parse("cdd"), ["c", "dd"]
    assert.deepEqual parser.parse("123456789"), [undefined, "456789", "456", "123456789"]
    assert.deepEqual parser.parse("ppqq"), "ppqqqq"

  test "regex that may sometimes be empty with +", ->
    grammar = """
      Start
        Re+ ->
          return $0.join('')

      Re
        /a|b?/
    """

    parser = hera.generate hera.parse(grammar), true
    assert.deepEqual parser.parse("ab"), "ab"
    assert.deepEqual parser.parse(""), ""
    assert.deepEqual parser.parse("bb"), "bb"

  test "transitive regex", ->
    grammar = """
      Start
        Group*

      Group
        /(a?)(b+)c*/
    """

    parser = hera.generate hera.parse(grammar), true

    assert.deepEqual parser.parse(""), []
    assert.deepEqual parser.parse("ab"), ["ab"]
    assert.deepEqual parser.parse("ababccbc"), ["ab", "abcc", "bc"]

  it "should parse bare character classes as regexes", ->
    newHera = compile readFile("samples/hera.hera")
    # require('fs').writeFileSync("source/rules.coffee", "module.exports = " + JSON.stringify(newHera.rules, null, 2))

    rules = newHera.parse """
      Rule
        [a-z]+[1-9]*

      Flags
        [dgimsuy]

      Name
        [_a-zA-Z][_a-zA-Z0-9]*

      Quants
        [0-9]{3,4}

      Quant2
        [a]{2}
    """

    assert.deepEqual rules.Rule, ["R", "[a-z]+[1-9]*"]
    assert.deepEqual rules.Flags, ["R", "[dgimsuy]"]
    assert.deepEqual rules.Name, ["R", "[_a-zA-Z][_a-zA-Z0-9]*"]
    assert.deepEqual rules.Quants, ["R", "[0-9]{3,4}"]
    assert.deepEqual rules.Quant2, ["R", "[a]{2}"]

  it "should return error messages", ->
    assert.throws ->
      hera.parse """
        Rule

      """,
      filename: "test.hera"

  it "should parse simple grammars", ->
    rules = hera.parse """
      Rule
        "A"+
        "B"+

    """

    parser = hera.generate(rules, true)

    parser.parse "AAAAAA"
    parser.parse "BBB"

    assert.throws ->
      parser.parse "BBA"

    assert.throws ->
      parser.parse "AAB"

  it "should work with assertions", ->
    rules = hera.parse """
      Rule
        &"B" "C"+
        &"A" "A"+ ->
          return $2
    """

    parser = hera.generate(rules, true)

    assert.equal parser.parse("AAAAAA").length, 6

  it "should have string handlers", ->
    rules = hera.parse """
      Rule
        "A"+ -> "a"
        "B"+ -> "b"
    """

    parser = hera.generate(rules, true)

    assert.equal parser.parse("AAAAAA"), "a"
    assert.equal parser.parse("BBB"), "b"

  describe "starting rules", ->
    it "should be able to parse from any starting rule", ->
      assert hera.parse "[]",
        startRule: "CharacterClassExpression"

    it "should throw an error when a non-existent starting rule is given ", ->
      assert.throws ->
        hera.parse "",
          startRule: "DoesNotExist"
      , /Could not find rule/

  it "should tokenize", ->
    source = """
      Rule
        &"D" /D/ -> "d"
        !"C" A+ -> "a"
        "B"+ -> "b"

      A
        "A"
    """
    rules = hera.parse source

    # console.dir hera.parse(source, {tokenize: true}),
    #   colors: true
    #   depth: null

    parser = hera.generate(rules, true)

    results = parser.parse("AAAAAA", tokenize: true)
    assert.equal results.value[0].loc.length, 6

    results = parser.parse("BBB", tokenize: true)
    assert.equal results.value.length, 3

    results = parser.parse("D", tokenize: true)
    assert.equal results.loc.length, 1

    # tokenize shouldn't blow up regular parsing
    assert.equal parser.parse("BBB"), "b"

  it "should skip infinite zero width loops", ->
    rules = hera.parse """
      Rule
        ""* "a"
    """

    parser = hera.generate(rules, true)
    result = parser.parse("a")
    assert.deepEqual result, [[], "a"]

  it "should throw an error when there is unconsumed input", ->
    rules = hera.parse """
      Rule
        "a"
    """

    parser = hera.generate(rules, true)
    assert.throws ->
      parser.parse("aa")
    , /Unconsumed input/

  it "should throw an error when there are no failed expectations but still input remaining", ->
    rules = hera.parse """
      Rule
        ""
    """

    parser = hera.generate(rules, true)
    assert.throws ->
      parser.parse("bb")
    , /Unconsumed input/

  it "throws an error when parsing non-strings", ->
    rules = hera.parse """
      Rule
        "a"
    """

    parser = hera.generate(rules, true)
    assert.throws ->
      parser.parse(undefined)
    , /Input must be a string/

  it "should throw an error when running out of input", ->
    parser = hera.generate hera.parse("""
      Rule
        "aaaa"
        EOF
      EOF
        !/[\s\S]/
    """), true

    assert.throws ->
      parser.parse "aaa"
    , /Rule "aaaa"/

  it "should throw an error when mapping to a non-array object", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in a non-array object for the mapping value
    rules.Rule[2] = {}

    parser = hera.generate(rules, true)
    assert.throws ->
      parser.parse("a")
    , /non-array object mapping/

  it "should throw an error when mapping to an unknown type", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in an unknown type for the mapping value
    rules.Rule[2] = false

    parser = hera.generate(rules, true)
    assert.throws ->
      parser.parse("a")
    , /Unknown mapping type/

  it "throw an error when encountering an unknown operator", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in an unknown operator
    rules.Rule[0] = "QQ"

    assert.throws ->
      hera.generate(rules, true)
    , /Don't know how to pre-compute "QQ"/

  it "should error when referencing an unknown rule", ->
    assert.throws ->
      hera.generate hera.parse("""
        Rule
          "aaaa"
          EOF
      """), true
    , /No rule with name "EOF"/

  it "should give accurate error message with multiline input", ->
    parser = hera.generate hera.parse("""
      Rule
        Line+
      Line
        "aaaa" EOL
      EOL
        /\r\n|\n/
    """), true

    assert.throws ->
      parser.parse """
        aaaa
        aaaa
        aaaa
        aaa
      """
    , /3:6/
