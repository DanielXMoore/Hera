import assert from "node:assert"
import { parse } from "./grammar.hera"

try {
  parse("a")
} catch (e) {
  assert.equal(e, "USING CUSTOM LIB")
  console.log('ok')
  process.exit(0)
}

assert.fail("Should have thrown")
