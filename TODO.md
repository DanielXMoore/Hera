TODO
====

- [ ] Restore Coverage data
  - [ ] nyc coverage path is source/source for ../source/* files referenced in dist/main.js.map
  - [x] Hybrid Coffee + TypeScript coverage
  - [ ] 100% Coverage
  Looks like it is being broken by coffeeScriptPlugin for esbuild.
- [ ] esbuild
  - [ ] Browser build
  - [x] Build cli bin file
  - [x] Node dist
  - [ ] Test parse -> compile -> parse round trip
  - [ ] defer on TypeScript compile output if necessary
  - [x] emit sourcemaps
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
- [ ] Handle object structure including nesting.
- [ ] Test $C and handler
- [ ] Add undefined rule error in vscode extension
- [x] Remove _ as a rule name because golang doesn't like it
- [x] Switch to rules.json

TODO but too vague
---

- [ ] Compile to optimized regexes by aggregating grammar nodes into fewer regexps where possible.
- [ ] Type annotation for grammar rules
- [ ] Generate tokens and parse tree
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

Named variables

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
