import {exactMatchStrings, ProfileSearchResults} from './profile-search'
import {CallTreeProfileBuilder, Frame, FrameInfo} from './profile'

function assertMatch(text: string, pattern: string, expected: string) {
  const match = exactMatchStrings(text, pattern)

  let highlighted = ''
  let last = 0
  for (let range of match) {
    highlighted += `${text.slice(last, range[0])}[${text.slice(range[0], range[1])}]`
    last = range[1]
  }
  highlighted += text.slice(last)

  expect(highlighted).toEqual(expected)
}

function assertNoMatch(text: string, pattern: string) {
  assertMatch(text, pattern, text)
}

describe('exactMatchStrings', () => {
  test('no match', () => {
    assertNoMatch('a', 'b')
    assertNoMatch('aa', 'ab')
    assertNoMatch('a', 'aa')
    assertNoMatch('ca', 'ac')
  })

  test('full text match', () => {
    assertMatch('hello', 'hello', '[hello]')
    assertMatch('multiple words', 'multiple words', '[multiple words]')
  })

  test('case sensitivity', () => {
    assertMatch('HELLO', 'hello', '[HELLO]')
    assertMatch('Hello', 'hello', '[Hello]')
    assertMatch('hello', 'Hello', '[hello]')
    assertMatch('hello', 'HELLO', '[hello]')
  })

  test('multiple occurrences', () => {
    assertMatch('hello hello', 'hello', '[hello] [hello]')
    assertMatch('hellohello', 'hello', '[hello][hello]')
  })

  test('overlapping occurrences', () => {
    assertMatch('aaaaa', 'aa', '[aa][aa]a')
    assertMatch('abababa', 'aba', '[aba]b[aba]')
  })
})

describe('ProfileSearchResults', () => {
  const runA: FrameInfo = {key: 'runA', name: 'run', file: 'src/modules/a.ts'}
  const runB: FrameInfo = {key: 'runB', name: 'run', file: 'src/modules/b.ts'}
  const other: FrameInfo = {key: 'other', name: 'other'}
  const main: FrameInfo = {key: 'main', name: 'main', file: 'src/main.ts'}

  const builder = new CallTreeProfileBuilder()
  builder.enterFrame(main, 0)
  const children = [runA, runB, other]
  children.forEach((info, i) => {
    builder.enterFrame(info, i)
    builder.leaveFrame(info, i + 1)
  })
  builder.leaveFrame(main, children.length)
  const profile = builder.build()

  function frameFor(info: FrameInfo): Frame {
    let found: Frame | null = null
    profile.forEachFrame(f => {
      if (f.key === info.key) found = f
    })
    return found!
  }

  test('matches by file', () => {
    const results = new ProfileSearchResults(profile, 'src/modules/a')
    expect(results.getMatchForFrame(frameFor(runA))).toEqual([])
    expect(results.getMatchForFrame(frameFor(runB))).toBeNull()
    expect(results.getMatchForFrame(frameFor(main))).toBeNull()
  })

  test('matches by name with name ranges', () => {
    const results = new ProfileSearchResults(profile, 'run')
    expect(results.getMatchForFrame(frameFor(runA))).toEqual([[0, 3]])
    expect(results.getMatchForFrame(frameFor(runB))).toEqual([[0, 3]])
    expect(results.getMatchForFrame(frameFor(other))).toBeNull()
  })

  test('file match is case insensitive', () => {
    const results = new ProfileSearchResults(profile, 'SRC/MODULES')
    expect(results.getMatchForFrame(frameFor(runA))).toEqual([])
    expect(results.getMatchForFrame(frameFor(runB))).toEqual([])
    expect(results.getMatchForFrame(frameFor(main))).toBeNull()
  })

  test('frame without a file does not throw', () => {
    const results = new ProfileSearchResults(profile, 'src/')
    expect(results.getMatchForFrame(frameFor(other))).toBeNull()
  })

  test('name and file match returns name ranges only', () => {
    const results = new ProfileSearchResults(profile, 'main')
    expect(results.getMatchForFrame(frameFor(main))).toEqual([[0, 4]])
  })
})
