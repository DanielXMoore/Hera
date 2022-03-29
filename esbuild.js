const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');
const minify = false //!watch || process.argv.includes('--minify');
const sourcemap = true

const coffeeScriptPlugin = require('esbuild-coffeescript')

// Building machine.js
// esbuild.build({
//   entryPoints: ['source/machine.ts'],
//   tsconfig: "./tsconfig.json",
//   format: "iife",
//   globalName: "Machine",
//   sourcemap: false,
//   platform: 'browser',
//   outfile: 'source/machine.js',
// }).catch(() => process.exit(1))

esbuild.build({
  entryPoints: ['source/main.ts'],
  tsconfig: "./tsconfig.json",
  bundle: true,
  external: ["fs"],
  format: "cjs",
  sourcemap,
  minify,
  watch,
  platform: 'browser',
  outfile: 'dist/main.js',
  plugins: [coffeeScriptPlugin({
    bare: true,
    inlineMap: sourcemap,
  })]
}).catch(() => process.exit(1))
