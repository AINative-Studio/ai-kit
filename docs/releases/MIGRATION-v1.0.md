# Migration Guide: 0.x to 1.0.0

This guide helps you migrate from AI Kit 0.x versions to v1.0.0.

---

## Overview

AI Kit v1.0.0 is the first production-ready release. While we've maintained backward compatibility where possible, there are some changes you should be aware of.

**Migration Difficulty:** Easy
**Estimated Time:** 15-30 minutes for most projects

---

## Breaking Changes

### None for Core API

Good news! There are no breaking changes to the core API in v1.0.0. All 0.x APIs remain backward compatible.

However, there are some package renames and new recommended practices.

---

## Package Renames

Some packages have been renamed for better clarity:

### React Package

**Old (0.x):**
```json
{
  "dependencies": {
    "@ainative/ai-kit-react": "^0.1.0"
  }
}
```

**New (1.0.0):**
```json
{
  "dependencies": {
    "@ainative/ai-kit": "^1.0.0"
  }
}
```

**Migration:**
```typescript
// Old import
import { useAIStream } from '@ainative/ai-kit-react'

// New import
import { useAIStream } from '@ainative/ai-kit'
```

**Action Required:** Update package.json and imports

### Core Package (No Change)

The core package name remains the same:
```json
{
  "dependencies": {
    "@ainative/ai-kit-core": "^1.0.0"
  }
}
```

No action required for core package imports.

---

## New Features You Should Know About

### 1. Multi-Agent Swarms

New in v1.0.0! Coordinate multiple AI agents:

```typescript
import { AgentSwarm } from '@ainative/ai-kit-core'

const swarm = new AgentSwarm({
  supervisor: supervisorAgent,
  specialists: [
    { agent: researchAgent, specialization: 'Research', keywords: ['search'] },
    { agent: writerAgent, specialization: 'Writing', keywords: ['write'] }
  ],
  parallelExecution: true
})

const result = await swarm.execute("Research and write a report")
```

**Recommendation:** Consider using swarms for complex multi-step tasks.

### 2. Auto-RLHF Instrumentation

Capture every interaction for model improvement:

```typescript
import { RLHFLogger } from '@ainative/ai-kit-core'

const logger = new RLHFLogger({
  storage: new InMemoryStorage(),
  captureInputs: true,
  captureOutputs: true
})

const agent = createAgent({
  rlhfLogger: logger,
  // ... other config
})
```

**Recommendation:** Enable RLHF logging in production to improve your AI over time.

### 3. Enhanced Security Features

New security guardrails available:

```typescript
import {
  PromptInjectionDetector,
  ContentModerator,
  PIIDetector
} from '@ainative/ai-kit-safety'

// Detect prompt injection attacks
const injectionDetector = new PromptInjectionDetector({
  sensitivityLevel: 'HIGH'
})

// Moderate content
const moderator = new ContentModerator({
  enabledCategories: ['PROFANITY', 'HATE_SPEECH', 'VIOLENCE']
})

// Detect and redact PII
const piiDetector = new PIIDetector({ redact: true })
```

**Recommendation:** Enable security features for production applications handling user input.

### 4. Video Processing

New video package for screen recording:

```typescript
import { useScreenRecording } from '@ainative/ai-kit'

function RecordingComponent() {
  const { isRecording, startRecording, stopRecording, recordingBlob } = useScreenRecording()

  // Use recording features
}
```

**Recommendation:** Install `@ainative/ai-kit-video` if you need video capabilities.

---

## Dependency Updates

### Required Updates

Update to v1.0.0 versions:

```bash
npm install @ainative/ai-kit-core@1.0.0 @ainative/ai-kit@1.0.0
```

or with pnpm:

```bash
pnpm update @ainative/ai-kit-core@1.0.0 @ainative/ai-kit@1.0.0
```

### Optional New Packages

Install if needed:

