import type {PropsWithChildren, ReactNode} from 'react'

import benchmarkData from '@docs/data/showcase-benchmarks.json'
import fixtureData from '@docs/data/demo-fixtures.json'

type Tone = 'info' | 'success' | 'warning'

function formatMs(value: number) {
  return `${value.toFixed(2)} ms`
}

function formatPct(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatGb(value: number) {
  return `${value.toFixed(2)} GB`
}

function SectionGrid({children}: PropsWithChildren) {
  return <div className="section-grid">{children}</div>
}

function CardGrid({children}: PropsWithChildren) {
  return <div className="card-grid">{children}</div>
}

function Card({
  title,
  eyebrow,
  href,
  children,
}: PropsWithChildren<{title: string; eyebrow?: string; href?: string}>) {
  return (
    <article className="card">
      {eyebrow ? <p className="card-eyebrow">{eyebrow}</p> : null}
      <h3 className="card-title">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {title}
          </a>
        ) : (
          title
        )}
      </h3>
      <div className="card-body">{children}</div>
    </article>
  )
}

function Callout({
  title,
  tone = 'info',
  children,
}: PropsWithChildren<{title: string; tone?: Tone}>) {
  return (
    <div className={`callout callout-${tone}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  )
}

function CommandBlock({title, command}: {title: string; command: string}) {
  return (
    <div className="command-block">
      <div className="command-title">{title}</div>
      <pre>
        <code>{command}</code>
      </pre>
    </div>
  )
}

function StatGrid({children}: PropsWithChildren) {
  return <div className="stat-grid">{children}</div>
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {detail ? <div className="stat-detail">{detail}</div> : null}
    </div>
  )
}

function FlowCard({
  title,
  bullets,
}: {
  title: string
  bullets: string[]
}) {
  return (
    <div className="flow-card">
      <h4>{title}</h4>
      <ul>
        {bullets.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function RepoMap() {
  return (
    <CardGrid>
      <Card eyebrow="Original app" title="Original Speedscope code">
        The original application remains in `src/`, with importers in `src/import/`, UI in
        `src/views/`, and core profile logic in `src/lib/profile.ts`.
      </Card>
      <Card eyebrow="Rust path" title="Rust/WASM importer">
        The Rust crate lives in `rust/speedscope-importer/`. The web and Node glue is under
        `src/experimental/rust-importer/`, and the lazy adapter lives in
        `src/experimental/rust-importer.ts`.
      </Card>
      <Card eyebrow="Cloud agents" title="Cloud control plane">
        The migration orchestration story is centered on `scripts/cloud-control-plane.ts`,
        documented as a first-class artifact in `cloud-agents/`.
      </Card>
      <Card eyebrow="Run it yourself" title="Demo fixtures and commands">
        Curated validation files and the exact commands for side-by-side UI runs, wasm builds,
        and synthetic benchmark reproduction.
      </Card>
    </CardGrid>
  )
}

function CloudAgentHighlights() {
  return (
    <SectionGrid>
      <FlowCard
        title="1. Define the package graph"
        bullets={[
          'Split the migration into lane leads and worker packages.',
          'Assign ownership by logical feature family, not by random file.',
          'Track status in a registry so runs can resume or be retried.',
        ]}
      />
      <FlowCard
        title="2. Route work to the right model"
        bullets={[
          'Use orchestration models for wide, cross-package planning.',
          'Use executor models for bounded, implementation-heavy steps.',
          'Escalate to deep reasoning when ambiguity or failure history rises.',
        ]}
      />
      <FlowCard
        title="3. Gate everything with parity"
        bullets={[
          'Compare legacy and experimental imports fixture by fixture.',
          'Benchmark both paths before allowing cutover.',
          'Keep rollback paths and package-level artifact collection visible.',
        ]}
      />
    </SectionGrid>
  )
}

function ModelRoutingCards() {
  return (
    <CardGrid>
      <Card eyebrow="Orchestration default" title="GPT-5.4">
        <p>
          Used for the control-plane layer: planning package waves, coordinating cross-package
          work, synthesizing integration decisions, and keeping the overall migration moving.
        </p>
        <p>
          This is the slot behind `orchestratorDefaultModel`, which currently defaults to
          `gpt-5.4-xhigh-fast`.
        </p>
      </Card>
      <Card eyebrow="Bounded executor" title="Composer">
        <p>
          Used for well-scoped worker tasks where the spec was already clear, the blast radius was
          local, and the job was mostly execution-heavy implementation.
        </p>
        <p>
          This is the slot behind `executorModel`, which currently defaults to `composer-2`.
        </p>
      </Card>
      <Card eyebrow="Deep reasoning slot" title="Opus">
        <p>
          Reserved for ambiguous, high-blast-radius, or repeatedly failing packages where deeper
          reasoning was worth the extra cost.
        </p>
        <p>
          The original plan framed this as the Opus 4.6-style deep-reasoning path; the current
          control-plane default resolves to `claude-opus-4-7-thinking-max`.
        </p>
      </Card>
    </CardGrid>
  )
}

function ArchitectureOldFlow() {
  return (
    <div className="architecture-grid">
      <FlowCard
        title="Parse and detect"
        bullets={[
          'Read the full profile into JavaScript-owned memory.',
          'Decode text and run JSON.parse in the main import path.',
          'Dispatch into TypeScript importers based on file shape.',
        ]}
      />
      <FlowCard
        title="Build profile structures"
        bullets={[
          'Construct JS frames, nodes, and samples eagerly.',
          'Duplicate work across append-order and grouped call trees.',
          'Pay in object allocation, GC churn, and large heap pressure.',
        ]}
      />
      <FlowCard
        title="Render unchanged UI"
        bullets={[
          'The UI itself is not the bottleneck for import-heavy workloads.',
          'The expensive work happens before the flamecharts ever render.',
        ]}
      />
    </div>
  )
}

function ArchitectureRustFlow() {
  return (
    <div className="architecture-grid">
      <FlowCard
        title="Rust importer seam"
        bullets={[
          'Sampled Speedscope JSON is parsed in Rust/WASM first.',
          'Unsupported formats still fall back to the legacy TypeScript importers.',
          'The seam is implemented in `src/experimental/engine.ts`.',
        ]}
      />
      <FlowCard
        title="Lazy TypeScript adapter"
        bullets={[
          'Rust returns a JS-friendly intermediate.',
          'The adapter materializes frames and trees only when the UI needs them.',
          'This cuts eager heap pressure while preserving the existing UI contract.',
        ]}
      />
      <FlowCard
        title="Same UI surface"
        bullets={[
          'The same Speedscope views stay in place.',
          'Validation is a same-file, same-UI, different-importer comparison.',
        ]}
      />
    </div>
  )
}

function BenchmarkDashboard() {
  const corpusFaster = benchmarkData.fixtureCorpus.filter(
    item => item.experimentalMedianMs < item.legacyMedianMs,
  ).length
  const corpusSlower = benchmarkData.fixtureCorpus.length - corpusFaster
  const headline = benchmarkData.syntheticComparisons.find(item => item.label === '56.1 MB')

  return (
    <div className="benchmark-dashboard">
      <StatGrid>
        <Stat
          label="Best repeated apples-to-apples win"
          value={headline ? formatPct(headline.deltaPct) : 'n/a'}
          detail={headline ? `${headline.label} synthetic sampled import` : undefined}
        />
        <Stat
          label="Largest completed experimental-only import"
          value={benchmarkData.experimentalOnlyLargest.label}
          detail={formatMs(benchmarkData.experimentalOnlyLargest.experimentalMedianMs)}
        />
        <Stat
          label="Corpus fixtures faster"
          value={`${corpusFaster}/${benchmarkData.fixtureCorpus.length}`}
          detail="Using the current `npm run experiment:benchmark` sweep"
        />
        <Stat
          label="Cloud-agent claim"
          value="Parity + speed"
          detail="The migration story is only credible because the control plane kept both visible."
        />
      </StatGrid>

      <div className="chart-block">
        <h3>Synthetic sampled imports</h3>
        <div className="comparison-list">
          {benchmarkData.syntheticComparisons.map(item => {
            const max = Math.max(item.legacyMedianMs, item.experimentalMedianMs)
            return (
              <div className="comparison-row" key={item.label}>
                <div className="comparison-meta">
                  <strong>{item.label}</strong>
                  <span>{item.samples.toLocaleString()} samples</span>
                  <span>{formatPct(item.deltaPct)}</span>
                </div>
                <div className="comparison-bars">
                  <div className="bar-pair">
                    <div className="bar-label">Legacy</div>
                    <div className="bar-track">
                      <div
                        className="bar bar-legacy"
                        style={{width: `${(item.legacyMedianMs / max) * 100}%`}}
                      />
                    </div>
                    <div className="bar-value">{formatMs(item.legacyMedianMs)}</div>
                  </div>
                  <div className="bar-pair">
                    <div className="bar-label">Rust/WASM</div>
                    <div className="bar-track">
                      <div
                        className="bar bar-experimental"
                        style={{width: `${(item.experimentalMedianMs / max) * 100}%`}}
                      />
                    </div>
                    <div className="bar-value">{formatMs(item.experimentalMedianMs)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="chart-block">
        <h3>Heap behavior</h3>
        <div className="comparison-list">
          {benchmarkData.syntheticComparisons.map(item => {
            const max = Math.max(item.legacyHeapGb, item.experimentalHeapGb)
            return (
              <div className="comparison-row" key={`${item.label}-heap`}>
                <div className="comparison-meta">
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </div>
                <div className="comparison-bars">
                  <div className="bar-pair">
                    <div className="bar-label">Legacy heap</div>
                    <div className="bar-track">
                      <div
                        className="bar bar-legacy"
                        style={{width: `${(item.legacyHeapGb / max) * 100}%`}}
                      />
                    </div>
                    <div className="bar-value">{formatGb(item.legacyHeapGb)}</div>
                  </div>
                  <div className="bar-pair">
                    <div className="bar-label">Rust/WASM heap</div>
                    <div className="bar-track">
                      <div
                        className="bar bar-experimental"
                        style={{width: `${(item.experimentalHeapGb / max) * 100}%`}}
                      />
                    </div>
                    <div className="bar-value">{formatGb(item.experimentalHeapGb)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FixtureGallery() {
  return (
    <CardGrid>
      {fixtureData.fixtures.map(item => (
        <Card key={item.path} eyebrow={item.kind} title={item.label}>
          <p>{item.why}</p>
          <pre>
            <code>{item.path}</code>
          </pre>
        </Card>
      ))}
    </CardGrid>
  )
}

function ShowcaseLinks() {
  return (
    <CardGrid>
      <Card title="Classic UI port">
        <p>Run the legacy importer on its own dev server.</p>
        <pre>
          <code>npm run serve:classic-ui</code>
        </pre>
      </Card>
      <Card title="Rust/WASM UI port">
        <p>Run the experimental importer on its own dev server.</p>
        <pre>
          <code>npm run serve:wasm-ui</code>
        </pre>
      </Card>
      <Card title="Side-by-side comparison">
        <p>Launch both ports at once and load the same profile in each tab.</p>
        <pre>
          <code>npm run serve:side-by-side</code>
        </pre>
      </Card>
      <Card title="Rebuild the wasm packages">
        <p>Recreate both web and Node glue from the Rust crate.</p>
        <pre>
          <code>npm run experiment:build-rust-wasm</code>
        </pre>
      </Card>
    </CardGrid>
  )
}

function ExperimentalLimits() {
  return (
    <CardGrid>
      {benchmarkData.limitCases.map(item => (
        <Card key={item.label} eyebrow={item.status.toUpperCase()} title={item.label}>
          <p>{item.detail}</p>
        </Card>
      ))}
    </CardGrid>
  )
}

export function useMDXComponents() {
  return {
    Callout,
    Card,
    CardGrid,
    CloudAgentHighlights,
    CommandBlock,
    ArchitectureOldFlow,
    ArchitectureRustFlow,
    BenchmarkDashboard,
    ExperimentalLimits,
    FixtureGallery,
    ModelRoutingCards,
    RepoMap,
    SectionGrid,
    ShowcaseLinks,
    Stat,
    StatGrid,
  }
}

export const mdxComponentRegistry = useMDXComponents()

export function InlineLink({href, children}: {href: string; children: ReactNode}) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}
