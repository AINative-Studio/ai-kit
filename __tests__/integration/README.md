# Integration Tests

Comprehensive integration tests for the AI Kit framework.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all integration tests
pnpm test:integration

# Run in watch mode
pnpm test:integration:watch

# Run with coverage
pnpm test:integration:coverage

# Run with UI
pnpm test:integration:ui
```

## Test Structure

```
__tests__/integration/
├── setup.ts                    # Global test setup
├── utils/                      # Test utilities and helpers
├── fixtures/                   # Mock data and fixtures
├── core/                       # Core package tests (45 tests)
├── react/                      # React package tests (63 tests)
├── nextjs/                     # Next.js package tests (35 tests)
├── tools/                      # Tools package tests
├── cli/                        # CLI package tests
├── cross-package/              # Cross-package integration (40 tests)
└── scenarios/                  # End-to-end scenarios (35 tests)
```

## Test Categories

### Core Tests
- **Streaming with Tools**: AI streaming + tool execution
- **Agent with Memory**: Memory management and persistence
- **Multi-Agent Workflow**: Agent swarm coordination
- **RLHF Pipeline**: Logging, feedback, analytics

### React Tests
- **Hooks Integration**: Multiple hooks working together
- **Streaming UI**: Real-time UI updates
- **State Persistence**: LocalStorage and cross-tab sync

### Next.js Tests
- **App Router**: Server/client components, streaming
- **API Routes**: Route handlers and middleware
- **Middleware Chain**: Multiple middleware execution

### Cross-Package Tests
- **Core + React**: Integration between packages
- **Next.js Full-Stack**: Complete stack testing
- **CLI Template Validation**: Generated projects

### Scenario Tests
- **Chatbot Workflow**: Complete user journey
- **Agent Dashboard**: Multi-agent coordination
- **Data Analysis**: Data processing pipeline

## Test Statistics

- **Total Tests**: 218+
- **Test Files**: 10
- **Test Utilities**: 20+
- **Mock Fixtures**: 15+
- **Coverage Target**: 70%

## Writing Tests

### Test Template

```typescript
describe('Feature Integration', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Sub-feature', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const input = setupInput();

      // Act
      const result = await performAction(input);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### Using Test Helpers

```typescript
import {
  createMockAIStream,
  collectStreamData,
  waitFor,
  trackPerformance,
} from './utils/test-helpers';

// Mock streaming
const stream = createMockAIStream(['Hello', 'World'], 50);

// Collect data
const chunks = await collectStreamData(stream);

// Wait for condition
await waitFor(() => condition === true, 1000);

// Track performance
const { duration } = await trackPerformance(async () => {
  await operation();
}, 'operation-name');
```

### Using Mock Data

```typescript
import {
  mockMessages,
  mockTools,
  mockAgentConfig,
} from './fixtures/mock-data';

it('should process conversation', async () => {
  const result = await processConversation(mockMessages);
  expect(result).toBeDefined();
});
```

## Performance Requirements

| Operation | Max Duration |
|-----------|-------------|
| Streaming | < 100ms |
| Agent execution | < 5s |
| Tool execution | < 50ms |
| Memory retrieval | < 10ms |

## CI/CD

Integration tests run automatically on:

- Pull requests to main/develop
- Pushes to main/develop
- Manual workflow dispatch

Tests run on:
- Ubuntu (primary)
- Windows
- macOS

## Documentation

See [Integration Testing Guide](../../docs/testing/integration-testing-guide.md) for:

- Testing philosophy
- Writing guidelines
- Best practices
- Debugging tips
- Troubleshooting

## Dependencies

- Vitest - Test runner
- Testing Library - React testing
- MSW - API mocking
- jsdom - DOM environment

## Environment

Create `.env.test`:

```bash
NODE_ENV=test
OPENAI_API_KEY=test-key
ZERODB_API_KEY=test-key
DATABASE_URL=postgresql://test:test@localhost:5432/aikit_test
REDIS_URL=redis://localhost:6379
```

## Debugging

```bash
# Debug single test
node --inspect-brk ./node_modules/vitest/vitest.mjs run path/to/test

# Use UI mode
pnpm test:integration:ui

# Enable verbose logging
DEBUG=* pnpm test:integration
```

## Contributing

When adding new tests:

1. Follow the AAA pattern (Arrange-Act-Assert)
2. Write descriptive test names
3. Clean up resources in afterEach
4. Include performance tests
5. Test error scenarios
6. Update documentation

## Support

For issues or questions:

1. Check the [Integration Testing Guide](../../docs/testing/integration-testing-guide.md)
2. Review existing tests for examples
3. Check test output for error details
4. Use test UI for visual debugging

---

Last updated: 2024-11-20
Total tests: 218+
