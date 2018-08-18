import * as fs from 'fs'

import {Store, AnyAction} from 'redux'
import {ApplicationState, createApplicationStore} from '.'
import {importSpeedscopeProfiles} from '../lib/file-format'

export function storeTest(name: string, cb: (store: Store<ApplicationState, AnyAction>) => void) {
  const store = createApplicationStore({})
  test(name, () => {
    cb(store)
  })
}

const filepath = './sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json'
const input = fs.readFileSync(filepath, 'utf8')
export const profileGroupTwoSampled = importSpeedscopeProfiles(JSON.parse(input))
