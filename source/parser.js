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
exports.__esModule = true;
exports.parserState = exports.$R$0 = exports.$TV = exports.$TS = exports.$TR = exports.$T = exports.$Y = exports.$N = exports.$TOKEN = exports.$TEXT = exports.$P = exports.$Q = exports.$E = exports.$S = exports.$C = exports.$R = exports.$L = exports.$EXPECT = void 0;
function $EXPECT(parser, fail, expectation) {
    return function (state) {
        var result = parser(state);
        if (result)
            return result;
        var pos = state.pos;
        fail(pos, expectation);
        return;
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
        return;
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
                    length: l
                },
                pos: pos + l,
                value: m
            };
        }
        return;
    };
}
exports.$R = $R;
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
function $S() {
    var terms = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        terms[_i] = arguments[_i];
    }
    return function (state) {
        var input = state.input, pos = state.pos, tokenize = state.tokenize, i = 0, value;
        var results = [], s = pos, l = terms.length;
        while (i < l) {
            var r = terms[i++]({ input: input, pos: pos, tokenize: tokenize });
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
                length: pos - s
            },
            pos: pos,
            value: results
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
        var input = state.input, pos = state.pos, tokenize = state.tokenize;
        var value;
        var s = pos;
        var results = [];
        while (true) {
            var prevPos = pos;
            var r = fn({ input: input, pos: pos, tokenize: tokenize });
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
                length: pos - s
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
        var input = state.input, s = state.pos, tokenize = state.tokenize;
        var value;
        var first = fn(state);
        if (!first)
            return;
        var pos = first.pos;
        var results = [first.value];
        while (true) {
            var prevPos = pos;
            var r = fn({ input: input, pos: pos, tokenize: tokenize });
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
                length: pos - s
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
function $TOKEN(name, state, newState) {
    if (!newState)
        return;
    newState.value = {
        type: name,
        //@ts-ignore
        children: [].concat(newState.value),
        token: state.input.substring(state.pos, newState.pos),
        loc: newState.loc
    };
    return newState;
}
exports.$TOKEN = $TOKEN;
// ! prefix operator
function $N(fn) {
    return function (state) {
        var newState = fn(state);
        if (newState)
            return;
        return {
            loc: {
                pos: state.pos,
                length: 0
            },
            value: undefined,
            pos: state.pos
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
                length: 0
            },
            value: undefined,
            pos: state.pos
        };
    };
}
exports.$Y = $Y;
// Transform
// simplest value mapping transform, doesn't include location data parameter
function $T(parser, fn) {
    return function (state) {
        var result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        var value = result.value;
        var mappedValue = fn(value);
        //@ts-ignore
        result.value = mappedValue;
        return result;
    };
}
exports.$T = $T;
// Transform RegExp
// Result handler for regexp match expressions
// $0 is the whole match, followed by $1, $2, etc.
function $TR(parser, fn) {
    return function (state) {
        var result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        var loc = result.loc, value = result.value;
        var mappedValue = fn.apply(void 0, __spreadArray([SKIP, loc], value, false));
        if (mappedValue === SKIP) {
            // TODO track fail?
            return;
        }
        //@ts-ignore
        result.value = mappedValue;
        return result;
    };
}
exports.$TR = $TR;
// Transform sequence
function $TS(parser, fn) {
    return function (state) {
        var result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        var loc = result.loc, value = result.value;
        var mappedValue = fn.apply(void 0, __spreadArray([SKIP, loc, value], value, false));
        if (mappedValue === SKIP) {
            // TODO track fail?
            return;
        }
        //@ts-ignore
        result.value = mappedValue;
        return result;
    };
}
exports.$TS = $TS;
// Transform value $0 and $1 are both singular value
function $TV(parser, fn) {
    return function (state) {
        var result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        var loc = result.loc, value = result.value;
        var mappedValue = fn(SKIP, loc, value, value);
        if (mappedValue === SKIP) {
            // TODO track fail?
            return;
        }
        //@ts-ignore
        result.value = mappedValue;
        return result;
    };
}
exports.$TV = $TV;
// Default regexp result handler RegExpMatchArray => $0
function $R$0(parser) {
    return function (state) {
        var result = parser(state);
        if (!result)
            return;
        var value = result.value[0];
        //@ts-ignore
        result.value = value;
        return result;
    };
}
exports.$R$0 = $R$0;
var SKIP = {};
// End of machinery
// Parser specific things below
var failHintRegex = /\S+|\s+|$/y;
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
function parserState(grammar) {
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
        if (expectations.length) {
            failHintRegex.lastIndex = maxFailPos;
            var hint = input.match(failHintRegex)[0];
            if (hint.length)
                hint = JSON.stringify(hint);
            else
                hint = "EOF";
            throw new Error("\n".concat(filename, ":").concat(l, " Failed to parse\nExpected:\n\t").concat(expectations.join("\n\t"), "\nFound: ").concat(hint, "\n"));
        }
        if (result) {
            throw new Error("\nUnconsumed input at ".concat(l, "\n\n").concat(input.slice(result.pos), "\n"));
        }
        throw new Error("No result");
    }
    return {
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
            return validate(input, parser({
                input: input,
                pos: 0,
                tokenize: options.tokenize || false
            }), {
                filename: filename
            });
        }
    };
}
exports.parserState = parserState;