```bash
# Video processing
npm install @ainative/ai-kit-video@1.0.0

# Safety guardrails (now separate package)
npm install @ainative/ai-kit-safety@1.0.0

# Built-in tools
npm install @ainative/ai-kit-tools@1.0.0

# Next.js integration
npm install @ainative/ai-kit-nextjs@1.0.0
```

### Peer Dependencies

Ensure you have compatible versions:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "next": "^13.0.0 || ^14.0.0 || ^15.0.0 || ^16.0.0"
  }
}
```

---

## Configuration Changes

### No Breaking Configuration Changes

All 0.x configurations continue to work in v1.0.0.

### New Recommended Settings

Consider adding these for production:

```typescript
import { createAgent } from '@ainative/ai-kit-core'

const agent = createAgent({
  // Existing config
  name: 'My Agent',
  systemPrompt: '...',

  // New recommended settings
  rlhfLogger: logger,           // Enable RLHF
  maxRetries: 3,                // Automatic retries
  timeout: 30000,               // Request timeout

  // Security (new in v1.0)
  security: {
    enablePromptInjectionDetection: true,
    enablePIIDetection: true,
    enableContentModeration: true
  }
})
```

---

## API Changes (Non-Breaking)

### Enhanced Type Safety

TypeScript types are now more strict. You may see new type errors that help catch bugs:

```typescript
// Old (0.x) - any type accepted
const result = await agent.execute(input)

// New (1.0.0) - strict typing
const result = await agent.execute(input as string) // Must be string
```

**Action:** Fix any TypeScript errors revealed by stricter types.

### New Error Types

More specific error types for better error handling:

```typescript
import {
  AgentExecutionError,
  ToolExecutionError,
  ValidationError
} from '@ainative/ai-kit-core'

