/**
 * Screen Recorder - Implements AIKIT-72
 *
 * Provides comprehensive screen recording functionality with:
 * - MediaRecorder API integration
 * - Quality presets (low, medium, high, ultra)
 * - Cursor tracking options (always, motion, never)
 * - Returns recording as Blob with object URL
 * - Configurable video bitrate and frame rate
 * - Audio capture support
 * - Pause/resume capabilities
 */

export type ScreenRecordingQuality = 'low' | 'medium' | 'high' | 'ultra';

export type CursorMode = 'never' | 'always' | 'motion';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface ScreenRecorderOptions {
  quality?: ScreenRecordingQuality;
  frameRate?: number;
  videoBitsPerSecond?: number;
  cursor?: CursorMode;
  audio?: boolean;
  mimeType?: string;
}

export interface QualityConfig {
  videoBitsPerSecond: number;
  frameRate: number;
}

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
}

export interface StreamSettings {
  width: number;
  height: number;
  frameRate: number;
  cursor?: string;
}

export class ScreenRecordingError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'ScreenRecordingError';
  }
}

/**
 * Quality configurations for different recording presets
 */
const QUALITY_CONFIGS: Record<ScreenRecordingQuality, QualityConfig> = {
  low: {
    videoBitsPerSecond: 1000000, // 1 Mbps
    frameRate: 15,
  },
  medium: {
    videoBitsPerSecond: 2500000, // 2.5 Mbps
    frameRate: 30,
  },
  high: {
    videoBitsPerSecond: 5000000, // 5 Mbps
    frameRate: 30,
  },
  ultra: {
    videoBitsPerSecond: 10000000, // 10 Mbps
    frameRate: 60,
  },
};

/**
 * Supported MIME types in order of preference
 */
const MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm;codecs=h264',
  'video/webm',
  'video/mp4',
];

/**
 * ScreenRecorder class for capturing screen content
 *
 * Implements comprehensive screen recording with quality presets,
 * cursor tracking, and returns recording as blob with URL.
 *
 * @example
 * ```typescript
 * const recorder = new ScreenRecorder({
 *   quality: 'high',
 *   cursor: 'always',
 *   audio: false
 * });
 *
 * await recorder.startRecording();
 * // ... record screen ...
 * const result = await recorder.stopRecording();
 * console.log(result.url); // blob URL for playback
 * ```
 */
export class ScreenRecorder {
  private quality: ScreenRecordingQuality;
  private cursor: CursorMode;
  private audio: boolean;
  private customFrameRate?: number;
  private customVideoBitsPerSecond?: number;
  private customMimeType?: string;

  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private state: RecordingState = 'idle';
  private startTime: number = 0;

  constructor(options: ScreenRecorderOptions = {}) {
    this.quality = options.quality || 'medium';
    this.cursor = options.cursor || 'always';
    this.audio = options.audio || false;
    this.customFrameRate = options.frameRate;
    this.customVideoBitsPerSecond = options.videoBitsPerSecond;
    this.customMimeType = options.mimeType;
  }

  /**
   * Get current quality setting
   */
  getQuality(): ScreenRecordingQuality {
    return this.quality;
  }

  /**
   * Set quality preset
   * @throws {ScreenRecordingError} If recording is in progress
   */
  setQuality(quality: ScreenRecordingQuality): void {
    if (this.state === 'recording' || this.state === 'paused') {
      throw new ScreenRecordingError(
        'Cannot change quality while recording',
        'QUALITY_CHANGE_DENIED'
      );
    }

    const validQualities: ScreenRecordingQuality[] = ['low', 'medium', 'high', 'ultra'];
    if (!validQualities.includes(quality)) {
      throw new ScreenRecordingError(
        'Invalid quality setting',
        'INVALID_QUALITY'
      );
    }

    this.quality = quality;
  }

  /**
   * Get quality configuration
   */
  getQualityConfig(): QualityConfig {
    const baseConfig = QUALITY_CONFIGS[this.quality];
    return {
      videoBitsPerSecond:
        this.customVideoBitsPerSecond ?? baseConfig.videoBitsPerSecond,
      frameRate: this.customFrameRate ?? baseConfig.frameRate,
    };
  }

  /**
   * Check if cursor is enabled
   */
  isCursorEnabled(): boolean {
    return this.cursor !== 'never';
  }

  /**
   * Set cursor mode
   * @throws {ScreenRecordingError} If recording is in progress
   */
  setCursor(cursor: CursorMode): void {
    if (this.state === 'recording' || this.state === 'paused') {
      throw new ScreenRecordingError(
        'Cannot change cursor setting while recording',
        'CURSOR_CHANGE_DENIED'
      );
    }

    this.cursor = cursor;
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.state === 'recording';
  }

