#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const os = require('os')
const stream = require('stream')

const open = require('open')

const helpString = `Usage: speedscope [filepath]

If invoked with no arguments, will open a local copy of speedscope in your default browser.
Once open, you can browse for a profile to import.

If - is used as the filepath, will read from stdin instead.

  cat /path/to/profile | speedscope -
`

function getProfileStream(relPath) {
  const absPath = path.resolve(process.cwd(), relPath)
  if (relPath === '-') {
    // Read from stdin
    return process.stdin
  } else {
    return fs.createReadStream(absPath)
  }
}

function getProfileBuffer(relPath) {
  const profileStream = getProfileStream(relPath)
  const chunks = []
  return new Promise((resolve, reject) => {
    profileStream.pipe(
      stream.Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        },
        final() {
          resolve(Buffer.concat(chunks))
        },
      }),
    )
    profileStream.on('error', ev => reject(ev))
  })
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(helpString)
    return
  }

  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    console.log('v' + require('../package.json').version)
    return
  }

  if (process.argv.length > 3) {
    throw new Error('At most one argument expected')
  }

  let urlToOpen = 'file://' + path.resolve(__dirname, '../dist/release/index.html')

  if (process.argv.length === 3) {
    const relPath = process.argv[2]
    const sourceBuffer = await getProfileBuffer(relPath)
    const filename = path.basename(relPath)

    let jsSource
    try {
      const sourceBase64 = sourceBuffer.toString('base64')
      jsSource = `speedscope.loadFileFromBase64(${JSON.stringify(filename)}, ${JSON.stringify(
        sourceBase64,
      )})`
    } catch(e) {
      if (e && e.message && /Cannot create a string longer than/.exec(e.message)) {
        jsSource = `alert("Sorry, ${filename} is too large to be loaded via command-line argument! Try dragging it into speedscope instead.")`
      } else {
        throw e
      }
    }

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

  // We'd like to avoid blocking the terminal on the browsing closing,
  // but for some reason this doesn't work at all on Windows if we
  // don't use wait: true.
  const wait = process.platform === "win32";
  await open(urlToOpen, {wait})
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(e => {
    console.log(e.stack + '\n')
    console.log(helpString)
    process.exit(1)
  })
