import {
  $L, $R, $C, $S, $E, $P, $Q, $N, $Y,
  Loc,
  MaybeResult,
  ParseState,
  defaultRegExpTransform,
  makeResultHandler_R,
  makeResultHandler,
  parse as heraParse,
} from "./machine"

const $l0 = "/";
function $L0(state: ParseState) { return $L(state, $l0) }
const $l1 = ",";
function $L1(state: ParseState) { return $L(state, $l1) }
const $l2 = "\"";
function $L2(state: ParseState) { return $L(state, $l2) }
const $l3 = "[";
function $L3(state: ParseState) { return $L(state, $l3) }
const $l4 = "]";
function $L4(state: ParseState) { return $L(state, $l4) }
const $l5 = "->";
function $L5(state: ParseState) { return $L(state, $l5) }
const $l6 = "\\";
function $L6(state: ParseState) { return $L(state, $l6) }
const $l7 = "  ";
function $L7(state: ParseState) { return $L(state, $l7) }

const $r0 = new RegExp("[&!]", 'suy');
function $R0(state: ParseState) { return $R(state, $r0) }
const $r1 = new RegExp("[+?*]", 'suy');
function $R1(state: ParseState) { return $R(state, $r1) }
const $r2 = new RegExp("[^\\n\\r]*", 'suy');
function $R2(state: ParseState) { return $R(state, $r2) }
const $r3 = new RegExp("\\d\\d?", 'suy');
function $R3(state: ParseState) { return $R(state, $r3) }
const $r4 = new RegExp("[^\"\\\\]+", 'suy');
function $R4(state: ParseState) { return $R(state, $r4) }
const $r5 = new RegExp("[^]", 'suy');
function $R5(state: ParseState) { return $R(state, $r5) }
const $r6 = new RegExp("[^\\/\\\\]+", 'suy');
function $R6(state: ParseState) { return $R(state, $r6) }
const $r7 = new RegExp("[^\\]\\\\]+", 'suy');
function $R7(state: ParseState) { return $R(state, $r7) }
const $r8 = new RegExp("[?+*]|\\{\\d+(,\\d+)?\\}", 'suy');
function $R8(state: ParseState) { return $R(state, $r8) }
const $r9 = new RegExp("[_a-zA-Z][_a-zA-Z0-9]*", 'suy');
function $R9(state: ParseState) { return $R(state, $r9) }
const $r10 = new RegExp("\\[[ \\t]*", 'suy');
function $R10(state: ParseState) { return $R(state, $r10) }
const $r11 = new RegExp("\\][ \\t]*", 'suy');
function $R11(state: ParseState) { return $R(state, $r11) }
const $r12 = new RegExp("\\([ \\t]*", 'suy');
function $R12(state: ParseState) { return $R(state, $r12) }
const $r13 = new RegExp("[ \\t]*\\)", 'suy');
function $R13(state: ParseState) { return $R(state, $r13) }
const $r14 = new RegExp("[ \\t]+", 'suy');
function $R14(state: ParseState) { return $R(state, $r14) }
const $r15 = new RegExp("([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", 'suy');
function $R15(state: ParseState) { return $R(state, $r15) }

function Grammar_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1]) { return Object.fromEntries($2) }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function Grammar(state: ParseState) {
  return Grammar_handler($S($Q(EOS), $P(Rule))(state));
}

function Rule_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<[V[0], V[2]]> {
  if (result) {
    const { value } = result
    const mappedValue = [value[0], value[2]]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Rule(state: ParseState) {
  return Rule_handler($S(Name, EOS, RuleBody)(state));
}

const RuleBody_handler = makeResultHandler(function ($loc, $0, $1) {
  var r = $1.map((a: any) => a[1])
  if (r.length === 1) return r[0];
  return ["/", r]
});
function RuleBody(state: ParseState) {
  return RuleBody_handler($P($S(Indent, Choice))(state));
}

function Choice_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1]) {
      if ($2 !== undefined) {
        if (!$1.push)
          $1 = ["S", [$1], $2]
        else
          $1.push($2)
      }
      return $1
    }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function Choice(state: ParseState) {
  return Choice_handler($S(Sequence, Handling)(state));
}

function Sequence_0_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1]) {
      $2.unshift($1)
      return ["S", $2]
    }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function Sequence_1_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1]) {
      $2.unshift($1)
      return ["/", $2]
    }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};

function Sequence(state: ParseState) {
  return Sequence_0_handler($S(Expression, $P(SequenceExpression))(state)) || Sequence_1_handler($S(Expression, $P(ChoiceExpression))(state)) || Expression(state)
}

