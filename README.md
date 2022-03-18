Hera
===

> I sing of golden-throned Hera whom Rhea bare. Queen of the Immortals is she, surpassing all in beauty: she is the sister and wife of loud-thundering Zeus,--the glorious one whom all the blessed throughout high Olympos reverence and honour even as Zeus who delights in thunder.
>
> — Homeric Hymn 12 to Hera (trans. Evelyn-White) (Greek epic C7th to 4th B.C.

[![Build](https://github.com/DanielXMoore/hera/actions/workflows/build.yml/badge.svg)](https://github.com/DanielXMoore/hera/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/DanielXMoore/Hera/badge.svg?branch=main)](https://coveralls.io/github/DanielXMoore/Hera?branch=main)

The mother of all parsers.

- [Parsing Expression Grammars:
A Recognition-Based Syntactic Foundation](https://bford.info/pub/lang/peg.pdf)
- [Wikipedia](https://en.wikipedia.org/wiki/Parsing_expression_grammar)

Quickstart
---

```bash
npm install STRd6/hera
```

```javascript
Hera = require("hera")
fs = require("fs")

source = fs.readFileSync("cool-grammar.hera")

rules = Hera.parse(source, {
  filename: path
})

// Generate parser.js source code
parserSource = Hera.generate(rules)
fs.writeFile("cool-parser.js", parserSource)
parser = require("./cool-parser")
// or generate parser object
parser = Hera.generate(rules, true)

parser.parse("text that my cool parser should parse")

```

Overview
---

Hera uses Parsing Expression grammars to create parsers for programatic
languages.

Hera grammars are indentation based. Rules are left most and indented beneath
them are choices that satisfy the rule. Parsing makes heavy use of the built
in regular expression capabilities of JavaScript. Terminals are either literal
strings or regular expressions. Rules are composed of choices or sequences of
other rules and terminals.

The first rule listed in the grammar is the starting point. Each choice for the
rule is checked in order, returning on the first match.

Definitions
---

Rule - A named production. Rules are an ordered choice of rules, sequences,
choices, and terminals.

Choice - One thing or another. Choice components are separated by `/`. Rules
can have choices each on a separate indented line.

Sequence - One thing after another. Sequence components are separated by spaces.

Terminal - A string literal or regular expression. In either case the entire
terminal must be matched at the exact position.

Repetition - `+` and `*` for one or more and zero or more repetitions of an
element. Repetitions return an array when they match.

Predicate - Assert the existince of non-existence of a match without advancing
the position or consuming any input.

Handler - A mapping from the matched choice to a language primitive. Handlers
are attached to rule choices by adding `->` after the choice. The most general
handler is JavaScript code indented four spaces beneath the choice. There is
also shorthand notation for mapping to the `n`th matching regex group or item in
a sequence.

Demos
---

If these demos are not interactive then view this page at
https://danielx.net/hera/docs/README.html

---

URL Parser https://tools.ietf.org/html/rfc3986

>     #! hera url

---

Math example.

>     #! hera math

---

Hera is self generating:

>     #! hera hera

---

Token location example

>     #! hera
>     Grammar
>       Punctuation? A+ Punctuation? ->
>         return [].concat($1, $2, $3)
>
>     A
>       ("a" / "A") ->
>         return {type: "A", loc: $loc, value: $1}
>
>     Punctuation
>       "!" / "." / "?" ->
>         return {type: "Punctuation", loc: $loc, value: $1}
>


---

Regex Groups

>     #! hera
>     Phone
>       /1-(\d{3})-(\d{3})-(\d{4})/ -> [1, 2, 3]

---

>     #! hera
>     Grammar
>       NamedMapping NamedMapping
>
>     NamedMapping
>       Punctuation -> ["P", 0]
>
>     Punctuation
>       "."

Changelog
---

- 0.7.3
  - Added prefix `$` text operator.
  - Added `.` any character matcher.
  - Fixed structural mapping bug where in `["R", 1]` the `1` would take the
  first element of the result rather than the whole result on non-sequence
  handlers.
- 0.7.2
  - VSCode Extension <https://marketplace.visualstudio.com/items?itemName=DanielX.hera>
  - Bare character class 

Experiments
---

Compiling parsers to TypeScript.

Glossary
---

`EOL` - End of line

`EOS` - End of statement

`EOF` - End of file/input

`_` - Whitespace

V2 Ideas
---

Easier way to output a string from a portion of a matching sequence. Maybe add
a caret/select prefix operator.

Optimize option, sequence, and repetition of regexes (combine together) to
reduce calls to invoke.

Splat in mapping and other convience mappings.

Named arguments to handlers.

Reduce backtracking on common subsequence:

    RuleBody
      Indent Sequence EOS (Indent ^Sequence EOS)+ -> ["/", [2, 4...]]
      Indent Sequence EOS -> 2

The above rule should be able to be made efficient (won't need to backtrack
all the way to the beginning) since it has a common subsequence it should
be able to re-use the work already done.

One alternative is to make it one rule with an optional section and add
logic into the handler, but that seems crude.


---

>     #! setup
>     require("./interactive")(register)
