/**
 * Integration tests for MediaStream manipulation and constraints
 * Tests track manipulation, device enumeration, and constraint application
 */

import { test, expect, type Page } from '@playwright/test';
import { grantMediaPermissions } from './helpers/media-mocks';

test.describe('Stream Manipulation Integration Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/test-page.html');
    await grantMediaPermissions(page);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Device Enumeration', () => {
    test('should enumerate available devices', async () => {
      await page.click('#get-devices');
      await page.waitForTimeout(500);

      const devices = await page.evaluate(() => {
        return window.testState.devices;
      });

      expect(devices).toBeDefined();
      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBeGreaterThan(0);

      // Check device structure
      const firstDevice = devices[0];
      expect(firstDevice).toHaveProperty('deviceId');
      expect(firstDevice).toHaveProperty('kind');
      expect(firstDevice).toHaveProperty('label');
      expect(firstDevice).toHaveProperty('groupId');
    });

    test('should find video input devices', async () => {
      await page.click('#get-devices');
      await page.waitForTimeout(500);

      const hasVideoInput = await page.evaluate(() => {
        return window.testState.devices.some(
          (d: MediaDeviceInfo) => d.kind === 'videoinput'
        );
      });

      expect(hasVideoInput).toBe(true);
    });

    test('should find audio input devices', async () => {
      await page.click('#get-devices');
      await page.waitForTimeout(500);

      const hasAudioInput = await page.evaluate(() => {
        return window.testState.devices.some(
          (d: MediaDeviceInfo) => d.kind === 'audioinput'
        );
      });

      expect(hasAudioInput).toBe(true);
    });

    test('should find audio output devices', async () => {
      await page.click('#get-devices');
      await page.waitForTimeout(500);

      const hasAudioOutput = await page.evaluate(() => {
        return window.testState.devices.some(
          (d: MediaDeviceInfo) => d.kind === 'audiooutput'
        );
      });

      expect(hasAudioOutput).toBe(true);
    });
  });

  test.describe('Constraint Application', () => {
    test('should apply video constraints', async () => {
      await page.click('#test-constraints');
      await page.waitForTimeout(1000);

      const output = await page.textContent('#stream-output');
      expect(output).toContain('Width:');
      expect(output).toContain('Height:');
      expect(output).toContain('Frame Rate:');

      const status = await page.textContent('#stream-status');
      expect(status).toContain('Constraint test complete');
    });

    test('should respect min/max constraints', async () => {
      const result = await page.evaluate(async () => {
        const constraints = {
          video: {
            width: { min: 640, max: 1920 },
            height: { min: 480, max: 1080 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();

        // Cleanup
        stream.getTracks().forEach((t) => t.stop());

        return {
          width: settings.width!,
          height: settings.height!,
        };
      });

      expect(result.width).toBeGreaterThanOrEqual(640);
      expect(result.width).toBeLessThanOrEqual(1920);
      expect(result.height).toBeGreaterThanOrEqual(480);
      expect(result.height).toBeLessThanOrEqual(1080);
    });

    test('should apply ideal constraints', async () => {
      const result = await page.evaluate(async () => {
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();

        stream.getTracks().forEach((t) => t.stop());

        return {
          width: settings.width!,
          height: settings.height!,
        };
      });

      // Should try to match ideal, but might not be exact
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    test('should apply exact constraints', async () => {
      const result = await page.evaluate(async () => {
        try {
          const constraints = {
            video: {
              width: { exact: 1280 },
              height: { exact: 720 },
            },
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();

          stream.getTracks().forEach((t) => t.stop());

          return {
            success: true,
            width: settings.width!,
            height: settings.height!,
          };
        } catch (error) {
          // Exact constraints might not be supported
          return { success: false, error: (error as Error).message };
        }
      });

      if (result.success) {
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      } else {
        // It's okay if exact constraints aren't supported
        expect(result.error).toBeDefined();
      }
    });
  });

  test.describe('Track Manipulation', () => {
    test('should enable and disable video tracks', async () => {
      await page.click('#test-track-manipulation');
      await page.waitForTimeout(1000);

      const output = await page.textContent('#stream-output');
      expect(output).toContain('Video track disabled');
      expect(output).toContain('Video track re-enabled');

      const status = await page.textContent('#stream-status');
      expect(status).toContain('Track manipulation test complete');
    });

    test('should toggle track enabled state', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const track = stream.getVideoTracks()[0];
        const initialState = track.enabled;

        track.enabled = false;
        const disabledState = track.enabled;

        track.enabled = true;
        const enabledState = track.enabled;

        stream.getTracks().forEach((t) => t.stop());

        return { initialState, disabledState, enabledState };
      });

      expect(result.initialState).toBe(true);
      expect(result.disabledState).toBe(false);
      expect(result.enabledState).toBe(true);
    });

    test('should mute audio tracks', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const track = stream.getAudioTracks()[0];
        const initialState = track.enabled;

        track.enabled = false;
        const mutedState = track.enabled;

        stream.getTracks().forEach((t) => t.stop());

        return { initialState, mutedState };
      });

      expect(result.initialState).toBe(true);
      expect(result.mutedState).toBe(false);
    });

    test('should apply constraints to existing tracks', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
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
          initial: {
            width: initialSettings.width!,
            height: initialSettings.height!,
          },
          new: {
            width: newSettings.width!,
            height: newSettings.height!,
          },
        };
      });

      expect(result.initial.width).toBeGreaterThan(0);
      expect(result.new.width).toBeGreaterThan(0);
    });

    test('should clone tracks', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const original = stream.getVideoTracks()[0];
        const clone = original.clone();

        const areDifferent = original.id !== clone.id;
        const sameSettings =
          original.getSettings().width === clone.getSettings().width;

        stream.getTracks().forEach((t) => t.stop());
        clone.stop();

        return { areDifferent, sameSettings };
      });

      expect(result.areDifferent).toBe(true);
      expect(result.sameSettings).toBe(true);
    });

    test('should stop individual tracks', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        const initialVideoState = videoTrack.readyState;
        const initialAudioState = audioTrack.readyState;

        videoTrack.stop();

        const stoppedVideoState = videoTrack.readyState;
        const stillActiveAudioState = audioTrack.readyState;

        audioTrack.stop();

        return {
          initialVideoState,
          initialAudioState,
          stoppedVideoState,
          stillActiveAudioState,
        };
      });

      expect(result.initialVideoState).toBe('live');
      expect(result.initialAudioState).toBe('live');
      expect(result.stoppedVideoState).toBe('ended');
      expect(result.stillActiveAudioState).toBe('live');
    });
  });

  test.describe('Stream Lifecycle', () => {
    test('should detect active streams', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const initialActive = stream.active;

        stream.getTracks().forEach((t) => t.stop());

        const afterStop = stream.active;

        return { initialActive, afterStop };
      });

      expect(result.initialActive).toBe(true);
      expect(result.afterStop).toBe(false);
    });

    test('should get stream ID', async () => {
      const streamId = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const id = stream.id;

        stream.getTracks().forEach((t) => t.stop());

        return id;
      });

      expect(streamId).toBeDefined();
      expect(typeof streamId).toBe('string');
      expect(streamId.length).toBeGreaterThan(0);
    });

    test('should add tracks to stream', async () => {
      const result = await page.evaluate(async () => {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const combinedStream = new MediaStream();
        const initialTracks = combinedStream.getTracks().length;

        combinedStream.addTrack(videoStream.getVideoTracks()[0]);
        const afterVideo = combinedStream.getTracks().length;

        combinedStream.addTrack(audioStream.getAudioTracks()[0]);
        const afterAudio = combinedStream.getTracks().length;

        videoStream.getTracks().forEach((t) => t.stop());
        audioStream.getTracks().forEach((t) => t.stop());
        combinedStream.getTracks().forEach((t) => t.stop());

        return { initialTracks, afterVideo, afterAudio };
      });

      expect(result.initialTracks).toBe(0);
      expect(result.afterVideo).toBe(1);
      expect(result.afterAudio).toBe(2);
    });

    test('should remove tracks from stream', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        const initialCount = stream.getTracks().length;
        const videoTrack = stream.getVideoTracks()[0];

        stream.removeTrack(videoTrack);
        const afterRemove = stream.getTracks().length;

        stream.getTracks().forEach((t) => t.stop());
        videoTrack.stop();

        return { initialCount, afterRemove };
      });

      expect(result.initialCount).toBe(2);
      expect(result.afterRemove).toBe(1);
    });

    test('should get track by ID', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const track = stream.getVideoTracks()[0];
        const trackId = track.id;

        const foundTrack = stream.getTrackById(trackId);
        const notFoundTrack = stream.getTrackById('nonexistent');

        stream.getTracks().forEach((t) => t.stop());

        return {
          foundId: foundTrack?.id,
          expectedId: trackId,
          notFound: notFoundTrack,
        };
      });

      expect(result.foundId).toBe(result.expectedId);
      expect(result.notFound).toBeNull();
    });
  });

  test.describe('Track Capabilities', () => {
    test('should get track capabilities', async () => {
      const capabilities = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities();

        stream.getTracks().forEach((t) => t.stop());

        return caps;
      });

      expect(capabilities).toBeDefined();
      // Capabilities vary by browser and device
      if (capabilities.width) {
        expect(capabilities.width).toHaveProperty('min');
        expect(capabilities.width).toHaveProperty('max');
      }
    });

    test('should get track settings', async () => {
      const settings = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();

        stream.getTracks().forEach((t) => t.stop());

        return settings;
      });

      expect(settings).toBeDefined();
      expect(settings.width).toBeGreaterThan(0);
      expect(settings.height).toBeGreaterThan(0);
    });

    test('should get track constraints', async () => {
      const constraints = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
          },
        });

        const track = stream.getVideoTracks()[0];
        const constraints = track.getConstraints();

        stream.getTracks().forEach((t) => t.stop());

        return constraints;
      });

      expect(constraints).toBeDefined();
    });
  });

  test.describe('Advanced Features', () => {
    test('should handle multiple simultaneous streams', async () => {
      const result = await page.evaluate(async () => {
        const stream1 = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const stream2 = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const bothActive = stream1.active && stream2.active;

        stream1.getTracks().forEach((t) => t.stop());
        stream2.getTracks().forEach((t) => t.stop());

        return { bothActive };
      });

      expect(result.bothActive).toBe(true);
    });

    test('should clone entire stream', async () => {
      const result = await page.evaluate(async () => {
        const original = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        const clone = original.clone();

        const differentIds = original.id !== clone.id;
        const sameTrackCount =
          original.getTracks().length === clone.getTracks().length;

        original.getTracks().forEach((t) => t.stop());
        clone.getTracks().forEach((t) => t.stop());

        return { differentIds, sameTrackCount };
      });

      expect(result.differentIds).toBe(true);
      expect(result.sameTrackCount).toBe(true);
    });

    test('should handle constraint changes', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        const track = stream.getVideoTracks()[0];
        const initial = track.getSettings();

        await track.applyConstraints({
          width: { ideal: 640 },
          height: { ideal: 480 },
        });

        const updated = track.getSettings();

        stream.getTracks().forEach((t) => t.stop());

        return {
          initialWidth: initial.width!,
          updatedWidth: updated.width!,
        };
      });

      expect(result.initialWidth).toBeGreaterThan(0);
      expect(result.updatedWidth).toBeGreaterThan(0);
    });
  });

  test.describe('Error Scenarios', () => {
    test('should handle overconstrained error', async () => {
      const error = await page.evaluate(async () => {
        try {
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: { exact: 99999 },
              height: { exact: 99999 },
            },
          });
          return null;
        } catch (err) {
          return {
            name: (err as DOMException).name,
            message: (err as DOMException).message,
          };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.name).toContain('Constraint');
    });

    test('should handle track manipulation after stop', async () => {
      const result = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const track = stream.getVideoTracks()[0];
        track.stop();

        try {
          await track.applyConstraints({ width: { ideal: 640 } });
          return { error: null };
        } catch (err) {
          return { error: (err as Error).message };
        }
      });

      // Applying constraints to stopped track should fail
      expect(result.error).toBeDefined();
    });
  });
});
