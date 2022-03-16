import {
  $L, $R, $C, $S, $E, $P, $Q, $N, $Y,
  defaultRegExpHandler,
  makeResultHandler_R,
  makeResultHandler_S,
  makeResultHandler,
  makeStructuralHandler,
} from "./machine"

const $l0 = "/";
function $L0(state) { return $L(state, $l0) }
const $l1 = ",";
function $L1(state) { return $L(state, $l1) }
const $l2 = "\\\"";
function $L2(state) { return $L(state, $l2) }
const $l3 = "\\\"";
function $L3(state) { return $L(state, $l3) }
const $l4 = "/";
function $L4(state) { return $L(state, $l4) }
const $l5 = "/";
function $L5(state) { return $L(state, $l5) }
const $l6 = "[";
function $L6(state) { return $L(state, $l6) }
const $l7 = "]";
function $L7(state) { return $L(state, $l7) }
const $l8 = "->";
function $L8(state) { return $L(state, $l8) }
const $l9 = "\\\\";
function $L9(state) { return $L(state, $l9) }
const $l10 = "  ";
function $L10(state) { return $L(state, $l10) }

const $r0 = new RegExp("[&!]", 'suy');
function $R0(state) { return $R(state, $r0) }
const $r1 = new RegExp("[+?*]", 'suy');
function $R1(state) { return $R(state, $r1) }
const $r2 = new RegExp("[^\\n\\r]*", 'suy');
function $R2(state) { return $R(state, $r2) }
const $r3 = new RegExp("\\d\\d?", 'suy');
function $R3(state) { return $R(state, $r3) }
const $r4 = new RegExp("[^\"\\\\]+", 'suy');
function $R4(state) { return $R(state, $r4) }
const $r5 = new RegExp("[^]", 'suy');
function $R5(state) { return $R(state, $r5) }
const $r6 = new RegExp("[^\\/\\\\]+", 'suy');
function $R6(state) { return $R(state, $r6) }
const $r7 = new RegExp("[^\\]\\\\]+", 'suy');
function $R7(state) { return $R(state, $r7) }
const $r8 = new RegExp("[?+*]|\\{\\d+(,\\d+)?\\}", 'suy');
function $R8(state) { return $R(state, $r8) }
const $r9 = new RegExp("[_a-zA-Z][_a-zA-Z0-9]*", 'suy');
function $R9(state) { return $R(state, $r9) }
const $r10 = new RegExp("\\[[ \\t]*", 'suy');
function $R10(state) { return $R(state, $r10) }
const $r11 = new RegExp("\\][ \\t]*", 'suy');
function $R11(state) { return $R(state, $r11) }
const $r12 = new RegExp("\\([ \\t]*", 'suy');
function $R12(state) { return $R(state, $r12) }
const $r13 = new RegExp("[ \\t]*\\)", 'suy');
function $R13(state) { return $R(state, $r13) }
const $r14 = new RegExp("[ \\t]+", 'suy');
function $R14(state) { return $R(state, $r14) }
const $r15 = new RegExp("([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", 'suy');
function $R15(state) { return $R(state, $r15) }

const Grammar_handler = makeResultHandler_S(function($loc, $0, $1, $2) {return Object.fromEntries($2)});
function Grammar(state) {
  return Grammar_handler($S($Q(EOS), $P(Rule))(state));
}

const Rule_handler = makeStructuralHandler([1,3]);
function Rule(state) {
  return Rule_handler($S(Name, EOS, RuleBody)(state));
}

const RuleBody_handler = makeResultHandler(function($loc, $0, $1) {var r = $1.map((a) => a[1])
if (r.length === 1) return r[0];
return ["/", r]});
function RuleBody(state) {
  return RuleBody_handler($P($S(Indent, Choice))(state));
}

const Choice_handler = makeResultHandler_S(function($loc, $0, $1, $2) {if ($2 !== undefined) {
  if (!$1.push)
    $1 = ["S", [$1], $2]
  else
    $1.push($2)
}
return $1});
function Choice(state) {
  return Choice_handler($S(Sequence, Handling)(state));
}

const Sequence_0_handler = makeResultHandler_S(function($loc, $0, $1, $2) {$2.unshift($1)
return ["S", $2]});
const Sequence_1_handler = makeResultHandler_S(function($loc, $0, $1, $2) {$2.unshift($1)
return ["/", $2]});

function Sequence(state) {
  return Sequence_0_handler($S(Expression, $P(SequenceExpression))(state)) || Sequence_1_handler($S(Expression, $P(ChoiceExpression))(state)) || Expression(state)
}

const SequenceExpression_handler = makeStructuralHandler(2);
function SequenceExpression(state) {
  return SequenceExpression_handler($S(_, Expression)(state));
}

const ChoiceExpression_handler = makeStructuralHandler(4);
function ChoiceExpression(state) {
  return ChoiceExpression_handler($S(_, $L0, _, Expression)(state));
}


const Expression_1_handler = makeStructuralHandler([1,2]);
function Expression(state) {
  return Suffix(state) || Expression_1_handler($S(PrefixOperator, Suffix)(state))
}

const PrefixOperator_handler = defaultRegExpHandler;
function PrefixOperator(state) {
  return PrefixOperator_handler($R0(state));
}

const Suffix_0_handler = makeStructuralHandler([2,1]);

function Suffix(state) {
  return Suffix_0_handler($S(Primary, SuffixOperator)(state)) || Primary(state)
}

const SuffixOperator_handler = defaultRegExpHandler;
function SuffixOperator(state) {
  return SuffixOperator_handler($R1(state));
}



