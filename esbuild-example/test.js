import assert from "node:assert";

import { parse as untypedParse } from "./grammar.hera";
import { parse as typedParse } from "./grammar.ts.hera";

// validate that both parsers compiled correctly
export function test() {
  assert.equal(untypedParse("a"), "ok");
  assert.equal(typedParse("a"), "ok");
}
