const {
  $C,
  $E,
  $EVENT,
  $EVENT_C,
  $EXPECT,
  $L,
  $N,
  $P,
  $Q,
  $R,
  $R$0,
  $S,
  $T,
  $TEXT,
  $TR,
  $TS,
  $TV,
  $Y,
  HeraGrammar,
  Parser,
  ParseState,
  ParserContext,
  ParserOptions,
  Validator
} = require("./machine.js")

const parser = (function() {
  let ctx = {}
  const { fail, validate, reset } = Validator()


const grammar = {
    Grammar: Grammar,
Statement: Statement,
CodeBlock: CodeBlock,
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
NonCommentEOS: NonCommentEOS,
EOS: EOS,
TripleBacktick: TripleBacktick,
TypeAnnotation: TypeAnnotation,
CodeBody: CodeBody
  };

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
const $L13 = $L("```");
const $L14 = $L("::");


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
const $R22 = $R(new RegExp("([ \\t]*(\\n|\\r\\n|\\r|$))+", 'suy'));
const $R23 = $R(new RegExp("([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+", 'suy'));
const $R24 = $R(new RegExp("(?:(?!->).)*", 'suy'));
const $R25 = $R(new RegExp("(?:(?:`(?!``))|[^`])*", 'suy'));


const Grammar$0 = $TV(ctx, $Q(Statement), function($skip, $loc, $0, $1) {

if (!$1.filter) return
const code = $1.filter(a => typeof a === "string")
const rules = Object.fromEntries($1.filter(a => Array.isArray(a)))
rules[Symbol.for("code")] = code
return rules
});
function Grammar(state) { return $EVENT(ctx, "Grammar", Grammar$0, state) }

const Statement$0 = $T(ctx, $S($E(EOS), CodeBlock), function(value) {return value[1] });
const Statement$1 = $T(ctx, $S($E(EOS), Rule), function(value) {return value[1] });
function Statement(state) { return $EVENT_C(ctx, "Statement", [Statement$0,Statement$1], state) }

const CodeBlock$0 = $T(ctx, $S(TripleBacktick, CodeBody, TripleBacktick), function(value) {return value[1] });
function CodeBlock(state) { return $EVENT(ctx, "CodeBlock", CodeBlock$0, state) }

const Rule$0 = $T(ctx, $S(Name, EOS, RuleBody), function(value) {return [value[0], value[2]] });
function Rule(state) { return $EVENT(ctx, "Rule", Rule$0, state) }

const RuleBody$0 = $TV(ctx, $P($S(Indent, Choice)), function($skip, $loc, $0, $1) {

var r = $1.map((a) => a[1])
if (r.length === 1) return r[0];
return ["/", r]
});
function RuleBody(state) { return $EVENT(ctx, "RuleBody", RuleBody$0, state) }

const Choice$0 = $TS(ctx, $S(Sequence, Handling), function($skip, $loc, $0, $1, $2) {

if ($2 !== undefined) {
  if (!$1.push)
    $1 = ["S", [$1], $2]
  else
    $1.push($2)
}
return $1
});
function Choice(state) { return $EVENT(ctx, "Choice", Choice$0, state) }

const Sequence$0 = $TS(ctx, $S(Expression, $P(SequenceExpression)), function($skip, $loc, $0, $1, $2) {

$2.unshift($1)
return ["S", $2]
});
const Sequence$1 = $TS(ctx, $S(Expression, $P(ChoiceExpression)), function($skip, $loc, $0, $1, $2) {

$2.unshift($1)
return ["/", $2]
});
const Sequence$2 = Expression
function Sequence(state) { return $EVENT_C(ctx, "Sequence", [Sequence$0,Sequence$1,Sequence$2], state) }

const SequenceExpression$0 = $T(ctx, $S(Space, Expression), function(value) {return value[1] });
function SequenceExpression(state) { return $EVENT(ctx, "SequenceExpression", SequenceExpression$0, state) }

const ChoiceExpression$0 = $T(ctx, $S(Space, $EXPECT($L0, fail, "ChoiceExpression \"/\""), Space, Expression), function(value) {return value[3] });
function ChoiceExpression(state) { return $EVENT(ctx, "ChoiceExpression", ChoiceExpression$0, state) }

const ParameterName$0 = $T(ctx, $S($EXPECT($L1, fail, "ParameterName \":\""), Name), function(value) {return value[1] });
function ParameterName(state) { return $EVENT(ctx, "ParameterName", ParameterName$0, state) }

const Expression$0 = $TS(ctx, $S($E(PrefixOperator), Suffix, $E(ParameterName)), function($skip, $loc, $0, $1, $2, $3) {

var result = null
if ($1) result = [$1, $2]
else result = $2
if ($3)
  return [{name: $3}, result]
return result
});
function Expression(state) { return $EVENT(ctx, "Expression", Expression$0, state) }

const PrefixOperator$0 = $R$0($EXPECT($R0, fail, "PrefixOperator /[$&!]/"))
function PrefixOperator(state) { return $EVENT(ctx, "PrefixOperator", PrefixOperator$0, state) }

const Suffix$0 = $TS(ctx, $S(Primary, $E(SuffixOperator)), function($skip, $loc, $0, $1, $2) {

if ($2) return [$2, $1]
else return $1
});
function Suffix(state) { return $EVENT(ctx, "Suffix", Suffix$0, state) }

const SuffixOperator$0 = $R$0($EXPECT($R1, fail, "SuffixOperator /[+?*]/"))
function SuffixOperator(state) { return $EVENT(ctx, "SuffixOperator", SuffixOperator$0, state) }

const Primary$0 = Name
const Primary$1 = Literal
const Primary$2 = $T(ctx, $S(OpenParenthesis, Sequence, CloseParenthesis), function(value) {return value[1] });
function Primary(state) { return $EVENT_C(ctx, "Primary", [Primary$0,Primary$1,Primary$2], state) }

const Literal$0 = StringLiteral
const Literal$1 = RegExpLiteral
function Literal(state) { return $EVENT_C(ctx, "Literal", [Literal$0,Literal$1], state) }

const Handling$0 = $TS(ctx, $S(EOS), function($skip, $loc, $0, $1) {

return undefined
});
const Handling$1 = $TS(ctx, $S($Q(Space), $E(TypeAnnotation), Arrow, HandlingExpression), function($skip, $loc, $0, $1, $2, $3, $4) {
var t = $2;var exp = $4;
if (t) exp.t = t
return exp
});
function Handling(state) { return $EVENT_C(ctx, "Handling", [Handling$0,Handling$1], state) }

const HandlingExpression$0 = $T(ctx, $S(EOS, HandlingExpressionBody, $E(EOS)), function(value) {return value[1] });
const HandlingExpression$1 = $T(ctx, $S(StructuralMapping, EOS), function(value) {return value[0] });
function HandlingExpression(state) { return $EVENT_C(ctx, "HandlingExpression", [HandlingExpression$0,HandlingExpression$1], state) }

const HandlingExpressionBody$0 = $TV(ctx, $P(HandlingExpressionLine), function($skip, $loc, $0, $1) {

return {
  f: $1.join("").trimEnd(),
  $loc,
}
});
function HandlingExpressionBody(state) { return $EVENT(ctx, "HandlingExpressionBody", HandlingExpressionBody$0, state) }

const HandlingExpressionLine$0 = $T(ctx, $S(Indent, Indent, $TEXT($S($EXPECT($R2, fail, "HandlingExpressionLine /[^\\n\\r]*/"), NonCommentEOS))), function(value) {return value[2] });
function HandlingExpressionLine(state) { return $EVENT(ctx, "HandlingExpressionLine", HandlingExpressionLine$0, state) }

const StructuralMapping$0 = $TS(ctx, $S(StringValue), function($skip, $loc, $0, $1) {

return JSON.parse(`"${$1}"`)
});
const StructuralMapping$1 = NumberValue
const StructuralMapping$2 = BooleanValue
const StructuralMapping$3 = NullValue
const StructuralMapping$4 = $T(ctx, $S(Variable), function(value) {return {"v": value[0]} });
const StructuralMapping$5 = JSArray
const StructuralMapping$6 = JSObject
function StructuralMapping(state) { return $EVENT_C(ctx, "StructuralMapping", [StructuralMapping$0,StructuralMapping$1,StructuralMapping$2,StructuralMapping$3,StructuralMapping$4,StructuralMapping$5,StructuralMapping$6], state) }

const JSArray$0 = $T(ctx, $S(OpenBracket, $Q(ArrayItem), CloseBracket), function(value) {return value[1] });
function JSArray(state) { return $EVENT(ctx, "JSArray", JSArray$0, state) }

const ArrayItem$0 = $T(ctx, $S(StructuralMapping, $EXPECT($R3, fail, "ArrayItem /,\\s*|\\s*(?=\\])/")), function(value) {return value[0] });
function ArrayItem(state) { return $EVENT(ctx, "ArrayItem", ArrayItem$0, state) }

const JSObject$0 = $TS(ctx, $S(OpenBrace, $Q(ObjectField), CloseBrace), function($skip, $loc, $0, $1, $2, $3) {

return {
  o: Object.fromEntries($2)
}
});
function JSObject(state) { return $EVENT(ctx, "JSObject", JSObject$0, state) }

const ObjectField$0 = $T(ctx, $S($C(StringValue, Name), $EXPECT($R4, fail, "ObjectField /:[ \\t]*/"), StructuralMapping, $EXPECT($R5, fail, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], value[2]] });
const ObjectField$1 = $T(ctx, $S(Name, $EXPECT($R5, fail, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], {"v": value[0]}] });
function ObjectField(state) { return $EVENT_C(ctx, "ObjectField", [ObjectField$0,ObjectField$1], state) }

