import {Flamechart} from '../flamechart'
import {FlamechartRenderer} from '../flamechart-renderer'
import {reducer} from '../typed-redux'
import {actions} from './actions'
import {Frame} from '../profile'

export interface FlamechartViewState {
  flamechart: Flamechart | null
  flamechartRenderer: FlamechartRenderer | null
}

export const chronoView = reducer<FlamechartViewState>(
  (state = {flamechart: null, flamechartRenderer: null}, action) => {
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
  },
)

export const leftHeavyView = reducer<FlamechartViewState>(
  (state = {flamechart: null, flamechartRenderer: null}, action) => {
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
  },
)
