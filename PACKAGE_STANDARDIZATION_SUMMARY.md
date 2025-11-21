# Package Standardization Summary

**Quick reference for standardized metadata across all AI Kit packages**

---

## Package Naming Convention

All packages follow the `@ainative/ai-kit-*` pattern:

| Package Directory | NPM Package Name | Type |
|-------------------|------------------|------|
| `packages/react` | `@ainative/ai-kit` | Main package |
| `packages/core` | `@ainative/ai-kit-core` | Core library |
| `packages/svelte` | `@ainative/ai-kit-svelte` | Framework adapter |
| `packages/vue` | `@ainative/ai-kit-vue` | Framework adapter |
| `packages/nextjs` | `@ainative/ai-kit-nextjs` | Framework utilities |
| `packages/cli` | `@ainative/ai-kit-cli` | CLI tool |
| `packages/tools` | `@ainative/ai-kit-tools` | Agent tools |
| `packages/auth` | `@ainative/ai-kit-auth` | AINative integration |
| `packages/rlhf` | `@ainative/ai-kit-rlhf` | AINative integration |
| `packages/zerodb` | `@ainative/ai-kit-zerodb` | AINative integration |
| `packages/design-system` | `@ainative/ai-kit-design-system` | MCP integration |
| `packages/testing` | `@ainative/ai-kit-testing` | Testing utilities |
| `packages/observability` | `@ainative/ai-kit-observability` | Monitoring/observability |
| `packages/safety` | `@ainative/ai-kit-safety` | Safety/security |

---

## Standard Metadata

### Common Fields (All Packages)

```json
{
  "version": "0.1.0-alpha.0",
  "author": "AINative Studio",
  "license": "MIT",
  "homepage": "https://ai-kit.ainative.studio",
  "repository": {
    "type": "git",
    "url": "https://github.com/AINative-Studio/ai-kit.git",
    "directory": "packages/[package-name]"
  },
  "bugs": {
    "url": "https://github.com/AINative-Studio/ai-kit/issues"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": ["dist", "README.md", "LICENSE"]
}
```

### Required Scripts (All Packages)

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "type-check": "tsc --noEmit",
    "lint": "eslint src",
    "clean": "rm -rf dist"
  }
}
```

### Standard Exports (Most Packages)

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

---

## Key Changes Made

### Package Renames

1. **`@ainative/ai-kit-react` → `@ainative/ai-kit`**
   - Main package for React users
   - Simplest install: `npm install @ainative/ai-kit`

2. **`@ainative/ai-kit-design` → `@ainative/ai-kit-design-system`**
   - More descriptive name
   - Consistency with feature name

### Metadata Updates

- ✅ Added missing `homepage` fields (2 packages)
- ✅ Added missing `bugs` fields (2 packages)
- ✅ Added missing `engines` field (1 package)
- ✅ Added missing `exports` field (1 package)
- ✅ Standardized `publishConfig.registry` (2 packages)
- ✅ Updated `files` arrays (2 packages)
- ✅ Added missing scripts (2 packages)

### File Additions

- ✅ Created LICENSE files (2 packages)
- ✅ Created README.md files (7 packages)
- ✅ Created validation script

---

## Installation Examples

### Main Package (React)

```bash
# Most users will install:
npm install @ainative/ai-kit

# This includes React hooks and components
```

### Core Package

```bash
# Framework-agnostic core:
npm install @ainative/ai-kit-core

# For non-React projects or custom integrations
```

### Framework Adapters

```bash
# Svelte
npm install @ainative/ai-kit-svelte

# Vue
npm install @ainative/ai-kit-vue

# Next.js
npm install @ainative/ai-kit-nextjs
```

### Optional Features

```bash
# CLI tool
npm install -g @ainative/ai-kit-cli

# Agent tools
npm install @ainative/ai-kit-tools

# Testing utilities
npm install -D @ainative/ai-kit-testing

# AINative integrations
npm install @ainative/ai-kit-auth
npm install @ainative/ai-kit-rlhf
npm install @ainative/ai-kit-zerodb

# Safety features
npm install @ainative/ai-kit-safety

