import * as esbuild from 'esbuild'
import {existsSync, mkdirSync} from 'fs'
import {buildOptions, generateIndexHtml} from './esbuild-shared'

async function main() {
  const outdir = 'dist'
  if (!existsSync(outdir)) {
    mkdirSync(outdir)
  }
  let ctx = await esbuild.context({
    ...buildOptions,
    outdir,
    write: false,
    metafile: true,
    plugins: [
      {
        name: 'speedscope-dev-server',
        setup(build) {
          build.onEnd(buildResult => {
            generateIndexHtml({
              buildResult,
              outdir,
              servingProtocol: 'http',
            })
          })
        },
      },
    ],
  })

  await ctx.rebuild()

  const port = process.env.SPEEDSCOPE_PORT ? parseInt(process.env.SPEEDSCOPE_PORT) : 8000
  let {host} = await ctx.serve({
    servedir: outdir,
    port,
  })

  console.log(`Server is running at http://${host}:${port}`)
}

main()
