# Hera Developer Guide

This guide covers repository-specific details that are easy to miss when working on Hera itself.

## What Hera Is

Hera is a PEG parser generator. You write `.hera` files containing grammar rules with handler bodies in JavaScript, TypeScript, or Civet, and Hera compiles them into standalone JavaScript parser modules.

The repo is self-hosted: the Hera parser in `source/hera.hera` is parsed and compiled by Hera itself.

## The Bootstrap Problem

The build and test suite use `@danielx/hera-previous` (an npm alias pointing at the currently published version of this package) to process `.hera` source files, not the in-development version. This is because the in-development version does not exist as a built artifact until after `yarn build`.

Consequences:

- `build/esbuild.civet` imports `heraPlugin` from `@danielx/hera-previous/esbuild`
- `package.json#mocha.require` uses `@danielx/hera-previous/register/tsc` to load `.civet` and `.hera` test files
- When you add a new compiler feature, tests that exercise it through `.hera` files can only run after `yarn build`

`yarn build` runs `bash build/compile`, which deletes `dist/`, runs `node build/esbuild.civet`, then post-processes `.d.ts` files by renaming `.civet.d.ts` to `.d.ts`.

## Source Layout

```text
source/
  hera.hera          # The Hera grammar (self-hosted)
  rules.json         # Parsed AST of hera.hera
  parser.js          # Generated parser
  machine.ts         # PEG runtime included in generated parsers
  compiler.civet     # Compiles HeraRules -> JS/TS string
  main.civet         # Public API: wraps parser + compiler
  hera-types.civet   # HeraAST / HeraRules types
  esm.civet          # Base ESM load hook
  register.civet     # Registers both ESM and CJS hooks for JS output
  register/
    cjs.civet        # CJS hook for JS output
    tsc/             # Hera -> TS -> tsc transpileModule -> JS
    civet/           # Hera -> Civet -> JS (or TS for esbuild)
  esbuild-plugin.civet

build/
  esbuild.civet      # Build script with manual entry points
  compile            # Clean, build, and fix emitted d.ts names
  test               # c8 + mocha + supplementary test scripts
```

Useful regeneration commands:

- `./dist/hera --ast < source/hera.hera > source/rules.json`
- `./dist/hera --libPath ./machine.js < source/hera.hera > source/parser.js`

## Build Wiring

`build/esbuild.civet` contains four `esbuild.build()` calls. The last one lists register and loader files as explicit `entryPoints`. There is no glob, so if you add a file under `source/register/`, you must add it there manually.

The esbuild plugin build for `source/esbuild-plugin.civet` uses `bundle: false` and a footer that rewrites the default export for CJS compatibility:

```js
module.exports = module.exports.default;
```

Any new top-level CJS module with a default export needs the same treatment.

## Compiler Internals

### `compile(rules, options)` in `source/compiler.civet`

- `strDefs` and `reDefs` are module-level mutable arrays reset at the top of each `compile()` call. They deduplicate string and regex terminal definitions and are not reentrant.
- The `types` flag is derived automatically with `options.types || language === 'typescript' || language === 'civet'`. If you add another language that needs TypeScript-flavored scaffold output, add it there.
- When `language === 'civet'`, `compileHandler` indents each handler body line by two spaces so Civet can parse the generated function body correctly.
- `jsString` is used for `$EXPECT` error strings and prefers single quotes when the string contains `"` to avoid `\"` sequences that Civet 0.10.2 cannot parse.

### Adding a `CompilerOptions` field

1. Add it to the `CompilerOptions` interface in `source/compiler.civet`.
2. If it has a non-`undefined` default, add it to `defaultOptions` in the same file.
3. Wire it into `compile()`.
4. It will then flow into the esbuild plugin and the CJS loaders through their shared options objects.

## Language Pipelines

### Plain JavaScript

`source/register.civet` registers both ESM and CJS hooks. The ESM hook in `source/esm.civet` accepts an optional `data` object passed via `register()`; those fields are merged into `CompilerOptions` for that loader instance.

### TypeScript

`source/register/tsc/` implements Hera compile -> TypeScript -> `tsc.transpileModule()` -> JavaScript.

- `transpile.civet`: loads TypeScript and runs `transpileModule`
- `cjs.civet`: synchronous `require.extensions` hook
- `esm.civet`: async ESM load hook
- `index.civet`: registers both

### Civet

`source/register/civet/` implements Hera compile with `language: 'civet'` -> `civet.compile({ js: true, sync: true })` -> JavaScript.

The ESM base loader is registered with `{ data: { language: 'civet' } }` so `compile()` applies Civet-compatible output formatting.

`@danielx/civet` is a peer dependency loaded dynamically at runtime. Hera throws a clear install message if it is missing.

### Civet In esbuild

The esbuild plugin path is different from the Node loader path. The esbuild plugin calls `civet.compile(heraOutput)` without `{ js: true }`, so Civet outputs TypeScript and esbuild strips the types with `loader: 'ts'`. This preserves advanced TypeScript features such as `const enum` that Civet cannot compile to JavaScript itself.

The Node loader uses `{ js: true, sync: true }` because `require.extensions` must be synchronous and there is no esbuild step to strip types.

## Testing

```bash
yarn build
yarn test
```

Notes:

- Tests live in `test/`.
- Mocha loads `.civet` and `.hera` test files through `@danielx/hera-previous/register/tsc`, not the in-development build.
- Pure `.ts` and `.js` tests do not require a rebuild.
- Coverage uses `c8`.

## Package Exports

| Export | File | Purpose |
|---|---|---|
| `.` | `dist/main.js` | `compile()`, `parse()`, `generate()` |
| `./lib` | `dist/machine.js` | PEG runtime |
| `./esbuild-plugin` | `dist/esbuild.js` | esbuild plugin |
| `./register` | `dist/register.js` | JS loader |
| `./register/cjs` | `dist/register/cjs.js` | JS CJS hook only |
| `./register/esm` | `dist/esm.js` | JS ESM hook only |
| `./register/tsc` | `dist/register/tsc/index.js` | TypeScript loader |
| `./register/tsc/cjs` | `dist/register/tsc/cjs.js` | TypeScript CJS hook only |
| `./register/tsc/esm` | `dist/register/tsc/esm.js` | TypeScript ESM hook only |
| `./register/civet` | `dist/register/civet/index.js` | Civet loader |
| `./hera-types` | `dist/hera-types.js` | HeraAST / HeraRules types |

When adding a new language, update both this table and the `exports` field in `package.json`.
