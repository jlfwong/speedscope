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

describe('reads correct line numbers', () => {
  test('falls back to method start line if raw lines not available', async () => {
    // this was recorded with an older version of stackprof that does not have the raw_lines field
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
        expect(
          profile.getGroupedCalltreeRoot().children[0].children[0].children[0].frame.line,
        ).toBe(37)
      }
    }
  })
  test('uses the most precise iseq line if raw_lines is available', async () => {
    const profileFile = readFileSync('./sample/profiles/stackprof/wall_with_raw_lines.json')
    const profileGroup = await importProfileGroupFromText(
      'wall_with_raw_lines.json',
      profileFile.toString(),
    )
    expect(profileGroup).not.toBeNull()

    if (profileGroup) {
      const profile = profileGroup.profiles[profileGroup.indexToView]
      expect(profile).not.toBeNull()

      if (profile) {
        // note that line 5 of simple.rb is *inside* the function body, proving this works as previously it would only ever show the start line
        // {"col": undefined, "file": ".../sample/programs/ruby/simple.rb", "key": 4826695720, "line": 5, "name": "Object#a", "selfWeight": 0, "totalWeight": 6231645}
        expect(
          profile.getGroupedCalltreeRoot().children[0].children[0].children[0].children[0].frame
            .line,
        ).toBe(5)
      }
    }
  })
})
