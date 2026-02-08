# Migration Guide: Upgrading to AI Kit v1.0

Welcome to AI Kit v1.0! This guide will help you upgrade from pre-release versions (0.x) to the production-ready v1.0 release.

**Migration Difficulty:** Easy to Moderate
**Estimated Time:** 15-45 minutes (depending on project complexity)
**Breaking Changes:** Minimal (package renames only)

---

## Table of Contents

1. [What's New in v1.0](#whats-new-in-v10)
2. [Breaking Changes](#breaking-changes)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Package Changes](#package-changes)
5. [Import Updates](#import-updates)
6. [New Features to Adopt](#new-features-to-adopt)
7. [Deprecation Timeline](#deprecation-timeline)
8. [Common Migration Issues](#common-migration-issues)
9. [Testing Your Migration](#testing-your-migration)
10. [Getting Help](#getting-help)

---

## What's New in v1.0

### Major Features

AI Kit v1.0 introduces production-grade features that were missing in 0.x:

#### 1. Multi-Agent Swarms
Coordinate multiple specialized AI agents with intelligent task routing:

```typescript
import { AgentSwarm } from '@ainative/ai-kit-core'

const swarm = new AgentSwarm({
  supervisor: supervisorAgent,
  specialists: [
    { agent: researchAgent, specialization: 'Research', keywords: ['search', 'find'] },
    { agent: writerAgent, specialization: 'Writing', keywords: ['write', 'create'] }
  ],
  parallelExecution: true
})

const result = await swarm.execute("Research AI safety and write a report")
```

#### 2. Automatic RLHF Instrumentation
Capture every interaction for model improvement without code changes:

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

#### 3. Enterprise Security Features
Production-ready security guardrails:

```typescript
import { PromptInjectionDetector, PIIDetector } from '@ainative/ai-kit-safety'

// Detect prompt injection attacks (7 attack patterns)
const detector = new PromptInjectionDetector({ sensitivityLevel: 'HIGH' })

// Detect and redact PII
const piiDetector = new PIIDetector({ redact: true })
```

#### 4. Video Recording Capabilities
Screen and camera recording with automatic cleanup:

```typescript
import { useScreenRecording } from '@ainative/ai-kit'

function RecordingComponent() {
  const { isRecording, startRecording, stopRecording, recordingBlob } = useScreenRecording()
  // Automatic MediaStream cleanup and Blob URL management
}
```

#### 5. Streaming Transports
Production-ready SSE and WebSocket transports:

```typescript
import { SSETransport, WebSocketTransport } from '@ainative/ai-kit-core'

// SSE with automatic reconnection
const sse = new SSETransport({
  endpoint: '/api/stream',
  autoReconnect: true,
  maxReconnectAttempts: 5
})

// WebSocket with heartbeat
const ws = new WebSocketTransport({
  endpoint: 'wss://api.example.com/ws',
  heartbeatInterval: 30000
})
```

### Performance Improvements

v1.0 includes dramatic performance improvements:

| Metric | v0.x | v1.0 | Improvement |
|--------|------|------|-------------|
| First token latency | ~50ms | <10ms | 5x faster |
| State operations | ~100ms | <10ms | 10x faster |
| Memory footprint | ~50MB | <1MB | 50x better |
| Throughput | - | >200k tokens/s | NEW |

### Security Improvements

- Fixed 15 vulnerabilities (3 critical, 8 high, 4 moderate)
- Zero critical or high-severity vulnerabilities remaining
- 561 security tests (99.1% passing)
- OWASP Top 10: 90% compliant

---

## Breaking Changes

### 1. Package Renames

The main breaking change is package naming for better clarity and consistency:

| Old Package (0.x) | New Package (1.0) | Action Required |
|-------------------|-------------------|-----------------|
| `@ainative/ai-kit-react` | `@ainative/ai-kit` | Update package.json and imports |
| `@aikit/cli` | `@ainative/ai-kit-cli` | Reinstall CLI globally |
| `@ainative/ai-kit-framework` | `@ainative/ai-kit-core` | Update imports (if used directly) |

**Core package unchanged:**
- `@ainative/ai-kit-core` remains the same

### 2. Package Separation

Optional features are now separate packages for better tree-shaking:

| Feature | Old (0.x) | New (1.0) |
|---------|-----------|-----------|
| Safety features | Built into core | `@ainative/ai-kit-safety` |
| Built-in tools | Built into core | `@ainative/ai-kit-tools` |
| Video recording | Not available | `@ainative/ai-kit-video` |
| Observability | Built into core | `@ainative/ai-kit-observability` |

**Why this change?**
- Smaller bundle sizes (install only what you need)
- Faster builds and deployments
- Better tree-shaking support
- Reduced production bundle size by 40-60%

### 3. No API Breaking Changes

Good news: All v0.x APIs are backward compatible in v1.0. Your existing code will continue to work.

---

## Step-by-Step Migration

### Quick Migration (Basic Projects - 15 minutes)

For projects using only basic AI Kit features:

#### Step 1: Update Dependencies

```bash
# Using npm
npm uninstall @ainative/ai-kit-react
npm install @ainative/ai-kit-core@^1.0.0 @ainative/ai-kit@^1.0.0

# Using pnpm
pnpm remove @ainative/ai-kit-react
pnpm add @ainative/ai-kit-core@^1.0.0 @ainative/ai-kit@^1.0.0

# Using yarn
yarn remove @ainative/ai-kit-react
yarn add @ainative/ai-kit-core@^1.0.0 @ainative/ai-kit@^1.0.0
```

#### Step 2: Update package.json

**Before (0.x):**
```json
{
  "dependencies": {
    "@ainative/ai-kit-react": "^0.1.0-alpha.4",
    "@ainative/ai-kit-core": "^0.1.4"
  }
}
```

**After (1.0):**
```json
{
  "dependencies": {
    "@ainative/ai-kit": "^1.0.0",
    "@ainative/ai-kit-core": "^1.0.0"
  }
}
```

#### Step 3: Update Imports

Find and replace imports in your codebase:

**Before (0.x):**
```typescript
import { useAIStream, useChatMessages } from '@ainative/ai-kit-react'
```

**After (1.0):**
```typescript
import { useAIStream, useChatMessages } from '@ainative/ai-kit'
```

**Using Find & Replace:**
```bash
# macOS/Linux
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -exec sed -i '' 's/@ainative\/ai-kit-react/@ainative\/ai-kit/g' {} +

# Windows (PowerShell)
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  ForEach-Object { (Get-Content $_.FullName) -replace '@ainative/ai-kit-react', '@ainative/ai-kit' |
  Set-Content $_.FullName }
```

#### Step 4: Run Tests

```bash
npm test
```

#### Step 5: Done!

Your application should now be running on v1.0.

---

### Complete Migration (Production Projects - 45 minutes)

For production applications that want to take advantage of new v1.0 features:

#### Step 1: Update All Dependencies

```bash
npm install \
  @ainative/ai-kit-core@^1.0.0 \
  @ainative/ai-kit@^1.0.0 \
  @ainative/ai-kit-safety@^1.0.0 \
  @ainative/ai-kit-tools@^1.0.0 \
  @ainative/ai-kit-nextjs@^1.0.0
```

#### Step 2: Update Imports

**Core package (unchanged):**
```typescript
import { createAgent, AgentExecutor } from '@ainative/ai-kit-core'
```

**React hooks:**
```typescript
// Before
import { useAIStream } from '@ainative/ai-kit-react'

// After
import { useAIStream } from '@ainative/ai-kit'
```

**Safety features (now separate package):**
```typescript
// Before (if you were using beta features)
import { PromptInjectionDetector } from '@ainative/ai-kit-core/safety'

// After
import { PromptInjectionDetector } from '@ainative/ai-kit-safety'
```

**Built-in tools (now separate package):**
```typescript
// Before
import { webSearchTool } from '@ainative/ai-kit-core/tools'

// After
import { webSearchTool } from '@ainative/ai-kit-tools'
```

#### Step 3: Enable Security Features

Add production security guardrails:

```typescript
import { PromptInjectionDetector, PIIDetector } from '@ainative/ai-kit-safety'

// 1. Create detectors
const injectionDetector = new PromptInjectionDetector({
  sensitivityLevel: 'HIGH',
  detectEncoding: true,
  detectMultiLanguage: true
})

const piiDetector = new PIIDetector({
  redact: true,
  types: ['email', 'phone', 'ssn', 'creditCard']
})

// 2. Use in your API routes or components
async function handleUserInput(input: string) {
  // Check for prompt injection
  const injectionResult = injectionDetector.detect(input)
  if (injectionResult.isInjection) {
    throw new Error('Potential prompt injection detected')
  }

  // Detect and redact PII
  const piiResult = await piiDetector.detectAndRedact(input)

  // Use piiResult.redactedText instead of original input
  return processInput(piiResult.redactedText)
}
```

#### Step 4: Enable RLHF Logging

Capture interactions for model improvement:

```typescript
import { RLHFLogger, createAgent } from '@ainative/ai-kit-core'

// 1. Create logger with your storage backend
const logger = new RLHFLogger({
  storage: new InMemoryStorage(), // or your preferred storage
  captureInputs: true,
  captureOutputs: true,
  captureMetadata: true,
  captureErrors: true
})

// 2. Add to agent config
const agent = createAgent({
  name: 'My Agent',
  systemPrompt: '...',
  rlhfLogger: logger, // ✅ All interactions now logged automatically
  // ... other config
})

// 3. Export logs for analysis
const logs = await logger.export({
  startDate: new Date('2024-01-01'),
  endDate: new Date()
})
```

#### Step 5: Update Error Handling

Use new specific error types:

```typescript
import {
  AgentExecutionError,
  ToolExecutionError,
  ValidationError,
  RateLimitError,
  StreamingError
} from '@ainative/ai-kit-core'

try {
  const result = await agent.execute(input)
} catch (error) {
  if (error instanceof AgentExecutionError) {
    // Handle agent-specific errors
    console.error('Agent failed:', error.message)
    logError(error.context)
  } else if (error instanceof ToolExecutionError) {
    // Handle tool failures
    console.error('Tool failed:', error.toolName, error.message)
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.error('Invalid input:', error.validationErrors)
  } else if (error instanceof RateLimitError) {
    // Handle rate limiting
    await delay(error.retryAfter)
    return retry()
  } else if (error instanceof StreamingError) {
    // Handle streaming errors
    console.error('Streaming failed:', error.message)
  }
}
```

#### Step 6: Adopt Performance Optimizations

Use new performance features:

```typescript
import { AIStream } from '@ainative/ai-kit-core'

const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'claude-3-sonnet',

  // NEW: Performance options
  maxConcurrentRequests: 10,  // Parallel requests
  cacheResponses: true,        // Response caching
  compressionEnabled: true,    // Compression

  // NEW: Connection pooling
  connectionPool: {
    maxConnections: 20,
    idleTimeout: 30000
  }
})
```

#### Step 7: Update TypeScript Configuration

Ensure strict typing for better safety:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "types": ["@ainative/ai-kit-core", "@ainative/ai-kit"]
  }
}
```

#### Step 8: Run Full Test Suite

```bash
# Run all tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run security audit
npm audit
```

#### Step 9: Review Production Readiness

Use the production readiness checklist:

- [ ] Security features enabled (prompt injection, PII detection)
- [ ] RLHF logging configured
- [ ] Error handling updated to use specific error types
- [ ] Performance optimizations enabled
- [ ] All tests passing
- [ ] TypeScript strict mode enabled
- [ ] Dependencies updated to v1.0
- [ ] Documentation reviewed

---

## Package Changes

### Core Packages

#### @ainative/ai-kit-core

**Status:** ✅ No breaking changes
**Action:** Update to v1.0.0

```bash
npm install @ainative/ai-kit-core@^1.0.0
```

**What's New:**
- Multi-agent swarms
- RLHF instrumentation
- Streaming transports (SSE, WebSocket)
- Enhanced error types
- Performance improvements

**Migration:** None required, fully backward compatible

---

#### @ainative/ai-kit (formerly @ainative/ai-kit-react)

**Status:** ⚠️ Package renamed
**Action:** Replace `@ainative/ai-kit-react` with `@ainative/ai-kit`

```bash
# Uninstall old
npm uninstall @ainative/ai-kit-react

# Install new
npm install @ainative/ai-kit@^1.0.0
```

**Import Changes:**

| Old Import | New Import |
|------------|------------|
| `@ainative/ai-kit-react` | `@ainative/ai-kit` |
| `@ainative/ai-kit-react/hooks` | `@ainative/ai-kit` |
| `@ainative/ai-kit-react/components` | `@ainative/ai-kit` |

**What's New:**
- Video recording hooks
- Enhanced React 19 support
- Better TypeScript types
- Performance optimizations

**API Compatibility:** ✅ 100% backward compatible

---

### Optional Packages

#### @ainative/ai-kit-safety

**Status:** 🆕 New package
**Action:** Install if you need security features

```bash
npm install @ainative/ai-kit-safety@^1.0.0
```

**When to Install:**
- Production applications
- Handling user input
- Sensitive data processing
- Compliance requirements (GDPR, HIPAA)

**Features:**
- Prompt injection detection (7 attack patterns)
- PII detection and redaction (6 PII types)
- Content moderation
- Jailbreak detection

**Migration from 0.x:**

```typescript
// Before (0.x - if using beta features)
import { PromptInjectionDetector } from '@ainative/ai-kit-core/safety'

// After (1.0)
import { PromptInjectionDetector } from '@ainative/ai-kit-safety'
```

---

#### @ainative/ai-kit-tools

**Status:** 🆕 New package
**Action:** Install if you need built-in tools

```bash
npm install @ainative/ai-kit-tools@^1.0.0
```

**When to Install:**
- Using built-in tools (calculator, web search, etc.)
- Need code interpreter
- Custom tool development

**Features:**
- Web search tool
- Calculator tool
- Code interpreter (sandboxed)
- File system tools
- API integration tools

**Migration from 0.x:**

```typescript
// Before (0.x)
import { calculatorTool } from '@ainative/ai-kit-core/tools'

// After (1.0)
import { calculatorTool } from '@ainative/ai-kit-tools'
```

---

#### @ainative/ai-kit-video

**Status:** 🆕 New package
**Action:** Install if you need video features

```bash
npm install @ainative/ai-kit-video@^1.0.0
```

**When to Install:**
- Screen recording features
- Camera recording
- Media device management
- Video processing

**Features:**
- Screen recording with automatic cleanup
- Camera recording with device selection
- Automatic Blob URL revocation
- Memory leak prevention
- Observability instrumentation

**Usage:**

```typescript
import { useScreenRecording, useMediaDevices } from '@ainative/ai-kit-video'

function RecordingApp() {
  const { isRecording, startRecording, stopRecording } = useScreenRecording()
  const { devices } = useMediaDevices({ video: true })

  return (
    <div>
      <select>
        {devices.map(d => <option key={d.deviceId}>{d.label}</option>)}
      </select>
      <button onClick={startRecording}>Record</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  )
}
```

---

#### @ainative/ai-kit-nextjs

**Status:** ✅ No breaking changes
**Action:** Update to v1.0.0

```bash
npm install @ainative/ai-kit-nextjs@^1.0.0
```

**What's New:**
- Next.js 16 support
- Enhanced App Router support
- Better Edge runtime support
- Improved TypeScript types

**Migration:** None required

---

#### @ainative/ai-kit-cli

**Status:** ⚠️ Package renamed
**Action:** Reinstall CLI globally

```bash
# Uninstall old
npm uninstall -g @aikit/cli

# Install new
npm install -g @ainative/ai-kit-cli@^1.0.0
```

**Command unchanged:** The `aikit` command itself remains the same.

```bash
# Still works the same
aikit create my-app
aikit add component
```

---

## Import Updates

### Quick Reference

Use this table to update your imports:

| Old Import (0.x) | New Import (1.0) |
|------------------|------------------|
| `@ainative/ai-kit-react` | `@ainative/ai-kit` |
| `@ainative/ai-kit-core/safety` | `@ainative/ai-kit-safety` |
| `@ainative/ai-kit-core/tools` | `@ainative/ai-kit-tools` |
| `@ainative/ai-kit-framework` | `@ainative/ai-kit-core` |

### React Imports

**Before (0.x):**
```typescript
import {
  useAIStream,
  useChatMessages,
  useAgentState,
  ChatWindow,
  MessageList
} from '@ainative/ai-kit-react'
```

**After (1.0):**
```typescript
import {
  useAIStream,
  useChatMessages,
  useAgentState,
  ChatWindow,
  MessageList
} from '@ainative/ai-kit'
```

### Core Imports

**No change - still works:**
```typescript
import {
  createAgent,
  AgentExecutor,
  AgentSwarm,
  AIStream
} from '@ainative/ai-kit-core'
```

### Safety Imports

**Before (0.x beta):**
```typescript
import { PromptInjectionDetector } from '@ainative/ai-kit-core/safety'
```

**After (1.0):**
```typescript
import {
  PromptInjectionDetector,
  PIIDetector,
  ContentModerator,
  JailbreakDetector
} from '@ainative/ai-kit-safety'
```

### Tools Imports

**Before (0.x):**
```typescript
import { calculatorTool, webSearchTool } from '@ainative/ai-kit-core/tools'
```

**After (1.0):**
```typescript
import {
  calculatorTool,
  webSearchTool,
  codeInterpreterTool,
  fileSystemTool
} from '@ainative/ai-kit-tools'
```

### Video Imports

**New in 1.0:**
```typescript
import {
  useScreenRecording,
  useCameraRecording,
  useMediaDevices,
  useRecordingState
} from '@ainative/ai-kit-video'
```

---

## New Features to Adopt

### 1. Multi-Agent Swarms

**Use Case:** Complex tasks requiring multiple specialists

**Example:**
```typescript
import { AgentSwarm, createAgent } from '@ainative/ai-kit-core'

// Create specialized agents
const researchAgent = createAgent({
  name: 'Research Specialist',
  systemPrompt: 'You are an expert at finding and analyzing information.',
  llm: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' }
})

const writerAgent = createAgent({
  name: 'Content Writer',
  systemPrompt: 'You are an expert at writing clear, engaging content.',
  llm: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' }
})

// Create swarm
const swarm = new AgentSwarm({
  supervisor: supervisorAgent,
  specialists: [
    {
      agent: researchAgent,
      specialization: 'Research and Analysis',
      keywords: ['research', 'find', 'analyze', 'data'],
      priority: 1
    },
    {
      agent: writerAgent,
      specialization: 'Content Creation',
      keywords: ['write', 'create', 'draft', 'compose'],
      priority: 2
    }
  ],
  parallelExecution: true,
  maxConcurrent: 2
})

// Execute task
const result = await swarm.execute(
  "Research the latest AI trends and write a 1000-word article"
)

console.log(result.output)           // Final synthesized result
console.log(result.executionTrace)   // Full trace of agent steps
console.log(result.cost)             // Total cost across all agents
```

**Benefits:**
- Automatic task routing to specialists
- Parallel execution for faster results
- Complete execution traces
- Built-in cost tracking

---

### 2. RLHF Instrumentation

**Use Case:** Capture data for model improvement

**Example:**
```typescript
import { RLHFLogger, InMemoryStorage, createAgent } from '@ainative/ai-kit-core'

// 1. Create logger
const logger = new RLHFLogger({
  storage: new InMemoryStorage(),
  captureInputs: true,
  captureOutputs: true,
  captureMetadata: true,
  captureToolCalls: true,
  captureErrors: true
})

// 2. Create agent with logger
const agent = createAgent({
  name: 'Customer Support Agent',
  systemPrompt: 'You are a helpful customer support agent.',
  rlhfLogger: logger,
  // ... other config
})

// 3. All interactions are automatically logged
await agent.execute("How do I reset my password?")
await agent.execute("What's your refund policy?")

// 4. Export logs for analysis
const logs = await logger.export({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  format: 'jsonl'
})

// 5. Analyze logs
const summary = logger.getSummary()
console.log('Total interactions:', summary.totalInteractions)
console.log('Success rate:', summary.successRate)
console.log('Average cost:', summary.averageCost)
```

**Benefits:**
- Zero-code instrumentation
- Complete interaction capture
- Export for fine-tuning
- Built-in analytics

---

### 3. Security Guardrails

**Use Case:** Protect against attacks and data leaks

**Example:**
```typescript
import {
  PromptInjectionDetector,
  PIIDetector,
  ContentModerator
} from '@ainative/ai-kit-safety'

// 1. Create detectors
const injectionDetector = new PromptInjectionDetector({
  sensitivityLevel: 'HIGH',
  detectEncoding: true,           // Detect base64, URL encoding
  detectMultiLanguage: true,      // Detect multi-language attacks
  detectRoleSwitching: true       // Detect role-switching attempts
})

const piiDetector = new PIIDetector({
  redact: true,
  types: ['email', 'phone', 'ssn', 'creditCard', 'ipAddress', 'dob'],
  customPatterns: [
    { name: 'employee_id', pattern: /EMP\d{6}/g, replacement: '[EMP_ID]' }
  ]
})

const contentModerator = new ContentModerator({
  enabledCategories: ['PROFANITY', 'HATE_SPEECH', 'VIOLENCE', 'SEXUAL'],
  strictMode: true
})

// 2. Create security pipeline
async function secureInput(userInput: string): Promise<string> {
  // Step 1: Check for prompt injection
  const injectionResult = injectionDetector.detect(userInput)
  if (injectionResult.isInjection) {
    throw new SecurityError(
      `Prompt injection detected: ${injectionResult.matches[0].pattern}`
    )
  }

  // Step 2: Detect and redact PII
  const piiResult = await piiDetector.detectAndRedact(userInput)
  if (piiResult.detected.length > 0) {
    console.warn('PII detected and redacted:', piiResult.detected)
  }

  // Step 3: Moderate content
  const moderationResult = await contentModerator.moderate(piiResult.redactedText)
  if (moderationResult.flagged) {
    throw new SecurityError(
      `Content policy violation: ${moderationResult.categories.join(', ')}`
    )
  }

  return piiResult.redactedText
}

// 3. Use in your application
app.post('/api/chat', async (req, res) => {
  try {
    const secureInput = await secureInput(req.body.message)
    const response = await agent.execute(secureInput)
    res.json({ response })
  } catch (error) {
    if (error instanceof SecurityError) {
      res.status(400).json({ error: error.message })
    }
  }
})
```

**Benefits:**
- Protection against 7 attack patterns
- PII detection and redaction
- Content policy enforcement
- Production-ready security

---

### 4. Streaming Transports

**Use Case:** Reliable streaming with automatic reconnection

**SSE Transport Example:**
```typescript
import { SSETransport } from '@ainative/ai-kit-core'

const transport = new SSETransport({
  endpoint: 'https://api.example.com/stream',

  // Reconnection config
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  reconnectBackoff: 'exponential',

  // Headers
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

// Listen for events
transport.on('token', (token) => console.log(token))
transport.on('error', (error) => console.error(error))
transport.on('reconnecting', (attempt) => console.log(`Reconnecting... attempt ${attempt}`))
transport.on('reconnected', () => console.log('Reconnected successfully'))

// Start streaming
await transport.connect()
await transport.send({ message: 'Hello' })
```

**WebSocket Transport Example:**
```typescript
import { WebSocketTransport } from '@ainative/ai-kit-core'

const transport = new WebSocketTransport({
  endpoint: 'wss://api.example.com/ws',

  // Heartbeat config
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,

  // Reconnection
  reconnectOnError: true,
  maxReconnectAttempts: 10
})

transport.on('open', () => console.log('Connected'))
transport.on('message', (data) => console.log(data))
transport.on('heartbeat', () => console.log('Heartbeat sent'))
transport.on('close', () => console.log('Disconnected'))

await transport.connect()
```

**Benefits:**
- Automatic reconnection with exponential backoff
- Heartbeat mechanism for connection health
- State machine for reliability
- Error recovery

---

### 5. Video Recording

**Use Case:** Screen and camera recording with automatic cleanup

**Example:**
```typescript
import {
  useScreenRecording,
  useMediaDevices,
  useCameraRecording
} from '@ainative/ai-kit-video'

function VideoRecordingApp() {
  // Screen recording
  const {
    isRecording: isScreenRecording,
    startRecording: startScreenRecording,
    stopRecording: stopScreenRecording,
    recordingBlob: screenBlob,
    error: screenError
  } = useScreenRecording({
    mimeType: 'video/webm;codecs=vp9',
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000
  })

  // Camera recording
  const {
    isRecording: isCameraRecording,
    startRecording: startCameraRecording,
    stopRecording: stopCameraRecording,
    recordingBlob: cameraBlob
  } = useCameraRecording()

  // Device management
  const {
    devices,
    selectedDevice,
    selectDevice,
    error: deviceError
  } = useMediaDevices({
    video: true,
    audio: true
  })

  return (
    <div>
      <h2>Screen Recording</h2>
      <button onClick={startScreenRecording} disabled={isScreenRecording}>
        Start Screen Recording
      </button>
      <button onClick={stopScreenRecording} disabled={!isScreenRecording}>
        Stop Screen Recording
      </button>
      {screenBlob && (
        <video src={URL.createObjectURL(screenBlob)} controls />
      )}

      <h2>Camera Recording</h2>
      <select onChange={(e) => selectDevice(e.target.value)}>
        {devices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
      <button onClick={startCameraRecording} disabled={isCameraRecording}>
        Start Camera Recording
      </button>
      <button onClick={stopCameraRecording} disabled={!isCameraRecording}>
        Stop Camera Recording
      </button>
      {cameraBlob && (
        <video src={URL.createObjectURL(cameraBlob)} controls />
      )}
    </div>
  )
}
```

**Benefits:**
- Automatic MediaStream cleanup on unmount
- Automatic Blob URL revocation
- Memory leak prevention
- Device selection and management
- Observability instrumentation

---

## Deprecation Timeline

### Currently Deprecated (v1.0)

The following packages/imports are deprecated and should be migrated:

| Deprecated | Replacement | Removal Date |
|------------|-------------|--------------|
| `@ainative/ai-kit-react` | `@ainative/ai-kit` | v2.0 (Q4 2026) |
| `@aikit/cli` | `@ainative/ai-kit-cli` | v2.0 (Q4 2026) |
| `@ainative/ai-kit-framework` | `@ainative/ai-kit-core` | v2.0 (Q4 2026) |
| `@ainative/ai-kit-core/safety` | `@ainative/ai-kit-safety` | v1.2 (Q2 2026) |
| `@ainative/ai-kit-core/tools` | `@ainative/ai-kit-tools` | v1.2 (Q2 2026) |

### Deprecation Schedule

**v1.0 (Now):**
- Deprecated packages still work with warnings
- Start migration to new packages

**v1.1 (Q1 2026):**
- Deprecated packages show deprecation warnings
- Official migration period

**v1.2 (Q2 2026):**
- Deprecated subpath imports (`/safety`, `/tools`) removed
- Must use separate packages

**v2.0 (Q4 2026):**
- All deprecated packages removed
- Breaking changes allowed
- Clean slate for v2 architecture

### Migration Timeline Recommendations

| Project Type | Recommended Migration Date |
|--------------|---------------------------|
| New projects | Immediately (use v1.0 packages) |
| Active development | Within 1 month |
| Production apps | Within 3 months |
| Legacy apps | Before v1.2 (Q2 2026) |

---

## Common Migration Issues

### Issue 1: Module Not Found

**Error:**
```
Cannot find module '@ainative/ai-kit-react'
```

**Cause:** Package was renamed to `@ainative/ai-kit`

**Solution:**
```bash
npm uninstall @ainative/ai-kit-react
npm install @ainative/ai-kit@^1.0.0
```

Update imports:
```typescript
// Change this
import { useAIStream } from '@ainative/ai-kit-react'

// To this
import { useAIStream } from '@ainative/ai-kit'
```

---

### Issue 2: TypeScript Type Errors

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Cause:** v1.0 has stricter TypeScript types

**Solution 1:** Add type guards
```typescript
// Before
const message = userInput
agent.execute(message)

// After
const message = userInput ?? ''
agent.execute(message)
```

**Solution 2:** Use type assertions (if you're sure)
```typescript
const message = userInput as string
agent.execute(message)
```

**Solution 3:** Enable strict null checks
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

---

### Issue 3: React Test Environment Errors

**Error:**
```
ReferenceError: document is not defined
```

**Cause:** React tests need jsdom environment

**Solution:**

Update `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts']
  }
})
```

Create `vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

---

### Issue 4: Peer Dependency Warnings

**Warning:**
```
npm WARN peer dep missing react@^18.0.0
```

**Cause:** Missing peer dependencies

**Solution:**
```bash
npm install react@^18.0.0 react-dom@^18.0.0
```

For Next.js projects:
```bash
npm install next@^14.0.0 react@^18.0.0 react-dom@^18.0.0
```

---

### Issue 5: Security Feature Import Errors

**Error:**
```
Cannot find module '@ainative/ai-kit-core/safety'
```

**Cause:** Safety features moved to separate package

**Solution:**
```bash
npm install @ainative/ai-kit-safety@^1.0.0
```

Update imports:
```typescript
// Before
import { PromptInjectionDetector } from '@ainative/ai-kit-core/safety'

// After
import { PromptInjectionDetector } from '@ainative/ai-kit-safety'
```

---

### Issue 6: Bundle Size Increase

**Problem:** Bundle size increased after upgrade

**Cause:** Importing too much from core packages

**Solution:** Use separate packages for tree-shaking

**Before:**
```typescript
// Imports everything including tools, safety, etc.
import { createAgent, calculatorTool, PromptInjectionDetector } from '@ainative/ai-kit-core'
```

**After (smaller bundle):**
```typescript
// Import only what you need from separate packages
import { createAgent } from '@ainative/ai-kit-core'
import { calculatorTool } from '@ainative/ai-kit-tools'
import { PromptInjectionDetector } from '@ainative/ai-kit-safety'
```

**Expected bundle size reduction:** 40-60%

---

### Issue 7: Next.js Compatibility Warnings

**Warning:**
```
Warning: Next.js 16 requires Node.js 20.9.0 or higher
```

**Solution:**

Check your Node.js version:
```bash
node --version
```

Upgrade if needed:
```bash
nvm install 20.9.0
nvm use 20.9.0
```

Update `.nvmrc`:
```
20.9.0
```

---

## Testing Your Migration

### Step 1: Unit Tests

Run your unit test suite:

```bash
npm test
```

**Expected results:**
- All tests pass
- No deprecation warnings
- No type errors

---

### Step 2: Type Checking

Run TypeScript compiler:

```bash
npm run type-check
# or
npx tsc --noEmit
```

**Expected results:**
- No type errors
- Stricter type checking may reveal previously hidden issues (this is good!)

---

### Step 3: Build Process

Test your build:

```bash
npm run build
```

**Expected results:**
- Build completes successfully
- No missing module errors
- Bundle size should be similar or smaller

---

### Step 4: Integration Tests

Run integration tests if you have them:

```bash
npm run test:integration
```

**Test scenarios:**
- AI streaming works correctly
- Agent execution completes
- Tool calling functions properly
- Error handling works as expected

---

### Step 5: Manual Testing

Test critical user flows:

**Checklist:**
- [ ] Chat/messaging works
- [ ] Streaming displays correctly
- [ ] Error messages show properly
- [ ] Loading states work
- [ ] Cost tracking functions (if enabled)
- [ ] Security features activate (if enabled)
- [ ] RLHF logging captures data (if enabled)

---

### Step 6: Performance Testing

Compare performance before and after:

```typescript
import { performance } from 'perf_hooks'

// Test streaming latency
const start = performance.now()
await stream.send('Test message')
const end = performance.now()
console.log(`First token latency: ${end - start}ms`)
// Expected: <10ms in v1.0 (vs ~50ms in v0.x)

// Test agent execution
const agentStart = performance.now()
await agent.execute('Test task')
const agentEnd = performance.now()
console.log(`Agent execution: ${agentEnd - agentStart}ms`)
// Expected: 5-50x faster than v0.x
```

---

### Step 7: Security Audit

Run security checks:

```bash
# NPM audit
npm audit

# Or pnpm
pnpm audit

# Expected: 0 critical/high vulnerabilities
```

---

## Getting Help

### Documentation

- **API Reference:** `/docs/api/`
- **Getting Started Guide:** `/docs/guides/getting-started.md`
- **Production Deployment:** `/docs/guides/production-deployment.md`
- **Security Best Practices:** `/docs/security/`
- **Performance Optimization:** `/docs/performance/`

### Examples

Check the examples directory for complete working examples:

```bash
cd examples/getting-started/basic-chat
npm install
npm run dev
```

**Available examples:**
- `examples/getting-started/basic-chat` - Simple chat application
- `examples/getting-started/nextjs-starter` - Next.js integration
- `examples/getting-started/agent-example` - Agent with tools
- `examples/chat-apps/nextjs-chatbot` - Full-featured chatbot
- `examples/agent-apps/research-assistant` - Multi-agent swarm

### Community Support

- **GitHub Issues:** https://github.com/AINative-Studio/ai-kit/issues
- **GitHub Discussions:** https://github.com/AINative-Studio/ai-kit/discussions
- **Discord:** Coming soon
- **Twitter:** @ainativestudio

### Professional Support

For enterprise support, SLA agreements, and migration assistance:

**Email:** support@ainative.studio
**Website:** https://ainative.studio/support

### Migration Assistance

Having trouble with migration? We can help:

1. **Free Support:** Open a GitHub issue with the "migration" label
2. **Priority Support:** Enterprise customers get priority migration support
3. **Professional Services:** We offer paid migration services for complex applications

---

## Rollback Plan

If you encounter critical issues, you can rollback to v0.x:

### Step 1: Rollback Dependencies

```bash
npm install \
  @ainative/ai-kit-react@^0.1.0-alpha.4 \
  @ainative/ai-kit-core@^0.1.4
```

### Step 2: Revert Imports

```typescript
// Change back to old imports
import { useAIStream } from '@ainative/ai-kit-react'
```

### Step 3: Remove New Packages

```bash
npm uninstall \
  @ainative/ai-kit \
  @ainative/ai-kit-safety \
  @ainative/ai-kit-tools \
  @ainative/ai-kit-video
```

### Step 4: Test

```bash
npm test
npm run build
```

**Note:** We strongly recommend staying on v1.0 for security fixes and performance improvements. Only rollback if you encounter critical blockers.

---

## What's Next After Migration?

### Immediate Next Steps

1. **Review Security Audit**
   - Read: `docs/security/security-audit-2026-02-07.md`
   - Enable recommended security features

2. **Review Performance Audit**
   - Read: `docs/performance/performance-audit-report.md`
   - Enable performance optimizations

3. **Explore New Features**
   - Try multi-agent swarms for complex tasks
   - Enable RLHF logging for model improvement
   - Add security guardrails for production

### Upcoming Features (v1.1+)

**v1.1 (Q1 2026):**
- Full Vue.js support
- Enhanced observability
- System-level metrics (CPU, memory)
- Distributed tracing
- Circuit breaker pattern

**v1.2 (Q2 2026):**
- Transaction support
- Backup and recovery
- Additional framework support (Angular, Solid.js)
- Enhanced RLHF analytics

**v2.0 (Q4 2026):**
- Breaking changes for architecture improvements
- Plugin system
- Marketplace for tools and templates
- Advanced multi-agent features

---

## Feedback

We want to hear about your migration experience!

### Share Your Experience

- **Smooth migration?** Let us know on [GitHub Discussions](https://github.com/AINative-Studio/ai-kit/discussions)
- **Hit a snag?** Open an issue with the "migration" label
- **Suggestions?** We're planning v1.1 and want your input

### Help Us Improve

This migration guide will be updated based on community feedback. If you found something unclear or missing:

1. Open an issue: https://github.com/AINative-Studio/ai-kit/issues
2. Submit a PR: https://github.com/AINative-Studio/ai-kit/pulls
3. Email us: docs@ainative.studio

---

**Migration Guide Version:** 1.0.0
**Last Updated:** February 8, 2026
**Questions?** support@ainative.studio

---

## License

This migration guide is part of AI Kit documentation and is licensed under MIT License.

Copyright (c) 2026 AINative Studio
