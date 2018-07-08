#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const os = require('os')
const opn = require('opn')

const helpString = `
Usage: speedscope [filepath]

If invoked with no arguments, will open a local copy of speedscope in your default browser.
Once open, you can browse for a profile to import.
`

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(helpString)
  process.exit(0)
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('v' + require('./package.json').version)
  process.exit(0)
}

if (process.argv.length > 3) {
  console.log('At most one argument expected')
  console.log(helpString)
  process.exit(1)
}

let urlToOpen = 'file://' + path.resolve(__dirname, './dist/release/index.html')

if (process.argv.length === 3) {
  const absPath = path.resolve(process.cwd(), process.argv[2])
  let sourceBuffer
  try {
    sourceBuffer = fs.readFileSync(absPath)
  } catch (e) {
    console.log(e)
    console.log(helpString)
    process.exit(1)
  }
  const filename = path.basename(absPath)
  const sourceBase64 = sourceBuffer.toString('base64')
  const jsSource = `speedscope.loadFileFromBase64(${JSON.stringify(filename)}, ${JSON.stringify(
    sourceBase64,
  )})`

  const filePrefix = `speedscope-${+new Date()}-${process.pid}`
  const jsPath = path.join(os.tmpdir(), `${filePrefix}.js`)
  console.log(`Creating temp file ${jsPath}`)
  fs.writeFileSync(jsPath, jsSource)
  urlToOpen += `#localProfilePath=${jsPath}`

  // For some silly reason, the OS X open command ignores any query parameters or hash parameters
  // passed as part of the URL. To get around this weird issue, we'll create a local HTML file
  // that just redirects.
  const htmlPath = path.join(os.tmpdir(), `${filePrefix}.html`)
  console.log(`Creating temp file ${htmlPath}`)
  fs.writeFileSync(htmlPath, `<script>window.location=${JSON.stringify(urlToOpen)}</script>`)

  urlToOpen = `file://${htmlPath}`
}

console.log('Opening', urlToOpen, 'in your default browser')

opn(urlToOpen, {wait: false}).then(
  () => {
    process.exit(0)
  },
  err => {
    console.error(err)
    console.exit(1)
  },
)
