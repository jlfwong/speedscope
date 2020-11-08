import {h, render} from 'preact'
import {createAppStore} from './store'
import {ApplicationContainer} from './views/application-container'
import {Provider} from './lib/preact-redux'
import { ThemeContext } from './views/themes/theme'
import { darkTheme } from './views/themes/dark-theme'
import { lightTheme } from './views/themes/light-theme'

console.log(`speedscope v${require('../package.json').version}`)

declare const module: any
if (module.hot) {
  module.hot.dispose(() => {
    // Force the old component go through teardown steps
    render(<div />, document.body, document.body.lastElementChild || undefined)
  })
  module.hot.accept()
}

const lastStore: any = (window as any)['store']
const store = lastStore ? createAppStore(lastStore.getState()) : createAppStore()
;(window as any)['store'] = store

render(
  <Provider store={store}>
    <ThemeContext.Provider value={darkTheme}>
      <ApplicationContainer />
    </ThemeContext.Provider>
  </Provider>,
  document.body,
  document.body.lastElementChild || undefined,
)
