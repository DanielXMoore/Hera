package machine

import (
	"fmt"
	"testing"
)

func BenchmarkF(b *testing.B) {
	for i := 0; i < b.N; i++ {
		fmt.Sprintf("Hi")
	}
}

func TestSequence(t *testing.T) {
	s := "bbbbcdabcda"

	t.Log(s)

	parser := Sequence(Plus(L("b")), R("b?c+"), R("dab"), L("cda"))

	res, found := parser(ParseState{Input: s, Pos: 0})

	if found {
		t.Logf("found %o at %d", res, res.Location.Pos)
	} else {
		t.Logf("not found")
		t.Fail()
	}
}
