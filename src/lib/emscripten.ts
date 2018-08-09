type EmscriptenSymbolMap = Map<string, string>

// This imports symbol maps generated by emscripten using the "--emit-symbol-map" flag.
// It allows you to visualize a profile captured in a release build as long as you also
// have the associated symbol map. To do this, first drop the profile into speedscope
// and then drop the symbol map. After the second drop, the symbols will be remapped to
// their original names.
export function importEmscriptenSymbolMap(contents: string): EmscriptenSymbolMap | null {
  const lines = contents.split('\n')
  if (!lines.length) return null

  // Remove a trailing blank line if there is one
  if (lines[lines.length - 1] === '') lines.pop()
  if (!lines.length) return null

  const map: EmscriptenSymbolMap = new Map()
  const intRegex = /^(\d+):([\$\w-]+)$/
  const idRegex = /^([\$\w]+):([\$\w-]+)$/

  for (const line of lines) {
    // Match lines like "103:__ZN8tinyxml210XMLCommentD0Ev"
    const intMatch = intRegex.exec(line)
    if (intMatch) {
      map.set(`wasm-function[${intMatch[1]}]`, intMatch[2])
      continue
    }

    // Match lines like "u6:__ZN8tinyxml210XMLCommentD0Ev"
    const idMatch = idRegex.exec(line)
    if (idMatch) {
      map.set(idMatch[1], idMatch[2])
      continue
    }

    console.log('Unmatched line', line)

    return null
  }

  return map
}
