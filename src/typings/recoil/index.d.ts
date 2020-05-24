// Type definitions for recoil 0.0
// Project: https://github.com/facebookexperimental/recoil#readme
// Definitions by: Christian Santos <https://github.com/csantos42>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 3.7

declare module 'recoil' {
  import {FC} from 'react'

  export class DefaultValue {}

  export type NodeKey = string
  export type AtomValues = Map<NodeKey, Loadable<any>>
  export type ComponentCallback = (state: TreeState) => void
  export type TreeState = Readonly<{
    // Information about the TreeState itself:
    isSnapshot: boolean
    transactionMetadata: object
    dirtyAtoms: Set<NodeKey>

    // ATOMS
    atomValues: AtomValues
    nonvalidatedAtoms: Map<NodeKey, unknown>

    // NODE GRAPH -- will soon move to StoreState
    // Upstream Node dependencies
    nodeDeps: Map<NodeKey, Set<NodeKey>>

    // Downstream Node subscriptions
    nodeToNodeSubscriptions: Map<NodeKey, Set<NodeKey>>
    nodeToComponentSubscriptions: Map<NodeKey, Map<number, [string, ComponentCallback]>>
  }>

  export class AbstractRecoilValue<T> {
    tag: 'Writeable'
    valTag: T
    key: NodeKey
    constructor(newKey: NodeKey)
  }

  export class AbstractRecoilValueReadonly<T> {
    tag: 'Readonly'
    valTag: T
    key: NodeKey
    constructor(newKey: NodeKey)
  }

  export class RecoilState<T> extends AbstractRecoilValue<T> {}

  export class RecoilValueReadOnly<T> extends AbstractRecoilValueReadonly<T> {}

  export type RecoilValue<T> = RecoilValueReadOnly<T> | RecoilState<T>

  export function isRecoilValue(val: unknown): val is RecoilValue<any>

  export interface RecoilRootProps {
    initializeState?: (options: {
      set: <T>(recoilVal: RecoilState<T>, newVal: T) => void
      setUnvalidatedAtomValues: (atomMap: Map<string, unknown>) => void
    }) => void
  }

  export const RecoilRoot: FC<RecoilRootProps>

  export type ResolvedLoadablePromiseInfo<T> = Readonly<{
    value: T
    upstreamState__INTERNAL_DO_NOT_USE?: TreeState
  }>

  export type LoadablePromise<T> = Promise<ResolvedLoadablePromiseInfo<T>>

  export type Loadable<T> =
    | Readonly<{state: 'hasValue'; contents: T}>
    | Readonly<{state: 'hasError'; contents: Error}>
    | Readonly<{
        state: 'loading'
        contents: LoadablePromise<T>
      }>

  export type SetterOrUpdater<T> = (valOrUpdater: ((currVal: T) => T) | T) => void
  export type Resetter = () => void
  export type CallbackInterface = Readonly<{
    getPromise: <T>(recoilVal: RecoilValue<T>) => Promise<T>
    getLoadable: <T>(recoilVal: RecoilValue<T>) => Loadable<T>
    set: <T>(recoilVal: RecoilState<T>, valOrUpdater: ((currVal: T) => T) | T) => void
    reset: (recoilVal: RecoilState<any>) => void
  }>

  /**
   * Returns the value of an atom or selector (readonly or writeable) and subscribes the components to future updates of that state.
   */
  export function useRecoilValue<T>(recoilValue: RecoilValue<T>): T

  /**
   * Returns a Loadable representing the status of the given Recoil state and subscribes the component to future updates of that state. Useful for working with async selectors.
   */
  export function useRecoilValueLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T>

  /**
   * Returns a tuple where the first element is the value of the recoil state and the second is a setter to update that state. Subscribes component to updates of the given state.
   */
  export function useRecoilState<T>(recoilState: RecoilState<T>): [T, SetterOrUpdater<T>]

  /**
   * Returns a tuple where the first element is a Loadable and the second element is a setter function to update the given state. Subscribes component to updates of the given state.
   */
  export function useRecoilStateLoadable<T>(
    recoilState: RecoilState<T>,
  ): [Loadable<T>, SetterOrUpdater<T>]

  /**
   * Returns a setter function for updating Recoil state. Does not subscribe the component to the given state.
   */
  export function useSetRecoilState<T>(recoilState: RecoilState<T>): SetterOrUpdater<T>

  /**
   * Returns a function that will reset the given state to its default value.
   */
  export function useResetRecoilState(recoilState: RecoilState<any>): Resetter

  /**
   * Returns a function that will run the callback that was passed when calling this hook. Useful for accessing Recoil state in response to events.
   */
  export function useRecoilCallback<Args extends ReadonlyArray<unknown>, Return>(
    fn: (interface: CallbackInterface, ...args: Args) => Return,
    deps?: ReadonlyArray<unknown>,
  ): (...args: Args) => Return

  export interface AtomOptions<T> {
    key: NodeKey
    default: RecoilValue<T> | Promise<T> | T
    // persistence_UNSTABLE?: PersistenceSettings<T>,
    dangerouslyAllowMutability?: boolean
  }

  /**
   * Creates an atom, which represents a piece of writeable state
   */
  export function atom<T>(options: AtomOptions<T>): RecoilState<T>
}
