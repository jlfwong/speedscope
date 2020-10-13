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

// This is rarely used, so let's load it async to avoid bloating the initial
// bundle.
import type {MappingItem, RawSourceMap, SourceMapConsumer} from 'source-map'
const sourceMapModule = import('source-map')

import {Frame, SymbolRemapper} from './profile'
import {findIndexBisect} from './utils'

const DEBUG = false

export async function importJavaScriptSourceMapSymbolRemapper(
  contentsString: string,
  sourceMapFileName: string,
): Promise<SymbolRemapper | null> {
  const sourceMap = await sourceMapModule

  let consumer: SourceMapConsumer | null = null
  let contents: RawSourceMap | null = null

  try {
    contents = JSON.parse(contentsString)
    consumer = new sourceMap.SourceMapConsumer(contents!)
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
    sourceMap.SourceMapConsumer.GENERATED_ORDER,
  )

  const sourceMapFileNameWithoutExt = sourceMapFileName.replace(/\.[^/]*$/, '')

  return (frame: Frame) => {
    let fileMatches = false
    if (contents?.file && contents?.file === frame.file) {
      fileMatches = true
    } else if (
      ('/' + frame.file?.replace(/\.[^/]*$/, '')).endsWith('/' + sourceMapFileNameWithoutExt)
    ) {
      fileMatches = true
    }
    if (!fileMatches) {
      // The source-map doesn't apply to the file this frame is defined in.
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
    } else if (mappingIndex === 0) {
      // If the very first index in mappingItems is beyond the location in the
      // profile, it means the name we're looking for doesn't have a
      // corresponding entry in the source-map (this can happen if the
      // source-map isn't the right source-map)
      return null
    } else {
      mappingIndex--
    }

    const sourceMapItem = mappingItems[mappingIndex]
    const remappedFrameInfo: {name?: string; file?: string; line?: number; col?: number} = {}

    if (sourceMapItem.name != null) {
      remappedFrameInfo.name = sourceMapItem.name
    } else if (sourceMapItem.source != null) {
      // HACK: If the item name isn't specified, but the source is present, then
      // we're going to try to guess what the name is by using the originalLine
      // and originalColumn.

      // The second argument here is "returnNullOnMissing". Without this, it
      // throws instead of returning null.
      const content = consumer?.sourceContentFor(sourceMapItem.source, true)
      if (content) {
        const lines = content.split('\n')
        const line = lines[sourceMapItem.originalLine - 1]
        if (line) {
          // It's possible this source map entry will contain stuff other than
          // the name, so let's only consider word-ish characters that are part
          // of the prefix.
          const identifierMatch = /\w+/.exec(line.substr(sourceMapItem.originalColumn - 1))
          if (identifierMatch) {
            remappedFrameInfo.name = identifierMatch[0]
          }
        }
      }
    }

    switch (remappedFrameInfo.name) {
      case 'constructor': {
        // If the name was remapped to "constructor", then let's use the
        // original name, since "constructor" isn't very helpful.
        //
        // TODO(jlfwong): Search backwards for the class keyword and see if we
        // can guess the right name.
        remappedFrameInfo.name = frame.name + ' constructor'
        break
      }

      case 'function': {
        // If the name is just "function", it probably means we either messed up
        // the remapping, or that we matched an anonymous function. In either
        // case, this isn't helpful, so put this back.
        remappedFrameInfo.name = frame.name
        break
      }

      case 'const':
      case 'export': {
        // If we got this, we probably just did a bad job leveraging the hack
        // looking through the source code. Let's fall-back to whatever the
        // original name was.
        remappedFrameInfo.name = frame.name
        break
      }
    }

    if (remappedFrameInfo.name && frame.name.includes(remappedFrameInfo.name)) {
      // If the remapped name is a substring of the original name, the original
      // name probably contains more useful information. In that case, just use
      // the original name instead.
      //
      // This can happen, for example, when remapping method names. If a
      // call stack says the symbol name is "n.zap" and we remapped it to a
      // function just called "zap", we might as well use the original name
      // instead.
      remappedFrameInfo.name = frame.name
    }

    if (sourceMapItem.source != null) {
      remappedFrameInfo.file = sourceMapItem.source
      remappedFrameInfo.line = sourceMapItem.originalLine
      remappedFrameInfo.col = sourceMapItem.originalColumn
    }

    if (DEBUG) {
      console.groupCollapsed(`Remapping "${frame.name}" -> "${remappedFrameInfo.name}"`)
      console.log('before', {...frame})
      console.log('item @ index', sourceMapItem)
      console.log('item @ index + 1', mappingItems[mappingIndex + 1])
      console.log('after', remappedFrameInfo)
      console.groupEnd()
    }

    return remappedFrameInfo
  }
}
