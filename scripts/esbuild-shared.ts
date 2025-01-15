import * as fs from 'fs'
import * as path from 'path'
import * as esbuild from 'esbuild'

const entryPoint = 'src/speedscope.tsx'

export const buildOptions: esbuild.BuildOptions = {
  entryPoints: [
    entryPoint,

    // This is a kind of silly way to ensure that all of these files end up being
    // discovered by esbuild and copied into the output directory
    'assets/favicon-16x16.png',
    'assets/favicon-32x32.png',
    'assets/favicon.ico',
  ],
  entryNames: '[name]-[hash]',
  chunkNames: '[name]-[hash]',
  assetNames: '[name]-[hash]',
  bundle: true,
  format: 'esm',
  splitting: true,
  loader: {
    '.txt': 'file',
    '.woff2': 'file',
    '.png': 'file',
    '.ico': 'file',
  },
}

export const generateIndexHtml = (buildResult: esbuild.BuildResult, outdir: string) => {
  const outputs = buildResult.metafile!.outputs

  function getOutput(entryPoint: string): [string, esbuild.Metafile['outputs'][string]] {
    const key = Object.keys(outputs).find(key => outputs[key].entryPoint === entryPoint)!
    return [key, outputs[key]]
  }

  function getHashedFilePath(name: string) {
    return path.basename(getOutput(name)[1].imports.find(i => i.kind === 'file-loader')!.path)
  }

  const [mainChunkPath, mainChunk] = getOutput(entryPoint)
  const mainChunkName = path.basename(mainChunkPath)

  const mainChunkCssPath = mainChunk.cssBundle!

  const cssChunk = outputs[mainChunkCssPath]

  const fontPath = cssChunk.imports.find(i => i.path.endsWith('.woff2'))!.path
  const fontName = path.basename(fontPath)

  const syncDependencyNames = mainChunk.imports
    .filter(i => i.kind === 'import-statement')
    .map(i => path.basename(i.path))
  const asyncDependencyNames = mainChunk.imports
    .filter(i => i.kind === 'dynamic-import')
    .map(i => path.basename(i.path))

  const favicon16x16Path = getHashedFilePath('assets/favicon-16x16.png')
  const favicon32x32Path = getHashedFilePath('assets/favicon-32x32.png')
  const faviconIcoPath = getHashedFilePath('assets/favicon.ico')

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>speedscope</title>
    <link rel="stylesheet" href="${path.basename(mainChunk.cssBundle!)}">
    <link rel="icon" type="image/png" sizes="32x32" href="${favicon32x32Path}">
    <link rel="icon" type="image/png" sizes="16x16" href="${favicon16x16Path}">
    <link rel="icon" type="image/x-icon" href="${faviconIcoPath}">
  </head>
  <body>
    <script src="${mainChunkName}" type="module"></script>
    ${syncDependencyNames.map(dep => `<script src="${dep}" type="module"></script>`).join('\n    ')}
    ${asyncDependencyNames
      .map(dep => `<script src="${dep}" type="module" async></script>`)
      .join('\n    ')}
    <link rel="preload" href="${fontName}" as="font" type="font/woff2" crossorigin>
  </body>
</html>
`

  fs.writeFileSync(`${outdir}/index.html`, html)
}
