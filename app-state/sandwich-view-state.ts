import {CanvasContext} from '../canvas-context'
import {SortMethod, SortField, SortDirection} from '../profile-table-view'
import {Frame, Profile} from '../profile'
import {
  FlamechartViewState,
  createMemoizedFlamechartRenderer,
  FlamechartViewProps,
  FlamechartID,
  createFlamechartViewStateReducer,
} from './flamechart-view-state'
import {memoizeByShallowEquality} from '../utils'
import {Flamechart} from '../flamechart'
import {Dispatch, Reducer} from '../typed-redux'
import {actions} from './actions'

export interface CallerCalleeState {
  selectedFrame: Frame
  invertedCallerFlamegraph: FlamechartViewState
  calleeFlamegraph: FlamechartViewState
}

export type CallerCalleeProps = {
  selectedFrame: Frame
  invertedCallerFlamegraph: FlamechartViewProps
  calleeFlamegraph: FlamechartViewProps
}

export interface SandwichViewState {
  tableSortMethod: SortMethod
  callerCallee: CallerCalleeState | null
}

export type SandwichViewProps = {
  profile: Profile
  flattenRecursion: boolean

  // TODO(jlfwong): It's kind of awkward requiring both of these
  getColorBucketForFrame: (frame: Frame) => number
  getCSSColorForFrame: (frame: Frame) => string

  tableSortMethod: SortMethod

  dispatch: Dispatch

  callerCallee: CallerCalleeProps | null
}

export const sandwichViewProps = memoizeByShallowEquality(
  (
    args: {
      profile: Profile
      flattenRecursion: boolean
      getColorBucketForFrame: (frame: Frame) => number
      getCSSColorForFrame: (frame: Frame) => string
      canvasContext: CanvasContext
      dispatch: Dispatch
    } & SandwichViewState,
  ): SandwichViewProps => {
    const {
      profile,
      canvasContext,
      dispatch,
      flattenRecursion,
      getCSSColorForFrame,
      getColorBucketForFrame,
      callerCallee,
      tableSortMethod,
    } = args

    let callerCalleeProps: CallerCalleeProps | null = null
    if (callerCallee) {
      const flamechargArgs = {
        selectedFrame: callerCallee.selectedFrame,
        profile,
        flattenRecursion,
        canvasContext,
        getCSSColorForFrame,
        getColorBucketForFrame,
        dispatch,
      }

      callerCalleeProps = {
        selectedFrame: callerCallee.selectedFrame,
        invertedCallerFlamegraph: invertedCallerFlamegraphProps({
          ...flamechargArgs,
          ...callerCallee.invertedCallerFlamegraph,
        }),
        calleeFlamegraph: calleeFlamegraphProps({
          ...flamechargArgs,
          ...callerCallee.calleeFlamegraph,
        }),
      }
    }

    return {
      profile,
      flattenRecursion,
      getColorBucketForFrame,
      getCSSColorForFrame,
      tableSortMethod,
      callerCallee: callerCalleeProps,
      dispatch: dispatch,
    }
  },
)

const invertedCallerProfile = memoizeByShallowEquality(
  ({
    profile,
    frame,
    flattenRecursion,
  }: {
    profile: Profile
    frame: Frame
    flattenRecursion: boolean
  }): Profile => {
    let p = profile.getInvertedProfileForCallersOf(frame)
    return flattenRecursion ? p.getProfileWithRecursionFlattened() : p
  },
)

const invertedCallerFlamegraph = memoizeByShallowEquality(
  ({
    invertedCallerProfile,
    getColorBucketForFrame,
  }: {
    invertedCallerProfile: Profile
    getColorBucketForFrame: (frame: Frame) => number
  }): Flamechart => {
    return new Flamechart({
      getTotalWeight: invertedCallerProfile.getTotalNonIdleWeight.bind(invertedCallerProfile),
      forEachCall: invertedCallerProfile.forEachCallGrouped.bind(invertedCallerProfile),
      formatValue: invertedCallerProfile.formatValue.bind(invertedCallerProfile),
      getColorBucketForFrame,
    })
  },
)

const invertedCallerFlamegraphRenderer = createMemoizedFlamechartRenderer({inverted: true})

