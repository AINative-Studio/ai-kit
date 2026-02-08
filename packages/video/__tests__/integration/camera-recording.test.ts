/**
 * Integration tests for CameraRecorder with real MediaStream APIs
 * Tests camera access and stream management across different browsers
 */

import { test, expect, type Page } from '@playwright/test';
import {
  grantMediaPermissions,
  getVideoTrackMetrics,
  isMediaRecorderSupported,
} from './helpers/media-mocks';

test.describe('CameraRecorder Integration Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage, browserName }) => {
    page = testPage;

    // Navigate to test page
    await page.goto('/test-page.html');

    // Grant permissions
    await grantMediaPermissions(page);

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Verify MediaRecorder support
    const supported = await isMediaRecorderSupported(page);
    test.skip(!supported, `MediaRecorder not supported in ${browserName}`);
  });

  test.describe('Camera Access', () => {
    test('should request and get camera stream', async () => {
      // Start camera
      await page.click('#start-camera');

      // Wait for camera to start
      await page.waitForSelector('#camera-status.success', { timeout: 10000 });

      // Verify status
      const status = await page.textContent('#camera-status');
      expect(status).toContain('Camera active');

      // Verify video preview is visible
      const videoVisible = await page.isVisible('#camera-preview');
      expect(videoVisible).toBe(true);

      // Verify stream in testState
      const streamInfo = await page.evaluate(() => {
        return {
          hasStream: window.testState.streams.length > 0,
          isActive: window.testState.cameraRecorder?.isActive(),
        };
      });

      expect(streamInfo.hasStream).toBe(true);
      expect(streamInfo.isActive).toBe(true);

      // Stop camera
      await page.click('#stop-camera');

      const stoppedStatus = await page.textContent('#camera-status');
      expect(stoppedStatus).toContain('stopped');
    });

    test('should display camera metrics', async () => {
      await page.click('#start-camera');
      await page.waitForSelector('#camera-status.success', { timeout: 10000 });

      // Wait for metrics to be displayed
      await page.waitForSelector('#camera-metrics', { state: 'visible' });

      const metricsText = await page.textContent('#camera-metrics');
      expect(metricsText).toContain('width');
      expect(metricsText).toContain('height');

      // Get actual settings
      const settings = await page.evaluate(() => {
        return window.testState.cameraRecorder?.getSettings();
      });

      expect(settings).not.toBeNull();
      expect(settings?.width).toBeGreaterThan(0);
      expect(settings?.height).toBeGreaterThan(0);

      await page.click('#stop-camera');
    });

    test('should reuse active stream', async () => {
      // Start camera
      await page.click('#start-camera');
      await page.waitForSelector('#camera-status.success', { timeout: 10000 });

      // Get first stream
      const firstStream = await page.evaluate(() => {
        return window.testState.cameraRecorder?.getCurrentStream()?.id;
      });

      // Try to get stream again
      const secondStream = await page.evaluate(async () => {
        const stream = await window.testState.cameraRecorder?.getStream();
        return stream?.id;
      });

      // Should be the same stream
      expect(firstStream).toBe(secondStream);

      await page.click('#stop-camera');
    });
  });

  test.describe('Resolution Settings', () => {
    test('should support 720p resolution', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({ resolution: '720p' });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return recorder.getSettings();
      });

      // 720p is 1280x720, but we use ideal constraints so actual may vary
      expect(settings).not.toBeNull();
      expect(settings?.width).toBeGreaterThan(0);
      expect(settings?.height).toBeGreaterThan(0);

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });

    test('should support 1080p resolution', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({ resolution: '1080p' });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return recorder.getSettings();
      });

      expect(settings).not.toBeNull();
      expect(settings?.width).toBeGreaterThan(0);
      expect(settings?.height).toBeGreaterThan(0);

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });

    test('should support 4K resolution', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({ resolution: '4K' });
        window.testState.cameraRecorder = recorder;

        try {
          const stream = await recorder.getStream();
          return recorder.getSettings();
        } catch (error) {
          // 4K might not be supported on all devices
          return null;
        }
      });

      // 4K might not be available on all test devices
      if (settings) {
        expect(settings.width).toBeGreaterThan(0);
        expect(settings.height).toBeGreaterThan(0);

        await page.evaluate(() => {
          window.testState.cameraRecorder?.stop();
        });
      }
    });
  });

  test.describe('Constraints Application', () => {
    test('should apply custom video constraints', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({
          videoConstraints: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return recorder.getSettings();
      });

      expect(settings).not.toBeNull();
      // Actual values might differ from ideal, but should be positive
      expect(settings?.width).toBeGreaterThan(0);
      expect(settings?.height).toBeGreaterThan(0);

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });

    test('should support frame rate constraints', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({
          resolution: '720p',
          frameRate: 60,
        });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return recorder.getSettings();
      });

      expect(settings).not.toBeNull();
      // Frame rate might not match exactly but should be set
      if (settings?.frameRate) {
        expect(settings.frameRate).toBeGreaterThan(0);
      }

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });

    test('should support aspect ratio constraints', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({
          resolution: '720p',
          aspectRatio: 16 / 9,
        });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return recorder.getSettings();
      });

      expect(settings).not.toBeNull();
      if (settings?.aspectRatio) {
        expect(settings.aspectRatio).toBeGreaterThan(0);
      }

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });

    test('should support facing mode', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({
          resolution: '720p',
          facingMode: 'user',
        });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return recorder.getSettings();
      });

      expect(settings).not.toBeNull();
      // facingMode might not be available on all devices
      if (settings?.facingMode) {
        expect(['user', 'environment', 'left', 'right']).toContain(
          settings.facingMode
        );
      }

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });
  });

  test.describe('Audio Integration', () => {
    test('should support audio with video', async () => {
      const streamInfo = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({
          resolution: '720p',
          audio: true,
        });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
        };
      });

      expect(streamInfo.videoTracks).toBeGreaterThan(0);
      expect(streamInfo.audioTracks).toBeGreaterThan(0);

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });

    test('should work without audio', async () => {
      const streamInfo = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder({
          resolution: '720p',
          audio: false,
        });
        window.testState.cameraRecorder = recorder;

        const stream = await recorder.getStream();
        return {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
        };
      });

      expect(streamInfo.videoTracks).toBeGreaterThan(0);
      expect(streamInfo.audioTracks).toBe(0);

      await page.evaluate(() => {
        window.testState.cameraRecorder?.stop();
      });
    });
  });

  test.describe('Stream Lifecycle', () => {
    test('should stop all tracks on stop()', async () => {
      await page.click('#start-camera');
      await page.waitForSelector('#camera-status.success', { timeout: 10000 });

      // Get track state before stop
      const beforeStop = await page.evaluate(() => {
        const stream = window.testState.cameraRecorder?.getCurrentStream();
        return stream?.getVideoTracks()[0].readyState;
      });

      expect(beforeStop).toBe('live');

      // Stop camera
      await page.click('#stop-camera');

      // Verify stream is null
      const afterStop = await page.evaluate(() => {
        return {
          stream: window.testState.cameraRecorder?.getCurrentStream(),
          isActive: window.testState.cameraRecorder?.isActive(),
        };
      });

      expect(afterStop.stream).toBeNull();
      expect(afterStop.isActive).toBe(false);
    });

    test('should handle multiple start/stop cycles', async () => {
      for (let i = 0; i < 3; i++) {
        // Start
        await page.click('#start-camera');
        await page.waitForSelector('#camera-status.success', { timeout: 10000 });

        const isActive = await page.evaluate(() => {
          return window.testState.cameraRecorder?.isActive();
        });
        expect(isActive).toBe(true);

        // Stop
        await page.click('#stop-camera');
        await page.waitForTimeout(500);

        const isStopped = await page.evaluate(() => {
          return window.testState.cameraRecorder?.isActive();
        });
        expect(isStopped).toBe(false);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle permission denial gracefully', async () => {
      // Simulate permission denial
      const error = await page.evaluate(async () => {
        // Override getUserMedia to simulate denial
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
          // Restore
          navigator.mediaDevices.getUserMedia = original;
        }
      });

      expect(error).not.toBeNull();
      expect(error?.name).toBe('NotAllowedError');
    });

    test('should handle no camera device', async () => {
      const error = await page.evaluate(async () => {
        // Override getUserMedia to simulate no device
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
          // Restore
          navigator.mediaDevices.getUserMedia = original;
        }
      });

      expect(error).not.toBeNull();
      expect(error?.name).toBe('NotFoundError');
    });
  });

  test.describe('Factory Function', () => {
    test('should create recorder with factory function', async () => {
      const isActive = await page.evaluate(async () => {
        const { createCameraRecorder } = await import('/dist/index.mjs');
        const recorder = createCameraRecorder({ resolution: '720p' });

        const stream = await recorder.getStream();
        const active = recorder.isActive();

        recorder.stop();
        return active;
      });

      expect(isActive).toBe(true);
    });
  });

  test.describe('Settings Inspection', () => {
    test('should return null settings when no stream', async () => {
      const settings = await page.evaluate(async () => {
        const { CameraRecorder } = await import('/dist/index.mjs');
        const recorder = new CameraRecorder();
        return recorder.getSettings();
      });

      expect(settings).toBeNull();
    });

    test('should return actual stream settings', async () => {
      await page.click('#start-camera');
      await page.waitForSelector('#camera-status.success', { timeout: 10000 });

      const settings = await page.evaluate(() => {
        return window.testState.cameraRecorder?.getSettings();
      });

      expect(settings).not.toBeNull();
      expect(settings).toHaveProperty('width');
      expect(settings).toHaveProperty('height');
      expect(settings?.width).toBeGreaterThan(0);
      expect(settings?.height).toBeGreaterThan(0);

      await page.click('#stop-camera');
    });
  });
});
