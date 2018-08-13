import {connect} from 'preact-redux'
import * as redux from 'redux'
import {ComponentConstructor, Component} from 'preact'

export interface Action<TPayload> extends redux.Action<string> {
  payload: TPayload
}

export interface ActionCreator<TPayload> {
  // Returns an action with a non-empty payload
  (payload: TPayload): Action<TPayload>

  // Returns an action with an empty payload ({})
  (): Action<TPayload>

  matches(action: Action<any>): action is Action<TPayload>
}

const usedActionTypes = new Set<string>()

export function actionCreator(type: string): ActionCreator<void>
export function actionCreator<TPayload>(type: string): ActionCreator<TPayload>
export function actionCreator(type: string) {
  if (usedActionTypes.has(type)) {
    throw new Error(`Cannot re-use action type name: ${type}`)
  }

  const creator: any = (payload = {}) => {
    return {type, payload}
  }

  creator.matches = (action: Action<any>) => {
    return action.type === type
  }

  return creator
}

export type Reducer<T> = (state: T | undefined, action: Action<any>) => T
export type ReducerWithActionType<T, A> = (state: T | undefined, action: Action<A>) => T

export function setter<T>(
  setterAction: ActionCreator<T>,
  defaultVal: T,
): (state: T | undefined, action: Action<any>) => T {
  return (state = defaultVal, action) => {
    if (setterAction.matches(action)) {
      return action.payload
    }
    return state
  }
}

export type Dispatch = redux.Dispatch<Action<any>>

// We make this into a single function invocation instead of the connect(map, map)(Component)
// syntax to make better use of type inference.
//
// NOTE: To avoid this returning objects which do not compare shallow equal, it's the
// responsibility of the caller to ensure that the props returned by map compare shallow
// equal. This most importantly mean memoizing functions which wrap dispatch to avoid
// all callback props from being regenerated on every call.
export function createContainer<OwnProps, State, ComponentProps, ComponentType>(
  component: {
    new (props: ComponentProps): ComponentType
  },
  map: (state: State, dispatch: Dispatch, ownProps: OwnProps) => ComponentProps,
): ComponentConstructor<OwnProps, {}> {
  const mapStateToProps = (state: State) => state
  const mapDispatchToProps = (dispatch: Dispatch) => ({dispatch})
  const mergeProps = (
    stateProps: State,
    dispatchProps: {dispatch: Dispatch},
    ownProps: OwnProps,
  ) => {
    return map(stateProps, dispatchProps.dispatch, ownProps)
  }
  return connect(mapStateToProps, mapDispatchToProps, mergeProps)(component)
}

export type VoidState = {
  __dummyField: void
}

export abstract class StatelessComponent<P> extends Component<P, VoidState> {}

export function bindActionCreator<T>(
  dispatch: Dispatch,
  actionCreator: (payload: T) => Action<T>,
): (t: T) => void {
  return (t: T) => {
    dispatch(actionCreator(t))
  }
}
