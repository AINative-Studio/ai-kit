# Integration Tests - Quick Start Guide

Quick reference for running and working with AI Kit integration tests.

## Run Tests

```bash
# All tests
pnpm test:integration

# Specific suite
pnpm test:integration --testNamePattern="Core \\+ Video"

# With coverage
pnpm test:integration:coverage

# Watch mode
pnpm test:integration:watch

# UI mode
pnpm test:integration:ui

# Performance only
pnpm test:integration:performance
```

## Test Suites

| Suite | Command | Tests |
|-------|---------|-------|
| Core + Video | `--testNamePattern="Core \\+ Video"` | Video recording, processing, streaming |
| Core + Auth | `--testNamePattern="Core \\+ Auth"` | Authentication, sessions, tokens |
| Core + ZeroDB | `--testNamePattern="Core \\+ ZeroDB"` | Memory, vector search, RAG |
| Agent Orchestration | `--testNamePattern="Agent Orchestration"` | Agents, tools, streaming |
| Error Handling | `--testNamePattern="Error Handling"` | Network, API, resource errors |

## Test Structure

```typescript
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', async () => {
    // Arrange
    const input = setup();

    // Act
    const result = await action(input);

    // Assert
    expect(result).toBeDefined();
  });
});
```

## Common Patterns

### Session Management
```typescript
const sessionManager = new SessionManager({
  storage: { type: 'memory' },
});

const session = await sessionManager.createSession({
  userId: 'test-user',
  metadata: { /* ... */ },
});
```

### Video Recording
```typescript
const recorder = new ScreenRecorder({ quality: 'high' });
await recorder.start();
await new Promise(resolve => setTimeout(resolve, 100));
const result = await recorder.stop();
```

### AI Streaming
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'test' }],
    stream: true,
  }),
});

const aiStream = AIStream(response);
const reader = aiStream.getReader();
// Read chunks...
```

### Token Counting
```typescript
const tokenCounter = new TokenCounter();
const tokenCount = await tokenCounter.count(text);
const cost = tokenCounter.estimateCost(tokenCount.total, 'gpt-4');
```

### Context Management
```typescript
const contextManager = new ContextManager({
  maxTokens: 8000,
  model: 'gpt-4',
});

contextManager.addMessage({
  role: 'user',
  content: 'Hello',
});

const messages = contextManager.getMessages();
```

## Test Utilities

```typescript
import {
  waitForAsync,
  retry,
  measurePerformance,
  checkMemoryLeaks,
} from '../setup';

// Wait
await waitForAsync(100);

// Retry
const result = await retry(async () => {
  return await operation();
}, 3, 1000);

// Measure
const { result, duration } = await measurePerformance(async () => {
  return await operation();
}, 5000);

// Check leaks
checkMemoryLeaks();
```

## Mocking

### Mock Response
```typescript
server.use(
  http.post('https://api.example.com/endpoint', () => {
    return HttpResponse.json({ success: true });
  })
);
```

### Mock Error
```typescript
server.use(
  http.post('https://api.example.com/endpoint', () => {
    return HttpResponse.json(
      { error: 'Failed' },
      { status: 500 }
    );
  })
);
```

### Mock Stream
```typescript
server.use(
  http.post('https://api.example.com/endpoint', () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data'));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  })
);
```

## Debugging

```bash
# Single file
pnpm test:integration path/to/test.ts

# With Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Verbose
DEBUG=* pnpm test:integration

# UI mode (recommended)
pnpm test:integration:ui
```

## Coverage

```bash
# Generate coverage
pnpm test:integration:coverage

# View HTML report
open coverage/index.html

# Check thresholds
# Lines: 70%, Functions: 70%, Branches: 70%, Statements: 70%
```

## CI/CD

Integration tests run automatically on:
- Pull requests
- Pushes to main/develop
- Manual dispatch

View results at: `.github/workflows/integration-tests.yml`

## Common Issues

### Timeout
```typescript
// Increase timeout in vitest.config.ts
testTimeout: 30000
```

### Mock Not Working
- Check URL matches exactly
- Verify HTTP method
- Ensure request body format matches

### Memory Leak
- Close streams: `reader.releaseLock()`
- Stop recorders: `recorder.stop()`
- Clean up sessions: `sessionManager.cleanup()`

### Flaky Test
- Use `retry()` utility
- Add proper waits
- Use deterministic data

## Quick Reference Links

- [Full Documentation](./README.md)
- [Test Examples](./cross-package/)
- [Test Utilities](./setup.ts)
- [CI Workflow](../../.github/workflows/integration-tests.yml)

## Need Help?

1. Check [README.md](./README.md)
2. Review existing tests
3. Use test UI: `pnpm test:integration:ui`
4. Check CI logs
5. Open GitHub issue

---

Last updated: 2024-02-08
