export function atMostOnceAFrame<F extends Function>(fn: F) {
  let frameRequest: number | null = null
  function ret(...args: any[]) {
    if (frameRequest == null) {
      frameRequest = requestAnimationFrame(function () {
        fn(...args)
        frameRequest = null
      })
    }
  }
  return ret as any as F
}

export function lastOf<T>(ts: T[]): T | null {
  return ts[ts.length-1] || null
}