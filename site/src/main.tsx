import React from 'react'
import ReactDOM from 'react-dom/client'
import {MDXProvider} from '@mdx-js/react'

import App from './App'
import {mdxComponentRegistry} from './mdx-components'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MDXProvider components={mdxComponentRegistry}>
      <App />
    </MDXProvider>
  </React.StrictMode>,
)
