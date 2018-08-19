import {Frame, Profile} from '../lib/profile'
import {triangle, memoizeByReference, memoizeByShallowEquality} from '../lib/utils'
import {RowAtlas} from '../gl/row-atlas'
import {CanvasContext} from '../gl/canvas-context'
import {Color} from '../lib/color'
import {FlamechartRowAtlasKey} from '../gl/flamechart-renderer'

export const createGetColorBucketForFrame = memoizeByReference(
  (frameToColorBucket: Map<number | string, number>) => {
    return (frame: Frame): number => {
      return frameToColorBucket.get(frame.key) || 0
    }
  },
)

export const createGetCSSColorForFrame = memoizeByReference(
  (frameToColorBucket: Map<number | string, number>) => {
    const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
    return (frame: Frame): string => {
      const t = getColorBucketForFrame(frame) / 255

      const x = triangle(30.0 * t)
      const H = 360.0 * (0.9 * t)
      const C = 0.25 + 0.2 * x
      const L = 0.8 - 0.15 * x
      return Color.fromLumaChromaHue(L, C, H).toCSS()
    }
  },
)

export const getCanvasContext = memoizeByReference((canvas: HTMLCanvasElement) => {
  return new CanvasContext(canvas)
})

export const getRowAtlas = memoizeByReference((canvasContext: CanvasContext) => {
  return new RowAtlas<FlamechartRowAtlasKey>(
    canvasContext.gl,
    canvasContext.rectangleBatchRenderer,
    canvasContext.textureRenderer,
  )
})

export const getProfileWithRecursionFlattened = memoizeByReference((profile: Profile) =>
  profile.getProfileWithRecursionFlattened(),
)

export const getProfileToView = memoizeByShallowEquality(
  ({profile, flattenRecursion}: {profile: Profile; flattenRecursion: boolean}): Profile => {
    return flattenRecursion ? profile.getProfileWithRecursionFlattened() : profile
  },
)
export const getFrameToColorBucket = memoizeByReference((profile: Profile): Map<
  string | number,
  number
> => {
  const frames: Frame[] = []
  profile.forEachFrame(f => frames.push(f))
  function key(f: Frame) {
    return (f.file || '') + f.name
  }
  function compare(a: Frame, b: Frame) {
    return key(a) > key(b) ? 1 : -1
  }
  frames.sort(compare)
  const frameToColorBucket = new Map<string | number, number>()
  for (let i = 0; i < frames.length; i++) {
    frameToColorBucket.set(frames[i].key, Math.floor(255 * i / frames.length))
  }

  return frameToColorBucket
})
