// Versions of node before 10 had an unstable sort. This isn't really an issue in browsers
// that speedscope supports, but for the purposes of supporting node 10, we'll polyfill
// a stable sort to make the tests pass.
//
// See:
// - https://v8.dev/features/stable-sort
// - https://v8.dev/blog/array-sort
// - https://github.com/jlfwong/speedscope/pull/254#issuecomment-575116995
//
// Once we stop supporting node 10, this can be removed.
//
// An alternative would be to change our sort implementation to be stable by definition
// rather than relying upon native sort being stable. I don't want to do that because
// we'd take a perf hit.
//
// Because we're not going to use this in our actual build, it's okay for this
// to be inefficient.

;(function () {
  const nodeVersion = process.versions.node
  const versionParts = nodeVersion.split('.')
  const majorVersion = parseInt(versionParts[0], 10)

  if (majorVersion > 10) {
    // Don't need to do the patch for newer node versions
    return
  }

  const defaultCompareFunction = (a, b) => {
    const sa = '' + a
    const sb = '' + b
    if (sa < sb) return -1
    if (sa > sb) return 1
    return 0
  }

  const originalSort = Array.prototype.sort
  Array.prototype.sort = function (compareFunction) {
    const arrayWithIndices = this.map((x, i) => [x, i])
    originalSort.call(arrayWithIndices, (a, b) => {
      if (!compareFunction) {
        compareFunction = defaultCompareFunction
      }
      const res = compareFunction(a[0], b[0])
      if (res !== 0) return res
      return a[1] < b[1] ? -1 : 1
    })
    this.splice(0, this.length, ...arrayWithIndices.map(x => x[0]))
    return this
  }
})()
;(function () {
  // TextDecoder is a global API in browsers, but an imported API in node.
  //
  // Let's emulate it being a global API during tests.
  global.TextDecoder = require('util').TextDecoder
})()
