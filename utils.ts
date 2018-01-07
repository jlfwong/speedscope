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

// NOTE: This blindly assumes the same result across contexts.
const measureTextCache = new Map<string, number>()
export function cachedMeasureTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
  if (!measureTextCache.has(text)) {
    measureTextCache.set(text, ctx.measureText(text).width)
  }
  return measureTextCache.get(text)!
}