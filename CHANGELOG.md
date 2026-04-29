# Changelog

All notable changes to `@danielx/hera` will be documented in this file.

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
