# Integration Test Suite

Comprehensive integration tests for AINative AI Kit merged features, covering complete workflows from input to output with realistic scenarios.

## Overview

This test suite validates the integration of newly merged features across multiple packages:

- **Video Recording Workflows**: Camera/screen recording → transcription → storage
- **Community Features**: Beta signup → feedback collection → analytics
- **Performance Benchmarks**: Video encoding, transcription latency, feedback submission

## Test Structure

```
__tests__/integration/
├── workflows/                    # End-to-end workflow tests
│   ├── camera-recording-transcription.test.ts
│   ├── screen-recording-pip.test.ts
│   └── beta-signup-feedback.test.ts
├── benchmarks/                   # Performance benchmarks
│   ├── video-performance.bench.ts
│   ├── transcription-performance.bench.ts
│   └── feedback-performance.bench.ts
├── fixtures/                     # Test data and fixtures
├── setup.ts                      # Global test setup
└── vitest.config.ts             # Integration test configuration
```

## Running Tests

### Run All Integration Tests

```bash
# From project root
npm run test:integration

# With coverage
npm run test:integration:coverage
```

### Run Specific Test Suites

```bash
# Video workflows only
npm run test:integration -- workflows/camera-recording
npm run test:integration -- workflows/screen-recording

# Feedback workflows only
npm run test:integration -- workflows/beta-signup

# All workflows
npm run test:integration -- workflows/
```

### Run Performance Benchmarks

```bash
# All benchmarks
npm run test:bench

# Specific benchmarks
npm run test:bench -- benchmarks/video-performance
npm run test:bench -- benchmarks/transcription-performance
npm run test:bench -- benchmarks/feedback-performance
```

### CI/CD Pipeline

```bash
# Run in CI mode (no watch, with coverage)
npm run test:ci
```

## Test Coverage

### Camera Recording → Transcription Workflow

Tests the complete flow from camera initialization through audio transcription:

**Given**: User wants to record and transcribe camera feed
**When**: They start camera recording with audio
**Then**:
- Camera stream initializes with correct settings
- Video and audio tracks are accessible
- Audio can be extracted for transcription
- Transcription completes successfully with OpenAI Whisper
- Resources are properly cleaned up

**Test Scenarios**:
- ✅ Camera initialization with different resolutions (720p, 1080p, 4K)
- ✅ Audio track extraction and blob creation
- ✅ Transcription with Whisper API
- ✅ Error handling (permission denied, hardware not found)
- ✅ Resource cleanup and memory management
- ✅ Multiple camera configurations (front/rear, framerates)

**Coverage Target**: 90%+

### Screen Recording → PIP Composition Workflow

Tests screen recording with Picture-in-Picture overlay and export:

**Given**: User wants to record screen with PIP overlay
**When**: They start screen recording
**Then**:
- Screen capture initializes with quality settings
- Cursor visibility is configurable
- Recording produces valid blob with URL
- Pause/resume operations work correctly
- Resources cleanup properly

**Test Scenarios**:
- ✅ Quality presets (low, medium, high, ultra)
- ✅ Cursor modes (always, never, motion)
- ✅ Pause and resume functionality
- ✅ Multiple stream composition
- ✅ Error handling (user cancels, not supported)
- ✅ State management and validation
- ✅ Video export in multiple formats

**Coverage Target**: 90%+

### Beta Signup → Feedback Collection Workflow

Tests the complete feedback loop from signup to analytics:

**Given**: New user signs up for beta program
**When**: They complete signup and use the platform
**Then**:
- Session is tracked correctly
- Interactions are logged with metadata
- Feedback is collected across multiple types
- Analytics aggregation works correctly
- Data export functions properly

**Test Scenarios**:
- ✅ Session tracking and user journey
- ✅ Interaction logging with context
- ✅ Binary feedback (thumbs up/down)
- ✅ Rating feedback (1-5 stars)
- ✅ Text feedback with sentiment
- ✅ Multi-dimensional feedback
- ✅ Batch operations for performance
- ✅ Analytics aggregation and stats
- ✅ Cross-session tracking
- ✅ Data export in JSON format

**Coverage Target**: 90%+

## Performance Benchmarks

### Video Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Initialize ScreenRecorder | < 10ms | ✅ Passing |
| Get quality configuration | < 1ms | ✅ Passing |
| Check recording state | < 0.1ms | ✅ Passing |
| Create video blob (1MB) | < 100ms | ✅ Passing |
| Encode 1080p @ 30fps | < 33ms/frame | ✅ Passing |
| Encode 4K @ 30fps | < 33ms/frame | ✅ Passing |

### Transcription Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Format 100 segments | < 10ms | ✅ Passing |
| Extract speakers (1h) | < 1s | ✅ Passing |
| Cost estimation | < 0.01ms | ✅ Passing |
| Process 1min metadata | < 100ms | ✅ Passing |
| Process 10min metadata | < 500ms | ✅ Passing |

### Feedback Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Submit single feedback | < 10ms | ✅ Passing |
| Batch submit 100 items | < 100ms | ✅ Passing |
| Calculate stats (1000) | < 50ms | ✅ Passing |
| Aggregate 10k items | < 1s | ✅ Passing |
| Export 5k items JSON | < 500ms | ✅ Passing |

## BDD Test Style

All integration tests follow BDD (Behavior-Driven Development) style using Given-When-Then:

