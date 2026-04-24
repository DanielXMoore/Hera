# perf

Benchmarks and profiling harness comparing the current working tree against
the last published release (`@danielx/hera-previous`, pinned in `package.json`).

Both scripts load `dist/main.js`, so run `pnpm build` first — they'll fail
with `MODULE_NOT_FOUND` otherwise.

## compare.civet

Throughput benchmark for both compilation and parsing, across a representative
set of sample grammars, plus generated code size.

```
npx civet ./perf/compare.civet    # or: npm run benchmark
```

Writes a single aligned table to stdout and to `perf/report.txt` (gitignored,
so successive runs can be diffed without re-grepping console output).
Columns: compile ops/sec (prev / curr / Δ%), parse ops/sec (prev / curr / Δ%),
generated code size (prev / curr / Δ%).

## profile.civet

V8 CPU profile of just the parse step — useful when `compare.civet` reports a
regression and you need to know *where* the time went, not just that it went.

```
npx civet ./perf/profile.civet [sample] [iters]
# defaults: hera_v0_8.hera, 20000
```

For each of prev and curr, runs `parse()` in a tight loop under
`inspector.Session.Profiler`, then prints:

- top-N functions by self-time (with file + start-line, so you can jump to
  the actual combinator/rule in `dist/machine.js` or the generated parser)
- self-time aggregated by source file (machine.js vs the generated parser
  vs native vs GC) — the fastest way to tell whether a regression lives in
  the runtime combinators or in the emitted rule bodies

Also writes `perf/prev.cpuprofile` and `perf/curr.cpuprofile` (gitignored)
that can be opened in Chrome DevTools (Performance tab → Load profile) for
flamegraphs.

## Extending

Add a new sample by dropping its grammar into `samples/` and extending the
`samples` map in `compare.civet` with a representative input.  `profile.civet`
picks up the same grammar files but uses hard-coded inputs for the canonical
samples; edit its `switch` to add more.
