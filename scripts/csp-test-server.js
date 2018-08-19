#!/usr/bin/env node

// A simple server to test content security policy rules

var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')

if (!process.argv[2]) {
  console.log('Usage: csp-test-server.js path/to/directory')
  process.exit(1)
}

console.log(process.argv[2])

// Serve up public/ftp folder
var serve = serveStatic(process.argv[2], {
  index: false,
  setHeaders: setHeaders,
})

// Set header to force download
function setHeaders(res, path) {
  res.setHeader('Content-Security-Policy', "script-src 'self';")
}

// Create server
var server = http.createServer(function onRequest(req, res) {
  serve(req, res, finalhandler(req, res))
})

// Listen
const PORT = 3111
server.listen(PORT)
console.log(`Serving ${process.argv[2]} on http://localhost:${PORT}`)
