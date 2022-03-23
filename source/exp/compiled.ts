/**
 * Location information within a string. A position and a length. Can be
 * converted into line numbers when reporting errors.
 */
export interface Loc {
  pos: number
  length: number
}

/**
 * The current parse state. The input string being parsed and the position to
 * check for matches.
 */
export interface ParseState {
  input: string
  pos: number
}

/**
 * A parsing result. We found a `T` at `loc` and the next position to parse is
 * `pos`.
 *
 * Is pos always loc.pos + loc.length?
 */
export interface ParseResult<T> {
  loc: Loc,
  pos: number,
  value: T,
}

/**
 * Either we found a parse result or we didn't.
 */
export type MaybeResult<T> = ParseResult<T> | undefined

/**
 * Utility to get the wrapped ParseResult type.
 */
export type Unwrap<T extends MaybeResult<any>> = T extends undefined ? never : T extends ParseResult<infer P> ? P : any;

export type Terminal = string | RegExp

export type StructuralTerminal = string | number
export type StructuralHandling = StructuralTerminal | StructuralHandling[]
export type Handler = { f: string } | StructuralHandling
export type TerminalOp = "L" | "R"
export type SequenceOp = "S" | "/"
export type NodeOp = "+" | "*" | "?" | "&" | "!" | "$"
export type Literal = [TerminalOp, string]
export type HeraAST = [NodeOp, HeraAST, Handler?] | [SequenceOp, HeraAST[], Handler?] | [TerminalOp, string, Handler?] | string

type Transform = <A, B>(parser: Parser<A>, fn: (value: A) => B) => Parser<B>

/**
 * Note failure to find `expectation` at `pos`. This is later used to generate
 * detailed error messages.
 */
interface Fail {
  (pos: number, expectation: any): void
}

/**
 * A Parser is a function that takes a string and position to check and returns
 * a result if it matches.
 */
export interface Parser<T> {
  (state: ParseState): MaybeResult<T>
}

export function $EXPECT<T>(parser: Parser<T>, fail: Fail, t: Terminal, name: string): Parser<T> {
  const expectation: string = prettyPrint(t, name)

  return function (state: ParseState) {
    const result = parser(state);
    if (result) return result;
    const { pos } = state;
    fail(pos, expectation)
    return
  }
}

/**
 * Match a string literal.
 */
export function $L<T extends string>(str: T): Parser<T> {
  return function (state: ParseState) {
    const { input, pos } = state;
    const { length } = str;

    if (input.substr(pos, length) === str) {
      return {
        loc: {
          pos: pos,
          length: length
        },
        pos: pos + length,
        value: str
      }
    }
    return
  }
}

/**
 * Match a regular expression (must be sticky).
 */
export function $R(regExp: RegExp): Parser<RegExpMatchArray> {
  return function (state: ParseState) {
    const { input, pos } = state
    regExp.lastIndex = state.pos

    let l, m, v

    if (m = input.match(regExp)) {
      v = m[0]
      l = v.length

      return {
        loc: {
          pos: pos,
          length: l,
        },
        pos: pos + l,
        value: m,
      }
    }
    return
  }
}

/** Choice
 * A / B / C / ...
 * Proioritized choice
 * roughly a(...) || b(...) in JS
 */

export function $C(): (state: ParseState) => undefined
export function $C<A>(a: Parser<A>): Parser<A>
export function $C<A, B>(a: Parser<A>, b: Parser<B>): Parser<A | B>
export function $C<A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>): Parser<A | B | C>
export function $C<A, B, C, D>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>): Parser<A | B | C | D>
export function $C<A, B, C, D, E>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>): Parser<A | B | C | D | E>
export function $C<A, B, C, D, E, F>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>): Parser<A | B | C | D | E | F>
export function $C<A, B, C, D, E, F, H>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>): Parser<A | B | C | D | E | F | H>
export function $C<A, B, C, D, E, F, H, I>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>, i: Parser<I>): Parser<A | B | C | D | E | F | H | I>
export function $C<A, B, C, D, E, F, H, I, J>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, h: Parser<H>, i: Parser<I>, j: Parser<J>): Parser<A | B | C | D | E | F | H | I | J>

