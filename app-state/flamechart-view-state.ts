import {Flamechart} from '../flamechart'
import {FlamechartRenderer} from '../flamechart-renderer'
import {Frame, Profile} from '../profile'
import {memoizeByShallowEquality} from '../utils'
import {canvasContext, rowAtlas} from '.'

export interface FlamechartAppState {
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
}

export interface FlamechartAppStateArgs {
  profile: Profile
  glCanvas: HTMLCanvasElement
  frameToColorBucket: Map<number | string, number>
}

export const chronoView = memoizeByShallowEquality<FlamechartAppStateArgs, FlamechartAppState>(
  ({profile, glCanvas, frameToColorBucket}) => {
    function getColorBucketForFrame(frame: Frame) {
      return frameToColorBucket.get(frame.key) || 0
    }

    const flamechart = new Flamechart({
      getTotalWeight: profile.getTotalWeight.bind(profile),
      forEachCall: profile.forEachCall.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
    const flamechartRenderer = new FlamechartRenderer(
      canvasContext(glCanvas),
      rowAtlas(glCanvas),
      flamechart,
    )

    return {flamechart, flamechartRenderer}
  },
)

export const leftHeavyView = memoizeByShallowEquality<FlamechartAppStateArgs, FlamechartAppState>(
  ({profile, glCanvas, frameToColorBucket}) => {
    function getColorBucketForFrame(frame: Frame) {
      return frameToColorBucket.get(frame.key) || 0
    }

    const flamechart = new Flamechart({
      getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
      forEachCall: profile.forEachCallGrouped.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
    const flamechartRenderer = new FlamechartRenderer(
      canvasContext(glCanvas),
      rowAtlas(glCanvas),
      flamechart,
    )

    return {flamechart, flamechartRenderer}
  },
)