const Variable$0 = $TR(ctx, $EXPECT($R6, fail, "Variable /\\$(\\d)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
return parseInt($1, 10)
});
const Variable$1 = Name
function Variable(state) { return $EVENT_C(ctx, "Variable", [Variable$0,Variable$1], state) }

const BooleanValue$0 = $T(ctx, $EXPECT($L2, fail, "BooleanValue \"true\""), function(value) { return true });
const BooleanValue$1 = $T(ctx, $EXPECT($L3, fail, "BooleanValue \"false\""), function(value) { return false });
function BooleanValue(state) { return $EVENT_C(ctx, "BooleanValue", [BooleanValue$0,BooleanValue$1], state) }

const NullValue$0 = $TV(ctx, $EXPECT($L4, fail, "NullValue \"null\""), function($skip, $loc, $0, $1) {

return null
});
const NullValue$1 = $TV(ctx, $EXPECT($L5, fail, "NullValue \"undefined\""), function($skip, $loc, $0, $1) {

return {l: undefined}
});
function NullValue(state) { return $EVENT_C(ctx, "NullValue", [NullValue$0,NullValue$1], state) }

const NumberValue$0 = $TR(ctx, $EXPECT($R7, fail, "NumberValue /0x[\\da-fA-F]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
return parseInt($0, 16)
});
const NumberValue$1 = $TR(ctx, $EXPECT($R8, fail, "NumberValue /[-+]?\\d+(\\.\\d+)?/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
return parseFloat($0)
});
function NumberValue(state) { return $EVENT_C(ctx, "NumberValue", [NumberValue$0,NumberValue$1], state) }

