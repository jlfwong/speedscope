#!/usr/bin/env node
const child_process = require('child_process')

// Convert the file-format-spec.ts file into a json schema file
let jsonSchema = child_process.execSync(
  'node_modules/.bin/typescript-json-schema ./src/lib/file-format-spec.ts --titles --required --topRef "*"',
  {
    encoding: 'utf8',
  },
)
jsonSchema = JSON.parse(jsonSchema)

if (!jsonSchema.definitions['FileFormat.File']) {
  console.error('SCHEMA GENERATION FAILURE: Could not find FileFormat.File in the definitions list')
  console.error(jsonSchema)
  process.exit(1)
}

jsonSchema['$ref'] = '#/definitions/FileFormat.File'
console.log(JSON.stringify(jsonSchema, null, 4))
