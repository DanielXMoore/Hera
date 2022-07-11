import assert from "assert";
import { readFileSync } from "fs";

import { parse, declarations, getDocumentSymbols, parseDocument } from "../src/util";

const sampleText = readFileSync(__dirname + "/../../samples/hera.hera", "utf8")

const sampleDocument = {
  uri: "test",
  languageId: "hera",
  version: 0,
  positionAt: () => ({ line: 0, character: 0 }),
  offsetAt: () => 0,
  lineCount: 0,
  getText: () => {
    return sampleText
  }
}

const sampleTokens = parse(sampleText, { tokenize: true })

describe("utils", () => {
  it("tranducers", () => {
    assert(true);
    assert(getDocumentSymbols);
  });

  it("should parse hera document tokens", () => {
    parseDocument(sampleDocument)
  });

  it.only("should gather declarations", () => {
    const decs = declarations(sampleTokens.children[1])

    assert.equal(Array.from(decs.entries()).length, 49)
  })
});
