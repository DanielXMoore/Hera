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
exports.parserState = exports.$R$0 = exports.$TV = exports.$TS = exports.$TR = exports.$T = exports.$Y = exports.$N = exports.$TEXT = exports.$P = exports.$Q = exports.$E = exports.$S = exports.$C = exports.$R = exports.$L = exports.$EXPECT = void 0;
function $EXPECT(parser, fail, t, name) {
  var expectation = prettyPrint(t, name);
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
// Transform
// simplest value mapping transform, doesn't include location data parameter
function $T(parser, fn) {
  return function (state) {
    var result = parser(state);
    if (!result)
      return;
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
    var loc = result.loc, value = result.value;
    var mappedValue = fn.apply(void 0, __spreadArray([loc], value, false));
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
    var loc = result.loc, value = result.value;
    var mappedValue = fn.apply(void 0, __spreadArray([loc, value], value, false));
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
    var loc = result.loc, value = result.value;
    var mappedValue = fn(loc, value, value);
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
// End of machinery
// Parser specific things below
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
        hint = prettyPrint(hint);
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
function Grammar(state) {
  return Grammar$0(state);
}

const Rule$0 = $T($S(Name, EOS, RuleBody), function (value) { return [value[0], value[2]] });
function Rule(state) {
  return Rule$0(state);
}

const RuleBody$0 = $TV($P($S(Indent, Choice)), function ($loc, $0, $1) {
  var r = $1.map((a) => a[1])
  if (r.length === 1) return r[0];
  return ["/", r]
});
function RuleBody(state) {
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
function Choice(state) {
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
function Sequence(state) {
  return Sequence$0(state) || Sequence$1(state) || Sequence$2(state)
}

const SequenceExpression$0 = $T($S(_, Expression), function (value) { return value[1] });
function SequenceExpression(state) {
  return SequenceExpression$0(state);
}

const ChoiceExpression$0 = $T($S(_, $EXPECT($L0, fail, "/", "ChoiceExpression"), _, Expression), function (value) { return value[3] });
function ChoiceExpression(state) {
  return ChoiceExpression$0(state);
}

const Expression$0 = Suffix;
const Expression$1 = $T($S(PrefixOperator, Suffix), function (value) { return [value[0], value[1]] });
function Expression(state) {
  return Expression$0(state) || Expression$1(state)
}

const PrefixOperator$0 = $R$0($EXPECT($R0, fail, "[$&!]", "PrefixOperator"));
function PrefixOperator(state) {
  return PrefixOperator$0(state);
}

const Suffix$0 = $T($S(Primary, SuffixOperator), function (value) { return [value[1], value[0]] });
const Suffix$1 = Primary;
function Suffix(state) {
  return Suffix$0(state) || Suffix$1(state)
}

const SuffixOperator$0 = $R$0($EXPECT($R1, fail, "[+?*]", "SuffixOperator"));
function SuffixOperator(state) {
  return SuffixOperator$0(state);
}

const Primary$0 = Name;
const Primary$1 = Literal;
const Primary$2 = $T($S(OpenParenthesis, Sequence, CloseParenthesis), function (value) { return value[1] });
function Primary(state) {
  return Primary$0(state) || Primary$1(state) || Primary$2(state)
}

const Literal$0 = StringLiteral;
const Literal$1 = RegExpLiteral;
function Literal(state) {
  return Literal$0(state) || Literal$1(state)
}

const Handling$0 = $TS($S(EOS), function ($loc, $0, $1) { return undefined });
const Handling$1 = $T($S($Q(_), Arrow, HandlingExpression), function (value) { return value[2] });
function Handling(state) {
  return Handling$0(state) || Handling$1(state)
}

const HandlingExpression$0 = $T($S(EOS, HandlingExpressionBody), function (value) { return value[1] });
const HandlingExpression$1 = $T($S(StringValue, EOS), function (value) { return value[0] });
const HandlingExpression$2 = $T($S(HandlingExpressionValue, EOS), function (value) { return value[0] });
function HandlingExpression(state) {
  return HandlingExpression$0(state) || HandlingExpression$1(state) || HandlingExpression$2(state)
}

const HandlingExpressionBody$0 = $TV($P(HandlingExpressionLine), function ($loc, $0, $1) {
  return {
    f: $1.join("\n")
  }
});
function HandlingExpressionBody(state) {
  return HandlingExpressionBody$0(state);
}

const HandlingExpressionLine$0 = $T($S(Indent, Indent, $EXPECT($R2, fail, "[^\\n\\r]*", "HandlingExpressionLine"), EOS), function (value) { return value[2] });
function HandlingExpressionLine(state) {
  return HandlingExpressionLine$0(state);
}

const HandlingExpressionValue$0 = RValue;
const HandlingExpressionValue$1 = $TS($S(OpenBracket, RValue, $Q(CommaThenValue), CloseBracket), function ($loc, $0, $1, $2, $3, $4) { $3.unshift($2); return $3 });
function HandlingExpressionValue(state) {
  return HandlingExpressionValue$0(state) || HandlingExpressionValue$1(state)
}

const RValue$0 = StringValue;
const RValue$1 = $TR($EXPECT($R3, fail, "\\d\\d?", "RValue"), function ($loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) { return parseInt($0, 10) });
function RValue(state) {
  return RValue$0(state) || RValue$1(state)
}

const CommaThenValue$0 = $T($S($Q(_), $EXPECT($L1, fail, ",", "CommaThenValue"), $Q(_), RValue, $Q(_)), function (value) { return value[3] });
function CommaThenValue(state) {
  return CommaThenValue$0(state);
}

const StringValue$0 = $T($S($EXPECT($L2, fail, "\\\"", "StringValue"), $TEXT($Q(DoubleStringCharacter)), $EXPECT($L2, fail, "\\\"", "StringValue")), function (value) { return value[1] });
function StringValue(state) {
  return StringValue$0(state);
}

const DoubleStringCharacter$0 = $R$0($EXPECT($R4, fail, "[^\"\\\\]+", "DoubleStringCharacter"));
const DoubleStringCharacter$1 = EscapeSequence;
function DoubleStringCharacter(state) {
  return DoubleStringCharacter$0(state) || DoubleStringCharacter$1(state)
}

const EscapeSequence$0 = $TEXT($S(Backslash, $EXPECT($R5, fail, ".", "EscapeSequence")));
function EscapeSequence(state) {
  return EscapeSequence$0(state);
}

const StringLiteral$0 = $T($S(StringValue), function (value) { return ["L", value[0]] });
function StringLiteral(state) {
  return StringLiteral$0(state);
}

const RegExpLiteral$0 = $T($S($EXPECT($L0, fail, "/", "RegExpLiteral"), $N(_), $TEXT($Q(RegExpCharacter)), $EXPECT($L0, fail, "/", "RegExpLiteral")), function (value) { return ["R", value[2]] });
const RegExpLiteral$1 = $T($TEXT(CharacterClassExpression), function (value) { return ["R", value] });
const RegExpLiteral$2 = $T($EXPECT($L3, fail, ".", "RegExpLiteral"), function (value) { return ["R", value] });
function RegExpLiteral(state) {
  return RegExpLiteral$0(state) || RegExpLiteral$1(state) || RegExpLiteral$2(state)
}

const CharacterClassExpression$0 = $P(CharacterClass);
function CharacterClassExpression(state) {
  return CharacterClassExpression$0(state);
}

const RegExpCharacter$0 = $R$0($EXPECT($R6, fail, "[^\\/\\\\]+", "RegExpCharacter"));
const RegExpCharacter$1 = EscapeSequence;
function RegExpCharacter(state) {
  return RegExpCharacter$0(state) || RegExpCharacter$1(state)
}

const CharacterClass$0 = $S($EXPECT($L4, fail, "[", "CharacterClass"), $Q(CharacterClassCharacter), $EXPECT($L5, fail, "]", "CharacterClass"), $E(Quantifier));
function CharacterClass(state) {
  return CharacterClass$0(state);
}

const CharacterClassCharacter$0 = $R$0($EXPECT($R7, fail, "[^\\]\\\\]+", "CharacterClassCharacter"));
const CharacterClassCharacter$1 = EscapeSequence;
function CharacterClassCharacter(state) {
  return CharacterClassCharacter$0(state) || CharacterClassCharacter$1(state)
}

const Quantifier$0 = $R$0($EXPECT($R8, fail, "[?+*]|\\{\\d+(,\\d+)?\\}", "Quantifier"));
function Quantifier(state) {
  return Quantifier$0(state);
}

const Name$0 = $R$0($EXPECT($R9, fail, "[_a-zA-Z][_a-zA-Z0-9]*", "Name"));
function Name(state) {
  return Name$0(state);
}

const Arrow$0 = $S($EXPECT($L6, fail, "->", "Arrow"), $Q(_));
function Arrow(state) {
  return Arrow$0(state);
}

const Backslash$0 = $EXPECT($L7, fail, "\\\\", "Backslash");
function Backslash(state) {
  return Backslash$0(state);
}

const OpenBracket$0 = $R$0($EXPECT($R10, fail, "\\[[ \\t]*", "OpenBracket"));
function OpenBracket(state) {
  return OpenBracket$0(state);
}

const CloseBracket$0 = $R$0($EXPECT($R11, fail, "\\][ \\t]*", "CloseBracket"));
function CloseBracket(state) {
  return CloseBracket$0(state);
}

const OpenParenthesis$0 = $R$0($EXPECT($R12, fail, "\\([ \\t]*", "OpenParenthesis"));
function OpenParenthesis(state) {
  return OpenParenthesis$0(state);
}

const CloseParenthesis$0 = $R$0($EXPECT($R13, fail, "[ \\t]*\\)", "CloseParenthesis"));
function CloseParenthesis(state) {
  return CloseParenthesis$0(state);
}

const Indent$0 = $EXPECT($L8, fail, "  ", "Indent");
function Indent(state) {
  return Indent$0(state);
}

const _$0 = $R$0($EXPECT($R14, fail, "[ \\t]+", "_"));
function _(state) {
  return _$0(state);
}

const EOS$0 = $R$0($EXPECT($R15, fail, "([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", "EOS"));
function EOS(state) {
  return EOS$0(state);
}

module.exports = {
  parse: parse
}
