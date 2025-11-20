# AI Kit Unit Testing Guide

> Comprehensive guide to unit testing in the AI Kit framework

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Testing Patterns](#testing-patterns)
6. [Mocking Strategies](#mocking-strategies)
7. [Coverage Requirements](#coverage-requirements)
8. [Best Practices](#best-practices)
9. [Common Scenarios](#common-scenarios)
10. [Troubleshooting](#troubleshooting)

## Testing Philosophy

### Core Principles

Our testing approach is built on these fundamental principles:

1. **Test Behavior, Not Implementation**: Tests should verify that code does what it's supposed to do, not how it does it.

2. **Isolation**: Each test should be independent and not rely on the state or results of other tests.

3. **Clarity**: Test names and structure should clearly communicate what is being tested and what the expected outcome is.

4. **Maintainability**: Tests should be easy to understand, modify, and extend as the codebase evolves.

5. **Coverage with Purpose**: High coverage is important, but tests should verify meaningful behavior, not just execute code.

### Test Pyramid

We follow the testing pyramid approach:

```
           /\
          /  \
         / E2E \
        /______\
       /        \
      /Integration\
     /____________\
    /              \
   /   Unit Tests   \
  /__________________\
```

- **Unit Tests (Base)**: 70% of tests - Fast, focused, numerous
- **Integration Tests (Middle)**: 20% of tests - Test component interactions
- **E2E Tests (Top)**: 10% of tests - Test complete workflows

## Test Structure

### Project Organization

```
packages/
├── core/
│   ├── src/
│   │   ├── streaming/
│   │   │   ├── AIStream.ts
│   │   │   └── StreamingResponse.ts
│   │   └── agents/
│   │       ├── Agent.ts
│   │       └── AgentExecutor.ts
│   └── __tests__/
│       ├── streaming/
│       │   ├── AIStream.test.ts
│       │   └── StreamingResponse.test.ts
│       └── agents/
│           ├── Agent.test.ts
│           └── AgentExecutor.test.ts
└── testing/
    └── src/
        ├── test-utils/     # Shared test utilities
        ├── mocks/          # Mock implementations
        ├── fixtures/       # Test data
        └── matchers/       # Custom matchers
```

### File Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Spec files: `*.spec.ts` or `*.spec.tsx` (for BDD-style tests)
- Test directories: `__tests__/` adjacent to source or in package root

### Test File Structure

Every test file should follow this structure:

```typescript
/**
 * Brief description of what is being tested
 * Include any special considerations or setup requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThingToTest } from '../../src/path/to/thing';
import { mockDependency } from '@ainative/ai-kit-testing';

describe('ThingToTest', () => {
  // Setup and teardown
  beforeEach(() => {
    // Reset state before each test
  });

  afterEach(() => {
    // Clean up after each test
  });

  // Group related tests
  describe('feature or method name', () => {
    // Test happy path
    it('should do expected thing with valid input', () => {
      // Arrange
      const input = 'valid input';

      // Act
      const result = thingToTest(input);

      // Assert
      expect(result).toBe('expected output');
    });

    // Test edge cases
    it('should handle edge case', () => {
      // Test implementation
    });

    // Test error conditions
    it('should throw error for invalid input', () => {
      expect(() => {
        thingToTest(null);
      }).toThrow('Expected error message');
    });
  });
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests for CI
pnpm test:ci

# Run tests for specific package
cd packages/core && pnpm test

# Run specific test file
pnpm test packages/core/__tests__/streaming/AIStream.test.ts

# Run tests matching pattern
pnpm test --grep "AIStream"
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **Terminal**: Summary displayed after test run
- **HTML**: Open `coverage/index.html` in browser
- **JSON**: Machine-readable format in `coverage/coverage-final.json`
- **LCOV**: For CI integration at `coverage/lcov.info`

### Debugging Tests

```bash
# Run single test file in debug mode
node --inspect-brk node_modules/.bin/vitest run path/to/test.test.ts

# Use VS Code debugger
# Add breakpoint and press F5
```

## Writing Tests

### AAA Pattern (Arrange-Act-Assert)

Always structure tests using the AAA pattern:

```typescript
it('should calculate total with tax', () => {
  // Arrange - Set up test data and conditions
  const price = 100;
  const taxRate = 0.1;

  // Act - Execute the code being tested
  const total = calculateTotal(price, taxRate);

  // Assert - Verify the results
  expect(total).toBe(110);
});
```

### Descriptive Test Names

Test names should clearly describe:
1. What is being tested
2. Under what conditions
3. What the expected result is

```typescript
// ❌ Bad: Vague and unclear
it('works', () => {});
it('test1', () => {});

// ✅ Good: Clear and descriptive
it('should return user data when valid ID provided', () => {});
it('should throw error when user not found', () => {});
it('should emit event after successful save', () => {});
```

### Testing Async Code

```typescript
// Using async/await
it('should fetch user data', async () => {
  const user = await fetchUser(123);
  expect(user.name).toBe('John Doe');
});

// Testing promises
it('should resolve with data', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined();
  });
});

// Testing promise rejections
it('should reject with error', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Invalid ID');
});
```

### Testing Event Emitters

```typescript
import { waitForEvent } from '@ainative/ai-kit-testing';

it('should emit token event', async () => {
  const stream = new AIStream(config);

  // Method 1: Using helper
  const tokenPromise = waitForEvent(stream, 'token');
  stream.send('Test');
  const token = await tokenPromise;
  expect(token).toBe('Hello');

  // Method 2: Using spy
  const tokenSpy = vi.fn();
  stream.on('token', tokenSpy);
  await stream.send('Test');
  expect(tokenSpy).toHaveBeenCalledWith('Hello');
});
```

### Testing Errors

```typescript
// Synchronous errors
it('should throw error for invalid input', () => {
  expect(() => {
    divide(10, 0);
  }).toThrow('Cannot divide by zero');
});

// Async errors
it('should reject with error', async () => {
  await expect(asyncOperation()).rejects.toThrow('Operation failed');
});

// Error properties
it('should throw error with code', () => {
  try {
    riskyOperation();
    fail('Should have thrown');
  } catch (error) {
    expect(error.code).toBe('ERR_INVALID');
    expect(error.message).toContain('invalid');
  }
});
```

## Testing Patterns

### Unit Test Patterns

#### 1. Equivalence Partitioning

Test representative values from different input categories:

```typescript
describe('validateAge', () => {
  it('should accept valid adult age', () => {
    expect(validateAge(25)).toBe(true);
  });

  it('should reject negative age', () => {
    expect(validateAge(-5)).toBe(false);
  });

  it('should reject age above maximum', () => {
    expect(validateAge(150)).toBe(false);
  });
});
```

#### 2. Boundary Value Analysis

Test values at the boundaries of input ranges:

```typescript
describe('isValidScore', () => {
  // Test boundaries
  it('should accept minimum valid score', () => {
    expect(isValidScore(0)).toBe(true);
  });

  it('should accept maximum valid score', () => {
    expect(isValidScore(100)).toBe(true);
  });

  it('should reject below minimum', () => {
    expect(isValidScore(-1)).toBe(false);
  });

  it('should reject above maximum', () => {
    expect(isValidScore(101)).toBe(false);
  });
});
```

#### 3. State-Based Testing

Test object state transitions:

```typescript
describe('Document state transitions', () => {
  let doc: Document;

  beforeEach(() => {
    doc = new Document();
  });

  it('should start in draft state', () => {
    expect(doc.getState()).toBe('draft');
  });

  it('should transition from draft to published', () => {
    doc.publish();
    expect(doc.getState()).toBe('published');
  });

  it('should not allow draft to archived transition', () => {
    expect(() => doc.archive()).toThrow('Cannot archive draft');
  });
});
```

#### 4. Parameterized Tests

Test multiple scenarios with different inputs:

```typescript
describe.each([
  { input: 'hello', expected: 'HELLO' },
  { input: 'World', expected: 'WORLD' },
  { input: '123', expected: '123' },
  { input: '', expected: '' },
])('toUpperCase($input)', ({ input, expected }) => {
  it(`should convert "${input}" to "${expected}"`, () => {
    expect(toUpperCase(input)).toBe(expected);
  });
});
```

### Integration Test Patterns

#### Testing Component Integration

```typescript
describe('UserService integration', () => {
  let userService: UserService;
  let database: Database;

  beforeEach(async () => {
    database = await createTestDatabase();
    userService = new UserService(database);
  });

  afterEach(async () => {
    await database.close();
  });

  it('should save and retrieve user', async () => {
    const user = { name: 'John', email: 'john@example.com' };

    await userService.create(user);
    const retrieved = await userService.findByEmail(user.email);

    expect(retrieved).toMatchObject(user);
  });
});
```

### Snapshot Testing

Use snapshots for UI components and complex data structures:

```typescript
import { render } from '@testing-library/react';

it('should match snapshot', () => {
  const { container } = render(<MyComponent prop="value" />);
  expect(container).toMatchSnapshot();
});

// Update snapshots with: pnpm test -- -u
```

**Warning**: Use snapshots judiciously. They can make tests brittle.

## Mocking Strategies

### When to Mock

Mock external dependencies when:
- Testing would be slow (network requests, file I/O)
- Testing would be unreliable (external services)
- Testing would have side effects (database writes)
- You want to test error scenarios

### Manual Mocks

```typescript
// Create mock implementation
const mockFetch = vi.fn();

// Set return value
mockFetch.mockResolvedValue({ data: 'test' });

// Use in test
global.fetch = mockFetch;

// Verify calls
expect(mockFetch).toHaveBeenCalledWith(
  'https://api.example.com',
  expect.objectContaining({ method: 'POST' })
);
```

### Using AI Kit Testing Utilities

```typescript
import {
  createMockFetchResponse,
  createMockStreamingResponse,
  createMockServerResponse,
} from '@ainative/ai-kit-testing';

it('should handle fetch response', async () => {
  const mockResponse = createMockFetchResponse(
    { data: 'test' },
    { status: 200 }
  );

  global.fetch = vi.fn().mockResolvedValue(mockResponse);

  const result = await fetchData();
  expect(result.data).toBe('test');
});
```

### Mocking Modules

```typescript
// Mock entire module
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: 'Hi' }] }),
      },
    },
  })),
}));

