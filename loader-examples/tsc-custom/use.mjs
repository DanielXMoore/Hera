import assert from "node:assert"
import { parse } from "./grammar.hera"

assert.equal(parse("a"), "HELPER IS IMPORTED")
console.log("ok")
