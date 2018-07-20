import * as child_process from 'child_process'
import {checkProfileSnapshot} from '../test-utils'

test('importFromV8ProfLog', async () => {
  const isolatePath = './sample/profiles/node/isolate-0x102802600-v8.log'
  const v8logJsonPath = './sample/profiles/node/simple.v8log.json'
  child_process.execSync(
    `${process.execPath} --prof-process --preprocess -j ${isolatePath} > ${v8logJsonPath}`,
  )
  await checkProfileSnapshot(v8logJsonPath)
})