export function $C<T extends any[]>(...terms: { [I in keyof T]: Parser<T[I]> }): Parser<T[number]> {
  return (state: ParseState): MaybeResult<T[number]> => {
    let i = 0
    const l = terms.length

    while (i < l) {
      const r = terms[i++](state);
      if (r) return r
    }

    return
  }
}

/** Sequence
 * A B C ...
 * A followed by by B followed by C followed by ...
 */

export function $S(): Parser<[]>
export function $S<A>(fn: Parser<A>): Parser<[A]>
export function $S<A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]>
export function $S<A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>): Parser<[A, B, C]>
export function $S<A, B, C, D>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>): Parser<[A, B, C, D]>
export function $S<A, B, C, D, E>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>): Parser<[A, B, C, D, E]>
export function $S<A, B, C, D, E, F>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>): Parser<[A, B, C, D, E, F]>
export function $S<A, B, C, D, E, F, G>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>): Parser<[A, B, C, D, E, F, G]>
export function $S<A, B, C, D, E, F, G, H>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>): Parser<[A, B, C, D, E, F, G, H]>
export function $S<A, B, C, D, E, F, G, H, I>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>, i: Parser<I>): Parser<[A, B, C, D, E, F, G, H, I]>
export function $S<A, B, C, D, E, F, G, H, I, J>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>, g: Parser<G>, h: Parser<H>, i: Parser<I>, j: Parser<J>): Parser<[A, B, C, D, E, F, G, H, I, J]>

export function $S<T extends any[]>(...terms: { [I in keyof T]: Parser<T[I]> }): Parser<T> {
  return (state: ParseState): MaybeResult<T> => {
    let { input, pos } = state,
      i = 0, value
    const results = [] as unknown as T,
      s = pos,
      l = terms.length

    while (i < l) {
      const r = terms[i++]({ input, pos })

      if (r) {
        ({ pos, value } = r)
        results.push(value)
      } else
        return
    }

    return {
      loc: {
        pos: s,
        length: pos - s,
      },
      pos: pos,
      value: results,
    }
  }
}

// a? zero or one
export function $E<T>(fn: Parser<T>): Parser<T | undefined> {
  return (state: ParseState) => {
    const r = fn(state)
    if (r) return r

    const { pos } = state
    return {
      loc: {
        pos: pos,
        length: 0
      },
      pos: pos,
      value: undefined
    }
  }
}

// *
// NOTE: zero length repetitions (where position doesn't advance) return
// an empty array of values. A repetition where the position doesn't advance
// would be an infinite loop, so this avoids that problem cleanly.

// Since this always returns a result `&x*` will always succeed and `!x*` will
// always fail. Same goes for `&x?` and `!x?`. Relatedly `&x+ == &x` and
// `!x+ == !x`.
export function $Q<T>(fn: Parser<T>): Parser<T[]> {
  return (state) => {
    let { input, pos } = state
    let value: T

    const s = pos
    const results: T[] = []

    while (true) {
      const prevPos = pos
      const r = fn({ input, pos })
      if (r == undefined) break

      ({ pos, value } = r)
      if (pos === prevPos)
        break
      else
        results.push(value)
    }

    return {
      loc: {
        pos: s,
        length: pos - s,
      },
      pos: pos,
      value: results
    }
  }
}

// + one or more
export function $P<T>(fn: Parser<T>): Parser<T[]> {
  return (state: ParseState) => {
    const { input, pos: s } = state
    let value: T

    const first = fn(state)
    if (!first) return

    let { pos } = first
    const results = [first.value]

    while (true) {
      const prevPos = pos

      const r = fn({ input, pos })
      if (!r) break

      ({ pos, value } = r)
      if (pos === prevPos)
        break

      results.push(value)
    }

    return {
      loc: {
        pos: s,
        length: pos - s,
      },
      value: results,
      pos: pos
    }
  }
}

