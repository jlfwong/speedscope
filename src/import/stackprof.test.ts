import {readFileSync} from 'fs'
import {importProfileGroupFromText} from '.'
import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromStackprof', async () => {
  await checkProfileSnapshot('./sample/profiles/stackprof/simple-stackprof.json')
})

test('importFromStackprof object mode', async () => {
  await checkProfileSnapshot('./sample/profiles/stackprof/object-stackprof.json')
})

test('importFromStackprof when a profile has a frame with no name', async () => {
  await checkProfileSnapshot('./sample/profiles/stackprof/stackprof-last-frame-no-name.json')
})

describe('importCpuProfileWithProperWeights', () => {
  test('importFromStackprof cpu mode snapshot', async () => {
    await checkProfileSnapshot('./sample/profiles/stackprof/simple-cpu-stackprof.json')
  })

  test('uses samples count for weight when importing cpu profile', async () => {
    const profileFile = readFileSync('./sample/profiles/stackprof/simple-cpu-stackprof.json')
    const profileGroup = await importProfileGroupFromText(
      'simple-cpu-stackprof.json',
      profileFile.toString(),
    )
    expect(profileGroup).not.toBeNull()

    if (profileGroup) {
      const profile = profileGroup.profiles[profileGroup.indexToView]
      expect(profile).not.toBeNull()

      if (profile) {
        expect(profile.getWeightUnit()).toBe('microseconds')
        expect(profile.getTotalWeight()).toBe(489000)
      }
    }
  })
})
