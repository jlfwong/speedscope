import type {ComponentType} from 'react'

import OverviewPage from '@docs/overview/index.mdx'
import CloudAgentsPage from '@docs/cloud-agents/index.mdx'
import OriginalArchitecturePage from '@docs/architecture/original.mdx'
import RustArchitecturePage from '@docs/architecture/rust.mdx'
import DemoPage from '@docs/demo/side-by-side.mdx'
import BenchmarksPage from '@docs/benchmarks/index.mdx'

export type PageKey =
  | 'overview'
  | 'cloud-agents'
  | 'architecture-original'
  | 'architecture-rust'
  | 'demo'
  | 'benchmarks'

export interface ShowcasePage {
  key: PageKey
  title: string
  description: string
  section: string
  component: ComponentType<Record<string, unknown>>
}

export const showcasePages: ShowcasePage[] = [
  {
    key: 'overview',
    title: 'Start Here',
    description: 'Repo map, preserved original code, and the public demo story.',
    section: 'Overview',
    component: OverviewPage,
  },
  {
    key: 'cloud-agents',
    title: 'Cloud Agents',
    description: 'How the Cursor SDK control plane broke the migration into packages.',
    section: 'Core Story',
    component: CloudAgentsPage,
  },
  {
    key: 'architecture-original',
    title: 'Original Architecture',
    description: 'The original TypeScript import path and its bottlenecks.',
    section: 'Architecture',
    component: OriginalArchitecturePage,
  },
  {
    key: 'architecture-rust',
    title: 'Rust/WASM Architecture',
    description: 'The new Rust importer seam and why the UI remains unchanged.',
    section: 'Architecture',
    component: RustArchitecturePage,
  },
  {
    key: 'demo',
    title: 'Run Side by Side',
    description: 'How to launch classic and experimental ports and validate the same profile in both.',
    section: 'Validate It',
    component: DemoPage,
  },
  {
    key: 'benchmarks',
    title: 'Benchmarks',
    description: 'The end-to-end browser-visible and importer-only results that justify the migration.',
    section: 'Validate It',
    component: BenchmarksPage,
  },
]

export function getPage(key: PageKey): ShowcasePage {
  return showcasePages.find(page => page.key === key) || showcasePages[0]
}