const invertedCallerFlamegraphProps = memoizeByShallowEquality(
  ({
    hover,
    selectedNode,
    profile,
    dispatch,
    getCSSColorForFrame,
    getColorBucketForFrame,
    configSpaceViewportRect,
    canvasContext,
    selectedFrame,
    flattenRecursion,
  }: {
    profile: Profile
    flattenRecursion: boolean
    selectedFrame: Frame
    canvasContext: CanvasContext
    getCSSColorForFrame: (frame: Frame) => string
    getColorBucketForFrame: (frame: Frame) => number
    dispatch: Dispatch
  } & FlamechartViewState): FlamechartViewProps => {
    const flamechart = invertedCallerFlamegraph({
      invertedCallerProfile: invertedCallerProfile({
        profile,
        frame: selectedFrame,
        flattenRecursion,
      }),
      getColorBucketForFrame,
    })

    const flamechartRenderer = invertedCallerFlamegraphRenderer({canvasContext, flamechart})

    return {
      id: FlamechartID.SANDWICH_INVERTED_CALLERS,
      hover,
      canvasContext,
      flamechart,
      selectedNode,
      configSpaceViewportRect,
      flamechartRenderer,
      dispatch,
      getCSSColorForFrame,
      renderInverted: true,
    }
  },
)

const calleeProfile = memoizeByShallowEquality<
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

const calleeFlamegraph = memoizeByShallowEquality<
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

const calleeFlamegraphRenderer = createMemoizedFlamechartRenderer()

const calleeFlamegraphProps = memoizeByShallowEquality<
  {
    profile: Profile
    flattenRecursion: boolean
    selectedFrame: Frame
    canvasContext: CanvasContext
    getCSSColorForFrame: (frame: Frame) => string
    getColorBucketForFrame: (frame: Frame) => number
    dispatch: Dispatch
  } & FlamechartViewState,
  FlamechartViewProps
>(args => {
  const {profile, getColorBucketForFrame, canvasContext, selectedFrame, flattenRecursion} = args
  const flamechart = calleeFlamegraph({
    calleeProfile: calleeProfile({profile, frame: selectedFrame, flattenRecursion}),
    getColorBucketForFrame,
  })

  const flamechartRenderer = calleeFlamegraphRenderer({canvasContext, flamechart})

  return {
    id: FlamechartID.SANDWICH_CALLEES,
    flamechart,
    flamechartRenderer,
    renderInverted: false,
    ...args,
  }
})

const defaultSortMethod = {
  field: SortField.SELF,
  direction: SortDirection.DESCENDING,
}

const calleesReducer = createFlamechartViewStateReducer(FlamechartID.SANDWICH_CALLEES)
const invertedCallersReducer = createFlamechartViewStateReducer(
  FlamechartID.SANDWICH_INVERTED_CALLERS,
)

export const sandwichView: Reducer<SandwichViewState> = (
  state = {tableSortMethod: defaultSortMethod, callerCallee: null},
  action,
) => {
  const {callerCallee} = state
  if (callerCallee) {
    const {calleeFlamegraph, invertedCallerFlamegraph} = callerCallee
    const nextCalleeFlamegraph = calleesReducer(calleeFlamegraph, action)
    const nextInvertedCallerFlamegraph = invertedCallersReducer(invertedCallerFlamegraph, action)

    if (
      nextCalleeFlamegraph !== calleeFlamegraph ||
      nextInvertedCallerFlamegraph !== invertedCallerFlamegraph
    ) {
      return {
        ...state,
        callerCallee: {
          ...callerCallee,
          calleeFlamegraph: nextCalleeFlamegraph,
          invertedCallerFlamegraph: nextInvertedCallerFlamegraph,
        },
      }
    }
  }

  if (actions.sandwichView.setTableSortMethod.matches(action)) {
    return {...state, tableSortMethod: action.payload}
  }

  if (actions.sandwichView.setSelectedFrame.matches(action)) {
    if (action.payload == null) {
      return {
        ...state,
        callerCallee: null,
      }
    } else {
      return {
        ...state,
        callerCallee: {
          selectedFrame: action.payload,
          calleeFlamegraph: calleesReducer(undefined, action),
          invertedCallerFlamegraph: invertedCallersReducer(undefined, action),
        },
      }
    }
  }

  return state
}
