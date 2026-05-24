import {Frame, Profile} from '../lib/profile'
import {memoizeByReference, memoizeByShallowEquality} from '../lib/utils'
import {RowAtlas} from '../gl/row-atlas'
import {CanvasContext} from '../gl/canvas-context'
import {FlamechartRowAtlasKey} from '../gl/flamechart-renderer'
import {Theme} from '../views/themes/theme'
import { PALETTE as FLAMEGRAPH_PALETTE } from '../views/themes/dark-theme'
import { frameColorOverridesAtom } from '.'

export const createGetColorBucketForFrame = memoizeByReference(
  (frameToColorBucket: Map<number | string, number>) => {
    return (frame: Frame): number => {
      return frameToColorBucket.get(frame.key) || 0
    }
  },
)

export const createGetCSSColorForFrame = memoizeByShallowEquality(
  ({
    theme,
    frameToColorBucket,
     diffMode = false,
  }: {
    theme: Theme
    frameToColorBucket: Map<number | string, number>
    diffMode?: boolean
  }) => {
    const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
    return (frame: Frame): string => {
      if (diffMode) {
        const diffRatio = frame.getDiffRatio()
        const encodedRatio = (diffRatio + 1) / 2
        return theme.colorForDiffRatio(encodedRatio).toCSS()
      }
      const t = getColorBucketForFrame(frame) / 255
      return theme.colorForBucket(t).toCSS()
    }
  },
)

export const getCanvasContext = memoizeByShallowEquality(
  ({theme, canvas}: {theme: Theme; canvas: HTMLCanvasElement}) => {
    return new CanvasContext(canvas, theme)
  },
)

export const getRowAtlas = memoizeByReference((canvasContext: CanvasContext) => {
  return new RowAtlas<FlamechartRowAtlasKey>(
    canvasContext.gl,
    canvasContext.rectangleBatchRenderer,
    canvasContext.textureRenderer,
  )
})

export const getProfileToView = memoizeByShallowEquality(
  ({profile, flattenRecursion}: {profile: Profile; flattenRecursion: boolean}): Profile => {
    return flattenRecursion ? profile.getProfileWithRecursionFlattened() : profile
  },
)


// Group frames with similar names by estimating a common prefix
function groupKey(f: Frame): string {
  const name = f.name;
  let dotCount = 0;
  let cutoff = name.length;
  let lastDotIndex = -1;
  
  // group by prefix up to the first 4 dots (e.g. "op.gr.run")
  for (let i=0; i<name.length; i++) {
    if (name[i] === ".") {
      dotCount++;
      lastDotIndex = i;
      if (dotCount === 4) {
        cutoff = i;
        break;
      }
    }
  }

  // If fewer than 4 dots and at least one dot, use the position of the last dot
  if (dotCount > 0 && dotCount < 4) {
    cutoff = lastDotIndex;
  }

  // If no dots, just use the full name
  return f.name.slice(0, cutoff);
}


const overrides = frameColorOverridesAtom.get()

export const getFrameToColorBucket = memoizeByReference(
  (profile: Profile): Map<string | number, number> => {
    const frames: Frame[] = []
    profile.forEachFrame(f => frames.push(f))

    const groupMap = new Map<string, Frame[]>();
    for (const f of frames) {
      const g = groupKey(f);
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(f);
    }

    const colorPaletteSize = FLAMEGRAPH_PALETTE.length
    const frameToColorBucket = new Map<string | number, number>();

    // ensure the same string always get the same color
    function hashString(str: string): number {
      if(overrides[str] !== undefined) return overrides[str]!
      let hash = 0
      for (let i=0; i < str.length; i++) {
        hash = (hash * 33 + str.charCodeAt(i)) | 0
      }
      return Math.abs(hash)
    }

    for (const [group, groupFrames] of groupMap) {
       // GLSL requires an ID in the range 0-255
       const colorIndex = hashString(group)
      const colorId = Math.round((colorIndex % colorPaletteSize) * ( 255 / (colorPaletteSize - 1)));
      for (const f of groupFrames) {
        frameToColorBucket.set(f.key, colorId)
      }
    }

    return frameToColorBucket
  },
)
