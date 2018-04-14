import {h, render} from 'preact'
import {Application} from './application'

let app: Application | null = null
const retained = (window as any)['__retained__'] as any
declare const module: any
if (module.hot) {
  module.hot.dispose(() => {
    if (app) {
      ;(window as any)['__retained__'] = app.serialize()
    }
  })
  module.hot.accept()
}

function ref(instance: Application | null) {
  app = instance
  if (instance && retained) {
    console.log('rehydrating: ', retained)
    instance.rehydrate(retained)
  }
}

render(<Application ref={ref} />, document.body, document.body.lastElementChild || undefined)
