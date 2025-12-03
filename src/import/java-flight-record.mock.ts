import fs from 'fs'

// We need to load the wasm binary as file
// This is different from the production case where we load the binary via `fetch`
const wasm_module = fs.readFileSync('node_modules/jfrview/jfrview_bg.wasm')
module.exports = wasm_module
