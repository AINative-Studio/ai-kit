# RLHF Auto-Instrumentation

Comprehensive guide to automatic instrumentation for capturing RLHF (Reinforcement Learning from Human Feedback) data in AI Kit.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

The RLHF Auto-Instrumentation module provides automatic capture of AI interactions, user feedback, and contextual data without requiring manual logging calls. This enables seamless collection of training data for improving AI models through human feedback.

### What is RLHF?

Reinforcement Learning from Human Feedback (RLHF) is a machine learning technique that uses human preferences to fine-tune AI models. By collecting real-world interactions and user feedback, you can continuously improve your AI systems.

### Why Auto-Instrumentation?

Manual instrumentation requires developers to:
- Add logging calls throughout their code
- Track interaction state manually
- Synchronize feedback with interactions
- Handle edge cases and errors

Auto-instrumentation solves these problems by:
- Automatically capturing all AI stream interactions
- Zero-code integration with existing AIStream instances
- Intelligent context collection
- Built-in error handling and retry logic

## Features

### Automatic Capture

- **Prompt-Response Pairs**: Automatically captures user inputs and AI responses
- **Performance Metrics**: Tracks latency, token counts, and throughput
- **User Feedback**: Captures thumbs up/down, ratings, and text feedback
- **Error Events**: Logs errors with full context for debugging
- **Usage Patterns**: Identifies trends and common interaction patterns

### Smart Context Collection

- **Browser Information**: User agent, device type, screen resolution
- **Session Data**: Session IDs, timestamps, interaction sequences
- **Custom Context**: Add application-specific metadata
- **Environmental Data**: Timezone, language, platform information

### Integration Points

- **AIStream Integration**: Seamless integration with AI streaming
- **Event Listeners**: React to captured interactions in real-time
- **Middleware Hooks**: Transform or filter data before storage
- **Custom Instrumentors**: Extend functionality with custom logic

### Storage & Export

- **In-Memory Buffer**: Fast, local storage for captured data
- **Remote Upload**: Batch upload to backend services
- **Automatic Flushing**: Periodic uploads based on time or buffer size
- **Export API**: Retrieve and export captured data

## Installation

```bash
npm install @aikit/core
```

Or with yarn:

```bash
yarn add @aikit/core
```

## Quick Start

### Basic Usage

```typescript
import { AIStream } from '@aikit/core/streaming'
import { RLHFInstrumentation } from '@aikit/core/rlhf'

// Create instrumentation instance
const instrumentation = new RLHFInstrumentation()

// Create and instrument your AI stream
const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
})

instrumentation.instrument(stream)

// Use the stream normally - interactions are captured automatically
await stream.send('Hello, how are you?')

// Capture user feedback
const interactions = instrumentation.getInteractions()
instrumentation.captureFeedback({
  interactionId: interactions[0].id,
  type: 'thumbs-up',
  value: true,
})
```

### With Configuration

```typescript
import { createInstrumentation } from '@aikit/core/rlhf'

const instrumentation = createInstrumentation({
  enabled: true,
  sampleRate: 0.8, // Capture 80% of interactions
  maxBufferSize: 500,
  storage: 'remote',
  remoteEndpoint: 'https://api.example.com/rlhf',
  flushInterval: 30000, // Flush every 30 seconds
  customContext: {
    appVersion: '1.0.0',
    environment: 'production',
  },
})
```

## Core Concepts

### Captured Interactions

Every interaction consists of:

```typescript
interface CapturedInteraction {
  id: string                    // Unique interaction ID
  sessionId: string             // Session identifier
  prompt: Message               // User input
  response: Message             // AI output
  context: ContextData          // Environmental context
  metrics: PerformanceMetrics   // Performance data
  usage?: Usage                 // Token usage stats
  feedback?: FeedbackEvent[]    // User feedback
  error?: ErrorEvent            // Error information
  timestamp: number             // Capture timestamp
  metadata?: Record<string, any> // Custom metadata
}
```

### Context Data

Automatically collected contextual information:

```typescript
interface ContextData {
  userAgent?: string            // Browser user agent
  deviceType?: string           // desktop/mobile/tablet
  platform?: string             // Operating system
  language?: string             // User language
  timezone?: string             // User timezone
  screenResolution?: string     // Screen dimensions
  referrer?: string             // Page referrer
  url?: string                  // Current page URL
  userId?: string               // User identifier
  appVersion?: string           // Application version
  environment?: string          // dev/staging/prod
  custom?: Record<string, any>  // Custom fields
}
```

