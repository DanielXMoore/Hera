// The test will only succeed if the custom Hera compiler options are applied
const heraOptions = {
  libPath: "./customLib.cjs", // path is relative to the hera file
};

// ESM
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
// register the basic Hera ESM loader with custom Hera compiler options
register("@danielx/hera/register/esm", pathToFileURL(__filename), {
  data: {
    ...heraOptions,
    module: false, // customLib.cjs is CJS so we need to compile the grammar as CJS
  }
});

// CJS
// set the custom hera compiler options on the CJS loader module
require("@danielx/hera/register/cjs").options.hera = heraOptions;
