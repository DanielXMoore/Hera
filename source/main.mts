import type {
  HeraAST,
  HeraGrammar,
  HeraRules,
  ParserOptions,
  Loc,
  Token,
} from "./machine.mjs"

import parser from "./parser.js"
import {compile as heraCompile} from "./compiler.civet"

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
  return heraCompile(rules, options)
}
const parse: <T extends HeraGrammar>(input: string, options?: ParserOptions<T>) => HeraRules = parser.parse

const generate = <T extends HeraGrammar>(src: string) => execMod(compile(parse(src))) as {
  parse: (input: string, options?: ParserOptions<T>) => unknown
}

export {
  parse,
  compile,
  generate,
  HeraAST,
  Loc,
  Token
}

const hera = {
  parse,
  compile,
  generate,
}

export default hera
