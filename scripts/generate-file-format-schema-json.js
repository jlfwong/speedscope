#!/usr/bin/env node
const child_process = require('child_process')

// Convert the file-format-spec.ts file into a json schema file
let jsonSchema = child_process.execSync(
  'node_modules/.bin/quicktype --lang schema ./file-format-spec.ts',
  {
    encoding: 'utf8',
  },
)
jsonSchema = JSON.parse(jsonSchema)
jsonSchema['$ref'] = '#/definitions/FileFormat.File'
console.log(JSON.stringify(jsonSchema, null, 4))
