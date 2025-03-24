// The test will only succeed if the custom Hera compiler options are applied
const heraOptions = {
  module: true
};

// ESM
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
register("@danielx/hera/register/esm", pathToFileURL(__filename), {
  data: heraOptions,
});
