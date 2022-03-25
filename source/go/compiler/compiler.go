package compiler

import (
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
)

type Options = any
type HeraAST = any
type Rules = map[string]any

var firstName = regexp.MustCompile("\\{\\s*\"([_a-zA-Z][_a-zA-Z0-9]*)\"")

func getStartRule(bytes []byte) (string, bool) {
	match := firstName.FindSubmatch(bytes)
	l := len(match)

	if l == 2 {
		return string(match[1]), true
	}
	return "", false
}

func CompileBytes(bytes []byte) string {
	var rules Rules
	json.Unmarshal(bytes, &rules)

	startRule, found := getStartRule(bytes)
	if !found {
		log.Fatal("No start rule found")
	}

	return Compile(rules, startRule)
}

func Compile(rules Rules, startRule string) string {
	var builder = strings.Builder{}

	for key, value := range rules {
		builder.WriteString(compileRule(key, value))
	}

	return getHeader() + builder.String()
}

func getImports() string {
	return "import (" +
		"\n\tM \"danielx.net/hera/v2/machine\"\n)\n\n"
}

func getParse() string {
	return "func Parse(s string) (M.Result, bool) {" +
		"\n\treturn Grammar(M.ParseState{" +
		"\n\t	Input: s," +
		"\n\t	Pos:   0," +
		"\n\t})" +
		"\n}\n\n"
}

func getHeader() string {
	lits := strMap(litDefs, func(i int, s string) string {
		return fmt.Sprintf("var L%d =\tM.L(\"%s\")\n", i, s)
	})

	res := strMap(reDefs, func(i int, s string) string {
		return fmt.Sprintf("var R%d =\tM.R(%q)\n", i, s)
	})

	return fmt.Sprintf("package parser\n\n" +
		getImports() +
		getParse() +
		lits + "\n" +
		res + "\n")
}

func compileRule(name string, ast any) string {
	body := compileAST(ast)
	return fmt.Sprintf("func %s(state M.ParseState) (M.Result, bool) {\n\treturn %s(state)\n}\n\n", name, body)
}

// defineRe = (re) ->
//   index = reDefs.indexOf(re)

//   if index >= 0
//     id = "$R#{index}"
//   else
//     id = "$R#{reDefs.length}"
//     reDefs.push re

//   return id

var reDefs []string = make([]string, 0, 10)
var litDefs []string = make([]string, 0, 10)

func strMap(a []string, f func(int, string) string) string {
	b := strings.Builder{}
	for i, s := range a {
		b.WriteString(f(i, s))
	}
	return b.String()
}

func indexOf(a []string, s string) int {
	for i, v := range a {
		if v == s {
			return i
		}
	}
	return -1
}

func defineRegExp(re string) string {
	i := indexOf(reDefs, re)

	if i >= 0 {
		return fmt.Sprintf("R%d", i)
	}

	id := fmt.Sprintf("R%d", len(reDefs))
	reDefs = append(reDefs, re)
	return id
}

func defineLiteral(lit string) string {
	i := indexOf(litDefs, lit)

	if i >= 0 {
		return fmt.Sprintf("L%d", i)
	}

	id := fmt.Sprintf("L%d", len(litDefs))
	litDefs = append(litDefs, lit)
	return id
}

func compileAST(ast any) string {
	switch x := ast.(type) {
	case string:
		return x
	case []any:
		op, ok := x[0].(string)
		if !ok {
			log.Fatalf("Invalid op type %o", x[0])
		}

		switch op {
		case "/":
			return fmt.Sprintf("M.Choice(%s)", compileArgs(x[1]))
		case "S":
			return fmt.Sprintf("M.Sequence(%s)", compileArgs(x[1]))
		case "L":
			str, ok := x[1].(string)
			if !ok {
				log.Fatalf("Invalid literal %o", x[1])
			}
			return defineLiteral(str)
		case "R":
			re, ok := x[1].(string)
			if !ok {
				log.Fatalf("Invalid regexp %o", x[1])
			}
			return defineRegExp(re)
		case "?":
			return fmt.Sprintf("M.Option(%s)", compileAST(x[1]))
		case "+":
			return fmt.Sprintf("M.Quantified(%s, 1, 0)", compileAST(x[1]))
		case "*":
			return fmt.Sprintf("M.Quantified(%s, 0, 0)", compileAST(x[1]))
		case "$":
			return fmt.Sprintf("M.Text(%s)", compileAST(x[1]))
		case "&":
			return fmt.Sprintf("M.Assert(%s)", compileAST(x[1]))
		case "!":
			return fmt.Sprintf("M.Negate(%s)", compileAST(x[1]))
		default:
			log.Fatalf("Unhandled op %q", op)
		}
	default:
		log.Fatalf("Unhandled AST type %o", ast)
	}

	panic("Didn't compile AST")
}

func compileArgs(m any) string {
	args, ok := m.([]any)
	if !ok {
		log.Fatalf("Invalid args %o", m)
	}

	b := strings.Builder{}
	for i, arg := range args {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(compileAST(arg))
	}

	return b.String()
}
