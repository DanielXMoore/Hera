{compile, parse} = require './main'
encoding = "utf8"
fs = require "fs"

input = fs.readFileSync(process.stdin.fd, encoding)
process.stdout.write compile(parse(input),
  types: process.argv.includes('--types')
)
