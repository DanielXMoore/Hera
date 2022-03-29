const { parse } = require("./parser")
const { compile } = require("./compiler.coffee")

const execMod = (src: string) => {
  const m = { exports: {} }
  Function("module", "exports", src)(m, m.exports)

  return m.exports;
}

module.exports = {
  parse: parse,
  compile: (src: string) => {
    return compile(src)
  },
  generate: (src: string) => execMod(compile(parse(src)))
}
