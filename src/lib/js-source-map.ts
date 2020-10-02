// TODO(jlfwong): lazy-load these, or this entire file
import * as sourcemap from 'source-map'
import {MappingItem} from 'source-map'
import {Frame, SymbolRemapper} from './profile'
import {findIndexBisect} from './utils'

// Looks like the d.ts description doens't properly define `initialize`
// @ts-ignore

// TODO(jlfwong): Modify this so it works offline
sourcemap.SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
})

const DEBUG = false

export async function importJavaScriptSourceMapSymbolRemapper(
  contentsString: string,
): Promise<SymbolRemapper | null> {
  const contents = JSON.parse(contentsString)

  const mappingItems: MappingItem[] = []

  try {
    await sourcemap.SourceMapConsumer.with(contents, null, consumer => {
      consumer.eachMapping(
        function (m: MappingItem) {
          // The sourcemap library uses 1-based line numbers, and 0-based column
          // numbers. speedscope uses 1-based line-numbers, and 1-based column
          // numbers for its in-memory representation, so we'll normalize that
          // here too.
          mappingItems.push({
            ...m,
            generatedColumn: m.generatedColumn + 1,
            originalColumn: m.originalColumn + 1,
          })
        },
        {},

        // We're going to binary search through these later, so make sure they're
        // sorted by their order in the generated file.
        sourcemap.SourceMapConsumer.GENERATED_ORDER,
      )
    })
  } catch (e) {
    return null
  }

  return (frame: Frame) => {
    if (contents.file && !frame.file?.endsWith(contents.file)) {
      // If the source map has a "file" field, and the given stack frame
      // doesn't match, then this is not the file we're remapping.
      return null
    }

    if (frame.line == null || frame.col == null) {
      // If we don't have a line & column number for the frame, we can't
      // remap it.
      return null
    }

    // If we got here, then we hopefully have an remapping.
    //
    // Ideally, we'd look up a symbol whose generatedLine & generatedColumn
    // match what we have in our profile, but unfortunately browsers don't do
    // this.
    //
    // Browsers set the column number for a function to the index of the
    // opening paren for the argument list, rather than the beginning of the
    // index of the name.
    //
    // function alpha() { ... }
    //               ^
    //
    // const beta = function() { ... }
    //                      ^
    //
    // const gamma = () => { ... }
    //               ^
    //
    // Since we don't have the source code being profiled, we unfortunately
    // can't normalize this to set the column to the first character of the
    // actual name.
    //
    // To work around this limitation, we'll search backwards from the first
    // mapping whose generatedLine & generatedColumn are beyond the location
    // in the profile.
    let mappingIndex = findIndexBisect(mappingItems, m => {
      if (m.generatedLine > frame.line!) return true
      if (m.generatedLine < frame.line!) return false
      if (m.generatedColumn >= frame.col!) return true
      return false
    })

    if (mappingIndex === -1) {
      // There are no symbols following the given profile frame symbol, so try
      // to apply the very last mapping.
      mappingIndex = mappingItems.length - 1
    } else {
      mappingIndex--
    }

    const item = mappingItems[mappingIndex]

    let frameInfo: {name?: string; file?: string; line?: number; col?: number} = {}

    if (item.name != null) {
      frameInfo.name = item.name
    }

    if (item.source != null) {
      frameInfo.file = item.source
      frameInfo.line = item.originalLine
      frameInfo.col = item.originalColumn
    }

    if (DEBUG) {
      console.groupCollapsed(`Remapping ${frame.name} -> ${item.name}`)
      console.log('before', {...frame})
      console.log('item @ index', item)
      console.log('item @ index + 1', mappingItems[mappingIndex + 1])
      console.log('after', frameInfo)
      console.groupEnd()
    }

    return frameInfo
  }
}