// $ prefix operator, convert result value to a string spanning the
// matched input
export function $TEXT(fn: Parser<unknown>): Parser<string> {
  return (state: ParseState) => {
    const newState = fn(state)
    if (!newState) return

    newState.value = state.input.substring(state.pos, newState.pos)
    return newState as ParseResult<string>
  }
}

// ! prefix operator
export function $N(fn: Parser<unknown>): Parser<undefined> {
  return (state: ParseState) => {
    const newState = fn(state)

    if (newState)
      return

    return {
      loc: {
        pos: state.pos,
        length: 0,
      },
      value: undefined,
      pos: state.pos,
    }
  }

}

// & prefix operator
export function $Y(fn: Parser<unknown>): Parser<undefined> {
  return (state: ParseState) => {
    const newState = fn(state)

    if (!newState) return

    return {
      loc: {
        pos: state.pos,
        length: 0,
      },
      value: undefined,
      pos: state.pos,
    }
  }
}

// Transform
// simplest value mapping transform, doesn't include location data parameter
export function $T<A, B>(parser: Parser<A>, fn: (value: A) => B): Parser<B> {
  return function (state) {
    const result = parser(state);
    if (!result) return

    const { value } = result
    const mappedValue = fn(value)

    //@ts-ignore
    result.value = mappedValue
    return result as unknown as ParseResult<B>
  }
}

// Transform RegExp

// Result handler for regexp match expressions
// $0 is the whole match, followed by $1, $2, etc.
export function $TR<T>(parser: Parser<RegExpMatchArray>, fn: ($loc: Loc, ...args: string[]) => T): Parser<T> {
  return function (state) {
    const result = parser(state);
    if (!result) return

    const { loc, value } = result
    const mappedValue = fn(loc, ...value)

    //@ts-ignore
    result.value = mappedValue
    return result as unknown as ParseResult<T>
  }
}

// Transform sequence
export function $TS<A extends any[], B>(parser: Parser<A>, fn: ($loc: Loc, value: A, ...args: A) => B): Parser<B> {
  return function (state) {
    const result = parser(state);
    if (!result) return

    const { loc, value } = result
    const mappedValue = fn(loc, value, ...value)

    //@ts-ignore
    result.value = mappedValue
    return result as unknown as ParseResult<B>
  }
}

// Transform value $0 and $1 are both singular value
export function $TV<A, B>(parser: Parser<A>, fn: ($loc: Loc, $0: A, $1: A) => B): Parser<B> {
  return function (state) {
    const result = parser(state);
    if (!result) return

    const { loc, value } = result
    const mappedValue = fn(loc, value, value)

    //@ts-ignore
    result.value = mappedValue
    return result as unknown as ParseResult<B>
  }
}

// Default regexp result handler RegExpMatchArray => $0
export function $R$0(parser: Parser<RegExpMatchArray>): Parser<string> {
  return function (state) {
    const result = parser(state);
    if (!result) return

    const value = result.value[0]
    //@ts-ignore
    result.value = value
    return result as unknown as ParseResult<typeof value>
  }
}

// End of machinery
// Parser specific things below

/** Utility function to convert position in a string input to line:colum */
function location(input: string, pos: number) {
  const [line, column] = input.split(/\n|\r\n|\r/).reduce(([row, col], line) => {
    const l = line.length + 1
    if (pos > l) {
      pos -= l
      return [row + 1, 1]
    } else if (pos >= 0) {
      col += pos
      pos = -1
      return [row, col]
    } else {
      return [row, col]
    }
  }, [1, 1])

  return `${line}:${column}`
}

const failHintRegex = /\S+|\s+|$/y

/**
 * Pretty print a string or RegExp literal
 */
function prettyPrint(t: Terminal, name?: string) {
  let pv;

  if (t instanceof RegExp) {
    // Ignore case is the only external flag that may be allowed so far
    const s = t.toString()
    const flags = t.ignoreCase ? "i" : "";
    pv = s.slice(0, -t.flags.length) + flags
  } else {
    pv = JSON.stringify(t)
  }

  if (name) {
    return `${name} ${pv}`
  } else {
    return pv
  }
}

