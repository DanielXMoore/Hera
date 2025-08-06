Hera
===

> I sing of golden-throned Hera whom Rhea bare. Queen of the Immortals is she, surpassing all in beauty: she is the sister and wife of loud-thundering Zeus,--the glorious one whom all the blessed throughout high Olympos reverence and honour even as Zeus who delights in thunder.
>
> — Homeric Hymn 12 to Hera (trans. Evelyn-White) (Greek epic C7th to 4th B.C.)

[![Build](https://github.com/DanielXMoore/hera/actions/workflows/build.yml/badge.svg)](https://github.com/DanielXMoore/hera/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/DanielXMoore/Hera/badge.svg?branch=main)](https://coveralls.io/github/DanielXMoore/Hera?branch=main)

The mother of all parsers.

- [Parsing Expression Grammars:
A Recognition-Based Syntactic Foundation](https://bford.info/pub/lang/peg.pdf)
- [Wikipedia](https://en.wikipedia.org/wiki/Parsing_expression_grammar)

Quickstart
---

```bash
npm install @danielx/hera
```

Example grammar that counts the number of 'a's followed by the number of 'b's
then returns the difference.

```hera
# parser.hera
Program
  A:a B:b ->
    return a.length - b.length
A
  "a"*
B
  "b"*
```

Import the parser into your JS/TS files:

```javascript
// index.mjs
import { parse } from "./parser.hera"

console.log(parse("aaaa"), parse("bbb"), parse("aabb")) // 4 -3 0

parse("c") // throws error
```

Run on the command line:

```bash
node --require '@danielx/hera/register' index.mjs
```

Use the Hera esbuild plugin to bundle:

```javascript
import esbuild from "esbuild"
import heraPlugin from "@danielx/hera/esbuild-plugin"

await esbuild.build({
  entryPoints: ['index.mjs'],
  bundle: true,
  outfile: 'out.js',
  plugins: [heraPlugin()],
})
```

Overview
---

Hera uses Parsing Expression grammars to create parsers for programatic
languages.

Hera grammars are indentation based, with each rule consisting of a name,
indented choices that the name could expand to, and
an optional further-indented code block (handler) for each choice:

```
RuleName
  Choice1
  Choice2 ->
    ...code...
```

Parsing makes heavy use of the built-in regular expression capabilities of
JavaScript. Terminals are either literal strings or regular expressions.
Rules are composed of choices or sequences of other rules and terminals.

The first rule listed in the grammar is the starting point. Each choice for the
rule is checked in order, returning on the first match.

Definitions
---

**Rule**: A named production. The name is written on one unindented line by itself, and the choices (possible expansions) are written on separate lines with common indentation.  For example:

```
RuleName
  Choice1
  Choice2
```

Choices are attempted in order, and the first one to succeed wins.
Note that this property is recursive, so may involve backtracking.
Each choice can be any expression, as defined below, together with an
optional handler.

**Expression**: An expression can be a sequence, choice expression, or repetition of terminals, rule names, or expressions (recursive sequences, choice expressions, or repetitions).  When mixing sequences, choice expressions, and repetitions, use parentheses to separate them.  For example, `Part ( "," Part )*` is a sequence of a rule name and a repetition of a terminal and a rule name, representing one or more `Part`s separated by commas.

**Choice expression** (`/`): A short inline way to specify a choice between two or more subchoices. For example, `This / That / Other` matches `This` or `That` or `Other`, whichever succeeds first. This is equivalent to `AnonymousRule` where

```
AnonymousRule
  This
  That
  Other
```

**Sequence** (` `): One thing after another, separated by spaces. For example, `"(" Expr ")"` matches the character `"("` followed by a match of `Expr` followed by the character `")"`. Sequences with more than one part return an array of the parts.

**Terminal** (`"..."`, `/.../`):
A string literal (surrounded by double quotes)
or a regular expression (normally surrounded by forward slashes).
Simple regular expressions consisting of just `.` or character classes
like `[A-Z][a-z]*` do not need surrounding slashes.
In any case, the entire terminal must be matched at the exact position.
(For regular expressions, this is as if the expressions started with `^`
and it was applied to the rest of the string.)
Terminals return a string when they match.
If the entire choice of a rule is a regular expression, then
the groups of the regular expression are available as `$1`, `$2`, ...
and the matching string is available as `$0`.

**Repetition** (`*`, `+`): `...*` means "zero or more expansions of `...`", and `...+` means one or more repetitions of `Choice`. Repetitions return an array of the matches.

**Lookahead predicates** (`&`, `!`): `&...` and `!...` assert the existence or non-existence, respectively, of a match of `...`, without advancing the position or consuming any input. For example, `&/\s/` is like the look-ahead regular expression `/(?=\s)/`.

**Stringify** (`$`): `$...` matches `...` but returns just the string of the input that matched, instead of the computed return value from the matching process (from handlers and the arrays from sequences and repetitions).

**Handler**: A mapping from the matched choice to a language primitive.
Handlers are attached to rule choices by adding `->` after the choice.
Optionally, `->` can be preceded by a return type annotation of the form `::type`.
The most general handler is JavaScript/TypeScript code indented
beneath the choice, which `return`s the desired value for the matched choice.
This code can also refer to the default value (strings for terminals,
arrays for sequences or repetitions) via `$0`,
or to the `n`th matching item in the topmost sequence via `$n`.
Each item in the topmost sequence can also be named via a `:name` suffix
(for example, `Block:name`), and then the code can also refer to it as `name`.
If the expansion is a single regular expression,
`$n` instead refers to the `n`th group in the regex.
The `$n` notation can also be put on the same line as the `->` as a shorthand
for `return $n` on a separate line; this also works for simple expressions
like JavaScript literals.
JavaScript code can return the special value `$skip` to indicate a failed match.

**Comment** (`#...`): Outside of handlers, lines starting with `#` (after possible indentation) are treated as comments. Inside handlers, use JavaScript `//` or `/*...*/` comments.

Code Blocks
---

You can use three backticks to create a code block that is inserted directly into the compiled file. These are useful for
creating utility functions or adding exports.

````
```
function toInt(n) {
  parseInt(n)
}
```

Number
  [0-9]+ ->
    return toInt($0)
````

Demos
---

If these demos are not interactive then view this page at
<https://danielx.net/hera/docs/README.html>

---

URL Parser <https://tools.ietf.org/html/rfc3986>

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
  - Using compiled parser instead of VM for performance boost.
  - Publishing TypeScript types with package.
  - cjs loader
    ```javascript
    require("@danielx/hera/register")
    const {parse} = require("./parser.hera")
    ```
  - esbuild plugin `require("@danielx/hera/esbuild-plugin")`
  - `hera` CLI tool with experimental TypeScript output support `hera --types < cool-app.hera > parser.ts`
  - Added support for number literals in structural handlers.
  - Changed structural handling to use $1, etc. instead of 1 for positional variables.
  - Added prefix `$` text operator.
  - Added `.` any character matcher.
  - Fixed structural mapping bug where in `["R", $1]` the `$1` would take the
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

`EOS` - End of statement

`EOF` - End of file/input

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


CJS/ESM loaders
---

### `--import/--require @danielx/hera/register`
Loads .hera files that compile to JavaScript.

### `--import/--require @danielx/hera/register/tsc`
Loads .hera files that compile to TypeScript.

Attempts to load the `typescript` npm module to transpile TypeScript to JavaScript.

### Specifying Hera compiler options

#### ESM
Instead of using `--import @danielx/hera/register`, register the `@danielx/hera/register/esm` hooks and pass it the compiler options.

E.g.

```js
// loader.js
const heraOptions = { ... }
register("@danielx/hera/register/esm", pathToFileURL(__filename), { data: heraOptions })
```

```sh
node --import ./loader.js my-script.mjs
```

See `./loader-examples/hera-custom`.

#### CJS
Instead of using `--require @danielx/hera/register`, require and set options on the `@danielx/hera/register/cjs` module.

E.g.
```js
require("@danielx/hera/register/cjs").options.hera = { inlineMap: false }

const { parse } = require("./my-typed-grammar.hera")
```

See `./loader-examples/hera-custom`.

### Setting tsc compiler options

#### ESM
Instead of using `--import @danielx/hera/register/tsc`, register the `register/esm` and `register/tsc/esm` modules yourself and pass the options you want.

E.g.
```js
// custom-loader.js
const { register } = require("node:module")
const { pathToFileURL } = require("node:url")

register("@danielx/hera/register/esm", pathToFileURL(__filename), {
  data: heraOptions
})

register("@danielx/hera/register/tsc/esm", pathToFileURL(__filename), {
  data: tscCompilerOptions,
})
```

```sh
node --import ./custom-loader.js ./my-script.mjs
```

See `./loader-examples/tsc-custom`.

#### CJS
Instead of using `--require @danielx/hera/register/tsc`, require and set options on the `@danielx/hera/register/tsc/cjs` module.

E.g.
```js
const loader = require("@danielx/hera/register/tsc/cjs")
loader.options.hera = heraOptions
loader.options.tsc = tscCompilerOptions

{ parse } = require("./typed-grammar.hera")
```

See `./loader-examples/tsc-custom`
