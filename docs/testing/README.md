# AI Kit Testing Documentation

Comprehensive testing resources for the AI Kit framework.

## Quick Start

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Generate coverage report
pnpm test:report

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

## Documentation

### [Unit Testing Guide](./unit-testing-guide.md)
Complete guide to writing and running unit tests in AI Kit. Covers:
- Testing philosophy and principles
- Test structure and organization
- Writing effective tests
- Mocking strategies
- Coverage requirements
- Best practices
- Common testing scenarios
- Troubleshooting

### Test Utilities

AI Kit provides comprehensive testing utilities in the `@ainative/ai-kit-testing` package:

```typescript
import {
  // Test setup and helpers
  setupStreamingTest,
  setupAgentTest,
  waitFor,
  waitForCondition,
  flushPromises,

  // Assertions
  assertValidMessage,
  assertValidUsage,
  assertValidStreamEvent,
  assertValidError,
  assertAsyncThrows,

  // Fixtures
  sampleMessages,
  sampleUsage,
  sampleStreamConfig,
  sampleTools,
  sampleMemoryEntries,

  // Mocks
  createMockFetchResponse,
  createMockStreamingResponse,
  createMockServerResponse,
  createSSEEvent,

  // Custom matchers
  toHaveStreamed,
  toHaveCost,
  toMatchTokenCount,
} from '@ainative/ai-kit-testing';
```

## Coverage Requirements

| Package | Lines | Functions | Branches | Statements |
|---------|-------|-----------|----------|------------|
| core    | 90%   | 90%       | 85%      | 90%        |
| react   | 90%   | 90%       | 85%      | 90%        |
| nextjs  | 90%   | 90%       | 85%      | 90%        |
| tools   | 90%   | 90%       | 85%      | 90%        |
| testing | 90%   | 90%       | 85%      | 90%        |
| cli     | 85%   | 85%       | 80%      | 85%        |

## Test Structure

```
ai-kit/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   └── __tests__/
│   │       ├── streaming/
│   │       ├── agents/
│   │       ├── context/
│   │       ├── memory/
│   │       └── security/
│   ├── react/
│   │   ├── src/
│   │   └── __tests__/
│   │       ├── hooks/
│   │       └── components/
│   └── testing/
│       └── src/
│           ├── test-utils/    # Shared utilities
│           ├── mocks/         # Mock implementations
│           ├── fixtures/      # Test data
│           ├── helpers/       # Helper functions
│           └── matchers/      # Custom matchers
├── vitest.config.ts           # Vitest configuration
└── docs/
    └── testing/
        ├── README.md          # This file
        └── unit-testing-guide.md  # Comprehensive guide
```

## Test Examples

### Testing Streaming

```typescript
import { AIStream } from '@ainative/ai-kit-core';
import {
  createMockStreamingResponse,
  createSSEEvent,
  sampleStreamConfig,
} from '@ainative/ai-kit-testing';

it('should handle streaming tokens', async () => {
  const chunks = [
    createSSEEvent('token', { token: 'Hello' }),
    createSSEEvent('token', { token: ' world' }),
    createSSEEvent('done', '[DONE]'),
  ];

  global.fetch = vi.fn().mockResolvedValue(
    createMockStreamingResponse(chunks)
  );

  const stream = new AIStream(sampleStreamConfig);
  const tokens: string[] = [];

  stream.on('token', (token) => tokens.push(token));
  await stream.send('Test');

  expect(tokens).toEqual(['Hello', ' world']);
});
```

### Testing Agents

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core';
import { MockLLMProvider, sampleTools } from '@ainative/ai-kit-testing';

it('should execute agent with tools', async () => {
  const mockProvider = new MockLLMProvider();
  mockProvider.complete.mockResolvedValue({
    content: 'The result is 42',
    toolCalls: [{
      id: 'call_1',
      name: 'calculator',
      arguments: { operation: 'add', a: 40, b: 2 },
    }],
  });

  const agent = new Agent({
    name: 'TestAgent',
    provider: mockProvider,
    tools: sampleTools,
  });

  const executor = new AgentExecutor(agent);
  const result = await executor.run('What is 40 + 2?');

  expect(result.content).toContain('42');
});
```

### Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAIStream } from '@ainative/ai-kit-react';

it('should send message and receive response', async () => {
  const { result } = renderHook(() =>
    useAIStream({ endpoint: '/api/chat' })
  );

  await act(async () => {
    await result.current.send('Hello');
  });

  expect(result.current.messages).toHaveLength(2);
  expect(result.current.messages[0].role).toBe('user');
  expect(result.current.messages[1].role).toBe('assistant');
});
```

## CI Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Manual workflow dispatch

See `.github/workflows/test.yml` for CI configuration.

### CI Commands

```bash
# Run tests for CI
pnpm test:ci

# Check coverage thresholds
pnpm test:report
```

## Troubleshooting

### Common Issues

**Tests timing out**
```bash
# Increase timeout
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

**Mock not working**
```typescript
// Ensure mock is set up before importing
vi.mock('./module');
import { func } from './module';

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});
```

**Flaky tests**
```typescript
// Use proper async utilities
await waitFor(() => {
  expect(element).toBeVisible();
});
```

### Getting Help

- Check [Unit Testing Guide](./unit-testing-guide.md)
- Review existing tests for examples
- Ask in `#ai-kit-testing` Slack channel
- Create issue with `testing` label

## Best Practices

1. **Write tests first** - Follow TDD principles
2. **Test behavior, not implementation** - Focus on what, not how
3. **Keep tests fast** - Mock slow operations
4. **Use descriptive names** - Make intent clear
5. **One assertion per test** - When practical
6. **Clean up after tests** - Reset state and mocks
7. **Test error cases** - Don't just test happy path
8. **Use fixtures** - Reuse test data
9. **Keep tests independent** - No shared state
10. **Document complex tests** - Add comments explaining why

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Unit Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated**: 2025-01-20
**Version**: 1.0.0
