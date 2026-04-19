# Cloud Agents

This directory exists to make the orchestration story discoverable before anyone opens the control-plane script itself.

## The canonical source

The actual implementation lives in:

- `scripts/cloud-control-plane.ts`
- `scripts/cloud-control-plane.test.ts`

## Why this matters

The public lesson of this repository is not just that Rust/WASM can accelerate a hot path. It is that Cursor cloud agents can be orchestrated in a disciplined way to migrate a large codebase:

- package the migration by logical ownership
- route work to different models based on scope and ambiguity
- keep parity and benchmark gates visible
- synthesize green branches back into a coherent integration branch

## How the models were delegated

- `composer-2` handled bounded executor work when a package was well-specified, local in scope, and mostly implementation-heavy.
- `gpt-5.4-xhigh-fast` handled orchestration and synthesis when the job involved package-wave planning, cross-package coordination, or integration judgment.
- The Opus deep-reasoning slot handled escalations for ambiguous, high-blast-radius, or repeatedly failing work. The original plan described this as the Opus 4.6-style reasoning path; the current control-plane default resolves to `claude-opus-4-7-thinking-max`.

That split is not just narrative. It is encoded in the routing policy inside `scripts/cloud-control-plane.ts` through heuristics like spec completeness, ambiguity, blast radius, cross-package scope, and failure history.

## Commands

```bash
npm run experiment:doctor
npm run experiment:graph
npm run experiment:report
npm run experiment:gate
```

## What to read next

- Root README: `README.md`
- Public showcase site: `site/`
- Architecture pages: `docs/architecture/`
