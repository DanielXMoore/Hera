// Custom tsc compiler options.

// The test: importing ./helper.cts will only succeed if these compiler options are applied
const tscCompilerOptions = {
  rewriteRelativeImportExtensions: true,
};


// ESM
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
// The tsc hook compiles .hera files itself; `hera` would hold Hera options
register("@danielx/hera/register/tsc/esm", pathToFileURL(__filename), {
  data: { tsc: tscCompilerOptions },
});


// CJS
const heraCjs = require("@danielx/hera/register/tsc/cjs");
heraCjs.options.tsc = {
  ...tscCompilerOptions,
  module: require("typescript").ModuleKind.CommonJS // have tsc compile to CommonJS so use.cjs can require it
};
