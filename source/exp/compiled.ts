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

/**
 * Match a string literal.
 */
export function $L<T extends string>(str: T, fail: Fail): Parser<T> {
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

    fail(pos, str)
  }
}

/**
 * Match a regular expression (must be sticky).
 */
export function $R(regExp: RegExp, fail: Fail): Parser<RegExpMatchArray> {
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

    fail(pos, regExp)
  }
}



/** Choice
 * A / B / C / ...
 * Proioritized choice
 * roughly a(...) || b(...) in JS
 */
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

/** Sequence
 * A B C ...
 * A followed by by B followed by C followed by ...
 */
export function $S<T extends any[]>(...terms: { [I in keyof T]: Parser<T[I]> }): Parser<T> {
  return (state: ParseState) => {
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
  if (result) {
    //@ts-ignore
    result.value = result.value[0]
    //@ts-ignore
    return result
  }
}

export function defaultRegExpTransform(fn: Parser<RegExpMatchArray>): Parser<string> {
  return function (state) {
    return defaultRegExpHandler(fn(state));
  }
}

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

export interface ParserOptions {
  /** The name of the file being parsed */
  filename?: string
}

const failHintRegex = /\S+|\s+|$/y

export function parserState<T>(parser: Parser<T>) {
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

  // Pretty print a string or RegExp literal
  // TODO: could expand to all rules?
  // Includes looking up the name
  function prettyPrint(v: string | RegExp) {
    let pv;

    if (v instanceof RegExp) {
      const s = v.toString()
      // Would prefer to use -v.flags.length, but IE doesn't support .flags
      pv = s.slice(0, s.lastIndexOf('/') + 1)
    } else {
      pv = JSON.stringify(v)
    }

    const name = false; // _names.get(v)

    if (name) {
      return "#{name} #{pv}"
    } else {
      return pv
    }
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
    } else if (expectations.length) {
      failHintRegex.lastIndex = maxFailPos
      let [hint] = input.match(failHintRegex)!

      if (hint.length)
        hint = prettyPrint(hint)
      else
        hint = "EOF"

      throw new Error(`
${filename}:${l} Failed to parse
Expected:
\t${expectations.map(prettyPrint).join("\n\t")}
Found: ${hint}
`)
    } else if (result)
      throw new Error(`
Unconsumed input at ${l}

${input.slice(result.pos)}
`);
  }

  return {
    fail: fail,
    parse: (input: string, options: ParserOptions = {}) => {
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


const { parse, fail } = parserState(Grammar)

const $L0 = $L("/", fail);
const $L1 = $L(",", fail);
const $L2 = $L("\"", fail);
const $L3 = $L(".", fail);
const $L4 = $L("[", fail);
const $L5 = $L("]", fail);
const $L6 = $L("->", fail);
const $L7 = $L("\\", fail);
const $L8 = $L("  ", fail);

const $R0 = $R(new RegExp("[$&!]", 'suy'), fail);
const $R1 = $R(new RegExp("[+?*]", 'suy'), fail);
const $R2 = $R(new RegExp("[^\\n\\r]*", 'suy'), fail);
const $R3 = $R(new RegExp("\\d\\d?", 'suy'), fail);
const $R4 = $R(new RegExp("[^\"\\\\]+", 'suy'), fail);
const $R5 = $R(new RegExp(".", 'suy'), fail);
const $R6 = $R(new RegExp("[^\\/\\\\]+", 'suy'), fail);
const $R7 = $R(new RegExp("[^\\]\\\\]+", 'suy'), fail);
const $R8 = $R(new RegExp("[?+*]|\\{\\d+(,\\d+)?\\}", 'suy'), fail);
const $R9 = $R(new RegExp("[_a-zA-Z][_a-zA-Z0-9]*", 'suy'), fail);
const $R10 = $R(new RegExp("\\[[ \\t]*", 'suy'), fail);
const $R11 = $R(new RegExp("\\][ \\t]*", 'suy'), fail);
const $R12 = $R(new RegExp("\\([ \\t]*", 'suy'), fail);
const $R13 = $R(new RegExp("[ \\t]*\\)", 'suy'), fail);
const $R14 = $R(new RegExp("[ \\t]+", 'suy'), fail);
const $R15 = $R(new RegExp("([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", 'suy'), fail);

function Grammar_handler_fn<V extends any[]>($loc: Loc, $0: V, $1:V[0], $2:V[1]){return Object.fromEntries($2)}
function Grammar_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    //@ts-ignore
    result.value = Grammar_handler_fn(result.loc, result.value, ...result.value);
    return result as unknown as MaybeResult<ReturnType<typeof Grammar_handler_fn>>
  }
};
function Grammar(state: ParseState) {
  return Grammar_handler($S($Q(EOS), $P(Rule))(state));
}

function Rule_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<[V[0] /* 1 -1 */, V[2] /* 3 -1 */]> {
  if (result) {
    const { value } = result
    const mappedValue = [value[0] /* 1 -1 */, value[2] /* 3 -1 */]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Rule(state: ParseState) {
  return Rule_handler($S(Name, EOS, RuleBody)(state));
}

const RuleBody_handler = makeResultHandler(function($loc, $0, $1) {var r = $1.map((a) => a[1])
if (r.length === 1) return r[0];
return ["/", r]});
function RuleBody(state: ParseState) {
  return RuleBody_handler($P($S(Indent, Choice))(state));
}

function Choice_handler_fn<V extends any[]>($loc: Loc, $0: V, $1:V[0], $2:V[1]){if ($2 !== undefined) {
  if (!$1.push)
    $1 = ["S", [$1], $2]
  else
    $1.push($2)
}
return $1}
function Choice_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    //@ts-ignore
    result.value = Choice_handler_fn(result.loc, result.value, ...result.value);
    return result as unknown as MaybeResult<ReturnType<typeof Choice_handler_fn>>
  }
};
function Choice(state: ParseState) {
  return Choice_handler($S(Sequence, Handling)(state));
}

function Sequence_0_handler_fn<V extends any[]>($loc: Loc, $0: V, $1:V[0], $2:V[1]){$2.unshift($1)
return ["S", $2]}
function Sequence_0_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    //@ts-ignore
    result.value = Sequence_0_handler_fn(result.loc, result.value, ...result.value);
    return result as unknown as MaybeResult<ReturnType<typeof Sequence_0_handler_fn>>
  }
};
function Sequence_1_handler_fn<V extends any[]>($loc: Loc, $0: V, $1:V[0], $2:V[1]){$2.unshift($1)
return ["/", $2]}
function Sequence_1_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    //@ts-ignore
    result.value = Sequence_1_handler_fn(result.loc, result.value, ...result.value);
    return result as unknown as MaybeResult<ReturnType<typeof Sequence_1_handler_fn>>
  }
};

