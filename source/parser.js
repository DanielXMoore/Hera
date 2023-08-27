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


const Grammar$0 = $TV($Q(Statement), function($skip, $loc, $0, $1) {

const code = $1.filter(a => typeof a === "string")
const rules = Object.fromEntries($1.filter(a => Array.isArray(a)))
rules[Symbol.for("code")] = code
return rules
});
function Grammar(ctx, state) { return $EVENT(ctx, state, "Grammar", Grammar$0) }

const Statement$0 = $T($S($E(EOS), CodeBlock), function(value) {return value[1] });
const Statement$1 = $T($S($E(EOS), Rule), function(value) {return value[1] });
const Statement$$ = [Statement$0,Statement$1]
function Statement(ctx, state) { return $EVENT_C(ctx, state, "Statement", Statement$$) }

const CodeBlock$0 = $T($S(TripleBacktick, CodeBody, TripleBacktick), function(value) {return value[1] });
function CodeBlock(ctx, state) { return $EVENT(ctx, state, "CodeBlock", CodeBlock$0) }

const Rule$0 = $T($S(Name, EOS, RuleBody), function(value) {return [value[0], value[2]] });
function Rule(ctx, state) { return $EVENT(ctx, state, "Rule", Rule$0) }

const RuleBody$0 = $TV($P($S(Indent, Choice)), function($skip, $loc, $0, $1) {

var r = $1.map((a) => a[1])
if (r.length === 1) return r[0];
return ["/", r]
});
function RuleBody(ctx, state) { return $EVENT(ctx, state, "RuleBody", RuleBody$0) }

const Choice$0 = $TS($S(Sequence, Handling), function($skip, $loc, $0, $1, $2) {

if ($2 !== undefined) {
  if (!$1.push)
    $1 = ["S", [$1], $2]
  else
    $1.push($2)
}
return $1
});
function Choice(ctx, state) { return $EVENT(ctx, state, "Choice", Choice$0) }

const Sequence$0 = $TS($S(Expression, $P(SequenceExpression)), function($skip, $loc, $0, $1, $2) {

$2.unshift($1)
return ["S", $2]
});
const Sequence$1 = $TS($S(Expression, $P(ChoiceExpression)), function($skip, $loc, $0, $1, $2) {

$2.unshift($1)
return ["/", $2]
});
const Sequence$2 = Expression
const Sequence$$ = [Sequence$0,Sequence$1,Sequence$2]
function Sequence(ctx, state) { return $EVENT_C(ctx, state, "Sequence", Sequence$$) }

const SequenceExpression$0 = $T($S(Space, Expression), function(value) {return value[1] });
function SequenceExpression(ctx, state) { return $EVENT(ctx, state, "SequenceExpression", SequenceExpression$0) }

const ChoiceExpression$0 = $T($S(Space, $EXPECT($L0, "ChoiceExpression \"/\""), Space, Expression), function(value) {return value[3] });
function ChoiceExpression(ctx, state) { return $EVENT(ctx, state, "ChoiceExpression", ChoiceExpression$0) }

const ParameterName$0 = $T($S($EXPECT($L1, "ParameterName \":\""), Name), function(value) {return value[1] });
function ParameterName(ctx, state) { return $EVENT(ctx, state, "ParameterName", ParameterName$0) }

const Expression$0 = $TS($S($E(PrefixOperator), Suffix, $E(ParameterName)), function($skip, $loc, $0, $1, $2, $3) {

var result = null
if ($1) result = [$1, $2]
else result = $2
if ($3)
  return [{name: $3}, result]
return result
});
function Expression(ctx, state) { return $EVENT(ctx, state, "Expression", Expression$0) }

const PrefixOperator$0 = $R$0($EXPECT($R0, "PrefixOperator /[$&!]/"))
function PrefixOperator(ctx, state) { return $EVENT(ctx, state, "PrefixOperator", PrefixOperator$0) }

const Suffix$0 = $TS($S(Primary, $E(SuffixOperator)), function($skip, $loc, $0, $1, $2) {

if ($2) return [$2, $1]
else return $1
});
function Suffix(ctx, state) { return $EVENT(ctx, state, "Suffix", Suffix$0) }

