esbuild = require 'esbuild'
coffeeScriptPlugin = require 'esbuild-coffeescript'
civetPlugin = require '@danielx/civet/esbuild-plugin'

watch = process.argv.includes '--watch'
minify = process.argv.includes '--minify'
sourcemap = false

esbuild.build({
  entryPoints: ['source/main.civet']
  tsconfig: "./tsconfig.json"
  bundle: true
  keepNames: true
  external: ["fs"]
  format: "cjs"
  sourcemap
  minify
  watch
  platform: 'node'
  outfile: 'dist/main.js'
  plugins: [
    civetPlugin()
    coffeeScriptPlugin
      bare: true
      inlineMap: sourcemap
  ]
}).catch -> process.exit 1

esbuild.build({
  entryPoints: ['source/cli.civet']
  tsconfig: "./tsconfig.json"
  bundle: false
  format: "cjs"
  sourcemap
  minify
  watch
  platform: 'node'
  outfile: 'dist/hera'
  plugins: [
    civetPlugin()
  ]
}).catch -> process.exit 1
