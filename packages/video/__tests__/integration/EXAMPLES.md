# Integration Test Examples

This guide provides examples of common integration test patterns for the video package.

## Basic Test Structure

### Simple Feature Test

```typescript
import { test, expect } from '@playwright/test';
import { grantMediaPermissions } from './helpers/media-mocks';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-page.html');
    await grantMediaPermissions(page);
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Arrange: Set up test conditions
    const result = await page.evaluate(async () => {
      const { ScreenRecorder } = await import('/dist/index.mjs');
      const recorder = new ScreenRecorder();
      return recorder.getQuality();
    });

    // Assert: Verify expectations
    expect(result).toBe('medium'); // default quality
  });
});
```

## Testing MediaStream Features

### Testing getUserMedia

```typescript
test('should access camera with specific constraints', async ({ page }) => {
  const streamInfo = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    });

    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();

    // Cleanup
    stream.getTracks().forEach((t) => t.stop());

    return {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
    };
  });

  expect(streamInfo.width).toBeGreaterThan(0);
  expect(streamInfo.height).toBeGreaterThan(0);
});
```

### Testing Track Manipulation

```typescript
test('should enable/disable video track', async ({ page }) => {
  const states = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track = stream.getVideoTracks()[0];

    const initial = track.enabled;
    track.enabled = false;
    const disabled = track.enabled;
    track.enabled = true;
    const enabled = track.enabled;

    stream.getTracks().forEach((t) => t.stop());

    return { initial, disabled, enabled };
  });

  expect(states.initial).toBe(true);
  expect(states.disabled).toBe(false);
  expect(states.enabled).toBe(true);
});
```

## Testing Recording Features

### Testing Screen Recording

```typescript
test('should record screen for duration', async ({ page }) => {
  // Start recording
  await page.click('#start-screen-recording');
  await page.waitForSelector('#screen-status.success', { timeout: 10000 });

  // Record for 2 seconds
  await page.waitForTimeout(2000);

  // Stop recording
  await page.click('#stop-screen-recording');
  await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });

  // Verify recording
  const recording = await page.evaluate(() => {
    return {
      size: window.testState.recordings[0].size,
      duration: window.testState.recordings[0].duration,
      type: window.testState.recordings[0].blob.type,
    };
  });

  expect(recording.size).toBeGreaterThan(0);
  expect(recording.duration).toBeGreaterThanOrEqual(2000);
  expect(recording.type).toContain('video');
});
```

### Testing Audio Recording with Visualization

```typescript
test('should visualize audio levels', async ({ page }) => {
  await page.click('#start-audio');
  await page.waitForSelector('#audio-status.success', { timeout: 10000 });

  // Wait for visualization to update
  await page.waitForTimeout(1000);

  // Check that canvas has been drawn to
  const hasVisualization = await page.evaluate(() => {
    const canvas = document.getElementById('audio-visualizer') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((value) => value !== 0);
  });

  expect(hasVisualization).toBe(true);

  await page.click('#stop-audio');
  await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });
});
```

## Error Testing

### Testing Permission Denial

```typescript
test('should handle camera permission denial', async ({ page }) => {
  const error = await page.evaluate(async () => {
    // Mock permission denial
    const original = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    };

    const { CameraRecorder } = await import('/dist/index.mjs');
    const recorder = new CameraRecorder();

    try {
      await recorder.getStream();
      return null;
    } catch (err) {
      return {
        name: (err as DOMException).name,
        message: (err as DOMException).message,
      };
    } finally {
      navigator.mediaDevices.getUserMedia = original;
    }
  });

  expect(error).not.toBeNull();
  expect(error?.name).toBe('NotAllowedError');
});
```

### Testing No Device Error

```typescript
test('should handle no camera device', async ({ page }) => {
  const error = await page.evaluate(async () => {
    const original = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('No camera found', 'NotFoundError');
    };

    const { CameraRecorder } = await import('/dist/index.mjs');
    const recorder = new CameraRecorder();

    try {
      await recorder.getStream();
      return null;
    } catch (err) {
      return {
        name: (err as DOMException).name,
        message: (err as DOMException).message,
      };
    } finally {
      navigator.mediaDevices.getUserMedia = original;
    }
  });

  expect(error).not.toBeNull();
  expect(error?.name).toBe('NotFoundError');
});
```

## Browser-Specific Tests

### Testing Browser Capabilities

```typescript
test('should detect browser capabilities', async ({ page, browserName }) => {
  const capabilities = await page.evaluate(() => {
    return {
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      getDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      audioContext: typeof AudioContext !== 'undefined',
    };
  });

  expect(capabilities.mediaDevices).toBe(true);
  expect(capabilities.getUserMedia).toBe(true);
  expect(capabilities.mediaRecorder).toBe(true);

  console.log(`${browserName} capabilities:`, capabilities);
});
```

### Skip Tests for Specific Browsers

```typescript
test('Chrome-only: VP9 codec support', async ({ browserName, page }) => {
  // Skip if not Chrome
  test.skip(browserName !== 'chromium', 'Chrome-specific test');

  const supported = await page.evaluate(() => {
    return MediaRecorder.isTypeSupported('video/webm;codecs=vp9');
  });

  expect(supported).toBe(true);
});
```

## Performance Testing

### Measuring Stream Initialization Time

```typescript
test('should initialize stream quickly', async ({ page }) => {
  const duration = await page.evaluate(async () => {
    const start = performance.now();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    const end = performance.now();

    stream.getTracks().forEach((t) => t.stop());

    return end - start;
  });

  // Should complete within 5 seconds
  expect(duration).toBeLessThan(5000);
  console.log(`Stream initialized in ${duration.toFixed(2)}ms`);
});
```