const SuffixOperator$0 = $R$0($EXPECT($R1, "SuffixOperator /[+?*]/"))
function SuffixOperator(ctx, state) { return $EVENT(ctx, state, "SuffixOperator", SuffixOperator$0) }

const Primary$0 = Name
const Primary$1 = Literal
const Primary$2 = $T($S(OpenParenthesis, Sequence, CloseParenthesis), function(value) {return value[1] });
const Primary$$ = [Primary$0,Primary$1,Primary$2]
function Primary(ctx, state) { return $EVENT_C(ctx, state, "Primary", Primary$$) }

const Literal$0 = StringLiteral
const Literal$1 = RegExpLiteral
const Literal$$ = [Literal$0,Literal$1]
function Literal(ctx, state) { return $EVENT_C(ctx, state, "Literal", Literal$$) }

const Handling$0 = $TS($S(EOS), function($skip, $loc, $0, $1) {

return undefined
});
const Handling$1 = $TS($S($Q(Space), $E(TypeAnnotation), Arrow, HandlingExpression), function($skip, $loc, $0, $1, $2, $3, $4) {

if ($2) $4.t = $2
return $4
});
const Handling$$ = [Handling$0,Handling$1]
function Handling(ctx, state) { return $EVENT_C(ctx, state, "Handling", Handling$$) }

const HandlingExpression$0 = $T($S(EOS, HandlingExpressionBody, $E(EOS)), function(value) {return value[1] });
const HandlingExpression$1 = $T($S(StructuralMapping, EOS), function(value) {return value[0] });
const HandlingExpression$$ = [HandlingExpression$0,HandlingExpression$1]
function HandlingExpression(ctx, state) { return $EVENT_C(ctx, state, "HandlingExpression", HandlingExpression$$) }

const HandlingExpressionBody$0 = $TV($P(HandlingExpressionLine), function($skip, $loc, $0, $1) {

return {
  f: $1.join("").trimEnd(),
  $loc,
}
});
function HandlingExpressionBody(ctx, state) { return $EVENT(ctx, state, "HandlingExpressionBody", HandlingExpressionBody$0) }

const HandlingExpressionLine$0 = $T($S(Indent, Indent, $TEXT($S($EXPECT($R2, "HandlingExpressionLine /[^\\n\\r]*/"), NonCommentEOS))), function(value) {return value[2] });
function HandlingExpressionLine(ctx, state) { return $EVENT(ctx, state, "HandlingExpressionLine", HandlingExpressionLine$0) }

const StructuralMapping$0 = $TS($S(StringValue), function($skip, $loc, $0, $1) {

return JSON.parse(`"${$1}"`)
});
const StructuralMapping$1 = NumberValue
const StructuralMapping$2 = BooleanValue
const StructuralMapping$3 = NullValue
const StructuralMapping$4 = $T($S(Variable), function(value) {return {"v": value[0]} });
const StructuralMapping$5 = JSArray
const StructuralMapping$6 = JSObject
const StructuralMapping$$ = [StructuralMapping$0,StructuralMapping$1,StructuralMapping$2,StructuralMapping$3,StructuralMapping$4,StructuralMapping$5,StructuralMapping$6]
function StructuralMapping(ctx, state) { return $EVENT_C(ctx, state, "StructuralMapping", StructuralMapping$$) }

const JSArray$0 = $T($S(OpenBracket, $Q(ArrayItem), CloseBracket), function(value) {return value[1] });
function JSArray(ctx, state) { return $EVENT(ctx, state, "JSArray", JSArray$0) }

const ArrayItem$0 = $T($S(StructuralMapping, $EXPECT($R3, "ArrayItem /,\\s*|\\s*(?=\\])/")), function(value) {return value[0] });
function ArrayItem(ctx, state) { return $EVENT(ctx, state, "ArrayItem", ArrayItem$0) }

const JSObject$0 = $TS($S(OpenBrace, $Q(ObjectField), CloseBrace), function($skip, $loc, $0, $1, $2, $3) {

return {
  o: Object.fromEntries($2)
}
});
function JSObject(ctx, state) { return $EVENT(ctx, state, "JSObject", JSObject$0) }

