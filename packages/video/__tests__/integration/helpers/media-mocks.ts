/**
 * Media mocks and utilities for integration tests
 * Provides helpers for testing MediaStream APIs
 */

import type { Page } from '@playwright/test';

/**
 * Grant all necessary media permissions
 */
export async function grantMediaPermissions(page: Page): Promise<void> {
  const context = page.context();
  await context.grantPermissions(['camera', 'microphone'], {
    origin: page.url(),
  });
}

/**
 * Setup fake media devices for testing
 * This ensures consistent test results without real hardware
 */
export async function setupFakeMediaDevices(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Create fake video and audio tracks
    const fakeVideoTrack = {
      kind: 'video' as const,
      id: 'fake-video-track',
      label: 'Fake Video Track',
      enabled: true,
      muted: false,
      readyState: 'live' as const,
      getSettings: () => ({
        width: 1280,
        height: 720,
        frameRate: 30,
        facingMode: 'user',
        aspectRatio: 1280 / 720,
        deviceId: 'fake-video-device',
      }),
      getCapabilities: () => ({
        width: { min: 640, max: 1920 },
        height: { min: 480, max: 1080 },
        frameRate: { min: 15, max: 60 },
      }),
      getConstraints: () => ({}),
      applyConstraints: async (constraints: any) => {
        // Apply constraints simulation
        return Promise.resolve();
      },
      stop: () => {},
      clone: () => ({ ...fakeVideoTrack }),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
      onended: null,
      onmute: null,
      onunmute: null,
      contentHint: '',
    };

    const fakeAudioTrack = {
      kind: 'audio' as const,
      id: 'fake-audio-track',
      label: 'Fake Audio Track',
      enabled: true,
      muted: false,
      readyState: 'live' as const,
      getSettings: () => ({
        sampleRate: 44100,
        channelCount: 2,
        echoCancellation: true,
        noiseSuppression: true,
        deviceId: 'fake-audio-device',
      }),
      getCapabilities: () => ({
        sampleRate: { min: 8000, max: 48000 },
        channelCount: { min: 1, max: 2 },
      }),
      getConstraints: () => ({}),
      applyConstraints: async (constraints: any) => {
        return Promise.resolve();
      },
      stop: () => {},
      clone: () => ({ ...fakeAudioTrack }),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
      onended: null,
      onmute: null,
      onunmute: null,
      contentHint: '',
    };

    // Store original MediaStream
    const OriginalMediaStream = window.MediaStream;

    // Mock MediaStream
    class MockMediaStream extends OriginalMediaStream {
      private tracks: any[] = [];
      private _active = true;
      private _id = `mock-stream-${Date.now()}`;

      constructor(tracks?: any[] | MediaStream) {
        super();

        if (Array.isArray(tracks)) {
          this.tracks = tracks;
        } else if (tracks instanceof MediaStream) {
          this.tracks = [...tracks.getVideoTracks(), ...tracks.getAudioTracks()];
        }
      }

      get active() {
        return this._active && this.tracks.some((t) => t.readyState === 'live');
      }

      get id() {
        return this._id;
      }

      getVideoTracks() {
        return this.tracks.filter((t) => t.kind === 'video');
      }

      getAudioTracks() {
        return this.tracks.filter((t) => t.kind === 'audio');
      }

      getTracks() {
        return [...this.tracks];
      }

      getTrackById(id: string) {
        return this.tracks.find((t) => t.id === id) || null;
      }

      addTrack(track: any) {
        if (!this.tracks.includes(track)) {
          this.tracks.push(track);
        }
      }

      removeTrack(track: any) {
        const index = this.tracks.indexOf(track);
        if (index > -1) {
          this.tracks.splice(index, 1);
        }
      }

      clone() {
        return new MockMediaStream(this.tracks.map((t) => t.clone()));
      }
    }

    // Replace global MediaStream
    (window as any).MediaStream = MockMediaStream;

    // Mock enumerateDevices
    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
    navigator.mediaDevices.enumerateDevices = async () => {
      return [
        {
          deviceId: 'fake-video-device',
          groupId: 'fake-group-1',
          kind: 'videoinput' as MediaDeviceKind,
          label: 'Fake Camera',
          toJSON: function () {
            return this;
          },
        },
        {
          deviceId: 'fake-audio-device',
          groupId: 'fake-group-2',
          kind: 'audioinput' as MediaDeviceKind,
          label: 'Fake Microphone',
          toJSON: function () {
            return this;
          },
        },
        {
          deviceId: 'fake-audio-output',
          groupId: 'fake-group-3',
          kind: 'audiooutput' as MediaDeviceKind,
          label: 'Fake Speakers',
          toJSON: function () {
            return this;
          },
        },
      ];
    };

    // Store for test access
    (window as any).__mediaTestHelpers = {
      fakeVideoTrack,
      fakeAudioTrack,
      MockMediaStream,
      originalEnumerateDevices,
    };
  });
}

