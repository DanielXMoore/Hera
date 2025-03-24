const assert = require("node:assert")
const { parse } = require('./grammar.hera')

assert.equal(parse("a"), "ok")
console.log("ok")