const { parse } = parserState({
  Grammar: Grammar,
Rule: Rule,
RuleBody: RuleBody,
Choice: Choice,
Sequence: Sequence,
SequenceExpression: SequenceExpression,
ChoiceExpression: ChoiceExpression,
ParameterName: ParameterName,
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
StructuralMapping: StructuralMapping,
JSArray: JSArray,
ArrayItem: ArrayItem,
JSObject: JSObject,
ObjectField: ObjectField,
Variable: Variable,
BooleanValue: BooleanValue,
NullValue: NullValue,
NumberValue: NumberValue,
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
OpenBrace: OpenBrace,
CloseBrace: CloseBrace,
OpenBracket: OpenBracket,
CloseBracket: CloseBracket,
OpenParenthesis: OpenParenthesis,
CloseParenthesis: CloseParenthesis,
Indent: Indent,
Space: Space,
EOS: EOS
})

const $L0 = $L("/");
const $L1 = $L(":");
const $L2 = $L("true");
const $L3 = $L("false");
const $L4 = $L("null");
const $L5 = $L("undefined");
const $L6 = $L("\"");
const $L7 = $L(".");
const $L8 = $L("[");
const $L9 = $L("]");
const $L10 = $L("->");
const $L11 = $L("\\");
const $L12 = $L("  ");

const $R0 = $R(new RegExp("[$&!]", 'suy'));
const $R1 = $R(new RegExp("[+?*]", 'suy'));
const $R2 = $R(new RegExp("[^\\n\\r]*", 'suy'));
const $R3 = $R(new RegExp(",\\s*|\\s*(?=\\])", 'suy'));
const $R4 = $R(new RegExp(":[ \\t]*", 'suy'));
const $R5 = $R(new RegExp(",\\s*|\\s*(?=\\})", 'suy'));
const $R6 = $R(new RegExp("\\$(\\d)", 'suy'));
const $R7 = $R(new RegExp("0x[\\da-fA-F]+", 'suy'));
const $R8 = $R(new RegExp("[-+]?\\d+(\\.\\d+)?", 'suy'));
const $R9 = $R(new RegExp("[^\"\\\\]+", 'suy'));
const $R10 = $R(new RegExp(".", 'suy'));
const $R11 = $R(new RegExp("[^\\/\\\\]+", 'suy'));
const $R12 = $R(new RegExp("[^\\]\\\\]+", 'suy'));
const $R13 = $R(new RegExp("[?+*]|\\{\\d+(,\\d+)?\\}", 'suy'));
const $R14 = $R(new RegExp("[_a-zA-Z][_a-zA-Z0-9]*", 'suy'));
const $R15 = $R(new RegExp("\\{\\s*", 'suy'));
const $R16 = $R(new RegExp("\\}[ \\t]*", 'suy'));
const $R17 = $R(new RegExp("\\[\\s*", 'suy'));
const $R18 = $R(new RegExp("\\][ \\t]*", 'suy'));
const $R19 = $R(new RegExp("\\([ \\t]*", 'suy'));
const $R20 = $R(new RegExp("[ \\t]*\\)", 'suy'));
const $R21 = $R(new RegExp("[ \\t]+", 'suy'));
const $R22 = $R(new RegExp("([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", 'suy'));

