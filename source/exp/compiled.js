"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserState = exports.defaultRegExpTransform = exports.defaultRegExpHandler = exports.defaultHandler = exports.makeResultHandler = exports.makeResultHandler_R = exports.makeResultHandler_S = exports.$Y = exports.$N = exports.$TEXT = exports.$P = exports.$Q = exports.$E = exports.$S = exports.$C = exports.$R = exports.$L = exports.$EXPECT = void 0;
function $EXPECT(parser, fail, t, name) {
    var expectation = prettyPrint(t, name);
    return function (state) {
        var result = parser(state);
        if (result)
            return result;
        var pos = state.pos;
        fail(pos, expectation);
    };
}
exports.$EXPECT = $EXPECT;
/**
 * Match a string literal.
 */
function $L(str) {
    return function (state) {
        var input = state.input, pos = state.pos;
        var length = str.length;
        if (input.substr(pos, length) === str) {
            return {
                loc: {
                    pos: pos,
                    length: length
                },
                pos: pos + length,
                value: str
            };
        }
    };
}
exports.$L = $L;
/**
 * Match a regular expression (must be sticky).
 */
function $R(regExp) {
    return function (state) {
        var input = state.input, pos = state.pos;
        regExp.lastIndex = state.pos;
        var l, m, v;
        if (m = input.match(regExp)) {
            v = m[0];
            l = v.length;
            return {
                loc: {
                    pos: pos,
                    length: l,
                },
                pos: pos + l,
                value: m,
            };
        }
    };
}
exports.$R = $R;
/** Choice
 * A / B / C / ...
 * Proioritized choice
 * roughly a(...) || b(...) in JS
 */
function $C() {
    var terms = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        terms[_i] = arguments[_i];
    }
    return function (state) {
        var i = 0;
        var l = terms.length;
        while (i < l) {
            var r = terms[i++](state);
            if (r)
                return r;
        }
        return;
    };
}
exports.$C = $C;
/** Sequence
 * A B C ...
 * A followed by by B followed by C followed by ...
 */