const ObjectField$0 = $T($S($C(StringValue, Name), $EXPECT($R4, "ObjectField /:[ \\t]*/"), StructuralMapping, $EXPECT($R5, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], value[2]] });
const ObjectField$1 = $T($S(Name, $EXPECT($R5, "ObjectField /,\\s*|\\s*(?=\\})/")), function(value) {return [value[0], {"v": value[0]}] });
const ObjectField$$ = [ObjectField$0,ObjectField$1]
function ObjectField(ctx, state) { return $EVENT_C(ctx, state, "ObjectField", ObjectField$$) }

const Variable$0 = $TR($EXPECT($R6, "Variable /\\$(\\d)/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
return parseInt($1, 10)
});
const Variable$1 = Name
const Variable$$ = [Variable$0,Variable$1]
function Variable(ctx, state) { return $EVENT_C(ctx, state, "Variable", Variable$$) }

const BooleanValue$0 = $T($EXPECT($L2, "BooleanValue \"true\""), function(value) { return true });
const BooleanValue$1 = $T($EXPECT($L3, "BooleanValue \"false\""), function(value) { return false });
const BooleanValue$$ = [BooleanValue$0,BooleanValue$1]
function BooleanValue(ctx, state) { return $EVENT_C(ctx, state, "BooleanValue", BooleanValue$$) }

const NullValue$0 = $TV($EXPECT($L4, "NullValue \"null\""), function($skip, $loc, $0, $1) {

return null
});
const NullValue$1 = $TV($EXPECT($L5, "NullValue \"undefined\""), function($skip, $loc, $0, $1) {

return {l: undefined}
});
const NullValue$$ = [NullValue$0,NullValue$1]
function NullValue(ctx, state) { return $EVENT_C(ctx, state, "NullValue", NullValue$$) }

const NumberValue$0 = $TR($EXPECT($R7, "NumberValue /0x[\\da-fA-F]+/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
return parseInt($0, 16)
});
const NumberValue$1 = $TR($EXPECT($R8, "NumberValue /[-+]?\\d+(\\.\\d+)?/"), function($skip, $loc, $0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
return parseFloat($0)
});
const NumberValue$$ = [NumberValue$0,NumberValue$1]
function NumberValue(ctx, state) { return $EVENT_C(ctx, state, "NumberValue", NumberValue$$) }

const StringValue$0 = $T($S($EXPECT($L6, "StringValue \"\\\\\\\"\""), $TEXT($Q(DoubleStringCharacter)), $EXPECT($L6, "StringValue \"\\\\\\\"\"")), function(value) {return value[1] });
function StringValue(ctx, state) { return $EVENT(ctx, state, "StringValue", StringValue$0) }

const DoubleStringCharacter$0 = $R$0($EXPECT($R9, "DoubleStringCharacter /[^\"\\\\]+/"))
const DoubleStringCharacter$1 = EscapeSequence
const DoubleStringCharacter$$ = [DoubleStringCharacter$0,DoubleStringCharacter$1]
function DoubleStringCharacter(ctx, state) { return $EVENT_C(ctx, state, "DoubleStringCharacter", DoubleStringCharacter$$) }

const EscapeSequence$0 = $TEXT($S(Backslash, $EXPECT($R10, "EscapeSequence /./")))
function EscapeSequence(ctx, state) { return $EVENT(ctx, state, "EscapeSequence", EscapeSequence$0) }

const StringLiteral$0 = $T($S(StringValue), function(value) {return ["L", value[0]] });
function StringLiteral(ctx, state) { return $EVENT(ctx, state, "StringLiteral", StringLiteral$0) }

const RegExpLiteral$0 = $T($S($EXPECT($L0, "RegExpLiteral \"/\""), $N(Space), $TEXT($Q(RegExpCharacter)), $EXPECT($L0, "RegExpLiteral \"/\"")), function(value) {return ["R", value[2]] });
const RegExpLiteral$1 = $T($TEXT(CharacterClassExpression), function(value) { return ["R", value] });
const RegExpLiteral$2 = $T($EXPECT($L7, "RegExpLiteral \".\""), function(value) { return ["R", value] });
const RegExpLiteral$$ = [RegExpLiteral$0,RegExpLiteral$1,RegExpLiteral$2]
function RegExpLiteral(ctx, state) { return $EVENT_C(ctx, state, "RegExpLiteral", RegExpLiteral$$) }

