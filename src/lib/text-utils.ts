import {binarySearch} from './utils'

export const ELLIPSIS = '\u2026'

// NOTE: This blindly assumes the same result across contexts.
const measureTextCache = new Map<string, number>()

let lastDevicePixelRatio = -1
export function cachedMeasureTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
  if (window.devicePixelRatio !== lastDevicePixelRatio) {
    // This cache is no longer valid!
    measureTextCache.clear()
    lastDevicePixelRatio = window.devicePixelRatio
  }
  if (!measureTextCache.has(text)) {
    measureTextCache.set(text, ctx.measureText(text).width)
  }
  return measureTextCache.get(text)!
}

function buildTrimmedText(text: string, length: number) {
  const prefixLength = Math.floor(length / 2)
  const prefix = text.substr(0, prefixLength)
  const suffix = text.substr(text.length - prefixLength, prefixLength)
  return prefix + ELLIPSIS + suffix
}

export function trimTextMid(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (cachedMeasureTextWidth(ctx, text) <= maxWidth) return text
  const [lo] = binarySearch(
    0,
    text.length,
    n => {
      return cachedMeasureTextWidth(ctx, buildTrimmedText(text, n))
    },
    maxWidth,
  )
  return buildTrimmedText(text, lo)
}
