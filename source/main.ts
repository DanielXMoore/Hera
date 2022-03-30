import { HeraGrammar, HeraRules, ParserOptions } from "./machine"

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

const compile: (rulesOrString: HeraRules | string, options?: CompilerOptions) => string = (rulesOrString, options) => {
  var rules: HeraRules
  if (typeof rulesOrString === "string") {
    rules = parse(rulesOrString)
  } else {
    rules = rulesOrString
  }
  return compiler.compile(rules, options)
}
const parse: <T extends HeraGrammar>(input: string, options?: ParserOptions<T>) => HeraRules = parser.parse

const generate = <T extends HeraGrammar>(src: string) => execMod(compile(parse(src))) as (input: string, options?: ParserOptions<T>) => unknown

export {
  parse,
  compile,
  generate
}