```typescript
describe('Given a user wants to record their screen with PIP overlay', () => {
  describe('When they start screen recording', () => {
    it('Then the screen capture should initialize with correct quality settings', async () => {
      // Arrange (Given)
      const recorder = new ScreenRecorder({
        quality: 'high',
        cursor: 'always',
        audio: false,
      })

      // Act (When)
      await recorder.startRecording()

      // Assert (Then)
      expect(recorder.isRecording()).toBe(true)
      expect(recorder.getState()).toBe('recording')
    })
  })
})
```

## Test Data & Fixtures

### Mock Media Streams

```typescript
const mockStream = createMockMediaStream({
  hasVideo: true,
  hasAudio: true,
})
```

### Mock Files

```typescript
const audioFile = createMockFile(
  'audio content',
  'recording.webm',
  'audio/webm'
)

const videoBlob = createMockVideoBlob(10) // 10MB video
```

### Mock Feedback Data

```typescript
const feedback = {
  id: 'feedback-1',
  interactionId: 'int-1',
  type: FeedbackType.BINARY,
  data: {
    value: BinaryFeedback.THUMBS_UP,
    timestamp: new Date(),
  },
  userId: 'user-123',
  sessionId: 'session-456',
  timestamp: new Date(),
}
```

## Error Testing

All workflows include comprehensive error testing:

### Camera Recording Errors
- Permission denied (NotAllowedError)
- Hardware not found
- Invalid configuration

### Screen Recording Errors
- Feature not supported
- User cancels sharing
- Already recording
- Invalid quality settings

### Feedback Collection Errors
- Orphaned feedback (missing interaction)
- Invalid data types
- Storage failures
- Network errors

## Cross-Package Integration

Tests verify proper integration between packages:

```
@ainative/ai-kit-video (recording)
    ↓ (MediaStream)
@ainative/ai-kit-video (processing/transcription)
    ↓ (TranscriptionResult)
@ainative/ai-kit-core (storage/RLHF)
    ↓ (InteractionLog + Feedback)
@ainative/ai-kit-core (analytics)
    → (FeedbackStats)
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hooks

Integration tests run before commits:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:integration:quick"
    }
  }
}
```

## Debugging Tests

### Enable Verbose Logging

```bash
DEBUG=* npm run test:integration
```

### Run Single Test

```bash
npm run test:integration -- -t "should initialize camera with correct settings"
```

### Watch Mode

```bash
npm run test:integration -- --watch
```

### UI Mode (Vitest)

```bash
npm run test:integration -- --ui
```

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on others:

```typescript
beforeEach(() => {
  // Reset state before each test
  vi.clearAllMocks()
  mockStorage.clear()
})

afterEach(() => {
  // Cleanup after each test
  if (recorder) recorder.dispose()
})
```

### 2. Realistic Scenarios

Use realistic data and workflows:

```typescript
// Good: Realistic user journey
const user = createBetaUser()
await user.signup()
await user.recordScreen()
await user.submitFeedback()

// Bad: Isolated units without context
expect(feedbackStorage.store()).toBeDefined()
```

### 3. Performance Awareness

Monitor test execution time:

```typescript
bench('Should complete in < 100ms', async () => {
  await processLargeDataset()
}, {
  iterations: 1000,
  time: 100, // Max 100ms for all iterations
})
```

### 4. Error Propagation

Test error handling across boundaries:

```typescript
it('Then camera errors should propagate to caller', async () => {
  mockCamera.getUserMedia = vi.fn().mockRejectedValue(
    new DOMException('Permission denied', 'NotAllowedError')
  )

  await expect(recorder.getStream()).rejects.toThrow('NotAllowedError')
})
```

### 5. Resource Cleanup

Always cleanup resources:

```typescript
afterEach(() => {
  // Stop streams
  if (recorder) recorder.stop()

  // Close storage
  if (storage) storage.close()

  // Clear timers
  vi.clearAllTimers()
})
```

## Coverage Reports

View coverage reports after running tests:

```bash
# Generate coverage
npm run test:integration:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Thresholds

```javascript
coverage: {
  thresholds: {
    lines: 90,      // 90% line coverage
    functions: 90,  // 90% function coverage
    branches: 85,   // 85% branch coverage
    statements: 90, // 90% statement coverage
  },
}
```

## Troubleshooting

### Tests Timing Out

Increase timeout in vitest.config.ts:

```typescript
test: {
  testTimeout: 60000, // 60 seconds
}
```

### Memory Issues

Run tests with increased memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run test:integration
```

### Flaky Tests

Use retry mechanism for network-dependent tests:

```typescript
it('should handle API failures', async () => {
  await retry(async () => {
    const result = await apiCall()
    expect(result).toBeDefined()
  }, 3) // Retry 3 times
})
```

## Contributing

When adding new integration tests:

1. Follow BDD style (Given-When-Then)
2. Include both happy path and error scenarios
3. Test resource cleanup
4. Add performance benchmarks if applicable
5. Update this documentation
6. Ensure 90%+ coverage

## Related Documentation

- [Unit Testing Guide](./unit-tests.md)
- [E2E Testing Guide](./e2e-tests.md)
- [Performance Testing](./performance-tests.md)
- [CI/CD Pipeline](../ci-cd.md)

## Support

For questions or issues:

- GitHub Issues: [ai-kit/issues](https://github.com/AINative-Studio/ai-kit/issues)
- Discord: [AINative Community](https://discord.gg/ainative)
- Docs: [ainative.studio/ai-kit](https://ainative.studio/ai-kit)
