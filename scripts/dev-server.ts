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

  // TODO(jlfwong): This only builds the index file once at the server boot. It
  // would be nice to have this rebuild on demand, but I don't see an API
  // available from esbuild that would let me intercept to do this.
  //
  // I could just build my own server to do this and call rebuild manually, but
  // this is good enough for now.
  let buildResult = await ctx.rebuild()
  generateIndexHtml(buildResult, outdir)

  let {host, port} = await ctx.serve({
    servedir: outdir,
  })

  console.log(`Server is running at http://${host}:${port}`)
}

main()
