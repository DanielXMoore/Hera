package parser

import (
	M "danielx.net/hera/v2/machine"
)

func Parse(s string) (M.Result, bool) {
	return Grammar(M.ParseState{
		Input: s,
		Pos:   0,
	})
}

var L0 =	M.L("->")
var L1 =	M.L("[")
var L2 =	M.L("]")
var L3 =	M.L(",")
var L4 =	M.L("\\")
var L5 =	M.L("/")
var L6 =	M.L(".")
var L7 =	M.L("  ")
var L8 =	M.L("\"")

var R0 =	M.R("[ \\t]+")
var R1 =	M.R(".")
var R2 =	M.R("[^\\/\\\\]+")
var R3 =	M.R("\\[[ \\t]*")
var R4 =	M.R("[ \\t]*\\)")
var R5 =	M.R("[+?*]")
var R6 =	M.R("([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+")
var R7 =	M.R("[^\\]\\\\]+")
var R8 =	M.R("[?+*]|\\{\\d+(,\\d+)?\\}")
var R9 =	M.R("\\$(\\d)")
var R10 =	M.R("[_a-zA-Z][_a-zA-Z0-9]*")
var R11 =	M.R("\\][ \\t]*")
var R12 =	M.R("\\([ \\t]*")
var R13 =	M.R("[^\\n\\r]*")
var R14 =	M.R("[^\"\\\\]+")
var R15 =	M.R("[$&!]")
var R16 =	M.R("\\d+(\\.\\d+)?")

func Space(state M.ParseState) (M.Result, bool) {
	return R0(state)
}

func Choice(state M.ParseState) (M.Result, bool) {
	return M.Sequence(Sequence, Handling)(state)
}

func EscapeSequence(state M.ParseState) (M.Result, bool) {
	return M.Text(M.Sequence(Backslash, R1))(state)
}

func RegExpCharacter(state M.ParseState) (M.Result, bool) {
	return M.Choice(R2, EscapeSequence)(state)
}

func Arrow(state M.ParseState) (M.Result, bool) {
	return M.Sequence(L0, M.Quantified(Space, 0, 0))(state)
}

func OpenBracket(state M.ParseState) (M.Result, bool) {
	return R3(state)
}

func CharacterClass(state M.ParseState) (M.Result, bool) {
	return M.Sequence(L1, M.Quantified(CharacterClassCharacter, 0, 0), L2, M.Option(Quantifier))(state)
}

func CloseParenthesis(state M.ParseState) (M.Result, bool) {
	return R4(state)
}

func SuffixOperator(state M.ParseState) (M.Result, bool) {
	return R5(state)
}

func Primary(state M.ParseState) (M.Result, bool) {
	return M.Choice(Name, Literal, M.Sequence(OpenParenthesis, Sequence, CloseParenthesis))(state)
}

func HandlingExpressionBody(state M.ParseState) (M.Result, bool) {
	return M.Quantified(HandlingExpressionLine, 1, 0)(state)
}

func CommaThenValue(state M.ParseState) (M.Result, bool) {
	return M.Sequence(M.Quantified(Space, 0, 0), L3, M.Quantified(Space, 0, 0), StructuralMapping, M.Quantified(Space, 0, 0))(state)
}

func CharacterClassExpression(state M.ParseState) (M.Result, bool) {
	return M.Quantified(CharacterClass, 1, 0)(state)
}

func Sequence(state M.ParseState) (M.Result, bool) {
	return M.Choice(M.Sequence(Expression, M.Quantified(SequenceExpression, 1, 0)), M.Sequence(Expression, M.Quantified(ChoiceExpression, 1, 0)), Expression)(state)
}

func Backslash(state M.ParseState) (M.Result, bool) {
	return L4(state)
}

func EOS(state M.ParseState) (M.Result, bool) {
	return R6(state)
}

func Rule(state M.ParseState) (M.Result, bool) {
	return M.Sequence(Name, EOS, RuleBody)(state)
}

func SequenceExpression(state M.ParseState) (M.Result, bool) {
	return M.Sequence(Space, Expression)(state)
}

func RegExpLiteral(state M.ParseState) (M.Result, bool) {
	return M.Choice(M.Sequence(L5, M.Negate(Space), M.Text(M.Quantified(RegExpCharacter, 0, 0)), L5), M.Text(CharacterClassExpression), L6)(state)
}

func CharacterClassCharacter(state M.ParseState) (M.Result, bool) {
	return M.Choice(R7, EscapeSequence)(state)
}

func Quantifier(state M.ParseState) (M.Result, bool) {
	return R8(state)
}

func ChoiceExpression(state M.ParseState) (M.Result, bool) {
	return M.Sequence(Space, L5, Space, Expression)(state)
}

func Expression(state M.ParseState) (M.Result, bool) {
	return M.Choice(Suffix, M.Sequence(PrefixOperator, Suffix))(state)
}

func Suffix(state M.ParseState) (M.Result, bool) {
	return M.Choice(M.Sequence(Primary, SuffixOperator), Primary)(state)
}

func Variable(state M.ParseState) (M.Result, bool) {
	return R9(state)
}

func Name(state M.ParseState) (M.Result, bool) {
	return R10(state)
}

func Handling(state M.ParseState) (M.Result, bool) {
	return M.Choice(M.Sequence(EOS), M.Sequence(M.Quantified(Space, 0, 0), Arrow, HandlingExpression))(state)
}

func HandlingExpression(state M.ParseState) (M.Result, bool) {
	return M.Choice(M.Sequence(EOS, HandlingExpressionBody), M.Sequence(StructuralMapping, EOS))(state)
}

func StructuralMapping(state M.ParseState) (M.Result, bool) {
	return M.Choice(StringValue, NumberValue, Variable, M.Sequence(OpenBracket, StructuralMapping, M.Quantified(CommaThenValue, 0, 0), CloseBracket))(state)
}

func Indent(state M.ParseState) (M.Result, bool) {
	return L7(state)
}

func CloseBracket(state M.ParseState) (M.Result, bool) {
	return R11(state)
}

func OpenParenthesis(state M.ParseState) (M.Result, bool) {
	return R12(state)
}

func Grammar(state M.ParseState) (M.Result, bool) {
	return M.Sequence(M.Quantified(EOS, 0, 0), M.Quantified(Rule, 1, 0))(state)
}

func RuleBody(state M.ParseState) (M.Result, bool) {
	return M.Quantified(M.Sequence(Indent, Choice), 1, 0)(state)
}

func Literal(state M.ParseState) (M.Result, bool) {
	return M.Choice(StringLiteral, RegExpLiteral)(state)
}

func HandlingExpressionLine(state M.ParseState) (M.Result, bool) {
	return M.Sequence(Indent, Indent, R13, EOS)(state)
}

func DoubleStringCharacter(state M.ParseState) (M.Result, bool) {
	return M.Choice(R14, EscapeSequence)(state)
}

func PrefixOperator(state M.ParseState) (M.Result, bool) {
	return R15(state)
}

func NumberValue(state M.ParseState) (M.Result, bool) {
	return R16(state)
}

func StringValue(state M.ParseState) (M.Result, bool) {
	return M.Sequence(L8, M.Text(M.Quantified(DoubleStringCharacter, 0, 0)), L8)(state)
}

func StringLiteral(state M.ParseState) (M.Result, bool) {
	return M.Sequence(StringValue)(state)
}

