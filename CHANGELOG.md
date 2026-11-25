# Changelog

All notable changes to `@danielx/hera` will be documented in this file.

## [Unreleased]

### Breaking
- The `events` parse option is replaced by the `trace` compile option and
  the `trace` parse option. A parser compiled with `trace: true` calls
  `trace.enter(rule, pos)` and `trace.exit(rule, pos, end, value, cached)`
  around every rule; `value` is `FAIL` when the rule didn't match. Hooks can
  no longer change the parse or supply cached results; use the `memo`
  compile option for caching. A parser compiled without `trace` contains no
  hook calls, and passing `events` to any parser throws.

### Added
- The `memo` compile option compiles in a memo cache: rules' recent
  results (for each rule, two per position modulo 64) are kept and reused
  when a rule is tried at the same position again. Such a parser memoizes by default; `parse(input, { memo: false })`
  turns it off. A grammar whose handlers keep state calls `$setStateKey(key)`
  when that state changes, so results are cached per key, and `$clearMemo()`
  after changing state the key doesn't capture; a rule run that changes the
  key isn't cached. The `noMemo` option leaves more rules out of the memo.
  A parser compiled without `memo` contains no memo code. To migrate from
  `events`, see the README.
- Rule tags: a line of tags directly above a rule (`@state`, `@nomemo
  @mytool.thing`). `@nomemo` leaves the rule out of the memo, and `@state`
  marks a rule whose handler reads the state the key stands for: rules that
  can't reach one ignore the key. Other tags need a namespace and are kept
  for tools in `parse(grammar)[Symbol.for("tags")]`.
- The `lazyErrors` parse option: the parse first runs without recording
  what it expected at each failure, and only a failed or incomplete parse
  runs again to build the error message. Hera's sample grammars parse 21-116%
  faster warm with it, but a failing parse runs its handlers twice, so this
  is opt-in. A tracer sees only the first pass, and the retry starts with an
  empty memo and state key.

### Changed
- Rules compile to cursor functions. Each rule becomes `$$r_<Rule>(ctx)`,
  which matches in place, advances `ctx.pos`, and returns the rule's value or
  a `FAIL` sentinel, instead of a tree of combinators that allocates a
  `{ loc, pos, value }` result for every match. Hera's sample grammars parse
  43-128% faster warm, and loading a parser and running its first parse
  takes 0.78-1.02x as long. Generated parsers are 1.4-1.7x larger (1.2-1.3x
  gzipped). Each exported rule keeps its `(ctx, state)` signature and
  result. The runtime keeps the combinators, so parsers compiled by earlier
  versions still work.
- A regex that is a single character class (such as `/[a-z]+/` or
  `/[^"]*/`) or an ASCII identifier pattern matches ASCII text with a lookup
  table instead of the regex engine. Hera's sample grammars parse 17-57%
  faster warm, but building the tables makes loading a parser and running
  its first parse take 1.10-1.47x as long.
- Calling an exported rule directly at a position between the halves of a
  surrogate pair throws. A Unicode regex starting there matched from the
  lead surrogate, before the given position.

## [0.9.10] - 2026-11-24

