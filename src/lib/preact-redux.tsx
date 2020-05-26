/**
 * As of Preact 10.x, they no longer have an officially supported preact-redux library.
 * It's possible to use react-redux with some hacks, but these hacks cause npm run pack
 * to error out because of (intentinoally) unmet peer dependencies.
 *
 * I could stack more hacks to fix this problem, but I'd rather just drop the dependency
 * and remove the need to do any dependency hacking by writing the very small part of
 * react-redux that I actually need myself.
 */

import {h} from 'preact'
import * as redux from 'redux'
import {createContext, ComponentChildren} from 'preact'
import {Dispatch, Action} from './typed-redux'
import {useState, useContext, useCallback, useLayoutEffect} from 'preact/hooks'

const PreactRedux = createContext<redux.Store<any> | null>(null)

interface ProviderProps {
  store: redux.Store<any>
  children?: ComponentChildren
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

export function useActionCreator<T, U>(
  creator_: (payload: T) => Action<U>,
  cacheArgs: any[],
): (t: T) => void {
  const dispatch = useDispatch()

  /* eslint-disable react-hooks/exhaustive-deps */
  const creator = useCallback(creator_, cacheArgs)

  return useCallback((t: T) => dispatch(creator(t)), [dispatch, creator])
}

export function useSelector<T, U>(selector_: (t: T) => U, cacheArgs: any[]): U {
  const store = useStore<T>()

  /* eslint-disable react-hooks/exhaustive-deps */
  const selector = useCallback(selector_, cacheArgs)

  const getValueFromStore = useCallback(() => selector(store.getState()), [store, selector])
  const [value, setValue] = useState(getValueFromStore)

  useLayoutEffect(() => {
    // We need to setValue here because it's possible something has changed the
    // value in the store between the useSelector call and layout. In most cases
    // this should no-op.
    setValue(getValueFromStore())

    return store.subscribe(() => {
      setValue(getValueFromStore())
    })
  }, [store, getValueFromStore])

  return value
}
