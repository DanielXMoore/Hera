TODO
====

- [ ] Registering CoffeeCoverage is slow in the current config
- [ ] Restore `tokenize` parser option to return token tree with location data
- [ ] Structural mapping
  - [ ] top level undefined `-> undefined`
  - [x] Multi-line objects and arrays
  - [x] to object `-> {}`
  - [x] Negative numbers, floats, null, and false in bare structural mappings
- [ ] Add `import` so grammars can import rules from sub-grammars.
- [ ] Add undefined rule error in vscode extension
- [x] Named parameters
- [x] Programatically skip rules
- [x] Empty mapping `-> []`
- [x] Handle object structure including nesting.
- [x] Restore Coverage data
  - [x] Hybrid Coffee + TypeScript coverage using babel
- [ ] Testing
  - [x] 100% Coverage
  - [x] Run benchmark separate from tests with non-instrumented code
  - [ ] Reconcile source-map-support and CoffeeScript both patching prepareStackTrace
- [ ] esbuild
  - [ ] Browser build
    - [ ] need to merge in fs.readFileSync machine.ts and machine.js contents
  - [x] Build cli bin file
  - [x] Node dist
  - [x] Test parse -> compile -> parse round trip
  - [x] emit sourcemaps
  - [x] emit types
- [x] Hera esbuild-plugin
- [x] Split out decompile to util
- [x] Decompile regexes to character class expressions when possible.
- [x] Languages
  - [x] Compile to TypeScript
  - [x] Compile to JavaScript
  - [ ] ~~Compile to Go~~
- [x] Display regexp properly in $EXPECT
- [x] Handle nested array structures
- [x] Change structural handlers to use $1, $2 rather than 1, 2, etc. so that number literals can be part of the result.
  - [x] Update VSCode Extension
    - [x] Fix $ token at start of line not coloring properly
    - [x] Update to latest Hera
- [x] Remove _ as a rule name because golang doesn't like it
- [x] Switch to rules.json

TODO but too vague
---

- [ ] Compile to optimized regexes by aggregating grammar nodes into fewer regexps where possible.
- [ ] Type annotation for grammar rules
- [ ] Aggregate errors and warnings

Features
--------

`.` `EOF` : Any Character and EOF regexes. EOF could also be a special rule
implemented as `pos == input.length`

```javascript
any = /[^]/
EOF = /(?![^])/y // must be sticky mode
```

---

Quantifiers

`{n}`, `{n,}`, `{n,m}`

Implement quantifiers and unify with `?,+,*` implementations.

---

CLI

Create a hera cli to build parsers.

---

Bare Regexes - Added!

Allow for "bare" character classes to make regexes.

```hera
Rule
  [a-z]+[1-9]*

Flags
  [dgimsuy]

Quants
  [0-9]{3,4}
```

---

Named variables - Added!

```hera
Grammar
  Preamble:pre Files+:files Suffix:s

Phone
  # Also allow named groups in regexes
  /1-?(<area>[0-9]{3})-?(<number>[0-9]{3}-?[0-9]{4})/ ->
    return {
      area,
      numeber: number.replace(/[^0-9]/, "")
    }
```

---

`i` insensitive flag that can be added to RegExps, strings, and character classes

```hera
Name
  [_a-z0-9]+i

Id
  /cool|rad|dad/i

InsensitiveString
  "a fun game"i
```
