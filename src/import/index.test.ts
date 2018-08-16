import {importProfileGroup} from '.'

test('importProfileGroup', async () => {
  // Importing garbage should return null
  expect(await importProfileGroup('unknown', '')).toBe(null)
  expect(await importProfileGroup('unknown', 'Hello world')).toBe(null)
  expect(await importProfileGroup('unknown', 'Hello\n\nWorld')).toBe(null)
})