/**
 * Wait for MediaStream to be active
 */
export async function waitForStreamActive(
  page: Page,
  streamGetter: string,
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (getter) => {
      const stream = eval(getter);
      return stream && stream.active;
    },
    { timeout },
    streamGetter
  );
}

/**
 * Wait for MediaRecorder to be recording
 */
export async function waitForRecorderState(
  page: Page,
  recorderGetter: string,
  state: 'recording' | 'paused' | 'inactive',
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (args) => {
      const recorder = eval(args.getter);
      return recorder && recorder.state === args.state;
    },
    { timeout },
    { getter: recorderGetter, state }
  );
}

/**
 * Get blob size from page
 */
export async function getBlobSize(page: Page, blobGetter: string): Promise<number> {
  return page.evaluate((getter) => {
    const blob = eval(getter);
    return blob ? blob.size : 0;
  }, blobGetter);
}

/**
 * Check if MediaRecorder is supported
 */
export async function isMediaRecorderSupported(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return typeof MediaRecorder !== 'undefined';
  });
}

/**
 * Get supported MIME types
 */
export async function getSupportedMimeTypes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
    ];

    return types.filter((type) => MediaRecorder.isTypeSupported(type));
  });
}

/**
 * Create a test error scenario
 */
export async function simulateMediaError(
  page: Page,
  errorType: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError'
): Promise<void> {
  await page.evaluate((type) => {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException(`Simulated ${type}`, type);
    };

    // Store original for restoration
    (window as any).__originalGetUserMedia = originalGetUserMedia;
  }, errorType);
}

/**
 * Restore media APIs after error simulation
 */
export async function restoreMediaAPIs(page: Page): Promise<void> {
  await page.evaluate(() => {
    if ((window as any).__originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = (window as any).__originalGetUserMedia;
      delete (window as any).__originalGetUserMedia;
    }
  });
}

/**
 * Get video track metrics
 */
export async function getVideoTrackMetrics(
  page: Page,
  streamGetter: string
): Promise<{
  width: number;
  height: number;
  frameRate: number;
  aspectRatio: number;
}> {
  return page.evaluate((getter) => {
    const stream = eval(getter);
    if (!stream) {
      throw new Error('Stream not found');
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track found');
    }

    const settings = videoTrack.getSettings();
    return {
      width: settings.width || 0,
      height: settings.height || 0,
      frameRate: settings.frameRate || 0,
      aspectRatio: settings.aspectRatio || 0,
    };
  }, streamGetter);
}

/**
 * Get audio track metrics
 */
export async function getAudioTrackMetrics(
  page: Page,
  streamGetter: string
): Promise<{
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}> {
  return page.evaluate((getter) => {
    const stream = eval(getter);
    if (!stream) {
      throw new Error('Stream not found');
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('No audio track found');
    }

    const settings = audioTrack.getSettings();
    return {
      sampleRate: settings.sampleRate || 0,
      channelCount: settings.channelCount || 0,
      echoCancellation: settings.echoCancellation || false,
      noiseSuppression: settings.noiseSuppression || false,
    };
  }, streamGetter);
}
