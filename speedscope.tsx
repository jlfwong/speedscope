import {h, render, Component} from 'preact'
import {Application} from './application'
import {createApplicationStore} from './app-state'

console.log(`speedscope v${require('./package.json').version}`)

declare const module: any
if (module.hot) {
  module.hot.dispose(() => {
    render(<div />, document.body, document.body.lastElementChild || undefined)
  })
  module.hot.accept()
}

const lastStore: any = (window as any)['store']
const store = createApplicationStore(lastStore ? lastStore.getState() : {})
;(window as any)['store'] = store

class Root extends Component<{}, {}> {
  private unsubscribe: () => void = () => {}

  componentDidMount() {
    this.unsubscribe = store.subscribe(() => this.forceUpdate())
    this.forceUpdate()
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    return <Application dispatch={store.dispatch.bind(store)} app={store.getState()} />
  }
}

function rerender() {
  render(<Root />, document.body, document.body.lastElementChild || undefined)
}
rerender()
