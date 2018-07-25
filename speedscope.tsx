import {h, render} from 'preact'
import {Application} from './application'
import {createApplicationStore} from './app-state'

console.log(`speedscope v${require('./package.json').version}`)

let retained = (window as any)['__retained__'] as any
declare const module: any
if (module.hot) {
  module.hot.dispose(() => {
    unsubscribe()
    ;(window as any)['__retained__'] = store.getState()
  })
  module.hot.accept()
}

const store = createApplicationStore(retained ? retained : {})
function rerender() {
  render(
    <Application dispatch={store.dispatch.bind(store)} app={store.getState()} />,
    document.body,
    document.body.lastElementChild || undefined,
  )
}
const unsubscribe = store.subscribe(rerender)
rerender()