try {
  await agent.execute(input)
} catch (error) {
  if (error instanceof AgentExecutionError) {
    // Handle agent errors
  } else if (error instanceof ToolExecutionError) {
    // Handle tool errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  }
}
```

**Recommendation:** Update error handling to use specific error types.

---

## Testing Changes

### Test Environment Updates

If you're testing React components, update your vitest config:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',  // Required for React testing
    setupFiles: ['./vitest.setup.ts']
  }
})
```

### New Testing Utilities

Use the new testing package for easier testing:

```typescript
import { createMockAgent, createMockLLM } from '@ainative/ai-kit-testing'

const mockAgent = createMockAgent({
  responses: ['Test response 1', 'Test response 2']
})

const mockLLM = createMockLLM({
  streaming: true,
  latency: 100
})
```

---

## Performance Improvements

### What's Faster

v1.0.0 includes significant performance improvements:

- Streaming first token: <10ms (5x faster)
- State operations: <10ms (10x faster)
- Memory usage: <1MB (50x better)

### No Action Required

These improvements are automatic. Your application will be faster without any changes.

### Optimization Opportunities

Consider these new optimization options:

```typescript
import { AIStream } from '@ainative/ai-kit-core'

const stream = new AIStream({
  // Existing config
  endpoint: '...',
  model: '...',

  // New optimization options
  maxConcurrentRequests: 10,    // Parallel requests
  cacheResponses: true,          // Response caching
  compressionEnabled: true       // Compression
})
```

---

## Security Updates

### Critical: Update Dependencies

v1.0.0 fixes 15 vulnerabilities (3 critical, 8 high). Update immediately:

```bash
npm install @ainative/ai-kit-core@1.0.0
```

### New Security Features

Enable recommended security features:

```typescript
import {
  PromptInjectionDetector,
  PIIDetector
} from '@ainative/ai-kit-safety'

// 1. Detect prompt injection
const injectionDetector = new PromptInjectionDetector({
  sensitivityLevel: 'HIGH',
  detectEncoding: true
})

// 2. Detect PII
const piiDetector = new PIIDetector({ redact: true })

// Use before sending to LLM
const userInput = "..."
const injectionResult = injectionDetector.detect(userInput)
if (injectionResult.isInjection) {
  throw new Error('Potential attack detected')
}

const piiResult = await piiDetector.detectAndRedact(userInput)
// Use piiResult.redactedText instead of userInput
```

---

## Step-by-Step Migration

### For Basic Projects (15 minutes)

1. **Update package.json:**
```bash
npm install @ainative/ai-kit-core@1.0.0 @ainative/ai-kit@1.0.0
```

2. **Update imports (if using React):**
```typescript
// Change this:
import { useAIStream } from '@ainative/ai-kit-react'

// To this:
import { useAIStream } from '@ainative/ai-kit'
```

3. **Run tests:**
```bash
npm test
```

4. **Done!** Your application should work without other changes.

### For Production Projects (30 minutes)

1. **Update dependencies** (as above)

2. **Enable security features:**
```typescript
import { PromptInjectionDetector, PIIDetector } from '@ainative/ai-kit-safety'

const detector = new PromptInjectionDetector({ sensitivityLevel: 'HIGH' })
const piiDetector = new PIIDetector({ redact: true })
```

3. **Enable RLHF logging:**
```typescript
import { RLHFLogger } from '@ainative/ai-kit-core'

const logger = new RLHFLogger({
  storage: new InMemoryStorage() // or your storage
})
```

4. **Update error handling:**
```typescript
import { AgentExecutionError } from '@ainative/ai-kit-core'

try {
  await agent.execute(input)
} catch (error) {
  if (error instanceof AgentExecutionError) {
    // Handle appropriately
  }
}
```

5. **Run full test suite:**
```bash
npm test
npm run type-check
```

6. **Review security audit:**
Read `docs/security/security-audit-2026-02-07.md` for recommendations.

---

## Troubleshooting

### Common Issues

#### Issue 1: Module Not Found

**Error:**
```
Cannot find module '@ainative/ai-kit-react'
```

**Solution:**
Update import to use `@ainative/ai-kit`:
```typescript
import { useAIStream } from '@ainative/ai-kit'
```

#### Issue 2: Type Errors

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Solution:**
Add type guards or assertions:
```typescript
const input: string = userInput ?? ''
// or
const input = userInput as string
```

#### Issue 3: React Test Errors

**Error:**
```
ReferenceError: document is not defined
```

**Solution:**
Update vitest.config.ts:
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom'
  }
})
```

#### Issue 4: Peer Dependency Warnings

**Warning:**
```
npm WARN peer dep missing react@^18.0.0
```

**Solution:**
Install required peer dependencies:
```bash
npm install react@^18.0.0
```

---

## Getting Help

### Resources

- **Migration Issues:** https://github.com/AINative-Studio/ai-kit/issues
- **Documentation:** `docs/api/` and `docs/guides/`
- **Examples:** `examples/` directory
- **Community:** GitHub Discussions

### Support Channels

- GitHub Issues (for bugs)
- GitHub Discussions (for questions)
- Discord: TBD
- Email: support@ainative.studio (enterprise)

---

## Rollback Plan

If you encounter issues, you can rollback to 0.x:

```bash
npm install @ainative/ai-kit-core@0.1.4 @ainative/ai-kit-react@0.1.0
```

Then revert your import changes.

**Note:** We recommend staying on v1.0.0 for security fixes.

---

## What's Next

After migrating to v1.0.0:

1. **Explore new features:** Try multi-agent swarms and RLHF
2. **Enable security:** Add prompt injection and PII detection
3. **Optimize:** Use new performance features
4. **Plan for v1.1:** Check roadmap for upcoming features

---

## Feedback

We want to hear about your migration experience!

- **Smooth migration?** Let us know on GitHub Discussions
- **Hit a snag?** Open an issue with "migration" label
- **Suggestions?** We're planning v1.1 and want your input

---

**Migration guide version:** 1.0.0
**Last updated:** February 7, 2026
**Questions?** support@ainative.studio