// Error tracking
// Goal is zero allocations
const failExpected = Array(16)
let failIndex = 0
let maxFailPos = 0

function fail(pos: number, expected: any) {
  if (pos < maxFailPos) return

  if (pos > maxFailPos) {
    maxFailPos = pos
    failExpected.length = failIndex = 0
  }

  failExpected[failIndex++] = expected

  return
}

type Grammar = { [key: string]: Parser<any> }

export interface ParserOptions<T extends Grammar> {
  /** The name of the file being parsed */
  filename?: string
  startRule?: keyof T
}

export function parserState<G extends Grammar>(grammar: G) {

  function validate<T>(input: string, result: MaybeResult<T>, { filename }: { filename: string }) {
    if (result && result.pos === input.length)
      return result.value

    const expectations = Array.from(new Set(failExpected.slice(0, failIndex)))
    let l = location(input, maxFailPos)

    // The parse completed with a result but there is still input
    if (result && result.pos > maxFailPos) {
      l = location(input, result.pos)
      throw new Error(`
${filename}:${l} Unconsumed input at #{l}

${input.slice(result.pos)}
    `)
    }

    if (expectations.length) {
      failHintRegex.lastIndex = maxFailPos
      let [hint] = input.match(failHintRegex)!

      if (hint.length)
        hint = prettyPrint(hint)
      else
        hint = "EOF"

      throw new Error(`
${filename}:${l} Failed to parse
Expected:
\t${expectations.join("\n\t")}
Found: ${hint}
`)
    }

    if (result) {
      throw new Error(`
Unconsumed input at ${l}

${input.slice(result.pos)}
`);
    }

    throw new Error("No result")
  }

  return {
    fail: fail,
    parse: (input: string, options: ParserOptions<G> = {}) => {
      if (typeof input !== "string") throw new Error("Input must be a string")

      const parser = (options.startRule != null)
        ? grammar[options.startRule]
        : Object.values(grammar)[0]

      if (!parser) throw new Error("Could not find rule with name '#{opts.startRule}'")

      const filename = options.filename || "<anonymous>";

      failIndex = 0
      maxFailPos = 0
      failExpected.length = 0

      return validate(input, parser({ input, pos: 0 }), {
        filename: filename
      })
    }
  }
}


const { parse } = parserState({
  Grammar: Grammar,
  Rule: Rule,
  RuleBody: RuleBody,
  Choice: Choice,
  Sequence: Sequence,
  SequenceExpression: SequenceExpression,
  ChoiceExpression: ChoiceExpression,
  Expression: Expression,
  PrefixOperator: PrefixOperator,
  Suffix: Suffix,
  SuffixOperator: SuffixOperator,
  Primary: Primary,
  Literal: Literal,
  Handling: Handling,
  HandlingExpression: HandlingExpression,
  HandlingExpressionBody: HandlingExpressionBody,
  HandlingExpressionLine: HandlingExpressionLine,
  HandlingExpressionValue: HandlingExpressionValue,
  RValue: RValue,
  CommaThenValue: CommaThenValue,
  StringValue: StringValue,
  DoubleStringCharacter: DoubleStringCharacter,
  EscapeSequence: EscapeSequence,
  StringLiteral: StringLiteral,
  RegExpLiteral: RegExpLiteral,
  CharacterClassExpression: CharacterClassExpression,
  RegExpCharacter: RegExpCharacter,
  CharacterClass: CharacterClass,
  CharacterClassCharacter: CharacterClassCharacter,
  Quantifier: Quantifier,
  Name: Name,
  Arrow: Arrow,
  Backslash: Backslash,
  OpenBracket: OpenBracket,
  CloseBracket: CloseBracket,
  OpenParenthesis: OpenParenthesis,
  CloseParenthesis: CloseParenthesis,
  Indent: Indent,
  _: _,
  EOS: EOS
})

const $L0 = $L("/");
const $L1 = $L(",");
const $L2 = $L("\"");
const $L3 = $L(".");
const $L4 = $L("[");
const $L5 = $L("]");
const $L6 = $L("->");
const $L7 = $L("\\");
const $L8 = $L("  ");

