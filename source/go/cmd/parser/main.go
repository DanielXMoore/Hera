package main

import (
	"bufio"
	"io"
	"log"
	"os"

	"danielx.net/hera/v2/parser"
)

func main() {
	bytes, err := io.ReadAll(bufio.NewReader(os.Stdin))
	if err != nil {
		log.Fatal(err)
	}

	s := string(bytes)
	result, found := parser.Parse(s)

	if !found {
		log.Fatal("failed to parse", s)
	}

	log.Printf("Found %o", result)
}
