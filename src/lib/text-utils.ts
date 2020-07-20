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

interface TrimmedTextResult {
  trimmedString: string
  trimmedLength: number
  prefixLength: number
  suffixLength: number
  originalLength: number
  originalString: string
}

export enum IndexTypeInTrimmed {
  IN_PREFIX,
  IN_SUFFIX,
  ELIDED,
}

export function getIndexTypeInTrimmed(
  result: TrimmedTextResult,
  index: number,
): IndexTypeInTrimmed {
  if (index < result.prefixLength) {
    return IndexTypeInTrimmed.IN_PREFIX
  } else if (index < result.originalLength - result.suffixLength) {
    return IndexTypeInTrimmed.ELIDED
  } else {
    return IndexTypeInTrimmed.IN_SUFFIX
  }
}

function buildTrimmedText(text: string, length: number): TrimmedTextResult {
  const prefixLength = Math.floor(length / 2)
  const prefix = text.substr(0, prefixLength)
  const suffix = text.substr(text.length - prefixLength, prefixLength)
  const trimmedString = prefix + ELLIPSIS + suffix
  return {
    trimmedString,
    trimmedLength: trimmedString.length,
    prefixLength: prefix.length,
    suffixLength: suffix.length,
    originalString: text,
    originalLength: text.length,
  }
}

export function trimTextMid(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): TrimmedTextResult {
  if (cachedMeasureTextWidth(ctx, text) <= maxWidth) {
    return {
      trimmedString: text,
      trimmedLength: text.length,
      prefixLength: text.length,
      suffixLength: 0,
      originalString: text,
      originalLength: text.length,
    }
  }
  const [lo] = binarySearch(
    0,
    text.length,
    n => {
      return cachedMeasureTextWidth(ctx, buildTrimmedText(text, n).trimmedString)
    },
    maxWidth,
  )
  return buildTrimmedText(text, lo)
}