function $S() {
    var terms = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        terms[_i] = arguments[_i];
    }
    return function (state) {
        var input = state.input, pos = state.pos, i = 0, value;
        var results = [], s = pos, l = terms.length;
        while (i < l) {
            var r = terms[i++]({ input: input, pos: pos });
            if (r) {
                (pos = r.pos, value = r.value);
                results.push(value);
            }
            else
                return;
        }
        return {
            loc: {
                pos: s,
                length: pos - s,
            },
            pos: pos,
            value: results,
        };
    };
}
exports.$S = $S;
// a? zero or one
function $E(fn) {
    return function (state) {
        var r = fn(state);
        if (r)
            return r;
        var pos = state.pos;
        return {
            loc: {
                pos: pos,
                length: 0
            },
            pos: pos,
            value: undefined
        };
    };
}
exports.$E = $E;
// *
// NOTE: zero length repetitions (where position doesn't advance) return
// an empty array of values. A repetition where the position doesn't advance
// would be an infinite loop, so this avoids that problem cleanly.
// Since this always returns a result `&x*` will always succeed and `!x*` will
// always fail. Same goes for `&x?` and `!x?`. Relatedly `&x+ == &x` and
// `!x+ == !x`.
function $Q(fn) {
    return function (state) {
        var input = state.input, pos = state.pos;
        var value;
        var s = pos;
        var results = [];
        while (true) {
            var prevPos = pos;
            var r = fn({ input: input, pos: pos });
            if (r == undefined)
                break;
            (pos = r.pos, value = r.value);
            if (pos === prevPos)
                break;
            else
                results.push(value);
        }
        return {
            loc: {
                pos: s,
                length: pos - s,
            },
            pos: pos,
            value: results
        };
    };
}
exports.$Q = $Q;
// + one or more
function $P(fn) {
    return function (state) {
        var input = state.input, s = state.pos;
        var value;
        var first = fn(state);
        if (!first)
            return;
        var pos = first.pos;
        var results = [first.value];
        while (true) {
            var prevPos = pos;
            var r = fn({ input: input, pos: pos });
            if (!r)
                break;
            (pos = r.pos, value = r.value);
            if (pos === prevPos)
                break;
            results.push(value);
        }
        return {
            loc: {
                pos: s,
                length: pos - s,
            },
            value: results,
            pos: pos
        };
    };
}
exports.$P = $P;
// $ prefix operator, convert result value to a string spanning the
// matched input
function $TEXT(fn) {
    return function (state) {
        var newState = fn(state);
        if (!newState)
            return;
        newState.value = state.input.substring(state.pos, newState.pos);
        return newState;
    };
}
exports.$TEXT = $TEXT;
// ! prefix operator
function $N(fn) {
    return function (state) {
        var newState = fn(state);
        if (newState)
            return;
        return {
            loc: {
                pos: state.pos,
                length: 0,
            },
            value: undefined,
            pos: state.pos,
        };
    };
}
exports.$N = $N;
// & prefix operator
function $Y(fn) {
    return function (state) {
        var newState = fn(state);
        if (!newState)
            return;
        return {
            loc: {
                pos: state.pos,
                length: 0,
            },
            value: undefined,
            pos: state.pos,
        };
    };
}
exports.$Y = $Y;
// Result handler for sequence expressions
// $0 is the whole array followed by first element as $1, second element as $2, etc.
// export function makeResultHandler_S<A, B, C, S extends [A, B, C], T>(fn: ($loc: Loc, $0: S, $1: A, $2: B, $3: C)): (result: MaybeResult<S>) => (MaybeResult<T>)
function makeResultHandler_S(fn) {
    return function (result) {
        if (result) {
            var loc = result.loc, value = result.value;
            var mappedValue = fn.apply(void 0, __spreadArray([loc, value], value, false));
            //@ts-ignore
            result.value = mappedValue;
            return result;
        }
    };
}
exports.makeResultHandler_S = makeResultHandler_S;
// Result handler for regexp match expressions
// $0 is the whole match, followed by $1, $2, etc.
function makeResultHandler_R(fn) {
    return function (result) {
        if (result) {
            var loc = result.loc, value = result.value;
            var mappedValue = fn.apply(void 0, __spreadArray([loc], value, false));
            //@ts-ignore
            result.value = mappedValue;
            return result;
        }
    };
}
exports.makeResultHandler_R = makeResultHandler_R;
// Result handler for all other kinds, $loc, $0 and $1 are both the value
function makeResultHandler(fn) {
    return function (result) {
        if (result) {
            var loc = result.loc, value = result.value;
            var mappedValue = fn(loc, value, value);
            //@ts-ignore
            result.value = mappedValue;
            return result;
        }
    };
}
exports.makeResultHandler = makeResultHandler;
// Identity handler, probably not actually needed
function defaultHandler(result) {
    return result;
}
exports.defaultHandler = defaultHandler;
function defaultRegExpHandler(result) {
    if (result) {
        //@ts-ignore
        result.value = result.value[0];
        //@ts-ignore
        return result;
    }
}
exports.defaultRegExpHandler = defaultRegExpHandler;
function defaultRegExpTransform(fn) {
    return function (state) {
        return defaultRegExpHandler(fn(state));
    };
}
exports.defaultRegExpTransform = defaultRegExpTransform;
/** Utility function to convert position in a string input to line:colum */
function location(input, pos) {
    var _a = input.split(/\n|\r\n|\r/).reduce(function (_a, line) {
        var row = _a[0], col = _a[1];
        var l = line.length + 1;
        if (pos > l) {
            pos -= l;
            return [row + 1, 1];
        }
        else if (pos >= 0) {
            col += pos;
            pos = -1;
            return [row, col];
        }
        else {
            return [row, col];
        }
    }, [1, 1]), line = _a[0], column = _a[1];
    return "".concat(line, ":").concat(column);
}
var failHintRegex = /\S+|\s+|$/y;
/**
 * Pretty print a string or RegExp literal
 */