const StringValue$0 = $T(ctx, $S($EXPECT($L6, fail, "StringValue \"\\\\\\\"\""), $TEXT($Q(DoubleStringCharacter)), $EXPECT($L6, fail, "StringValue \"\\\\\\\"\"")), function(value) {return value[1] });
function StringValue(state) { return $EVENT(ctx, "StringValue", StringValue$0, state) }

const DoubleStringCharacter$0 = $R$0($EXPECT($R9, fail, "DoubleStringCharacter /[^\"\\\\]+/"))
const DoubleStringCharacter$1 = EscapeSequence
function DoubleStringCharacter(state) { return $EVENT_C(ctx, "DoubleStringCharacter", [DoubleStringCharacter$0,DoubleStringCharacter$1], state) }

const EscapeSequence$0 = $TEXT($S(Backslash, $EXPECT($R10, fail, "EscapeSequence /./")))
function EscapeSequence(state) { return $EVENT(ctx, "EscapeSequence", EscapeSequence$0, state) }

const StringLiteral$0 = $T(ctx, $S(StringValue), function(value) {return ["L", value[0]] });
function StringLiteral(state) { return $EVENT(ctx, "StringLiteral", StringLiteral$0, state) }

const RegExpLiteral$0 = $T(ctx, $S($EXPECT($L0, fail, "RegExpLiteral \"/\""), $N(Space), $TEXT($Q(RegExpCharacter)), $EXPECT($L0, fail, "RegExpLiteral \"/\"")), function(value) {return ["R", value[2]] });
const RegExpLiteral$1 = $T(ctx, $TEXT(CharacterClassExpression), function(value) { return ["R", value] });
const RegExpLiteral$2 = $T(ctx, $EXPECT($L7, fail, "RegExpLiteral \".\""), function(value) { return ["R", value] });
function RegExpLiteral(state) { return $EVENT_C(ctx, "RegExpLiteral", [RegExpLiteral$0,RegExpLiteral$1,RegExpLiteral$2], state) }

