Benchmark = require("benchmark")

fs = require "fs"
path = require "path"

bench = (alternatives) ->
  suite = new Benchmark.Suite

  Object.keys(alternatives).forEach (name) ->
    suite.add(name, alternatives[name])

  suite
  .on 'cycle', (event) ->
    console.log(String(event.target))

  .on 'complete', ->
    # console.log(this)
    console.log('Fastest is ' + this.filter('fastest').map('name'))

  suite.run
    async: true

console.log "running benchmark"

oldHera = require "../source/old_main"
compiledHera = require "../source/parser"

grammar = fs.readFileSync("source/hera.hera", "utf8")
oldHera.parse grammar
compiledHera.parse grammar

bench
  oldHera: ->
    oldHera.parse grammar

  compiledHera: ->
    compiledHera.parse grammar
