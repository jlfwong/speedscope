;(function () {
  // TextDecoder is a global API in browsers, but an imported API in node.
  //
  // Let's emulate it being a global API during tests.
  global.TextDecoder = require('util').TextDecoder
  global.TextEncoder = require('util').TextEncoder
})()
