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

## ablation.mjs

What each codegen optimization and runtime option is worth, measured so that
small effects can be told apart from noise.  Use this (not `compare.civet`)
to decide whether an optimization pays for itself.

```
node perf/ablation.mjs [--rounds 10] [--cpu 1] [--samples a,b] [--variants x,y] [--clock cpu|wall]
HERA_BASELINE_ROOT=/path/to/hera-checkout node perf/ablation.mjs   # baseline other than hera-previous
```

`compare.civet` runs both parsers in one process and reports one ratio per
sample; between runs its "parse Δ" column can swing by tens of percentage
points with identical code.  `ablation.mjs` instead:

- runs every measurement in a fresh process (no shared JIT/IC/GC state);
- compiles each grammar once, up front, so a worker's cold time isn't
  skewed by JIT warmup from running that Hera version's own parser;
- runs every (variant, sample) pair once per round, in shuffled order, so
  load drift spreads evenly;
- compares each variant with its reference *from the same round* and reports
  the median of those paired ratios with a bootstrap 95% CI (`*` = the CI
  excludes zero);
- times CPU (not wall) by default, so time spent descheduled by other load
  doesn't count; `--cpu N` additionally pins workers with `taskset`;
- reports warm throughput (fastest of 15 batches after warmup) and cold time
  (loading the generated module + first parse) separately;
- includes `current again` — identical to `current` — whose CI is the noise
  floor, and marks `(same code)` where an ablation doesn't change a sample's
  generated code;
- flags any variant (the baseline included) whose parse result differs
  from `current`, and then exits with status 1.  A baseline that can't run a
  sample (e.g. an older grammar syntax) shows `n/a` and is listed as not
  compared.

Variants can set compiler options or parse options.  Writes
`perf/ablation-report.txt` (gitignored).

## Extending

Add a new sample by dropping its grammar into `samples/` and extending the
`samples` map in `compare.civet` with a representative input.  `profile.civet`
picks up the same grammar files but uses hard-coded inputs for the canonical
samples; edit its `switch` to add more.
