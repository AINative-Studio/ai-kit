# AI Kit Performance Optimization Guide

**Refs**: #68

This guide provides recommendations for optimizing AI Kit applications based on the performance audit conducted in February 2026.

---

## Quick Reference: Performance Best Practices

### ✅ Do This

1. **Use MemoryStore for development/testing** - 10x faster than Redis/ZeroDB
2. **Limit event listeners to <100 per stream** - Keeps emit time <50ms
3. **Clean up streams with `stream.stop()`** - Prevents memory leaks
4. **Use streaming for long responses** - Better UX with <10ms first token
5. **Keep conversations <1000 messages** - Optimal memory usage

### ❌ Avoid This

1. **Don't add excessive event listeners** - >100 listeners may cause warnings
2. **Don't forget to call `store.close()`** - Can cause resource leaks
3. **Don't chain synchronous operations in tools** - Use parallel execution
4. **Don't store huge objects in metadata** - Keep metadata minimal

---

## Component-Specific Optimization

### 1. Streaming (AIStream)

#### Current Performance
- First token: <10ms
- Token processing: <5ms average
- Memory per stream: <100KB

#### Optimization Tips

```typescript
// ✅ GOOD: Clean up properly
const stream = new AIStream(config);
try {
  await stream.send('message');
} finally {
  stream.stop(); // Always cleanup
}

// ✅ GOOD: Limit listeners
stream.setMaxListeners(50); // If you need many listeners

// ❌ BAD: Creating many streams without cleanup
for (let i = 0; i < 100; i++) {
  new AIStream(config).send('message'); // Memory leak!
}
```

#### When to Optimize

- Streaming is already highly optimized
- Only optimize if you're handling >100 concurrent streams
- Consider connection pooling for very high throughput

---

### 2. Agent Execution

#### Current Performance
- Tool execution overhead: <5ms
- LLM call overhead: <10ms
- Trace generation: <100ms total

#### Optimization Tips

```typescript
// ✅ GOOD: Parallel tool execution (framework does this automatically)
const agent = new Agent({
  tools: [tool1, tool2, tool3] // Will execute in parallel if called together
});

// ✅ GOOD: Limit max steps for safety
const executor = new StreamingAgentExecutor(agent, {
  maxSteps: 10 // Prevents infinite loops
});

// ✅ GOOD: Disable verbose tracing in production if not needed
const executor = new StreamingAgentExecutor(agent, {
  verbose: false // Reduces overhead slightly
});

// ❌ BAD: Synchronous tool chaining
const tool1Result = await tool1.execute();
const tool2Result = await tool2.execute(); // Could be parallel!
```

#### When to Optimize

- Agent execution is already optimized
- Focus on optimizing **tool implementations**, not the framework
- Most overhead comes from actual LLM API calls, not framework

---

### 3. State Management

#### Current Performance
- MemoryStore: <10ms read/write
- RedisStore: <100ms read/write
- ZeroDBStore: <100ms read/write

#### Optimization Tips

```typescript
// ✅ GOOD: Choose the right store for your use case
// Development/Testing
const devStore = new MemoryStore(); // Fastest

// Production with sessions
const prodStore = new RedisStore({ client: redisClient }); // Good balance

// Production with analytics
const analyticsStore = new ZeroDBStore({ projectId: 'xxx' }); // Full features

// ✅ GOOD: Batch operations
const promises = conversations.map(conv => store.save(conv.id, conv.messages));
await Promise.all(promises); // Parallel, not sequential

// ✅ GOOD: Clean up expired conversations
await store.clear(); // Periodic cleanup prevents bloat

// ❌ BAD: Sequential saves
for (const conv of conversations) {
  await store.save(conv.id, conv.messages); // Slow!
}
```

#### Store Selection Guide

| Use Case | Store | Why |
|----------|-------|-----|
| Local development | MemoryStore | Fastest, simple |
| Testing/CI | MemoryStore | No dependencies |
| Production (simple) | RedisStore | Persistent, fast |
| Production (analytics) | ZeroDBStore | Full features, search |
| Multi-region | RedisStore | Better geo-distribution |

