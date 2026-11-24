#!/usr/bin/env node
// Ablation benchmark: what each codegen optimization and runtime option is
// worth, measured so that small effects are distinguishable from noise.
//
//   node perf/ablation.mjs [--rounds 10] [--cpu 1] [--samples a,b] [--variants x,y]
//
// Methodology (vs. perf/compare.civet, which runs prev and curr in one
// process and reports a single ratio):
// - every measurement runs in a fresh process, so parsers never share JIT
//   state, inline caches, or GC pressure;
// - grammars are compiled once, up front, so a worker's cold time isn't
//   skewed by JIT warmup from running that Hera version's own parser;
// - every (variant, sample) pair runs once per round, in shuffled order, so
//   machine-load drift spreads evenly across variants;
// - each variant is compared to the reference *from the same round* and the
//   per-round ratios are summarized as a median with a bootstrap 95% CI;
// - both warm throughput (after warmup, fastest of timed batches) and cold
//   time (loading the generated module + first parse) are reported, since
//   V8 tiers differ;
// - every variant's parse result, the baseline's included, must equal the
//   current one's; otherwise the report flags it and the script exits 1.
//
// Requires `pnpm build`.  The baseline compiler is HERA_BASELINE_ROOT (a
// directory containing dist/main.js), defaulting to @danielx/hera-previous.
// Optional --cpu pins each worker with `taskset -c` (Linux).

import { spawnSync } from "node:child_process"
import { createRequire, Module } from "node:module"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, "..")
const require = createRequire(import.meta.url)

// ---- worker ----------------------------------------------------------------

function compileParser(heraRoot, grammarSrc, compileOptions) {
  const hera = require(path.join(heraRoot, "dist/main.js"))
  return hera.compile(hera.parse(grammarSrc), {
    module: false,
    libPath: path.join(heraRoot, "dist/machine.js"),
    ...compileOptions,
  })
}

function loadParser(heraRoot, js) {
  const filename = path.join(heraRoot, "dist", "__ablation__.js")
  const m = new Module(filename)
  m.filename = filename
  m.paths = Module._nodeModulePaths(path.dirname(filename))
  m._compile(js, filename)
  return m.exports
}

function hashResult(value) {
  const s = JSON.stringify(value)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return `${s.length}:${h}`
}

function runWorker(spec) {
  const { heraRoot, parserFile, input, parseOptions, warmupMs, batches, batchMs, clock } = spec
  const js = fs.readFileSync(parserFile, "utf8")
  require(path.join(heraRoot, "dist/machine.js")) // keep runtime load out of the timings
  // CPU time (default) excludes time spent descheduled by other load on the
  // machine; wall time is available for comparison.
  const now = clock === "wall"
    ? () => Number(process.hrtime.bigint()) / 1e6
    : () => { const u = process.cpuUsage(); return (u.user + u.system) / 1000 }

  // Cold = load the generated module + first parse (what a one-shot CLI pays).
  let t = now()
  const parser = loadParser(heraRoot, js)
  const result = parser.parse(input, parseOptions)
  const coldMs = now() - t

  // Warm up, then size batches to ~batchMs each.
  let n = 0
  t = now()
  while (now() - t < warmupMs) { parser.parse(input, parseOptions); n++ }
  const perBatch = Math.max(1, Math.round((n / warmupMs) * batchMs))
  const rates = []
  for (let b = 0; b < batches; b++) {
    t = now()
    for (let i = 0; i < perBatch; i++) parser.parse(input, parseOptions)
    rates.push(perBatch / ((now() - t) / 1000))
  }
  // Fastest batch: interference from other load only ever slows a batch down.
  return { coldMs, opsPerSec: Math.max(...rates), hash: hashResult(result) }
}

if (process.argv[2] === "--worker") {
  process.stdout.write(JSON.stringify(runWorker(JSON.parse(process.argv[3]))))
  process.exit(0)
}

// ---- configuration ---------------------------------------------------------

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), [])
)
const rounds = Number(args.rounds ?? 10)
const cpu = args.cpu
const clock = args.clock ?? "cpu"
const baselineRoot = process.env.HERA_BASELINE_ROOT
  ? path.resolve(process.env.HERA_BASELINE_ROOT)
  : path.dirname(path.dirname(require.resolve("@danielx/hera-previous/dist/main.js")))

