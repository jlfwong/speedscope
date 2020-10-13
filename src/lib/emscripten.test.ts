import {importEmscriptenSymbolMap} from './emscripten'
import {Frame} from './profile'
import {KeyedSet} from './utils'

test('importEmscriptenSymbolMap', () => {
  function checkMap(input: string, expectedMapping: [string, string][]) {
    const mapping = importEmscriptenSymbolMap(input)
    if (mapping == null) {
      fail('Mapping failed to parse')
      return
    }

    const frames = new KeyedSet<Frame>()
    for (let [key, value] of expectedMapping) {
      const frame = Frame.getOrInsert(frames, {key, name: key})
      expect(mapping(frame)?.name).toBe(value)
    }
  }

  // Valid symbol map
  checkMap(
    [
      /* prettier: ignore */
      'a:A',
      'b:B',
      'c:C',
    ].join('\n'),
    [
      ['a', 'A'],
      ['b', 'B'],
      ['c', 'C'],
    ],
  )

  // Valid symbol map with trailing newline
  checkMap(
    [
      /* prettier: ignore */
      'a:A',
      'b:B',
      'c:C',
      'd:D-D',
      '',
    ].join('\n'),
    [
      ['a', 'A'],
      ['b', 'B'],
      ['c', 'C'],
      ['d', 'D-D'],
    ],
  )

  // Valid symbol map with non-alpha characters
  checkMap('u6:__ZN8tinyxml210XMLCommentD0Ev\n', [['u6', '__ZN8tinyxml210XMLCommentD0Ev']])

  // WebAssembly symbol map
  checkMap(
    [
      /* prettier: ignore */
      '0:A',
      '1:B',
      '2:C',
      '3:D-D',
      '4:a\\20b',
      '5:a\\2',
      '6:a\\3z',
      '7:a\\20b\\20c',
    ].join('\n'),
    [
      ['wasm-function[0]', 'A'],
      ['wasm-function[1]', 'B'],
      ['wasm-function[2]', 'C'],
      ['wasm-function[3]', 'D-D'],
      ['wasm-function[4]', 'a b'],
      ['wasm-function[5]', 'a\\2'],
      ['wasm-function[6]', 'a\\3z'],
      ['wasm-function[7]', 'a b c'],
    ],
  )

  // Invalid symbol map
  expect(
    importEmscriptenSymbolMap(
      [
        /* prettier: ignore */
        'a:A',
        'b:B',
        'c',
        '',
      ].join('\n'),
    ),
  ).toEqual(null)

  // Collapsed stack format should not be imported as an asm.js symbol map
  expect(
    importEmscriptenSymbolMap(
      [
        /* prettier: ignore */
        'a;b 1',
        'a;c 3',
        '',
      ].join('\n'),
    ),
  ).toEqual(null)

  // Unrelated files
  expect(importEmscriptenSymbolMap('')).toEqual(null)
  expect(importEmscriptenSymbolMap('\n')).toEqual(null)
})
