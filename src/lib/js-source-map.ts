// This file contains code to allow profiles to be remapped by JavaScript source maps.
//
// As of writing, this is using an out-of-date version of source-map, because the
// source-map library migrated to using web-assembly. This requires loading the
// web-assembly ball. The easiest way to do this is to load it from a third-party
// URL, but I want speedscope to work standalone offline. This means that the remaining
// options require some way of having a local URL that corresponds the .wasm file.
//
// Also as of writing, speedscope is bundled with Parcel v1. Trying to import
// a .wasm file in Parcel v1 tries to load the wasm module itself, which is not
// what I'm trying to do -- I want SourceMapConsumer.initialize to be the thing
// booting the WebAssembly, not Parcel itself.
//
// One way of getting around this problem is to modify the build system to
// copy the .wasm file from node_modules/source-map/lib/mappings.wasm. I could do
// this, but it's a bit of a pain.
//
// Another would be to use something like
// import("url:../node_modules/source-map/lib/mappings.wasm"), and then pass the
// resulting URL to SourceMapConsumer.initialize. This is also kind of a pain,
// because I can only do that if I upgrade to Parcel v2. Ultimately, I'd like to
// use esbuild rather than parcel at all, so for now I'm just punting on this by
// using an old-version of source-map which doesn't depend on wasm.

import {SourceMapConsumer, MappingItem, RawSourceMap} from 'source-map'
import {Frame, SymbolRemapper} from './profile'
import {findIndexBisect} from './utils'

const DEBUG = false

export async function importJavaScriptSourceMapSymbolRemapper(
  contentsString: string,
): Promise<SymbolRemapper | null> {
  let consumer: SourceMapConsumer | null = null
  let contents: RawSourceMap | null = null

  try {
    contents = JSON.parse(contentsString)
    consumer = new SourceMapConsumer(contents!)
  } catch (e) {
    return null
  }

  const mappingItems: MappingItem[] = []

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
    SourceMapConsumer.GENERATED_ORDER,
  )

  return (frame: Frame) => {
    if (contents?.file && !frame.file?.endsWith(contents!.file)) {
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
