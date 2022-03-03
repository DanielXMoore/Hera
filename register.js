if (require.extensions) {
  var Hera, fs;

  fs = require("fs");
  Hera = require("./");

  require.extensions[".hera"] = function(module, filename) {
    var rules, source;
    source = fs.readFileSync(filename, 'utf8');
    rules = Hera.parse(source, {
      filename: filename
    });
    return module.exports = Hera.generate(rules, true);
  };
}
