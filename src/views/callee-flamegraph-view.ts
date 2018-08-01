import {memoizeByShallowEquality} from '../lib/utils'
import {Profile, Frame} from '../lib/profile'
import {Flamechart} from '../lib/flamechart'
import {createMemoizedFlamechartRenderer} from './flamechart-view-container'
import {createContainer} from '../lib/typed-redux'
import {ApplicationState} from '../store'
import {
  getCanvasContext,
  createGetColorBucketForFrame,
  createGetCSSColorForFrame,
} from '../store/getters'
import {FlamechartID} from '../store/flamechart-view-state'
import {FlamechartWrapper} from './flamechart-wrapper'

const getCalleeProfile = memoizeByShallowEquality<
  {
    profile: Profile
    frame: Frame
    flattenRecursion: boolean
  },
  Profile
>(({profile, frame, flattenRecursion}) => {
  let p = profile.getProfileForCalleesOf(frame)
  return flattenRecursion ? p.getProfileWithRecursionFlattened() : p
})

const getCalleeFlamegraph = memoizeByShallowEquality<
  {
    calleeProfile: Profile
    getColorBucketForFrame: (frame: Frame) => number
  },
  Flamechart
>(({calleeProfile, getColorBucketForFrame}) => {
  return new Flamechart({
    getTotalWeight: calleeProfile.getTotalNonIdleWeight.bind(calleeProfile),
    forEachCall: calleeProfile.forEachCallGrouped.bind(calleeProfile),
    formatValue: calleeProfile.formatValue.bind(calleeProfile),
    getColorBucketForFrame,
  })
})

const getCalleeFlamegraphRenderer = createMemoizedFlamechartRenderer()

export const CalleeFlamegraphView = createContainer(
  FlamechartWrapper,
  (state: ApplicationState) => {
    const {profile, flattenRecursion, glCanvas, frameToColorBucket, sandwichView} = state
    if (!profile) throw new Error('profile missing')
    if (!glCanvas) throw new Error('glCanvas missing')
    const {callerCallee} = sandwichView
    if (!callerCallee) throw new Error('callerCallee missing')
    const {selectedFrame} = callerCallee

    const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
    const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)
    const canvasContext = getCanvasContext(glCanvas)

    const flamechart = getCalleeFlamegraph({
      calleeProfile: getCalleeProfile({profile, frame: selectedFrame, flattenRecursion}),
      getColorBucketForFrame,
    })
    const flamechartRenderer = getCalleeFlamegraphRenderer({canvasContext, flamechart})

    return {
      id: FlamechartID.SANDWICH_CALLEES,
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...callerCallee.calleeFlamegraph,
    }
  },
)
