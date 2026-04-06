import type { HeraRules, ParserOptions } from "./hera-types.civet"
import type { HeraGrammar } from "./machine"

declare const parser: {
  parse(input: string, options?: ParserOptions<HeraGrammar>): HeraRules
}
export default parser
