// The same custom tsc compiler options, registered the way this hook used to
// require: after the base Hera ESM hook, with tsc options as `data`.  The tsc
// hook now compiles .hera files itself, so this keeps working.

const tscCompilerOptions = {
  rewriteRelativeImportExtensions: true,
};

const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
register("@danielx/hera/register/esm", pathToFileURL(__filename));
register("@danielx/hera/register/tsc/esm", pathToFileURL(__filename), {
  data: tscCompilerOptions,
});
