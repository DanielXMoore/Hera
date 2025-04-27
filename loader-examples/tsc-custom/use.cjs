const assert = require("node:assert")
const { parse } = require("./grammar.hera")

assert.equal(parse("a"), "HELPER IS IMPORTED")
console.log("ok")

