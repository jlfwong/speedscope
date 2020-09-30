// TODO(jlfwong): lazy-load these, or this entire file
import * as sourcemap from 'source-map'
import {MappingItem} from 'source-map'
import {Frame, SymbolRemapper} from './profile'

// Looks like the d.ts description doens't properly define `initialize`
// @ts-ignore

// TODO(jlfwong): Modify this so it works offline
sourcemap.SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
})

export async function importJavaScriptSourceMapSymbolRemapper(
  contentsString: string,
): Promise<SymbolRemapper | null> {
  try {
    const contents = JSON.parse(contentsString)

    if (contents.names == null) {
      return null
    }

    if (contents.mappings == null) {
      return null
    }

    const result = new Map<number, Map<number, string>>()

    console.log('contents', contents)

    const mappings: any[] = []

    await sourcemap.SourceMapConsumer.with(contents, null, consumer => {
      consumer.eachMapping(function (m: MappingItem) {
        const line = m.generatedLine - 1
        const col = m.generatedColumn
        if (!result.has(line)) {
          result.set(line, new Map<number, string>())
        }
        result.get(line)?.set(col, m.name)

        mappings.push([
          m.generatedLine,
          m.generatedColumn,
          m.originalLine,
          m.originalColumn,
          m.name,
        ])
      })
    })

    console.log(mappings)

    return (frame: Frame) => {
      return null
    }
  } catch (e) {
    return null
  }

  return null
}
