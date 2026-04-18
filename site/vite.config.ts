import path from 'path'
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

export default defineConfig({
  base: './',
  plugins: [mdx({providerImportSource: '@mdx-js/react'}), react()],
  resolve: {
    alias: {
      '@docs': path.resolve(__dirname, '../docs'),
      '@site': path.resolve(__dirname, './src'),
      '@mdx-js/react': path.resolve(__dirname, './node_modules/@mdx-js/react'),
      react: path.resolve(__dirname, './node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, './node_modules/react/jsx-dev-runtime.js'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