const samples = [
  { name: "url", grammar: "samples/url.hera", input: "http://danielx.net:443/%21?query#fragment" },
  { name: "math", grammar: "samples/math.hera", input: "1 + 2 * (3 - 4) / 5 + 6 * 7 - 8" },
  { name: "coffee", grammar: "samples/coffee.hera", input: "x = 1\ny = 2\nz = x + y\n" },
  { name: "regex", grammar: "samples/regex.hera", input: "/foo[abc](?:bar)\\d+/g" },
  { name: "hera_v0_8", grammar: "samples/hera_v0_8.hera", input: fs.readFileSync(path.join(repo, "samples/hera_v0_8.hera"), "utf8") },
  // ~10 KB: the Hera grammar parsing several sample grammars concatenated
  {
    name: "hera_v0_8-10k",
    grammar: "samples/hera_v0_8.hera",
    input: ["math", "url", "coffee", "hera_v0_8", "types"].map((n) => fs.readFileSync(path.join(repo, `samples/${n}.hera`), "utf8")).join("\n"),
  },
].filter((s) => !args.samples || args.samples.split(",").includes(s.name))

const optimizations = ["cc"]
// `ref` names the variant each one is compared against (ratio = variant / ref).
// A variant can set `compile` (compiler options) or `parse` (parse options).
const variants = [
  { name: "baseline", root: baselineRoot, ref: "baseline" },
  { name: "current", ref: "baseline" },
  // Identical to `current`: its spread is the measurement noise floor.
  { name: "current again", ref: "current" },
  ...optimizations.map((o) => ({ name: `${o} off`, compile: { disableOptimizations: [o] }, ref: "current" })),
  { name: "lazyErrors", parse: { lazyErrors: true }, ref: "current" },
  // Hooks compiled in but no tracer passed: what a parser that supports
  // tracing costs when it isn't tracing
  { name: "trace (unused)", compile: { trace: true }, ref: "current" },
].filter((v) => !args.variants || args.variants.split(",").includes(v.name) || ["baseline", "current", "current again"].includes(v.name))

// ---- run -------------------------------------------------------------------

// Each (variant, sample) is compiled once, in this process, and the workers
// only load the generated parser.
const parserDir = fs.mkdtempSync(path.join(os.tmpdir(), "hera-ablation-"))
const compiled = new Map()
function compiledParser(variant, sample) {
  const key = `${variant.name}/${sample.name}`
  if (!compiled.has(key)) {
    let entry
    try {
      const js = compileParser(variant.root ?? repo, fs.readFileSync(path.join(repo, sample.grammar), "utf8"), variant.compile ?? {})
      const file = path.join(parserDir, `${compiled.size}.js`)
      fs.writeFileSync(file, js)
      entry = { file, codeHash: hashResult(js) }
    } catch (e) {
      // An older baseline may not parse a newer sample grammar; report n/a.
      if (variant.root !== baselineRoot || variant.compile) throw e
      entry = { failed: `${e.name}: ${e.message.split("\n")[0]}` }
    }
    compiled.set(key, entry)
  }
  return compiled.get(key)
}

