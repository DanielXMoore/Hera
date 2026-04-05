# Changelog

All notable changes to `@danielx/hera` will be documented in this file.

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
