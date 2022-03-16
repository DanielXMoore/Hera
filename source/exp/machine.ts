export interface Loc {
  pos: number
  length: number
}

export interface ParseState {
  input: string
  pos: number
}

export interface ParseResult<T> {
  loc: Loc,
  pos: number,
  value: T,
}

export type MaybeResult<T> = ParseResult<T> | undefined

export interface Parser<T> {
  (state: ParseState): MaybeResult<T>
}

// Error tracking
// Goal is zero allocations
const failExpected = Array(16)
let failIndex = 0
const failHintRegex = /\S+|[^\S]+|$/y
let maxFailPos = 0

export function $fail(pos, expected) {
  if (pos < maxFailPos) return

  if (pos > maxFailPos) {
    maxFailPos = pos
    failIndex = 0
  }

  failExpected[failIndex++] = expected

  return
}

export function $L(state: ParseState, str: string): MaybeResult<string> {
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

  $fail(pos, str)
}

export function $R(state: ParseState, regExp: RegExp): MaybeResult<string[]> {
  const { input, pos } = state
  regExp.lastIndex = state.pos

  let l, m: RegExpMatchArray, v

  if (m = input.match(regExp)) {
    v = m[0]
  }

  if (v != undefined) {
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

  $fail(pos, regExp)
}

// a / b / c / ...
// Proioritized choice
// roughly a(...) || b(...) in JS, generalized to reduce, optimized to loop

export function $C(): undefined
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
  return (state: ParseState) => {
    let i = 0
    const l = terms.length

    while (i < l) {
      const r = terms[i++](state);
      if (r) return r
    }

    return
  }
}

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
  return (state: ParseState) => {
    let { input, pos } = state
    let i = 0, value
    const results = [] as T, s = pos, l = terms.length

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

// a*
// NOTE: zero length repetitions (where position doesn't advance) return
// an empty array of values. A repetition where the position doesn't advance
// would be an infinite loop, so this avoids that problem cleanly.
// TODO: Think through how this interacts with & and ! predicates
export function $Q<T>(fn: Parser<T>): Parser<T[]> {
  return (state) => {
    let { input, pos } = state
    let value

    const s = pos
    const results = []

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

// a + one or more
export function $P<T>(fn: Parser<T>): Parser<T[]> {
  return (state: ParseState) => {
    const { input, pos: s } = state
    let value

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
export function $Y(fn: Parser<unknown>): Parser<undefined> {
  return (state: ParseState) => {
    const newState = fn(state)

    // If the assertion doesn't advance the position then it is failed.
    // A zero width assertion always succeeds and is useless
    if (!newState || (newState.pos === state.pos)) return

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

// Result handler for sequence expressions
// $0 is the whole array followed by first element as $1, second element as $2, etc.
// export function makeResultHandler_S<A, B, C, S extends [A, B, C], T>(fn: ($loc: Loc, $0: S, $1: A, $2: B, $3: C)): (result: MaybeResult<S>) => (MaybeResult<T>)

export function makeResultHandler_S<S extends any[], T>(fn: ($loc: Loc, $0: S, ...args: S) => T): (result: MaybeResult<S>) => (MaybeResult<T>) {
  return function (result) {
    if (result) {
      const { loc, value } = result
      const mappedValue = fn(loc, value, ...value)

      //@ts-ignore
      result.value = mappedValue
      return result as unknown as ParseResult<T>
    }
  }
}

// Result handler for regexp match expressions
// $0 is the whole match, followed by $1, $2, etc.
export function makeResultHandler_R<T>(fn: ($loc: Loc, ...args: string[]) => T): (result: MaybeResult<string[]>) => (MaybeResult<T>) {
  return function (result) {
    if (result) {
      const { loc, value } = result
      const mappedValue = fn(loc, ...value)

      //@ts-ignore
      result.value = mappedValue
      return result as unknown as ParseResult<T>
    }
  }
}

// Result handler for all other kinds, $loc, $0 and $1 are both the value
export function makeResultHandler<B>(fn: ($loc: Loc, $0: any, $1: any) => B): (result: MaybeResult<any>) => (MaybeResult<B>) {
  return function (result) {
    if (result) {
      const { loc, value } = result
      const mappedValue = fn(loc, value, value)

      //@ts-ignore
      result.value = mappedValue
      return result as unknown as ParseResult<B>
    }
  }
}

// Identity handler, probably not actually needed
export function defaultHandler<T>(result: MaybeResult<T>): MaybeResult<T> {
  return result
}

export function defaultRegExpHandler(result: MaybeResult<RegExpMatchArray>): MaybeResult<string> {
  if (result) return result[0]
}

export function makeStructuralHandler<A extends number[], T extends any[]>(mapping: A): (result: MaybeResult<T>) => MaybeResult<T[number][]>
export function makeStructuralHandler<S extends string, N extends number, A extends [S, N], T extends any[]>(mapping: A): (result: MaybeResult<T>) => MaybeResult<[S, T[N]]>
export function makeStructuralHandler<N extends number, T extends any[]>(mapping: N): (result: MaybeResult<T>) => MaybeResult<T[N]>
export function makeStructuralHandler<S extends string>(mapping: S): (result: MaybeResult<unknown>) => MaybeResult<S>

export function makeStructuralHandler<A, B>(mapping: typeof mapValue): (result: MaybeResult<A>) => MaybeResult<B> {
  return function (result) {
    if (result) {
      const { value } = result
      const mappedValue = mapValue(mapping, value)

      //@ts-ignore
      result.value = mappedValue
      return result as unknown as ParseResult<B>
    }
  }
}

export function mapValue<T>(mapping: undefined, value: T): T
export function mapValue<T extends string>(mapping: T, value: unknown): T
export function mapValue<T extends any[]>(mapping: number, value: T): T[number]
export function mapValue<A extends any[], T extends any[]>(mapping: A, value: T): any[]
export function mapValue<S extends string, N extends number, T extends any[]>(mapping: [S, N], value: T): [S, T[N]]
export function mapValue(mapping: any, value: any): any

export function mapValue(mapping, value) {
  switch (typeof mapping) {
    case "number":
      return value[mapping]
    case "string":
      return mapping
    case "object":
      if (Array.isArray(mapping))
        return mapping.map((n) => mapValue(n, value))
      throw new Error("non-array object mapping")
    case "undefined":
      return value
    default:
      throw new Error("Unknown mapping type")
  }
}