const Grammar$0 = $TS($S($Q(EOS), $P(Rule)), function($skip, $loc, $0, $1, $2) {return Object.fromEntries($2)});
function Grammar(state) {
  if (state.tokenize) {
    return $TOKEN("Grammar", state, Grammar$0(state));
  } else {
    return Grammar$0(state);
  }
}

const Rule$0 = $T($S(Name, EOS, RuleBody), function(value) {return [value[0], value[2]] });
function Rule(state) {
  if (state.tokenize) {
    return $TOKEN("Rule", state, Rule$0(state));
  } else {
    return Rule$0(state);
  }
}

const RuleBody$0 = $TV($P($S(Indent, Choice)), function($skip, $loc, $0, $1) {var r = $1.map((a) => a[1])
if (r.length === 1) return r[0];
return ["/", r]});
function RuleBody(state) {
  if (state.tokenize) {
    return $TOKEN("RuleBody", state, RuleBody$0(state));
  } else {
    return RuleBody$0(state);
  }
}

const Choice$0 = $TS($S(Sequence, Handling), function($skip, $loc, $0, $1, $2) {if ($2 !== undefined) {
  if (!$1.push)
    $1 = ["S", [$1], $2]
  else
    $1.push($2)
}
return $1});
function Choice(state) {
  if (state.tokenize) {
    return $TOKEN("Choice", state, Choice$0(state));
  } else {
    return Choice$0(state);
  }
}

const Sequence$0 = $TS($S(Expression, $P(SequenceExpression)), function($skip, $loc, $0, $1, $2) {$2.unshift($1)
return ["S", $2]});
const Sequence$1 = $TS($S(Expression, $P(ChoiceExpression)), function($skip, $loc, $0, $1, $2) {$2.unshift($1)
return ["/", $2]});
const Sequence$2 = Expression;
function Sequence(state) {
  if (state.tokenize) {
    return $TOKEN("Sequence", state, Sequence$0(state) || Sequence$1(state) || Sequence$2(state));
  } else {
    return Sequence$0(state) || Sequence$1(state) || Sequence$2(state)
  }
}

const SequenceExpression$0 = $T($S(Space, Expression), function(value) {return value[1] });
function SequenceExpression(state) {
  if (state.tokenize) {
    return $TOKEN("SequenceExpression", state, SequenceExpression$0(state));
  } else {
    return SequenceExpression$0(state);
  }
}

const ChoiceExpression$0 = $T($S(Space, $EXPECT($L0, fail, "ChoiceExpression \"/\""), Space, Expression), function(value) {return value[3] });
function ChoiceExpression(state) {
  if (state.tokenize) {
    return $TOKEN("ChoiceExpression", state, ChoiceExpression$0(state));
  } else {
    return ChoiceExpression$0(state);
  }
}

const ParameterName$0 = $T($S($EXPECT($L1, fail, "ParameterName \":\""), Name), function(value) {return value[1] });
function ParameterName(state) {
  if (state.tokenize) {
    return $TOKEN("ParameterName", state, ParameterName$0(state));
  } else {
    return ParameterName$0(state);
  }
}

const Expression$0 = $TS($S($E(PrefixOperator), Suffix, $E(ParameterName)), function($skip, $loc, $0, $1, $2, $3) {var result = null
if ($1) result = [$1, $2]
else result = $2
if ($3)
  return [{name: $3}, result]
return result});
function Expression(state) {
  if (state.tokenize) {
    return $TOKEN("Expression", state, Expression$0(state));
  } else {
    return Expression$0(state);
  }
}

