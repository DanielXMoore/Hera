const { parse } = require("./parser")
const { compile } = require("./compiler")

const execMod = (src: string) => {
  const m = { exports: {} }
  Function("module", "exports", src)(m, m.exports)

  return m.exports;
}

module.exports = {
  parse: parse,
  compile: (src: string | Object) => {
    if (typeof src === "string")
      return compile(parse(src))
    else
      return compile(src)
  },
  generate: (src: string | Object) => execMod(compile(parse(src)))
}
