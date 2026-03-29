# Hera — Developer Guide for AI Agents

## What Hera Is

Hera is a PEG parser generator. You write `.hera` files containing grammar rules with handler bodies (JavaScript, TypeScript, or Civet). Hera compiles them into standalone JavaScript parser modules.

The repo is **self-hosted**: the Hera parser (`source/hera.hera`) is parsed and compiled by Hera itself.

---

## The Bootstrap Problem

**This is the most surprising thing in this repo.**

The build and test suite use `@danielx/hera-previous` (a npm alias pointing at the currently-published version of this package) to process `.hera` source files — not the in-development version. This is because the in-development version doesn't exist as a built artifact until after `yarn build`.

Consequences:
- `build/esbuild.civet` imports `heraPlugin from @danielx/hera-previous/esbuild`
- `package.json#mocha.require` uses `@danielx/hera-previous/register/tsc` to load `.civet` and `.hera` test files
- When you add a new feature to the compiler, tests that exercise it through `.hera` files can only run after `yarn build`

`yarn build` runs `bash build/compile` which: deletes `dist/`, runs `node build/esbuild.civet` (bundling via esbuild), then post-processes `.d.ts` files (a `sed` rename from `.civet.d.ts` to `.d.ts`).

---

## Source Layout

```
source/
  hera.hera          # The Hera grammar (self-hosted)
  rules.json         # Parsed AST of hera.hera — regenerate with: ./dist/hera --ast < source/hera.hera > source/rules.json
  parser.js          # Generated parser — regenerate with: ./dist/hera --libPath ./machine.js < source/hera.hera > source/parser.js
  machine.ts         # PEG runtime included in every generated parser (published as @danielx/hera/lib)
  compiler.civet     # Compiles HeraRules (parsed grammar) → JS/TS string
  main.civet         # Public API: wraps parser + compiler, exports compile()
  hera-types.civet   # TypeScript types for the HeraAST / HeraRules structures
  esm.civet          # Base ESM load hook (handles .hera files via Node's module hooks API)
  register.civet     # Registers both ESM hook and CJS hook for plain JS output
  register/
    cjs.civet        # CJS require.extensions hook for plain JS output
    tsc/             # TypeScript pipeline: Hera → TS → tsc transpileModule → JS
    civet/           # Civet pipeline: Hera → Civet → JS (or TS for esbuild)
  esbuild-plugin.civet  # esbuild plugin

build/
  esbuild.civet      # Build script — entry points are listed MANUALLY (no glob)
  compile            # Shell wrapper: clean, run esbuild.civet, post-process .d.ts
  test               # Shell wrapper: c8 mocha + supplementary test scripts
```

---

## Build Wiring: Manual Entry Points

`build/esbuild.civet` contains four `esbuild.build()` calls. The last one lists all register/loader files as explicit `entryPoints`. **There is no glob.** If you add a new file under `source/register/`, you must add it to that array manually.

The esbuild plugin (`source/esbuild-plugin.civet`) is built with `bundle: false` and gets a `footer` that rewrites the default export for CJS compatibility:
```js
module.exports = module.exports.default;
```
Any new top-level CJS module with a default export needs the same treatment.

---

## Compiler Internals

### `compile(rules, options)` — `source/compiler.civet`

Takes a `HeraRules` object (from the parser) and returns a JS/TS string.

**`strDefs` and `reDefs` are module-level mutable arrays** reset at the top of each `compile()` call. They deduplicate string and regex terminal definitions. Not reentrant.

**`language` → `types` coupling:** The `types` flag enables TypeScript-flavored scaffold output (typed parser variables, `ParseState` annotation). It's derived automatically:
```civet
types := options.types || language === 'typescript' || language === 'civet'
```
If you add a language that needs TS scaffold output, add it to this line.

**Handler body indentation for Civet:** When `language === 'civet'`, `compileHandler` indents each line of handler body content by 2 spaces. This is required because Civet's parser needs indentation inside `function() {}` blocks. No other language needs this.

**`jsString` helper:** Used to quote `$EXPECT` error message strings. Prefers single quotes when the string contains `"`, to avoid `\"` sequences that Civet 0.10.2 cannot parse.

### Adding a new `CompilerOptions` field