function measure(variant, sample) {
  const parser = compiledParser(variant, sample)
  if (parser.failed) return { failed: parser.failed }
  const spec = {
    heraRoot: variant.root ?? repo,
    parserFile: parser.file,
    input: sample.input,
    parseOptions: variant.parse ?? {},
    warmupMs: 400,
    batches: 15,
    batchMs: 30,
    clock,
  }
  const cmd = [process.execPath, fileURLToPath(import.meta.url), "--worker", JSON.stringify(spec)]
  const [exe, ...rest] = cpu ? ["taskset", "-c", cpu, ...cmd] : cmd
  const r = spawnSync(exe, rest, { encoding: "utf8", maxBuffer: 1 << 26 })
  if (r.status !== 0) {
    if (variant.root === baselineRoot && !variant.compile) return { failed: r.stderr.match(/\w*Error: [^\n]*/)?.[0] ?? "failed" }
    throw new Error(`${variant.name}/${sample.name} failed:\n${r.stderr}`)
  }
  return { ...JSON.parse(r.stdout), codeHash: parser.codeHash }
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const results = {} // results[variant][sample] = [{coldMs, opsPerSec}] per round
for (const v of variants) results[v.name] = Object.fromEntries(samples.map((s) => [s.name, []]))

const started = Date.now()
for (let r = 0; r < rounds; r++) {
  const jobs = shuffle(variants.flatMap((v) => samples.map((s) => [v, s])))
  for (const [v, s] of jobs) results[v.name][s.name][r] = measure(v, s)
  process.stderr.write(`round ${r + 1}/${rounds} done (${Math.round((Date.now() - started) / 1000)}s)\n`)
}

// ---- report ----------------------------------------------------------------

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
// Bootstrap 95% CI of the median of per-round ratios.
function bootstrapCI(xs, iters = 4000) {
  const meds = []
  for (let i = 0; i < iters; i++) meds.push(median(xs.map(() => xs[Math.floor(Math.random() * xs.length)])))
  meds.sort((a, b) => a - b)
  return [meds[Math.floor(iters * 0.025)], meds[Math.floor(iters * 0.975)]]
}
const pct = (x) => `${x >= 1 ? "+" : ""}${((x - 1) * 100).toFixed(1)}%`

const lines = []
const out = (s = "") => { lines.push(s); console.log(s) }
out(`Hera ablation benchmark — ${rounds} rounds, fresh process per measurement, ${clock} time${cpu ? `, pinned to CPU ${cpu}` : ""}`)
out(`  baseline: ${baselineRoot} (${require(path.join(baselineRoot, "package.json")).version})`)
out(`  current:  ${repo} (${require(path.join(repo, "package.json")).version})`)
out(`  ran:      ${new Date().toISOString()}`)
out()
out("Δ = variant vs its reference, median of per-round paired ratios [95% CI].")
out("For \"X off\" rows, a negative Δ means X helps by about that much.  * = CI excludes 0.")
out("\"current again\" is identical to current, so its CI is the noise floor.  (same code) = the")
out("variant generates byte-identical code for that sample, so any Δ there is noise too.")

const mismatches = []
const uncompared = []
for (const s of samples) {
  out()
  out(`== ${s.name} (${s.input.length} chars)`)
  out(`${"variant".padEnd(18)} ${"warm ops/s".padStart(11)}  ${"warm Δ vs ref".padEnd(33)} ${"cold ms".padStart(8)}  cold Δ vs ref`)
  const refHash = results.current[s.name][0].hash
  const refCode = results.current[s.name][0].codeHash
  for (const v of variants) {
    const rs = results[v.name][s.name]
    const refs = results[v.ref][s.name]
    if (rs.some((x) => x.failed)) {
      out(`${v.name.padEnd(18)} ${"n/a".padStart(11)}  ${rs.find((x) => x.failed).failed}`)
      uncompared.push(`${v.name}/${s.name}`)
      continue
    }
    if (refs.some((x) => x.failed)) {
      out(`${v.name.padEnd(18)} ${Math.round(median(rs.map((x) => x.opsPerSec))).toLocaleString("en-US").padStart(11)}  (no ${v.ref} to compare with)`)
      continue
    }
    // A speed ratio only means something if both sides did the same work,
    // so the baseline's results are checked too.
    const differs = rs.some((x) => x.hash !== refHash)
    if (differs) mismatches.push(`${v.name}/${s.name}`)
    const warm = median(rs.map((x) => x.opsPerSec))
    const cold = median(rs.map((x) => x.coldMs))
    let warmCol = "(reference)", coldCol = "(reference)"
    if (v.ref !== v.name) {
      const wr = rs.map((x, i) => x.opsPerSec / refs[i].opsPerSec)
      const cr = rs.map((x, i) => refs[i].coldMs / x.coldMs) // >1 = variant faster
      const [wl, wh] = bootstrapCI(wr), [cl, ch] = bootstrapCI(cr)
      const sig = (l, h) => (l > 1 || h < 1 ? " *" : "")
      warmCol = `${pct(median(wr))} [${pct(wl)}, ${pct(wh)}]${sig(wl, wh)}  vs ${v.ref}`
      coldCol = `${pct(median(cr))} [${pct(cl)}, ${pct(ch)}]${sig(cl, ch)}`
    }
    const same = differs ? "  (DIFFERENT RESULT)" : v.compile && rs[0].codeHash === refCode ? "  (same code)" : ""
    out(`${v.name.padEnd(18)} ${Math.round(warm).toLocaleString("en-US").padStart(11)}  ${warmCol.padEnd(33)} ${cold.toFixed(2).padStart(8)}  ${coldCol}${same}`)
  }
}
out()
out(mismatches.length ? `RESULT MISMATCH vs current: ${mismatches.join(", ")}` : "All compared variants returned results identical to current.")
if (uncompared.length) out(`Not compared (failed to run): ${uncompared.join(", ")}`)
fs.writeFileSync(path.join(here, "ablation-report.txt"), lines.join("\n") + "\n")
fs.rmSync(parserDir, { recursive: true, force: true })
if (mismatches.length) process.exitCode = 1