### Performance Metrics

Captured performance data:

```typescript
interface PerformanceMetrics {
  timeToFirstToken?: number     // TTFT in milliseconds
  totalResponseTime: number     // Total time in ms
  streamingTime?: number        // Streaming duration
  promptTokenCount?: number     // Input tokens
  responseTokenCount?: number   // Output tokens
  tokensPerSecond?: number      // Throughput
  networkLatency?: number       // Network delay
  retryCount?: number           // Number of retries
  cacheHit?: boolean            // Cache status
}
```

### Feedback Events

User feedback on interactions:

```typescript
interface FeedbackEvent {
  id: string                    // Feedback ID
  interactionId: string         // Related interaction
  type: 'thumbs-up' | 'thumbs-down' | 'rating' | 'text' | 'custom'
  value: number | boolean | string | any
  comment?: string              // Optional comment
  timestamp: number             // Feedback timestamp
  userId?: string               // User who gave feedback
  metadata?: Record<string, any>
}
```

## Configuration

### InstrumentationConfig

Complete configuration options:

```typescript
interface InstrumentationConfig {
  // Enable/disable instrumentation
  enabled?: boolean                // Default: true

  // Capture settings
  captureInteractions?: boolean    // Default: true
  captureFeedback?: boolean        // Default: true
  captureMetrics?: boolean         // Default: true
  captureErrors?: boolean          // Default: true
  captureUsagePatterns?: boolean   // Default: true

  // Context collection
  collectContext?: boolean         // Default: true
  customContext?: Record<string, any>

  // Sampling
  sampleRate?: number              // Default: 1.0 (0-1)

  // Buffer management
  maxBufferSize?: number           // Default: 1000
  onBufferFull?: (interactions: CapturedInteraction[]) => void

  // Callbacks
  onInteractionCaptured?: (interaction: CapturedInteraction) => void
  onFeedbackCaptured?: (feedback: FeedbackEvent) => void

  // Storage
  storage?: 'memory' | 'local' | 'remote'  // Default: 'memory'
  remoteEndpoint?: string
  batchSize?: number               // Default: 10
  flushInterval?: number           // Default: 60000 (1 minute)
}
```

### Configuration Examples

#### Development Mode

```typescript
const instrumentation = new RLHFInstrumentation({
  enabled: true,
  storage: 'memory',
  customContext: {
    environment: 'development',
  },
})
```

#### Production Mode

```typescript
const instrumentation = new RLHFInstrumentation({
  enabled: true,
  storage: 'remote',
  remoteEndpoint: 'https://api.example.com/rlhf',
  sampleRate: 0.5,              // Sample 50% to reduce load
  batchSize: 50,
  flushInterval: 60000,         // Flush every minute
  maxBufferSize: 1000,
  customContext: {
    environment: 'production',
    appVersion: process.env.APP_VERSION,
  },
  onBufferFull: (interactions) => {
    console.log(`Buffer full with ${interactions.length} interactions`)
  },
})
```

#### Minimal Overhead

```typescript
const instrumentation = new RLHFInstrumentation({
  enabled: true,
  captureMetrics: false,        // Skip performance metrics
  collectContext: false,        // Skip context collection
  sampleRate: 0.1,              // Only 10% of interactions
})
```

## API Reference

### RLHFInstrumentation Class

#### Constructor

```typescript
new RLHFInstrumentation(config?: InstrumentationConfig)
```

Creates a new instrumentation instance.

#### Methods

##### instrument(stream)

```typescript
instrument(stream: AIStream): AIStream
```

Instruments an AIStream for automatic capture. Returns the same stream instance.

**Example:**

```typescript
const stream = new AIStream({ endpoint: '/api/chat' })
instrumentation.instrument(stream)
```

##### captureInteraction(event)

```typescript
captureInteraction(event: {
  prompt: Message
  response: Message
  usage?: Usage
  error?: Error
}): CapturedInteraction | null
```

Manually capture an interaction. Returns the captured interaction or null if filtered.

**Example:**

```typescript
const interaction = instrumentation.captureInteraction({
  prompt: {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    timestamp: Date.now(),
  },
  response: {
    id: 'msg-2',
    role: 'assistant',
    content: 'Hi there!',
    timestamp: Date.now(),
  },
})
```

##### captureFeedback(feedback)

```typescript
captureFeedback(feedback: Omit<FeedbackEvent, 'id' | 'timestamp'>): void
```