1. Add it to the `CompilerOptions` interface in `source/compiler.civet`
2. If it has a non-`undefined` default, add it to `defaultOptions` at the bottom of the same file
3. Wire it into `compile()` — it's available via `options`
4. It automatically flows into the esbuild plugin (which `extends CompilerOptions`) and into the CJS loaders via their exported `options.hera` singleton

---

## Language Pipelines

### Plain JS (`register`, `register/cjs`, `register/esm`)

`source/register.civet` registers both ESM and CJS hooks. The ESM hook (`source/esm.civet`) accepts an optional `data` object passed via the `register()` third argument; fields merge into `CompilerOptions` for that loader instance.

### TypeScript (`register/tsc`)

`source/register/tsc/` — Hera compile → `tsc.transpileModule()` → JS.

- `transpile.civet`: loads TypeScript, runs `transpileModule` (fast, no type-checking, single-file)
- `cjs.civet`: synchronous `require.extensions` hook
- `esm.civet`: async ESM load hook
- `index.civet`: registers both (the ESM hook first, CJS hook via `import`)

### Civet (`register/civet`)

`source/register/civet/` — Hera compile (with `language:'civet'`) → `civet.compile({ js: true, sync: true })` → JS.

Key difference from the tsc pipeline: the ESM base loader is registered with `{ data: { language: 'civet' } }` so that `compile()` applies Civet-compatible output formatting (indented handler bodies, single-quoted `$EXPECT` strings). The tsc pipeline does not need this.

`@danielx/civet` is a peer dependency, dynamically loaded at runtime. A clear error is thrown if it's not installed.

### Civet in esbuild (`esbuild-plugin.civet`)

**Different from the Node loader.** The esbuild plugin uses `civet.compile(heraOutput)` **without** `{ js: true }`, so Civet outputs TypeScript. esbuild then strips the types with `loader: 'ts'`. This preserves advanced TypeScript features (e.g., `const enum`) that Civet can't compile to JS itself.

The Node loader uses `{ js: true, sync: true }` because `require.extensions` is synchronous and there's no esbuild in the chain to strip types.

### Adding a new language pipeline

There's no required structure. The tsc and civet pipelines each happen to have four files, but that's an artifact of their complexity. A simpler language might only need a single `register/newlang.civet` that does everything inline — or even just a one-liner that imports a transpiler and hooks `require.extensions`. Design for simplicity.

Whatever structure you choose, you'll need to:
1. Add entries to `build/esbuild.civet`
2. Add a package export to `package.json`
3. If your language needs TS-flavored scaffold output, add it to the `types` derivation in `compiler.civet`
4. If your language requires special handler formatting, add a case to `compileHandler`

---

## Testing

```
yarn test       # Full suite: mocha + loaders + esbuild-plugin + typed-parser-samples
yarn build      # Required before tests that exercise new compiler features via .hera files
```

Tests live in `test/`. Mocha loads `.civet` and `.hera` test files via `@danielx/hera-previous/register/tsc` — the currently-published version, not the in-development one. Pure `.ts`/`.js` tests work without a build.

Coverage is measured by `c8`. Lines unreachable in test (e.g., error paths in dynamically-imported peer deps, `result.code` fallbacks for API compatibility) are annotated with `/* c8 ignore next */`.

Never use npx, use locally installed mocha from node modules.

---

## Package Exports

| Export | File | Purpose |
|---|---|---|
| `.` | `dist/main.js` | `compile()`, `parse()`, `generate()` |
| `./lib` | `dist/machine.js` | PEG runtime (included in generated parsers) |
| `./esbuild-plugin` | `dist/esbuild.js` | esbuild plugin |
| `./register` | `dist/register.js` | JS loader (CJS + ESM) |
| `./register/cjs` | `dist/register/cjs.js` | JS CJS hook only |
| `./register/esm` | `dist/esm.js` | JS ESM hook only |
| `./register/tsc` | `dist/register/tsc/index.js` | TypeScript loader |
| `./register/tsc/cjs` | `dist/register/tsc/cjs.js` | TS CJS hook only |
| `./register/tsc/esm` | `dist/register/tsc/esm.js` | TS ESM hook only |
| `./register/civet` | `dist/register/civet/index.js` | Civet loader |
| `./hera-types` | `dist/hera-types.js` | HeraAST / HeraRules types |

When adding a new language, add its export(s) here and to the `exports` field in `package.json`.
