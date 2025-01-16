import * as esbuild from 'esbuild'
import {buildOptions, generateIndexHtml} from './esbuild-shared'

function parseArgs() {
  const args = process.argv.slice(2)
  const result: {outdir?: string; protocol?: 'http' | 'file'} = {}

  for (let i = 0; i < args.length; i += 2) {
    switch (args[i]) {
      case '--outdir':
        result.outdir = args[i + 1]
        break
      case '--protocol':
        result.protocol = args[i + 1] as 'http' | 'file'
        break
    }
  }
  return result
}

async function main() {
  const {outdir, protocol: servingProtocol} = parseArgs()

  if (!outdir || !servingProtocol) {
    console.error('Usage: build-release.ts --outdir <outdir> --protocol <serving_protocol>')
    process.exit(1)
  }

  if (servingProtocol !== 'http' && servingProtocol !== 'file') {
    console.error('serving_protocol must be either "http" or "file"')
    process.exit(1)
  }

  let buildResult = await esbuild.build({
    ...buildOptions,
    minify: true,
    metafile: true,
    ...(servingProtocol === 'file'
      ? {
          format: 'iife',
          splitting: false,
        }
      : {}),
    outdir,
  })

  generateIndexHtml({
    buildResult,
    outdir,
    servingProtocol,
  })

  console.log(`Successfully built to ${outdir}`)
}

main()
