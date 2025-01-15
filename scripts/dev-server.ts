import * as esbuild from 'esbuild'
import {buildOptions, generateIndexHtml} from './esbuild-shared'

async function main() {
  const outdir = 'dist'
  let ctx = await esbuild.context({
    ...buildOptions,
    outdir,
    write: false,
    metafile: true,
  })

  let buildResult = await ctx.rebuild()
  generateIndexHtml(buildResult, outdir)

  let {host, port} = await ctx.serve({
    servedir: outdir,
  })

  console.log(`Server is running at http://${host}:${port}`)
}

main()
