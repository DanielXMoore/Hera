{ parse } = require("./parser")
{ compile } = require("./compiler.coffee")

execMod = (src) ->
  m = { exports: {} }
  Function("module", "exports", src)(m, m.exports)

  return m.exports

module.exports =
  parse: parse
  compile: (src) ->
    if typeof src is "string"
      compile parse src
    else
      compile src
  generate: (src) ->
    execMod compile parse src

