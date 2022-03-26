Benchmark = require("benchmark")

fs = require "fs"
path = require "path"
sampleDir = path.join(__dirname, "../samples")

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

describe.skip "Benchmark", ->
  it "check console", ->
    oldHera = require "../source/old_main"
    compiledHera = require "../source/parser"

    grammar = fs.readFileSync(sampleDir + "/hera.hera", "utf8")
    oldHera.parse grammar
    compiledHera.parse grammar

    bench
      oldHera: ->
        oldHera.parse grammar

      compiledHera: ->
        compiledHera.parse grammar
