import { readFileSync } from 'fs'

Object.assign global,
  readFile: (p) ->
    readFileSync(p, 'utf8')
    .replace(/\r\n/g, "\n")
