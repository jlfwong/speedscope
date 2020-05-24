/**
 * As of Preact 10.x, they no longer have an officially supported preact-redux library.
 * It's possible to use react-redux with some hacks, but these hacks cause npm run pack
 * to error out because of (intentinoally) unmet peer dependencies.
 *
 * I could stack more hacks to fix this problem, but I'd rather just drop the dependency
 * and remove the need to do any dependency hacking by writing the very small part of
 * react-redux that I actually need myself.
 */

import * as React from 'react'
import * as redux from 'redux'
import {Dispatch, Action} from './typed-redux'
import {useState, createContext, useContext, useCallback, useLayoutEffect} from 'react'

const PreactRedux = createContext<redux.Store<any> | null>(null)

interface ProviderProps {
  store: redux.Store<any>
  children?: React.ReactNode
}

export function Provider(props: ProviderProps) {
  return <PreactRedux.Provider value={props.store} children={props.children} />
}

function useStore<T>(): redux.Store<T> {
  const store = useContext(PreactRedux)
  if (store == null) {
    throw new Error('Called useStore when no store exists in context')
  }
  return store
}

export function useDispatch(): Dispatch {
  const store = useStore()
  return store.dispatch
}

export function useActionCreator<T, U>(creator: (payload: T) => Action<U>): (t: T) => void {
  const dispatch = useDispatch()
  return useCallback((t: T) => dispatch(creator(t)), [dispatch, creator])
}

export function useSelector<T, U>(selector: (t: T) => U): U {
  const store = useStore<T>()
  const [value, setValue] = useState(() => selector(store.getState()))

  useLayoutEffect(() => {
    return store.subscribe(() => {
      setValue(selector(store.getState()))
    })
  }, [store, selector])

  return value
}