function prettyPrint(t, name) {
    var pv;
    if (t instanceof RegExp) {
        // Ignore case is the only external flag that may be allowed so far
        var s = t.toString();
        var flags = t.ignoreCase ? "i" : "";
        pv = s.slice(0, -t.flags.length) + flags;
    }
    else {
        pv = JSON.stringify(t);
    }
    if (name) {
        return "".concat(name, " ").concat(pv);
    }
    else {
        return pv;
    }
}
function parserState(grammar) {
    // Error tracking
    // Goal is zero allocations
    var failExpected = Array(16);
    var failIndex = 0;
    var maxFailPos = 0;
    function fail(pos, expected) {
        if (pos < maxFailPos)
            return;
        if (pos > maxFailPos) {
            maxFailPos = pos;
            failExpected.length = failIndex = 0;
        }
        failExpected[failIndex++] = expected;
        return;
    }
    function validate(input, result, _a) {
        var filename = _a.filename;
        if (result && result.pos === input.length)
            return result.value;
        var expectations = Array.from(new Set(failExpected.slice(0, failIndex)));
        var l = location(input, maxFailPos);
        // The parse completed with a result but there is still input
        if (result && result.pos > maxFailPos) {
            l = location(input, result.pos);
            throw new Error("\n".concat(filename, ":").concat(l, " Unconsumed input at #{l}\n\n").concat(input.slice(result.pos), "\n    "));
        }
        else if (expectations.length) {
            failHintRegex.lastIndex = maxFailPos;
            var hint = input.match(failHintRegex)[0];
            if (hint.length)
                hint = prettyPrint(hint);
            else
                hint = "EOF";
            throw new Error("\n".concat(filename, ":").concat(l, " Failed to parse\nExpected:\n\t").concat(expectations.join("\n\t"), "\nFound: ").concat(hint, "\n"));
        }
        else if (result)
            throw new Error("\nUnconsumed input at ".concat(l, "\n\n").concat(input.slice(result.pos), "\n"));
    }
    return {
        fail: fail,
        parse: function (input, options) {
            if (options === void 0) { options = {}; }
            if (typeof input !== "string")
                throw new Error("Input must be a string");
            var parser = (options.startRule != null)
                ? grammar[options.startRule]
                : Object.values(grammar)[0];
            if (!parser)
                throw new Error("Could not find rule with name '#{opts.startRule}'");
            var filename = options.filename || "<anonymous>";
            failIndex = 0;
            maxFailPos = 0;
            failExpected.length = 0;
            return validate(input, parser({ input: input, pos: 0 }), {
                filename: filename
            });
        }
    };
}
exports.parserState = parserState;


