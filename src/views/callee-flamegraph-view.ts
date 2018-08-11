import {memoizeByShallowEquality} from '../lib/utils'
import {Profile, Frame} from '../lib/profile'
import {Flamechart} from '../lib/flamechart'
import {
  createMemoizedFlamechartRenderer,
  FlamechartViewContainerProps,
  createFlamechartSetters,
} from './flamechart-view-container'
import {createContainer, Dispatch} from '../lib/typed-redux'
import {ApplicationState} from '../store'
import {
  getCanvasContext,
  createGetColorBucketForFrame,
  createGetCSSColorForFrame,
  getFrameToColorBucket,
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
  (state: ApplicationState, dispatch: Dispatch, ownProps: FlamechartViewContainerProps) => {
    const {activeProfileState} = ownProps
    const {index, profile, sandwichViewState} = activeProfileState
    const {flattenRecursion, glCanvas} = state
    if (!profile) throw new Error('profile missing')
    if (!glCanvas) throw new Error('glCanvas missing')
    const {callerCallee} = sandwichViewState
    if (!callerCallee) throw new Error('callerCallee missing')
    const {selectedFrame} = callerCallee

    const frameToColorBucket = getFrameToColorBucket(profile)
    const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
    const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)
    const canvasContext = getCanvasContext(glCanvas)

    const flamechart = getCalleeFlamegraph({
      calleeProfile: getCalleeProfile({profile, frame: selectedFrame, flattenRecursion}),
      getColorBucketForFrame,
    })
    const flamechartRenderer = getCalleeFlamegraphRenderer({canvasContext, flamechart})

    return {
      renderInverted: false,
      flamechart,
      flamechartRenderer,
      canvasContext,
      getCSSColorForFrame,
      ...createFlamechartSetters(dispatch, FlamechartID.SANDWICH_CALLEES, index),
      // This overrides the setSelectedNode specified in createFlamechartSettesr
      setSelectedNode: () => {},
      ...callerCallee.calleeFlamegraph,
    }
  },
)
