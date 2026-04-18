import * as esbuild from 'esbuild'
import {existsSync, mkdirSync} from 'fs'
import {buildOptions, generateIndexHtml} from './esbuild-shared'
import {DEFAULT_IMPORT_ENGINE, normalizeImportEngine} from '../src/experimental/contracts'

interface DevServerOptions {
  host?: string
  importEngine: string
  port?: number
}

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`
  const arg = process.argv.slice(2).find(entry => entry.startsWith(prefix))
  return arg == null ? undefined : arg.slice(prefix.length)
}

function getPort(value: string | undefined): number | undefined {
  if (value == null || value === '') {
    return undefined
  }

  const port = Number(value)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Expected --port to be a positive integer, received "${value}"`)
  }

  return port
}

function getDevServerOptions(): DevServerOptions {
  return {
    host: getArg('host') || process.env.HOST,
    port: getPort(getArg('port') || process.env.PORT),
    importEngine:
      normalizeImportEngine(getArg('import-engine') || process.env.SPEEDSCOPE_DEFAULT_IMPORT_ENGINE) ||
      DEFAULT_IMPORT_ENGINE,
  }
}

async function main() {
  const options = getDevServerOptions()
  const outdir = 'dist'
  if (!existsSync(outdir)) {
    mkdirSync(outdir)
  }
  let ctx = await esbuild.context({
    ...buildOptions,
    define: {
      ...(buildOptions.define || {}),
      __SPEEDSCOPE_DEFAULT_IMPORT_ENGINE__: JSON.stringify(options.importEngine),
    },
    outdir,
    write: false,
    metafile: true,
    plugins: [
      {
        name: 'speedscope-dev-server',
        setup(build) {
          build.onEnd(buildResult => {
            if (buildResult.errors.length > 0 || buildResult.metafile == null) {
              return
            }
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

  const serveResult = await ctx.serve({
    servedir: outdir,
    ...(options.host ? {host: options.host} : {}),
    ...(options.port ? {port: options.port} : {}),
  })

  const serveResultWithHost = serveResult as typeof serveResult & {
    host?: string
    hosts?: string[]
  }
  const host =
    serveResultWithHost.hosts?.[0] || serveResultWithHost.host || options.host || '127.0.0.1'
  console.log(
    `Server is running at http://${host}:${serveResult.port} (default import engine: ${options.importEngine})`,
  )
}

main()
