import * as React from 'react'
import * as ReactDOM from 'react-dom'

import {createAppStore} from './store'
import {ApplicationContainer} from './views/application-container'
import {Provider} from './lib/preact-redux'

console.log(`speedscope v${require('../package.json').version}`)

declare const module: any
if (module.hot) {
  module.hot.dispose(() => {
    // Force the old component go through teardown steps
    ReactDOM.render(<div />, document.body)
  })
  module.hot.accept()
}

const lastStore: any = (window as any)['store']
const store = lastStore ? createAppStore(lastStore.getState()) : createAppStore()
;(window as any)['store'] = store

ReactDOM.render(
  <Provider store={store}>
    <ApplicationContainer />
  </Provider>,
  document.body,
)
