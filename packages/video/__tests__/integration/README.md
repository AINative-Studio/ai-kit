# Video Package Integration Tests

This directory contains integration tests for the `@ainative/ai-kit-video` package using Playwright to test real MediaStream APIs across different browsers.

## Overview

Integration tests validate the video package functionality with real browser APIs including:
- MediaStream API (getUserMedia, getDisplayMedia)
- MediaRecorder API
- AudioContext API
- Track manipulation and constraints
- Cross-browser compatibility

## Test Structure

```
__tests__/integration/
├── helpers/
│   ├── media-mocks.ts       # MediaStream mocking and utilities
│   └── test-server.ts       # HTTP server for serving test files
├── screen-recording.test.ts # Screen recording integration tests
├── camera-recording.test.ts # Camera recording integration tests
├── audio-recording.test.ts  # Audio recording integration tests
├── stream-manipulation.test.ts # Stream and track manipulation tests
├── browser-compatibility.test.ts # Cross-browser compatibility tests
├── test-page.html          # Interactive test page with UI
└── README.md               # This file
```

## Running Tests

### Prerequisites

1. Build the package first:
```bash
npm run build
```

2. Install Playwright browsers (first time only):
```bash
npx playwright install
```

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Tests by Browser

Test on specific browsers:

```bash
# Chrome/Chromium
npm run test:integration:chromium

# Firefox
npm run test:integration:firefox

# Safari/WebKit
npm run test:integration:webkit

# Mobile browsers
npm run test:integration:mobile
```

### Run Tests in UI Mode

Interactive test UI with debugging:

```bash
npm run test:integration:ui
```

### Run Tests in Headed Mode

See the browser while tests run:

```bash
npm run test:integration:headed
```

### View Test Reports

After running tests, view the HTML report:

```bash
npm run test:integration:report
```

## Test Coverage

### Screen Recording Tests
- Basic recording flow (start, pause, resume, stop)
- Quality presets (low, medium, high, ultra)
- Stream management and settings
- Error handling (already recording, not recording, etc.)
- MIME type support and selection
- Memory management (blob URL revocation)

### Camera Recording Tests
- Camera stream access and lifecycle
- Resolution presets (720p, 1080p, 4K)
- Constraint application (frameRate, aspectRatio, facingMode)
- Audio integration (with/without audio)
- Stream reuse and cleanup
- Error scenarios (permission denied, no device)

### Audio Recording Tests
- Audio recording lifecycle (start, pause, resume, stop)
- Audio level monitoring and visualization
- Constraint application (noise cancellation, echo cancellation, sample rate)
- Dynamic noise cancellation control
- State management
- Resource cleanup

### Stream Manipulation Tests
- Device enumeration (video, audio inputs/outputs)
- Constraint application (min/max/ideal/exact)
- Track manipulation (enable/disable, stop, clone)
- Stream lifecycle (active state, track management)
- Advanced features (multiple streams, constraint changes)

### Browser Compatibility Tests
- API availability checks
- MIME type support across browsers
- getUserMedia support
- MediaRecorder behavior consistency
- Browser-specific features (VP9, Opus, H.264)
- Performance characteristics
- Error handling consistency
- Mobile browser support

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Test Directory**: `__tests__/integration`
- **Base URL**: `http://localhost:5173`
- **Permissions**: Camera and microphone granted automatically
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Retry**: 2 retries on CI, 0 locally
- **Timeout**: 30 seconds per test
- **Reporters**: HTML, JSON, JUnit, List

### Browser Launch Options

Tests use fake media devices for consistent results:

**Chrome/Chromium**:
```javascript
--use-fake-ui-for-media-stream
--use-fake-device-for-media-stream
```

**Firefox**:
```javascript
media.navigator.streams.fake: true
media.navigator.permission.disabled: true
```

**Safari/WebKit**:
```javascript
--use-fake-ui-for-media-stream
```

