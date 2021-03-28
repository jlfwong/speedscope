import {Component} from 'preact'

export type VoidState = {
  __dummyField: void
}
export abstract class StatelessComponent<P> extends Component<P, VoidState> {}
