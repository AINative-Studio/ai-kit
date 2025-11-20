# Integration Testing Guide

## Table of Contents

1. [Overview](#overview)
2. [Philosophy](#philosophy)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)
7. [Debugging](#debugging)
8. [CI/CD Integration](#cicd-integration)
9. [Performance Testing](#performance-testing)
10. [Troubleshooting](#troubleshooting)

## Overview

This guide covers integration testing for the AI Kit framework. Integration tests verify that components work together correctly across package boundaries and simulate real-world usage scenarios.

### What are Integration Tests?

Integration tests differ from unit tests in that they:

- Test multiple components working together
- Verify cross-package interactions
- Simulate real user workflows
- Test external integrations (APIs, databases)
- Validate complete feature implementations

### Test Categories

Our integration tests are organized into seven categories:

1. **Core Tests** - Core package functionality (streaming, agents, memory, RLHF)
2. **React Tests** - React hooks and components integration
3. **Next.js Tests** - Next.js App Router, API routes, middleware
4. **Tools Tests** - Tool execution and chaining
5. **CLI Tests** - Command-line interface workflows
6. **Cross-Package Tests** - Inter-package integration
7. **Scenario Tests** - Complete end-to-end workflows

## Philosophy

### Integration Testing Principles

Our integration testing approach follows these principles:

#### 1. Test Real Scenarios

Integration tests should simulate actual user workflows:

```typescript
it('should handle complete chatbot conversation', async () => {
  // User sends message
  await chatbot.sendMessage('Hello');

  // Bot processes with tools
  const response = await chatbot.getResponse();

  // Memory is updated
  expect(chatbot.memory.size).toBeGreaterThan(0);

  // Analytics are tracked
  expect(chatbot.analytics.messageCount).toBe(2);
});
```

#### 2. Test Boundaries

Focus on testing how components interact at their boundaries:

```typescript
it('should integrate AIStream with React component', async () => {
  const { result } = renderHook(() => useAIStream());

  await act(async () => {
    await result.current.startStream('test prompt');
  });

  expect(result.current.stream).toBeTruthy();
});
```

#### 3. Minimize Mocking

Use real implementations where possible, mock only external services:

```typescript
// GOOD: Use real components
const agent = new Agent(config);
const result = await agent.execute(prompt);

// ACCEPTABLE: Mock external API
server.use(
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json(mockResponse);
  })
);
```

#### 4. Test Error Paths

Integration tests should verify error handling:

```typescript
it('should handle API errors gracefully', async () => {
  server.use(
    http.post('https://api.openai.com/v1/chat/completions', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  await expect(agent.execute('test')).rejects.toThrow();
  expect(agent.getLastError()).toBeDefined();
});
```

## Test Structure

### Directory Organization

```
__tests__/integration/
├── setup.ts                    # Global test setup
├── utils/
│   └── test-helpers.ts        # Test utility functions
├── fixtures/
│   └── mock-data.ts           # Reusable test data
├── core/                      # Core package tests
│   ├── streaming-with-tools.test.ts
│   ├── agent-with-memory.test.ts
│   ├── multi-agent-workflow.test.ts
│   └── rlhf-pipeline.test.ts
├── react/                     # React package tests
│   ├── hooks-integration.test.tsx
│   ├── streaming-ui.test.tsx
│   └── state-persistence.test.tsx
├── nextjs/                    # Next.js package tests
│   ├── app-router.test.ts
│   ├── api-routes.test.ts
│   └── middleware-chain.test.ts
├── tools/                     # Tools package tests
│   ├── tool-execution.test.ts
│   └── tool-chaining.test.ts
├── cli/                       # CLI package tests
│   ├── project-creation.test.ts
│   └── command-pipeline.test.ts
├── cross-package/             # Cross-package tests
│   ├── core-react-integration.test.tsx
│   ├── nextjs-full-stack.test.ts
│   └── cli-template-validation.test.ts
└── scenarios/                 # End-to-end scenarios
    ├── chatbot-workflow.test.ts
    ├── agent-dashboard.test.ts
    └── data-analysis-pipeline.test.ts
```

### Test File Template

```typescript
/**
 * Integration Tests: [Feature Name]
 *
 * Description of what this test file covers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { /* test utilities */ } from '../utils/test-helpers';
import { /* mock data */ } from '../fixtures/mock-data';

describe('[Feature Name] Integration', () => {
  // Setup
  beforeEach(() => {
    // Initialize test state
  });

  afterEach(() => {
    // Cleanup
  });

  describe('[Sub-feature 1]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const input = setupTestInput();

      // Act
      const result = await performAction(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
    });

    it('should handle errors', async () => {
      // Test error cases
    });
  });

  describe('[Sub-feature 2]', () => {
    // More tests
  });

  describe('Performance', () => {
    it('should complete within performance budget', async () => {
      const { duration } = await trackPerformance(async () => {
        await performAction();
      }, 'action-name');

      expect(duration).toBeLessThan(5000);
    });
  });
});
```

## Running Tests

### Local Development

#### Run all integration tests:

```bash
pnpm run test:integration
```

#### Run specific test file:

```bash
pnpm run test:integration __tests__/integration/core/streaming-with-tools.test.ts
```

#### Run tests in watch mode:

```bash
pnpm run test:integration --watch
```

#### Run with coverage:

```bash
pnpm run test:integration:coverage
```

#### Run performance tests only:

```bash
pnpm run test:integration:performance
```

### Test Commands

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test:integration": "vitest run __tests__/integration",
    "test:integration:watch": "vitest watch __tests__/integration",
    "test:integration:coverage": "vitest run __tests__/integration --coverage",
    "test:integration:performance": "vitest run __tests__/integration --testNamePattern='Performance'",
    "test:integration:ui": "vitest --ui __tests__/integration"
  }
}
```

### Environment Setup

Create `.env.test` file:

```bash
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/aikit_test
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=test-key
ZERODB_API_KEY=test-key
```

### Docker Services

Start test services with Docker Compose:

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: aikit_test
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
```

```bash
docker-compose -f docker-compose.test.yml up -d
```

## Writing Tests

### Test Helpers

Use provided test helpers for common operations:

```typescript
import {
  createMockAIStream,
  collectStreamData,
  waitFor,
  trackPerformance,
  createDeferred,
} from '../utils/test-helpers';

// Mock AI streaming
const stream = createMockAIStream(['Hello', ' ', 'world'], 50);

// Collect stream data
const chunks = await collectStreamData(stream);

// Wait for condition
await waitFor(() => element.textContent !== '', 1000);

// Track performance
const { duration, result } = await trackPerformance(async () => {
  return await expensiveOperation();
}, 'operation-name');

// Create deferred promise
const { promise, resolve, reject } = createDeferred<string>();
```

### Mock Data

Use mock data fixtures for consistency:

```typescript
import {
  mockMessages,
  mockConversation,
  mockTools,
  mockAgentConfig,
  mockMemoryItems,
} from '../fixtures/mock-data';

// Use in tests
it('should process conversation', async () => {
  const result = await processConversation(mockConversation);
  expect(result).toBeDefined();
});
```

### Testing Patterns

#### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const promise = asyncOperation();

  await waitFor(() => promise.resolved === true);

  const result = await promise;
  expect(result).toBeDefined();
});
```

#### Testing Streaming

```typescript
it('should stream data progressively', async () => {
  const chunks: string[] = [];

  const stream = createMockAIStream(['chunk1', 'chunk2'], 50);
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(new TextDecoder().decode(value));
  }

  expect(chunks.length).toBeGreaterThan(0);
});
```

#### Testing React Hooks

```typescript
it('should use custom hook', async () => {
  const { result } = renderHook(() => useCustomHook());

  expect(result.current.data).toBeNull();

  await act(async () => {
    await result.current.fetchData();
  });

  expect(result.current.data).toBeDefined();
});
```

#### Testing Error Recovery

```typescript
it('should recover from errors', async () => {
  let attempts = 0;

  const operation = async () => {
    attempts++;
    if (attempts < 3) throw new Error('Retry');
    return { success: true };
  };

  // Retry logic
  let result;
  for (let i = 0; i < 3; i++) {
    try {
      result = await operation();
      break;
    } catch (e) {
      if (i === 2) throw e;
    }
  }

  expect(result.success).toBe(true);
});
```

#### Testing Performance

```typescript
it('should meet performance requirements', async () => {
  const { duration, memory } = await trackPerformance(async () => {
    await heavyOperation();
  }, 'heavy-operation');

  expect(duration).toBeLessThan(5000); // 5 seconds
  expect(memory.heapUsed).toBeLessThan(500 * 1024 * 1024); // 500MB
});
```

## Best Practices

### 1. Write Descriptive Test Names

```typescript
// GOOD
it('should stream AI responses and execute calculator tool in parallel', async () => {
  // ...
});

// BAD
it('test streaming', async () => {
  // ...
});
```

### 2. Use AAA Pattern

```typescript
it('should process user message', async () => {
  // Arrange
  const message = { role: 'user', content: 'Hello' };
  const chatbot = createChatbot(config);

  // Act
  const response = await chatbot.processMessage(message);

  // Assert
  expect(response).toBeDefined();
  expect(response.role).toBe('assistant');
});
```

### 3. Test One Thing Per Test

```typescript
// GOOD
it('should add message to history', () => {
  // Test only history addition
});

it('should update conversation metadata', () => {
  // Test only metadata update
});

// BAD
it('should add message and update metadata and trigger event', () => {
  // Testing too many things
});
```

### 4. Clean Up Resources

```typescript
describe('Resource Management', () => {
  let connection: DatabaseConnection;

  beforeEach(async () => {
    connection = await createConnection();
  });

  afterEach(async () => {
    await connection.close();
  });

  it('should query database', async () => {
    const result = await connection.query('SELECT * FROM users');
    expect(result).toBeDefined();
  });
});
```

### 5. Use Realistic Test Data

```typescript
// GOOD
const user = {
  id: 'usr_1234567890',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
};

// BAD
const user = {
  id: 1,
  email: 'a',
  name: 'a',
  createdAt: 0,
};
```

### 6. Handle Timing Issues

```typescript
// Use waitFor for async updates
await waitFor(() => {
  return element.textContent === expectedValue;
}, 1000);

// Don't use arbitrary timeouts
await new Promise(resolve => setTimeout(resolve, 100)); // Flaky!
```

### 7. Test Error Cases

```typescript
describe('Error Handling', () => {
  it('should handle network errors', async () => {
    server.use(
      http.post('/api/chat', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    await expect(sendMessage('test')).rejects.toThrow();
  });

  it('should handle validation errors', async () => {
    const result = await validateInput('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Input required');
  });
});
```

### 8. Measure Performance

```typescript
describe('Performance', () => {
  it('should respond quickly', async () => {
    const start = performance.now();

    await performAction();

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  it('should not leak memory', async () => {
    const before = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      await createAndDestroyObject();
    }

    if (global.gc) global.gc();

    const after = process.memoryUsage().heapUsed;
    const growth = after - before;

    expect(growth).toBeLessThan(10 * 1024 * 1024); // 10MB
  });
});
```

## Debugging

### Debug Single Test

```bash
# Run specific test with debugging
node --inspect-brk ./node_modules/vitest/vitest.mjs run __tests__/integration/core/streaming.test.ts
```

### View Test UI

```bash
pnpm run test:integration:ui
```

### Enable Verbose Output

```typescript
// In test file
import { vi } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'log');
  vi.spyOn(console, 'error');
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});
```

### Use Test Snapshots

```typescript
it('should match snapshot', () => {
  const result = generateComplexObject();
  expect(result).toMatchSnapshot();
});
```

### Debug MSW Handlers

```typescript
import { server } from '../setup';

beforeEach(() => {
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url);
  });
});
```

## CI/CD Integration

### GitHub Actions

Integration tests run automatically on:

- Pull requests
- Pushes to main/develop
- Manual workflow dispatch

### Test Matrix

Tests run on multiple platforms:

- Ubuntu (primary)
- Windows (on main branch)
- macOS (on main branch)

### Required Services

CI pipeline automatically sets up:

- PostgreSQL database
- Redis cache
- Environment variables

### Viewing Results

1. Check workflow status in GitHub Actions tab
2. View detailed logs for each test
3. Download test artifacts (coverage, results)
4. See PR comments with test summary

### Manual Trigger

```bash
gh workflow run integration-tests.yml
```

## Performance Testing

### Performance Benchmarks

Our integration tests enforce these performance requirements:

| Operation | Max Duration | Max Memory |
|-----------|-------------|------------|
| Streaming latency | < 100ms | N/A |
| Agent execution | < 5s | < 500MB |
| Tool execution | < 50ms | N/A |
| Memory retrieval | < 10ms | N/A |
| Workflow completion | < 5s | N/A |

### Writing Performance Tests

```typescript
describe('Performance', () => {
  it('should stream with low latency', async () => {
    const { duration } = await trackPerformance(async () => {
      const stream = await startStream('test');
      await collectStreamData(stream);
    }, 'streaming');

    expect(duration).toBeLessThan(100);
  });

  it('should handle high throughput', async () => {
    const operations = 1000;
    const start = performance.now();

    await Promise.all(
      Array.from({ length: operations }, () => quickOperation())
    );

    const duration = performance.now() - start;
    const opsPerSecond = (operations / duration) * 1000;

    expect(opsPerSecond).toBeGreaterThan(100);
  });
});
```

## Troubleshooting

### Common Issues

#### Tests timing out

```typescript
// Increase timeout for slow operations
it('should handle large dataset', async () => {
  // ...
}, 30000); // 30 second timeout
```

#### Flaky tests

```typescript
// Use retry helper
import { retry } from '../utils/test-helpers';