const $R0 = $R(new RegExp("[$&!]", 'suy'));
const $R1 = $R(new RegExp("[+?*]", 'suy'));
const $R2 = $R(new RegExp("[^\\n\\r]*", 'suy'));
const $R3 = $R(new RegExp("\\d\\d?", 'suy'));
const $R4 = $R(new RegExp("[^\"\\\\]+", 'suy'));
const $R5 = $R(new RegExp(".", 'suy'));
const $R6 = $R(new RegExp("[^\\/\\\\]+", 'suy'));
const $R7 = $R(new RegExp("[^\\]\\\\]+", 'suy'));
const $R8 = $R(new RegExp("[?+*]|\\{\\d+(,\\d+)?\\}", 'suy'));
const $R9 = $R(new RegExp("[_a-zA-Z][_a-zA-Z0-9]*", 'suy'));
const $R10 = $R(new RegExp("\\[[ \\t]*", 'suy'));
const $R11 = $R(new RegExp("\\][ \\t]*", 'suy'));
const $R12 = $R(new RegExp("\\([ \\t]*", 'suy'));
const $R13 = $R(new RegExp("[ \\t]*\\)", 'suy'));
const $R14 = $R(new RegExp("[ \\t]+", 'suy'));
const $R15 = $R(new RegExp("([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", 'suy'));

const Grammar$0 = $TS($S($Q(EOS), $P(Rule)), function ($loc, $0, $1, $2) { return Object.fromEntries($2) });
function Grammar(state: ParseState) {
  return Grammar$0(state);
}

const Rule$0 = $T($S(Name, EOS, RuleBody), function (value) { return [value[0], value[2]] });
function Rule(state: ParseState) {
  return Rule$0(state);
}

const RuleBody$0 = $TV($P($S(Indent, Choice)), function ($loc, $0, $1) {
  var r = $1.map((a) => a[1])
  if (r.length === 1) return r[0];
  return ["/", r]
});
function RuleBody(state: ParseState) {
  return RuleBody$0(state);
}

const Choice$0 = $TS($S(Sequence, Handling), function ($loc, $0, $1, $2) {
  if ($2 !== undefined) {
    if (!$1.push)
      $1 = ["S", [$1], $2]
    else
      $1.push($2)
  }
  return $1
});
function Choice(state: ParseState) {
  return Choice$0(state);
}

const Sequence$0 = $TS($S(Expression, $P(SequenceExpression)), function ($loc, $0, $1, $2) {
  $2.unshift($1)
  return ["S", $2]
});
const Sequence$1 = $TS($S(Expression, $P(ChoiceExpression)), function ($loc, $0, $1, $2) {
  $2.unshift($1)
  return ["/", $2]
});
const Sequence$2 = Expression;
function Sequence(state: ParseState) {
  return Sequence$0(state) || Sequence$1(state) || Sequence$2(state)
}

const SequenceExpression$0 = $T($S(_, Expression), function (value) { return value[1] });
function SequenceExpression(state: ParseState) {
  return SequenceExpression$0(state);
}

const ChoiceExpression$0 = $T($S(_, $EXPECT($L0, fail, "/", "ChoiceExpression"), _, Expression), function (value) { return value[3] });
function ChoiceExpression(state: ParseState) {
  return ChoiceExpression$0(state);
}

const Expression$0 = Suffix;
const Expression$1 = $T($S(PrefixOperator, Suffix), function (value) { return [value[0], value[1]] });
function Expression(state: ParseState) {
  return Expression$0(state) || Expression$1(state)
}

const PrefixOperator$0 = $R$0($EXPECT($R0, fail, "[$&!]", "PrefixOperator")) as Parser<"$" | "&" | "!">;
function PrefixOperator(state: ParseState) {
  return PrefixOperator$0(state);
}

const Suffix$0 = $T($S(Primary, SuffixOperator), function (value) { return [value[1], value[0]] });
const Suffix$1 = Primary;
function Suffix(state: ParseState) {
  return Suffix$0(state) || Suffix$1(state)
}

