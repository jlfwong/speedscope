import {h} from 'preact'
import {FlamechartID, FlamechartViewState} from '../store/flamechart-view-state'
import {CanvasContext} from '../gl/canvas-context'
import {Flamechart} from '../lib/flamechart'
import {FlamechartRenderer, FlamechartRendererOptions} from '../gl/flamechart-renderer'
import {useActionCreator} from '../lib/preact-redux'
import {Frame, Profile, CallTreeNode} from '../lib/profile'
import {memoizeByShallowEquality} from '../lib/utils'
import {FlamechartView} from './flamechart-view'
import {
  getRowAtlas,
  createGetColorBucketForFrame,
  getCanvasContext,
  createGetCSSColorForFrame,
  getFrameToColorBucket,
} from '../store/getters'
import {ActiveProfileState} from './application'
import {Vec2, Rect} from '../lib/math'
import {actions} from '../store/actions'
import {memo, useMemo} from 'preact/compat'
import {useAppSelector, ViewMode, useActiveProfileState} from '../store'
import {SearchViewProps} from './search-view'
import {ProfileSearchResults} from '../lib/profile-search'

interface FlamechartSetters {
  setLogicalSpaceViewportSize: (logicalSpaceViewportSize: Vec2) => void
  setConfigSpaceViewportRect: (configSpaceViewportRect: Rect) => void
  setNodeHover: (hover: {node: CallTreeNode; event: MouseEvent} | null) => void
  setSelectedNode: (node: CallTreeNode | null) => void
}

const {
  setHoveredNode,
  setLogicalSpaceViewportSize,
  setConfigSpaceViewportRect,
  setSelectedNode,
} = actions.flamechart

export function useFlamechartSetters(id: FlamechartID, profileIndex: number): FlamechartSetters {
  return {
    setNodeHover: useActionCreator(
      (hover: {node: CallTreeNode; event: MouseEvent} | null) =>
        setHoveredNode({profileIndex, args: {id, hover}}),
      [profileIndex, id],
    ),
    setLogicalSpaceViewportSize: useActionCreator(
      (logicalSpaceViewportSize: Vec2) =>
        setLogicalSpaceViewportSize({profileIndex, args: {id, logicalSpaceViewportSize}}),
      [profileIndex, id],
    ),
    setConfigSpaceViewportRect: useActionCreator(
      (configSpaceViewportRect: Rect) =>
        setConfigSpaceViewportRect({profileIndex, args: {id, configSpaceViewportRect}}),
      [profileIndex, id],
    ),
    setSelectedNode: useActionCreator(
      (selectedNode: CallTreeNode | null) =>
        setSelectedNode({profileIndex, args: {id, selectedNode}}),
      [profileIndex, id],
    ),
  }
}

export type FlamechartViewProps = {
  canvasContext: CanvasContext
  flamechart: Flamechart
  flamechartRenderer: FlamechartRenderer
  renderInverted: boolean
  getCSSColorForFrame: (frame: Frame) => string
  searchIsActive: boolean
  searchQuery: string
  searchResults: ProfileSearchResults | null
  viewMode: ViewMode
  setSearchQuery: (query: string) => void
  setSearchIsActive: (active: boolean) => void
} & FlamechartSetters &
  FlamechartViewState

const {setSearchQuery, setSearchIsActive} = actions

function useSearchViewProps(): SearchViewProps {
  const searchIsActive = useAppSelector(state => state.searchIsActive, [])
  const searchQuery = useAppSelector(state => state.searchQuery, [])
  const profile = useActiveProfileState()?.profile
  const searchResults = useMemo(
    () =>
      searchIsActive && searchQuery.length > 0 && profile
        ? new ProfileSearchResults(profile, searchQuery)
        : null,
    [profile, searchQuery],
  )

  return {
    searchIsActive,
    searchQuery,
    setSearchQuery: useActionCreator(setSearchQuery, []),
    setSearchIsActive: useActionCreator(setSearchIsActive, []),
    searchResults,
    viewMode: useAppSelector(state => state.viewMode, []),
  }
}

export const getChronoViewFlamechart = memoizeByShallowEquality(
  ({
    profile,
    getColorBucketForFrame,
  }: {
    profile: Profile
    getColorBucketForFrame: (frame: Frame) => number
  }): Flamechart => {
    return new Flamechart({
      getTotalWeight: profile.getTotalWeight.bind(profile),
      forEachCall: profile.forEachCall.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
  },
)

export const createMemoizedFlamechartRenderer = (options?: FlamechartRendererOptions) =>
  memoizeByShallowEquality(
    ({
      canvasContext,
      flamechart,
    }: {
      canvasContext: CanvasContext
      flamechart: Flamechart
    }): FlamechartRenderer => {
      return new FlamechartRenderer(
        canvasContext.gl,
        getRowAtlas(canvasContext),
        flamechart,
        canvasContext.rectangleBatchRenderer,
        canvasContext.flamechartColorPassRenderer,
        options,
      )
    },
  )

const getChronoViewFlamechartRenderer = createMemoizedFlamechartRenderer()

export interface FlamechartViewContainerProps {
  activeProfileState: ActiveProfileState
  glCanvas: HTMLCanvasElement
}

export const ChronoFlamechartView = memo((props: FlamechartViewContainerProps) => {
  const {activeProfileState, glCanvas} = props
  const {index, profile, chronoViewState} = activeProfileState

  const canvasContext = getCanvasContext(glCanvas)
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
  const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)

  const flamechart = getChronoViewFlamechart({profile, getColorBucketForFrame})
  const flamechartRenderer = getChronoViewFlamechartRenderer({
    canvasContext,
    flamechart,
  })

  return (
    <FlamechartView
      renderInverted={false}
      flamechart={flamechart}
      flamechartRenderer={flamechartRenderer}
      canvasContext={canvasContext}
      getCSSColorForFrame={getCSSColorForFrame}
      {...useFlamechartSetters(FlamechartID.CHRONO, index)}
      {...useSearchViewProps()}
      {...chronoViewState}
    />
  )
})

export const getLeftHeavyFlamechart = memoizeByShallowEquality(
  ({
    profile,
    getColorBucketForFrame,
  }: {
    profile: Profile
    getColorBucketForFrame: (frame: Frame) => number
  }): Flamechart => {
    return new Flamechart({
      getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
      forEachCall: profile.forEachCallGrouped.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    })
  },
)

const getLeftHeavyFlamechartRenderer = createMemoizedFlamechartRenderer()

export const LeftHeavyFlamechartView = memo((ownProps: FlamechartViewContainerProps) => {
  const {activeProfileState, glCanvas} = ownProps

  const {index, profile, leftHeavyViewState} = activeProfileState

  const canvasContext = getCanvasContext(glCanvas)
  const frameToColorBucket = getFrameToColorBucket(profile)
  const getColorBucketForFrame = createGetColorBucketForFrame(frameToColorBucket)
  const getCSSColorForFrame = createGetCSSColorForFrame(frameToColorBucket)

  const flamechart = getLeftHeavyFlamechart({
    profile,
    getColorBucketForFrame,
  })
  const flamechartRenderer = getLeftHeavyFlamechartRenderer({
    canvasContext,
    flamechart,
  })

  return (
    <FlamechartView
      renderInverted={false}
      flamechart={flamechart}
      flamechartRenderer={flamechartRenderer}
      canvasContext={canvasContext}
      getCSSColorForFrame={getCSSColorForFrame}
      {...useFlamechartSetters(FlamechartID.LEFT_HEAVY, index)}
      {...useSearchViewProps()}
      {...leftHeavyViewState}
    />
  )
})