Capture user feedback on an interaction.

**Example:**

```typescript
instrumentation.captureFeedback({
  interactionId: interaction.id,
  type: 'thumbs-up',
  value: true,
  comment: 'Very helpful!',
})
```

##### collectContext()

```typescript
collectContext(): ContextData
```

Collect current contextual data.

**Example:**

```typescript
const context = instrumentation.collectContext()
console.log('User timezone:', context.timezone)
```

##### enable() / disable()

```typescript
enable(): void
disable(): void
```

Enable or disable instrumentation at runtime.

**Example:**

```typescript
instrumentation.disable()  // Stop capturing
// ... some operations
instrumentation.enable()   // Resume capturing
```

##### getMetrics()

```typescript
getMetrics(): InstrumentationMetrics
```

Get current instrumentation metrics.

**Example:**

```typescript
const metrics = instrumentation.getMetrics()
console.log('Total interactions:', metrics.totalInteractions)
console.log('Feedback rate:', metrics.feedbackRate)
console.log('Average response time:', metrics.averageResponseTime)
```

##### getInteractions(filter?)

```typescript
getInteractions(filter?: InteractionFilter): CapturedInteraction[]
```

Retrieve captured interactions with optional filtering.

**Example:**

```typescript
// Get all interactions
const all = instrumentation.getInteractions()

// Get interactions with feedback
const withFeedback = instrumentation.getInteractions({
  hasFeedback: true,
})

// Get recent interactions
const recent = instrumentation.getInteractions({
  startDate: Date.now() - 3600000, // Last hour
  limit: 10,
})
```

##### clear()

```typescript
clear(): void
```

Clear all captured data from the buffer.

##### flush()

```typescript
async flush(): Promise<void>
```

Manually flush buffered interactions to remote storage.

**Example:**

```typescript
await instrumentation.flush()
console.log('Data flushed to remote storage')
```

##### addInstrumentor(instrumentor)

```typescript
addInstrumentor(instrumentor: CustomInstrumentor): void
```

Add a custom instrumentor function to transform or filter interactions.

**Example:**

```typescript
instrumentation.addInstrumentor((interaction) => {
  // Add custom metadata
  return {
    ...interaction,
    metadata: {
      ...interaction.metadata,
      customField: 'value',
    },
  }
})

// Filter out short interactions
instrumentation.addInstrumentor((interaction) => {
  if (interaction.prompt.content.length < 5) {
    return null  // Skip this interaction
  }
  return interaction
})
```

##### addMiddleware(middleware)

```typescript
addMiddleware(middleware: InstrumentationMiddleware): void
```

Add middleware to process interactions before storage.

**Example:**

```typescript
instrumentation.addMiddleware((interaction, next) => {
  console.log('Processing interaction:', interaction.id)
  // Perform async operations
  next()  // Continue to next middleware
})
```

##### destroy()

```typescript
destroy(): void
```

Clean up resources and remove all listeners.

### Factory Function

```typescript
createInstrumentation(config?: InstrumentationConfig): RLHFInstrumentation
```

Factory function to create a new instrumentation instance.

## Advanced Usage

### Custom Instrumentors

Transform or filter captured interactions:

```typescript
// Add PII filtering
instrumentation.addInstrumentor((interaction) => {
  const filtered = {
    ...interaction,
    prompt: {
      ...interaction.prompt,
      content: removePII(interaction.prompt.content),
    },
    response: {
      ...interaction.response,
      content: removePII(interaction.response.content),
    },
  }
  return filtered
})

// Add sentiment analysis
instrumentation.addInstrumentor((interaction) => {
  const sentiment = analyzeSentiment(interaction.response.content)
  return {
    ...interaction,
    metadata: {
      ...interaction.metadata,
      sentiment,
    },
  }
})
```

### Middleware Pipeline

Create processing pipelines:

```typescript
// Logging middleware
instrumentation.addMiddleware((interaction, next) => {
  console.log('Captured:', interaction.id)
  next()
})

// Analytics middleware
instrumentation.addMiddleware(async (interaction, next) => {
  await analytics.track('interaction_captured', {
    interactionId: interaction.id,
    responseTime: interaction.metrics.totalResponseTime,
  })
  next()
})

// Validation middleware
instrumentation.addMiddleware((interaction, next) => {
  if (validateInteraction(interaction)) {
    next()
  } else {
    console.warn('Invalid interaction:', interaction.id)
  }
})
```

