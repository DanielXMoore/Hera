import assert from "node:assert"
import { parse } from "./grammar.hera"

assert.equal(parse("a"), "ok")
console.log("ok")
