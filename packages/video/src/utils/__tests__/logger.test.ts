/**
 * Logger Utility Tests - TDD for Issue #135
 *
 * Tests for comprehensive logging of video recording operations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    logger = new Logger({
      enabled: true,
      level: LogLevel.DEBUG,
      includeTimestamp: true,
      includeStackTrace: false,
    });

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      logger.debug('test_event', { data: 'test' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('test_event'),
        expect.objectContaining({ data: 'test' })
      );
    });

    it('should log info messages when level is INFO or lower', () => {
      logger.info('test_event', { data: 'test' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('test_event'),
        expect.objectContaining({ data: 'test' })
      );
    });

    it('should log warn messages when level is WARN or lower', () => {
      logger.warn('test_event', { data: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining('test_event'),
        expect.objectContaining({ data: 'test' })
      );
    });

    it('should log error messages at any level', () => {
      logger.error('test_event', { error: 'test error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('test_event'),
        expect.objectContaining({ error: 'test error' })
      );
    });

    it('should not log debug when level is INFO', () => {
      const infoLogger = new Logger({ level: LogLevel.INFO });
      infoLogger.debug('test_event', { data: 'test' });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log info when level is WARN', () => {
      const warnLogger = new Logger({ level: LogLevel.WARN });
      warnLogger.info('test_event', { data: 'test' });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Recording Lifecycle Events', () => {
    it('should log recording_started event with all required fields', () => {
      const eventData = {
        recordingId: 'rec_123',
        mimeType: 'video/webm',
        videoBitsPerSecond: 5000000,
        audioBitsPerSecond: 128000,
        timestamp: Date.now(),
      };

      logger.info('recording_started', eventData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('recording_started'),
        expect.objectContaining({
          recordingId: 'rec_123',
          mimeType: 'video/webm',
          videoBitsPerSecond: 5000000,
          audioBitsPerSecond: 128000,
        })
      );
    });

    it('should log recording_stopped event with duration and file metrics', () => {
      const eventData = {
        recordingId: 'rec_123',
        duration: 30000,
        fileSize: 15728640,
        chunksReceived: 300,
        timestamp: Date.now(),
      };

      logger.info('recording_stopped', eventData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('recording_stopped'),
        expect.objectContaining({
          recordingId: 'rec_123',
          duration: 30000,
          fileSize: 15728640,
          chunksReceived: 300,
        })
      );
    });

    it('should log recording_paused event', () => {
      const eventData = {
        recordingId: 'rec_123',
        timestamp: Date.now(),
      };

      logger.info('recording_paused', eventData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('recording_paused'),
        expect.objectContaining({ recordingId: 'rec_123' })
      );
    });

    it('should log recording_resumed event', () => {
      const eventData = {
        recordingId: 'rec_123',
        timestamp: Date.now(),
      };

      logger.info('recording_resumed', eventData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('recording_resumed'),
        expect.objectContaining({ recordingId: 'rec_123' })
      );
    });
  });

  describe('Error Tracking', () => {
    it('should log recording_failed with error details', () => {
      const eventData = {
        recordingId: 'rec_123',
        error: 'Screen capture permission denied',
        errorCode: 'NotAllowedError',
        timestamp: Date.now(),
      };

      logger.error('recording_failed', eventData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('recording_failed'),
        expect.objectContaining({
          recordingId: 'rec_123',
          error: 'Screen capture permission denied',
          errorCode: 'NotAllowedError',
        })
      );
    });

    it('should include stack trace when enabled', () => {
      const errorLogger = new Logger({ includeStackTrace: true });
      const error = new Error('Test error');

      errorLogger.error('test_error', { error: error.message, stack: error.stack });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
        })
      );
    });
  });

  describe('Performance Tracking', () => {
    it('should track operation duration', () => {
      const startTime = performance.now();
      const duration = performance.now() - startTime;

      logger.info('encoding_complete', {
        duration,
        operation: 'video_encoding',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('encoding_complete'),
        expect.objectContaining({
          duration: expect.any(Number),
          operation: 'video_encoding',
        })
      );
    });

    it('should track performance metrics', () => {
      const metrics = {
        duration: 5000,
        fileSize: 10485760,
        encodingTime: 1200,
        fps: 30,
        bitrate: 5000000,
      };

      logger.info('performance_metrics', metrics);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('performance_metrics'),
        expect.objectContaining(metrics)
      );
    });
  });

  describe('Configuration', () => {
    it('should not log when disabled', () => {
      const disabledLogger = new Logger({ enabled: false });
      disabledLogger.info('test_event', { data: 'test' });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include timestamp when configured', () => {
      logger.info('test_event', { data: 'test' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('test_event'),
        expect.objectContaining({
          data: 'test',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should not include timestamp when disabled', () => {
      const noTimestampLogger = new Logger({ includeTimestamp: false });
      noTimestampLogger.info('test_event', { data: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('test_event'),
        expect.objectContaining({ data: 'test' })
      );
    });
  });

  describe('Event Emission', () => {
    it('should emit events for external monitoring', () => {
      const eventHandler = vi.fn();
      logger.on('log', eventHandler);

      logger.info('test_event', { data: 'test' });

      expect(eventHandler).toHaveBeenCalledWith({
        level: 'info',
        event: 'test_event',
        data: expect.objectContaining({ data: 'test' }),
        timestamp: expect.any(Number),
      });
    });

    it('should support multiple event handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      logger.on('log', handler1);
      logger.on('log', handler2);

      logger.info('test_event', { data: 'test' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove event handlers', () => {
      const eventHandler = vi.fn();
      logger.on('log', eventHandler);
      logger.off('log', eventHandler);

      logger.info('test_event', { data: 'test' });

      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Structured Logging', () => {
    it('should support JSON format', () => {
      logger.info('test_event', {
        recordingId: 'rec_123',
        nested: {
          data: 'value',
          array: [1, 2, 3],
        },
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          recordingId: 'rec_123',
          nested: {
            data: 'value',
            array: [1, 2, 3],
          },
        })
      );
    });
  });

  describe('Correlation IDs', () => {
    it('should support correlation ID for request tracking', () => {
      const correlationId = 'corr_123';

      logger.info('test_event', {
        correlationId,
        data: 'test',
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          correlationId: 'corr_123',
          data: 'test',
        })
      );
    });
  });

  describe('Resource Usage Tracking', () => {
    it('should log memory usage metrics', () => {
      const memoryMetrics = {
        recordingId: 'rec_123',
        memoryUsed: 104857600, // 100 MB
        heapSize: 209715200, // 200 MB
        timestamp: Date.now(),
      };

      logger.info('memory_usage', memoryMetrics);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('memory_usage'),
        expect.objectContaining({
          recordingId: 'rec_123',
          memoryUsed: 104857600,
          heapSize: 209715200,
        })
      );
    });

    it('should log CPU usage during encoding', () => {
      const cpuMetrics = {
        recordingId: 'rec_123',
        cpuUsage: 85.5,
        encodingTime: 5000,
        timestamp: Date.now(),
      };

      logger.info('cpu_usage', cpuMetrics);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('cpu_usage'),
        expect.objectContaining({
          recordingId: 'rec_123',
          cpuUsage: 85.5,
          encodingTime: 5000,
        })
      );
    });
  });

  describe('Browser Compatibility Tracking', () => {
    it('should log browser compatibility events', () => {
      const compatData = {
        browser: 'Chrome',
        version: '120.0.0',
        supportedCodecs: ['vp9', 'vp8', 'h264'],
        selectedCodec: 'vp9',
        timestamp: Date.now(),
      };

      logger.info('browser_compatibility', compatData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('browser_compatibility'),
        expect.objectContaining({
          browser: 'Chrome',
          version: '120.0.0',
          supportedCodecs: ['vp9', 'vp8', 'h264'],
          selectedCodec: 'vp9',
        })
      );
    });
  });
});
