import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['src/speedscope.tsx'],
  bundle: true,
  outdir: 'assets',
  format: 'esm',
  splitting: true,
  loader: {
    '.txt': 'file',
  },
})

let {host, port} = await ctx.serve({
  servedir: 'assets',
})

console.log(`Server is running at http://${host}:${port}`)
