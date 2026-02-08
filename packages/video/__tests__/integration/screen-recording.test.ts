/**
 * Integration tests for ScreenRecorder with real MediaStream APIs
 * Tests screen recording functionality across different browsers
 */

import { test, expect, type Page } from '@playwright/test';
import {
  grantMediaPermissions,
  waitForStreamActive,
  waitForRecorderState,
  getBlobSize,
  getSupportedMimeTypes,
  isMediaRecorderSupported,
} from './helpers/media-mocks';

test.describe('ScreenRecorder Integration Tests', () => {
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

  test.describe('Basic Recording Flow', () => {
    test('should start and stop screen recording', async ({ browserName }) => {
      // Start recording
      await page.click('#start-screen-recording');

      // Wait for recording to start
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      // Verify status
      const startStatus = await page.textContent('#screen-status');
      expect(startStatus).toContain('Recording');

      // Verify buttons are in correct state
      const startDisabled = await page.isDisabled('#start-screen-recording');
      const stopEnabled = await page.isEnabled('#stop-screen-recording');
      expect(startDisabled).toBe(true);
      expect(stopEnabled).toBe(true);

      // Verify recorder state in window.testState
      const isRecording = await page.evaluate(() => {
        return window.testState.screenRecorder?.isRecording();
      });
      expect(isRecording).toBe(true);

      // Wait a moment for recording
      await page.waitForTimeout(1000);

      // Stop recording
      await page.click('#stop-screen-recording');

      // Wait for recording to complete
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });

      // Verify recording result
      const hasRecording = await page.evaluate(() => {
        return window.testState.recordings.length > 0;
      });
      expect(hasRecording).toBe(true);

      // Verify blob size
      const recording = await page.evaluate(() => {
        return {
          size: window.testState.recordings[0].size,
          duration: window.testState.recordings[0].duration,
          type: window.testState.recordings[0].blob.type,
        };
      });

      expect(recording.size).toBeGreaterThan(0);
      expect(recording.duration).toBeGreaterThan(0);
      expect(recording.type).toContain('video');

      // Verify video element has source
      const videoSrc = await page.getAttribute('#screen-playback', 'src');
      expect(videoSrc).toBeTruthy();
      expect(videoSrc).toContain('blob:');
    });

    test('should handle pause and resume', async () => {
      // Start recording
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      // Pause recording
      await page.click('#pause-screen-recording');
      await page.waitForTimeout(500);

      const pauseStatus = await page.textContent('#screen-status');
      expect(pauseStatus).toContain('Paused');

      // Verify recorder state
      const state = await page.evaluate(() => {
        return window.testState.screenRecorder?.getState();
      });
      expect(state).toBe('paused');

      // Resume recording
      await page.click('#resume-screen-recording');
      await page.waitForTimeout(500);

      const resumeStatus = await page.textContent('#screen-status');
      expect(resumeStatus).toContain('Recording');

      // Stop and verify
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });

      const hasRecording = await page.evaluate(() => {
        return window.testState.recordings.length > 0;
      });
      expect(hasRecording).toBe(true);
    });

    test('should prevent starting while already recording', async () => {
      // Start first recording
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      // Verify start button is disabled
      const isDisabled = await page.isDisabled('#start-screen-recording');
      expect(isDisabled).toBe(true);

      // Try to start again via API
      const error = await page.evaluate(async () => {
        try {
          await window.testState.screenRecorder?.startRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message, code: (err as any).code };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('ALREADY_RECORDING');

      // Cleanup
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });
    });
  });

  test.describe('Quality Settings', () => {
    test('should respect quality configuration', async () => {
      // Create recorder with high quality
      const qualityConfig = await page.evaluate(async () => {
        const { ScreenRecorder } = await import('/dist/index.mjs');
        const recorder = new ScreenRecorder({ quality: 'high' });
        window.testState.screenRecorder = recorder;

        return recorder.getQualityConfig();
      });

      expect(qualityConfig.videoBitsPerSecond).toBe(5000000); // 5 Mbps for high
      expect(qualityConfig.frameRate).toBe(30);

      // Start and stop recording
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });
    });

    test('should support all quality presets', async () => {
      const qualities = ['low', 'medium', 'high', 'ultra'] as const;

      for (const quality of qualities) {
        const config = await page.evaluate(async (q) => {
          const { ScreenRecorder } = await import('/dist/index.mjs');
          const recorder = new ScreenRecorder({ quality: q });
          return recorder.getQualityConfig();
        }, quality);

        expect(config.videoBitsPerSecond).toBeGreaterThan(0);
        expect(config.frameRate).toBeGreaterThan(0);
      }
    });

    test('should prevent quality change during recording', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      const error = await page.evaluate(async () => {
        try {
          window.testState.screenRecorder?.setQuality('ultra');
          return null;
        } catch (err) {
          return { message: (err as Error).message, code: (err as any).code };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('QUALITY_CHANGE_DENIED');

      // Cleanup
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });
    });
  });

  test.describe('Stream Management', () => {
    test('should provide access to active stream', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      const streamInfo = await page.evaluate(() => {
        const stream = window.testState.screenRecorder?.getStream();
        return {
          hasStream: !!stream,
          isActive: stream?.active,
          videoTracks: stream?.getVideoTracks().length,
        };
      });

      expect(streamInfo.hasStream).toBe(true);
      expect(streamInfo.isActive).toBe(true);
      expect(streamInfo.videoTracks).toBeGreaterThan(0);

      // Cleanup
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });
    });

    test('should get stream settings', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      const settings = await page.evaluate(() => {
        return window.testState.screenRecorder?.getStreamSettings();
      });

      expect(settings).not.toBeNull();
      expect(settings?.width).toBeGreaterThan(0);
      expect(settings?.height).toBeGreaterThan(0);

      // Cleanup
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });
    });

    test('should cleanup stream on stop', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      // Stop recording
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });

      // Verify stream is cleaned up
      const streamInfo = await page.evaluate(() => {
        const stream = window.testState.screenRecorder?.getStream();
        return {
          stream: stream,
          state: window.testState.screenRecorder?.getState(),
        };
      });

      expect(streamInfo.stream).toBeNull();
      expect(streamInfo.state).toBe('stopped');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle stop without recording', async () => {
      const error = await page.evaluate(async () => {
        const { ScreenRecorder } = await import('/dist/index.mjs');
        const recorder = new ScreenRecorder();

        try {
          await recorder.stopRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message, code: (err as any).code };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('NOT_RECORDING');
    });

    test('should handle pause without recording', async () => {
      const error = await page.evaluate(async () => {
        const { ScreenRecorder } = await import('/dist/index.mjs');
        const recorder = new ScreenRecorder();

        try {
          recorder.pauseRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message, code: (err as any).code };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('NOT_RECORDING');
    });

    test('should handle resume without pause', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      const error = await page.evaluate(async () => {
        try {
          window.testState.screenRecorder?.resumeRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message, code: (err as any).code };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('NOT_PAUSED');

      // Cleanup
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });
    });
  });

  test.describe('MIME Type Support', () => {
    test('should detect supported MIME types', async () => {
      const supported = await getSupportedMimeTypes(page);

      expect(supported.length).toBeGreaterThan(0);
      expect(supported.some((type) => type.includes('webm'))).toBe(true);
    });

    test('should use supported MIME type for recording', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });

      const mimeType = await page.evaluate(() => {
        return window.testState.recordings[0]?.blob.type;
      });

      expect(mimeType).toBeTruthy();
      expect(mimeType).toContain('video');
    });
  });

  test.describe('Memory Management', () => {
    test('should revoke blob URLs to prevent memory leaks', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.click('#stop-screen-recording');
      await page.waitForSelector('#screen-playback[src]', { timeout: 10000 });

      const blobUrl = await page.evaluate(() => {
        return window.testState.recordings[0]?.url;
      });

      expect(blobUrl).toBeTruthy();
      expect(blobUrl).toContain('blob:');

      // Revoke URL
      await page.evaluate(() => {
        const url = window.testState.recordings[0]?.url;
        window.testState.screenRecorder?.revokeURL(url);
      });

      // Verify revokeURL is safe to call multiple times
      await page.evaluate(() => {
        const url = window.testState.recordings[0]?.url;
        window.testState.screenRecorder?.revokeURL(url);
      });
    });

    test('should handle dispose correctly', async () => {
      await page.click('#start-screen-recording');
      await page.waitForSelector('#screen-status.success', { timeout: 10000 });

      await page.evaluate(() => {
        window.testState.screenRecorder?.dispose();
      });

      const state = await page.evaluate(() => {
        return {
          state: window.testState.screenRecorder?.getState(),
          stream: window.testState.screenRecorder?.getStream(),
        };
      });

      expect(state.state).toBe('idle');
      expect(state.stream).toBeNull();
    });
  });
});
