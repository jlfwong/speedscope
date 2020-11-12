import {buildTrimmedText, ELLIPSIS, remapRangesToTrimmedText} from './text-utils'
import {fuzzyMatchStrings} from './fuzzy-find'

function assertTrimmed(text: string, length: number, expectedTrimmed: string) {
  expect(buildTrimmedText(text, length).trimmedString).toEqual(
    expectedTrimmed.replace('...', ELLIPSIS),
  )
}

test('buildTrimmedText', () => {
  assertTrimmed('hello world', 1, '...')
  assertTrimmed('hello world', 2, 'h...')
  assertTrimmed('hello world', 3, 'h...d')
  assertTrimmed('hello world', 4, 'he...d')
  assertTrimmed('hello world', 10, 'hello...orld')
  assertTrimmed('hello world', 11, 'hello world')
  assertTrimmed('hello world', 100, 'hello world')
})

function highlightText(text: string, highlightedRanges: [number, number][]): string {
  let last = 0
  let highlighted = ''
  for (let range of highlightedRanges) {
    highlighted += `${text.slice(last, range[0])}[${text.slice(range[0], range[1])}]`
    last = range[1]
  }
  highlighted += text.slice(last)
  return highlighted
}

function assertTrimmedHighlight({
  text,
  pattern,
  expectedHighlighted,
  length,
  expectedHighlightedTrimmed,
}: {
  text: string
  pattern: string
  expectedHighlighted: string
  length: number
  expectedHighlightedTrimmed: string
}) {
  const match = fuzzyMatchStrings(text, pattern)
  const trimmed = buildTrimmedText(text, length)

  if (!match) {
    fail()
    return
  }

  const matchedRangesForTrimmedText = remapRangesToTrimmedText(trimmed, match.matchedRanges)
  const highlighted = highlightText(text, match.matchedRanges)
  const highlightedTrimmed = highlightText(trimmed.trimmedString, matchedRangesForTrimmedText)

  expect(highlighted).toEqual(expectedHighlighted)
  expect(highlightedTrimmed).toEqual(expectedHighlightedTrimmed.replace('...', ELLIPSIS))
}

test('remapRangesToTrimmedText', () => {
  assertTrimmedHighlight({
    text: 'hello world',
    pattern: 'he',
    length: 4,
    expectedHighlighted: '[he]llo world',
    expectedHighlightedTrimmed: `[he]...d`,
  })

  assertTrimmedHighlight({
    text: 'hello world',
    pattern: 'o w',
    length: 4,
    expectedHighlighted: 'hell[o w]orld',
    expectedHighlightedTrimmed: `he[...]d`,
  })

  assertTrimmedHighlight({
    text: 'hello world',
    pattern: 'ow',
    length: 4,
    expectedHighlighted: 'hell[o] [w]orld',
    expectedHighlightedTrimmed: `he[...]d`,
  })

  assertTrimmedHighlight({
    text: 'hello world',
    pattern: 'hello',
    length: 4,
    expectedHighlighted: '[hello] world',
    expectedHighlightedTrimmed: `[he...]d`,
  })

  assertTrimmedHighlight({
    text: 'xxhello world',
    pattern: 'hello',
    length: 6,
    expectedHighlighted: 'xx[hello] world',
    expectedHighlightedTrimmed: `xx[h...]ld`,
  })

  assertTrimmedHighlight({
    text: 'hello world',
    pattern: 'hello world',
    length: 4,
    expectedHighlighted: '[hello world]',
    expectedHighlightedTrimmed: `[he...d]`,
  })

  assertTrimmedHighlight({
    text: 'hello world',
    pattern: 'helloworld',
    length: 4,
    expectedHighlighted: '[hello] [world]',
    expectedHighlightedTrimmed: `[he...][d]`,
  })

  assertTrimmedHighlight({
    text: 'hello world',
    pattern: 'world',
    length: 4,
    expectedHighlighted: 'hello [world]',
    expectedHighlightedTrimmed: `he[...d]`,
  })
})
