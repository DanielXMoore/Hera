# Experimental compilers, going ham

{compile, parse} = require "../"
rules = require "../source/rules"

heraSrc = readFile("samples/hera.hera")

fs = require "fs"

describe "Experimental", ->
  describe "TypeScript Compiler", ->
    it.skip "should compile to a TypeScript file", ->
      fs.writeFileSync "source/exp/compiled.ts", compile(rules, {types: true})

    it.skip "should compile to a JavaScript file", ->
      fs.writeFileSync "source/exp/compiled.js", compile(rules, {types: false})

    it.skip "should compile example file", ->
      sampleRules = parse(readFile("samples/url.hera"))
      fs.writeFileSync "samples/url.js", compile(sampleRules, {types: false})

    it "should parse from compiled js", ->
      {parse} = require "../source/parser.js"

      assert.deepEqual parse(heraSrc), rules

    it.skip "should parse from compiled ts", ->
      {parse} = require "../source/exp/compiled.ts"

      assert.deepEqual parse(heraSrc), rules
