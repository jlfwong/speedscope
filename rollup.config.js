import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import replace from 'rollup-plugin-replace';
import nodeGlobals from 'rollup-plugin-node-globals';

const plugins = [
  typescript({
    typescript: require('typescript')
  }),
  nodeResolve({
    jsnext: true,
    main: true
  }),
  commonjs({
    include: 'node_modules/**',
    namedExports: {
      'aphrodite': ['StyleSheet', 'css'],
      'react-dom': ['render'],
      'react': ['Component', 'createElement']
    },
    ignore: [ 'domain' ]
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify('development')
  }),
  nodeGlobals()
]

export default [{
  input: 'index.tsx',
  output: {
    file: 'dist/speedscope.js',
    format: 'iife'
  },
  plugins: plugins
}]
