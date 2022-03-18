# Experimental compilers, going ham

{rules} = require "../source/main"
{compile} = require "../source/exp/compiler"

heraSrc = readFile("samples/hera.hera")

fs = require "fs"

describe "Experimental", ->
  describe "TypeScript Compiler", ->
    it.skip "should compile to a typescript file", ->
      fs.writeFileSync "source/exp/compiled.ts", compile(rules, {types: true})
      fs.writeFileSync "source/exp/compiled.js", compile(rules, {types: false})

    it "should parse from compiled js", ->
      {parse} = require "../source/exp/compiled.js"

      assert.deepEqual rules, parse heraSrc

    it "should parse from compiled ts", ->
      {parse} = require "../source/exp/compiled.ts"

      assert.deepEqual rules, parse heraSrc
