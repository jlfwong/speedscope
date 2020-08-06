import * as sourcemap from 'source-map'
import {MappingItem} from 'source-map'

type JavascriptSymbolMap = Map<number, Map<number, string>>

// Looks like the d.ts description doens't properly define `initialize`
// @ts-ignore
sourcemap.SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm',
})

export async function importJavascriptSymbolMap(
  contentsString: string,
): Promise<JavascriptSymbolMap | null> {
  try {
    const contents = JSON.parse(contentsString)

    if (contents.names == null) {
      return null
    }

    if (contents.mappings == null) {
      return null
    }

    const result = new Map<number, Map<number, string>>()

    await sourcemap.SourceMapConsumer.with(contents, null, consumer => {
      consumer.eachMapping(function (m: MappingItem) {
        const line = m.generatedLine - 1
        const col = m.generatedColumn + 1
        if (!result.has(line)) {
          result.set(line, new Map<number, string>())
        }
        result.get(line)?.set(col, m.name)
      })
    })

    return result
  } catch (e) {
    return null
  }

  return null
}
