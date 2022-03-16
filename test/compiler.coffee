# Experimental compilers, going ham

{rules} = require "../source/main"
{typeScript} = require "../source/exp/compiler"

fs = require "fs"

describe "Experimental", ->
  describe "TypeScript Compiler", ->
    it.only "should compile to a typescript file", ->
      fs.writeFileSync "source/exp/compiled.ts", typeScript(rules)
