import * as esbuild from 'esbuild'
import {buildOptions, generateIndexHtml} from './esbuild-shared'

async function main() {
  const outdir = process.argv[2]

  let buildResult = await esbuild.build({
    ...buildOptions,
    minify: true,
    metafile: true,
    outdir,
  })

  generateIndexHtml(buildResult, outdir)
}

main()
