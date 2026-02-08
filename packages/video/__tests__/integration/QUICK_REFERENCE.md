# Integration Tests Quick Reference

## Running Tests

```bash
# First time setup
npx playwright install
npm run build

# Run all tests
npm run test:integration

# Specific browsers
npm run test:integration:chromium  # Chrome
npm run test:integration:firefox   # Firefox
npm run test:integration:webkit    # Safari

# Mobile browsers
npm run test:integration:mobile

# Interactive modes
npm run test:integration:ui        # UI mode
npm run test:integration:headed    # See browser

# View reports
npm run test:integration:report
```

## Test Files

| File | Tests | Focus |
|------|-------|-------|
| `screen-recording.test.ts` | 40+ | Screen recording lifecycle |
| `camera-recording.test.ts` | 30+ | Camera access & settings |
| `audio-recording.test.ts` | 35+ | Audio recording & levels |
| `stream-manipulation.test.ts` | 40+ | Tracks & constraints |
| `browser-compatibility.test.ts` | 50+ | Cross-browser features |

## Helper Functions

```typescript
// Permission management
await grantMediaPermissions(page);

// Fake device setup
await setupFakeMediaDevices(page);

// Wait helpers
await waitForStreamActive(page, 'stream', 5000);
await waitForRecorderState(page, 'recorder', 'recording', 5000);

// Metrics
const videoMetrics = await getVideoTrackMetrics(page, 'stream');
const audioMetrics = await getAudioTrackMetrics(page, 'stream');

// Support detection
const supported = await isMediaRecorderSupported(page);
const mimeTypes = await getSupportedMimeTypes(page);

// Error simulation
await simulateMediaError(page, 'NotAllowedError');
await restoreMediaAPIs(page);

// Blob operations
const size = await getBlobSize(page, 'blob');
```

## Common Test Patterns

### Basic Test
```typescript
test('test name', async ({ page }) => {
  await page.goto('/test-page.html');
  await grantMediaPermissions(page);

  const result = await page.evaluate(async () => {
    // Test code
  });

  expect(result).toBe(expected);
});
```

### Testing Recording
```typescript
test('recording test', async ({ page }) => {
  await page.goto('/test-page.html');
  await grantMediaPermissions(page);

  await page.click('#start-screen-recording');
  await page.waitForSelector('#screen-status.success');
  await page.waitForTimeout(1000);
  await page.click('#stop-screen-recording');
  await page.waitForSelector('#screen-playback[src]');

  const recording = await page.evaluate(() =>
    window.testState.recordings[0]
  );

  expect(recording.size).toBeGreaterThan(0);
});
```

### Testing Errors
```typescript
test('error test', async ({ page }) => {
  const error = await page.evaluate(async () => {
    try {
      await doSomethingInvalid();
      return null;
    } catch (err) {
      return {
        name: err.name,
        message: err.message,
      };
    }
  });

  expect(error).not.toBeNull();
  expect(error?.name).toBe('ExpectedError');
});
```

### Browser-Specific
```typescript
test('chrome only', async ({ browserName, page }) => {
  test.skip(browserName !== 'chromium', 'Chrome only');

  // Chrome-specific test
});
```

## Test Page State

Access via `window.testState`:

```typescript
{
  screenRecorder: ScreenRecorder | null,
  cameraRecorder: CameraRecorder | null,
  audioRecorder: AudioRecorder | null,
  streams: MediaStream[],
  recordings: RecordingResult[],
  errors: Error[],
  devices: MediaDeviceInfo[],
}
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Mobile |
|---------|--------|---------|--------|--------|
| getUserMedia | ✅ | ✅ | ✅ | ✅ |
| getDisplayMedia | ✅ | ✅ | ⚠️ | ❌ |
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |
| VP9 codec | ✅ | ✅ | ❌ | ❌ |
| Opus audio | ✅ | ✅ | ✅ | ✅ |

## Quality Presets

| Preset | Bitrate | FPS |
|--------|---------|-----|
| low | 1 Mbps | 15 |
| medium | 2.5 Mbps | 30 |
| high | 5 Mbps | 30 |
| ultra | 10 Mbps | 60 |

## Debugging

```bash
# Debug mode
npx playwright test --debug

# Headed mode
npx playwright test --headed

# Specific test
npx playwright test screen-recording

# With console logs
page.on('console', msg => console.log(msg.text()));

# Screenshot
await page.screenshot({ path: 'debug.png' });

# Trace
await page.context().tracing.start();
await page.context().tracing.stop({ path: 'trace.zip' });
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout in config |
| Permission errors | Check browser launch args |
| MIME type errors | Use getSupportedMimeTypes() |
| Stream not active | Use waitForStreamActive() |

## File Locations

```
__tests__/integration/
├── helpers/
│   ├── media-mocks.ts       # Test utilities
│   └── test-server.ts       # HTTP server
├── *.test.ts               # Test suites
├── test-page.html          # Interactive UI
├── playwright.config.ts    # Playwright config
├── global-setup.ts         # Global setup
├── README.md              # Full documentation
├── EXAMPLES.md            # Code examples
├── QUICK_REFERENCE.md     # This file
└── INTEGRATION_TEST_SUMMARY.md  # Summary
```

## Configuration

Key settings in `playwright.config.ts`:
- Test dir: `__tests__/integration`
- Base URL: `http://localhost:5173`
- Timeout: 30s per test
- Retries: 2 on CI, 0 locally
- Browsers: Chrome, Firefox, Safari, Mobile

## Resources

- [Full Documentation](./README.md)
- [Code Examples](./EXAMPLES.md)
- [Test Summary](./INTEGRATION_TEST_SUMMARY.md)
- [Playwright Docs](https://playwright.dev)
