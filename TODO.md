TODO
====

- [x] Split out decompile to util
- [x] Decompile regexes to character class expressions when possible.
- [ ] Compile to typescript?
- [ ] Compile to fancy regexes?

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
