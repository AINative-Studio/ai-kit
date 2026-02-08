# AI Kit Integration Tests

Comprehensive integration test suite for testing cross-package interactions and real-world workflows in AI Kit.

## Overview

This directory contains integration tests that verify the correct interaction between multiple AI Kit packages, ensuring that the entire system works together seamlessly. Unlike unit tests that test individual components in isolation, these integration tests validate complete workflows and data flows across package boundaries.

## Test Structure

```
__tests__/integration/
├── cross-package/              # Cross-package integration tests
│   ├── core-video-integration.test.ts
│   ├── core-auth-integration.test.ts
│   ├── core-zerodb-integration.test.ts
│   ├── core-react-integration.test.tsx
│   └── error-handling-comprehensive.test.ts
├── workflows/                  # End-to-end workflow tests
│   ├── agent-orchestration-complete.test.ts
│   ├── camera-recording-transcription.test.ts
│   ├── screen-recording-pip.test.ts
│   └── beta-signup-feedback.test.ts
├── core/                      # Core package integration tests
├── react/                     # React package integration tests
├── nextjs/                    # Next.js package integration tests
├── scenarios/                 # Real-world scenario tests
├── benchmarks/               # Performance benchmarks
├── fixtures/                 # Test data and fixtures
├── utils/                    # Test utilities
├── setup.ts                  # Test setup and mocks
├── vitest.config.ts          # Vitest configuration
└── README.md                 # This file
```

## Test Categories

### 1. Cross-Package Integration Tests

Tests that verify proper integration between different packages:

#### Core + Video Integration
- **File**: `cross-package/core-video-integration.test.ts`
- **Coverage**:
  - Video recording with session management
  - Video processing with token counting
  - Streaming video analysis
  - Complete video recording workflows
  - Performance and resource management
  - Error handling across packages

#### Core + Auth Integration
- **File**: `cross-package/core-auth-integration.test.ts`
- **Coverage**:
  - Authenticated session creation
  - Token refresh with session persistence
  - Secure context management
  - Multi-user session isolation
  - Session lifecycle with authentication
  - Error handling with auth failures

#### Core + ZeroDB Integration
- **File**: `cross-package/core-zerodb-integration.test.ts`
- **Coverage**:
  - Session memory persistence
  - Vector search with context management
  - RAG (Retrieval Augmented Generation) workflows
  - Long-term memory with token optimization
  - Memory cleanup and maintenance
  - Multi-session memory sharing

### 2. Workflow Integration Tests

End-to-end tests that simulate complete user workflows:

#### Agent Orchestration
- **File**: `workflows/agent-orchestration-complete.test.ts`
- **Coverage**:
  - Agent creation and configuration
  - Tool calling and execution
  - Streaming responses to UI
  - Multi-turn conversations with context
  - Error recovery strategies
  - Performance with concurrent sessions

#### Error Handling
- **File**: `cross-package/error-handling-comprehensive.test.ts`
- **Coverage**:
  - Network failures and timeouts
  - API errors (rate limits, auth, validation)
  - Resource exhaustion
  - Cascading failures
  - Error propagation and logging
  - Recovery strategies (circuit breaker, retry, graceful degradation)

### 3. Real-World Scenarios

Tests that simulate actual user scenarios:

- Video recording with transcription
- Screen recording with picture-in-picture
- Beta signup with feedback collection
- Chatbot workflows
- Multi-agent interactions

## Running Tests

### Run All Integration Tests
```bash
pnpm test:integration
```

### Run Specific Test Suite
```bash
# Core + Video integration
pnpm test:integration --testNamePattern="Core \\+ Video"

# Core + Auth integration
pnpm test:integration --testNamePattern="Core \\+ Auth"

# Core + ZeroDB integration
pnpm test:integration --testNamePattern="Core \\+ ZeroDB"

# Agent orchestration
pnpm test:integration --testNamePattern="Agent Orchestration"

# Error handling
pnpm test:integration --testNamePattern="Error Handling"
```

### Run with Coverage
```bash
pnpm test:integration:coverage
```

### Run in Watch Mode
```bash
pnpm test:integration:watch
```

### Run with UI
```bash
pnpm test:integration:ui
```

### Run Performance Tests Only
```bash
pnpm test:integration:performance
```

## Test Configuration

Integration tests use a separate configuration file (`vitest.config.ts`) with settings optimized for integration testing:

- **Timeout**: 30 seconds (longer than unit tests)
- **Environment**: jsdom (browser-like environment)
- **Test Isolation**: Each test runs in isolation
- **Parallelization**: Tests run in parallel with thread pool
- **Coverage Thresholds**:
  - Lines: 90%
  - Functions: 90%
  - Branches: 85%
  - Statements: 90%