// Partial module mock
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    readFile: vi.fn(),
  };
});
```

### Spy on Existing Functions

```typescript
it('should call internal method', () => {
  const instance = new MyClass();
  const spy = vi.spyOn(instance, 'internalMethod');

  instance.publicMethod();

  expect(spy).toHaveBeenCalled();
  spy.mockRestore(); // Restore original
});
```

## Coverage Requirements

### Package-Specific Targets

| Package | Lines | Functions | Branches | Statements |
|---------|-------|-----------|----------|------------|
| core    | 90%   | 90%       | 85%      | 90%        |
| react   | 90%   | 90%       | 85%      | 90%        |
| nextjs  | 90%   | 90%       | 85%      | 90%        |
| tools   | 90%   | 90%       | 85%      | 90%        |
| testing | 90%   | 90%       | 85%      | 90%        |
| cli     | 85%   | 85%       | 80%      | 85%        |

### Checking Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html

# Check if thresholds are met
pnpm test:ci
```

### Coverage Exclusions

Some code is intentionally excluded from coverage:

- Type definitions (`*.d.ts`)
- Index/barrel files (`index.ts`)
- Mock implementations
- Development-only code
- Intentionally unreachable error handlers

Mark code for exclusion with comments:

```typescript
/* istanbul ignore next */
function unreachableErrorHandler() {
  throw new Error('This should never happen');
}
```

