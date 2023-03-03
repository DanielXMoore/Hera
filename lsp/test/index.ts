import assert from "assert";
import { readFileSync } from "fs";

import { parse, declarations, getDocumentSymbols, parseDocument } from "../src/util";

const sampleText = readFileSync(__dirname + "/../../source/hera.hera", "utf8")

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

  it("should gather declarations", () => {
    console.log(sampleTokens.children)
    const decs = declarations(sampleTokens.children)

    assert.equal(Array.from(decs.entries()).length, 54)
  })
});