const CharacterClassExpression$0 = $P(CharacterClass)
function CharacterClassExpression(state) { return $EVENT(ctx, "CharacterClassExpression", CharacterClassExpression$0, state) }

const RegExpCharacter$0 = $R$0($EXPECT($R11, fail, "RegExpCharacter /[^\\/\\\\]+/"))
const RegExpCharacter$1 = EscapeSequence
function RegExpCharacter(state) { return $EVENT_C(ctx, "RegExpCharacter", [RegExpCharacter$0,RegExpCharacter$1], state) }

const CharacterClass$0 = $S($EXPECT($L8, fail, "CharacterClass \"[\""), $Q(CharacterClassCharacter), $EXPECT($L9, fail, "CharacterClass \"]\""), $E(Quantifier))
function CharacterClass(state) { return $EVENT(ctx, "CharacterClass", CharacterClass$0, state) }

const CharacterClassCharacter$0 = $R$0($EXPECT($R12, fail, "CharacterClassCharacter /[^\\]\\\\]+/"))
const CharacterClassCharacter$1 = EscapeSequence
function CharacterClassCharacter(state) { return $EVENT_C(ctx, "CharacterClassCharacter", [CharacterClassCharacter$0,CharacterClassCharacter$1], state) }

const Quantifier$0 = $R$0($EXPECT($R13, fail, "Quantifier /[?+*]|\\{\\d+(,\\d+)?\\}/"))
function Quantifier(state) { return $EVENT(ctx, "Quantifier", Quantifier$0, state) }

const Name$0 = $R$0($EXPECT($R14, fail, "Name /[_a-zA-Z][_a-zA-Z0-9]*/"))
function Name(state) { return $EVENT(ctx, "Name", Name$0, state) }

const Arrow$0 = $S($EXPECT($L10, fail, "Arrow \"->\""), $Q(Space))
function Arrow(state) { return $EVENT(ctx, "Arrow", Arrow$0, state) }

const Backslash$0 = $EXPECT($L11, fail, "Backslash \"\\\\\\\\\"")
function Backslash(state) { return $EVENT(ctx, "Backslash", Backslash$0, state) }