const PrefixOperator$0 = $R$0($EXPECT($R0, fail, "PrefixOperator /[$&!]/"));
function PrefixOperator(state) {
  if (state.tokenize) {
    return $TOKEN("PrefixOperator", state, PrefixOperator$0(state));
  } else {
    return PrefixOperator$0(state);
  }
}

const Suffix$0 = $TS($S(Primary, $E(SuffixOperator)), function($skip, $loc, $0, $1, $2) {if ($2) return [$2, $1]
else return $1});
function Suffix(state) {
  if (state.tokenize) {
    return $TOKEN("Suffix", state, Suffix$0(state));
  } else {
    return Suffix$0(state);
  }
}

const SuffixOperator$0 = $R$0($EXPECT($R1, fail, "SuffixOperator /[+?*]/"));
function SuffixOperator(state) {
  if (state.tokenize) {
    return $TOKEN("SuffixOperator", state, SuffixOperator$0(state));
  } else {
    return SuffixOperator$0(state);
  }
}

const Primary$0 = Name;
const Primary$1 = Literal;
const Primary$2 = $T($S(OpenParenthesis, Sequence, CloseParenthesis), function(value) {return value[1] });
function Primary(state) {
  if (state.tokenize) {
    return $TOKEN("Primary", state, Primary$0(state) || Primary$1(state) || Primary$2(state));
  } else {
    return Primary$0(state) || Primary$1(state) || Primary$2(state)
  }
}

const Literal$0 = StringLiteral;
const Literal$1 = RegExpLiteral;
function Literal(state) {
  if (state.tokenize) {
    return $TOKEN("Literal", state, Literal$0(state) || Literal$1(state));
  } else {
    return Literal$0(state) || Literal$1(state)
  }
}

const Handling$0 = $TS($S(EOS), function($skip, $loc, $0, $1) {return undefined});
const Handling$1 = $T($S($Q(Space), Arrow, HandlingExpression), function(value) {return value[2] });
function Handling(state) {
  if (state.tokenize) {
    return $TOKEN("Handling", state, Handling$0(state) || Handling$1(state));
  } else {
    return Handling$0(state) || Handling$1(state)
  }
}

const HandlingExpression$0 = $T($S(EOS, HandlingExpressionBody), function(value) {return value[1] });
const HandlingExpression$1 = $T($S(StructuralMapping, EOS), function(value) {return value[0] });
function HandlingExpression(state) {
  if (state.tokenize) {
    return $TOKEN("HandlingExpression", state, HandlingExpression$0(state) || HandlingExpression$1(state));
  } else {
    return HandlingExpression$0(state) || HandlingExpression$1(state)
  }
}

const HandlingExpressionBody$0 = $TV($P(HandlingExpressionLine), function($skip, $loc, $0, $1) {return {
  f: $1.join("\n")
}});
function HandlingExpressionBody(state) {
  if (state.tokenize) {
    return $TOKEN("HandlingExpressionBody", state, HandlingExpressionBody$0(state));
  } else {
    return HandlingExpressionBody$0(state);
  }
}

const HandlingExpressionLine$0 = $T($S(Indent, Indent, $EXPECT($R2, fail, "HandlingExpressionLine /[^\\n\\r]*/"), EOS), function(value) {return value[2] });
function HandlingExpressionLine(state) {
  if (state.tokenize) {
    return $TOKEN("HandlingExpressionLine", state, HandlingExpressionLine$0(state));
  } else {
    return HandlingExpressionLine$0(state);
  }
}

const StructuralMapping$0 = StringValue;
const StructuralMapping$1 = NumberValue;
const StructuralMapping$2 = BooleanValue;
const StructuralMapping$3 = NullValue;
const StructuralMapping$4 = $T($S(Variable), function(value) {return {"v": value[0]} });
const StructuralMapping$5 = JSArray;
const StructuralMapping$6 = JSObject;
function StructuralMapping(state) {
  if (state.tokenize) {
    return $TOKEN("StructuralMapping", state, StructuralMapping$0(state) || StructuralMapping$1(state) || StructuralMapping$2(state) || StructuralMapping$3(state) || StructuralMapping$4(state) || StructuralMapping$5(state) || StructuralMapping$6(state));
  } else {
    return StructuralMapping$0(state) || StructuralMapping$1(state) || StructuralMapping$2(state) || StructuralMapping$3(state) || StructuralMapping$4(state) || StructuralMapping$5(state) || StructuralMapping$6(state)
  }
}

