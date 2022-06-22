fs = require('fs')
path = require('path')

Object.assign global,
  readFile: (p) ->
    fs.readFileSync(path.join(__dirname, "..", p), 'utf8')
    .replace(/\r\n/g, "\n")
