"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserState = exports.$R$0 = exports.$TV = exports.$TS = exports.$TR = exports.$T = exports.$Y = exports.$N = exports.$TOKEN = exports.$TEXT = exports.$P = exports.$Q = exports.$E = exports.$S = exports.$C = exports.$R = exports.$L = exports.$EXPECT = void 0;
function $EXPECT(parser, fail, expectation) {
    return function (state) {
        const result = parser(state);
        if (result)
            return result;
        const { pos } = state;
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
        const { input, pos } = state;
        regExp.lastIndex = state.pos;
        let l, m, v;
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
        return;
    };
}
exports.$R = $R;
function $C(...terms) {
    return (state) => {
        let i = 0;
        const l = terms.length;
        while (i < l) {
            const r = terms[i++](state);
            if (r)
                return r;
        }
        return;
    };
}
exports.$C = $C;
function $S(...terms) {
    return (state) => {
        let { input, pos, tokenize, events } = state, i = 0, value;
        const results = [], s = pos, l = terms.length;
        while (i < l) {
            const r = terms[i++]({ input, pos, tokenize, events });
            if (r) {
                ({ pos, value } = r);
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
    return (state) => {
        const r = fn(state);
        if (r)
            return r;
        const { pos } = state;
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
    return (state) => {
        let { input, pos, tokenize, events } = state;
        let value;
        const s = pos;
        const results = [];
        while (true) {
            const prevPos = pos;
            const r = fn({ input, pos, tokenize, events });
            if (r == undefined)
                break;
            ({ pos, value } = r);
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
    return (state) => {
        const { input, pos: s, tokenize, events } = state;
        let value;
        const first = fn(state);
        if (!first)
            return;
        let { pos } = first;
        const results = [first.value];
        while (true) {
            const prevPos = pos;
            const r = fn({ input, pos, tokenize, events });
            if (!r)
                break;
            ({ pos, value } = r);
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
    return (state) => {
        const newState = fn(state);
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
    return (state) => {
        const newState = fn(state);
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
    return (state) => {
        const newState = fn(state);
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
// Transform
// simplest value mapping transform, doesn't include location data parameter
function $T(parser, fn) {
    return function (state) {
        const result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        const { value } = result;
        const mappedValue = fn(value);
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
        const result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        const { loc, value } = result;
        const mappedValue = fn(SKIP, loc, ...value);
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
        const result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        const { loc, value } = result;
        const mappedValue = fn(SKIP, loc, value, ...value);
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
        const result = parser(state);
        if (!result)
            return;
        // NOTE: This is a lie, tokenize returns an unmodified result
        if (state.tokenize)
            return result;
        const { loc, value } = result;
        const mappedValue = fn(SKIP, loc, value, value);
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
        const result = parser(state);
        if (!result)
            return;
        const value = result.value[0];
        //@ts-ignore
        result.value = value;
        return result;
    };
}
exports.$R$0 = $R$0;
const SKIP = {};
// End of machinery
// Parser specific things below
const failHintRegex = /\S+|\s+|$/y;
// Error tracking
// Goal is zero allocations
const failExpected = Array(16);
let failIndex = 0;
let maxFailPos = 0;
//@ts-ignore
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
        const [line, column] = input.split(/\n|\r\n|\r/).reduce(([row, col], line) => {
            const l = line.length + 1;
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
        }, [1, 1]);
        return `${line}:${column}`;
    }
    function validate(input, result, { filename }) {
        if (result && result.pos === input.length)
            return result.value;
        const expectations = Array.from(new Set(failExpected.slice(0, failIndex)));
        let l = location(input, maxFailPos);
        // The parse completed with a result but there is still input
        if (result && result.pos > maxFailPos) {
            l = location(input, result.pos);
            throw new Error(`
${filename}:${l} Unconsumed input at #{l}

${input.slice(result.pos)}
    `);
        }
        if (expectations.length) {
            failHintRegex.lastIndex = maxFailPos;
            let [hint] = input.match(failHintRegex);
            if (hint.length)
                hint = JSON.stringify(hint);
            else
                hint = "EOF";
            throw new Error(`
${filename}:${l} Failed to parse
Expected:
\t${expectations.join("\n\t")}
Found: ${hint}
`);
        }
        if (result) {
            throw new Error(`
Unconsumed input at ${l}

${input.slice(result.pos)}
`);
        }
        throw new Error("No result");
    }
    return {
        parse: (input, options = {}) => {
            if (typeof input !== "string")
                throw new Error("Input must be a string");
            const parser = (options.startRule != null)
                ? grammar[options.startRule]
                : Object.values(grammar)[0];
            if (!parser)
                throw new Error("Could not find rule with name '#{opts.startRule}'");
            const filename = options.filename || "<anonymous>";
            failIndex = 0;
            maxFailPos = 0;
            failExpected.length = 0;
            return validate(input, parser({
                input,
                pos: 0,
                tokenize: options.tokenize || false,
                events: options.events,
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
        if (state.events) {
          const result = state.events.enter?.("Grammar", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Grammar", state, Grammar$0(state));
          if (state.events) state.events.exit?.("Grammar", state, result);
          return result;
        } else {
          const result = Grammar$0(state);
          if (state.events) state.events.exit?.("Grammar", state, result);
          return result;
        }
      }
    


      const Rule$0 = $T($S(Name, EOS, RuleBody), function(value) {return [value[0], value[2]] });
      function Rule(state) {
        if (state.events) {
          const result = state.events.enter?.("Rule", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Rule", state, Rule$0(state));
          if (state.events) state.events.exit?.("Rule", state, result);
          return result;
        } else {
          const result = Rule$0(state);
          if (state.events) state.events.exit?.("Rule", state, result);
          return result;
        }
      }
    


      const RuleBody$0 = $TV($P($S(Indent, Choice)), function($skip, $loc, $0, $1) {var r = $1.map((a) => a[1])
if (r.length === 1) return r[0];
return ["/", r]});
      function RuleBody(state) {
        if (state.events) {
          const result = state.events.enter?.("RuleBody", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("RuleBody", state, RuleBody$0(state));
          if (state.events) state.events.exit?.("RuleBody", state, result);
          return result;
        } else {
          const result = RuleBody$0(state);
          if (state.events) state.events.exit?.("RuleBody", state, result);
          return result;
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
        if (state.events) {
          const result = state.events.enter?.("Choice", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Choice", state, Choice$0(state));
          if (state.events) state.events.exit?.("Choice", state, result);
          return result;
        } else {
          const result = Choice$0(state);
          if (state.events) state.events.exit?.("Choice", state, result);
          return result;
        }
      }
    


      const Sequence$0 = $TS($S(Expression, $P(SequenceExpression)), function($skip, $loc, $0, $1, $2) {$2.unshift($1)
return ["S", $2]});
const Sequence$1 = $TS($S(Expression, $P(ChoiceExpression)), function($skip, $loc, $0, $1, $2) {$2.unshift($1)
return ["/", $2]});
const Sequence$2 = Expression;
      function Sequence(state) {
        if (state.events) {
          const result = state.events.enter?.("Sequence", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Sequence", state, Sequence$0(state) || Sequence$1(state) || Sequence$2(state));
          if (state.events) state.events.exit?.("Sequence", state, result);
          return result;
        } else {
          const result = Sequence$0(state) || Sequence$1(state) || Sequence$2(state);
          if (state.events) state.events.exit?.("Sequence", state, result);
          return result;
        }
      }
    


      const SequenceExpression$0 = $T($S(Space, Expression), function(value) {return value[1] });
      function SequenceExpression(state) {
        if (state.events) {
          const result = state.events.enter?.("SequenceExpression", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("SequenceExpression", state, SequenceExpression$0(state));
          if (state.events) state.events.exit?.("SequenceExpression", state, result);
          return result;
        } else {
          const result = SequenceExpression$0(state);
          if (state.events) state.events.exit?.("SequenceExpression", state, result);
          return result;
        }
      }
    


      const ChoiceExpression$0 = $T($S(Space, $EXPECT($L0, fail, "ChoiceExpression \"/\""), Space, Expression), function(value) {return value[3] });
      function ChoiceExpression(state) {
        if (state.events) {
          const result = state.events.enter?.("ChoiceExpression", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("ChoiceExpression", state, ChoiceExpression$0(state));
          if (state.events) state.events.exit?.("ChoiceExpression", state, result);
          return result;
        } else {
          const result = ChoiceExpression$0(state);
          if (state.events) state.events.exit?.("ChoiceExpression", state, result);
          return result;
        }
      }
    


      const ParameterName$0 = $T($S($EXPECT($L1, fail, "ParameterName \":\""), Name), function(value) {return value[1] });
      function ParameterName(state) {
        if (state.events) {
          const result = state.events.enter?.("ParameterName", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("ParameterName", state, ParameterName$0(state));
          if (state.events) state.events.exit?.("ParameterName", state, result);
          return result;
        } else {
          const result = ParameterName$0(state);
          if (state.events) state.events.exit?.("ParameterName", state, result);
          return result;
        }
      }
    


      const Expression$0 = $TS($S($E(PrefixOperator), Suffix, $E(ParameterName)), function($skip, $loc, $0, $1, $2, $3) {var result = null
if ($1) result = [$1, $2]
else result = $2
if ($3)
  return [{name: $3}, result]
return result});
      function Expression(state) {
        if (state.events) {
          const result = state.events.enter?.("Expression", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Expression", state, Expression$0(state));
          if (state.events) state.events.exit?.("Expression", state, result);
          return result;
        } else {
          const result = Expression$0(state);
          if (state.events) state.events.exit?.("Expression", state, result);
          return result;
        }
      }
    


      const PrefixOperator$0 = $R$0($EXPECT($R0, fail, "PrefixOperator /[$&!]/"));
      function PrefixOperator(state) {
        if (state.events) {
          const result = state.events.enter?.("PrefixOperator", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("PrefixOperator", state, PrefixOperator$0(state));
          if (state.events) state.events.exit?.("PrefixOperator", state, result);
          return result;
        } else {
          const result = PrefixOperator$0(state);
          if (state.events) state.events.exit?.("PrefixOperator", state, result);
          return result;
        }
      }
    


      const Suffix$0 = $TS($S(Primary, $E(SuffixOperator)), function($skip, $loc, $0, $1, $2) {if ($2) return [$2, $1]
else return $1});
      function Suffix(state) {
        if (state.events) {
          const result = state.events.enter?.("Suffix", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Suffix", state, Suffix$0(state));
          if (state.events) state.events.exit?.("Suffix", state, result);
          return result;
        } else {
          const result = Suffix$0(state);
          if (state.events) state.events.exit?.("Suffix", state, result);
          return result;
        }
      }
    


      const SuffixOperator$0 = $R$0($EXPECT($R1, fail, "SuffixOperator /[+?*]/"));
      function SuffixOperator(state) {
        if (state.events) {
          const result = state.events.enter?.("SuffixOperator", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("SuffixOperator", state, SuffixOperator$0(state));
          if (state.events) state.events.exit?.("SuffixOperator", state, result);
          return result;
        } else {
          const result = SuffixOperator$0(state);
          if (state.events) state.events.exit?.("SuffixOperator", state, result);
          return result;
        }
      }
    


      const Primary$0 = Name;
const Primary$1 = Literal;
const Primary$2 = $T($S(OpenParenthesis, Sequence, CloseParenthesis), function(value) {return value[1] });
      function Primary(state) {
        if (state.events) {
          const result = state.events.enter?.("Primary", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Primary", state, Primary$0(state) || Primary$1(state) || Primary$2(state));
          if (state.events) state.events.exit?.("Primary", state, result);
          return result;
        } else {
          const result = Primary$0(state) || Primary$1(state) || Primary$2(state);
          if (state.events) state.events.exit?.("Primary", state, result);
          return result;
        }
      }
    


      const Literal$0 = StringLiteral;
const Literal$1 = RegExpLiteral;
      function Literal(state) {
        if (state.events) {
          const result = state.events.enter?.("Literal", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Literal", state, Literal$0(state) || Literal$1(state));
          if (state.events) state.events.exit?.("Literal", state, result);
          return result;
        } else {
          const result = Literal$0(state) || Literal$1(state);
          if (state.events) state.events.exit?.("Literal", state, result);
          return result;
        }
      }
    


      const Handling$0 = $TS($S(EOS), function($skip, $loc, $0, $1) {return undefined});
const Handling$1 = $T($S($Q(Space), Arrow, HandlingExpression), function(value) {return value[2] });
      function Handling(state) {
        if (state.events) {
          const result = state.events.enter?.("Handling", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Handling", state, Handling$0(state) || Handling$1(state));
          if (state.events) state.events.exit?.("Handling", state, result);
          return result;
        } else {
          const result = Handling$0(state) || Handling$1(state);
          if (state.events) state.events.exit?.("Handling", state, result);
          return result;
        }
      }
    


      const HandlingExpression$0 = $T($S(EOS, HandlingExpressionBody), function(value) {return value[1] });
const HandlingExpression$1 = $T($S(StructuralMapping, EOS), function(value) {return value[0] });
      function HandlingExpression(state) {
        if (state.events) {
          const result = state.events.enter?.("HandlingExpression", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("HandlingExpression", state, HandlingExpression$0(state) || HandlingExpression$1(state));
          if (state.events) state.events.exit?.("HandlingExpression", state, result);
          return result;
        } else {
          const result = HandlingExpression$0(state) || HandlingExpression$1(state);
          if (state.events) state.events.exit?.("HandlingExpression", state, result);
          return result;
        }
      }
    


      const HandlingExpressionBody$0 = $TV($P(HandlingExpressionLine), function($skip, $loc, $0, $1) {return {
  f: $1.join("\n")
}});
      function HandlingExpressionBody(state) {
        if (state.events) {
          const result = state.events.enter?.("HandlingExpressionBody", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("HandlingExpressionBody", state, HandlingExpressionBody$0(state));
          if (state.events) state.events.exit?.("HandlingExpressionBody", state, result);
          return result;
        } else {
          const result = HandlingExpressionBody$0(state);
          if (state.events) state.events.exit?.("HandlingExpressionBody", state, result);
          return result;
        }
      }
    


      const HandlingExpressionLine$0 = $T($S(Indent, Indent, $EXPECT($R2, fail, "HandlingExpressionLine /[^\\n\\r]*/"), EOS), function(value) {return value[2] });
      function HandlingExpressionLine(state) {
        if (state.events) {
          const result = state.events.enter?.("HandlingExpressionLine", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("HandlingExpressionLine", state, HandlingExpressionLine$0(state));
          if (state.events) state.events.exit?.("HandlingExpressionLine", state, result);
          return result;
        } else {
          const result = HandlingExpressionLine$0(state);
          if (state.events) state.events.exit?.("HandlingExpressionLine", state, result);
          return result;
        }
      }
    


      const StructuralMapping$0 = $TS($S(StringValue), function($skip, $loc, $0, $1) {return JSON.parse(`"${$1}"`)});
const StructuralMapping$1 = NumberValue;
const StructuralMapping$2 = BooleanValue;
const StructuralMapping$3 = NullValue;
const StructuralMapping$4 = $T($S(Variable), function(value) {return {"v": value[0]} });
const StructuralMapping$5 = JSArray;
const StructuralMapping$6 = JSObject;
      function StructuralMapping(state) {
        if (state.events) {
          const result = state.events.enter?.("StructuralMapping", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("StructuralMapping", state, StructuralMapping$0(state) || StructuralMapping$1(state) || StructuralMapping$2(state) || StructuralMapping$3(state) || StructuralMapping$4(state) || StructuralMapping$5(state) || StructuralMapping$6(state));
          if (state.events) state.events.exit?.("StructuralMapping", state, result);
          return result;
        } else {
          const result = StructuralMapping$0(state) || StructuralMapping$1(state) || StructuralMapping$2(state) || StructuralMapping$3(state) || StructuralMapping$4(state) || StructuralMapping$5(state) || StructuralMapping$6(state);
          if (state.events) state.events.exit?.("StructuralMapping", state, result);
          return result;
        }
      }
    


      const JSArray$0 = $T($S(OpenBracket, $Q(ArrayItem), CloseBracket), function(value) {return value[1] });
      function JSArray(state) {
        if (state.events) {
          const result = state.events.enter?.("JSArray", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("JSArray", state, JSArray$0(state));
          if (state.events) state.events.exit?.("JSArray", state, result);
          return result;
        } else {
          const result = JSArray$0(state);
          if (state.events) state.events.exit?.("JSArray", state, result);
          return result;
        }
      }
    


      const ArrayItem$0 = $T($S(StructuralMapping, $EXPECT($R3, fail, "ArrayItem /,\\s*|\\s*(?=\\])/")), function(value) {return value[0] });
      function ArrayItem(state) {
        if (state.events) {
          const result = state.events.enter?.("ArrayItem", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("ArrayItem", state, ArrayItem$0(state));
          if (state.events) state.events.exit?.("ArrayItem", state, result);
          return result;
        } else {
          const result = ArrayItem$0(state);
          if (state.events) state.events.exit?.("ArrayItem", state, result);
          return result;
        }
      }
    


      const JSObject$0 = $TS($S(OpenBrace, $Q(ObjectField), CloseBrace), function($skip, $loc, $0, $1, $2, $3) {return {
  o: Object.fromEntries($2)
}});
      function JSObject(state) {
        if (state.events) {
          const result = state.events.enter?.("JSObject", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("JSObject", state, JSObject$0(state));
          if (state.events) state.events.exit?.("JSObject", state, result);
          return result;
        } else {
          const result = JSObject$0(state);
          if (state.events) state.events.exit?.("JSObject", state, result);
          return result;
        }
      }
    


      const ObjectField$0 = $T($S($C(StringValue, Name), $EXPECT($R4, fail, "ObjectField /:[ \\t]*/"), StructuralMapping, $EXPECT($R5, fail, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], value[2]] });
const ObjectField$1 = $T($S(Name, $EXPECT($R5, fail, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], {"v": value[0]}] });
      function ObjectField(state) {
        if (state.events) {
          const result = state.events.enter?.("ObjectField", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("ObjectField", state, ObjectField$0(state) || ObjectField$1(state));
          if (state.events) state.events.exit?.("ObjectField", state, result);
          return result;
        } else {
          const result = ObjectField$0(state) || ObjectField$1(state);
          if (state.events) state.events.exit?.("ObjectField", state, result);
          return result;
        }
      }
    


      const Variable$0 = $TR($EXPECT($R6, fail, "Variable /\\$(\\d)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseInt($1, 10)});
const Variable$1 = Name;
      function Variable(state) {
        if (state.events) {
          const result = state.events.enter?.("Variable", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Variable", state, Variable$0(state) || Variable$1(state));
          if (state.events) state.events.exit?.("Variable", state, result);
          return result;
        } else {
          const result = Variable$0(state) || Variable$1(state);
          if (state.events) state.events.exit?.("Variable", state, result);
          return result;
        }
      }
    


      const BooleanValue$0 = $T($EXPECT($L2, fail, "BooleanValue \"true\""), function(value) { return true });
const BooleanValue$1 = $T($EXPECT($L3, fail, "BooleanValue \"false\""), function(value) { return false });
      function BooleanValue(state) {
        if (state.events) {
          const result = state.events.enter?.("BooleanValue", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("BooleanValue", state, BooleanValue$0(state) || BooleanValue$1(state));
          if (state.events) state.events.exit?.("BooleanValue", state, result);
          return result;
        } else {
          const result = BooleanValue$0(state) || BooleanValue$1(state);
          if (state.events) state.events.exit?.("BooleanValue", state, result);
          return result;
        }
      }
    


      const NullValue$0 = $TV($EXPECT($L4, fail, "NullValue \"null\""), function($skip, $loc, $0, $1) {return null});
const NullValue$1 = $TV($EXPECT($L5, fail, "NullValue \"undefined\""), function($skip, $loc, $0, $1) {return {l: undefined}});
      function NullValue(state) {
        if (state.events) {
          const result = state.events.enter?.("NullValue", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("NullValue", state, NullValue$0(state) || NullValue$1(state));
          if (state.events) state.events.exit?.("NullValue", state, result);
          return result;
        } else {
          const result = NullValue$0(state) || NullValue$1(state);
          if (state.events) state.events.exit?.("NullValue", state, result);
          return result;
        }
      }
    


      const NumberValue$0 = $TR($EXPECT($R7, fail, "NumberValue /0x[\\da-fA-F]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseInt($0, 16)});
const NumberValue$1 = $TR($EXPECT($R8, fail, "NumberValue /[-+]?\\d+(\\.\\d+)?/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseFloat($0)});
      function NumberValue(state) {
        if (state.events) {
          const result = state.events.enter?.("NumberValue", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("NumberValue", state, NumberValue$0(state) || NumberValue$1(state));
          if (state.events) state.events.exit?.("NumberValue", state, result);
          return result;
        } else {
          const result = NumberValue$0(state) || NumberValue$1(state);
          if (state.events) state.events.exit?.("NumberValue", state, result);
          return result;
        }
      }
    


      const StringValue$0 = $T($S($EXPECT($L6, fail, "StringValue \"\\\\\\\"\""), $TEXT($Q(DoubleStringCharacter)), $EXPECT($L6, fail, "StringValue \"\\\\\\\"\"")), function(value) {return value[1] });
      function StringValue(state) {
        if (state.events) {
          const result = state.events.enter?.("StringValue", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("StringValue", state, StringValue$0(state));
          if (state.events) state.events.exit?.("StringValue", state, result);
          return result;
        } else {
          const result = StringValue$0(state);
          if (state.events) state.events.exit?.("StringValue", state, result);
          return result;
        }
      }
    


      const DoubleStringCharacter$0 = $R$0($EXPECT($R9, fail, "DoubleStringCharacter /[^\"\\\\]+/"));
const DoubleStringCharacter$1 = EscapeSequence;
      function DoubleStringCharacter(state) {
        if (state.events) {
          const result = state.events.enter?.("DoubleStringCharacter", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("DoubleStringCharacter", state, DoubleStringCharacter$0(state) || DoubleStringCharacter$1(state));
          if (state.events) state.events.exit?.("DoubleStringCharacter", state, result);
          return result;
        } else {
          const result = DoubleStringCharacter$0(state) || DoubleStringCharacter$1(state);
          if (state.events) state.events.exit?.("DoubleStringCharacter", state, result);
          return result;
        }
      }
    


      const EscapeSequence$0 = $TEXT($S(Backslash, $EXPECT($R10, fail, "EscapeSequence /./")));
      function EscapeSequence(state) {
        if (state.events) {
          const result = state.events.enter?.("EscapeSequence", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("EscapeSequence", state, EscapeSequence$0(state));
          if (state.events) state.events.exit?.("EscapeSequence", state, result);
          return result;
        } else {
          const result = EscapeSequence$0(state);
          if (state.events) state.events.exit?.("EscapeSequence", state, result);
          return result;
        }
      }
    


      const StringLiteral$0 = $T($S(StringValue), function(value) {return ["L", value[0]] });
      function StringLiteral(state) {
        if (state.events) {
          const result = state.events.enter?.("StringLiteral", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("StringLiteral", state, StringLiteral$0(state));
          if (state.events) state.events.exit?.("StringLiteral", state, result);
          return result;
        } else {
          const result = StringLiteral$0(state);
          if (state.events) state.events.exit?.("StringLiteral", state, result);
          return result;
        }
      }
    


      const RegExpLiteral$0 = $T($S($EXPECT($L0, fail, "RegExpLiteral \"/\""), $N(Space), $TEXT($Q(RegExpCharacter)), $EXPECT($L0, fail, "RegExpLiteral \"/\"")), function(value) {return ["R", value[2]] });
const RegExpLiteral$1 = $T($TEXT(CharacterClassExpression), function(value) { return ["R", value] });
const RegExpLiteral$2 = $T($EXPECT($L7, fail, "RegExpLiteral \".\""), function(value) { return ["R", value] });
      function RegExpLiteral(state) {
        if (state.events) {
          const result = state.events.enter?.("RegExpLiteral", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("RegExpLiteral", state, RegExpLiteral$0(state) || RegExpLiteral$1(state) || RegExpLiteral$2(state));
          if (state.events) state.events.exit?.("RegExpLiteral", state, result);
          return result;
        } else {
          const result = RegExpLiteral$0(state) || RegExpLiteral$1(state) || RegExpLiteral$2(state);
          if (state.events) state.events.exit?.("RegExpLiteral", state, result);
          return result;
        }
      }
    


      const CharacterClassExpression$0 = $P(CharacterClass);
      function CharacterClassExpression(state) {
        if (state.events) {
          const result = state.events.enter?.("CharacterClassExpression", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("CharacterClassExpression", state, CharacterClassExpression$0(state));
          if (state.events) state.events.exit?.("CharacterClassExpression", state, result);
          return result;
        } else {
          const result = CharacterClassExpression$0(state);
          if (state.events) state.events.exit?.("CharacterClassExpression", state, result);
          return result;
        }
      }
    


      const RegExpCharacter$0 = $R$0($EXPECT($R11, fail, "RegExpCharacter /[^\\/\\\\]+/"));
const RegExpCharacter$1 = EscapeSequence;
      function RegExpCharacter(state) {
        if (state.events) {
          const result = state.events.enter?.("RegExpCharacter", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("RegExpCharacter", state, RegExpCharacter$0(state) || RegExpCharacter$1(state));
          if (state.events) state.events.exit?.("RegExpCharacter", state, result);
          return result;
        } else {
          const result = RegExpCharacter$0(state) || RegExpCharacter$1(state);
          if (state.events) state.events.exit?.("RegExpCharacter", state, result);
          return result;
        }
      }
    


      const CharacterClass$0 = $S($EXPECT($L8, fail, "CharacterClass \"[\""), $Q(CharacterClassCharacter), $EXPECT($L9, fail, "CharacterClass \"]\""), $E(Quantifier));
      function CharacterClass(state) {
        if (state.events) {
          const result = state.events.enter?.("CharacterClass", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("CharacterClass", state, CharacterClass$0(state));
          if (state.events) state.events.exit?.("CharacterClass", state, result);
          return result;
        } else {
          const result = CharacterClass$0(state);
          if (state.events) state.events.exit?.("CharacterClass", state, result);
          return result;
        }
      }
    


      const CharacterClassCharacter$0 = $R$0($EXPECT($R12, fail, "CharacterClassCharacter /[^\\]\\\\]+/"));
const CharacterClassCharacter$1 = EscapeSequence;
      function CharacterClassCharacter(state) {
        if (state.events) {
          const result = state.events.enter?.("CharacterClassCharacter", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("CharacterClassCharacter", state, CharacterClassCharacter$0(state) || CharacterClassCharacter$1(state));
          if (state.events) state.events.exit?.("CharacterClassCharacter", state, result);
          return result;
        } else {
          const result = CharacterClassCharacter$0(state) || CharacterClassCharacter$1(state);
          if (state.events) state.events.exit?.("CharacterClassCharacter", state, result);
          return result;
        }
      }
    


      const Quantifier$0 = $R$0($EXPECT($R13, fail, "Quantifier /[?+*]|\\{\\d+(,\\d+)?\\}/"));
      function Quantifier(state) {
        if (state.events) {
          const result = state.events.enter?.("Quantifier", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Quantifier", state, Quantifier$0(state));
          if (state.events) state.events.exit?.("Quantifier", state, result);
          return result;
        } else {
          const result = Quantifier$0(state);
          if (state.events) state.events.exit?.("Quantifier", state, result);
          return result;
        }
      }
    


      const Name$0 = $R$0($EXPECT($R14, fail, "Name /[_a-zA-Z][_a-zA-Z0-9]*/"));
      function Name(state) {
        if (state.events) {
          const result = state.events.enter?.("Name", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Name", state, Name$0(state));
          if (state.events) state.events.exit?.("Name", state, result);
          return result;
        } else {
          const result = Name$0(state);
          if (state.events) state.events.exit?.("Name", state, result);
          return result;
        }
      }
    


      const Arrow$0 = $S($EXPECT($L10, fail, "Arrow \"->\""), $Q(Space));
      function Arrow(state) {
        if (state.events) {
          const result = state.events.enter?.("Arrow", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Arrow", state, Arrow$0(state));
          if (state.events) state.events.exit?.("Arrow", state, result);
          return result;
        } else {
          const result = Arrow$0(state);
          if (state.events) state.events.exit?.("Arrow", state, result);
          return result;
        }
      }
    


      const Backslash$0 = $EXPECT($L11, fail, "Backslash \"\\\\\\\\\"");
      function Backslash(state) {
        if (state.events) {
          const result = state.events.enter?.("Backslash", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Backslash", state, Backslash$0(state));
          if (state.events) state.events.exit?.("Backslash", state, result);
          return result;
        } else {
          const result = Backslash$0(state);
          if (state.events) state.events.exit?.("Backslash", state, result);
          return result;
        }
      }
    


      const OpenBrace$0 = $R$0($EXPECT($R15, fail, "OpenBrace /\\{\\s*/"));
      function OpenBrace(state) {
        if (state.events) {
          const result = state.events.enter?.("OpenBrace", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("OpenBrace", state, OpenBrace$0(state));
          if (state.events) state.events.exit?.("OpenBrace", state, result);
          return result;
        } else {
          const result = OpenBrace$0(state);
          if (state.events) state.events.exit?.("OpenBrace", state, result);
          return result;
        }
      }
    


      const CloseBrace$0 = $R$0($EXPECT($R16, fail, "CloseBrace /\\}[ \\t]*/"));
      function CloseBrace(state) {
        if (state.events) {
          const result = state.events.enter?.("CloseBrace", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("CloseBrace", state, CloseBrace$0(state));
          if (state.events) state.events.exit?.("CloseBrace", state, result);
          return result;
        } else {
          const result = CloseBrace$0(state);
          if (state.events) state.events.exit?.("CloseBrace", state, result);
          return result;
        }
      }
    


      const OpenBracket$0 = $R$0($EXPECT($R17, fail, "OpenBracket /\\[\\s*/"));
      function OpenBracket(state) {
        if (state.events) {
          const result = state.events.enter?.("OpenBracket", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("OpenBracket", state, OpenBracket$0(state));
          if (state.events) state.events.exit?.("OpenBracket", state, result);
          return result;
        } else {
          const result = OpenBracket$0(state);
          if (state.events) state.events.exit?.("OpenBracket", state, result);
          return result;
        }
      }
    


      const CloseBracket$0 = $R$0($EXPECT($R18, fail, "CloseBracket /\\][ \\t]*/"));
      function CloseBracket(state) {
        if (state.events) {
          const result = state.events.enter?.("CloseBracket", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("CloseBracket", state, CloseBracket$0(state));
          if (state.events) state.events.exit?.("CloseBracket", state, result);
          return result;
        } else {
          const result = CloseBracket$0(state);
          if (state.events) state.events.exit?.("CloseBracket", state, result);
          return result;
        }
      }
    


      const OpenParenthesis$0 = $R$0($EXPECT($R19, fail, "OpenParenthesis /\\([ \\t]*/"));
      function OpenParenthesis(state) {
        if (state.events) {
          const result = state.events.enter?.("OpenParenthesis", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("OpenParenthesis", state, OpenParenthesis$0(state));
          if (state.events) state.events.exit?.("OpenParenthesis", state, result);
          return result;
        } else {
          const result = OpenParenthesis$0(state);
          if (state.events) state.events.exit?.("OpenParenthesis", state, result);
          return result;
        }
      }
    


      const CloseParenthesis$0 = $R$0($EXPECT($R20, fail, "CloseParenthesis /[ \\t]*\\)/"));
      function CloseParenthesis(state) {
        if (state.events) {
          const result = state.events.enter?.("CloseParenthesis", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("CloseParenthesis", state, CloseParenthesis$0(state));
          if (state.events) state.events.exit?.("CloseParenthesis", state, result);
          return result;
        } else {
          const result = CloseParenthesis$0(state);
          if (state.events) state.events.exit?.("CloseParenthesis", state, result);
          return result;
        }
      }
    


      const Indent$0 = $EXPECT($L12, fail, "Indent \"  \"");
      function Indent(state) {
        if (state.events) {
          const result = state.events.enter?.("Indent", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Indent", state, Indent$0(state));
          if (state.events) state.events.exit?.("Indent", state, result);
          return result;
        } else {
          const result = Indent$0(state);
          if (state.events) state.events.exit?.("Indent", state, result);
          return result;
        }
      }
    


      const Space$0 = $R$0($EXPECT($R21, fail, "Space /[ \\t]+/"));
      function Space(state) {
        if (state.events) {
          const result = state.events.enter?.("Space", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("Space", state, Space$0(state));
          if (state.events) state.events.exit?.("Space", state, result);
          return result;
        } else {
          const result = Space$0(state);
          if (state.events) state.events.exit?.("Space", state, result);
          return result;
        }
      }
    


      const EOS$0 = $R$0($EXPECT($R22, fail, "EOS /([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+/"));
      function EOS(state) {
        if (state.events) {
          const result = state.events.enter?.("EOS", state);
          if (result) return result.cache;
        }
        if (state.tokenize) {
          const result = $TOKEN("EOS", state, EOS$0(state));
          if (state.events) state.events.exit?.("EOS", state, result);
          return result;
        } else {
          const result = EOS$0(state);
          if (state.events) state.events.exit?.("EOS", state, result);
          return result;
        }
      }
    

  exports.parse = parse
  exports.default = { parse }
  