## Best Practices

### Do's

✅ **Write tests first** (TDD): Red → Green → Refactor

✅ **One assertion per test** (when practical)
```typescript
it('should set name', () => {
  user.setName('John');
  expect(user.getName()).toBe('John');
});

it('should trim name', () => {
  user.setName('  John  ');
  expect(user.getName()).toBe('John');
});
```

✅ **Test the public API**: Don't test private methods directly

✅ **Use descriptive variable names** in tests
```typescript
const validUser = { name: 'John', age: 30 };
const invalidUser = { name: '', age: -5 };
```

✅ **Clean up after tests**: Reset mocks, close connections

✅ **Test error messages**: They're part of your API
```typescript
expect(error.message).toContain('expected error text');
```

### Don'ts

❌ **Don't test implementation details**
```typescript
// Bad: Testing internal state
expect(component._internalState).toBe(true);

// Good: Testing behavior
expect(component.isActive()).toBe(true);
```

❌ **Don't share state between tests**
```typescript
// Bad: Shared state
let user;
beforeAll(() => {
  user = new User();
});

// Good: Fresh state per test
beforeEach(() => {
  user = new User();
});
```

❌ **Don't test third-party libraries**: Trust they work

❌ **Don't write overly complex tests**: If test is complex, refactor code

❌ **Don't ignore flaky tests**: Fix them or remove them

### Performance Considerations

