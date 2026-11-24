import assert from "node:assert"
import grammar, { parse } from "./grammar.hera"

// register-chained.js gives the base hook `module: false`, so the grammar
// loads as CommonJS, and its default export is the whole `exports` object
assert.equal(typeof grammar.default?.parse, "function")
assert.equal(parse("a"), "ok")
console.log("ok")