const CharacterClassExpression$0 = $P(CharacterClass)
function CharacterClassExpression(ctx, state) { return $EVENT(ctx, state, "CharacterClassExpression", CharacterClassExpression$0) }

const RegExpCharacter$0 = $R$0($EXPECT($R11, "RegExpCharacter /[^\\/\\\\]+/"))
const RegExpCharacter$1 = EscapeSequence
const RegExpCharacter$$ = [RegExpCharacter$0,RegExpCharacter$1]
function RegExpCharacter(ctx, state) { return $EVENT_C(ctx, state, "RegExpCharacter", RegExpCharacter$$) }

const CharacterClass$0 = $S($EXPECT($L8, "CharacterClass \"[\""), $Q(CharacterClassCharacter), $EXPECT($L9, "CharacterClass \"]\""), $E(Quantifier))
function CharacterClass(ctx, state) { return $EVENT(ctx, state, "CharacterClass", CharacterClass$0) }

const CharacterClassCharacter$0 = $R$0($EXPECT($R12, "CharacterClassCharacter /[^\\]\\\\]+/"))
const CharacterClassCharacter$1 = EscapeSequence
const CharacterClassCharacter$$ = [CharacterClassCharacter$0,CharacterClassCharacter$1]
function CharacterClassCharacter(ctx, state) { return $EVENT_C(ctx, state, "CharacterClassCharacter", CharacterClassCharacter$$) }

const Quantifier$0 = $R$0($EXPECT($R13, "Quantifier /[?+*]|\\{\\d+(,\\d+)?\\}/"))
function Quantifier(ctx, state) { return $EVENT(ctx, state, "Quantifier", Quantifier$0) }

const Name$0 = $R$0($EXPECT($R14, "Name /[_a-zA-Z][_a-zA-Z0-9]*/"))
function Name(ctx, state) { return $EVENT(ctx, state, "Name", Name$0) }

const Arrow$0 = $S($EXPECT($L10, "Arrow \"->\""), $Q(Space))
function Arrow(ctx, state) { return $EVENT(ctx, state, "Arrow", Arrow$0) }

const Backslash$0 = $EXPECT($L11, "Backslash \"\\\\\\\\\"")
function Backslash(ctx, state) { return $EVENT(ctx, state, "Backslash", Backslash$0) }

const OpenBrace$0 = $R$0($EXPECT($R15, "OpenBrace /\\{\\s*/"))
function OpenBrace(ctx, state) { return $EVENT(ctx, state, "OpenBrace", OpenBrace$0) }

const CloseBrace$0 = $R$0($EXPECT($R16, "CloseBrace /\\}[ \\t]*/"))
function CloseBrace(ctx, state) { return $EVENT(ctx, state, "CloseBrace", CloseBrace$0) }

const OpenBracket$0 = $R$0($EXPECT($R17, "OpenBracket /\\[\\s*/"))
function OpenBracket(ctx, state) { return $EVENT(ctx, state, "OpenBracket", OpenBracket$0) }

const CloseBracket$0 = $R$0($EXPECT($R18, "CloseBracket /\\][ \\t]*/"))
function CloseBracket(ctx, state) { return $EVENT(ctx, state, "CloseBracket", CloseBracket$0) }

const OpenParenthesis$0 = $R$0($EXPECT($R19, "OpenParenthesis /\\([ \\t]*/"))
function OpenParenthesis(ctx, state) { return $EVENT(ctx, state, "OpenParenthesis", OpenParenthesis$0) }

const CloseParenthesis$0 = $R$0($EXPECT($R20, "CloseParenthesis /[ \\t]*\\)/"))
function CloseParenthesis(ctx, state) { return $EVENT(ctx, state, "CloseParenthesis", CloseParenthesis$0) }

const Indent$0 = $EXPECT($L12, "Indent \"  \"")
function Indent(ctx, state) { return $EVENT(ctx, state, "Indent", Indent$0) }

const Space$0 = $R$0($EXPECT($R21, "Space /[ \\t]+/"))
function Space(ctx, state) { return $EVENT(ctx, state, "Space", Space$0) }

