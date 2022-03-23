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

export type PositionalVariable = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type StructuralTerminal = string | number | { v: PositionalVariable }
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

export function $EXPECT<T>(parser: Parser<T>, fail: Fail, expectation: string): Parser<T> {
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

const failHintRegex = /\S+|\s+|$/y

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
        hint = JSON.stringify(hint)
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
