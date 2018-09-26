import {importProfileGroupFromText} from '.'

test('importProfileGroup', async () => {
  // Importing garbage should return null
  expect(await importProfileGroupFromText('unknown', '')).toBe(null)
  expect(await importProfileGroupFromText('unknown', 'Hello world')).toBe(null)
  expect(await importProfileGroupFromText('unknown', 'Hello\n\nWorld')).toBe(null)
})
