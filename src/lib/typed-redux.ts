import * as redux from 'redux'
import {Component} from 'preact'

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
