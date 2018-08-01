declare module 'preact-redux' {
  import {VNode, Component} from 'preact'
  import {Store} from 'redux'

  // We just export the bare minimum here because we're going
  // to implement an API for readability convenience elsewhere
  export function connect(...args: any[]): any

  export class Provider extends Component<{store: Store<any>}, {}> {
    render(): VNode
  }
}