const NonCommentEOS$0 = $R$0($EXPECT($R22, "NonCommentEOS /([ \\t]*(\\n|\\r\\n|\\r|$))+/"))
function NonCommentEOS(ctx, state) { return $EVENT(ctx, state, "NonCommentEOS", NonCommentEOS$0) }

const EOS$0 = $R$0($EXPECT($R23, "EOS /([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+/"))
function EOS(ctx, state) { return $EVENT(ctx, state, "EOS", EOS$0) }

const TripleBacktick$0 = $EXPECT($L13, "TripleBacktick \"```\"")
function TripleBacktick(ctx, state) { return $EVENT(ctx, state, "TripleBacktick", TripleBacktick$0) }

const TypeAnnotation$0 = $T($S($EXPECT($L14, "TypeAnnotation \"::\""), $TEXT($EXPECT($R24, "TypeAnnotation /(?:(?!->).)*/"))), function(value) {return value[1] });
function TypeAnnotation(ctx, state) { return $EVENT(ctx, state, "TypeAnnotation", TypeAnnotation$0) }

const CodeBody$0 = $TEXT($EXPECT($R25, "CodeBody /(?:(?:`(?!``))|[^`])*/"))
function CodeBody(ctx, state) { return $EVENT(ctx, state, "CodeBody", CodeBody$0) }



const parser = (function() {
  const { fail, validate, reset } = Validator()
  let ctx = { expectation: "", fail }

  return {
    parse: (input, options = {}) => {
      if (typeof input !== "string") throw new Error("Input must be a string")

      const parser = (options.startRule != null)
        ? grammar[options.startRule]
        : Object.values(grammar)[0]

      if (!parser) throw new Error(`Could not find rule with name '${options.startRule}'`)

      const filename = options.filename || "<anonymous>";

      reset()
      Object.assign(ctx, { ...options.events, tokenize: options.tokenize });

      return validate(input, parser(ctx, {
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

exports.Grammar = Grammar;
exports.Statement = Statement;
exports.CodeBlock = CodeBlock;
exports.Rule = Rule;
exports.RuleBody = RuleBody;
exports.Choice = Choice;
exports.Sequence = Sequence;
exports.SequenceExpression = SequenceExpression;
exports.ChoiceExpression = ChoiceExpression;
exports.ParameterName = ParameterName;
exports.Expression = Expression;
exports.PrefixOperator = PrefixOperator;
exports.Suffix = Suffix;
exports.SuffixOperator = SuffixOperator;
exports.Primary = Primary;
exports.Literal = Literal;
exports.Handling = Handling;
exports.HandlingExpression = HandlingExpression;
exports.HandlingExpressionBody = HandlingExpressionBody;
exports.HandlingExpressionLine = HandlingExpressionLine;
exports.StructuralMapping = StructuralMapping;
exports.JSArray = JSArray;
exports.ArrayItem = ArrayItem;
exports.JSObject = JSObject;
exports.ObjectField = ObjectField;
exports.Variable = Variable;
exports.BooleanValue = BooleanValue;
exports.NullValue = NullValue;
exports.NumberValue = NumberValue;
exports.StringValue = StringValue;
exports.DoubleStringCharacter = DoubleStringCharacter;
exports.EscapeSequence = EscapeSequence;
exports.StringLiteral = StringLiteral;
exports.RegExpLiteral = RegExpLiteral;
exports.CharacterClassExpression = CharacterClassExpression;
exports.RegExpCharacter = RegExpCharacter;
exports.CharacterClass = CharacterClass;
exports.CharacterClassCharacter = CharacterClassCharacter;
exports.Quantifier = Quantifier;
exports.Name = Name;
exports.Arrow = Arrow;
exports.Backslash = Backslash;
exports.OpenBrace = OpenBrace;
exports.CloseBrace = CloseBrace;
exports.OpenBracket = OpenBracket;
exports.CloseBracket = CloseBracket;
exports.OpenParenthesis = OpenParenthesis;
exports.CloseParenthesis = CloseParenthesis;
exports.Indent = Indent;
exports.Space = Space;
exports.NonCommentEOS = NonCommentEOS;
exports.EOS = EOS;
exports.TripleBacktick = TripleBacktick;
exports.TypeAnnotation = TypeAnnotation;
exports.CodeBody = CodeBody;

