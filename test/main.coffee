assert = require "assert"

{generate} = hera = require "../source/main"
test = it

describe "Build rules", ->
  it.skip "should update rules file", ->
    newRules = hera.parse readFile("samples/hera.hera")
    require('fs').writeFileSync("source/rules.json", JSON.stringify(newRules, null, 2))

describe "Hera", ->
  it "should do math example", ->
    grammar = readFile("samples/math.hera")
    parser = generate(grammar)

    result = parser.parse """
      8 + 3 / (2 + 5)
    """

    assert.equal result, 8 + 3 / 7

  it "should do url example", ->
    grammar = readFile("samples/url.hera")
    parser = generate(grammar)

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

    parser = generate(grammar)
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

    parser = generate(grammar)
    assert parser.parse(".")

  it "should recursively generate itself", ->
    heraSrc = readFile('samples/hera.hera')
    {parse} = generate heraSrc

    assert.deepEqual hera.parse(heraSrc), parse(heraSrc)

    grammar = """
      Grammar
        Rule+

      Rule
        Name StringLiteral? EOS (Indent Choice)+

    """
    assert.deepEqual(hera.parse(grammar), parse(grammar))

  it "should compile to ts", ->
    heraSrc = readFile('samples/hera.hera')
    tsSrc = hera.compile heraSrc, types: true

    assert tsSrc

  it "should annotate simple regexp types when compiling", ->
    heraSrc = """
      Rule
        /abc/
    """
    tsSrc = hera.compile hera.parse(heraSrc), types: true

    assert tsSrc.includes('Parser<"abc">')

  it "numbered regex groups in mappings", ->
    grammar = """
      Start
        Group1
        Group2
        Group3
        Group4

      Group1
        /(a+)(b+)/ -> [$1, $2]

      Group2
        /(c+)(d+)/ ->
          return [$1, $2];

      Group3
        /123((456)789)/ -> [$3, $1, $2, $0]

      Group4
        /pp(qq)/ ->
          return $0 + $1
    """

    {parse} = generate(grammar)

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

    {parse} = generate(grammar)
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

    {parse} = generate(grammar)

    assert.deepEqual parse(""), []
    assert.deepEqual parse("ab"), ["ab"]
    assert.deepEqual parse("ababccbc"), ["ab", "abcc", "bc"]

  it "should parse bare character classes as regexes", ->
    newHera = generate readFile("samples/hera.hera")

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
    {parse} = generate """
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
    it "should map to literals", ->
      {parse} = generate """
        Rule
          I J K N F T

        I
          "" -> 7

        J
          "" -> -3.1

        K
          "" -> 2.7

        N
          "" -> null

        F
          "" -> false

        T
          "" -> true
      """

      assert.deepEqual parse(""), [7, -3.1, 2.7, null, false, true]

    it "should allow for bare undefined", ->
      {parse} = generate """
        Rule
          "" -> undefined
      """

      assert.deepEqual parse(""), undefined

    it "should map regexp groups into the structure", ->
      {parse} = generate """
        Rule
          /(a)(b)(c)/ -> [$2, $3, $1]
      """

      assert.deepEqual ["b", "c", "a"], parse "abc"

    it "should map sequence items into the structure", ->
      {parse} = generate """
        Rule
          "A" "B" "C" -> [$2, $3, $1]
      """

      assert.deepEqual ["B", "C", "A"], parse "ABC"

    it "should map the entire result as $1", ->
      {parse} = generate """
        Rule
          Sub* -> ["T", $1]

        Sub
          "A" "B"
      """

      assert.deepEqual ["T", []], parse ""
      assert.deepEqual ["T", [["A", "B"]]], parse "AB"
      assert.deepEqual ["T", [["A", "B"], ["A", "B"]]], parse "ABAB"

    it "should work with nested structures", ->
      {parse} = generate """
        Rule
          "A" "B" "C" -> [$2, [$3, [$3, $1]], $1]
      """

      assert.deepEqual ["B", ["C", ["C", "A"]], "A"], parse "ABC"

    it "should work with basic types", ->
      {parse} = generate """
        Rule
          "" -> [true, false, null, undefined, 0xff, 0xFF, 7, "A", []]
      """

      assert.deepEqual [true, false, null, undefined, 0xff, 0xFF, 7, "A", []], parse ""

    it "should handle multi-line arrays", ->
      {parse} = generate """
        Rule
          "" -> [
            [
              1,
              2
            ],
            3
          ]
      """

      assert.deepEqual [[1, 2], 3], parse ""

    it "should map object structures", ->
      {parse} = generate """
        Rule
          "" -> [{}, {a: true}, {b: [0], c: 1}]
      """

      assert.deepEqual [{}, {a: true}, {b: [0], c: 1}], parse ""

    it "should map nested structures", ->
      {parse} = generate """
        Rule
          "a" -> [{b: [{x: 2, y: [{z: -1.3}]}, [{}]], c: 1}]
          "b" -> {b: [{x: 2, y: [{z: -1.3}]}, [{}]], c: 1}
      """

      assert.deepEqual parse("a"), [{b: [{x: 2, y: [{z: -1.3}]}, [{}]], c: 1}]
      assert.deepEqual parse("b"), {b: [{x: 2, y: [{z: -1.3}]}, [{}]], c: 1}

    it "should map object shorthand", ->
      {parse} = generate """
        Rule
          A:a B:b -> {a, b}
        A
          "a" -> 1
        B
          "b" -> 2
      """

      assert.deepEqual parse("ab"), {"a": 1, "b": 2}

    it "should work with multi-line objects", ->
      {parse} = generate """
        Rule
          "a" -> {
            b: [{x: 2, y: [{z: -1.3}]}, [{}]],
            c: 1
          }
      """

      assert.deepEqual {b: [{x: 2, y: [{z: -1.3}]}, [{}]], c: 1}, parse "a"

  describe "$ Prefix Operator: result text", ->
    it "should return the whole text of the match", ->
      {parse} = generate """
        Rule
          $("AAA" "B" "C")
      """

      assert.equal "AAABC", parse "AAABC"

    it "should keep pass through fail states", ->
      {parse} = generate """
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
      {parse} = generate """
        Rule
          $("A" "B" "C")*
      """

      assert.equal "ABCABC", parse "ABCABC"
      assert.equal "", parse ""

    it "should handle nested rules", ->
      {parse} = generate """
        RegExpLiteral
          "/" !_ $RegExpCharacter* "/" -> ["R", $3]
          CharacterClassExpression

        CharacterClassExpression
          $CharacterClass+ -> ["R", $1]

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
          Backslash . ->
            return '\\\\' + $2

        Backslash
          "\\\\"

        _
          [ \\t]+
      """

      assert.deepEqual ["R", "[abc][bc]"], parse "[abc][bc]"
      assert.deepEqual ["R", "[^]a\\[\\^b]"], parse "/[^]a\\[\\^b]/"

  it "should work with assertions", ->
    {parse} = generate """
      Rule
        &"B" "C"+
        &"A" "A"+ ->
          return $2
    """

    assert.equal parse("AAAAAA").length, 6

  it "should have string handlers", ->
    {parse} = generate """
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

  it "should tokenize", ->
    {parse} = generate """
      Rule
        &"D" /D/ -> "d"
        !"C" A+ -> "a"
        "B"+ -> "b"

      A
        "A"
    """

    result = parse("AAAAAA", tokenize: true)
    assert.equal result.children[1].length, 6

    result = parse("BBB", tokenize: true)
    assert.equal result.children.length, 3

    result = parse("D", tokenize: true)
    # TODO: Regex tokenize?
    # assert.deepEqual result.children[1], 1

    # tokenize shouldn't blow up regular parsing
    assert.equal parse("BBB"), "b"

  it "should skip infinite zero width loops", ->
    {parse} = generate """
      Rule
        ""* "a"
    """

    result = parse("a")
    assert.deepEqual result, [[], "a"]

  it "should throw an error when there is unconsumed input", ->
    {parse} = generate """
      Rule
        "a"
    """

    assert.throws ->
      parse("aa")
    , /Unconsumed input/

  it "should throw an error when there are no failed expectations but still input remaining", ->
    {parse} = generate """
      Rule
        ""
    """

    assert.throws ->
      parse("bb")
    , /Unconsumed input/

  it "throws an error when parsing non-strings", ->
    {parse} = generate """
      Rule
        "a"
    """

    assert.throws ->
      parse(undefined)
    , /Input must be a string/

  it "should throw an error when running out of input", ->
    {parse} = generate """
      Rule
        "aaaa"
        EOF
      EOF
        !/[\s\S]/
    """

    assert.throws ->
      parse "aaa"
    , /Rule "aaaa"/

  it "should compile object mappings", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # TODO: hacked in object mapping
    rules.Rule[2] = {
      o: {
        a: [{o: true}, "b", {v: 0}]
      }
    }

    assert hera.compile rules

  it "should throw an error when mapping to an unknown mapping object", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in a non-array object for the mapping value
    rules.Rule[2] = {}

    assert.throws ->
      hera.compile(rules)
    , /unknown object mapping/

  it "throw an error when encountering an unknown operator", ->
    rules = hera.parse """
      Rule
        "a"
    """

    # Hack in an unknown operator
    rules.Rule[0] = "QQ"

    assert.throws ->
      hera.compile(rules)
    , /QQ/

  it "should error when referencing an unknown rule", ->
    assert.throws ->
      # TODO: throw during compile or even at end of parse?
      {parse} = generate """
        Rule
          "aaaa"
          EOF
      """

      parse "b"
    , /EOF/

  it "should give accurate error message with multiline input", ->
    {parse} = generate """
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

  it "should skip rules programmatically", ->
    {parse} = generate """
      Rule
        Skipped
        V

      Skipped
        "" ->
          return $skip

      V
        "" -> true
    """

    assert parse ""

  describe "named parameters", ->
    it "should provide named parameters for a sequence", ->
      {parse} = generate """
        Rule
          A:a B:b ->
            return [a, b]

        A
          "a"

        B
          "b"
      """

      assert.deepEqual parse("ab"), ["a", "b"]

    it "should provide named parameters for a single string", ->
      {parse} = generate """
        A
          "a":a ->
            return a
      """

      assert.equal parse("a"), "a"

    it "should provide named parameters for a single regexp", ->
      {parse} = generate """
        A
          /a+/:a ->
            return a
      """

      assert.equal parse("aaa"), "aaa"

    it "should provide named parameters for an alias", ->
      {parse} = generate """
        Rule
          A:a ->
            return a

        A
          /a+/:a ->
            return a
      """

      assert.equal parse("aa"), "aa"

    it "should allow named parameters in structural mappings", ->
      {parse} = generate """
        A
          "a":a -> [a, a]
      """

      assert.deepEqual parse("a"), ["a", "a"]

      {parse} = generate """
        Rule
          A:a B:b -> [b, a]

        A
          [a]+

        B
          [b]+
      """

      assert.deepEqual parse("abb"), ["bb", "a"]