const SuffixOperator$0 = $R$0($EXPECT($R1, fail, "[+?*]", "SuffixOperator")) as Parser<"+" | "?" | "*">;
function SuffixOperator(state: ParseState) {
  return SuffixOperator$0(state);
}

const Primary$0 = Name;
const Primary$1 = Literal;
const Primary$2 = $T($S(OpenParenthesis, Sequence, CloseParenthesis), function (value) { return value[1] });
function Primary(state: ParseState) {
  return Primary$0(state) || Primary$1(state) || Primary$2(state)
}

const Literal$0 = StringLiteral;
const Literal$1 = RegExpLiteral;
function Literal(state: ParseState) {
  return Literal$0(state) || Literal$1(state)
}

const Handling$0 = $TS($S(EOS), function ($loc, $0, $1) { return undefined });
const Handling$1 = $T($S($Q(_), Arrow, HandlingExpression), function (value) { return value[2] });
function Handling(state: ParseState) {
  return Handling$0(state) || Handling$1(state)
}

const HandlingExpression$0 = $T($S(EOS, HandlingExpressionBody), function (value) { return value[1] });
const HandlingExpression$1 = $T($S(StringValue, EOS), function (value) { return value[0] });
const HandlingExpression$2 = $T($S(HandlingExpressionValue, EOS), function (value) { return value[0] });
function HandlingExpression(state: ParseState) {
  return HandlingExpression$0(state) || HandlingExpression$1(state) || HandlingExpression$2(state)
}

const HandlingExpressionBody$0 = $TV($P(HandlingExpressionLine), function ($loc, $0, $1) {
  return {
    f: $1.join("\n")
  }
});
function HandlingExpressionBody(state: ParseState) {
  return HandlingExpressionBody$0(state);
}

const HandlingExpressionLine$0 = $T($S(Indent, Indent, $EXPECT($R2, fail, "[^\\n\\r]*", "HandlingExpressionLine"), EOS), function (value) { return value[2] });
function HandlingExpressionLine(state: ParseState) {
  return HandlingExpressionLine$0(state);
}

const HandlingExpressionValue$0 = RValue;
const HandlingExpressionValue$1 = $TS($S(OpenBracket, RValue, $Q(CommaThenValue), CloseBracket), function ($loc, $0, $1, $2, $3, $4) { $3.unshift($2); return $3 });
function HandlingExpressionValue(state: ParseState) {
  return HandlingExpressionValue$0(state) || HandlingExpressionValue$1(state)
}

const RValue$0 = StringValue;
const RValue$1 = $TR($EXPECT($R3, fail, "\\d\\d?", "RValue"), function ($loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) { return parseInt($0, 10) });
function RValue(state: ParseState) {
  return RValue$0(state) || RValue$1(state)
}

const CommaThenValue$0 = $T($S($Q(_), $EXPECT($L1, fail, ",", "CommaThenValue"), $Q(_), RValue, $Q(_)), function (value) { return value[3] });
function CommaThenValue(state: ParseState) {
  return CommaThenValue$0(state);
}

const StringValue$0 = $T($S($EXPECT($L2, fail, "\\\"", "StringValue"), $TEXT($Q(DoubleStringCharacter)), $EXPECT($L2, fail, "\\\"", "StringValue")), function (value) { return value[1] });
function StringValue(state: ParseState) {
  return StringValue$0(state);
}

const DoubleStringCharacter$0 = $R$0($EXPECT($R4, fail, "[^\"\\\\]+", "DoubleStringCharacter"));
const DoubleStringCharacter$1 = EscapeSequence;
function DoubleStringCharacter(state: ParseState) {
  return DoubleStringCharacter$0(state) || DoubleStringCharacter$1(state)
}

const EscapeSequence$0 = $TEXT($S(Backslash, $EXPECT($R5, fail, ".", "EscapeSequence")));
function EscapeSequence(state: ParseState) {
  return EscapeSequence$0(state);
}

const StringLiteral$0 = $T($S(StringValue), function (value) { return ["L", value[0]] });
function StringLiteral(state: ParseState) {
  return StringLiteral$0(state);
}

