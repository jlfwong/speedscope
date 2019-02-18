import {importProfileGroupFromText} from '.'

test('importProfileGroup', async () => {
  // Importing garbage should return null
  expect(await importProfileGroupFromText('unknown', '')).toBe(null)
  expect(await importProfileGroupFromText('unknown', 'Hello world')).toBe(null)
  expect(await importProfileGroupFromText('unknown', 'Hello\n\nWorld')).toBe(null)

  // Importing from a version of stackprof which was missing raw_timestamp_deltas should return null
  const oldStackprof = `{"version":1.2,"mode":"wall","interval":1000,"samples":0,"gc_samples":0,"missed_samples":0,"frames":{}}`
  expect(await importProfileGroupFromText('unknown', oldStackprof)).toBe(null)
})
