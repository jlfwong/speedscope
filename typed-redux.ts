import * as redux from 'redux'

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

// Helper to reduce boilerplate for type definitions
export function reducer<T>(
  cb: (state: T | undefined, action: Action<any>) => T,
): (state: T | undefined, action: Action<any>) => T {
  return cb
}

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
