import {Frame, Profile} from '../profile'
import {triangle, memoizeByReference, memoizeByShallowEquality} from '../utils'
import {RowAtlas} from '../row-atlas'
import {CanvasContext} from '../canvas-context'
import {Color} from '../color'
import {FlamechartRowAtlasKey} from '../flamechart-renderer'

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
  return new RowAtlas<FlamechartRowAtlasKey>(canvasContext)
})

export const getProfileWithRecursionFlattened = memoizeByReference((profile: Profile) =>
  profile.getProfileWithRecursionFlattened(),
)

export const getProfileToView = memoizeByShallowEquality(
  ({profile, flattenRecursion}: {profile: Profile; flattenRecursion: boolean}): Profile => {
    return flattenRecursion ? profile.getProfileWithRecursionFlattened() : profile
  },
)
