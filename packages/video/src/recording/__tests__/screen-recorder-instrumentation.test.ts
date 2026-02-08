/**
 * ScreenRecorder Instrumentation Tests - Issue #135
 *
 * Comprehensive tests for observability instrumentation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InstrumentedScreenRecorder } from '../instrumented-screen-recorder';
import { Logger } from '../../utils/logger';

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  mimeType = 'video/webm;codecs=vp9';

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

describe('ScreenRecorder Instrumentation', () => {
  let recorder: InstrumentedScreenRecorder;
  let mockStream: MediaStream;
  let logger: Logger;
  let loggerDebugSpy: any;
  let loggerInfoSpy: any;
  let loggerErrorSpy: any;

  beforeEach(() => {
    // Setup MediaRecorder mock
    global.MediaRecorder = MockMediaRecorder as any;

    // Ensure isTypeSupported returns true by default
    MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

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

    // Create logger and spy on methods
    logger = new Logger({ enabled: true });
    loggerDebugSpy = vi.spyOn(logger, 'debug');
    loggerInfoSpy = vi.spyOn(logger, 'info');
    loggerErrorSpy = vi.spyOn(logger, 'error');

    // Create recorder with logger
    recorder = new InstrumentedScreenRecorder({}, logger);
  });

  afterEach(() => {
    if (recorder) {
      recorder.dispose();
    }
    vi.restoreAllMocks();
  });

  describe('Recording Lifecycle Logging', () => {
    it('should log recording_started event with all required fields', async () => {
      await recorder.startRecording();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'recording_started',
        expect.objectContaining({
          recordingId: expect.any(String),
          mimeType: expect.any(String),
          videoBitsPerSecond: expect.any(Number),
          quality: 'medium',
          cursor: 'always',
          audio: false,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log recording_stopped event with duration and metrics', async () => {
      await recorder.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await recorder.stopRecording();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'recording_stopped',
        expect.objectContaining({
          recordingId: expect.any(String),
          duration: expect.any(Number),
          fileSize: expect.any(Number),
          chunksReceived: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );

      // Verify metrics are accurate
      const stopCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_stopped'
      );
      expect(stopCall[1].duration).toBeGreaterThan(0);
      expect(stopCall[1].fileSize).toBe(result.size);
    });

    it('should log recording_paused event', async () => {
      await recorder.startRecording();
      recorder.pauseRecording();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'recording_paused',
        expect.objectContaining({
          recordingId: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log recording_resumed event', async () => {
      await recorder.startRecording();
      recorder.pauseRecording();
      recorder.resumeRecording();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        'recording_resumed',
        expect.objectContaining({
          recordingId: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should use consistent recordingId across lifecycle', async () => {
      await recorder.startRecording();
      recorder.pauseRecording();
      recorder.resumeRecording();
      await recorder.stopRecording();

      const startCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_started'
      );
      const pauseCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_paused'
      );
      const resumeCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_resumed'
      );
      const stopCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_stopped'
      );

      const recordingId = startCall[1].recordingId;
      expect(pauseCall[1].recordingId).toBe(recordingId);
      expect(resumeCall[1].recordingId).toBe(recordingId);
      expect(stopCall[1].recordingId).toBe(recordingId);
    });
  });

  describe('Error Tracking', () => {
    it('should log recording_failed event on permission denied', async () => {
      global.navigator.mediaDevices.getDisplayMedia = vi
        .fn()
        .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));

      await expect(recorder.startRecording()).rejects.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'recording_failed',
        expect.objectContaining({
          recordingId: expect.any(String),
          error: expect.any(String),
          errorCode: 'NotAllowedError',
          phase: 'start',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log recording_failed event on unsupported format', async () => {
      MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(false);

      await expect(recorder.startRecording()).rejects.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'recording_failed',
        expect.objectContaining({
          recordingId: expect.any(String),
          error: 'No supported video format found',
          errorCode: 'UNSUPPORTED_FORMAT',
          phase: 'start',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log browser compatibility information', async () => {
      await recorder.startRecording();

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'browser_compatibility',
        expect.objectContaining({
          selectedCodec: expect.any(String),
          supported: true,
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Performance Tracking', () => {
    it('should track recording duration', async () => {
      await recorder.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await recorder.stopRecording();

      const stopCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_stopped'
      );

      expect(stopCall[1].duration).toBeGreaterThanOrEqual(100);
      expect(stopCall[1].duration).toBeLessThan(300);
    });

    it('should track file size in bytes', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();

      const stopCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_stopped'
      );

      expect(stopCall[1].fileSize).toBe(result.size);
      expect(stopCall[1].fileSize).toBeGreaterThan(0);
    });

    it('should track number of chunks received', async () => {
      await recorder.startRecording();
      await recorder.stopRecording();

      const stopCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_stopped'
      );

      expect(stopCall[1].chunksReceived).toBeGreaterThanOrEqual(1);
    });

    it('should log performance metrics', async () => {
      await recorder.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await recorder.stopRecording();

      const metricsCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'performance_metrics'
      );

      expect(metricsCall).toBeDefined();
      expect(metricsCall[1]).toMatchObject({
        recordingId: expect.any(String),
        duration: expect.any(Number),
        fileSize: expect.any(Number),
        avgBitrate: expect.any(Number),
        timestamp: expect.any(Number),
      });
    });

    it('should calculate average bitrate correctly', async () => {
      await recorder.startRecording();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = await recorder.stopRecording();

      const metricsCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'performance_metrics'
      );

      const expectedBitrate = (result.size * 8) / (metricsCall[1].duration / 1000);
      expect(metricsCall[1].avgBitrate).toBeCloseTo(expectedBitrate, -2);
    });
  });

  describe('Stream Configuration Logging', () => {
    it('should log stream settings on start', async () => {
      await recorder.startRecording();

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'stream_configured',
        expect.objectContaining({
          recordingId: expect.any(String),
          width: 1920,
          height: 1080,
          frameRate: 30,
          cursor: 'always',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log quality configuration', async () => {
      const highQualityRecorder = new InstrumentedScreenRecorder({ quality: 'high' }, logger);
      await highQualityRecorder.startRecording();

      const startCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_started'
      );

      expect(startCall[1].quality).toBe('high');
      expect(startCall[1].videoBitsPerSecond).toBe(5000000);

      highQualityRecorder.dispose();
    });
  });

  describe('State Transition Logging', () => {
    it('should log state transitions', async () => {
      await recorder.startRecording();

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'state_transition',
        expect.objectContaining({
          recordingId: expect.any(String),
          from: 'idle',
          to: 'recording',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log pause state transition', async () => {
      await recorder.startRecording();
      loggerDebugSpy.mockClear();
      recorder.pauseRecording();

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'state_transition',
        expect.objectContaining({
          recordingId: expect.any(String),
          from: 'recording',
          to: 'paused',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log resume state transition', async () => {
      await recorder.startRecording();
      recorder.pauseRecording();
      loggerDebugSpy.mockClear();
      recorder.resumeRecording();

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'state_transition',
        expect.objectContaining({
          recordingId: expect.any(String),
          from: 'paused',
          to: 'recording',
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Resource Cleanup Logging', () => {
    it('should log resource cleanup on dispose', async () => {
      await recorder.startRecording();
      recorder.dispose();

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'resources_cleaned',
        expect.objectContaining({
          recordingId: expect.any(String),
          tracksStopped: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should log resource cleanup on stop', async () => {
      await recorder.startRecording();
      await recorder.stopRecording();

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'resources_cleaned',
        expect.objectContaining({
          recordingId: expect.any(String),
          tracksStopped: 1,
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('External Event Emission', () => {
    it('should emit events for external monitoring systems', async () => {
      const eventHandler = vi.fn();
      logger.on('log', eventHandler);

      await recorder.startRecording();
      await recorder.stopRecording();

      // Should have received start, stop, and performance metrics events
      expect(eventHandler).toHaveBeenCalled();
      expect(eventHandler.mock.calls.length).toBeGreaterThanOrEqual(3);

      // Verify events include recording_started, recording_stopped, and performance_metrics
      const eventTypes = eventHandler.mock.calls.map((call: any) => call[0].event);
      expect(eventTypes).toContain('recording_started');
      expect(eventTypes).toContain('recording_stopped');
      expect(eventTypes).toContain('performance_metrics');

      logger.off('log', eventHandler);
    });
  });

  describe('Logging Configuration', () => {
    it('should work without logger (no errors)', async () => {
      const noLoggerRecorder = new InstrumentedScreenRecorder();
      await noLoggerRecorder.startRecording();
      await noLoggerRecorder.stopRecording();
      expect(() => noLoggerRecorder.dispose()).not.toThrow();
    });

    it('should respect logger enabled setting', async () => {
      const disabledLogger = new Logger({ enabled: false });
      const disabledLoggerSpy = vi.spyOn(disabledLogger, 'info');
      const disabledRecorder = new InstrumentedScreenRecorder({}, disabledLogger);

      await disabledRecorder.startRecording();
      await disabledRecorder.stopRecording();

      // Logger called but output suppressed
      expect(disabledLoggerSpy).toHaveBeenCalled();

      disabledRecorder.dispose();
    });
  });

  describe('Correlation ID Support', () => {
    it('should support correlation ID for request tracking', async () => {
      const correlationId = 'corr_test_123';
      const correlatedRecorder = new InstrumentedScreenRecorder({}, logger, correlationId);

      await correlatedRecorder.startRecording();

      const startCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_started'
      );

      expect(startCall[1].correlationId).toBe(correlationId);

      correlatedRecorder.dispose();
    });

    it('should propagate correlation ID through lifecycle', async () => {
      const correlationId = 'corr_test_456';
      const correlatedRecorder = new InstrumentedScreenRecorder({}, logger, correlationId);

      await correlatedRecorder.startRecording();
      await correlatedRecorder.stopRecording();

      const startCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_started'
      );
      const stopCall = loggerInfoSpy.mock.calls.find(
        (call: any) => call[0] === 'recording_stopped'
      );

      expect(startCall[1].correlationId).toBe(correlationId);
      expect(stopCall[1].correlationId).toBe(correlationId);

      correlatedRecorder.dispose();
    });
  });
});
