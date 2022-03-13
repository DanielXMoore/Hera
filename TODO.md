TODO
====

- [x] Split out decompile to util
- [ ] Decompile regexes to character class expressions when possible.

Features
--------

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

Grammar
  Preamble:pre Files+:files Suffix:s

Phone
  "1"