const RegExpLiteral$0 = $T($S($EXPECT($L0, fail, "/", "RegExpLiteral"), $N(_), $TEXT($Q(RegExpCharacter)), $EXPECT($L0, fail, "/", "RegExpLiteral")), function (value) { return ["R", value[2]] });
const RegExpLiteral$1 = $T($TEXT(CharacterClassExpression), function (value) { return ["R", value] });
const RegExpLiteral$2 = $T($EXPECT($L3, fail, ".", "RegExpLiteral"), function (value) { return ["R", value] });
function RegExpLiteral(state: ParseState) {
  return RegExpLiteral$0(state) || RegExpLiteral$1(state) || RegExpLiteral$2(state)
}

const CharacterClassExpression$0 = $P(CharacterClass);
function CharacterClassExpression(state: ParseState) {
  return CharacterClassExpression$0(state);
}

const RegExpCharacter$0 = $R$0($EXPECT($R6, fail, "[^\\/\\\\]+", "RegExpCharacter"));
const RegExpCharacter$1 = EscapeSequence;
function RegExpCharacter(state: ParseState) {
  return RegExpCharacter$0(state) || RegExpCharacter$1(state)
}

const CharacterClass$0 = $S($EXPECT($L4, fail, "[", "CharacterClass"), $Q(CharacterClassCharacter), $EXPECT($L5, fail, "]", "CharacterClass"), $E(Quantifier));
function CharacterClass(state: ParseState) {
  return CharacterClass$0(state);
}

const CharacterClassCharacter$0 = $R$0($EXPECT($R7, fail, "[^\\]\\\\]+", "CharacterClassCharacter"));
const CharacterClassCharacter$1 = EscapeSequence;
function CharacterClassCharacter(state: ParseState) {
  return CharacterClassCharacter$0(state) || CharacterClassCharacter$1(state)
}

const Quantifier$0 = $R$0($EXPECT($R8, fail, "[?+*]|\\{\\d+(,\\d+)?\\}", "Quantifier"));
function Quantifier(state: ParseState) {
  return Quantifier$0(state);
}

const Name$0 = $R$0($EXPECT($R9, fail, "[_a-zA-Z][_a-zA-Z0-9]*", "Name"));
function Name(state: ParseState) {
  return Name$0(state);
}

const Arrow$0 = $S($EXPECT($L6, fail, "->", "Arrow"), $Q(_));
function Arrow(state: ParseState) {
  return Arrow$0(state);
}

const Backslash$0 = $EXPECT($L7, fail, "\\\\", "Backslash");
function Backslash(state: ParseState) {
  return Backslash$0(state);
}

const OpenBracket$0 = $R$0($EXPECT($R10, fail, "\\[[ \\t]*", "OpenBracket"));
function OpenBracket(state: ParseState) {
  return OpenBracket$0(state);
}

const CloseBracket$0 = $R$0($EXPECT($R11, fail, "\\][ \\t]*", "CloseBracket"));
function CloseBracket(state: ParseState) {
  return CloseBracket$0(state);
}

const OpenParenthesis$0 = $R$0($EXPECT($R12, fail, "\\([ \\t]*", "OpenParenthesis"));
function OpenParenthesis(state: ParseState) {
  return OpenParenthesis$0(state);
}

const CloseParenthesis$0 = $R$0($EXPECT($R13, fail, "[ \\t]*\\)", "CloseParenthesis"));
function CloseParenthesis(state: ParseState) {
  return CloseParenthesis$0(state);
}

const Indent$0 = $EXPECT($L8, fail, "  ", "Indent");
function Indent(state: ParseState) {
  return Indent$0(state);
}

const _$0 = $R$0($EXPECT($R14, fail, "[ \\t]+", "_"));
function _(state: ParseState) {
  return _$0(state);
}

const EOS$0 = $R$0($EXPECT($R15, fail, "([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", "EOS"));
function EOS(state: ParseState) {
  return EOS$0(state);
}

module.exports = {
  parse: parse
}
