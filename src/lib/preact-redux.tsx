/**
 * As of Preact 10.x, they no longer have an officially supported preact-redux library.
 * It's possible to use react-redux with some hacks, but these hacks cause npm run pack
 * to error out because of (intentinoally) unmet peer dependencies.
 *
 * I could stack more hacks to fix this problem, but I'd rather just drop the dependency
 * and remove the need to do any dependency hacking by writing the very small part of
 * react-redux that I actually need myself.
 */

import {h, ComponentChild, FunctionComponent, ComponentClass} from 'preact'
import * as redux from 'redux'
import {createContext, ComponentChildren} from 'preact'
import {Dispatch} from './typed-redux'
import {useEffect, useState} from 'preact/hooks'

const PreactRedux = createContext<redux.Store<any> | null>(null)

interface ProviderProps {
  store: redux.Store<any>
  children?: ComponentChildren
}

export function Provider(props: ProviderProps) {
  return <PreactRedux.Provider value={props.store} children={props.children} />
}

interface ConsumerInnerProps<OwnProps, State, ComponentProps> {
  store: redux.Store<State>
  Component: ComponentClass<ComponentProps, {}>
  map: (state: State, dispatch: Dispatch, ownProps: OwnProps) => ComponentProps
  ownProps: OwnProps
}

function ConsumerInner<OwnProps, State, ComponentProps>(
  props: ConsumerInnerProps<OwnProps, State, ComponentProps>,
) {
  const {store, map, Component, ownProps} = props

  const getProps = () => {
    return map(store.getState(), store.dispatch, ownProps)
  }

  const [childProps, setChildProps] = useState(getProps())

  useEffect(() => {
    return store.subscribe(() => {
      console.log('State change', getProps())
      setChildProps(getProps())
    })
  })

  return <Component {...childProps} />
}

// We make this into a single function invocation instead of the connect(map, map)(Component)
// syntax to make better use of type inference.
//
// NOTE: To avoid this returning objects which do not compare shallow equal, it's the
// responsibility of the caller to ensure that the props returned by map compare shallow
// equal. This most importantly mean memoizing functions which wrap dispatch to avoid
// all callback props from being regenerated on every call.
export function createContainer<OwnProps, State, ComponentProps>(
  Component: ComponentClass<ComponentProps, {}>,
  map: (state: State, dispatch: Dispatch, ownProps: OwnProps) => ComponentProps,
): FunctionComponent<OwnProps> {
  return function (ownProps: OwnProps) {
    return (
      <PreactRedux.Consumer>
        {(store: redux.Store<State> | null): ComponentChild => {
          if (!store) return null
          return <ConsumerInner store={store} Component={Component} map={map} ownProps={ownProps} />
        }}
      </PreactRedux.Consumer>
    )
  }
}
