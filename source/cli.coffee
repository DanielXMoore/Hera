{compile} = require '../dist/main'
encoding = "utf8"
fs = require "fs"

try
  input = fs.readFileSync(process.stdin.fd, encoding)
  process.stdout.write compile input
catch e
  process.stderr.write e
