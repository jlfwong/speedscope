import {fuzzyMatchStrings} from './fuzzy-find'
import {sortBy} from './utils'

function assertMatches(texts: string[], pattern: string, expectedResults: string[]) {
  const results: {score: number; highlighted: string}[] = []

  for (let text of texts) {
    const match = fuzzyMatchStrings(text, pattern)
    if (match == null) {
      continue
    }

    let highlighted = ''
    let last = 0
    for (let range of match.matchedRanges) {
      highlighted += `${text.slice(last, range[0])}[${text.slice(range[0], range[1])}]`
      last = range[1]
    }
    highlighted += text.slice(last)

    results.push({score: match.score, highlighted})
  }

  // Sort scores in descending order
  sortBy(results, r => -r.score)
  expect(results.map(r => r.highlighted)).toEqual(expectedResults)
}

function assertMatch(text: string, pattern: string, expected: string) {
  assertMatches([text], pattern, [expected])
}

function assertNoMatch(text: string, pattern: string) {
  assertMatches([text], pattern, [])
}

describe('fuzzyMatchStrings', () => {
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
    assertNoMatch('hello', 'Hello')
    assertNoMatch('hello', 'HELLO')
  })

  test('multiple occurrences', () => {
    assertMatch('hello hello', 'hello', '[hello] hello')
    assertMatch('hellohello', 'hello', '[hello]hello')
  })

  test('prefer earlier matches', () => {
    assertMatches(['cab', 'ab'], 'ab', ['[ab]', 'c[ab]'])
  })

  test('prefer shorter matches', () => {
    assertMatches(['abbc', 'abc', 'abbbc'], 'ac', ['[a]b[c]', '[a]bb[c]', '[a]bbb[c]'])
  })

  test('prefer word boundaries', () => {
    assertMatches(['abc', 'a c'], 'ac', ['[a] [c]', '[a]b[c]'])
  })

  test('prefer camelCase matches', () => {
    assertMatches(['downtown', 'OutNode'], 'n', ['Out[N]ode', 'dow[n]town'])
  })

  test('prefer number prefix matches', () => {
    assertMatches(['211', 'a123'], '1', ['a[1]23', '2[1]1'])
  })
})