function SequenceExpression_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[1]> {
  if (result) {
    const { value } = result
    const mappedValue = value[1]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function SequenceExpression(state: ParseState) {
  return SequenceExpression_handler($S(_, Expression)(state));
}

function ChoiceExpression_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[3]> {
  if (result) {
    const { value } = result
    const mappedValue = value[3]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function ChoiceExpression(state: ParseState) {
  return ChoiceExpression_handler($S(_, $L0, _, Expression)(state));
}


function Expression_1_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<[V[0], V[1]]> {
  if (result) {
    const { value } = result
    const mappedValue = [value[0], value[1]]

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

function Suffix_0_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<[V[1], V[0]]> {
  if (result) {
    const { value } = result
    const mappedValue = [value[1], value[0]]

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



function Primary_2_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[1]> {
  if (result) {
    const { value } = result
    const mappedValue = value[1]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Primary(state: ParseState): MaybeResult<any> {
  return Name(state) || Literal(state) || Primary_2_handler($S(OpenParenthesis, Sequence, CloseParenthesis)(state))
}



function Literal(state: ParseState) {
  return StringLiteral(state) || RegExpLiteral(state)
}

function Handling_0_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0]) { return undefined }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function Handling_1_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[2]> {
  if (result) {
    const { value } = result
    const mappedValue = value[2]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Handling(state: ParseState) {
  return Handling_0_handler($S(EOS)(state)) || Handling_1_handler($S($Q(_), Arrow, HandlingExpression)(state))
}

function HandlingExpression_0_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[1]> {
  if (result) {
    const { value } = result
    const mappedValue = value[1]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression_1_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[0]> {
  if (result) {
    const { value } = result
    const mappedValue = value[0]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression_2_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[0]> {
  if (result) {
    const { value } = result
    const mappedValue = value[0]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression(state: ParseState) {
  return HandlingExpression_0_handler($S(EOS, HandlingExpressionBody)(state)) || HandlingExpression_1_handler($S(StringValue, EOS)(state)) || HandlingExpression_2_handler($S(HandlingExpressionValue, EOS)(state))
}

const HandlingExpressionBody_handler = makeResultHandler(function ($loc, $0, $1) {
  return {
    f: $1.join("\n")
  }
});
function HandlingExpressionBody(state: ParseState) {
  return HandlingExpressionBody_handler($P(HandlingExpressionLine)(state));
}

function HandlingExpressionLine_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[2]> {
  if (result) {
    const { value } = result
    const mappedValue = value[2]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpressionLine(state: ParseState) {
  return HandlingExpressionLine_handler($S(Indent, Indent, defaultRegExpTransform($R2), EOS)(state));
}


function HandlingExpressionValue_1_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1], $3: V[2], $4: V[3]) { $3.unshift($2); return $3 }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function HandlingExpressionValue(state: ParseState) {
  return RValue(state) || HandlingExpressionValue_1_handler($S(OpenBracket, RValue, $Q(CommaThenValue), CloseBracket)(state))
}


const RValue_1_handler = makeResultHandler_R(function ($loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) { return parseInt($0, 10) });
function RValue(state: ParseState) {
  return StringValue(state) || RValue_1_handler($R3(state))
}

function CommaThenValue_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<V[3]> {
  if (result) {
    const { value } = result
    const mappedValue = value[3]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function CommaThenValue(state: ParseState) {
  return CommaThenValue_handler($S($Q(_), $L1, $Q(_), RValue, $Q(_))(state));
}

function StringValue_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1], $3: V[2]) { return $2.join('') }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function StringValue(state: ParseState) {
  return StringValue_handler($S($L2, $Q(DoubleStringCharacter), $L2)(state));
}



function DoubleStringCharacter(state: ParseState) {
  return defaultRegExpTransform($R4)(state) || EscapeSequence(state)
}

function EscapeSequence_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1]) { return '\\' + $2 }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function EscapeSequence(state: ParseState) {
  return EscapeSequence_handler($S(Backslash, defaultRegExpTransform($R5))(state));
}

function StringLiteral_handler<V extends any[]>(result: MaybeResult<V>): MaybeResult<["L", V[0]]> {
  if (result) {
    const { value } = result
    const mappedValue = ["L", value[0]]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function StringLiteral(state: ParseState) {
  return StringLiteral_handler($S(StringValue)(state));
}

function RegExpLiteral_0_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1], $3: V[2], $4: V[3]) { return ["R", $3.join('')] }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};

function RegExpLiteral(state: ParseState) {
  return RegExpLiteral_0_handler($S($L0, $N(_), $Q(RegExpCharacter), $L0)(state)) || CharacterClassExpression(state)
}

const CharacterClassExpression_handler = makeResultHandler(function ($loc, $0, $1) { return ["R", $1.join('')] });
function CharacterClassExpression(state: ParseState) {
  return CharacterClassExpression_handler($P(CharacterClass)(state));
}



function RegExpCharacter(state: ParseState) {
  return defaultRegExpTransform($R6)(state) || EscapeSequence(state)
}

function CharacterClass_handler<V extends any[]>(result: MaybeResult<V>) {
  if (result) {
    function fn($loc: Loc, $0: V, $1: V[0], $2: V[1], $3: V[2], $4: V[3]) { return "[" + $2.join('') + "]" + ($4 || "") }

    //@ts-ignore
    result.value = fn(result.loc, result.value, ...result.value);

    return result as unknown as MaybeResult<ReturnType<typeof fn>>
  }
};
function CharacterClass(state: ParseState) {
  return CharacterClass_handler($S($L3, $Q(CharacterClassCharacter), $L4, $E(Quantifier))(state));
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
  return $S($L5, $Q(_))(state);
}

function Backslash(state: ParseState) {
  return $L6(state);
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
  return $L7(state);
}

function _(state: ParseState) {
  return defaultRegExpTransform($R14)(state);
}

function EOS(state: ParseState) {
  return defaultRegExpTransform($R15)(state);
}

export function parse(input: string) {
  return heraParse(Grammar, input);
}
