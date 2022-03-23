hera = require "../source/exp/compiled"
compiler = require "../source/exp/compiler"
test = it

execMod = (src) ->
  m = {exports: {}}
  Function("module", "exports", src)(m, m.exports)

  return m.exports

compile = (src) ->
  src = compiler.compile hera.parse(src), false

  # console.log src

  return execMod(src)

describe "Build rules", ->
  it.skip "should update rules file", ->
    newRules = hera.parse readFile("samples/hera.hera")
    require('fs').writeFileSync("source/rules.coffee", "module.exports = " + JSON.stringify(newRules, null, 2))

describe "Hera", ->
  it "should do math example", ->
    grammar = readFile("samples/math.hera")
    parser = compile(grammar)

    result = parser.parse """
      8 + 3 / (2 + 5)
    """

    assert.equal result, 8 + 3 / 7

  it "should do url example", ->
    grammar = readFile("samples/url.hera")
    parser = compile(grammar)

    {scheme, fragment, host, path, port, query} = parser.parse """
      http://danielx.net:443/%21?query#fragment
    """

    assert.equal scheme, "http"
    assert.equal host, "danielx.net"
    assert.equal port, "443"
    assert.equal path, "/!"
    assert.equal query, "query"
    assert.equal fragment, "fragment"

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

    parser = compile(grammar)
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

    parser = compile(grammar)
    assert parser.parse(".")

  it "should recursively generate itself", ->
    heraSrc = readFile('samples/hera.hera')
    {parse} = compile readFile('samples/hera.hera')

    assert.deepEqual hera.parse(heraSrc), parse(heraSrc)

    grammar = """
      Grammar
        Rule+

      Rule
        Name StringLiteral? EOS (Indent Choice)+

    """
    assert.deepEqual(hera.parse(grammar), parse(grammar))

  it "numbered regex groups in mappings", ->
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

    {parse} = compile(grammar)

    assert.deepEqual parse("aab"), ["aa", "b"]
    assert.deepEqual parse("cdd"), ["c", "dd"]
    assert.deepEqual parse("123456789"), [undefined, "456789", "456", "123456789"]
    assert.deepEqual parse("ppqq"), "ppqqqq"

  test "regex that may sometimes be empty with +", ->
    grammar = """
      Start
        Re+ ->
          return $0.join('')

      Re
        /a|b?/
    """

    {parse} = compile(grammar)
    assert.deepEqual parse("ab"), "ab"
    assert.deepEqual parse(""), ""
    assert.deepEqual parse("bb"), "bb"

  test "transitive regex", ->
    grammar = """
      Start
        Group*

      Group
        /(a?)(b+)c*/
    """

    {parse} = compile(grammar)

    assert.deepEqual parse(""), []
    assert.deepEqual parse("ab"), ["ab"]
    assert.deepEqual parse("ababccbc"), ["ab", "abcc", "bc"]

  it "should parse bare character classes as regexes", ->
    newHera = compile readFile("samples/hera.hera")

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
    {parse} = compile """
      Rule
        "A"+
        "B"+

    """

    parse "AAAAAA"
    parse "BBB"

    assert.throws ->
      parse "BBA"

    assert.throws ->
      parse "AAB"

  describe "-> Structural Result", ->
    it "should map regexp groups into the structure", ->
      {parse} = compile """
        Rule
          /(a)(b)(c)/ -> [2, 3, 1]
      """

      assert.deepEqual ["b", "c", "a"], parse "abc"

    it "should map sequence items into the structure", ->
      {parse} = compile """
        Rule
          "A" "B" "C" -> [2, 3, 1]
      """

      assert.deepEqual ["B", "C", "A"], parse "ABC"

    it "should map the entire result as $1", ->
      {parse} = compile """
        Rule
          Sub* -> ["T", 1]

        Sub
          "A" "B"
      """

      assert.deepEqual ["T", []], parse ""
      assert.deepEqual ["T", [["A", "B"]]], parse "AB"
      assert.deepEqual ["T", [["A", "B"], ["A", "B"]]], parse "ABAB"

    it "should work with nested structures", ->
      {parse} = compile """
        Rule
          "A" "B" "C" -> [2, [3, [3, 1]], 1]
      """

      assert.deepEqual ["B", ["C", ["C", "A"]], "A"], parse "ABC"

  describe "$ Prefix Operator: result text", ->
    it "should return the whole text of the match", ->
      {parse} = compile """
        Rule
          $("AAA" "B" "C")
      """

      assert.equal "AAABC", parse "AAABC"

    it "should keep pass through fail states", ->
      {parse} = compile """
        Rule
          $A / $B
        A
          [aA]+
        B
          [bB]+
      """

      assert.equal "aaAaa", parse "aaAaa"
      assert.equal "bBbb", parse "bBbb"
      assert.throws ->
        parse "c"
      , /Expected:\s*A/

    it "should correctly span repetitions", ->
      {parse} = compile """
        Rule
          $("A" "B" "C")*
      """

      assert.equal "ABCABC", parse "ABCABC"
      assert.equal "", parse ""

    it "should handle nested rules", ->
      {parse} = compile """
        RegExpLiteral
          "/" !_ $RegExpCharacter* "/" -> ["R", 3]
          CharacterClassExpression

        CharacterClassExpression
          $CharacterClass+ -> ["R", 1]

        RegExpCharacter
          [^\\/\\\\]+
          EscapeSequence

        CharacterClass
          "[" CharacterClassCharacter* "]" Quantifier?

        CharacterClassCharacter
          [^\\]\\\\]+
          EscapeSequence

        Quantifier
          /[?+*]|\\{\\d+(,\\d+)?\\}/

        EscapeSequence
          Backslash [^] ->
            return '\\\\' + $2

        Backslash
          "\\\\"

        _
          [ \\t]+
      """

      assert.deepEqual ["R", "[abc][bc]"], parse "[abc][bc]"
      assert.deepEqual ["R", "[^]a\\[\\^b]"], parse "/[^]a\\[\\^b]/"

  it "should work with assertions", ->
    {parse} = compile """
      Rule
        &"B" "C"+
        &"A" "A"+ ->
          return $2
    """

    assert.equal parse("AAAAAA").length, 6

  it "should have string handlers", ->
    {parse} = compile """
      Rule
        "A"+ -> "a"
        "B"+ -> "b"
    """

    assert.equal parse("AAAAAA"), "a"
    assert.equal parse("BBB"), "b"

  describe "starting rules", ->
    it "should be able to parse from any starting rule", ->
      assert hera.parse "[]",
        startRule: "CharacterClassExpression"

    it "should throw an error when a non-existent starting rule is given ", ->
      assert.throws ->
        hera.parse "",
          startRule: "DoesNotExist"
      , /Could not find rule/

  # TODO: rethink tokenize?
  it.skip "should tokenize", ->
    {parse} = compile """
      Rule
        &"D" /D/ -> "d"
        !"C" A+ -> "a"
        "B"+ -> "b"

      A
        "A"
    """

    results = parse("AAAAAA", tokenize: true)
    assert.equal results.value[0].loc.length, 6

    results = parse("BBB", tokenize: true)
    assert.equal results.value.length, 3

    results = parse("D", tokenize: true)
    assert.equal results.loc.length, 1

    # tokenize shouldn't blow up regular parsing
    assert.equal parse("BBB"), "b"

  it "should skip infinite zero width loops", ->
    {parse} = compile """
      Rule
        ""* "a"
    """

    result = parse("a")
    assert.deepEqual result, [[], "a"]

  it "should throw an error when there is unconsumed input", ->
    {parse} = compile """
      Rule
        "a"
    """

    assert.throws ->
      parse("aa")
    , /Unconsumed input/

  it "should throw an error when there are no failed expectations but still input remaining", ->
    {parse} = compile """
      Rule
        ""
    """

    assert.throws ->
      parse("bb")
    , /Unconsumed input/

  it "throws an error when parsing non-strings", ->
    {parse} = compile """
      Rule
        "a"
    """

    assert.throws ->
      parse(undefined)
    , /Input must be a string/

  it "should throw an error when running out of input", ->
    {parse} = compile """
      Rule
        "aaaa"
        EOF
      EOF
        !/[\s\S]/
    """

    assert.throws ->
      parse "aaa"
    , /Rule "aaaa"/

  it "should throw an error when mapping to an unknown mapping object", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in a non-array object for the mapping value
    rules.Rule[2] = {}

    assert.throws ->
      compiler.compile(rules)
    , /unknown object mapping/

  it "should throw an error when mapping to an unknown type", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in an unknown type for the mapping value
    rules.Rule[2] = false

    assert.throws ->
      compiler.compile(rules)
    , /Unknown mapping type/

  it "throw an error when encountering an unknown operator", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in an unknown operator
    rules.Rule[0] = "QQ"

    assert.throws ->
      compiler.compile(rules)
    , /QQ/

  it "should error when referencing an unknown rule", ->
    assert.throws ->
      # TODO: throw during compile or even at end of parse?
      {parse} = compile """
        Rule
          "aaaa"
          EOF
      """

      parse "b"
    , /EOF/

  it "should give accurate error message with multiline input", ->
    {parse} = compile """
      Rule
        Line+
      Line
        "aaaa" EOL
      EOL
        /\r\n|\n/
    """

    assert.throws ->
      parse """
        aaaa
        aaaa
        aaaa
        aaa
      """
    , /3:6/
