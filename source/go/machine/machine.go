package machine

import (
	"regexp"
)

type Parser func(ParseState) (Result, bool)

type ParseState struct {
	Input string
	Pos   int
}

type Location struct {
	Pos, length int
}

type Result struct {
	Location Location
	Pos      int
	Value    any
}

func R(s string) Parser {
	re := regexp.MustCompile("^" + s)

	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		Input := state.Input

		res := re.FindStringIndex(Input[state.Pos:])

		if res == nil {
			return Result{}, false
		}

		len := res[1]

		return Result{
			Location: Location{
				Pos:    Pos,
				length: len,
			},
			Pos:   Pos + len,
			Value: Input[Pos : Pos+len],
		}, true
	}
}

func L(s string) Parser {
	l := len(s)

	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		Input := state.Input

		if Pos+l > len(Input) {
			return Result{}, false
		}

		return Result{
			Location: Location{
				Pos:    Pos,
				length: l,
			},
			Pos:   Pos + l,
			Value: Input[Pos : Pos+l],
		}, Input[Pos:Pos+l] == s
	}
}

func Sequence(seq ...Parser) Parser {
	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		startPos := Pos
		Input := state.Input
		Values := make([]any, len(seq))

		for index, p := range seq {
			result, found := p(ParseState{Input: Input, Pos: Pos})

			if !found {
				return result, false
			}

			Values[index] = result.Value
			Pos = result.Pos
		}

		return Result{
			Location: Location{
				Pos:    startPos,
				length: Pos - startPos,
			},
			Pos:   Pos,
			Value: Values,
		}, true
	}
}

func Choice(seq ...Parser) Parser {
	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		Input := state.Input

		for _, p := range seq {
			result, found := p(ParseState{Input: Input, Pos: Pos})

			if found {
				return result, true
			}
		}

		return Result{}, false
	}
}

func Text(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		Input := state.Input
		result, found := p(state)

		if found {
			result.Value = Input[Pos:result.Pos]
			return result, true
		}

		return result, false
	}
}

func Option(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		result, found := p(state)

		if found {
			return result, true
		}

		return Result{
			Location: Location{
				Pos:    Pos,
				length: 0,
			},
			Pos:   Pos,
			Value: nil,
		}, true
	}
}

func Assert(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		_, found := p(state)

		return Result{
			Location: Location{
				Pos:    Pos,
				length: 0,
			},
			Pos:   Pos,
			Value: nil,
		}, found
	}
}

func Negate(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		Pos := state.Pos
		_, found := p(state)

		return Result{
			Location: Location{
				Pos:    Pos,
				length: 0,
			},
			Pos:   Pos,
			Value: nil,
		}, !found
	}
}

// TODO: Could be Quantified(p, 0, 0)
func Repetition(p Parser) Parser {
	return func(state ParseState) (Result, bool) {
		startPos := state.Pos
		Pos := startPos
		Input := state.Input
		Values := make([]any, 0)

		for {
			result, found := p(ParseState{Pos: Pos, Input: Input})
			if found {
				Pos = result.Pos

				if Pos == startPos {
					// skip zero width repetitions since they would be infinite
					break
				}
				Values = append(Values, result.Value)

			} else {
				break
			}
		}

		return Result{
			Location: Location{
				Pos:    startPos,
				length: Pos - startPos,
			},
			Pos:   Pos,
			Value: Values,
		}, true
	}
}

func Quantified(p Parser, min, max int) Parser {
	return func(state ParseState) (Result, bool) {
		startPos := state.Pos

		Pos := startPos
		Input := state.Input
		Values := make([]any, 0)
		n := 0

		for {
			if max > 0 && n == max {
				break
			}
			result, found := p(ParseState{Pos: Pos, Input: Input})
			if found {
				Pos = result.Pos

				if Pos == startPos {
					// skip zero width repetitions since they would be infinite
					break
				}
				Values = append(Values, result.Value)

			} else {
				break
			}

			n++
		}

		if n >= min {
			return Result{
				Location: Location{
					Pos:    startPos,
					length: Pos - startPos,
				},
				Pos:   Pos,
				Value: Values,
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
			res.Value = fn(res.Value)
		}

		return res, found
	}
}
