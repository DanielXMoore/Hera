# Contributing

## Setup

```sh
pnpm install
```

## Build

```sh
pnpm build      # compile once
pnpm watch      # recompile on change
```

## Test

```sh
pnpm test           # unit tests with coverage
pnpm e2e        # end-to-end tests
```

## Package

```sh
pnpm package    # produces a .vsix file
```

## Notes

- Source is written in [Civet](https://github.com/DanielXMoore/Civet) under `source/`
- The build script is `.esbuild.civet`
- Please add tests for new behavior