const OpenBrace$0 = $R$0($EXPECT($R15, fail, "OpenBrace /\\{\\s*/"))
function OpenBrace(state) { return $EVENT(ctx, "OpenBrace", OpenBrace$0, state) }

const CloseBrace$0 = $R$0($EXPECT($R16, fail, "CloseBrace /\\}[ \\t]*/"))
function CloseBrace(state) { return $EVENT(ctx, "CloseBrace", CloseBrace$0, state) }

const OpenBracket$0 = $R$0($EXPECT($R17, fail, "OpenBracket /\\[\\s*/"))
function OpenBracket(state) { return $EVENT(ctx, "OpenBracket", OpenBracket$0, state) }

const CloseBracket$0 = $R$0($EXPECT($R18, fail, "CloseBracket /\\][ \\t]*/"))
function CloseBracket(state) { return $EVENT(ctx, "CloseBracket", CloseBracket$0, state) }

const OpenParenthesis$0 = $R$0($EXPECT($R19, fail, "OpenParenthesis /\\([ \\t]*/"))
function OpenParenthesis(state) { return $EVENT(ctx, "OpenParenthesis", OpenParenthesis$0, state) }

const CloseParenthesis$0 = $R$0($EXPECT($R20, fail, "CloseParenthesis /[ \\t]*\\)/"))
function CloseParenthesis(state) { return $EVENT(ctx, "CloseParenthesis", CloseParenthesis$0, state) }

const Indent$0 = $EXPECT($L12, fail, "Indent \"  \"")
function Indent(state) { return $EVENT(ctx, "Indent", Indent$0, state) }

const Space$0 = $R$0($EXPECT($R21, fail, "Space /[ \\t]+/"))
function Space(state) { return $EVENT(ctx, "Space", Space$0, state) }

const NonCommentEOS$0 = $R$0($EXPECT($R22, fail, "NonCommentEOS /([ \\t]*(\\n|\\r\\n|\\r|$))+/"))
function NonCommentEOS(state) { return $EVENT(ctx, "NonCommentEOS", NonCommentEOS$0, state) }

const EOS$0 = $R$0($EXPECT($R23, fail, "EOS /([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+/"))
function EOS(state) { return $EVENT(ctx, "EOS", EOS$0, state) }

const TripleBacktick$0 = $EXPECT($L13, fail, "TripleBacktick \"```\"")
function TripleBacktick(state) { return $EVENT(ctx, "TripleBacktick", TripleBacktick$0, state) }

const TypeAnnotation$0 = $T(ctx, $S($EXPECT($L14, fail, "TypeAnnotation \"::\""), $TEXT($EXPECT($R24, fail, "TypeAnnotation /(?:(?!->).)*/"))), function(value) {return value[1] });
function TypeAnnotation(state) { return $EVENT(ctx, "TypeAnnotation", TypeAnnotation$0, state) }

const CodeBody$0 = $TEXT($EXPECT($R25, fail, "CodeBody /(?:(?:`(?!``))|[^`])*/"))
function CodeBody(state) { return $EVENT(ctx, "CodeBody", CodeBody$0, state) }



return {
  parse: (input, options = {}) => {
    if (typeof input !== "string") throw new Error("Input must be a string")

    const parser = (options.startRule != null)
      ? grammar[options.startRule]
      : Object.values(grammar)[0]

    if (!parser) throw new Error(`Could not find rule with name '${options.startRule}'`)

    const filename = options.filename || "<anonymous>";

    reset()
    if (options.events) {
      ctx.enter = options.events.enter
      ctx.exit = options.events.exit
    }
    if (options.tokenize) ctx.tokenize = options.tokenize

    return validate(input, parser({
      input,
      pos: 0,
    }), {
      filename: filename
    })
  }
}
  }())

  exports.default = parser
  exports.parse = parser.parse

