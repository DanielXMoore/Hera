// A version of machine.js that a test can prove is being used by the compiled grammar

const lib = require("@danielx/hera/lib");

// re-export everything from the original machine.js
module.exports = {
  ...lib,
  // replace Validator() with one that throws an error that the test expect
  Validator: () => ({
    ...lib.Validator(),
    validate() {
      throw "USING CUSTOM LIB";
    },
  }),
};