function Sequence(state: ParseState) {
  return Sequence_0_handler($S(Expression, $P(SequenceExpression))(state)) || Sequence_1_handler($S(Expression, $P(ChoiceExpression))(state)) || Expression(state)
}

function SequenceExpression_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[1] /* 2 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[1] /* 2 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function SequenceExpression(state: ParseState) {
  return SequenceExpression_handler($S(_, Expression)(state));
}

function ChoiceExpression_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[3] /* 4 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[3] /* 4 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function ChoiceExpression(state: ParseState) {
  return ChoiceExpression_handler($S(_, $L0, _, Expression)(state));
}


function Expression_1_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<[V[0] /* 1 -1 */, V[1] /* 2 -1 */]> {
  if (result) {
    const { value } = result
    const mappedValue = [value[0] /* 1 -1 */, value[1] /* 2 -1 */]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Expression(state: ParseState) {
  return Suffix(state) || Expression_1_handler($S(PrefixOperator, Suffix)(state))
}

function PrefixOperator(state: ParseState) {
  return defaultRegExpTransform($R0)(state);
}

function Suffix_0_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<[V[1] /* 2 -1 */, V[0] /* 1 -1 */]> {
  if (result) {
    const { value } = result
    const mappedValue = [value[1] /* 2 -1 */, value[0] /* 1 -1 */]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};

function Suffix(state: ParseState) {
  return Suffix_0_handler($S(Primary, SuffixOperator)(state)) || Primary(state)
}

function SuffixOperator(state: ParseState) {
  return defaultRegExpTransform($R1)(state);
}



function Primary_2_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[1] /* 2 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[1] /* 2 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Primary(state: ParseState) {
  return Name(state) || Literal(state) || Primary_2_handler($S(OpenParenthesis, Sequence, CloseParenthesis)(state))
}



function Literal(state: ParseState) {
  return StringLiteral(state) || RegExpLiteral(state)
}

function Handling_0_handler_fn<V extends any[]>($loc: Loc, $0: V, $1:V[0]){return undefined}
function Handling_0_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    //@ts-ignore
    result.value = Handling_0_handler_fn(result.loc, result.value, ...result.value);
    return result as unknown as MaybeResult<ReturnType<typeof Handling_0_handler_fn>>
  }
};
function Handling_1_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[2] /* 3 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[2] /* 3 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Handling(state: ParseState) {
  return Handling_0_handler($S(EOS)(state)) || Handling_1_handler($S($Q(_), Arrow, HandlingExpression)(state))
}

function HandlingExpression_0_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[1] /* 2 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[1] /* 2 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression_1_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[0] /* 1 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[0] /* 1 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression_2_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[0] /* 1 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[0] /* 1 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression(state: ParseState) {
  return HandlingExpression_0_handler($S(EOS, HandlingExpressionBody)(state)) || HandlingExpression_1_handler($S(StringValue, EOS)(state)) || HandlingExpression_2_handler($S(HandlingExpressionValue, EOS)(state))
}

const HandlingExpressionBody_handler = makeResultHandler(function($loc, $0, $1) {return {
  f: $1.join("\n")
}});
function HandlingExpressionBody(state: ParseState) {
  return HandlingExpressionBody_handler($P(HandlingExpressionLine)(state));
}

function HandlingExpressionLine_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[2] /* 3 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[2] /* 3 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpressionLine(state: ParseState) {
  return HandlingExpressionLine_handler($S(Indent, Indent, defaultRegExpTransform($R2), EOS)(state));
}


function HandlingExpressionValue_1_handler_fn<V extends any[]>($loc: Loc, $0: V, $1:V[0], $2:V[1], $3:V[2], $4:V[3]){$3.unshift($2); return $3}
function HandlingExpressionValue_1_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    //@ts-ignore
    result.value = HandlingExpressionValue_1_handler_fn(result.loc, result.value, ...result.value);
    return result as unknown as MaybeResult<ReturnType<typeof HandlingExpressionValue_1_handler_fn>>
  }
};
function HandlingExpressionValue(state: ParseState) {
  return RValue(state) || HandlingExpressionValue_1_handler($S(OpenBracket, RValue, $Q(CommaThenValue), CloseBracket)(state))
}


const RValue_1_handler = makeResultHandler_R(function($loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseInt($0, 10)});
function RValue(state: ParseState) {
  return StringValue(state) || RValue_1_handler($R3(state))
}

function CommaThenValue_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[3] /* 4 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[3] /* 4 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function CommaThenValue(state: ParseState) {
  return CommaThenValue_handler($S($Q(_), $L1, $Q(_), RValue, $Q(_))(state));
}

function StringValue_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[1] /* 2 -1 */> {
  if (result) {
    const { value } = result
    const mappedValue = value[1] /* 2 -1 */

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function StringValue(state: ParseState) {
  return StringValue_handler($S($L2, $TEXT($Q(DoubleStringCharacter)), $L2)(state));
}



function DoubleStringCharacter(state: ParseState) {
  return defaultRegExpTransform($R4)(state) || EscapeSequence(state)
}

function EscapeSequence(state: ParseState) {
  return $TEXT($S(Backslash, defaultRegExpTransform($R5)))(state);
}

function StringLiteral_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<["L", V[0] /* 1 -1 */]> {
  if (result) {
    const { value } = result
    const mappedValue = ["L", value[0] /* 1 -1 */]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function StringLiteral(state: ParseState) {
  return StringLiteral_handler($S(StringValue)(state));
}

function RegExpLiteral_0_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<["R", V[2] /* 3 -1 */]> {
  if (result) {
    const { value } = result
    const mappedValue = ["R", value[2] /* 3 -1 */]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function RegExpLiteral_1_handler<V>(result: MaybeResult<V>): MaybeResult<["R", V]> {
  if (result) {
    const { value } = result
    const mappedValue = ["R", value]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function RegExpLiteral_2_handler<V>(result: MaybeResult<V>): MaybeResult<["R", V]> {
  if (result) {
    const { value } = result
    const mappedValue = ["R", value]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function RegExpLiteral(state: ParseState) {
  return RegExpLiteral_0_handler($S($L0, $N(_), $TEXT($Q(RegExpCharacter)), $L0)(state)) || RegExpLiteral_1_handler($TEXT(CharacterClassExpression)(state)) || RegExpLiteral_2_handler($L3(state))
}

function CharacterClassExpression(state: ParseState) {
  return $P(CharacterClass)(state);
}



function RegExpCharacter(state: ParseState) {
  return defaultRegExpTransform($R6)(state) || EscapeSequence(state)
}

function CharacterClass(state: ParseState) {
  return $S($L4, $Q(CharacterClassCharacter), $L5, $E(Quantifier))(state);
}



function CharacterClassCharacter(state: ParseState) {
  return defaultRegExpTransform($R7)(state) || EscapeSequence(state)
}

function Quantifier(state: ParseState) {
  return defaultRegExpTransform($R8)(state);
}

function Name(state: ParseState) {
  return defaultRegExpTransform($R9)(state);
}

function Arrow(state: ParseState) {
  return $S($L6, $Q(_))(state);
}

function Backslash(state: ParseState) {
  return $L7(state);
}

function OpenBracket(state: ParseState) {
  return defaultRegExpTransform($R10)(state);
}

function CloseBracket(state: ParseState) {
  return defaultRegExpTransform($R11)(state);
}

function OpenParenthesis(state: ParseState) {
  return defaultRegExpTransform($R12)(state);
}

function CloseParenthesis(state: ParseState) {
  return defaultRegExpTransform($R13)(state);
}

function Indent(state: ParseState) {
  return $L8(state);
}

function _(state: ParseState) {
  return defaultRegExpTransform($R14)(state);
}

function EOS(state: ParseState) {
  return defaultRegExpTransform($R15)(state);
}

module.exports = {
  parse: parse,

}