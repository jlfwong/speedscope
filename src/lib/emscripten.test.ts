import {importEmscriptenSymbolMap} from './emscripten'

test('importEmscriptenSymbolMap', () => {
  // Valid symbol map
  expect(
    importEmscriptenSymbolMap(
      [
        /* prettier: ignore */
        'a:A',
        'b:B',
        'c:C',
      ].join('\n'),
    ),
  ).toEqual(new Map([['a', 'A'], ['b', 'B'], ['c', 'C']]))

  // Valid symbol map with trailing newline
  expect(
    importEmscriptenSymbolMap(
      [
        /* prettier: ignore */
        'a:A',
        'b:B',
        'c:C',
        'd:D-D',
        '',
      ].join('\n'),
    ),
  ).toEqual(new Map([['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D-D']]))

  // Valid symbol map with non-alpha characters
  expect(importEmscriptenSymbolMap('u6:__ZN8tinyxml210XMLCommentD0Ev\n')).toEqual(
    new Map([['u6', '__ZN8tinyxml210XMLCommentD0Ev']]),
  )

  // WebAssembly symbol map
  expect(
    importEmscriptenSymbolMap(
      [
        /* prettier: ignore */
        '0:A',
        '1:B',
        '2:C',
        '3:D-D',
      ].join('\n'),
    ),
  ).toEqual(
    new Map([
      ['wasm-function[0]', 'A'],
      ['wasm-function[1]', 'B'],
      ['wasm-function[2]', 'C'],
      ['wasm-function[3]', 'D-D'],
    ]),
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