const JSArray$0 = $T($S(OpenBracket, $Q(ArrayItem), CloseBracket), function(value) {return value[1] });
function JSArray(state) {
  if (state.tokenize) {
    return $TOKEN("JSArray", state, JSArray$0(state));
  } else {
    return JSArray$0(state);
  }
}

const ArrayItem$0 = $T($S(StructuralMapping, $EXPECT($R3, fail, "ArrayItem /,\\s*|\\s*(?=\\])/")), function(value) {return value[0] });
function ArrayItem(state) {
  if (state.tokenize) {
    return $TOKEN("ArrayItem", state, ArrayItem$0(state));
  } else {
    return ArrayItem$0(state);
  }
}

const JSObject$0 = $TS($S(OpenBrace, $Q(ObjectField), CloseBrace), function($skip, $loc, $0, $1, $2, $3) {return {
  o: Object.fromEntries($2)
}});
function JSObject(state) {
  if (state.tokenize) {
    return $TOKEN("JSObject", state, JSObject$0(state));
  } else {
    return JSObject$0(state);
  }
}

const ObjectField$0 = $T($S($C(StringValue, Name), $EXPECT($R4, fail, "ObjectField /:[ \\t]*/"), StructuralMapping, $EXPECT($R5, fail, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], value[2]] });
const ObjectField$1 = $T($S(Name, $EXPECT($R5, fail, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], {"v": value[0]}] });
function ObjectField(state) {
  if (state.tokenize) {
    return $TOKEN("ObjectField", state, ObjectField$0(state) || ObjectField$1(state));
  } else {
    return ObjectField$0(state) || ObjectField$1(state)
  }
}

