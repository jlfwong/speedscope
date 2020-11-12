import {findValueBisect} from './utils'

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

// Trim text, placing an ellipsis in the middle, with a slight bias towards
// keeping text from the beginning rather than the end
export function buildTrimmedText(text: string, length: number): TrimmedTextResult {
  if (text.length <= length) {
    return {
      trimmedString: text,
      trimmedLength: text.length,
      prefixLength: text.length,
      suffixLength: 0,
      originalString: text,
      originalLength: text.length,
    }
  }

  let prefixLength = Math.floor(length / 2)
  const suffixLength = length - prefixLength - 1
  const prefix = text.substr(0, prefixLength)
  const suffix = text.substr(text.length - suffixLength, suffixLength)
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

// Trim text to fit within the given number of pixels on the canvas
export function trimTextMid(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): TrimmedTextResult {
  if (cachedMeasureTextWidth(ctx, text) <= maxWidth) {
    return buildTrimmedText(text, text.length)
  }
  const [lo] = findValueBisect(
    0,
    text.length,
    n => {
      return cachedMeasureTextWidth(ctx, buildTrimmedText(text, n).trimmedString)
    },
    maxWidth,
  )
  return buildTrimmedText(text, lo)
}

enum IndexTypeInTrimmed {
  IN_PREFIX,
  IN_SUFFIX,
  ELIDED,
}

function getIndexTypeInTrimmed(result: TrimmedTextResult, index: number): IndexTypeInTrimmed {
  if (index < result.prefixLength) {
    return IndexTypeInTrimmed.IN_PREFIX
  } else if (index < result.originalLength - result.suffixLength) {
    return IndexTypeInTrimmed.ELIDED
  } else {
    return IndexTypeInTrimmed.IN_SUFFIX
  }
}

export function remapRangesToTrimmedText(
  trimmedText: TrimmedTextResult,
  ranges: [number, number][],
): [number, number][] {
  // We intentionally don't just re-run fuzzy matching on the trimmed
  // text, beacuse if the search query is "helloWorld", the frame name
  // is "application::helloWorld", and that gets trimmed down to
  // "appl...oWorld", we still want "oWorld" to be highlighted, even
  // though the string "appl...oWorld" is not matched by the query
  // "helloWorld".
  //
  // There's a weird case to consider here: what if the trimmedText is
  // also matched by the query, but results in a different match than
  // the original query? Consider, e.g. the search string of "ab". The
  // string "hello ab shabby" will be matched at the first "ab", but
  // may be trimmed to "hello...shabby". In this case, should we
  // highlight the "ab" hidden by the ellipsis, or the "ab" in
  // "shabby"? The code below highlights the ellipsis so that the
  // matched characters don't change as you zoom in and out.

  const rangesToHighlightInTrimmedText: [number, number][] = []
  const lengthLoss = trimmedText.originalLength - trimmedText.trimmedLength
  let highlightedEllipsis = false

  for (let [origStart, origEnd] of ranges) {
    let startPosType = getIndexTypeInTrimmed(trimmedText, origStart)
    let endPosType = getIndexTypeInTrimmed(trimmedText, origEnd - 1)

    switch (startPosType) {
      case IndexTypeInTrimmed.IN_PREFIX: {
        switch (endPosType) {
          case IndexTypeInTrimmed.IN_PREFIX: {
            // The entire range fits in the prefix. Add it unmodified.
            rangesToHighlightInTrimmedText.push([origStart, origEnd])
            break
          }
          case IndexTypeInTrimmed.ELIDED: {
            // The range starts in the prefix, but ends in the elided
            // section. Add just the prefix + one char for the ellipsis.
            rangesToHighlightInTrimmedText.push([origStart, trimmedText.prefixLength + 1])
            highlightedEllipsis = true
            break
          }
          case IndexTypeInTrimmed.IN_SUFFIX: {
            // The range crosses from the prefix to the suffix.
            // Highlight everything including the ellipsis.
            rangesToHighlightInTrimmedText.push([origStart, origEnd - lengthLoss])
            break
          }
        }
        break
      }
      case IndexTypeInTrimmed.ELIDED: {
        switch (endPosType) {
          case IndexTypeInTrimmed.IN_PREFIX: {
            // This should be impossible
            throw new Error('Unexpected highlight range starts in elided and ends in prefix')
          }
          case IndexTypeInTrimmed.ELIDED: {
            // The match starts & ends within the elided section.
            if (!highlightedEllipsis) {
              rangesToHighlightInTrimmedText.push([
                trimmedText.prefixLength,
                trimmedText.prefixLength + 1,
              ])
              highlightedEllipsis = true
            }
            break
          }
          case IndexTypeInTrimmed.IN_SUFFIX: {
            // The match starts in elided, but ends in suffix.
            if (highlightedEllipsis) {
              rangesToHighlightInTrimmedText.push([
                trimmedText.trimmedLength - trimmedText.suffixLength,
                origEnd - lengthLoss,
              ])
            } else {
              rangesToHighlightInTrimmedText.push([trimmedText.prefixLength, origEnd - lengthLoss])
              highlightedEllipsis = true
            }
            break
          }
        }
        break
      }
      case IndexTypeInTrimmed.IN_SUFFIX: {
        switch (endPosType) {
          case IndexTypeInTrimmed.IN_PREFIX: {
            // This should be impossible
            throw new Error('Unexpected highlight range starts in suffix and ends in prefix')
          }
          case IndexTypeInTrimmed.ELIDED: {
            // This should be impossible
            throw new Error('Unexpected highlight range starts in suffix and ends in elided')
            break
          }
          case IndexTypeInTrimmed.IN_SUFFIX: {
            // Match starts & ends in suffix
            rangesToHighlightInTrimmedText.push([origStart - lengthLoss, origEnd - lengthLoss])
            break
          }
        }
        break
      }
    }
  }
  return rangesToHighlightInTrimmedText
}
