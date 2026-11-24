// Custom Civet parseOptions for coffeeCompat syntax in grammar handler bodies.

const civetParseOptions = { parseOptions: { coffeeCompat: true } };


// ESM
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
// The Civet hook compiles .hera files itself; `hera` would hold Hera options
register("@danielx/hera/register/civet/esm", pathToFileURL(__filename), { data: { civet: civetParseOptions } });


// CJS
const heraCivetCjs = require("@danielx/hera/register/civet/cjs");
heraCivetCjs.options.civet = civetParseOptions;
