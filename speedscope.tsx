import {h, render} from 'preact'
import {createApplicationStore, ApplicationState} from './app-state'
import {Provider} from 'preact-redux'
import {Dispatch, createContainer} from './app-state/typed-redux'
import {Application} from './application'

console.log(`speedscope v${require('./package.json').version}`)

declare const module: any
if (module.hot) {
  module.hot.dispose(() => {
    // Force the old component go through teardown steps
    render(<div />, document.body, document.body.lastElementChild || undefined)
  })
  module.hot.accept()
}

const lastStore: any = (window as any)['store']
const store = createApplicationStore(lastStore ? lastStore.getState() : {})
;(window as any)['store'] = store

const ApplicationContainer = createContainer(Application, (state: ApplicationState) => state)

render(
  <Provider store={store}>
    <ApplicationContainer />
  </Provider>,
  document.body,
  document.body.lastElementChild || undefined,
)
