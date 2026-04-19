import {useEffect, useMemo, useState} from 'react'

import {getPage, PageKey, showcasePages} from './content'

function getPageKeyFromHash(hash: string): PageKey {
  const normalized = hash.replace(/^#/, '') as PageKey
  return showcasePages.some(page => page.key === normalized) ? normalized : 'overview'
}

export default function App() {
  const [pageKey, setPageKey] = useState<PageKey>(() => getPageKeyFromHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setPageKey(getPageKeyFromHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const page = useMemo(() => getPage(pageKey), [pageKey])
  const PageComponent = page.component

  const sections = Array.from(new Set(showcasePages.map(item => item.section))).map(section => ({
    section,
    pages: showcasePages.filter(item => item.section === section),
  }))

  return (
    <div className="site-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-eyebrow">Showcase-first fork</p>
          <h1>Speedscope Rust/WASM Migration</h1>
          <p>
            A public case study in using Cursor cloud agents to migrate the hottest import path
            without changing the UI contract.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Showcase pages">
          {sections.map(group => (
            <div className="sidebar-group" key={group.section}>
              <div className="sidebar-group-title">{group.section}</div>
              {group.pages.map(item => (
                <a
                  className={item.key === page.key ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}
                  href={`#${item.key}`}
                  key={item.key}
                >
                  <span>{item.title}</span>
                  <small>{item.description}</small>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <code>README.md</code>
          <code>cloud-agents/README.md</code>
          <code>rust/README.md</code>
          <code>demo/fixtures/README.md</code>
        </div>
      </aside>

      <main className="content">
        <header className="page-header">
          <p className="page-eyebrow">{page.section}</p>
          <h2>{page.title}</h2>
          <p>{page.description}</p>
        </header>
        <article className="page-content">
          <PageComponent />
        </article>
      </main>
    </div>
  )
}