### Event Listeners

React to instrumentation events:

```typescript
// Listen to all captured interactions
instrumentation.on('interaction-captured', (interaction) => {
  console.log('New interaction:', interaction.id)
})

// Listen to feedback
instrumentation.on('feedback-captured', (feedback) => {
  if (feedback.type === 'thumbs-down') {
    notifyTeam('Negative feedback received', feedback)
  }
})

// Listen to errors
instrumentation.on('error-captured', (error) => {
  logError(error)
})

// Listen to buffer full
instrumentation.on('buffer-full', (interactions) => {
  console.log('Buffer full, uploading', interactions.length, 'interactions')
})

// Listen to flush events
instrumentation.on('flushed', (interactions) => {
  console.log('Flushed', interactions.length, 'interactions')
})
```

### Remote Storage Integration

Upload captured data to your backend:

```typescript
const instrumentation = new RLHFInstrumentation({
  storage: 'remote',
  remoteEndpoint: 'https://api.example.com/rlhf',
  batchSize: 20,
  flushInterval: 30000,
})

// Data is automatically uploaded in batches
// Payload format:
{
  sessionId: string,
  interactions: CapturedInteraction[],
  timestamp: number
}
```

### Session Management

Track interactions across sessions:

```typescript
// Get metrics per session
const metrics = instrumentation.getMetrics()
metrics.interactionsPerSession.forEach((count, sessionId) => {
  console.log(`Session ${sessionId}: ${count} interactions`)
})

// Filter by session
const sessionInteractions = instrumentation.getInteractions({
  sessionId: 'session-123',
})
```

### A/B Testing Integration

Use instrumentation for A/B testing:

```typescript
// Capture model variant
instrumentation.addInstrumentor((interaction) => ({
  ...interaction,
  metadata: {
    ...interaction.metadata,
    modelVariant: getCurrentModelVariant(),
  },
}))

// Analyze by variant
const interactions = instrumentation.getInteractions()
const byVariant = groupBy(interactions, i => i.metadata.modelVariant)

Object.entries(byVariant).forEach(([variant, interactions]) => {
  const avgResponseTime = average(interactions.map(i => i.metrics.totalResponseTime))
  const positiveFeedback = interactions.filter(i =>
    i.feedback?.some(f => f.type === 'thumbs-up')
  ).length

  console.log(`Variant ${variant}:`)
  console.log(`  Avg Response Time: ${avgResponseTime}ms`)
  console.log(`  Positive Feedback: ${positiveFeedback}`)
})
```

## Best Practices

### 1. Configure Sampling in Production

Reduce overhead by sampling interactions:

```typescript
const instrumentation = new RLHFInstrumentation({
  sampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
})
```

### 2. Handle Buffer Full Events

Implement buffer full handlers to prevent data loss:

```typescript
const instrumentation = new RLHFInstrumentation({
  maxBufferSize: 1000,
  onBufferFull: async (interactions) => {
    // Upload to persistent storage
    await uploadToS3(interactions)
    // Clear buffer
    instrumentation.clear()
  },
})
```

### 3. Filter Sensitive Data

Use custom instrumentors to remove PII:

```typescript
instrumentation.addInstrumentor((interaction) => {
  return {
    ...interaction,
    prompt: {
      ...interaction.prompt,
      content: sanitizePII(interaction.prompt.content),
    },
    response: {
      ...interaction.response,
      content: sanitizePII(interaction.response.content),
    },
  }
})
```

### 4. Monitor Metrics

Regularly check instrumentation health:

```typescript
setInterval(() => {
  const metrics = instrumentation.getMetrics()

  if (metrics.errorRate > 0.1) {
    alert('High error rate detected')
  }

  if (metrics.averageResponseTime > 5000) {
    alert('Slow response times detected')
  }
}, 60000)
```

### 5. Implement Graceful Shutdown

Flush data before shutdown:

```typescript
process.on('SIGTERM', async () => {
  console.log('Flushing instrumentation data...')
  await instrumentation.flush()
  instrumentation.destroy()
  process.exit(0)
})
```

## Examples

### Example 1: Basic Chat Application

