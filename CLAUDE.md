# AI Kit — Agent Guide

AI Kit is a framework-agnostic TypeScript SDK for building AI-powered applications: streaming primitives, multi-agent orchestration, safety guardrails, and framework adapters (React/Vue/Svelte/Next.js). This file orients an AI agent working in this repo.

## Critical Rules

- **No AI attribution in commits/PRs.** Never include "Claude", "Anthropic", "Generated with", or similar in commit messages, PR descriptions, or code comments.
- **pnpm only** — this is a pnpm workspace (`"packageManager": "pnpm@8.12.0"`). Don't use `npm install` or `yarn install` at the root; it will not respect the workspace layout.
- **Never publish from an uncleaned `dist/`.** There is no CI publish workflow — `pnpm publish` is a manual, human-run process (see `scripts/prepare-publish.ts`, `docs/RELEASE.md`). Always run a clean `pnpm build` immediately before publishing, and prefer `pnpm publish:dry-run` first.
- **Don't hand-edit `workspace:*` dependency specifiers.** `scripts/prepare-publish.ts` / `scripts/restore-workspace-deps.ts` handle resolving/restoring them around a publish. Editing them directly risks re-introducing the bug fixed in #204/#205.
- **TypeScript strict mode, no `any`** unless a package's existing code already uses it pervasively (check the package's `tsconfig.json` first).

## Project Structure

```
packages/
  core/           @ainative/ai-kit-core — framework-agnostic streaming, agents, auth, safety internals
  react/          @ainative/ai-kit — React hooks (useAIStream, useConversation) + components
  vue/            @ainative/ai-kit-vue — Vue 3 composables
  svelte/         @ainative/ai-kit-svelte — Svelte stores/components
  nextjs/         @ainative/ai-kit-nextjs — Next.js-specific utilities
  safety/         @ainative/ai-kit-safety — prompt injection / PII / jailbreak detection
  tools/          @ainative/ai-kit-tools — built-in agent tools (code interpreter, etc.)
  video/          @ainative/ai-kit-video — screen/camera/audio recording primitives
  auth/, zerodb/, observability/, rlhf/, testing/, cli/, design-system/
    — supporting packages, one per concern
docs/             API docs, architecture, guides — see docs/guides/ for integration how-tos
examples/         Runnable example apps per framework/use case
scripts/          Release tooling, doc generation, repo-health checks (not published)
website/, html/   Doc-site build artifacts — not source of truth, generated
```

Each package under `packages/*` is independently versioned and published to npm under `@ainative/ai-kit-*`. `packages/react`'s published name is `@ainative/ai-kit` (no `-react` suffix) — don't let that trip up a grep for "the react package."

## Common Tasks

```bash
# Install (always from repo root)
pnpm install

# Build everything (turbo-orchestrated, respects workspace dependency order)
pnpm build

# Build one package
pnpm --filter @ainative/ai-kit-core build

# Test everything / one package
pnpm test
pnpm --filter @ainative/ai-kit-core test

# Type-check without emitting
pnpm type-check

# Generate API docs from source
pnpm docs
```

**Known-broken commands, as of 2026-10:**
- `pnpm lint` fails repo-wide — no `eslint.config.js` exists, only a legacy `.eslintrc.json`, and ESLint 9 requires flat config by default. See #217.
- `pnpm --filter @ainative/ai-kit-tools build` and `pnpm --filter @ainative/ai-kit-testing build` fail their DTS step (`@types/node` resolution gap for Node builtins). See #216.
- There is no CI — nothing runs these commands automatically on a PR. Run them yourself before claiming something works.

## Working on an issue

1. Confirm it's still reproducible against current `main` before trusting the issue text — several open issues here were filed by an automated scanner (`quaid-scanner`) and can be stale or wrong (e.g. #184 claimed no lockfile exists; `pnpm-lock.yaml` was already there).
2. One branch, one issue, one focused PR — this repo has several packages; don't let a fix in one package creep into unrelated ones.
3. Reference the issue number in commits (`Refs #N` / `Closes #N`), per [CONTRIBUTING.md](./CONTRIBUTING.md).
4. For anything touching `AIStream`/`useAIStream`'s wire format, read `docs/guides/ai-stream-wire-contract.md` first — the SSE contract is easy to get subtly wrong from the types alone.

## See also

- [CONTRIBUTING.md](./CONTRIBUTING.md) — full contribution process, coding standards, commit conventions
- [.github/GOVERNANCE.md](./.github/GOVERNANCE.md) — who makes decisions here
- [.github/SUPPORT.md](./.github/SUPPORT.md) — where to get help
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — system design
