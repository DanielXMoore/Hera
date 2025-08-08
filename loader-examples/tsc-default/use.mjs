import assert from "node:assert"
import { parse, exportedValue } from './grammar.mts.hera'

assert.equal(parse("a"), "ok")
assert.equal(exportedValue, "ok")
console.log("ok")
