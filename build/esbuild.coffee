esbuild = require 'esbuild'
coffeeScriptPlugin = require 'esbuild-coffeescript'
civetPlugin = require '@danielx/civet/esbuild-plugin'

watch = process.argv.includes '--watch'
minify = !watch || process.argv.includes '--minify'
sourcemap = true

esbuild.build({
  entryPoints: ['source/main.mts']
  tsconfig: "./tsconfig.json"
  bundle: true
  external: ["fs"]
  format: "cjs"
  sourcemap
  minify
  watch
  platform: 'browser'
  outfile: 'dist/main.js'
  plugins: [
    civetPlugin
    coffeeScriptPlugin
      bare: true
      inlineMap: sourcemap
  ]
}).catch -> process.exit 1
