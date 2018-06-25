import {importAsmJsSymbolMap} from './asm-js'

test('importAsmJSSymbolMap', () => {
  // Valid symbol map
  expect(
    importAsmJsSymbolMap(
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
    importAsmJsSymbolMap(
      [
        /* prettier: ignore */
        'a:A',
        'b:B',
        'c:C',
        '',
      ].join('\n'),
    ),
  ).toEqual(new Map([['a', 'A'], ['b', 'B'], ['c', 'C']]))

  // Valid symbol map with non-alpha characters

  expect(importAsmJsSymbolMap('u6:__ZN8tinyxml210XMLCommentD0Ev\n')).toEqual(
    new Map([['u6', '__ZN8tinyxml210XMLCommentD0Ev']]),
  )

  // Invalid symbol map
  expect(
    importAsmJsSymbolMap(
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
    importAsmJsSymbolMap(
      [
        /* prettier: ignore */
        'a;b 1',
        'a;c 3',
        '',
      ].join('\n'),
    ),
  ).toEqual(null)

  // Unrelated files
  expect(importAsmJsSymbolMap('')).toEqual(null)
  expect(importAsmJsSymbolMap('\n')).toEqual(null)
})