### Measuring Recording Performance

```typescript
test('should maintain frame rate during recording', async ({ page }) => {
  await page.click('#start-screen-recording');
  await page.waitForSelector('#screen-status.success', { timeout: 10000 });

  // Get stream settings
  const frameRate = await page.evaluate(() => {
    const settings = window.testState.screenRecorder?.getStreamSettings();
    return settings?.frameRate || 0;
  });

  expect(frameRate).toBeGreaterThan(0);

  await page.click('#stop-screen-recording');
  await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });

  console.log(`Recording at ${frameRate} fps`);
});
```

## Advanced Patterns

### Testing Multiple Streams

```typescript
test('should handle multiple simultaneous streams', async ({ page }) => {
  const streamCount = await page.evaluate(async () => {
    const streams = await Promise.all([
      navigator.mediaDevices.getUserMedia({ video: true }),
      navigator.mediaDevices.getUserMedia({ audio: true }),
    ]);

    const activeCount = streams.filter((s) => s.active).length;

    // Cleanup
    streams.forEach((stream) => {
      stream.getTracks().forEach((t) => t.stop());
    });

    return activeCount;
  });

  expect(streamCount).toBe(2);
});
```

### Testing Stream Cloning

```typescript
test('should clone stream with all tracks', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const original = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const clone = original.clone();

    const comparison = {
      differentIds: original.id !== clone.id,
      sameTrackCount: original.getTracks().length === clone.getTracks().length,
      originalActive: original.active,
      cloneActive: clone.active,
    };

    original.getTracks().forEach((t) => t.stop());
    clone.getTracks().forEach((t) => t.stop());

    return comparison;
  });

  expect(result.differentIds).toBe(true);
  expect(result.sameTrackCount).toBe(true);
  expect(result.originalActive).toBe(true);
  expect(result.cloneActive).toBe(true);
});
```

### Testing Constraint Changes

```typescript
test('should apply new constraints to active track', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    const track = stream.getVideoTracks()[0];
    const initialSettings = track.getSettings();

    await track.applyConstraints({
      width: { ideal: 640 },
      height: { ideal: 480 },
    });

    const newSettings = track.getSettings();

    stream.getTracks().forEach((t) => t.stop());

    return {
      initialWidth: initialSettings.width,
      newWidth: newSettings.width,
      constraintApplied: initialSettings.width !== newSettings.width,
    };
  });

  expect(result.initialWidth).toBeGreaterThan(0);
  expect(result.newWidth).toBeGreaterThan(0);
});
```

## Using Helper Functions

### Custom Assertions

```typescript
import { getVideoTrackMetrics } from './helpers/media-mocks';

test('should meet resolution requirements', async ({ page }) => {
  await page.click('#start-camera');
  await page.waitForSelector('#camera-status.success', { timeout: 10000 });

  const metrics = await getVideoTrackMetrics(
    page,
    'window.testState.cameraRecorder?.getCurrentStream()'
  );

  expect(metrics.width).toBeGreaterThanOrEqual(1280);
  expect(metrics.height).toBeGreaterThanOrEqual(720);
  expect(metrics.aspectRatio).toBeCloseTo(16 / 9, 1);

  await page.click('#stop-camera');
});
```

### Waiting for Specific States

```typescript
import { waitForRecorderState } from './helpers/media-mocks';

test('should transition to recording state', async ({ page }) => {
  await page.click('#start-screen-recording');

  // Wait for recorder to be in recording state
  await waitForRecorderState(
    page,
    'window.testState.screenRecorder',
    'recording',
    10000
  );

  const state = await page.evaluate(() => {
    return window.testState.screenRecorder?.getState();
  });

  expect(state).toBe('recording');

  await page.click('#stop-screen-recording');
  await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });
});
```

## Debugging Tips

### Adding Console Logs

```typescript
test('debugging example', async ({ page }) => {
  // Listen to console messages
  page.on('console', (msg) => {
    console.log(`Browser Console [${msg.type()}]:`, msg.text());
  });

  // Log from page context
  await page.evaluate(() => {
    console.log('Test starting');
  });

  // Your test code...
});
```

### Taking Screenshots

```typescript
test('screenshot example', async ({ page }) => {
  await page.click('#start-camera');
  await page.waitForSelector('#camera-status.success', { timeout: 10000 });

  // Take screenshot
  await page.screenshot({ path: 'debug-camera-active.png' });

  await page.click('#stop-camera');
});
```

### Using Trace Viewer

```typescript
test('trace example', async ({ page }) => {
  // Start tracing
  await page.context().tracing.start({ screenshots: true, snapshots: true });

  // Your test code...
  await page.click('#start-screen-recording');
  await page.waitForTimeout(2000);
  await page.click('#stop-screen-recording');

  // Stop tracing and save
  await page.context().tracing.stop({ path: 'trace.zip' });
});
```

## Best Practices

1. **Always Clean Up**: Stop streams and revoke blob URLs
2. **Use Timeouts**: Don't rely on immediate state changes
3. **Test Error Cases**: Include negative tests
4. **Browser Detection**: Skip unsupported features gracefully
5. **Isolate Tests**: Each test should be independent
6. **Meaningful Assertions**: Check actual behavior, not just success
7. **Document Assumptions**: Comment on browser-specific behavior

## Common Pitfalls

1. **Not waiting for async operations**: Use `waitForSelector` and `waitForTimeout`
2. **Memory leaks**: Always stop tracks and revoke URLs
3. **Race conditions**: Wait for states before assertions
4. **Browser differences**: Test across all browsers
5. **Missing permissions**: Always grant media permissions in setup
