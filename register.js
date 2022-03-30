if (require.extensions) {
  const fs = require("fs");
  const { generate } = require("./");

  require.extensions[".hera"] = function (module, filename) {
    return module.exports = generate(fs.readFileSync(filename, 'utf8'));
  };
}
