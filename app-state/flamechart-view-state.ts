import {Flamechart} from '../flamechart'
import {FlamechartRenderer} from '../flamechart-renderer'
import {reducer} from '../typed-redux'
import {actions} from './actions'
import {Frame} from '../profile'

export interface FlamechartAppState {
  // TODO(jlfwong): Consider changing flamechart & flamechartRenderer to be
  // derived state somehow instead. They should be a pure function of the
  // activeProfile, flattenRecursion, and the ViewMode. It would be good to make them
  // derived, memoized state. Deriving & memoizing this state also has the potential
  // to use an LRU cache backing store for the memoization to support faster
  // switching between the flamecharts used in the Sandwich view too.
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
}

export const chronoView = reducer<FlamechartAppState | null>((state = null, action) => {
  if (actions.setActiveProfile.matches(action)) {
    const {profile, canvasContext, rowAtlas, frameToColorBucket} = action.payload

    function getColorBucketForFrame(frame: Frame) {
      return frameToColorBucket.get(frame.key) || 0
    }

    const flamechart = new Flamechart({
      getTotalWeight: profile.getTotalWeight.bind(profile),
      forEachCall: profile.forEachCall.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
    const flamechartRenderer = new FlamechartRenderer(canvasContext, rowAtlas, flamechart)

    return {flamechart, flamechartRenderer}
  }
  return state
})

export const leftHeavyView = reducer<FlamechartAppState | null>((state = null, action) => {
  if (actions.setActiveProfile.matches(action)) {
    const {profile, canvasContext, rowAtlas, frameToColorBucket} = action.payload

    function getColorBucketForFrame(frame: Frame) {
      return frameToColorBucket.get(frame.key) || 0
    }

    const flamechart = new Flamechart({
      getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
      forEachCall: profile.forEachCallGrouped.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
    const flamechartRenderer = new FlamechartRenderer(canvasContext, rowAtlas, flamechart)

    return {flamechart, flamechartRenderer}
  }

  return state
})