# Observability
npm install @ainative/ai-kit-observability
```

---

## Validation

### Run Validation Script

```bash
node scripts/validate-packages.js
```

### Expected Output (Success)

```
✓ All packages passed validation!
Total packages: 14
Valid packages: 14
Invalid packages: 0
Errors: 0
Warnings: 0
```

---

## Version Bumping

All packages must maintain version consistency:

### Current Version
```json
{
  "version": "0.1.0-alpha.0"
}
```

### Version Progression
- Alpha: `0.1.0-alpha.0` → `0.1.0-alpha.1` → `0.1.0-alpha.2`
- Beta: `0.1.0-beta.0` → `0.1.0-beta.1`
- RC: `0.1.0-rc.0` → `0.1.0-rc.1`
- Stable: `0.1.0`

### Bump Script (Future)

```bash
# Bump all packages to alpha.1
pnpm -r exec -- npm version 0.1.0-alpha.1 --no-git-tag-version

# Validate
node scripts/validate-packages.js
```

---

## Publishing Checklist

Before publishing to NPM:

1. ✅ Run validation: `node scripts/validate-packages.js`
2. ✅ Build all packages: `pnpm -r build`
3. ✅ Run tests: `pnpm -r test`
4. ✅ Verify versions are consistent
5. ✅ Update changelogs
6. ✅ Commit and tag release
7. ✅ Publish to NPM: `pnpm -r publish`

---

## Keywords by Package Category

### Framework Packages
- React: `["ai", "llm", "react", "hooks", "components", "streaming", "ainative"]`
- Svelte: `["ai", "llm", "svelte", "stores", "actions", "streaming", "ainative"]`
- Vue: `["ai", "llm", "vue", "vue3", "composables", "streaming", "ainative"]`
- Next.js: `["ai", "llm", "nextjs", "next", "react", "server-components", "ainative"]`

### Core & Tools
- Core: `["ai", "llm", "streaming", "agents", "state-management", "framework-agnostic", "openai", "anthropic", "ainative"]`
- Tools: `["ai", "llm", "tools", "agents", "web-search", "calculator", "ainative"]`
- CLI: `["ai", "cli", "scaffold", "generator", "ai-kit", "template", "ainative"]`

### AINative Integrations
- Auth: `["ai", "auth", "authentication", "ainative"]`
- RLHF: `["ai", "rlhf", "feedback", "machine-learning", "ainative"]`
- ZeroDB: `["ai", "database", "vector", "zerodb", "memory", "ainative"]`

### Developer Tools
- Testing: `["ai", "testing", "test-utils", "fixtures", "ainative"]`
- Observability: `["ai", "observability", "monitoring", "usage-tracking", "cost-tracking", "ainative"]`
- Safety: `["ai", "safety", "security", "prompt-injection", "pii", "content-moderation", "ainative"]`

### Design
- Design System: `["ai", "design-system", "mcp", "ainative"]`

---

## Quick Reference: Package Purposes

| Package | One-Line Purpose |
|---------|------------------|
| **@ainative/ai-kit** | React integration for AI applications |
| **@ainative/ai-kit-core** | Framework-agnostic LLM primitives |
| **@ainative/ai-kit-svelte** | Svelte integration for AI applications |
| **@ainative/ai-kit-vue** | Vue 3 integration for AI applications |
| **@ainative/ai-kit-nextjs** | Next.js utilities for AI applications |
| **@ainative/ai-kit-cli** | CLI for scaffolding AI projects |
| **@ainative/ai-kit-tools** | Built-in tools for AI agents |
| **@ainative/ai-kit-auth** | AINative authentication |
| **@ainative/ai-kit-rlhf** | AINative RLHF integration |
| **@ainative/ai-kit-zerodb** | AINative vector database |
| **@ainative/ai-kit-design-system** | Design System MCP integration |
| **@ainative/ai-kit-testing** | Testing utilities for AI apps |
| **@ainative/ai-kit-observability** | Monitoring and cost tracking |
| **@ainative/ai-kit-safety** | Safety and security features |

---

## Status

**All packages standardized**: ✅ **14/14**

**Validation status**: ✅ **PASSING**

**Ready for publishing**: ✅ **YES**

Last updated: November 20, 2025