it('should eventually succeed', async () => {
  await retry(async () => {
    const result = await unreliableOperation();
    expect(result.success).toBe(true);
  }, 3, 1000);
});
```

#### Memory leaks

```typescript
// Ensure cleanup
afterEach(() => {
  // Clear event listeners
  emitter.removeAllListeners();

  // Close connections
  connection.close();

  // Clear timers
  clearInterval(interval);
});
```

#### Mock server not working

```typescript
// Ensure server is reset
beforeEach(() => {
  server.resetHandlers();
});

// Check handler is registered
it('should call API', async () => {
  let called = false;

  server.use(
    http.post('/api/test', () => {
      called = true;
      return HttpResponse.json({ ok: true });
    })
  );

  await makeRequest();

  expect(called).toBe(true);
});
```

### Getting Help

- Check test output for detailed error messages
- Review test logs in CI for additional context
- Use test UI (`pnpm test:integration:ui`) for visual debugging
- Check MSW network logs for API mock issues
- Enable verbose logging for more details

---

## Summary

This guide covers:

- Integration testing philosophy and principles
- Test organization and structure
- Running and writing tests
- Best practices and patterns
- Debugging techniques
- CI/CD integration
- Performance testing
- Troubleshooting

For more information, see:

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [AI Kit API Documentation](/docs/api/)

Last updated: 2024-11-20