## Mock Services

Integration tests use MSW (Mock Service Worker) to mock external APIs:

### Mocked Services
- **OpenAI API**: Chat completions, streaming, assistants, tool calls
- **ZeroDB API**: Vector storage, memory operations, search
- **Auth API**: Login, token refresh, validation, logout
- **Tool APIs**: Calculator, search, weather, and custom tools

### Mock Configuration
All mocks are configured in `setup.ts`:
- Request/response handlers
- Error scenarios
- Rate limiting simulation
- Network failure simulation
- Streaming responses
- Tool execution

## Writing Integration Tests

### Test Structure

Follow the AAA (Arrange-Act-Assert) pattern:

```typescript
it('should execute complete workflow', async () => {
  // Arrange - Setup test data and dependencies
  const sessionManager = new SessionManager({
    storage: { type: 'memory' },
  });

  const session = await sessionManager.createSession({
    userId: 'test-user',
  });

  // Act - Execute the operation
  const result = await someOperation(session);

  // Assert - Verify the outcome
  expect(result).toBeDefined();
  expect(result.status).toBe('success');
});
```

### Best Practices

1. **Test Real Workflows**: Focus on testing complete user workflows, not individual functions
2. **Use Realistic Data**: Use data that resembles production scenarios
3. **Clean Up Resources**: Always clean up resources (sessions, streams, etc.)
4. **Handle Async Operations**: Use proper async/await patterns
5. **Test Error Cases**: Include negative test cases and error scenarios
6. **Performance Testing**: Include performance assertions where appropriate
7. **Avoid Test Interdependence**: Tests should not depend on each other
8. **Document Test Intent**: Use descriptive test names that explain what is being tested

### Example Integration Test

```typescript
describe('Video Recording with AI Analysis', () => {
  it('should record, transcribe, and analyze video', async () => {
    // Arrange
    const session = await sessionManager.createSession({
      userId: 'test-user',
      metadata: { workflow: 'video-analysis' },
    });

    // Act - Record video
    const recorder = new ScreenRecorder({ quality: 'high' });
    await recorder.start();
    await new Promise(resolve => setTimeout(resolve, 100));
    const video = await recorder.stop();

    // Simulate transcription
    const transcript = 'User clicked the login button';

    // AI analysis
    const analysis = await analyzeTranscript(transcript);

    // Store in session
    await sessionManager.updateSession(session.id, {
      metadata: {
        ...session.metadata,
        videoSize: video.size,
        transcript,
        analysis,
      },
    });

    // Assert
    const finalSession = await sessionManager.getSession(session.id);
    expect(finalSession?.metadata.videoSize).toBeGreaterThan(0);
    expect(finalSession?.metadata.transcript).toBe(transcript);
    expect(finalSession?.metadata.analysis).toBeDefined();
  });
});
```

## Debugging Tests

### Enable Verbose Logging
```bash
DEBUG=* pnpm test:integration
```

### Run Single Test File
```bash
pnpm test:integration cross-package/core-video-integration.test.ts
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Integration Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test:integration", "--inspect-brk"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## CI/CD Integration

Integration tests run automatically in CI/CD pipelines:

### GitHub Actions Workflow
- **File**: `.github/workflows/integration-tests.yml`
- **Triggers**: Push to main/develop, pull requests, manual dispatch
- **Matrix Strategy**: Tests run in parallel for different suites
- **Coverage**: Coverage reports uploaded to Codecov
- **Performance**: Performance benchmarks tracked
- **Summary**: Automatic test summary and PR comments

### CI/CD Stages
1. **Build**: Build all packages
2. **Test Matrix**: Run integration tests in parallel
   - Core + Video
   - Core + Auth
   - Core + ZeroDB
   - Workflows
   - Error Handling
3. **Coverage**: Generate and validate coverage reports
4. **Performance**: Run performance benchmarks (on push only)
5. **Summary**: Generate test summary report and comment on PR

### Coverage Requirements
Tests must meet minimum coverage thresholds:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Test Utilities

### Helper Functions
Located in `setup.ts`:

- `waitForAsync(ms)`: Wait for async operations
- `createMockStream(chunks)`: Create mock ReadableStream
- `collectStreamChunks(stream)`: Collect all chunks from stream
- `generateMockConversation(count)`: Generate test conversation data
- `generateMockAgent(overrides)`: Generate test agent configuration
- `measurePerformance(fn, maxDuration)`: Measure operation performance
- `checkMemoryLeaks()`: Detect memory leaks
- `retry(fn, maxAttempts, delay)`: Retry flaky operations
- `cleanup()`: Clean up test resources

### Using Test Utilities

```typescript
import {
  waitForAsync,
  retry,
  measurePerformance,
  checkMemoryLeaks,
} from '../setup';

