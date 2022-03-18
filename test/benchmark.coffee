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
    hera = require "../source/main"
    oldHera = require "../source/old_main"
    tsHera = require "../source/exp/compiled"

    grammar = fs.readFileSync(sampleDir + "/hera.hera", "utf8")
    hera.parse grammar
    oldHera.parse grammar
    tsHera.parse grammar

    bench
      hera: ->
        hera.parse grammar

      oldHera: ->
        oldHera.parse grammar

      tsHera: ->
        tsHera.parse grammar
