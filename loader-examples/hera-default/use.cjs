const assert = require("node:assert")
const { parse, exportedValue } = require('./grammar.cjs.hera')

assert.equal(parse("a"), "ok")
assert.equal(exportedValue, "ok")
console.log("ok")