// Wait for async operations
await waitForAsync(100);

// Retry flaky operations
const result = await retry(async () => {
  return await fetchData();
}, 3, 1000);

// Measure performance
const { result, duration } = await measurePerformance(async () => {
  return await heavyOperation();
}, 5000);

// Check for memory leaks
checkMemoryLeaks();
```

## Performance Testing

Performance tests ensure that integrations meet performance targets:

### Performance Metrics
- Operation duration
- Memory usage
- Token consumption
- API call count
- Stream chunk delivery time
- Concurrent operation handling

### Performance Thresholds
- AI completions: < 5 seconds
- Video recording start: < 1 second
- Session operations: < 100ms
- Memory usage: < 500MB
- Token counting: < 100ms
- Context operations: < 1 second

### Running Performance Tests
```bash
pnpm test:integration:performance
```

Performance tests are tagged with "Performance" in their names and can be run separately.

## Troubleshooting

### Common Issues

#### 1. Timeout Errors
- Increase test timeout in `vitest.config.ts`
- Check for unresolved promises
- Ensure proper cleanup in afterEach
- Verify async operations are awaited

#### 2. Mock Not Working
- Verify MSW server is started in setup
- Check mock handler URLs match exactly
- Ensure request body format matches
- Check HTTP method (GET, POST, etc.) matches

#### 3. Memory Leaks
- Use `checkMemoryLeaks()` utility
- Ensure streams are properly closed
- Clean up event listeners
- Reset mocks in afterEach
- Close sessions after tests

#### 4. Flaky Tests
- Use `retry()` utility for network operations
- Add proper waits for async operations
- Avoid relying on timing
- Use deterministic test data
- Isolate test state

#### 5. Coverage Issues
- Ensure all code paths are tested
- Add negative test cases
- Test error scenarios
- Test edge cases
- Check coverage report for gaps

### Getting Help

- Check existing test examples
- Review test utilities in `setup.ts`
- See package documentation
- Check CI/CD logs for failures
- Open an issue on GitHub

## Coverage Reports

Coverage reports are generated after test runs:

### View HTML Report
```bash
open coverage/index.html
```

### View Text Report
Coverage summary is printed to console after test run.

### CI Coverage
Coverage is automatically uploaded to Codecov in CI/CD pipeline.

### Coverage Badges
Add coverage badge to README:
```markdown
[![Integration Coverage](https://codecov.io/gh/AINative-Studio/ai-kit/branch/main/graph/badge.svg?flag=integration)](https://codecov.io/gh/AINative-Studio/ai-kit)
```

## Contributing

When adding new integration tests:

1. Follow existing test structure and patterns
2. Add descriptive test names that explain the scenario
3. Include both positive and negative test cases
4. Add error handling tests
5. Update this README if adding new test categories
6. Ensure tests pass locally before pushing
7. Add appropriate mocks for external services
8. Document any special setup requirements
9. Add performance tests for critical paths
10. Keep tests focused and independent

### Test Naming Convention
```typescript
// Good
it('should create authenticated session after successful login')
it('should handle rate limit errors with exponential backoff')

// Bad
it('test session')
it('auth error')
```

## Test Maintenance

### Regular Tasks
- Review and update mocks to match current APIs
- Update coverage thresholds as codebase grows
- Add tests for new package integrations
- Remove obsolete tests
- Optimize slow tests
- Update documentation
- Monitor flaky tests
- Review test execution times

### Monitoring
- Track test execution time trends
- Monitor flaky test reports
- Review coverage trends
- Check performance benchmarks
- Analyze test failures in CI

### Refactoring Tests
When refactoring:
- Keep tests passing during refactoring
- Update mocks to match new APIs
- Maintain test coverage
- Update documentation
- Keep tests isolated and independent

## Best Practices Summary

1. **Isolation**: Each test should be independent
2. **Clarity**: Use descriptive names and comments
3. **Coverage**: Test happy paths, edge cases, and errors
4. **Performance**: Include performance assertions
5. **Cleanup**: Always clean up resources
6. **Mocking**: Use realistic mocks
7. **Documentation**: Keep README up to date
8. **CI Integration**: Ensure tests run in CI
9. **Debugging**: Make tests easy to debug
10. **Maintenance**: Regularly review and update tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library](https://testing-library.com/)
- [AI Kit Documentation](https://ainative.studio/ai-kit)
- [Contributing Guide](../../CONTRIBUTING.md)

## License

MIT - See LICENSE file for details