## Writing New Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';
import { grantMediaPermissions } from './helpers/media-mocks';

test.describe('Your Test Suite', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/test-page.html');
    await grantMediaPermissions(page);
    await page.waitForLoadState('networkidle');
  });

  test('your test name', async () => {
    // Your test code
  });
});
```

### Helper Functions

Available helpers in `helpers/media-mocks.ts`:

- `grantMediaPermissions(page)` - Grant camera/microphone permissions
- `setupFakeMediaDevices(page)` - Set up fake media devices
- `waitForStreamActive(page, streamGetter, timeout)` - Wait for stream to be active
- `waitForRecorderState(page, recorderGetter, state, timeout)` - Wait for recorder state
- `getBlobSize(page, blobGetter)` - Get blob size from page
- `isMediaRecorderSupported(page)` - Check MediaRecorder support
- `getSupportedMimeTypes(page)` - Get supported MIME types
- `simulateMediaError(page, errorType)` - Simulate media errors
- `getVideoTrackMetrics(page, streamGetter)` - Get video track metrics
- `getAudioTrackMetrics(page, streamGetter)` - Get audio track metrics

### Using the Test Page

The `test-page.html` provides an interactive UI for manual testing and stores test state in `window.testState`:

```typescript
window.testState = {
  screenRecorder: null,
  cameraRecorder: null,
  audioRecorder: null,
  streams: [],
  recordings: [],
  errors: [],
  devices: [],
};
```

## Debugging Tests

### Debug Mode

Run tests in debug mode with Playwright Inspector:

```bash
npx playwright test --debug
```

### Trace Viewer

Tests automatically capture traces on first retry. View traces:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshots and Videos

- Screenshots: Captured on failure
- Videos: Retained on failure
- Located in: `test-results/` directory

### Console Logs

View browser console output in test results:

```typescript
page.on('console', msg => console.log('Browser:', msg.text()));
```

## CI/CD Integration

Tests are configured for CI environments:

- Automatic retries (2x on CI)
- Serial execution on CI for stability
- JUnit XML output for CI reporting
- JSON results for analysis

### GitHub Actions Example

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Build package
  run: npm run build

- name: Run integration tests
  run: npm run test:integration

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Browser Support Matrix

| Browser | getUserMedia | getDisplayMedia | MediaRecorder | Notes |
|---------|--------------|-----------------|---------------|-------|
| Chrome 90+ | ✅ | ✅ | ✅ | Full support, VP9 codec |
| Firefox 88+ | ✅ | ✅ | ✅ | Full support, Opus codec |
| Safari 14+ | ✅ | ⚠️ | ✅ | Limited getDisplayMedia in some contexts |
| Mobile Chrome | ✅ | ❌ | ✅ | No screen capture on mobile |
| Mobile Safari | ✅ | ❌ | ✅ | No screen capture on mobile |

## Performance Benchmarks

Expected performance characteristics:

- Stream initialization: < 5 seconds
- Recorder start: < 100ms
- Frame rate: 15-60 fps (quality dependent)
- Audio latency: < 50ms
- Memory usage: < 100MB per stream

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Check if browser supports required features
- Verify media permissions are granted

### Permission Errors

- Ensure fake media devices are configured
- Check browser launch options
- Grant permissions in test setup

### MIME Type Errors

- Check supported MIME types with `getSupportedMimeTypes()`
- Fall back to more widely supported formats
- Use browser detection for codec selection

### Stream Not Active

- Wait for stream to initialize with `waitForStreamActive()`
- Check track state with `track.readyState`
- Verify getUserMedia constraints are valid

## Resources

- [Playwright Documentation](https://playwright.dev)
- [MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [getUserMedia Constraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#parameters)

## Contributing

When adding new integration tests:

1. Follow existing test patterns
2. Use helper functions from `helpers/media-mocks.ts`
3. Test across all browsers
4. Include error scenarios
5. Document expected behavior
6. Update this README with new test coverage

## License

MIT
