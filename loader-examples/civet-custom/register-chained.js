// The same custom Civet parseOptions, registered the way this hook used to
// require: after the base Hera ESM hook, with Civet options as `data`.  The
// Civet hook now compiles .hera files itself, so the base hook passes them
// through, and this keeps working.

const civetParseOptions = { parseOptions: { coffeeCompat: true } };

const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
register("@danielx/hera/register/esm", pathToFileURL(__filename), { data: { language: 'civet' } });
register("@danielx/hera/register/civet/esm", pathToFileURL(__filename), { data: civetParseOptions });
