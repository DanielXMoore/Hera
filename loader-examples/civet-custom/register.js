// Custom Civet parseOptions for coffeeCompat syntax in grammar handler bodies.

const civetParseOptions = { parseOptions: { coffeeCompat: true } };


// ESM
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
// First, register basic Hera ESM loader with language:'civet'
register("@danielx/hera/register/esm", pathToFileURL(__filename), { data: { language: 'civet' } });
// Then, register the Civet post-processor hook with custom parseOptions
register("@danielx/hera/register/civet/esm", pathToFileURL(__filename), { data: civetParseOptions });


// CJS
const heraCivetCjs = require("@danielx/hera/register/civet/cjs");
heraCivetCjs.options.civet = civetParseOptions;