- Keep tests fast (< 1ms for unit tests)
- Use `beforeAll` for expensive setup when safe
- Mock slow operations (network, file I/O)
- Run tests in parallel (default in Vitest)
- Use `test.concurrent` for independent tests

```typescript
describe.concurrent('independent tests', () => {
  it('test 1', async () => { /* ... */ });
  it('test 2', async () => { /* ... */ });
});
```

## Common Scenarios

### Testing Streaming

```typescript
import {
  createMockStreamingResponse,
  createSSEEvent,
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

  const stream = new AIStream(config);
  const tokens: string[] = [];

  stream.on('token', (token) => tokens.push(token));
  await stream.send('Test');

  expect(tokens).toEqual(['Hello', ' world']);
});
```

### Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

it('should increment counter', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

it('should call onClick when clicked', () => {
  const handleClick = vi.fn();

  render(<Button onClick={handleClick}>Click me</Button>);

  fireEvent.click(screen.getByText('Click me'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Context Providers

```typescript
import { render } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider';

it('should provide theme to children', () => {
  const { getByText } = render(
    <ThemeProvider theme="dark">
      <Consumer />
    </ThemeProvider>
  );

  expect(getByText('dark')).toBeInTheDocument();
});
```

### Testing Agents

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core';
import { MockLLMProvider } from '@ainative/ai-kit-testing';

it('should execute agent with tools', async () => {
  const mockProvider = new MockLLMProvider();
  mockProvider.complete.mockResolvedValue({
    content: 'The result is 42',
    toolCalls: [
      {
        id: 'call_1',
        name: 'calculator',
        arguments: { operation: 'add', a: 40, b: 2 },
      },
    ],
  });

  const agent = new Agent({
    name: 'TestAgent',
    provider: mockProvider,
    tools: [calculatorTool],
  });

  const executor = new AgentExecutor(agent);
  const result = await executor.run('What is 40 + 2?');

  expect(result.content).toContain('42');
});
```

## Troubleshooting

### Common Issues

#### Tests Time Out

```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  await slowOperation();
}, 10000); // 10 second timeout

// Or use vi.setConfig
beforeAll(() => {
  vi.setConfig({ testTimeout: 10000 });
});
```

#### Mock Not Working

```typescript
// Ensure mock is set up before importing module
vi.mock('./module');
import { function } from './module'; // Mock is applied

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});
```

#### Async Tests Hanging

```typescript
// Ensure promises are awaited
it('should complete', async () => {
  await asyncOperation(); // Don't forget await!
});

// Clean up event listeners
afterEach(() => {
  emitter.removeAllListeners();
});
```

#### Flaky Tests

```typescript
// Add explicit waits
await waitFor(() => {
  expect(element).toBeVisible();
});

// Use proper async utilities
await act(async () => {
  await userEvent.click(button);
});
```

### Debugging Tips

1. **Use `console.log`** liberally during debugging
2. **Run single test** to isolate issues
3. **Use VS Code debugger** with breakpoints
4. **Check mock calls**: `console.log(mockFn.mock.calls)`
5. **Verify test isolation**: Run tests in different orders

### Getting Help

- Check existing tests for examples
- Review [Vitest documentation](https://vitest.dev)
- Ask in team Slack channel `#ai-kit-testing`
- Create issue with `testing` label

## Appendix

### Useful Testing Resources

- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Library Docs](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

### Custom Matchers

AI Kit provides custom matchers in `@ainative/ai-kit-testing/matchers`:

- `toHaveStreamed()` - Check streaming completion
- `toHaveCost()` - Verify token costs
- `toMatchTokenCount()` - Check token counts
- `toHaveError()` - Verify error properties

```typescript
import '@ainative/ai-kit-testing/matchers';

expect(stream).toHaveStreamed({ tokens: ['Hello', 'world'] });
expect(usage).toHaveCost({ min: 0.001, max: 0.01 });
```

### Test Fixtures

Reusable test data is available in `@ainative/ai-kit-testing/fixtures`:

```typescript
import {
  sampleMessages,
  sampleUsage,
  sampleStreamConfig,
  sampleTools,
} from '@ainative/ai-kit-testing';

it('should process messages', () => {
  const result = processMessages(sampleMessages);
  expect(result).toBeDefined();
});
```

---

**Last Updated**: 2025-01-20
**Version**: 1.0.0
**Maintainers**: AI Kit Core Team