```typescript
import { AIStream } from '@aikit/core/streaming'
import { createInstrumentation } from '@aikit/core/rlhf'

const instrumentation = createInstrumentation({
  customContext: {
    appName: 'ChatBot Pro',
    appVersion: '1.0.0',
  },
})

const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'gpt-4',
})

instrumentation.instrument(stream)

// Handle user messages
async function sendMessage(content: string) {
  await stream.send(content)
}

// Handle feedback buttons
function handleFeedback(interactionId: string, isPositive: boolean) {
  instrumentation.captureFeedback({
    interactionId,
    type: isPositive ? 'thumbs-up' : 'thumbs-down',
    value: isPositive,
  })
}
```

### Example 2: Multi-Model Comparison

```typescript
const instrumentation = createInstrumentation()

const models = ['gpt-4', 'claude-2', 'llama-2']

models.forEach(model => {
  const stream = new AIStream({
    endpoint: '/api/chat',
    model,
  })

  instrumentation.instrument(stream)

  // Add model identifier to metadata
  instrumentation.addInstrumentor((interaction) => ({
    ...interaction,
    metadata: {
      ...interaction.metadata,
      model,
    },
  }))
})

// Compare model performance
function analyzeModelPerformance() {
  const interactions = instrumentation.getInteractions()

  models.forEach(model => {
    const modelInteractions = interactions.filter(
      i => i.metadata?.model === model
    )

    const avgTime = average(
      modelInteractions.map(i => i.metrics.totalResponseTime)
    )

    const positiveFeedback = modelInteractions.filter(
      i => i.feedback?.some(f => f.type === 'thumbs-up')
    ).length

    console.log(`${model}: ${avgTime}ms avg, ${positiveFeedback} positive`)
  })
}
```

### Example 3: Export to CSV

```typescript
function exportToCSV() {
  const interactions = instrumentation.getInteractions()

  const rows = interactions.map(i => ({
    timestamp: new Date(i.timestamp).toISOString(),
    prompt: i.prompt.content,
    response: i.response.content,
    responseTime: i.metrics.totalResponseTime,
    hasFeedback: (i.feedback?.length ?? 0) > 0,
    feedbackType: i.feedback?.[0]?.type ?? '',
  }))

  const csv = convertToCSV(rows)
  downloadFile('interactions.csv', csv)
}
```

## Troubleshooting

### Issue: Interactions Not Being Captured

**Possible Causes:**
- Instrumentation is disabled
- Sample rate is too low
- Custom instrumentor is filtering all interactions

**Solutions:**

```typescript
// Check if enabled
const metrics = instrumentation.getMetrics()
console.log('Total interactions:', metrics.totalInteractions)

// Verify configuration
instrumentation.enable()

// Check sample rate
const config = { sampleRate: 1.0 }
```

### Issue: Buffer Filling Up Too Fast

**Solutions:**

```typescript
// Increase buffer size
const instrumentation = new RLHFInstrumentation({
  maxBufferSize: 5000,
})

// Decrease flush interval
const instrumentation = new RLHFInstrumentation({
  flushInterval: 10000,  // Flush every 10 seconds
})

// Implement buffer full handler
const instrumentation = new RLHFInstrumentation({
  onBufferFull: async (interactions) => {
    await uploadData(interactions)
    instrumentation.clear()
  },
})
```

### Issue: High Memory Usage

**Solutions:**

```typescript
// Reduce buffer size
const instrumentation = new RLHFInstrumentation({
  maxBufferSize: 100,
})

// Enable remote storage
const instrumentation = new RLHFInstrumentation({
  storage: 'remote',
  remoteEndpoint: 'https://api.example.com/rlhf',
})

// Clear buffer periodically
setInterval(() => {
  instrumentation.clear()
}, 60000)
```

### Issue: Remote Upload Failures

**Solutions:**

```typescript
// Monitor failed uploads
const metrics = instrumentation.getMetrics()
console.log('Failed uploads:', metrics.failedUploads)

// Implement retry logic
instrumentation.on('flushed', async (interactions) => {
  // Implement custom retry logic
})

// Store locally on failure
const instrumentation = new RLHFInstrumentation({
  onBufferFull: async (interactions) => {
    try {
      await uploadToRemote(interactions)
    } catch (error) {
      saveToLocalStorage(interactions)
    }
  },
})
```

## Summary

RLHF Auto-Instrumentation provides a powerful, zero-code solution for capturing AI interactions and feedback. Key features include:

- Automatic capture of all AI stream interactions
- Smart context collection
- Flexible storage options
- Extensible with custom instrumentors and middleware
- Built-in metrics and analytics
- Production-ready with sampling and buffer management

For more information, see the [API Reference](#api-reference) or check out the [examples](#examples).
