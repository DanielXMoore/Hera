package main

import (
	"fmt"
	"regexp"
)

type Parser func(ParseState) (Result, bool)

type ParseState struct {
	input string
	pos   int
}

type Location struct {
	pos, length int
}

type Result struct {
	location Location
	pos      int
	value    any
}

func main() {
	s := "bbbbcdabcda"
	parser := Sequence(Plus(L("b")), R("b?c+"), R("dab"), L("cda"))

	res, found := parser(ParseState{input: s, pos: 0})

	if found {
		fmt.Printf("found %o at %d", res, res.location.pos)
	} else {
		fmt.Printf("not found")
	}
}

func R(s string) Parser {
	re := regexp.MustCompile("^" + s)

	return func(state ParseState) (Result, bool) {
		pos := state.pos
		input := state.input
		res := re.FindStringIndex(input[state.pos:])

		if res == nil {
			return Result{}, false
		}

		len := res[1]

		return Result{
			location: Location{
				pos:    pos,
				length: len,
			},
			pos:   pos + len,
			value: input[pos : pos+len],
		}, true
	}
}

func L(s string) Parser {
	l := len(s)

	return func(state ParseState) (Result, bool) {
		pos := state.pos
		input := state.input

		return Result{
			location: Location{
				pos:    pos,
				length: l,
			},
			pos:   pos + l,
			value: input[pos : pos+l],
		}, input[pos:pos+l] == s
	}
}

func Sequence(seq ...Parser) Parser {
	return func(state ParseState) (Result, bool) {
		pos := state.pos
		startPos := pos
		input := state.input
		values := make([]any, len(seq))

		for index, p := range seq {
			result, found := p(ParseState{input: input, pos: pos})

			if !found {
				return result, false
			}

			values[index] = result.value
			pos = result.pos
		}

		return Result{
			location: Location{
				pos:    startPos,
				length: pos - startPos,
			},
			pos:   pos,
			value: values,
		}, true
	}
}

func Choice(seq ...Parser) Parser {
	return func(state ParseState) (Result, bool) {
		pos := state.pos
		input := state.input

		for _, p := range seq {
			result, found := p(ParseState{input: input, pos: pos})

			if found {
				return result, true
			}
		}

		return Result{}, false
	}
}

func Option(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		pos := state.pos
		result, found := p(state)

		if found {
			return result, true
		}

		return Result{
			location: Location{
				pos:    pos,
				length: 0,
			},
			pos:   pos,
			value: nil,
		}, true
	}
}

func Assert(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		pos := state.pos
		_, found := p(state)

		return Result{
			location: Location{
				pos:    pos,
				length: 0,
			},
			pos:   pos,
			value: nil,
		}, found
	}
}

func Negate(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		pos := state.pos
		_, found := p(state)

		return Result{
			location: Location{
				pos:    pos,
				length: 0,
			},
			pos:   pos,
			value: nil,
		}, !found
	}
}

// TODO: Could be Quantified(p, 0, 0)
func Repetition(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		startPos := state.pos
		pos := startPos
		input := state.input
		values := make([]any, 0)

		for {
			result, found := p(ParseState{pos: pos, input: input})
			if found {
				pos = result.pos

				if pos == startPos {
					// skip zero width repetitions since they would be infinite
					break
				}
				values = append(values, result.value)

			} else {
				break
			}
		}

		return Result{
			location: Location{
				pos:    startPos,
				length: pos - startPos,
			},
			pos:   pos,
			value: values,
		}, true
	}
}

func Quantified(p Parser, min, max int) Parser {
	return func(state ParseState) (Result, bool) {
		startPos := state.pos
		pos := startPos
		input := state.input
		values := make([]any, 0)
		n := 0

		for {
			if max > 0 && n == max {
				break
			}
			result, found := p(ParseState{pos: pos, input: input})
			if found {
				pos = result.pos

				if pos == startPos {
					// skip zero width repetitions since they would be infinite
					break
				}
				values = append(values, result.value)

			} else {
				break
			}

			n++
		}

		if n >= min {
			return Result{
				location: Location{
					pos:    startPos,
					length: pos - startPos,
				},
				pos:   pos,
				value: values,
			}, true
		} else {
			return Result{}, false
		}
	}
}

func Plus(p Parser) Parser {
	return Quantified(p, 1, 0)
}

func Transform(p Parser, fn func(any) any) Parser {
	return func(state ParseState) (Result, bool) {
		res, found := p(state)

		if found {
			res.value = fn(res.value)
		}

		return res, found
	}
}
