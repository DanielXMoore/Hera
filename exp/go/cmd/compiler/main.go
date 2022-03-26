package main

import (
	"bufio"
	"io"
	"log"
	"os"

	"danielx.net/hera/v2/compiler"
)

func main() {
	bytes, err := io.ReadAll(bufio.NewReader(os.Stdin))
	if err != nil {
		log.Fatal(err)
	}

	source := compiler.CompileBytes(bytes)
	io.WriteString(os.Stdout, source)
}
