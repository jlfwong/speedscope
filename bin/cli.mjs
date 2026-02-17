#!/usr/bin/env node
import path from 'node:path'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import stream from 'node:stream'
import { fileURLToPath } from 'node:url'

import open from 'open'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const helpString = `Usage: speedscope [--serve] [filepath]

If invoked with no arguments, will open a local copy of speedscope in your default browser.
Once open, you can browse for a profile to import.

If - is used as the filepath, will read from stdin instead.

  cat /path/to/profile | speedscope -

Options:
  --serve   Start a local HTTP server instead of using file:// URLs
`

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.json': 'application/json',
  '.txt': 'text/plain',
}

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

function startServer(serveDir, profileJs) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`)
      let pathname = url.pathname

      // Serve the injected profile script
      if (profileJs && pathname === '/__speedscope_profile__.js') {
        res.writeHead(200, {'Content-Type': 'application/javascript'})
        res.end(profileJs)
        return
      }

      if (pathname === '/') pathname = '/index.html'

      const filePath = path.join(serveDir, pathname)

      // Prevent directory traversal
      if (!filePath.startsWith(serveDir)) {
        res.writeHead(403)
        res.end()
        return
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const ext = path.extname(filePath)
      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
      const content = fs.readFileSync(filePath)
      res.writeHead(200, {'Content-Type': contentType})
      res.end(content)
    })

    server.listen(0, '127.0.0.1', () => {
      const {port} = server.address()
      resolve({server, port})
    })
    server.on('error', reject)
  })
}

function buildProfileJs(filename, sourceBuffer) {
  try {
    const sourceBase64 = sourceBuffer.toString('base64')
    return `speedscope.loadFileFromBase64(${JSON.stringify(filename)}, ${JSON.stringify(
      sourceBase64,
    )})`
  } catch(e) {
    if (e && e.message && /Cannot create a string longer than/.exec(e.message)) {
      return `alert("Sorry, ${filename} is too large to be loaded via command-line argument! Try dragging it into speedscope instead.")`
    } else {
      throw e
    }
  }
}

async function mainFile(filePath) {
  let urlToOpen = 'file://' + path.resolve(__dirname, '../dist/release/index.html')

  if (filePath) {
    const sourceBuffer = await getProfileBuffer(filePath)
    const filename = path.basename(filePath)
    const jsSource = buildProfileJs(filename, sourceBuffer)

    const filePrefix = `speedscope-${+new Date()}-${process.pid}`
    const jsPath = path.join(os.tmpdir(), `${filePrefix}.js`)
    console.log(`Creating temp file ${jsPath}`)
    fs.writeFileSync(jsPath, jsSource)
    urlToOpen += `#localProfilePath=${jsPath}`

    // For some silly reason, the macOS `open` and Windows `start` commands ignore hash parameters
    // passed as part of the URL. To get around this weird issue, we'll create a local HTML file
    // that just redirects.
    if (process.platform === 'darwin' || process.platform === 'win32') {
      const htmlPath = path.join(os.tmpdir(), `${filePrefix}.html`)
      console.log(`Creating temp file ${htmlPath}`)
      fs.writeFileSync(htmlPath, `<script>window.location=${JSON.stringify(urlToOpen)}</script>`)

      urlToOpen = `file://${htmlPath}`
    }
  }

  console.log('Opening', urlToOpen, 'in your default browser')

  // We'd like to avoid blocking the terminal on the browsing closing,
  // but for some reason this doesn't work at all on Windows if we
  // don't use wait: true.
  const wait = process.platform === "win32";
  await open(urlToOpen, {wait})
}

async function mainServe(filePath) {
  const serveDir = path.resolve(__dirname, '../dist/release-http')
  let profileJs = null
  let hash = ''

  if (filePath) {
    const sourceBuffer = await getProfileBuffer(filePath)
    const filename = path.basename(filePath)
    profileJs = buildProfileJs(filename, sourceBuffer)
    hash = '#localProfilePath=/__speedscope_profile__.js'
  }

  const {server, port} = await startServer(serveDir, profileJs)
  const urlToOpen = `http://127.0.0.1:${port}/${hash}`

  console.log(`speedscope is running at ${urlToOpen}`)
  console.log('Press Ctrl+C to stop')

  await open(urlToOpen)

  // Keep the process alive to serve requests
  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    server.close()
    process.exit(0)
  })
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(helpString)
    return
  }

  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    const json = fs.readFileSync(path.resolve(__dirname, '../package.json'), { encoding: 'utf-8' })
    const { version } = JSON.parse(json)
    console.log(`v${version}`)
    return
  }

  const serve = process.argv.includes('--serve')
  const args = process.argv.slice(2).filter(a => a !== '--serve')

  if (args.length > 1) {
    throw new Error('At most one filepath argument expected')
  }

  const filePath = args[0] || null

  if (serve) {
    await mainServe(filePath)
  } else {
    await mainFile(filePath)
  }
}

main()
  .catch(e => {
    console.log(e.stack + '\n')
    console.log(helpString)
    process.exit(1)
  })