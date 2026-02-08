import './setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioRecorder } from '../audio-recorder';

describe('AudioRecorder', () => {
  let recorder: AudioRecorder;

  beforeEach(() => {
    recorder = new AudioRecorder();

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(),
      }
    });
  });

  describe('startRecording', () => {
    it('should start recording with default options', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      const stream = await recorder.startRecording();

      expect(stream).toBe(mockStream);
      expect(recorder.isRecording()).toBe(true);
    });

    it('should request microphone audio', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording({ microphone: true });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: expect.objectContaining({
          echoCancellation: true,
          noiseSuppression: true,
        }),
      });
    });

    it('should throw if already recording', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording();

      await expect(recorder.startRecording()).rejects.toThrow('Already recording');
    });

    it('should support different sample rates', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording({
        sampleRate: 48000,
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: expect.objectContaining({
          sampleRate: 48000,
        }),
      });
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and return blob', async () => {
      const mockStream = new MediaStream();
      const mockTrack = {
        stop: vi.fn(),
      };
      mockStream.getTracks = vi.fn().mockReturnValue([mockTrack]);
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording();
      const blob = await recorder.stopRecording();

      expect(blob).toBeInstanceOf(Blob);
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(recorder.isRecording()).toBe(false);
    });

    it('should throw if not recording', async () => {
      await expect(recorder.stopRecording()).rejects.toThrow('Not recording');
    });
  });

  describe('pauseRecording', () => {
    it('should pause active recording', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording();
      recorder.pauseRecording();

      expect(recorder.isPaused()).toBe(true);
    });

    it('should throw if not recording', () => {
      expect(() => recorder.pauseRecording()).toThrow('Not recording');
    });
  });

  describe('resumeRecording', () => {
    it('should resume paused recording', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording();
      recorder.pauseRecording();
      recorder.resumeRecording();

      expect(recorder.isPaused()).toBe(false);
    });

    it('should throw if not paused', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording();

      expect(() => recorder.resumeRecording()).toThrow('Not paused');
    });
  });

  describe('getAudioLevel', () => {
    it('should return current audio level', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording();
      const level = recorder.getAudioLevel();

      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    });

    it('should return 0 when not recording', () => {
      expect(recorder.getAudioLevel()).toBe(0);
    });
  });

  describe('enableNoiseCancellation', () => {
    it('should enable noise cancellation', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording({ noiseCancellation: false });
      recorder.enableNoiseCancellation();

      expect(recorder.isNoiseCancellationEnabled()).toBe(true);
    });
  });

  describe('disableNoiseCancellation', () => {
    it('should disable noise cancellation', async () => {
      const mockStream = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);

      await recorder.startRecording({ noiseCancellation: true });
      recorder.disableNoiseCancellation();

      expect(recorder.isNoiseCancellationEnabled()).toBe(false);
    });
  });
});