const Variable$0 = $TR($EXPECT($R6, fail, "Variable /\\$(\\d)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseInt($1, 10)});
const Variable$1 = Name;
function Variable(state) {
  if (state.tokenize) {
    return $TOKEN("Variable", state, Variable$0(state) || Variable$1(state));
  } else {
    return Variable$0(state) || Variable$1(state)
  }
}

const BooleanValue$0 = $T($EXPECT($L2, fail, "BooleanValue \"true\""), function(value) { return true });
const BooleanValue$1 = $T($EXPECT($L3, fail, "BooleanValue \"false\""), function(value) { return false });
function BooleanValue(state) {
  if (state.tokenize) {
    return $TOKEN("BooleanValue", state, BooleanValue$0(state) || BooleanValue$1(state));
  } else {
    return BooleanValue$0(state) || BooleanValue$1(state)
  }
}

const NullValue$0 = $TV($EXPECT($L4, fail, "NullValue \"null\""), function($skip, $loc, $0, $1) {return null});
const NullValue$1 = $TV($EXPECT($L5, fail, "NullValue \"undefined\""), function($skip, $loc, $0, $1) {return {l: undefined}});
function NullValue(state) {
  if (state.tokenize) {
    return $TOKEN("NullValue", state, NullValue$0(state) || NullValue$1(state));
  } else {
    return NullValue$0(state) || NullValue$1(state)
  }
}

const NumberValue$0 = $TR($EXPECT($R7, fail, "NumberValue /0x[\\da-fA-F]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseInt($0, 16)});
const NumberValue$1 = $TR($EXPECT($R8, fail, "NumberValue /[-+]?\\d+(\\.\\d+)?/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseFloat($0)});
function NumberValue(state) {
  if (state.tokenize) {
    return $TOKEN("NumberValue", state, NumberValue$0(state) || NumberValue$1(state));
  } else {
    return NumberValue$0(state) || NumberValue$1(state)
  }
}

const StringValue$0 = $T($S($EXPECT($L6, fail, "StringValue \"\\\\\\\"\""), $TEXT($Q(DoubleStringCharacter)), $EXPECT($L6, fail, "StringValue \"\\\\\\\"\"")), function(value) {return value[1] });
function StringValue(state) {
  if (state.tokenize) {
    return $TOKEN("StringValue", state, StringValue$0(state));
  } else {
    return StringValue$0(state);
  }
}

const DoubleStringCharacter$0 = $R$0($EXPECT($R9, fail, "DoubleStringCharacter /[^\"\\\\]+/"));
const DoubleStringCharacter$1 = EscapeSequence;
function DoubleStringCharacter(state) {
  if (state.tokenize) {
    return $TOKEN("DoubleStringCharacter", state, DoubleStringCharacter$0(state) || DoubleStringCharacter$1(state));
  } else {
    return DoubleStringCharacter$0(state) || DoubleStringCharacter$1(state)
  }
}

const EscapeSequence$0 = $TEXT($S(Backslash, $EXPECT($R10, fail, "EscapeSequence /./")));
function EscapeSequence(state) {
  if (state.tokenize) {
    return $TOKEN("EscapeSequence", state, EscapeSequence$0(state));
  } else {
    return EscapeSequence$0(state);
  }
}

const StringLiteral$0 = $T($S(StringValue), function(value) {return ["L", value[0]] });
function StringLiteral(state) {
  if (state.tokenize) {
    return $TOKEN("StringLiteral", state, StringLiteral$0(state));
  } else {
    return StringLiteral$0(state);
  }
}

const RegExpLiteral$0 = $T($S($EXPECT($L0, fail, "RegExpLiteral \"/\""), $N(Space), $TEXT($Q(RegExpCharacter)), $EXPECT($L0, fail, "RegExpLiteral \"/\"")), function(value) {return ["R", value[2]] });
const RegExpLiteral$1 = $T($TEXT(CharacterClassExpression), function(value) { return ["R", value] });
const RegExpLiteral$2 = $T($EXPECT($L7, fail, "RegExpLiteral \".\""), function(value) { return ["R", value] });
function RegExpLiteral(state) {
  if (state.tokenize) {
    return $TOKEN("RegExpLiteral", state, RegExpLiteral$0(state) || RegExpLiteral$1(state) || RegExpLiteral$2(state));
  } else {
    return RegExpLiteral$0(state) || RegExpLiteral$1(state) || RegExpLiteral$2(state)
  }
}

const CharacterClassExpression$0 = $P(CharacterClass);
function CharacterClassExpression(state) {
  if (state.tokenize) {
    return $TOKEN("CharacterClassExpression", state, CharacterClassExpression$0(state));
  } else {
    return CharacterClassExpression$0(state);
  }
}

const RegExpCharacter$0 = $R$0($EXPECT($R11, fail, "RegExpCharacter /[^\\/\\\\]+/"));
const RegExpCharacter$1 = EscapeSequence;
function RegExpCharacter(state) {
  if (state.tokenize) {
    return $TOKEN("RegExpCharacter", state, RegExpCharacter$0(state) || RegExpCharacter$1(state));
  } else {
    return RegExpCharacter$0(state) || RegExpCharacter$1(state)
  }
}

const CharacterClass$0 = $S($EXPECT($L8, fail, "CharacterClass \"[\""), $Q(CharacterClassCharacter), $EXPECT($L9, fail, "CharacterClass \"]\""), $E(Quantifier));
function CharacterClass(state) {
  if (state.tokenize) {
    return $TOKEN("CharacterClass", state, CharacterClass$0(state));
  } else {
    return CharacterClass$0(state);
  }
}

const CharacterClassCharacter$0 = $R$0($EXPECT($R12, fail, "CharacterClassCharacter /[^\\]\\\\]+/"));
const CharacterClassCharacter$1 = EscapeSequence;
function CharacterClassCharacter(state) {
  if (state.tokenize) {
    return $TOKEN("CharacterClassCharacter", state, CharacterClassCharacter$0(state) || CharacterClassCharacter$1(state));
  } else {
    return CharacterClassCharacter$0(state) || CharacterClassCharacter$1(state)
  }
}

const Quantifier$0 = $R$0($EXPECT($R13, fail, "Quantifier /[?+*]|\\{\\d+(,\\d+)?\\}/"));
function Quantifier(state) {
  if (state.tokenize) {
    return $TOKEN("Quantifier", state, Quantifier$0(state));
  } else {
    return Quantifier$0(state);
  }
}

const Name$0 = $R$0($EXPECT($R14, fail, "Name /[_a-zA-Z][_a-zA-Z0-9]*/"));
function Name(state) {
  if (state.tokenize) {
    return $TOKEN("Name", state, Name$0(state));
  } else {
    return Name$0(state);
  }
}

const Arrow$0 = $S($EXPECT($L10, fail, "Arrow \"->\""), $Q(Space));
function Arrow(state) {
  if (state.tokenize) {
    return $TOKEN("Arrow", state, Arrow$0(state));
  } else {
    return Arrow$0(state);
  }
}

const Backslash$0 = $EXPECT($L11, fail, "Backslash \"\\\\\\\\\"");
function Backslash(state) {
  if (state.tokenize) {
    return $TOKEN("Backslash", state, Backslash$0(state));
  } else {
    return Backslash$0(state);
  }
}

const OpenBrace$0 = $R$0($EXPECT($R15, fail, "OpenBrace /\\{\\s*/"));
function OpenBrace(state) {
  if (state.tokenize) {
    return $TOKEN("OpenBrace", state, OpenBrace$0(state));
  } else {
    return OpenBrace$0(state);
  }
}

const CloseBrace$0 = $R$0($EXPECT($R16, fail, "CloseBrace /\\}[ \\t]*/"));
function CloseBrace(state) {
  if (state.tokenize) {
    return $TOKEN("CloseBrace", state, CloseBrace$0(state));
  } else {
    return CloseBrace$0(state);
  }
}

const OpenBracket$0 = $R$0($EXPECT($R17, fail, "OpenBracket /\\[\\s*/"));
function OpenBracket(state) {
  if (state.tokenize) {
    return $TOKEN("OpenBracket", state, OpenBracket$0(state));
  } else {
    return OpenBracket$0(state);
  }
}

const CloseBracket$0 = $R$0($EXPECT($R18, fail, "CloseBracket /\\][ \\t]*/"));
function CloseBracket(state) {
  if (state.tokenize) {
    return $TOKEN("CloseBracket", state, CloseBracket$0(state));
  } else {
    return CloseBracket$0(state);
  }
}

const OpenParenthesis$0 = $R$0($EXPECT($R19, fail, "OpenParenthesis /\\([ \\t]*/"));
function OpenParenthesis(state) {
  if (state.tokenize) {
    return $TOKEN("OpenParenthesis", state, OpenParenthesis$0(state));
  } else {
    return OpenParenthesis$0(state);
  }
}

const CloseParenthesis$0 = $R$0($EXPECT($R20, fail, "CloseParenthesis /[ \\t]*\\)/"));
function CloseParenthesis(state) {
  if (state.tokenize) {
    return $TOKEN("CloseParenthesis", state, CloseParenthesis$0(state));
  } else {
    return CloseParenthesis$0(state);
  }
}

const Indent$0 = $EXPECT($L12, fail, "Indent \"  \"");
function Indent(state) {
  if (state.tokenize) {
    return $TOKEN("Indent", state, Indent$0(state));
  } else {
    return Indent$0(state);
  }
}

const Space$0 = $R$0($EXPECT($R21, fail, "Space /[ \\t]+/"));
function Space(state) {
  if (state.tokenize) {
    return $TOKEN("Space", state, Space$0(state));
  } else {
    return Space$0(state);
  }
}

const EOS$0 = $R$0($EXPECT($R22, fail, "EOS /([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+/"));
function EOS(state) {
  if (state.tokenize) {
    return $TOKEN("EOS", state, EOS$0(state));
  } else {
    return EOS$0(state);
  }
}

module.exports = {
  parse: parse
}