---

## Memory Management

### Conversation Size Limits

Based on performance testing:

| Messages | Memory | Recommendation |
|----------|--------|----------------|
| <100 | <100KB | ✅ Optimal |
| 100-1000 | <1MB | ✅ Good |
| 1000-10000 | <10MB | ⚠️ Consider windowing |
| >10000 | >10MB | ❌ Implement message windowing |

### Message Windowing Example

```typescript
// For very long conversations, keep only recent messages
function windowMessages(messages: Message[], maxMessages: number = 1000): Message[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep first message (system prompt) + recent messages
  return [
    messages[0],
    ...messages.slice(-maxMessages + 1)
  ];
}

// Use when loading
const conversation = await store.load('conv-id');
if (conversation) {
  conversation.messages = windowMessages(conversation.messages);
}
```

---

## Concurrency Patterns

### Streaming Concurrency

```typescript
// ✅ GOOD: Concurrent streams (tested up to 10)
const streams = Array.from({ length: 10 }, () => new AIStream(config));
await Promise.all(streams.map(s => s.send('message')));

// ⚠️ CAUTION: >50 concurrent streams
// Consider rate limiting or queueing
```

### Tool Execution Concurrency

```typescript
// ✅ GOOD: Tools execute in parallel automatically
// When LLM returns multiple tool calls, framework runs them concurrently

// ✅ GOOD: Manual parallel execution
const results = await Promise.all([
  agent.executeToolCall(call1),
  agent.executeToolCall(call2),
  agent.executeToolCall(call3)
]); // All execute in parallel
```

### State Operation Concurrency

```typescript
// ✅ GOOD: Batch saves (tested up to 100)
const saves = conversations.map(c => store.save(c.id, c.messages));
await Promise.all(saves); // <200ms for 100 conversations

// ⚠️ CAUTION: >100 concurrent operations
// May hit Redis/ZeroDB connection limits
```

---

## Performance Monitoring

### Key Metrics to Track

```typescript
// 1. Streaming Latency
stream.on('token', (token) => {
  const latency = performance.now() - startTime;
  metrics.recordLatency('streaming.first_token', latency);
});

// 2. Agent Execution Time
const startTime = performance.now();
for await (const event of executor.stream(input)) {
  if (event.type === 'final_answer') {
    const duration = performance.now() - startTime;
    metrics.recordDuration('agent.execution', duration);
  }
}

// 3. State Operation Latency
const startTime = performance.now();
await store.save(id, messages);
const latency = performance.now() - startTime;
metrics.recordLatency('state.save', latency);

// 4. Memory Usage
const memUsage = process.memoryUsage();
metrics.recordGauge('memory.heapUsed', memUsage.heapUsed);
```

### Alert Thresholds

Based on performance audit:

```typescript
const ALERT_THRESHOLDS = {
  streaming: {
    firstToken: 100, // Alert if >100ms (target is <50ms)
    interToken: 20   // Alert if >20ms (target is <5ms)
  },
  agent: {
    toolOverhead: 20, // Alert if >20ms (target is <5ms)
    totalExecution: 5000 // Alert if >5s
  },
  state: {
    memory: 100,  // Alert if >100ms (target is <10ms)
    redis: 200,   // Alert if >200ms (target is <100ms)
    zerodb: 200   // Alert if >200ms (target is <100ms)
  },
  memory: {
    perConversation: 10 * 1024 * 1024 // Alert if >10MB
  }
};
```

---

## Profiling in Production

### Enable Performance Tracking

```typescript
import { AIStream } from '@ainative/ai-kit';

// Development: verbose logging
const stream = new AIStream(config, {
  onToken: (token) => console.log('Token:', token),
  onCost: (usage) => console.log('Usage:', usage)
});

// Production: send to monitoring
const stream = new AIStream(config, {
  onToken: (token) => metrics.increment('tokens.received'),
  onCost: (usage) => {
    metrics.recordUsage('llm.tokens.prompt', usage.promptTokens);
    metrics.recordUsage('llm.tokens.completion', usage.completionTokens);
  }
});
```

