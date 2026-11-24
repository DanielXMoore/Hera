// The same custom Civet parseOptions, registered the way this hook used to
// require: after the base Hera ESM hook, which takes the Hera options, with
// Civet options as `data`.  The Civet hook now compiles .hera files itself,
// with the base hook's options, so this keeps working (see use-chained.mjs).

const civetParseOptions = { parseOptions: { coffeeCompat: true } };

const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
register("@danielx/hera/register/esm", pathToFileURL(__filename), { data: { language: 'civet', module: false } });
register("@danielx/hera/register/civet/esm", pathToFileURL(__filename), { data: civetParseOptions });