  /**
   * Get active media stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get stream settings
   */
  getStreamSettings(): StreamSettings | null {
    if (!this.stream) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      return null;
    }

    const settings = videoTrack.getSettings();

    return {
      width: settings.width || 0,
      height: settings.height || 0,
      frameRate: settings.frameRate || 0,
      cursor: settings.cursor,
    };
  }

  /**
   * Start screen recording
   * @throws {ScreenRecordingError} If already recording or not supported
   */
  async startRecording(): Promise<void> {
    if (this.state === 'recording' || this.state === 'paused') {
      throw new ScreenRecordingError(
        'Recording already in progress',
        'ALREADY_RECORDING'
      );
    }

    // Check for getDisplayMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new ScreenRecordingError(
        'Screen recording not supported',
        'NOT_SUPPORTED'
      );
    }

    try {
      // Get quality config
      const qualityConfig = this.getQualityConfig();

      // Build display media constraints
      const constraints: DisplayMediaStreamOptions = {
        video: {
          cursor: this.cursor as any,
          frameRate: qualityConfig.frameRate,
        } as any,
        audio: this.audio,
      };

      // Request screen capture
      this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Find supported MIME type
      const mimeType = this.getSupportedMimeType();
      if (!mimeType) {
        throw new ScreenRecordingError(
          'No supported video format found',
          'UNSUPPORTED_FORMAT'
        );
      }

      // Create MediaRecorder
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: qualityConfig.videoBitsPerSecond,
      };

      this.mediaRecorder = new MediaRecorder(this.stream, mediaRecorderOptions);
      this.recordedChunks = [];

      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      this.state = 'recording';
      this.startTime = Date.now();
    } catch (error) {
      this.cleanup();

      if (error instanceof ScreenRecordingError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ScreenRecordingError(error.message, 'RECORDING_ERROR');
      }

      throw error;
    }
  }

  /**
   * Stop recording and return result
   * @throws {ScreenRecordingError} If not recording
   */
  async stopRecording(): Promise<RecordingResult> {
    if (this.state !== 'recording' && this.state !== 'paused') {
      throw new ScreenRecordingError('No active recording', 'NOT_RECORDING');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(
          new ScreenRecordingError('MediaRecorder not initialized', 'NO_RECORDER')
        );
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          // Calculate duration
          const duration = Date.now() - this.startTime;

          // Create blob from recorded chunks
          const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder!.mimeType || 'video/webm',
          });

          // Create object URL
          const url = URL.createObjectURL(blob);

          // Get size
          const size = blob.size;

          // Cleanup
          this.cleanup();

          this.state = 'stopped';

          resolve({
            blob,
            url,
            duration,
            size,
          });
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   * @throws {ScreenRecordingError} If not recording
   */
  pauseRecording(): void {
    if (this.state !== 'recording') {
      throw new ScreenRecordingError(
        'No active recording to pause',
        'NOT_RECORDING'
      );
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.pause();
      this.state = 'paused';
    }
  }

  /**
   * Resume recording
   * @throws {ScreenRecordingError} If not paused
   */
  resumeRecording(): void {
    if (this.state !== 'paused') {
      throw new ScreenRecordingError('Recording is not paused', 'NOT_PAUSED');
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.resume();
      this.state = 'recording';
    }
  }

  /**
   * Dispose recorder and cleanup resources
   */
  dispose(): void {
    if (this.state === 'recording' || this.state === 'paused') {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
    }

    this.cleanup();
    this.state = 'idle';
  }

  /**
   * Revoke a blob URL to free memory
   *
   * Call this method when you no longer need the blob URL to prevent memory leaks.
   * Safe to call multiple times with the same URL.
   *
   * @param url - The blob URL to revoke (from RecordingResult.url)
   *
   * @example
   * ```typescript
   * const recorder = new ScreenRecorder();
   * await recorder.startRecording();
   * const result = await recorder.stopRecording();
   *
   * // Use the URL for playback or download
   * videoElement.src = result.url;
   *
   * // When done, revoke to free memory
   * recorder.revokeURL(result.url);
   * ```
   */
  revokeURL(url: string): void {
    if (!url || url.trim() === '') {
      return;
    }

    URL.revokeObjectURL(url);
  }

  /**
   * Get supported MIME type
   * @private
   */
  private getSupportedMimeType(): string | null {
    // Use custom MIME type if specified
    if (this.customMimeType) {
      if (MediaRecorder.isTypeSupported(this.customMimeType)) {
        return this.customMimeType;
      }
    }

    // Find first supported MIME type
    for (const mimeType of MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return null;
  }

  /**
   * Cleanup resources
   * @private
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.recordedChunks = [];
  }
}
