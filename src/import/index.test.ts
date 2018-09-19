import {importProfileGroup} from '.'
import {TextProfileDataSource} from './utils'

test('importProfileGroup', async () => {
  // Importing garbage should return null
  expect(await importProfileGroup(new TextProfileDataSource('unknown', ''))).toBe(null)
  expect(await importProfileGroup(new TextProfileDataSource('unknown', 'Hello world'))).toBe(null)
  expect(await importProfileGroup(new TextProfileDataSource('unknown', 'Hello\n\nWorld'))).toBe(
    null,
  )
})
