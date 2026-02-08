/**
 * Integration tests for AudioRecorder with real MediaStream APIs
 * Tests audio recording and stream management across different browsers
 */

import { test, expect, type Page } from '@playwright/test';
import {
  grantMediaPermissions,
  getAudioTrackMetrics,
  isMediaRecorderSupported,
} from './helpers/media-mocks';

test.describe('AudioRecorder Integration Tests', () => {
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
    test('should start and stop audio recording', async () => {
      // Start recording
      await page.click('#start-audio');

      // Wait for recording to start
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      // Verify status
      const startStatus = await page.textContent('#audio-status');
      expect(startStatus).toContain('Recording');

      // Verify visualizer is shown
      const visualizerVisible = await page.isVisible('#audio-visualizer');
      expect(visualizerVisible).toBe(true);

      // Verify recorder state
      const isRecording = await page.evaluate(() => {
        return window.testState.audioRecorder?.isRecording();
      });
      expect(isRecording).toBe(true);

      // Wait for some audio data
      await page.waitForTimeout(1000);

      // Stop recording
      await page.click('#stop-audio');

      // Wait for audio element to appear
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });

      // Verify recording exists
      const hasRecording = await page.evaluate(() => {
        return window.testState.recordings.some((r: any) => r.type === 'audio');
      });
      expect(hasRecording).toBe(true);

      // Verify blob
      const blob = await page.evaluate(() => {
        const recording = window.testState.recordings.find(
          (r: any) => r.type === 'audio'
        );
        return {
          size: recording?.blob.size,
          type: recording?.blob.type,
        };
      });

      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toContain('audio');

      // Verify audio element has source
      const audioSrc = await page.getAttribute('#audio-playback', 'src');
      expect(audioSrc).toBeTruthy();
      expect(audioSrc).toContain('blob:');
    });

    test('should handle pause and resume', async () => {
      // Start recording
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      // Pause
      await page.click('#pause-audio');
      await page.waitForTimeout(500);

      const pauseStatus = await page.textContent('#audio-status');
      expect(pauseStatus).toContain('Paused');

      const isPaused = await page.evaluate(() => {
        return window.testState.audioRecorder?.isPaused();
      });
      expect(isPaused).toBe(true);

      // Resume
      await page.click('#resume-audio');
      await page.waitForTimeout(500);

      const resumeStatus = await page.textContent('#audio-status');
      expect(resumeStatus).toContain('Recording');

      const isRecording = await page.evaluate(() => {
        return window.testState.audioRecorder?.isRecording();
      });
      expect(isRecording).toBe(true);

      // Stop
      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });
    });

    test('should collect audio data continuously', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      // Wait for multiple data collection intervals
      await page.waitForTimeout(2000);

      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });

      const blobSize = await page.evaluate(() => {
        const recording = window.testState.recordings.find(
          (r: any) => r.type === 'audio'
        );
        return recording?.blob.size || 0;
      });

      // Should have collected multiple chunks over 2 seconds
      expect(blobSize).toBeGreaterThan(1000);
    });
  });

  test.describe('Audio Level Monitoring', () => {
    test('should provide audio level readings', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      // Wait for visualizer to update
      await page.waitForTimeout(500);

      const audioLevel = await page.evaluate(() => {
        return window.testState.audioRecorder?.getAudioLevel();
      });

      expect(audioLevel).toBeGreaterThanOrEqual(0);
      expect(audioLevel).toBeLessThanOrEqual(1);

      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });
    });

    test('should update audio level visualization', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      // Wait for multiple visualization updates
      await page.waitForTimeout(1000);

      // Verify canvas has been drawn to
      const hasVisualization = await page.evaluate(() => {
        const canvas = document.getElementById(
          'audio-visualizer'
        ) as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return false;

        // Check if canvas has been modified
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.some((value) => value !== 0);
      });

      expect(hasVisualization).toBe(true);

      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });
    });

    test('should return 0 when not recording', async () => {
      const audioLevel = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();
        return recorder.getAudioLevel();
      });

      expect(audioLevel).toBe(0);
    });
  });

  test.describe('Audio Constraints', () => {
    test('should apply noise cancellation', async () => {
      const settings = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();
        window.testState.audioRecorder = recorder;

        const stream = await recorder.startRecording({
          noiseCancellation: true,
        });

        const track = stream.getAudioTracks()[0];
        return track.getSettings();
      });

      // noiseSuppression should be enabled (browser-dependent)
      if ('noiseSuppression' in settings) {
        expect(settings.noiseSuppression).toBe(true);
      }

      await page.evaluate(() => {
        window.testState.audioRecorder?.stopRecording();
      });
    });

    test('should apply echo cancellation', async () => {
      const settings = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();
        window.testState.audioRecorder = recorder;

        const stream = await recorder.startRecording({
          echoCancellation: true,
        });

        const track = stream.getAudioTracks()[0];
        return track.getSettings();
      });

      if ('echoCancellation' in settings) {
        expect(settings.echoCancellation).toBe(true);
      }

      await page.evaluate(() => {
        window.testState.audioRecorder?.stopRecording();
      });
    });

    test('should respect sample rate', async () => {
      const settings = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();
        window.testState.audioRecorder = recorder;

        const stream = await recorder.startRecording({
          sampleRate: 48000,
        });

        const track = stream.getAudioTracks()[0];
        return track.getSettings();
      });

      if ('sampleRate' in settings) {
        expect(settings.sampleRate).toBeGreaterThan(0);
      }

      await page.evaluate(() => {
        window.testState.audioRecorder?.stopRecording();
      });
    });

    test('should work with microphone enabled', async () => {
      const streamInfo = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();
        window.testState.audioRecorder = recorder;

        const stream = await recorder.startRecording({
          microphone: true,
        });

        return {
          audioTracks: stream.getAudioTracks().length,
          active: stream.active,
        };
      });

      expect(streamInfo.audioTracks).toBeGreaterThan(0);
      expect(streamInfo.active).toBe(true);

      await page.evaluate(() => {
        window.testState.audioRecorder?.stopRecording();
      });
    });

    test('should work without microphone', async () => {
      const streamInfo = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        const stream = await recorder.startRecording({
          microphone: false,
        });

        return {
          audioTracks: stream.getAudioTracks().length,
        };
      });

      expect(streamInfo.audioTracks).toBe(0);
    });
  });

  test.describe('Noise Cancellation Control', () => {
    test('should enable noise cancellation dynamically', async () => {
      const result = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        recorder.enableNoiseCancellation();
        return recorder.isNoiseCancellationEnabled();
      });

      expect(result).toBe(true);
    });

    test('should disable noise cancellation dynamically', async () => {
      const result = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        recorder.enableNoiseCancellation();
        recorder.disableNoiseCancellation();
        return recorder.isNoiseCancellationEnabled();
      });

      expect(result).toBe(false);
    });

    test('should report noise cancellation state', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      const enabled = await page.evaluate(() => {
        return window.testState.audioRecorder?.isNoiseCancellationEnabled();
      });

      expect(typeof enabled).toBe('boolean');

      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle already recording error', async () => {
      const error = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        await recorder.startRecording();

        try {
          await recorder.startRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message };
        } finally {
          await recorder.stopRecording();
        }
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('Already recording');
    });

    test('should handle stop without recording', async () => {
      const error = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        try {
          await recorder.stopRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('Not recording');
    });

    test('should handle pause without recording', async () => {
      const error = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        try {
          recorder.pauseRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message };
        }
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('Not recording');
    });

    test('should handle resume when not paused', async () => {
      const error = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        await recorder.startRecording();

        try {
          recorder.resumeRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message };
        } finally {
          await recorder.stopRecording();
        }
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('Not paused');
    });

    test('should handle pause when already paused', async () => {
      const error = await page.evaluate(async () => {
        const { AudioRecorder } = await import('/dist/index.mjs');
        const recorder = new AudioRecorder();

        await recorder.startRecording();
        recorder.pauseRecording();

        try {
          recorder.pauseRecording();
          return null;
        } catch (err) {
          return { message: (err as Error).message };
        } finally {
          recorder.resumeRecording();
          await recorder.stopRecording();
        }
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('Already paused');
    });
  });

  test.describe('State Management', () => {
    test('should track recording state correctly', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      const states = await page.evaluate(() => {
        return {
          isRecording: window.testState.audioRecorder?.isRecording(),
          isPaused: window.testState.audioRecorder?.isPaused(),
        };
      });

      expect(states.isRecording).toBe(true);
      expect(states.isPaused).toBe(false);

      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });

      const finalStates = await page.evaluate(() => {
        return {
          isRecording: window.testState.audioRecorder?.isRecording(),
          isPaused: window.testState.audioRecorder?.isPaused(),
        };
      });

      expect(finalStates.isRecording).toBe(false);
      expect(finalStates.isPaused).toBe(false);
    });

    test('should track paused state correctly', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      await page.click('#pause-audio');
      await page.waitForTimeout(500);

      const pausedStates = await page.evaluate(() => {
        return {
          isRecording: window.testState.audioRecorder?.isRecording(),
          isPaused: window.testState.audioRecorder?.isPaused(),
        };
      });

      expect(pausedStates.isRecording).toBe(true);
      expect(pausedStates.isPaused).toBe(true);

      await page.click('#resume-audio');
      await page.waitForTimeout(500);

      const resumedStates = await page.evaluate(() => {
        return {
          isRecording: window.testState.audioRecorder?.isRecording(),
          isPaused: window.testState.audioRecorder?.isPaused(),
        };
      });

      expect(resumedStates.isRecording).toBe(true);
      expect(resumedStates.isPaused).toBe(false);

      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });
    });
  });

  test.describe('MIME Type Support', () => {
    test('should use appropriate audio MIME type', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });

      const mimeType = await page.evaluate(() => {
        const recording = window.testState.recordings.find(
          (r: any) => r.type === 'audio'
        );
        return recording?.blob.type;
      });

      expect(mimeType).toBeTruthy();
      expect(mimeType).toContain('audio');
      expect(mimeType).toContain('webm');
    });

    test('should support opus codec', async () => {
      const isSupported = await page.evaluate(() => {
        return MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
      });

      // Most modern browsers support opus
      expect(isSupported).toBe(true);
    });
  });

  test.describe('Resource Cleanup', () => {
    test('should cleanup resources on stop', async () => {
      await page.click('#start-audio');
      await page.waitForSelector('#audio-status.success', { timeout: 10000 });

      await page.click('#stop-audio');
      await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });

      // Verify cleanup
      const state = await page.evaluate(() => {
        return {
          isRecording: window.testState.audioRecorder?.isRecording(),
          isPaused: window.testState.audioRecorder?.isPaused(),
        };
      });

      expect(state.isRecording).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    test('should handle multiple recording cycles', async () => {
      for (let i = 0; i < 3; i++) {
        await page.click('#start-audio');
        await page.waitForSelector('#audio-status.success', { timeout: 10000 });
        await page.waitForTimeout(500);
        await page.click('#stop-audio');
        await page.waitForSelector('#audio-playback[src]', { timeout: 10000 });

        // Clear for next iteration
        await page.evaluate(() => {
          const audio = document.getElementById(
            'audio-playback'
          ) as HTMLAudioElement;
          if (audio) audio.src = '';
        });
      }

      const recordingCount = await page.evaluate(() => {
        return window.testState.recordings.filter(
          (r: any) => r.type === 'audio'
        ).length;
      });

      expect(recordingCount).toBe(3);
    });
  });
});
