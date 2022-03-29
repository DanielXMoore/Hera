const { parse } = require("./parser")
const { compile } = require("./compiler.coffee")

const execMod = (src: string) => {
  const m = { exports: {} }
  Function("module", "exports", src)(m, m.exports)

  return m.exports;
}

type CompilerOptions = {
  types: boolean
}

module.exports = {
  parse: parse,
  compile: (src: string, options?: CompilerOptions) => {
    return compile(src, options)
  },
  generate: (src: string) => execMod(compile(parse(src)))
}
