import {exactMatchStrings} from './profile-search'

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