### Agent Trace Analysis

```typescript
const executor = new StreamingAgentExecutor(agent, { verbose: true });

for await (const event of executor.stream(input)) {
  // Process events...
}

// Get comprehensive trace
const trace = executor.getTrace();

// Analyze performance
console.log('Total steps:', trace.stats.totalSteps);
console.log('Total duration:', trace.durationMs);
console.log('Tool calls:', trace.stats.totalToolCalls);
console.log('Success rate:',
  trace.stats.successfulToolCalls / trace.stats.totalToolCalls);

// Send to monitoring
analytics.recordTrace(trace);
```

---

## Debugging Performance Issues

### Issue: Slow First Token

```typescript
// Check 1: Network latency
const startFetch = performance.now();
await fetch(config.endpoint);
console.log('Network latency:', performance.now() - startFetch);

// Check 2: LLM processing time (not framework issue)
stream.on('streaming-start', () => console.log('Request sent'));
stream.on('token', () => console.log('First token received'));

// Solution: Not much framework can do - this is LLM latency
```

### Issue: High Memory Usage

```typescript
// Check 1: Conversation size
const conversation = await store.load('conv-id');
console.log('Messages:', conversation.messages.length);
console.log('Size:', JSON.stringify(conversation).length, 'bytes');

// Check 2: Unclosed streams
// Use stream.stop() or stream.reset() to cleanup

// Solution: Implement message windowing (see above)
```

### Issue: Slow State Operations

```typescript
// Check 1: Store type
console.log('Store:', store.constructor.name);
// MemoryStore: <10ms, RedisStore/ZeroDBStore: <100ms

// Check 2: Network latency (for Redis/ZeroDB)
// Use connection pooling, check network

// Solution: Use MemoryStore for dev, optimize network for prod
```

---

## Framework Internals (Advanced)

### Where Time is Spent

Based on profiling:

```
Typical Request Breakdown:
├─ Network (fetch): ~50-200ms (depends on LLM provider)
├─ LLM processing: ~500-5000ms (depends on model)
├─ Framework overhead: <10ms
│  ├─ SSE parsing: ~1-2ms
│  ├─ Event emission: ~1-3ms
│  ├─ State management: ~1-5ms
│  └─ Tool execution: ~1-3ms
└─ Total: ~550-5200ms
```

**Key Insight**: Framework overhead is <1% of total request time. Optimize LLM calls and tool implementations first.

### Hot Paths (already optimized)

1. **SSE Stream Processing** - <10ms first token
2. **Token Emission** - <5ms with 100 listeners
3. **Tool Execution** - <5ms overhead
4. **State Serialization** - <10ms for 1000 messages

No further optimization needed unless handling >1000 req/sec.

---

## Performance Testing

### Running Performance Tests

```bash
# Run all performance tests
pnpm vitest run __tests__/performance/

# Run specific test suite
pnpm vitest run __tests__/performance/streaming-latency.test.ts

# Run with coverage
pnpm vitest run __tests__/performance/ --coverage
```

### Writing Performance Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Performance: My Feature', () => {
  it('should complete within SLA', async () => {
    const startTime = performance.now();

    // Your operation
    await myOperation();

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(100); // 100ms SLA
  });
});
```

---

## Conclusion

AI Kit is highly optimized out of the box. Focus on:

1. **Using the right store** for your use case
2. **Implementing efficient tools** (not framework optimization)
3. **Monitoring key metrics** in production
4. **Handling edge cases** (very long conversations, high concurrency)

The framework overhead is minimal (<10ms). Most optimization should focus on:
- LLM provider selection and configuration
- Tool implementation efficiency
- Network optimization for distributed stores

---

**Last Updated**: February 7, 2026
**Refs**: #68
