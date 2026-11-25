Hera
===

> I sing of golden-throned Hera whom Rhea bare. Queen of the Immortals is she, surpassing all in beauty: she is the sister and wife of loud-thundering Zeus,--the glorious one whom all the blessed throughout high Olympos reverence and honour even as Zeus who delights in thunder.
>
> — Homeric Hymn 12 to Hera (trans. Evelyn-White) (Greek epic C7th to 4th B.C.)

[![Build](https://github.com/DanielXMoore/hera/actions/workflows/build.yml/badge.svg)](https://github.com/DanielXMoore/hera/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/DanielXMoore/hera/branch/main/graph/badge.svg)](https://codecov.io/gh/DanielXMoore/hera)

The mother of all parsers.

- [Parsing Expression Grammars:
A Recognition-Based Syntactic Foundation](https://bford.info/pub/lang/peg.pdf)
- [Wikipedia](https://en.wikipedia.org/wiki/Parsing_expression_grammar)
- [Developer Guide](docs/developer-guide.md)
- [CHANGELOG.md](CHANGELOG.md)

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
node --import '@danielx/hera/register' index.mjs
```

The handler blocks in your grammar can also be written in
[TypeScript](https://www.typescriptlang.org/) or [Civet](https://civet.dev) syntax.
In that case, use the appropriate loader:

```bash
node --import '@danielx/hera/register/tsc' index.mjs
# or
node --import '@danielx/hera/register/civet' index.mjs
```

Use the Hera esbuild plugin to bundle:

```javascript
import esbuild from "esbuild"
import heraPlugin from "@danielx/hera/esbuild"

await esbuild.build({
  entryPoints: ['index.mjs'],
  bundle: true,
  outfile: 'out.js',
  plugins: [heraPlugin()],
})
```

If your handler blocks use TypeScript or Civet syntax,
pass `language: "typescript"` or `language: "civet"` into `heraPlugin(...)`.

Overview
---

Hera uses Parsing Expression grammars to create parsers for programmatic
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

Choice expressions return the (first) expression matched.

**Sequence** (` `): One thing after another, separated by spaces.
For example, `"(" Expr ")"` matches the character `"("` followed by
a match of `Expr` followed by the character `")"`.
Sequences with more than one part return an array of the parts.
For example, `"(" Expr ")"` returns an array of three items:
the string `"("`, the return value of `Expr`, and the string `")"`.
Notably, if an expression is a "sequence" of just one item,
it does not get wrapped in a length-1 array.

**Terminal string** (`"..."`):
A string literal (surrounded by double quotes).
The entire string must be matched at the exact position.
Terminal strings return the matched string when they match.
A terminal string can't end in a lead surrogate (`\uD800`–`\uDBFF`),
since it could match half of a surrogate pair;
use a regular expression like `/\uD83D/` instead,
which matches only an unpaired surrogate.

**Terminal regular expression** (`/.../`):
A regular expression, normally surrounded by forward slashes.
Simple regular expressions consisting of just `.` or character classes
like `[A-Z][a-z]*` do not need surrounding slashes.
The entire regular expression must be matched at the exact position
(as if the regular expression started with `^`
and it was applied to the rest of the string).
Terminal regular expressions return the
[`match`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
array: the matched string at index `[0]`, followed by any matched groups
at indices `[1]`, `[2]`, ...
(strings or `undefined` for unmatched optional groups).
For example, the following rule accesses the regex match array via `$1`
and extracts the full match via `$1[0]`:

```
Name
  /[A-Za-z][A-Za-z0-9]*/ "=" /\d+/ -> $1[0]
```

As a special case, if the entire expression is a single regular expression,
then the return value is the matched string instead of the match array,
and handler variables are taken from the match array:
`$0` is the matched string (the default return value),
and `$1`, `$2`, ... are the captured groups.  For example:

```
Name
  # Returns matched string:
  /([A-Za-z])[A-Za-z0-9]*/
  # Returns matched string:
  /([A-Za-z])[A-Za-z0-9]*/ -> $0
  # Returns matched first letter:
  /([A-Za-z])[A-Za-z0-9]*/ -> $1
```

**Triple-slash regular expression** (`///...///`):
A whitespace-insensitive regular expression, similar to
[Civet heregex syntax](https://civet.dev/reference#regular-expressions).
Whitespace and `//` comments inside the body are ignored, so larger
expressions can be split across lines:

```
Identifier
  ///
    [A-Za-z_]  // first character
    [A-Za-z0-9_]*
  ///
```

Triple-slash regular expressions also support interpolation.  `${expr}` is
dynamic: the generated parser re-evaluates `expr` when the rule runs, rebuilds
the `RegExp` when the resulting source string changes, and reuses the cached
parser until the source changes.

```
Close
  /// ${closingPattern} ///
```

An interpolation runs to the `}` that closes it: braces inside must balance,
and quotes must close, so `"}"` and `'{'` are fine.  A quote or an unbalanced
brace in a regex literal, a template literal or a comment isn't, and the
`${...}` is then matched as literal regex text.  Write such a character as a
string instead, as in `${"'"}`.

Use `${const expr}` for an interpolation whose value should be captured once.
If every interpolated part is `const`, the generated parser computes the
regular expression once and then uses the same parser as a normal regular
expression.  In mixed static/dynamic expressions, complex `const` expressions
are cached once, while identifier-only `const` expressions are emitted directly.

```
Open
  /// ${const openingPattern} /// ->
    closingPattern = $0 === "(" ? "\\)" : "\\]"
    return $0

Close
  # Returns matched string:
  /// ${closingPattern} ///
```

Dynamic interpolation that depends on parser state needs the same care as
handlers that mutate parser state.  If result caching is enabled, that state
must be part of the cache key/state, and rules that mutate it should not be
cached.

**Repetition** (`*`, `+`): `...*` means "zero or more expansions of `...`", and `...+` means one or more repetitions of `Choice`.
Repetitions return an array of the matches.
In particular, the length of the array is exactly the number of matches.

**Optional** (`?`): `...?` means "zero or one expansion of `...`". If `...` matches, `...?` returns that value directly. Otherwise it succeeds without consuming input and returns `undefined`. Unlike `*` and `+`, `?` does not wrap its result in an array.

**Lookahead predicates** (`&`, `!`): `&...` and `!...` assert the existence or non-existence, respectively, of a match of `...`, without advancing the position or consuming any input. For example, `&/\s/` is like the look-ahead regular expression `/(?=\s)/`.
Both `&` and `!` predicates return `true`, so that matching vs. not can be distinguished when marked as optional with `?` (e.g. `(&Pattern)?`).

**Stringify** (`$`): `$...` matches `...` but returns just the string of the input that matched, instead of the computed return value from the matching process (from handlers and the arrays from sequences and repetitions).
For example, `$/\d+/` returns the matched string of digits instead of the match array, which is useful when the expression is more than just a single regular expression.

**Return type**: The return type of a choice (or more precisely, its handler)
can be specified explicitly using `::type` after the choice and before the
handler (if any — otherwise, it returns the default value).
This return type gets emitted when generating TypeScript or Civet output.
You can also write `RuleName ::type` on a rule header to use that type as the
default for every choice in the rule.

**Handler**: A mapping from the matched choice to a language primitive.
Handlers are attached to rule choices by adding `->` after the choice.
The most general handler is JavaScript, TypeScript, or Civet code indented
beneath the choice, which `return`s the desired value for the matched choice.
Alternatively, a single expression can start on the same line as `->`, and it will be implicitly `return`ed.
In either case, the handler code can refer to the default value
(strings for terminal strings, arrays for sequences or repetitions) via `$0`,
which is what the choice returns if you don't provide a handler.
The `n`th matching item in the topmost sequence can be accessed via `$n`;
each item in the topmost sequence can also be named via a `:name` suffix
(for example, `Block:name`), and then the code can also refer to it as `name`.
As a special case, if the expansion is a single regular expression,
`$0` refers to the matched string (instead of the match array) and
`$n` refers to the `n`th group in the regex.
The handler code can return the special value `$skip`
to indicate a failed match.

**Comment** (`#...`):
Outside of handlers, lines starting with `#` (after possible indentation) are treated as comments.
Inside handlers, use the handler language's comments, e.g., `//` or `/*...*/`.

Code Blocks
---

You can use three backticks to create a code block that is inserted directly
into the compiled file, using the same language as handlers.
These are useful for creating utility functions or adding exports.

````
```
function toInt(n) {
  return parseInt(n)
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
>         return [$1, ...$2, $3].filter((token) => token !== undefined)
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
>       /1-(\d{3})-(\d{3})-(\d{4})/ -> [$1, $2, $3]

---

>     #! hera
>     Grammar
>       NamedMapping NamedMapping
>
>     NamedMapping
>       Punctuation -> ["P", $0]
>
>     Punctuation
>       "."

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

To enable direct `import` or `require` of `.hera` files,
use the appropriate loader for your handler language:

### `--import/--require @danielx/hera/register`
Loads .hera files that compile to JavaScript.

### `--import/--require @danielx/hera/register/tsc`
Loads .hera files whose handlers and code blocks are written in TypeScript.

Attempts to load the `typescript` npm module to transpile the grammar's
embedded TypeScript to JavaScript (see `transpileEmbedded` below).

### `--import/--require @danielx/hera/register/civet`
Loads .hera files whose handlers and code blocks are written in Civet.

Attempts to load the `@danielx/civet` npm module to transpile the grammar's
embedded Civet code to JavaScript (see `transpileEmbedded` below).

### Specifying Hera compiler options

See [`loader-examples/hera-custom`](./loader-examples/hera-custom)
for examples of passing in options to the Hera compiler.

Supported Hera compiler options are documented in [Options](#options).

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

#### CJS
Instead of using `--require @danielx/hera/register`, require and set options on the `@danielx/hera/register/cjs` module.

E.g.
```js
require("@danielx/hera/register/cjs").options.hera = { inlineMap: false }

const { parse } = require("./my-typed-grammar.hera")
```

See [`loader-examples/hera-custom/register.js`](./loader-examples/hera-custom/register.js)
for an example of simultaneous registration of both ESM and CJS hooks with options.

### Setting TypeScript or Civet compiler options

See [`loader-examples/tsc-custom`](./loader-examples/tsc-custom)
or [`loader-examples/civet-custom`](./loader-examples/civet-custom)
for examples of passing in options to the TypeScript or Civet compiler.

#### ESM
Instead of using `--import @danielx/hera/register/tsc` or `--import @danielx/hera/register/civet`, register just the `register/tsc/esm` or `register/civet/esm` module, which compiles `.hera` files itself.
Its `data` takes `hera` (Hera compiler options) and `tsc` or `civet` (TypeScript or Civet compiler options).

E.g.
```js
// custom-loader.js
const { register } = require("node:module")
const { pathToFileURL } = require("node:url")

register("@danielx/hera/register/tsc/esm", pathToFileURL(__filename), {
  data: { hera: heraOptions, tsc: tscCompilerOptions },
})

// OR, for Civet
register("@danielx/hera/register/civet/esm", pathToFileURL(__filename), {
  data: { hera: heraOptions, civet: civetCompilerOptions },
})
```

```sh
node --import ./custom-loader.js ./my-script.mjs
```

#### CJS
Instead of using `--require @danielx/hera/register/tsc` or `--require @danielx/hera/register/civet`, require and set options on the `@danielx/hera/register/tsc/cjs` or `@danielx/hera/register/civet/cjs` module.

E.g.
```js
const loader = require("@danielx/hera/register/tsc/cjs")
loader.options.hera = heraOptions
loader.options.tsc = tscCompilerOptions

const { parse } = require("./typed-grammar.hera")
```

```js
const loader = require("@danielx/hera/register/civet/cjs")
loader.options.hera = heraOptions
loader.options.civet = civetCompilerOptions

const { parse } = require("./civet-grammar.hera")
```

See [`loader-examples/tsc-custom/register.js`](./loader-examples/tsc-custom/register.js)
and [`loader-examples/civet-custom/register.js`](./loader-examples/civet-custom/register.js)
for examples of simultaneous registration of both ESM and CJS hooks with options.

esbuild plugin
---

Use `heraPlugin()` to import `.hera` files in esbuild builds.

If handler bodies or code blocks use TypeScript or Civet, set the plugin
language explicitly:

```js
heraPlugin({ language: "typescript" })
heraPlugin({ language: "civet" })
```

The plugin chooses the appropriate esbuild loader automatically,
though you can override it with the `loader` option. With
`language: "civet"`, it passes only the grammar's embedded code to Civet (see
`transpileEmbedded` below).

Editor tooling
---

The VS Code extension and language server support `hera.language` to control
how handler bodies are interpreted.

In VS Code settings:

```json
{
  "hera.language": "civet"
}
```

Or in your workspace `package.json`:

```json
{
  "hera": {
    "language": "civet"
  }
}
```

See [`lsp/README.md`](./lsp/README.md).

API
---

ESM:

```js
import { compile } from "@danielx/hera"
```

CJS:

```js
const { compile } = require("@danielx/hera")
```

### Rule tags

Tags on the lines above a rule describe it to Hera and to other tools:

```hera
# Comments go above the tags
@state
Nested
  EOS Indent:indent ->
    return $0 if indent.level is state.currentIndent.level
    return $skip

@nomemo @mytool.thing
CodeSpanOpen
  /`+/ ->
    state.codeMarker = $0
```

- A tag line holds one or more space-separated tags and may end with a `# comment`. Tag lines may stack, but must sit directly above their rule, with no blank or comment line between.
- Built-in tags are bare names, and Hera rejects a bare name it doesn't know. They tell the memo (see below) about a grammar's state:
  - `@state`: the rule's handler reads the state that the grammar's state key stands for. Every rule that can't reach a `@state` rule ignores the key, so its results are shared across states. Without any `@state` tags, every memoized rule is cached per key.
  - `@nomemo`: never memoize the rule. Tag every rule whose run can leave state changed (a push without its pop, say), since a cache hit skips the handlers, and every rule that reads state the key doesn't capture.
- Other tags need a namespace (`@mytool.thing`). Hera keeps them for tools: `parse(grammar)[Symbol.for("tags")]` maps each tagged rule's name to its tags, without the `@`.

### Memoizing a grammar with state

A parser compiled with `memo: true` keeps each rule's result at each position and reuses it when the rule is tried there again. When handlers keep state that changes how rules match (an indentation stack, say), the grammar tells the memo:

- `$setStateKey(key)`: call it whenever that state changes. Results are cached per key, so the key should capture everything rules read (a number or a string; a non-negative 32-bit integer is cheapest). A rule run that changes the key isn't cached, because a cache hit would skip the change.
- `$clearMemo()`: drop the memoized results, after changing state the key doesn't capture (parser options set by a directive, say).
- `@state` and `@nomemo` tags, as above. A run that changes the key isn't cached, but one that changes state and leaves the key as it was (pushing a flag equal to the one on top, say) is, so the tags are what keep a memoized parse correct.

Both functions exist in every parser and do nothing without a memo, so a grammar's code doesn't depend on how it was compiled.

#### Migrating from `events`

A grammar that cached with `events.enter`/`events.exit`, a `getStateKey()` and a list of uncacheable rules:

1. Compile with `memo: true`, and `trace: true` if `events` also logged rules.
2. Call `$setStateKey(getStateKey())` wherever the state that `getStateKey()` reads changes, instead of computing the key on every rule.
3. Tag the uncacheable rules `@nomemo`.
4. Replace the `events` cache with `parse(input)`. Pass a `trace` with `enter(rule, pos)` and `exit(rule, pos, end, value, cached)` for logging.

### `compile(grammar, options?)`

Compiles a Hera grammar into parser source code.

- Pass in raw grammar source as a String.
- Returns a code string by default.
- Returns `{ code, sourceMap }` when `options.sourceMap` is `true`.

### Options

`compile()` accepts these options:

- `language?: "javascript" | "typescript" | "civet"`: Language used for handler bodies and code blocks. Default: `"javascript"`.
- `types?: boolean`: Generate TypeScript-flavored parser output. Default: `false` when `language` is unspecified or `"javascript"`, and `true` when `language` is `"typescript"`, or `"civet"` without `transpileEmbedded`.
- `module?: boolean`: Emit ESM instead of CJS output. Default: `false`.
- `filename?: string`: Filename used in generated source maps. Default: `"anonymous"`.
- `source?: string`: Original grammar source text. Required when `inlineMap` or `sourceMap` is enabled.
- `inlineMap?: boolean`: Append an inline source map comment to the generated output. Default: `false`.
- `sourceMap?: boolean`: Return `{ code, sourceMap }` instead of a code string. Default: `false`.
- `libPath?: string`: Import path for the Hera runtime library used by generated parsers. Default: `"@danielx/hera/lib"`.
- `memo?: boolean`: Compile in a packrat memo cache (see [Memoizing a grammar with state](#memoizing-a-grammar-with-state)), which pays off for grammars that backtrack heavily. The parser then memoizes by default, and `parse(input, { memo: false })` turns it off. Default: `false`.
- `noMemo?: Iterable<string>`: With `memo`, more rules to leave out of the memo, besides those tagged `@nomemo`, for speed: e.g. rules that a profile shows never reuse a result. Leaving a rule out never changes the parse.
- `trace?: boolean`: Compile in calls to the `trace` parse option's hooks around every rule, for debugging and profiling: `parse(input, { trace: { enter(rule, pos) {}, exit(rule, pos, end, value, cached) {} } })`. `value` is `FAIL` when the rule didn't match. Without it the parser contains no hook calls, and passing `trace` to `parse` throws. Default: `false`.
- `transpileEmbedded?: (source, upstreamSourceMap?) => string | { code, sourceMap? }`: Transpiles only the grammar's embedded code. Hera puts the code blocks, handlers, and heregex interpolations into one module (one named function per handler and per interpolation) and calls `transpileEmbedded` on it once; the parser calls those functions by name. Hera writes the rest of the parser in plain JavaScript (TypeScript with `types`), so a Civet grammar no longer has to be compiled through Civet as a whole. When a source map is requested, Hera passes the module's map to the grammar as `upstreamSourceMap`; return a map composed with it (as Civet's `upstreamSourceMap` option does), and Hera splices its lines into the parser's map. With `types`, handler parameters have the same types as without `transpileEmbedded`.

  ```js
  import { compile as civet } from "@danielx/civet"
  compile(grammar, {
    language: "civet",
    transpileEmbedded: (src) => civet(src, { js: true, sync: true }),
  })
  ```