### Added
- `transpileEmbedded` compile option: only the grammar's embedded code
  (code blocks, handlers, and heregex interpolations) goes to a downstream
  compiler such as Civet, as one module that the parser calls into by name.
  Hera writes the rest of the parser itself, so Civet no longer re-parses the
  generated scaffolding: Civet's own grammar builds in 4.4 s and 0.63 GB
  instead of 19.9 s and 2.06 GB. With `types`, handler parameters keep their
  types, and type errors in a rule's generated code map to the rule (or to
  the alternative whose code it is) (#112).
- Source maps map the parser's functions and calls to the grammar they come
  from. A rule's function maps to the rule, and each alternative's function
  and handler to the alternative's lines, so a coverage report such as c8's
  marks the lines of an alternative that never ran as uncovered and lists a
  function for each rule, alternative and handler. Each call a rule makes
  maps to the alternative it's parsing, so a stack trace through the parser
  reads as the path through the grammar. Handler and code block text has a
  segment at each word, so columns stay exact for tools that don't
  interpolate within a segment (c8, Node.js, esbuild). Maps are about 3x
  larger (#113).
- In typed output's source maps, type errors point at the `::Type` they come
  from: a rule's or alternative's result that doesn't match its type, and an
  unknown name in a type, map to the annotation, and an inline handler's
  value that doesn't match maps to the handler. Before, these errors mapped
  nowhere, or only to the rule with `transpileEmbedded` (#113).
- For these maps, the rules `parse` returns carry where each rule,
  alternative and `::Type` starts (under `Symbol.for("positions")`, and
  `tPos` on handlers). These are internal and may change (#113).

### Changed
- The esbuild plugin with `language: "civet"`, and the
  `@danielx/hera/register/civet` hooks, use `transpileEmbedded`. A Civet
  grammar compiled with `transpileEmbedded` defaults to untyped output; pass
  `types: true` for TypeScript (#112).
- The `@danielx/hera/register/civet/esm` hook compiles `.hera` files itself,
  so it no longer needs the base `register/esm` hook registered before it.
  Its `data` takes `{ hera, civet }` compiler options. The old setup, with
  the base hook registered first (with the Hera options) and Civet options as
  `data`, still works (#112).
- The `@danielx/hera/register/tsc` hooks use `transpileEmbedded` too: Hera
  writes the parser as JavaScript and only the grammar's embedded TypeScript
  goes through `ts.transpileModule`, so a `.hera` file loads 2-12x faster
  (about 3.6x for Hera's own grammar). The `types` and `language`
  Hera options no longer apply to these hooks. Like the Civet hook, the
  `register/tsc/esm` hook compiles `.hera` files itself and takes
  `{ hera, tsc }` compiler options as `data`; the old setup, with the base
  hook registered first and tsc options as `data`, still works (#113).
- A string literal that ends in a lead surrogate (such as `"\uD83D"`) is now
  a compile error. It could match half of a surrogate pair, after which a
  regex advanced the cursor past the end of its match and `validate` could
  throw a `TypeError`. Use a regex like `/\uD83D/`, which matches only an
  unpaired surrogate (#110).

### Deprecated
- The `events` parse option. The next release replaces it with the `trace`
  and `memo` compile options (#120).

### Performance
- Recording a parse failure no longer reallocates the list of expectations
  each time the furthest failure position advances. Hera's sample parsers
  are 6-14% faster warm (#114).

### Fixed
- Source maps from the `@danielx/hera/register/tsc` and `register/civet`
  hooks point back at the right lines and columns of the `.hera` file. The tsc
  hooks left Hera's map on the shifted JavaScript tsc emitted, so stack traces
  and coverage pointed at the wrong lines, and the Civet hooks emitted no map
  at all (#113, supersedes #100).
- In a source map, code that follows a mapping on a later line no longer
  maps to it: Node.js maps a line without segments by the last segment
  before it, so stack frames in Hera's own parser code could point into the
  grammar (#113).
- In a source map, the end of a grammar without a final newline maps to its
  last line, not to a line past the end of the file (#113).
- A triple-slash regex whose interpolations are all `${const ...}` is built
  once, as documented. The rules kept the function that builds it, so it was
  rebuilt from the interpolations' current values on every match (#115).
- `decompile` no longer throws on a handler whose type is present but
  `undefined` (#49).
- `ParseError.name` is marked `override`, so Hera's source compiles with
  TypeScript's `noImplicitOverride` (#48).

## [0.9.9] - 2026-10-13

### Added
- CLI: `hera --version` prints the installed package version (#97).

### Changed
- `dist/main.js` no longer bundles the Civet compiler. The source map
  generator it used is now a small vendored module, shrinking the main bundle
  from ~990 KB to ~77 KB. Generated source maps are unchanged (#102).
- Expanded the regex sample to parse JavaScript regular expression literals,
  including named groups, lookbehind, Unicode escapes, property escapes, and
  inline modifiers. Context-dependent early errors and `v`-flag character set
  syntax remain unsupported (#99).

### Fixed
- Parsers compiled with `types: true` no longer carry `events` from one
  `parse()` call over into later calls. The typed and untyped outputs now
  share the same per-call parser tail (#103).
- Type declarations for `$C` and `$S` now support generated parsers with more
  than 9 choice alternatives or sequence items (#96).
- CLI: read stdin asynchronously to avoid `EAGAIN` errors on non-blocking
  pipes in Node.js 24 (#98).
- Unconsumed-input errors now report the location where leftover input begins;
  error locations also account for CRLF line endings correctly (#101, #104).
- `ParseError.name` now has the literal type `"ParseError"` (#105).
- Benchmarks now skip samples that the comparison release cannot compile
  instead of crashing (#99).

### Docs
- Clarified return values for choices, sequences, regular expressions,
  repetitions, and the stringify operator (#95).

## [0.9.8] - 2026-05-26

### Added
- Grammar: `RuleName ::Type` sets a default return type for every untyped
  choice in that rule.  A `::Type` on an individual choice still overrides
  the rule-level default (#91).
- Grammar: triple-slash regular expressions (`///...///`) support
  whitespace-insensitive regex bodies with `//` comments, `${...}` dynamic
  interpolation, and `${const ...}` interpolation for values that should be
  captured once (#87).

## [0.9.7] - 2026-05-21

### Changed
- `$skip` is typed as `never` in handler signatures, eliminating the
  `Exclude<T, typeof SKIP>` wrappers on `$TR`/`$TS`/`$TV` return types and
  on the rule function's `$$final` annotation.  Returning `$skip` still
  marks the rule as a failed match at runtime, but no longer widens the
  handler's inferred return type — so the cleanup wrappers become
  unnecessary.

## [0.9.6] - 2026-04-30

### Performance
- Generated parsers are smaller thanks to more compact codegen

### Fixed
- Generated TypeScript now excludes the `$skip` sentinel from handler result
  types, matching the runtime behavior where `$skip` turns a rule into a failed
  match rather than a returned value.

### Changed
- Internally, `$skip` is now a unique symbol rather than an object sentinel.

## [0.9.5] - 2026-04-29

### Changed
- `tokenize` is now a compile-time option instead of a runtime parser
  option.  Pass it via `compile(grammar, { tokenize: true })`,
  `generate(grammar, { tokenize: true })`, or `hera --tokenize` to
  produce a dedicated tokenize parser with no handler bodies emitted;
  the regular parsing path no longer carries a per-rule
  `if (ctx.tokenize)` branch.  The bundled tokenize variant of the
  Hera grammar is exposed via `parseTokens` (e.g. for the LSP) (#84).
- `generate` has overloads so the return type narrows to a
  Token-yielding parser when called with `{ tokenize: true }`.

### Added
- Re-export `Token`, `HeraAST`, `Loc`, and related types from the main
  entry point so `import type { Token } from "@danielx/hera"` resolves
  without sub-path tricks.

## [0.9.4] - 2026-04-27

### Fixed
- Type-annotation-only rules caching behavior (no longer emit exit events
  while probing failed alternatives) (#82)

## [0.9.3] - 2026-04-26

### Fixed
- Type-annotation-only rules now preserve the wrapped parser result shape when
  the rule is not a sequence, so `Foo ::Type` behaves like `Foo` instead of
  introducing an array wrapper (#77).

### Changed
- Rules without an explicit `::Type` are no longer emitted with a
  `MaybeResult<any>` return annotation.  TypeScript now infers the
  precise return type from the rule body, so consumers can read the AST
  shape via `ReturnType<typeof Rule>` (#73).
- **Migration note**: grammars with mutual recursion (e.g.
  `Expression → Primary → Expression`) now need a single `::Type`
  annotation somewhere in the cycle to break TypeScript's circular
  inference.  `::any -> $1` works as a minimal pass-through; using a
  more specific type gives consumers tighter inference.  Without the
  annotation, `tsc --types` reports `implicitly has return type 'any'`
  on the cyclic rule(s).
- Grammar authors who want literal-type discriminators (e.g.
  `type: "Block"` rather than `type: string`) can now write
  `type: "Block" as const` in the handler return — the IIFE's inferred
  return type flows out as the rule's return type.

### Performance
- Generated handler IIFEs now omit unused positional arguments, capture `$skip`
  from a module-scope constant, pass named `:foo` parts as direct parameters,
  and only cache `$$value` when retained handler arguments need it.  This
  reduces generated parser size while keeping parse throughput roughly flat
  across sample grammars (#79).

## [0.9.2] - 2026-04-26

### Fixed
- Grammar: `Name ::Type` rules without handlers now allow following `#`
  comment lines (#74)

## [0.9.1] - 2026-04-23

### Fixed
- Consumers importing from `@danielx/hera/lib` no longer stack-overflow
  TypeScript's analyzer (#68).  Two things caused the overflow and both are
  addressed:
    1. Previously we shipped `dist/machine.ts` (the 708-line runtime source
       with recursive generics on `$S`/`$C`/`$EVENT_C`).  TypeScript's
       module resolver prefers `.ts` over `.d.ts`, so every consumer got
       those types checked in-depth.  We now ship `dist/machine.d.ts` only
       (no `.ts`), which is a compact declaration file.
    2. Previously each rule's hoisted parser const was wrapped in
       `$TS`/`$TR`/`$TV` handler helpers whose generic signatures
       compounded with the nested combinator types.  The handler is now
       inlined as an IIFE inside the rule function, so the hoisted const
       is just `$S(...)` / `$C(...)` / etc. — TS materializes each rule's
       parser type once as a simple binding.
  As a consequence every `//@ts-ignore` the compiler used to emit in front
  of a rule declaration has been dropped.

### Added
- Grammar: `Name ::Type` (type annotation without a handler) now parses and
  compiles — the declared type flows into the rule function's return type
  and the sub-parser's result passes through verbatim
- Grammar: a trailing `#` comment on the `->` line is treated as a comment
  rather than swallowed into the inline handler body

### Changed
- Emission: handlers are inlined as an IIFE within the rule function (was:
  separate `$TS`/`$TR`/`$TV` helpers at module scope), with parameter types
  anchored to `typeof $$r.value` so `.reduce`/`.filter` callbacks inside
  handler bodies get proper positional typing from the parser's concrete
  result shape
- Emission: multi-line inline handler bodies (`-> { ... }` spanning lines)
  now shift continuation lines by the IIFE's indent so downstream indent-
  sensitive consumers (e.g. Civet parsing Hera's output) read them as the
  object body rather than separate statements
- Emission: rule function parameters renamed from `(ctx, state)` to
  `($$ctx, $$state)` so user handler bodies referencing module-level free
  variables named `state` or `ctx` (a common pattern in parsers that keep
  mutable parse state at module scope) resolve to the intended binding
  rather than to the rule function's parameter

### Performance
- Parse throughput roughly +1-14% vs 0.9.0 across the sample grammars
  (url +0.7%, regex +8.3%, coffee +10.1%, math +12.0%, hera_v0_8 +14.3%),
  thanks to in-place mutation of the `ParseResult` on rule handlers and
  caching `$$r.loc`/`$$r.value` into locals
- Compile throughput is slower (~10-22%) and generated code size is larger
  (+115-185%) because event hooks and tokenize branches are now inlined
  into each rule function.  Parse is the hot path for consumers.

## [0.9.0] - 2026-04-23

### Changed (breaking)
- `&` lookahead assertions now return `true` instead of `undefined`, so a
  match can be distinguished from a failure when used with `?` (e.g.
  `(&Pattern)?`) (#65)
- `!` negative assertions now return `true` instead of `undefined`, mirroring
  the `&` change for the same reason (#66)

### Fixed
- Stop treating doubly-indented `#` lines as comments inside handler bodies

### Changed
- Replaced structural handler combinators with inline handlers (#63)
- Indent inline handlers by 2 spaces
- Source mapping for structural handlers

### Docs
- Document `?` optional return value
- Document `&` / `!` return values

### Internal
- LSP converted to Civet (#67)
- Publishing to npm via GitHub Actions OIDC trusted publishing (#58, #59)

## [0.8.20] - 2026-04-04

### Changed
- Include indentation in handler source maps (#57)

## [0.8.19] - 2026-04-04

### Added
- Source maps for code blocks (#54)
- Civet language support in Hera code and handlers (#51)
- MIT License (#52)

## [0.8.18] - 2025

### Added
- Re-entrant parsing: fresh state for every parse, enabling re-entry (#46)
- Emit TypeScript types for esbuild plugin (#44)

### Fixed
- Windows build fixes: absolute paths, test compatibility (#47)
- Fix default targets for register scripts (#45)

## [0.8.17] - 2025

### Added
- Register/load hooks for transpiling TypeScript (`register/tsc`) (#40)
- Set package `types` field to `dist/main.d.ts`
- esbuild plugin loader flag support (#39)
- Type annotations in Regex definitions (#34)
- Type checking for grammar-generated parsers (#31)

### Changed
- Upgrade TypeScript to 5.8.2 (#37)

## [0.8.16] - 2025

### Fixed
- Updated register script to avoid Node.js experimental loader deprecation warning (#19)

## [0.8.15] - 2025

### Added
- Export `ParseError` class (#18)
- `--libPath` CLI option

## [0.8.13] - 2025

### Added
- esbuild plugin accepts compile options (#17)

## [0.8.12] - 2025

### Added
- Expose sourcemap data in parser output (#15)
- ESM loader for Node.js 18.19+ (#13)
- `.mjs` file support

## [0.8.10] - 2025

### Added
- Typed Hera rules with type annotations (#10)
- Code blocks in parser (#9)
- Source maps
- Exportable rules
- Context passing support

## [0.8.6] - 2023

### Fixed
- Fixed sourcemaps skipping newlines and drifting inside handlers

## [0.8.5] - 2023

### Added
- Source mapping support (#8)

## [0.8.4] - 2023

### Added
- Track handler source locations
- Better error reporting on syntax errors when using the register loader

## [0.8.3] - 2023

### Added
- Crude EBNF conversion

## [0.8.2] - 2023

### Added
- Enter/exit parse events with data passing
- Error metadata

### Fixed
- Fixed line position inside EOL

## [0.8.0] - 2022

### Added
- Structural mappings to objects and arrays, including multi-line forms
- Object shorthand notation in structural mappings
- Tokenize mode
- Top-level `undefined` handler
- Parse events and caching
- Verbose option

### Fixed
- `$0` in structural handling
- Fixed string value escaping
- Fixed object shorthand notation

## [0.7.4] - 2022

### Added
- Named parameters in handlers
- `return $skip` support
- Empty array structural mappings

## [0.7.3] - 2022

### Added
- `hera` CLI tool with experimental TypeScript output (`hera --types < grammar.hera > parser.ts`)
- esbuild plugin (`@danielx/hera/esbuild`)
- CJS loader (`require("@danielx/hera/register")`)
- Number literals in structural handlers
- Prefix `$` text operator (stringify)
- `.` any-character matcher
- Publishing TypeScript types with package

### Changed
- Switched to compiled parser instead of VM for performance boost
- Structural handlers now use `$1`, `$2`, etc. instead of bare `1`, `2` for positional variables

### Fixed
- Structural mapping bug where `$1` in `["R", $1]` incorrectly took the first element of the result instead of the whole result on non-sequence handlers

## [0.7.2] - 2022

### Added
- VSCode Extension
- Bare character class syntax
