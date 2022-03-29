import { HeraRules, Parser } from "./machine"

import parser from "./parser"
//@ts-ignore
import compiler from "./compiler.coffee"

const execMod = (src: string) => {
  const m = { exports: {} }
  Function("module", "exports", src)(m, m.exports)

  return m.exports;
}

type CompilerOptions = {
  types: boolean
}

const compile: (rules: HeraRules, options?: CompilerOptions) => string = compiler.compile
const parse: (input: string) => HeraRules = parser.parse

const generate = (src: string) => execMod(compile(parse(src))) as Parser<unknown>

export {
  parse,
  compile,
  generate
}
