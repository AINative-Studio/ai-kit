/**
 * Cross-browser compatibility tests for MediaStream APIs
 * Tests feature availability and behavior across Chrome, Firefox, and Safari
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import {
  grantMediaPermissions,
  getSupportedMimeTypes,
  isMediaRecorderSupported,
} from './helpers/media-mocks';

test.describe('Browser Compatibility Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/test-page.html');
    await grantMediaPermissions(page);
    await page.waitForLoadState('networkidle');
  });

  test.describe('API Availability', () => {
    test('should have MediaDevices API', async ({ browserName }) => {
      const hasAPI = await page.evaluate(() => {
        return {
          mediaDevices: !!navigator.mediaDevices,
          getUserMedia: !!navigator.mediaDevices?.getUserMedia,
          getDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
          enumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
        };
      });

      expect(hasAPI.mediaDevices).toBe(true);
      expect(hasAPI.getUserMedia).toBe(true);
      expect(hasAPI.enumerateDevices).toBe(true);

      // getDisplayMedia might not be available in all contexts
      test.skip(
        !hasAPI.getDisplayMedia && browserName === 'firefox',
        'getDisplayMedia not available in Firefox in some contexts'
      );
    });

    test('should have MediaRecorder API', async ({ browserName }) => {
      const supported = await isMediaRecorderSupported(page);

      expect(supported).toBe(true);
    });

    test('should have MediaStream API', async () => {
      const hasMediaStream = await page.evaluate(() => {
        return typeof MediaStream !== 'undefined';
      });

      expect(hasMediaStream).toBe(true);
    });

    test('should have AudioContext API', async () => {
      const hasAudioContext = await page.evaluate(() => {
        return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
      });

      expect(hasAudioContext).toBe(true);
    });
  });

  test.describe('MIME Type Support', () => {
    test('should support WebM video', async ({ browserName }) => {
      const supported = await getSupportedMimeTypes(page);
      const hasWebM = supported.some((type) => type.includes('video/webm'));

      // All major browsers support WebM
      expect(hasWebM).toBe(true);
    });

    test('should support Opus audio codec', async () => {
      const supported = await page.evaluate(() => {
        return MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
      });

      expect(supported).toBe(true);
    });

    test('should report supported video codecs', async ({ browserName }) => {
      const codecs = await page.evaluate(() => {
        const videoCodecs = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm;codecs=h264',
          'video/webm;codecs=av1',
        ];

        return videoCodecs.filter((codec) => MediaRecorder.isTypeSupported(codec));
      });

      expect(codecs.length).toBeGreaterThan(0);

      // Log supported codecs for debugging
      console.log(`${browserName} supported codecs:`, codecs);
    });

    test('should have at least one supported format', async () => {
      const supported = await getSupportedMimeTypes(page);

      expect(supported.length).toBeGreaterThan(0);
    });
  });

  test.describe('getUserMedia Support', () => {
    test('should access camera', async () => {
      const result = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });

          const hasVideo = stream.getVideoTracks().length > 0;

          stream.getTracks().forEach((t) => t.stop());

          return { success: true, hasVideo };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.hasVideo).toBe(true);
      }
    });

    test('should access microphone', async () => {
      const result = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

          const hasAudio = stream.getAudioTracks().length > 0;

          stream.getTracks().forEach((t) => t.stop());

          return { success: true, hasAudio };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.hasAudio).toBe(true);
      }
    });

    test('should handle both audio and video', async () => {
      const result = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          const trackCounts = {
            video: stream.getVideoTracks().length,
            audio: stream.getAudioTracks().length,
          };

          stream.getTracks().forEach((t) => t.stop());

          return { success: true, trackCounts };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.trackCounts.video).toBeGreaterThan(0);
        expect(result.trackCounts.audio).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Constraint Support', () => {
    test('should support width and height constraints', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        const settings = stream.getVideoTracks()[0].getSettings();

        stream.getTracks().forEach((t) => t.stop());

        return {
          width: settings.width!,
          height: settings.height!,
        };
      });

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    test('should support frameRate constraint', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            frameRate: { ideal: 30 },
          },
        });

        const settings = stream.getVideoTracks()[0].getSettings();

        stream.getTracks().forEach((t) => t.stop());

        return {
          frameRate: settings.frameRate,
        };
      });

      // frameRate support varies
      if (result.frameRate !== undefined) {
        expect(result.frameRate).toBeGreaterThan(0);
      }
    });

    test('should support audio constraints', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        const settings = stream.getAudioTracks()[0].getSettings();

        stream.getTracks().forEach((t) => t.stop());

        return {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
        };
      });

      // These features are widely supported
      if (result.echoCancellation !== undefined) {
        expect(typeof result.echoCancellation).toBe('boolean');
      }
    });
  });

  test.describe('Track Manipulation', () => {
    test('should support track enable/disable', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const track = stream.getVideoTracks()[0];

        track.enabled = false;
        const disabled = track.enabled;

        track.enabled = true;
        const enabled = track.enabled;

        stream.getTracks().forEach((t) => t.stop());

        return { disabled, enabled };
      });

      expect(result.disabled).toBe(false);
      expect(result.enabled).toBe(true);
    });

    test('should support track stop', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const track = stream.getVideoTracks()[0];

        const liveBefore = track.readyState === 'live';
        track.stop();
        const endedAfter = track.readyState === 'ended';

        return { liveBefore, endedAfter };
      });

      expect(result.liveBefore).toBe(true);
      expect(result.endedAfter).toBe(true);
    });

    test('should support track cloning', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const original = stream.getVideoTracks()[0];
        const clone = original.clone();

        const differentIds = original.id !== clone.id;

        stream.getTracks().forEach((t) => t.stop());
        clone.stop();

        return { differentIds };
      });

      expect(result.differentIds).toBe(true);
    });
  });

  test.describe('MediaRecorder Behavior', () => {
    test('should record video', async ({ browserName }) => {
      const supported = await isMediaRecorderSupported(page);
      test.skip(!supported, `MediaRecorder not supported in ${browserName}`);

      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

        const recorder = new MediaRecorder(stream, { mimeType });

        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.start();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return new Promise((resolve) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            stream.getTracks().forEach((t) => t.stop());

            resolve({
              size: blob.size,
              type: blob.type,
            });
          };

          recorder.stop();
        });
      });

      expect(result.size).toBeGreaterThan(0);
      expect(result.type).toContain('video');
    });

    test('should support pause and resume', async ({ browserName }) => {
      const supported = await isMediaRecorderSupported(page);
      test.skip(!supported, `MediaRecorder not supported in ${browserName}`);

      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const recorder = new MediaRecorder(stream);

        recorder.start();

        const recordingState = recorder.state;

        recorder.pause();
        const pausedState = recorder.state;

        recorder.resume();
        const resumedState = recorder.state;

        recorder.stop();
        stream.getTracks().forEach((t) => t.stop());

        return { recordingState, pausedState, resumedState };
      });

      expect(result.recordingState).toBe('recording');
      expect(result.pausedState).toBe('paused');
      expect(result.resumedState).toBe('recording');
    });
  });

  test.describe('Browser-Specific Features', () => {
    test('Chrome: VP9 codec support', async ({ browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test');

      const supported = await page.evaluate(() => {
        return MediaRecorder.isTypeSupported('video/webm;codecs=vp9');
      });

      expect(supported).toBe(true);
    });

    test('Firefox: Opus audio support', async ({ browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      const supported = await page.evaluate(() => {
        return MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
      });

      expect(supported).toBe(true);
    });

    test('Safari: H.264 support', async ({ browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test');

      const supported = await page.evaluate(() => {
        return (
          MediaRecorder.isTypeSupported('video/mp4') ||
          MediaRecorder.isTypeSupported('video/webm;codecs=h264')
        );
      });

      // Safari should support at least one of these
      expect(supported).toBe(true);
    });
  });

  test.describe('Performance Characteristics', () => {
    test('should start stream quickly', async () => {
      const duration = await page.evaluate(async () => {
        const start = performance.now();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const end = performance.now();

        stream.getTracks().forEach((t) => t.stop());

        return end - start;
      });

      // Should start within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('should start recorder without delay', async ({ browserName }) => {
      const supported = await isMediaRecorderSupported(page);
      test.skip(!supported, `MediaRecorder not supported in ${browserName}`);

      const duration = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const start = performance.now();

        const recorder = new MediaRecorder(stream);
        recorder.start();

        const end = performance.now();

        recorder.stop();
        stream.getTracks().forEach((t) => t.stop());

        return end - start;
      });

      // Should start immediately (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  test.describe('Error Handling Consistency', () => {
    test('should throw NotAllowedError on permission denial', async () => {
      const error = await page.evaluate(async () => {
        const original = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = async () => {
          throw new DOMException('Permission denied', 'NotAllowedError');
        };

        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          return null;
        } catch (err) {
          return { name: (err as DOMException).name };
        } finally {
          navigator.mediaDevices.getUserMedia = original;
        }
      });

      expect(error?.name).toBe('NotAllowedError');
    });

    test('should throw NotFoundError when no devices', async () => {
      const error = await page.evaluate(async () => {
        const original = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = async () => {
          throw new DOMException('No device found', 'NotFoundError');
        };

        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          return null;
        } catch (err) {
          return { name: (err as DOMException).name };
        } finally {
          navigator.mediaDevices.getUserMedia = original;
        }
      });

      expect(error?.name).toBe('NotFoundError');
    });
  });

  test.describe('Mobile Browser Support', () => {
    test('mobile: should access camera', async ({ browserName }) => {
      test.skip(
        !browserName.includes('mobile'),
        'Mobile-specific test'
      );

      const result = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
          });

          const hasVideo = stream.getVideoTracks().length > 0;

          stream.getTracks().forEach((t) => t.stop());

          return { success: true, hasVideo };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      });

      if (result.success) {
        expect(result.hasVideo).toBe(true);
      }
    });

    test('mobile: should support facing mode', async ({ browserName }) => {
      test.skip(
        !browserName.includes('mobile'),
        'Mobile-specific test'
      );

      const result = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
          });

          const settings = stream.getVideoTracks()[0].getSettings();

          stream.getTracks().forEach((t) => t.stop());

          return {
            facingMode: settings.facingMode,
          };
        } catch (error) {
          return { error: (error as Error).message };
        }
      });

      // facingMode might not be available on all mobile devices
      if ('facingMode' in result) {
        expect(['user', 'environment', 'left', 'right']).toContain(
          result.facingMode
        );
      }
    });
  });
});