const { parse, fail } = parserState({
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

function Grammar_handler_fn($loc, $0, $1, $2){return Object.fromEntries($2)}
function Grammar_handler(result) {
  if (result) {
    //@ts-ignore
    result.value = Grammar_handler_fn(result.loc, result.value, ...result.value);
    return result
  }
};
const Grammar$0 = $S($Q(EOS), $P(Rule));
function Grammar(state) {
  return Grammar_handler(Grammar$0(state));
}

function Rule_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = [value[0], value[2]]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
const Rule$0 = $S(Name, EOS, RuleBody);
function Rule(state) {
  return Rule_handler(Rule$0(state));
}

const RuleBody_handler = makeResultHandler(function($loc, $0, $1) {var r = $1.map((a) => a[1])
if (r.length === 1) return r[0];
return ["/", r]});
const RuleBody$0 = $P($S(Indent, Choice));
function RuleBody(state) {
  return RuleBody_handler(RuleBody$0(state));
}

function Choice_handler_fn($loc, $0, $1, $2){if ($2 !== undefined) {
  if (!$1.push)
    $1 = ["S", [$1], $2]
  else
    $1.push($2)
}
return $1}
function Choice_handler(result) {
  if (result) {
    //@ts-ignore
    result.value = Choice_handler_fn(result.loc, result.value, ...result.value);
    return result
  }
};
const Choice$0 = $S(Sequence, Handling);
function Choice(state) {
  return Choice_handler(Choice$0(state));
}

function Sequence_0_handler_fn($loc, $0, $1, $2){$2.unshift($1)
return ["S", $2]}
function Sequence_0_handler(result) {
  if (result) {
    //@ts-ignore
    result.value = Sequence_0_handler_fn(result.loc, result.value, ...result.value);
    return result
  }
};
function Sequence_1_handler_fn($loc, $0, $1, $2){$2.unshift($1)
return ["/", $2]}
function Sequence_1_handler(result) {
  if (result) {
    //@ts-ignore
    result.value = Sequence_1_handler_fn(result.loc, result.value, ...result.value);
    return result
  }
};

function Sequence(state) {
  return Sequence_0_handler($S(Expression, $P(SequenceExpression))(state)) || Sequence_1_handler($S(Expression, $P(ChoiceExpression))(state)) || Expression(state)
}

function SequenceExpression_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[1]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
const SequenceExpression$0 = $S(_, Expression);
function SequenceExpression(state) {
  return SequenceExpression_handler(SequenceExpression$0(state));
}

function ChoiceExpression_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[3]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
const ChoiceExpression$0 = $S(_, $EXPECT($L0, fail, "/", "ChoiceExpression"), _, Expression);
function ChoiceExpression(state) {
  return ChoiceExpression_handler(ChoiceExpression$0(state));
}


function Expression_1_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = [value[0], value[1]]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Expression(state) {
  return Suffix(state) || Expression_1_handler($S(PrefixOperator, Suffix)(state))
}

const PrefixOperator$0 = defaultRegExpTransform($EXPECT($R0, fail, "[$&!]", "PrefixOperator"))
function PrefixOperator(state) {
  return PrefixOperator$0(state);
}

function Suffix_0_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = [value[1], value[0]]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};

function Suffix(state) {
  return Suffix_0_handler($S(Primary, SuffixOperator)(state)) || Primary(state)
}

const SuffixOperator$0 = defaultRegExpTransform($EXPECT($R1, fail, "[+?*]", "SuffixOperator"))
function SuffixOperator(state) {
  return SuffixOperator$0(state);
}



function Primary_2_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[1]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Primary(state) {
  return Name(state) || Literal(state) || Primary_2_handler($S(OpenParenthesis, Sequence, CloseParenthesis)(state))
}



function Literal(state) {
  return StringLiteral(state) || RegExpLiteral(state)
}

function Handling_0_handler_fn($loc, $0, $1){return undefined}
function Handling_0_handler(result) {
  if (result) {
    //@ts-ignore
    result.value = Handling_0_handler_fn(result.loc, result.value, ...result.value);
    return result
  }
};
function Handling_1_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[2]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function Handling(state) {
  return Handling_0_handler($S(EOS)(state)) || Handling_1_handler($S($Q(_), Arrow, HandlingExpression)(state))
}

function HandlingExpression_0_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[1]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression_1_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[0]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression_2_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[0]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function HandlingExpression(state) {
  return HandlingExpression_0_handler($S(EOS, HandlingExpressionBody)(state)) || HandlingExpression_1_handler($S(StringValue, EOS)(state)) || HandlingExpression_2_handler($S(HandlingExpressionValue, EOS)(state))
}

const HandlingExpressionBody_handler = makeResultHandler(function($loc, $0, $1) {return {
  f: $1.join("\n")
}});
const HandlingExpressionBody$0 = $P(HandlingExpressionLine);
function HandlingExpressionBody(state) {
  return HandlingExpressionBody_handler(HandlingExpressionBody$0(state));
}

function HandlingExpressionLine_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[2]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
const HandlingExpressionLine$0 = $S(Indent, Indent, $EXPECT($R2, fail, "[^\\n\\r]*", "HandlingExpressionLine"), EOS);
function HandlingExpressionLine(state) {
  return HandlingExpressionLine_handler(HandlingExpressionLine$0(state));
}


function HandlingExpressionValue_1_handler_fn($loc, $0, $1, $2, $3, $4){$3.unshift($2); return $3}
function HandlingExpressionValue_1_handler(result) {
  if (result) {
    //@ts-ignore
    result.value = HandlingExpressionValue_1_handler_fn(result.loc, result.value, ...result.value);
    return result
  }
};
function HandlingExpressionValue(state) {
  return RValue(state) || HandlingExpressionValue_1_handler($S(OpenBracket, RValue, $Q(CommaThenValue), CloseBracket)(state))
}


const RValue_1_handler = makeResultHandler_R(function($loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseInt($0, 10)});
function RValue(state) {
  return StringValue(state) || RValue_1_handler($EXPECT($R3, fail, "\\d\\d?", "RValue")(state))
}

function CommaThenValue_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[3]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
const CommaThenValue$0 = $S($Q(_), $EXPECT($L1, fail, ",", "CommaThenValue"), $Q(_), RValue, $Q(_));
function CommaThenValue(state) {
  return CommaThenValue_handler(CommaThenValue$0(state));
}

function StringValue_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = value[1]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
const StringValue$0 = $S($EXPECT($L2, fail, "\\\"", "StringValue"), $TEXT($Q(DoubleStringCharacter)), $EXPECT($L2, fail, "\\\"", "StringValue"));
function StringValue(state) {
  return StringValue_handler(StringValue$0(state));
}



function DoubleStringCharacter(state) {
  return defaultRegExpTransform($EXPECT($R4, fail, "[^\"\\\\]+", "DoubleStringCharacter"))(state) || EscapeSequence(state)
}

const EscapeSequence$0 = $TEXT($S(Backslash, $EXPECT($R5, fail, ".", "EscapeSequence")))
function EscapeSequence(state) {
  return EscapeSequence$0(state);
}

function StringLiteral_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = ["L", value[0]]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
const StringLiteral$0 = $S(StringValue);
function StringLiteral(state) {
  return StringLiteral_handler(StringLiteral$0(state));
}

function RegExpLiteral_0_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = ["R", value[2]]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function RegExpLiteral_1_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = ["R", value]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function RegExpLiteral_2_handler(result) {
  if (result) {
    const { value } = result
    const mappedValue = ["R", value]

    //@ts-ignore
    result.value = mappedValue
    //@ts-ignore
    return result
  }
};
function RegExpLiteral(state) {
  return RegExpLiteral_0_handler($S($EXPECT($L0, fail, "/", "RegExpLiteral"), $N(_), $TEXT($Q(RegExpCharacter)), $EXPECT($L0, fail, "/", "RegExpLiteral"))(state)) || RegExpLiteral_1_handler($TEXT(CharacterClassExpression)(state)) || RegExpLiteral_2_handler($EXPECT($L3, fail, ".", "RegExpLiteral")(state))
}

const CharacterClassExpression$0 = $P(CharacterClass)
function CharacterClassExpression(state) {
  return CharacterClassExpression$0(state);
}



function RegExpCharacter(state) {
  return defaultRegExpTransform($EXPECT($R6, fail, "[^\\/\\\\]+", "RegExpCharacter"))(state) || EscapeSequence(state)
}

const CharacterClass$0 = $S($EXPECT($L4, fail, "[", "CharacterClass"), $Q(CharacterClassCharacter), $EXPECT($L5, fail, "]", "CharacterClass"), $E(Quantifier))
function CharacterClass(state) {
  return CharacterClass$0(state);
}



function CharacterClassCharacter(state) {
  return defaultRegExpTransform($EXPECT($R7, fail, "[^\\]\\\\]+", "CharacterClassCharacter"))(state) || EscapeSequence(state)
}

const Quantifier$0 = defaultRegExpTransform($EXPECT($R8, fail, "[?+*]|\\{\\d+(,\\d+)?\\}", "Quantifier"))
function Quantifier(state) {
  return Quantifier$0(state);
}

const Name$0 = defaultRegExpTransform($EXPECT($R9, fail, "[_a-zA-Z][_a-zA-Z0-9]*", "Name"))
function Name(state) {
  return Name$0(state);
}

const Arrow$0 = $S($EXPECT($L6, fail, "->", "Arrow"), $Q(_))
function Arrow(state) {
  return Arrow$0(state);
}

const Backslash$0 = $EXPECT($L7, fail, "\\\\", "Backslash")
function Backslash(state) {
  return Backslash$0(state);
}

const OpenBracket$0 = defaultRegExpTransform($EXPECT($R10, fail, "\\[[ \\t]*", "OpenBracket"))
function OpenBracket(state) {
  return OpenBracket$0(state);
}

const CloseBracket$0 = defaultRegExpTransform($EXPECT($R11, fail, "\\][ \\t]*", "CloseBracket"))
function CloseBracket(state) {
  return CloseBracket$0(state);
}

const OpenParenthesis$0 = defaultRegExpTransform($EXPECT($R12, fail, "\\([ \\t]*", "OpenParenthesis"))
function OpenParenthesis(state) {
  return OpenParenthesis$0(state);
}

const CloseParenthesis$0 = defaultRegExpTransform($EXPECT($R13, fail, "[ \\t]*\\)", "CloseParenthesis"))
function CloseParenthesis(state) {
  return CloseParenthesis$0(state);
}

const Indent$0 = $EXPECT($L8, fail, "  ", "Indent")
function Indent(state) {
  return Indent$0(state);
}

const _$0 = defaultRegExpTransform($EXPECT($R14, fail, "[ \\t]+", "_"))
function _(state) {
  return _$0(state);
}

const EOS$0 = defaultRegExpTransform($EXPECT($R15, fail, "([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", "EOS"))
function EOS(state) {
  return EOS$0(state);
}

module.exports = {
  parse: parse,

}