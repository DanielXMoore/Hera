TODO
====

- [x] Split out decompile to util
- [x] Decompile regexes to character class expressions when possible.
- [ ] Languages
  - [x] Compile to TypeScript
  - [x] Compile to JavaScript
  - [ ] Compile to Go
- [x] Display regexp properly in $EXPECT
- [x] Handle nested array structures
- [ ] Change structural handlers to use $1, $2 rather than 1, 2, etc. so that number literals can be part of the result.
- [ ] Handle object structure including nesting.
- [ ] Test $C and handler
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
