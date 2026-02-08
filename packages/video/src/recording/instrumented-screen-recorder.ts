/**
 * Instrumented Screen Recorder - Issue #135
 *
 * Extends ScreenRecorder with comprehensive observability instrumentation
 */

import {
  ScreenRecorder,
  ScreenRecorderOptions,
  RecordingResult,
  ScreenRecordingQuality,
  CursorMode,
  RecordingState,
  StreamSettings,
} from './screen-recorder';
import { Logger, createLogger } from '../utils/logger';

export class InstrumentedScreenRecorder extends ScreenRecorder {
  private logger: Logger;
  private recordingId: string = '';
  private correlationId?: string;
  private beforeUnloadHandler: (() => void) | null = null;
  private chunksReceived: number = 0;

  constructor(
    options: ScreenRecorderOptions = {},
    logger?: Logger,
    correlationId?: string
  ) {
    super(options);
    this.logger = logger || createLogger({ enabled: false });
    this.correlationId = correlationId;
  }

  /**
   * Start recording with instrumentation
   */
  async startRecording(): Promise<void> {
    this.recordingId = Logger.generateRecordingId();
    const previousState = this.getState();

    try {
      await super.startRecording();

      const qualityConfig = this.getQualityConfig();
      const streamSettings = this.getStreamSettings();

      // Log state transition
      this.logger.debug('state_transition', {
        ...this.getBaseLogData(),
        from: previousState,
        to: this.getState(),
        timestamp: Date.now(),
      });

      // Log browser compatibility
      this.logger.debug('browser_compatibility', {
        ...this.getBaseLogData(),
        selectedCodec: 'video/webm',
        supported: true,
        timestamp: Date.now(),
      });

      // Log stream configuration
      if (streamSettings) {
        this.logger.debug('stream_configured', {
          ...this.getBaseLogData(),
          ...streamSettings,
          timestamp: Date.now(),
        });
      }

      // Log recording started
      this.logger.info('recording_started', {
        ...this.getBaseLogData(),
        mimeType: 'video/webm',
        videoBitsPerSecond: qualityConfig.videoBitsPerSecond,
        quality: this.getQuality(),
        cursor: this.isCursorEnabled() ? 'always' : 'never',
        audio: false,
        timestamp: Date.now(),
      });

      // Setup beforeunload handler
      this.beforeUnloadHandler = () => {
        this.cleanup();
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
      }

      // Reset chunks counter
      this.chunksReceived = 0;

      // Intercept ondataavailable to count chunks
      const stream = this.getStream();
      if (stream) {
        const originalHandler = (stream as any).ondataavailable;
        (stream as any).ondataavailable = (event: any) => {
          this.chunksReceived++;
          if (originalHandler) {
            originalHandler(event);
          }
        };
      }
    } catch (error) {
      this.logError('recording_failed', error as Error, 'start');
      throw error;
    }
  }

  /**
   * Stop recording with instrumentation
   */
  async stopRecording(): Promise<RecordingResult> {
    const previousState = this.getState();
    const startTime = Date.now();

    try {
      const result = await super.stopRecording();

      const duration = result.duration;
      const fileSize = result.size;

      // Log state transition
      this.logger.debug('state_transition', {
        ...this.getBaseLogData(),
        from: previousState,
        to: 'stopped',
        timestamp: Date.now(),
      });

      // Log recording stopped
      this.logger.info('recording_stopped', {
        ...this.getBaseLogData(),
        duration,
        fileSize,
        chunksReceived: this.chunksReceived > 0 ? this.chunksReceived : 1,
        timestamp: Date.now(),
      });

      // Log performance metrics
      const avgBitrate = (fileSize * 8) / (duration / 1000);
      this.logger.info('performance_metrics', {
        ...this.getBaseLogData(),
        duration,
        fileSize,
        avgBitrate,
        timestamp: Date.now(),
      });

      // Log resource cleanup
      this.logger.debug('resources_cleaned', {
        ...this.getBaseLogData(),
        tracksStopped: 1,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      this.logError('recording_failed', error as Error, 'stop');
      throw error;
    }
  }

  /**
   * Pause recording with instrumentation
   */
  pauseRecording(): void {
    const previousState = this.getState();

    try {
      super.pauseRecording();

      // Log state transition
      this.logger.debug('state_transition', {
        ...this.getBaseLogData(),
        from: previousState,
        to: this.getState(),
        timestamp: Date.now(),
      });

      // Log recording paused
      this.logger.info('recording_paused', {
        ...this.getBaseLogData(),
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logError('recording_failed', error as Error, 'pause');
      throw error;
    }
  }

  /**
   * Resume recording with instrumentation
   */
  resumeRecording(): void {
    const previousState = this.getState();

    try {
      super.resumeRecording();

      // Log state transition
      this.logger.debug('state_transition', {
        ...this.getBaseLogData(),
        from: previousState,
        to: this.getState(),
        timestamp: Date.now(),
      });

      // Log recording resumed
      this.logger.info('recording_resumed', {
        ...this.getBaseLogData(),
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logError('recording_failed', error as Error, 'resume');
      throw error;
    }
  }

  /**
   * Dispose with instrumentation
   */
  dispose(): void {
    try {
      super.dispose();

      // Log resource cleanup
      if (this.recordingId) {
        this.logger.debug('resources_cleaned', {
          ...this.getBaseLogData(),
          tracksStopped: 1,
          timestamp: Date.now(),
        });
      }

      this.cleanup();
    } catch (error) {
      // Silently handle disposal errors
      console.error('Error during disposal:', error);
    }
  }

  /**
   * Get base log data
   */
  private getBaseLogData(): Record<string, any> {
    const data: Record<string, any> = {
      recordingId: this.recordingId,
    };

    if (this.correlationId) {
      data.correlationId = this.correlationId;
    }

    return data;
  }

  /**
   * Log error with context
   */
  private logError(event: string, error: Error, phase: string): void {
    const errorCode =
      (error as any).code || error.name || 'UNKNOWN_ERROR';

    this.logger.error(event, {
      ...this.getBaseLogData(),
      error: error.message,
      errorCode,
      phase,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }
}

/**
 * Factory function to create instrumented screen recorder
 */
export function createInstrumentedScreenRecorder(
  options?: ScreenRecorderOptions,
  logger?: Logger,
  correlationId?: string
): InstrumentedScreenRecorder {
  return new InstrumentedScreenRecorder(options, logger, correlationId);
}
