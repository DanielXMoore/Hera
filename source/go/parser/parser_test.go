package parser

import (
	"io"
	"log"
	"os"
	"testing"
)

func readFile(f string) string {
	file, err := os.Open(f)
	if err != nil {
		log.Panic(err)
	}

	bytes, err := io.ReadAll(file)
	if err != nil {
		log.Panic(err)
	}

	return string(bytes)
}

func TestParse(t *testing.T) {
	s := readFile("../../../samples/hera.hera")
	result, found := Parse(s)

	t.Logf("%o", result)

	if !found {
		t.Fail()
	}
}

func BenchmarkParse(b *testing.B) {
	s := readFile("../../../samples/hera.hera")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Parse(s)
	}
}
