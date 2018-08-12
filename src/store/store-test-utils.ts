import {Store, AnyAction} from '../../node_modules/redux'
import {ApplicationState, createApplicationStore} from '.'

export function storeTest(name: string, cb: (store: Store<ApplicationState, AnyAction>) => void) {
  const store = createApplicationStore({})
  test(name, () => {
    cb(store)
  })
}
