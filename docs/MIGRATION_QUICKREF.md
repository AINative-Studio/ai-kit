# Migration Quick Reference Card

Quick lookup guide for migrating from AI Kit v0.x to v1.0.

## At a Glance

| Aspect | Difficulty | Time Required |
|--------|-----------|---------------|
| **Package Updates** | Easy | 5 minutes |
| **Import Changes** | Easy | 10 minutes |
| **Testing** | Moderate | 15-30 minutes |
| **New Features** | Optional | Variable |

---

## Quick Start (5 Minutes)

### 1. Update Package.json

```bash
npm uninstall @ainative/ai-kit-react
npm install @ainative/ai-kit@^1.0.0 @ainative/ai-kit-core@^1.0.0
```

### 2. Find & Replace Imports

```bash
# Replace in all files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/@ainative\/ai-kit-react/@ainative\/ai-kit/g' {} +
```

### 3. Test

```bash
npm test && npm run build
```

Done!

---

## Package Name Changes

| Old (0.x) | New (1.0) | Action |
|-----------|-----------|--------|
| `@ainative/ai-kit-react` | `@ainative/ai-kit` | **REQUIRED** |
| `@aikit/cli` | `@ainative/ai-kit-cli` | Reinstall globally |
| `@ainative/ai-kit-core` | `@ainative/ai-kit-core` | No change |

---

## Import Cheat Sheet

### React Hooks

```typescript
// OLD (0.x)
import { useAIStream } from '@ainative/ai-kit-react'

// NEW (1.0)
import { useAIStream } from '@ainative/ai-kit'
```

### Core (No Change)

```typescript
// SAME in both versions
import { createAgent } from '@ainative/ai-kit-core'
```

### Safety (New Package)

```typescript
// OLD (0.x beta)
import { PromptInjectionDetector } from '@ainative/ai-kit-core/safety'

// NEW (1.0)
npm install @ainative/ai-kit-safety
import { PromptInjectionDetector } from '@ainative/ai-kit-safety'
```

### Tools (New Package)

```typescript
// OLD (0.x)
import { calculatorTool } from '@ainative/ai-kit-core/tools'

// NEW (1.0)
npm install @ainative/ai-kit-tools
import { calculatorTool } from '@ainative/ai-kit-tools'
```

---

## New Optional Packages

Install only if needed:

```bash
# Security features (recommended for production)
npm install @ainative/ai-kit-safety

# Built-in tools
npm install @ainative/ai-kit-tools

# Video recording
npm install @ainative/ai-kit-video

# Next.js helpers
npm install @ainative/ai-kit-nextjs
```

---

## Common Issues & Quick Fixes

### Issue: Module Not Found

**Error:** `Cannot find module '@ainative/ai-kit-react'`

**Fix:**
```bash
npm install @ainative/ai-kit@^1.0.0
# Update imports from @ainative/ai-kit-react to @ainative/ai-kit
```

### Issue: Type Errors

**Error:** `Type 'string | undefined' is not assignable to type 'string'`

**Fix:**
```typescript
// Add null coalescing
const message = userInput ?? ''
```

### Issue: React Test Errors

**Error:** `ReferenceError: document is not defined`

**Fix:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: { environment: 'jsdom' }
})
```

---

## Rollback Command

If you need to rollback:

```bash
npm install @ainative/ai-kit-react@^0.1.0-alpha.4 @ainative/ai-kit-core@^0.1.4
# Revert import changes
```

---

## Performance Gains

You get these automatically (no code changes):

- First token: **5x faster** (<10ms)
- State operations: **10x faster** (<10ms)
- Memory usage: **50x better** (<1MB)
- Bundle size: **40-60% smaller** (with tree-shaking)

---

## New Features Worth Adopting

### 1. Agent Swarms (2 minutes)

```typescript
import { AgentSwarm } from '@ainative/ai-kit-core'

const swarm = new AgentSwarm({
  supervisor: supervisorAgent,
  specialists: [
    { agent: researchAgent, specialization: 'Research', keywords: ['search'] },
    { agent: writerAgent, specialization: 'Writing', keywords: ['write'] }
  ]
})

await swarm.execute("Research and write a report")
```

### 2. RLHF Logging (3 minutes)

```typescript
import { RLHFLogger } from '@ainative/ai-kit-core'

const logger = new RLHFLogger({ storage: new InMemoryStorage() })
const agent = createAgent({ rlhfLogger: logger })
// All interactions automatically logged!
```

### 3. Security (5 minutes)

```typescript
import { PromptInjectionDetector, PIIDetector } from '@ainative/ai-kit-safety'

const detector = new PromptInjectionDetector({ sensitivityLevel: 'HIGH' })
const piiDetector = new PIIDetector({ redact: true })

async function secureInput(input) {
  const injection = detector.detect(input)
  if (injection.isInjection) throw new Error('Attack detected')

  const { redactedText } = await piiDetector.detectAndRedact(input)
  return redactedText
}
```

---

## CLI Migration

```bash
# Uninstall old
npm uninstall -g @aikit/cli

# Install new
npm install -g @ainative/ai-kit-cli

# Command stays the same
aikit create my-app
```

---

## Version Compatibility

| Package | v0.x | v1.0 | Compatible? |
|---------|------|------|-------------|
| React 18 | ✅ | ✅ | Yes |
| React 19 | ❌ | ✅ | v1.0 only |
| Next.js 13 | ✅ | ✅ | Yes |
| Next.js 14 | ✅ | ✅ | Yes |
| Next.js 15 | ❌ | ✅ | v1.0 only |
| Next.js 16 | ❌ | ✅ | v1.0 only |
| Node.js 18 | ✅ | ✅ | Yes |
| Node.js 20+ | ✅ | ✅ | Recommended |

---

## Support Timeline

| Version | Support Until | Status |
|---------|--------------|--------|
| v0.x | Q2 2026 | Deprecated |
| v1.0 | Q4 2027 | **Current** |
| v1.1 | Q1 2026 | Planned |
| v2.0 | Q4 2026 | Planned |

---

## Need Help?

- **Full Guide:** `docs/MIGRATION.md`
- **Issues:** https://github.com/AINative-Studio/ai-kit/issues
- **Support:** support@ainative.studio

---

**Quick Ref Version:** 1.0.0
**Last Updated:** February 8, 2026
