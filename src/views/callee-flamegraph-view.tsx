import {memoizeByShallowEquality, noop} from '../lib/utils'
import {Profile, Frame} from '../lib/profile'
import {Flamechart} from '../lib/flamechart'
import {
  createMemoizedFlamechartRenderer,
  FlamechartViewContainerProps,
  useFlamechartSetters,
} from './flamechart-view-container'
import {
  getCanvasContext,
  createGetColorBucketForFrame,
  createGetCSSColorForFrame,
  getFrameToColorBucket,
} from '../store/getters'
import {FlamechartID} from '../store/flamechart-view-state'
import {FlamechartWrapper} from './flamechart-wrapper'
import {useAppSelector} from '../store'
import {h} from 'preact'
import {memo} from 'preact/compat'

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

export const CalleeFlamegraphView = memo((ownProps: FlamechartViewContainerProps) => {
  const {activeProfileState} = ownProps
  const {index, profile, sandwichViewState} = activeProfileState
  const flattenRecursion = useAppSelector(state => state.flattenRecursion, [])
  const glCanvas = useAppSelector(state => state.glCanvas, [])

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

  return (
    <FlamechartWrapper
      renderInverted={false}
      flamechart={flamechart}
      flamechartRenderer={flamechartRenderer}
      canvasContext={canvasContext}
      getCSSColorForFrame={getCSSColorForFrame}
      {...useFlamechartSetters(FlamechartID.SANDWICH_CALLEES, index)}
      // This overrides the setSelectedNode specified in useFlamechartSettesr
      setSelectedNode={noop}
      {...callerCallee.calleeFlamegraph}
    />
  )
})
