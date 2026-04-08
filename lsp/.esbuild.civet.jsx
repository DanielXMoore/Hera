import * as esbuild from "esbuild"
import { copyFile } from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import CivetPlugin from "@danielx/civet/esbuild"

const civetPlugin = CivetPlugin({
  ts: "civet",
})

const civetPluginE2e = CivetPlugin({
  ts: "civet",
  parseOptions: {
    rewriteCivetImports: ".js",
  },
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const watch = process.argv.includes('--watch')
const minify = false // !watch || process.argv.includes('--minify')

const options = {
  entryPoints: {
    extension: 'src/extension.civet',
    server: 'src/server.civet',
  },
  outdir: 'dist',
  tsconfig: './tsconfig.json',
  bundle: true,
  external: ['vscode'],
  format: 'cjs',
  sourcemap: watch,
}(
  minify, {
  platform: 'node',
  plugins: [civetPlugin],
})

const e2eOptions = {
  entryPoints: [
    'e2e/runTest.civet',
    'e2e/index.civet',
    'e2e/helper.civet',
    'e2e/completion.test.civet',
    'e2e/diagnostics.test.civet'
  ],
  outdir: 'e2e/dist',
  bundle: false,
  format: 'cjs',
  sourcemap: true,
  platform: 'node',
  plugins: [civetPluginE2e],
}

async function copyMachine() {
  await copyFile(
    __dirname + '/node_modules/@danielx/hera/dist/machine.ts',
    __dirname + '/dist/machine.ts'
  )
  return await copyFile(
    __dirname + '/node_modules/@danielx/hera/dist/machine.js',
    __dirname + '/dist/machine.js'
  )
}

async function main() {
  if (watch) {
    const ctx = await esbuild.context(options)
    await ctx.rebuild()
    await copyMachine()
    return await ctx.watch()
  }
  else {
    await Promise.all([
      esbuild.build(options),
      esbuild.build(e2eOptions)
    ])
    return await copyMachine()
  }
}

main().catch(() => process.exit(1))