const Primary_2_handler = makeStructuralHandler(2);
function Primary(state) {
  return Name(state) || Literal(state) || Primary_2_handler($S(OpenParenthesis, Sequence, CloseParenthesis)(state))
}



function Literal(state) {
  return StringLiteral(state) || RegExpLiteral(state)
}

const Handling_0_handler = makeResultHandler_S(function($loc, $0, $1) {return undefined});
const Handling_1_handler = makeStructuralHandler(3);
function Handling(state) {
  return Handling_0_handler($S(EOS)(state)) || Handling_1_handler($S($Q(_), Arrow, HandlingExpression)(state))
}

const HandlingExpression_0_handler = makeStructuralHandler(2);
const HandlingExpression_1_handler = makeStructuralHandler(1);
const HandlingExpression_2_handler = makeStructuralHandler(1);
function HandlingExpression(state) {
  return HandlingExpression_0_handler($S(EOS, HandlingExpressionBody)(state)) || HandlingExpression_1_handler($S(StringValue, EOS)(state)) || HandlingExpression_2_handler($S(HandlingExpressionValue, EOS)(state))
}

const HandlingExpressionBody_handler = makeResultHandler(function($loc, $0, $1) {return {
  f: $1.join("\n")
}});
function HandlingExpressionBody(state) {
  return HandlingExpressionBody_handler($P(HandlingExpressionLine)(state));
}

const HandlingExpressionLine_handler = makeStructuralHandler(3);
function HandlingExpressionLine(state) {
  return HandlingExpressionLine_handler($S(Indent, Indent, $R2, EOS)(state));
}


const HandlingExpressionValue_1_handler = makeResultHandler_S(function($loc, $0, $1, $2, $3, $4) {$3.unshift($2); return $3});
function HandlingExpressionValue(state) {
  return RValue(state) || HandlingExpressionValue_1_handler($S(OpenBracket, RValue, $Q(CommaThenValue), CloseBracket)(state))
}


const RValue_1_handler = makeResultHandler_R(function($loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {return parseInt($0, 10)});
function RValue(state) {
  return StringValue(state) || RValue_1_handler($R3(state))
}

const CommaThenValue_handler = makeStructuralHandler(4);
function CommaThenValue(state) {
  return CommaThenValue_handler($S($Q(_), $L1, $Q(_), RValue, $Q(_))(state));
}

const StringValue_handler = makeResultHandler_S(function($loc, $0, $1, $2, $3) {return $2.join('')});
function StringValue(state) {
  return StringValue_handler($S($L2, $Q(DoubleStringCharacter), $L3)(state));
}

const DoubleStringCharacter_0_handler = defaultRegExpHandler;

function DoubleStringCharacter(state) {
  return DoubleStringCharacter_0_handler($R4(state)) || EscapeSequence(state)
}

const EscapeSequence_handler = makeResultHandler_S(function($loc, $0, $1, $2) {return '\\' + $2});
function EscapeSequence(state) {
  return EscapeSequence_handler($S(Backslash, $R5)(state));
}

const StringLiteral_handler = makeStructuralHandler(["L",1]);
function StringLiteral(state) {
  return StringLiteral_handler($S(StringValue)(state));
}

const RegExpLiteral_0_handler = makeResultHandler_S(function($loc, $0, $1, $2, $3, $4) {return ["R", $3.join('')]});

function RegExpLiteral(state) {
  return RegExpLiteral_0_handler($S($L4, $N(_), $Q(RegExpCharacter), $L5)(state)) || CharacterClassExpression(state)
}

const CharacterClassExpression_handler = makeResultHandler(function($loc, $0, $1) {return ["R", $1.join('')]});
function CharacterClassExpression(state) {
  return CharacterClassExpression_handler($P(CharacterClass)(state));
}

const RegExpCharacter_0_handler = defaultRegExpHandler;

function RegExpCharacter(state) {
  return RegExpCharacter_0_handler($R6(state)) || EscapeSequence(state)
}

const CharacterClass_handler = makeResultHandler_S(function($loc, $0, $1, $2, $3, $4) {return "[" + $2.join('') + "]" + ($4 || "")});
function CharacterClass(state) {
  return CharacterClass_handler($S($L6, $Q(CharacterClassCharacter), $L7, $E(Quantifier))(state));
}

const CharacterClassCharacter_0_handler = defaultRegExpHandler;

function CharacterClassCharacter(state) {
  return CharacterClassCharacter_0_handler($R7(state)) || EscapeSequence(state)
}

const Quantifier_handler = defaultRegExpHandler;
function Quantifier(state) {
  return Quantifier_handler($R8(state));
}

const Name_handler = defaultRegExpHandler;
function Name(state) {
  return Name_handler($R9(state));
}

function Arrow(state) {
  return $S($L8, $Q(_))(state);
}

function Backslash(state) {
  return $L9(state);
}

const OpenBracket_handler = defaultRegExpHandler;
function OpenBracket(state) {
  return OpenBracket_handler($R10(state));
}

const CloseBracket_handler = defaultRegExpHandler;
function CloseBracket(state) {
  return CloseBracket_handler($R11(state));
}

const OpenParenthesis_handler = defaultRegExpHandler;
function OpenParenthesis(state) {
  return OpenParenthesis_handler($R12(state));
}

const CloseParenthesis_handler = defaultRegExpHandler;
function CloseParenthesis(state) {
  return CloseParenthesis_handler($R13(state));
}

function Indent(state) {
  return $L10(state);
}

const __handler = defaultRegExpHandler;
function _(state) {
  return __handler($R14(state));
}

const EOS_handler = defaultRegExpHandler;
function EOS(state) {
  return EOS_handler($R15(state));
}