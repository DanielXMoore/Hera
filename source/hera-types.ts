/**
 * These are types specific to the Hera parser and not grammars in general.
 */

import type { Loc, Parser, ParserContext } from "./machine"

export type Terminal = string | RegExp

export type PositionalVariable = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type StructuralTerminal =
  boolean |
  null |
  number |
  string |
  undefined |
  { v: PositionalVariable } |
  { o: { [key: string]: StructuralHandling } } |
  { l: any }
export type StructuralHandling = StructuralTerminal | StructuralHandling[]
export type Handler = { $loc: Loc, f: string, t?: string } | StructuralHandling
export type TerminalOp = "L" | "R"
export type SequenceOp = "S" | "/"
export type PrefixOp = "&" | "!" | "$"
export type SuffixOp = "+" | "*" | "?"
export type Literal = [TerminalOp, string]
export type TerminalNode = [TerminalOp, string, Handler?]
export type SequenceNode = [SequenceOp, HeraAST[], Handler?]
export type PrefixNode = [PrefixOp, HeraAST, Handler?]
export type SuffixNode = [SuffixOp, HeraAST, Handler?]
export type NameNode = [{ name: string }, HeraAST, Handler?]
export type PrimaryNode = TerminalNode | SequenceNode | NameNode
export type HeraAST = PrefixNode | SuffixNode | SequenceNode | TerminalNode | NameNode | string

export const CodeSymbol = Symbol.for("code")

export type HeraRules = {
  [key: string]: HeraAST,
  [CodeSymbol]?: string
}

export type HeraGrammar = { [key: string]: Parser<any> }

export type ParserEvents = {
  enter?: ParserContext["enter"],
  exit?: ParserContext["exit"],
}

export interface ParserOptions<T extends HeraGrammar> {
  /** The name of the file being parsed */
  filename?: string
  startRule?: keyof T
  tokenize?: boolean
  events?: ParserEvents
}
