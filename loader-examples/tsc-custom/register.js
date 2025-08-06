// Custom tsc compiler options.

// The test: importing ./helper.cts will only succeed if these compiler options are applied
const tscCompilerOptions = {
  rewriteRelativeImportExtensions: true,
};


// ESM
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
// First, register basic Hera ESM loader
register("@danielx/hera/register/esm", pathToFileURL(__filename));
// Then, register another loader that transpiles the output of the Hera loader, using custom typscript compiler options
register("@danielx/hera/register/tsc/esm", pathToFileURL(__filename), {
  data: tscCompilerOptions,
});


// CJS
const heraCjs = require("@danielx/hera/register/tsc/cjs");
heraCjs.options.tsc = {
  ...tscCompilerOptions,
  module: require("typescript").ModuleKind.CommonJS // have tsc compile to CommonJS so use.cjs can require it
};
