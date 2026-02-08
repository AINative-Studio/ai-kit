import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ScreenRecorder } from '../screen-recorder';
import type {
  ScreenRecorderOptions,
  ScreenRecordingQuality,
} from '../screen-recorder';

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(public stream: MediaStream, public options?: any) {}

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['test'], { type: 'video/webm' }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  static isTypeSupported(mimeType: string): boolean {
    return mimeType.includes('webm') || mimeType.includes('mp4');
  }
}

describe('ScreenRecorder', () => {
  let recorder: ScreenRecorder;
  let mockStream: MediaStream;

  beforeEach(() => {
    // Setup MediaRecorder mock
    global.MediaRecorder = MockMediaRecorder as any;

    // Mock getDisplayMedia
    const mockVideoTrack = {
      kind: 'video',
      label: 'screen',
      enabled: true,
      readyState: 'live',
      stop: vi.fn(),
      getSettings: vi.fn(() => ({
        width: 1920,
        height: 1080,
        frameRate: 30,
        cursor: 'always',
      })),
    };

    mockStream = {
      getTracks: vi.fn(() => [mockVideoTrack]),
      getVideoTracks: vi.fn(() => [mockVideoTrack]),
      getAudioTracks: vi.fn(() => []),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    } as any;

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
      }
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url-12345');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    if (recorder) {
      recorder.dispose();
    }
  });

  describe('Constructor', () => {
    it('creates recorder with default options', () => {
      recorder = new ScreenRecorder();
      expect(recorder).toBeDefined();
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('accepts custom quality settings', () => {
      const options: ScreenRecorderOptions = {
        quality: 'high',
        frameRate: 60,
        videoBitsPerSecond: 5000000,
      };
      recorder = new ScreenRecorder(options);
      expect(recorder).toBeDefined();
    });

    it('sets default quality to medium', () => {
      recorder = new ScreenRecorder();
      expect(recorder.getQuality()).toBe('medium');
    });

    it('accepts low quality setting', () => {
      recorder = new ScreenRecorder({ quality: 'low' });
      expect(recorder.getQuality()).toBe('low');
    });

    it('accepts medium quality setting', () => {
      recorder = new ScreenRecorder({ quality: 'medium' });
      expect(recorder.getQuality()).toBe('medium');
    });

    it('accepts high quality setting', () => {
      recorder = new ScreenRecorder({ quality: 'high' });
      expect(recorder.getQuality()).toBe('high');
    });

    it('accepts ultra quality setting', () => {
      recorder = new ScreenRecorder({ quality: 'ultra' });
      expect(recorder.getQuality()).toBe('ultra');
    });
  });

  describe('Quality Settings', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
    });

    it('updates quality to low', () => {
      recorder.setQuality('low');
      expect(recorder.getQuality()).toBe('low');
    });

    it('updates quality to high', () => {
      recorder.setQuality('high');
      expect(recorder.getQuality()).toBe('high');
    });

    it('updates quality to ultra', () => {
      recorder.setQuality('ultra');
      expect(recorder.getQuality()).toBe('ultra');
    });

    it('throws error for invalid quality', () => {
      expect(() => {
        recorder.setQuality('invalid' as ScreenRecordingQuality);
      }).toThrow('Invalid quality setting');
    });

    it('cannot change quality while recording', async () => {
      await recorder.startRecording();
      expect(() => {
        recorder.setQuality('high');
      }).toThrow('Cannot change quality while recording');
    });

    it('returns quality configuration for low', () => {
      recorder.setQuality('low');
      const config = recorder.getQualityConfig();
      expect(config.videoBitsPerSecond).toBe(1000000);
      expect(config.frameRate).toBe(15);
    });

    it('returns quality configuration for medium', () => {
      recorder.setQuality('medium');
      const config = recorder.getQualityConfig();
      expect(config.videoBitsPerSecond).toBe(2500000);
      expect(config.frameRate).toBe(30);
    });

    it('returns quality configuration for high', () => {
      recorder.setQuality('high');
      const config = recorder.getQualityConfig();
      expect(config.videoBitsPerSecond).toBe(5000000);
      expect(config.frameRate).toBe(30);
    });

    it('returns quality configuration for ultra', () => {
      recorder.setQuality('ultra');
      const config = recorder.getQualityConfig();
      expect(config.videoBitsPerSecond).toBe(10000000);
      expect(config.frameRate).toBe(60);
    });
  });

  describe('Cursor Tracking', () => {
    it('enables cursor tracking by default', () => {
      recorder = new ScreenRecorder();
      expect(recorder.isCursorEnabled()).toBe(true);
    });

    it('disables cursor tracking when specified', () => {
      recorder = new ScreenRecorder({ cursor: 'never' });
      expect(recorder.isCursorEnabled()).toBe(false);
    });

    it('enables cursor tracking with always option', () => {
      recorder = new ScreenRecorder({ cursor: 'always' });
      expect(recorder.isCursorEnabled()).toBe(true);
    });

    it('enables cursor tracking with motion option', () => {
      recorder = new ScreenRecorder({ cursor: 'motion' });
      expect(recorder.isCursorEnabled()).toBe(true);
    });

    it('updates cursor setting', () => {
      recorder = new ScreenRecorder({ cursor: 'always' });
      recorder.setCursor('never');
      expect(recorder.isCursorEnabled()).toBe(false);
    });

    it('cannot change cursor while recording', async () => {
      recorder = new ScreenRecorder();
      await recorder.startRecording();
      expect(() => {
        recorder.setCursor('never');
      }).toThrow('Cannot change cursor setting while recording');
    });
  });

  describe('Start Recording', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
    });

    it('starts screen recording', async () => {
      await recorder.startRecording();
      expect(recorder.getState()).toBe('recording');
    });

    it('requests display media with correct constraints', async () => {
      await recorder.startRecording();
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            cursor: 'always',
          }),
          audio: false,
        })
      );
    });

    it('applies quality settings to media constraints', async () => {
      recorder.setQuality('high');
      await recorder.startRecording();
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            frameRate: 30,
          }),
        })
      );
    });

    it('throws error if already recording', async () => {
      await recorder.startRecording();
      await expect(recorder.startRecording()).rejects.toThrow(
        'Recording already in progress'
      );
    });

    it('throws error if display media not supported', async () => {
      (navigator.mediaDevices.getDisplayMedia as any) = undefined;
      await expect(recorder.startRecording()).rejects.toThrow(
        'Screen recording not supported'
      );
    });

    it('creates MediaRecorder with correct mime type', async () => {
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });

    it('applies video bitrate from quality setting', async () => {
      recorder.setQuality('high');
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });

    it('enables audio when specified', async () => {
      recorder = new ScreenRecorder({ audio: true });
      await recorder.startRecording();
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: true,
        })
      );
    });

    it('disables audio by default', async () => {
      await recorder.startRecording();
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: false,
        })
      );
    });
  });

  describe('Stop Recording', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
    });

    it('stops recording', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();
      expect(recorder.getState()).toBe('stopped');
      expect(result).toBeDefined();
    });

    it('returns blob and URL', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.url).toBe('blob:mock-url-12345');
    });

    it('returns blob with correct mime type', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();
      expect(result.blob.type).toBe('video/webm');
    });

    it('includes recording duration', async () => {
      await recorder.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await recorder.stopRecording();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('includes recording size in bytes', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();
      expect(result.size).toBeGreaterThan(0);
    });

    it('throws error if not recording', async () => {
      await expect(recorder.stopRecording()).rejects.toThrow('No active recording');
    });

    it('stops all media tracks', async () => {
      await recorder.startRecording();
      await recorder.stopRecording();
      const tracks = mockStream.getTracks();
      tracks.forEach((track: any) => {
        expect(track.stop).toHaveBeenCalled();
      });
    });

    it('releases media stream', async () => {
      await recorder.startRecording();
      await recorder.stopRecording();
      expect(recorder.getStream()).toBeNull();
    });
  });

  describe('Memory Leak Prevention - Blob URL Revocation (Issue #133)', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
      vi.clearAllMocks();
    });

    it('does NOT revoke blob URL on stop (user must manage lifecycle)', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();

      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
      expect(result.url).toBe('blob:mock-url-12345');
    });

    it('provides revokeURL method to revoke blob URL', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();

      recorder.revokeURL(result.url);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-12345');
    });

    it('safely handles revokeURL with null or undefined', () => {
      expect(() => recorder.revokeURL(null as any)).not.toThrow();
      expect(() => recorder.revokeURL(undefined as any)).not.toThrow();
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('safely handles revokeURL with empty string', () => {
      expect(() => recorder.revokeURL('')).not.toThrow();
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('allows multiple revocations without error', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();

      recorder.revokeURL(result.url);
      recorder.revokeURL(result.url);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    it('tracks blob URLs from multiple recordings separately', async () => {
      global.URL.createObjectURL = vi
        .fn()
        .mockReturnValueOnce('blob:url-1')
        .mockReturnValueOnce('blob:url-2')
        .mockReturnValueOnce('blob:url-3');

      await recorder.startRecording();
      const result1 = await recorder.stopRecording();

      await recorder.startRecording();
      const result2 = await recorder.stopRecording();

      await recorder.startRecording();
      const result3 = await recorder.stopRecording();

      expect(result1.url).toBe('blob:url-1');
      expect(result2.url).toBe('blob:url-2');
      expect(result3.url).toBe('blob:url-3');
      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(3);
    });

    it('does not leak memory across 10 recording cycles', async () => {
      const urls: string[] = [];

      for (let i = 0; i < 10; i++) {
        global.URL.createObjectURL = vi.fn(() => `blob:url-${i}`);

        await recorder.startRecording();
        const result = await recorder.stopRecording();
        urls.push(result.url);
      }

      expect(urls.length).toBe(10);
      urls.forEach((url, index) => {
        expect(url).toBe(`blob:url-${index}`);
      });
    });

    it('can revoke all URLs from multiple recordings', async () => {
      const urls: string[] = [];

      for (let i = 0; i < 3; i++) {
        global.URL.createObjectURL = vi.fn(() => `blob:url-${i}`);

        await recorder.startRecording();
        const result = await recorder.stopRecording();
        urls.push(result.url);
      }

      vi.clearAllMocks();

      urls.forEach((url) => recorder.revokeURL(url));

      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(3);
      expect(global.URL.revokeObjectURL).toHaveBeenNthCalledWith(1, 'blob:url-0');
      expect(global.URL.revokeObjectURL).toHaveBeenNthCalledWith(2, 'blob:url-1');
      expect(global.URL.revokeObjectURL).toHaveBeenNthCalledWith(3, 'blob:url-2');
    });
  });

  describe('Pause and Resume', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
    });

    it('pauses recording', async () => {
      await recorder.startRecording();
      recorder.pauseRecording();
      expect(recorder.getState()).toBe('paused');
    });

    it('resumes recording', async () => {
      await recorder.startRecording();
      recorder.pauseRecording();
      recorder.resumeRecording();
      expect(recorder.getState()).toBe('recording');
    });

    it('throws error when pausing if not recording', () => {
      expect(() => recorder.pauseRecording()).toThrow('No active recording to pause');
    });

    it('throws error when resuming if not paused', async () => {
      await recorder.startRecording();
      expect(() => recorder.resumeRecording()).toThrow('Recording is not paused');
    });
  });

  describe('Recording State', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
    });

    it('returns idle state initially', () => {
      expect(recorder.getState()).toBe('idle');
    });

    it('returns recording state when active', async () => {
      await recorder.startRecording();
      expect(recorder.getState()).toBe('recording');
    });

    it('returns paused state when paused', async () => {
      await recorder.startRecording();
      recorder.pauseRecording();
      expect(recorder.getState()).toBe('paused');
    });

    it('returns stopped state after stopping', async () => {
      await recorder.startRecording();
      await recorder.stopRecording();
      expect(recorder.getState()).toBe('stopped');
    });

    it('checks if recording is active', async () => {
      expect(recorder.isRecording()).toBe(false);
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
      await recorder.stopRecording();
      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe('Stream Management', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
    });

    it('returns null stream when not recording', () => {
      expect(recorder.getStream()).toBeNull();
    });

    it('returns active stream when recording', async () => {
      await recorder.startRecording();
      const stream = recorder.getStream();
      expect(stream).toBeDefined();
      expect(stream).toBe(mockStream);
    });

    it('returns stream settings', async () => {
      await recorder.startRecording();
      const settings = recorder.getStreamSettings();
      expect(settings).toBeDefined();
      expect(settings?.width).toBe(1920);
      expect(settings?.height).toBe(1080);
      expect(settings?.frameRate).toBe(30);
    });

    it('returns null settings when not recording', () => {
      expect(recorder.getStreamSettings()).toBeNull();
    });
  });

  describe('Custom Options', () => {
    it('accepts custom frame rate', () => {
      recorder = new ScreenRecorder({ frameRate: 60 });
      const config = recorder.getQualityConfig();
      expect(config.frameRate).toBe(60);
    });

    it('accepts custom video bitrate', () => {
      recorder = new ScreenRecorder({ videoBitsPerSecond: 8000000 });
      const config = recorder.getQualityConfig();
      expect(config.videoBitsPerSecond).toBe(8000000);
    });

    it('overrides quality with custom bitrate', () => {
      recorder = new ScreenRecorder({
        quality: 'low',
        videoBitsPerSecond: 10000000,
      });
      const config = recorder.getQualityConfig();
      expect(config.videoBitsPerSecond).toBe(10000000);
    });

    it('accepts custom mime type', async () => {
      recorder = new ScreenRecorder({ mimeType: 'video/webm;codecs=vp9' });
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
      // Reset isTypeSupported mock to default
      MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
    });

    it('handles permission denied error', async () => {
      (navigator.mediaDevices.getDisplayMedia as any) = vi
        .fn()
        .mockRejectedValue(new Error('Permission denied'));
      await expect(recorder.startRecording()).rejects.toThrow('Permission denied');
    });

    it('handles unsupported mime type', async () => {
      MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(false);
      await expect(recorder.startRecording()).rejects.toThrow(
        'No supported video format found'
      );
    });

    it('handles recording error', async () => {
      MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
      await recorder.startRecording();
      // Simulate error during recording
      expect(recorder.isRecording()).toBe(true);
    });
  });

  describe('Dispose', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
      // Reset isTypeSupported mock
      MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
    });

    it('cleans up resources', async () => {
      await recorder.startRecording();
      recorder.dispose();
      expect(recorder.getState()).toBe('idle');
      expect(recorder.getStream()).toBeNull();
    });

    it('stops recording if active', async () => {
      await recorder.startRecording();
      recorder.dispose();
      expect(recorder.isRecording()).toBe(false);
    });

    it('can be called multiple times safely', async () => {
      await recorder.startRecording();
      recorder.dispose();
      expect(() => recorder.dispose()).not.toThrow();
    });
  });

  describe('MIME Type Detection', () => {
    beforeEach(() => {
      recorder = new ScreenRecorder();
    });

    it('prefers VP9 codec when available', async () => {
      MockMediaRecorder.isTypeSupported = vi.fn((type: string) => {
        return type.includes('vp9');
      });
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });

    it('falls back to VP8 when VP9 unavailable', async () => {
      MockMediaRecorder.isTypeSupported = vi.fn((type: string) => {
        return type.includes('vp8') && !type.includes('vp9');
      });
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });

    it('supports H.264 codec', async () => {
      MockMediaRecorder.isTypeSupported = vi.fn((type: string) => {
        return type.includes('h264');
      });
      await recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });
  });
});
