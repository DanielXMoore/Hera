{compile, parse} = require './main'
encoding = "utf8"
fs = require "fs"

input = fs.readFileSync process.stdin.fd, encoding
ast = parse input

if process.argv.includes '--ast'
  process.stdout.write JSON.stringify(ast, null, 2)
  process.exit 0

process.stdout.write compile ast,
  types: process.argv.includes '--types'

# Write out cli io
if process.argv.includes '--cli'
  process.stdout.write """


    if (require.main === module) {
      const encoding = "utf8"
      const fs = require("fs")

      const input = fs.readFileSync(process.stdin.fd, encoding)
      const ast = parse(input)

      process.stdout.write(JSON.stringify(ast, null, 2))
    }
  """
