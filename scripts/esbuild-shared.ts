import * as fs from 'fs'
import * as path from 'path'
import * as esbuild from 'esbuild'

const entryPoint = 'src/speedscope.tsx'

export const buildOptions: esbuild.BuildOptions = {
  entryPoints: [entryPoint],
  entryNames: '[name]-[hash]',
  chunkNames: '[name]-[hash]',
  bundle: true,
  format: 'esm',
  splitting: true,
  loader: {
    '.txt': 'file',
  },
}

export const generateIndexHtml = (buildResult: esbuild.BuildResult, outdir: string) => {
  const outputs = buildResult.metafile!.outputs

  const mainChunkPath = Object.keys(outputs).find(key => outputs[key].entryPoint === entryPoint)!
  const mainChunkName = path.basename(mainChunkPath)

  const mainChunk = outputs[mainChunkPath]
  const syncDependencyNames = mainChunk.imports
    .filter(i => i.kind === 'import-statement')
    .map(i => path.basename(i.path))
  const asyncDependencyNames = mainChunk.imports
    .filter(i => i.kind === 'dynamic-import')
    .map(i => path.basename(i.path))

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>speedscope</title>
    <link href="source-code-pro.css" rel="stylesheet">
    <link rel="stylesheet" href="reset.css">
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  </head>
  <body>
    <script src="${mainChunkName}" type="module"></script>
    ${syncDependencyNames.map(dep => `<script src="${dep}" type="module"></script>`).join('\n    ')}
    ${asyncDependencyNames
      .map(dep => `<script src="${dep}" type="module" async></script>`)
      .join('\n    ')}
  </body>
</html>
`

  fs.writeFileSync(`${outdir}/index.html`, html)
}
