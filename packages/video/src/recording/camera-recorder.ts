import {
  CameraRecordingOptions,
  CameraSettings,
  CameraRecordingError,
  RESOLUTION_CONFIGS,
} from './types';

/**
 * CameraRecorder class for accessing and managing camera recording
 *
 * Provides methods to:
 * - Access user/environment cameras via MediaStream API
 * - Configure resolution (720p, 1080p, 4K)
 * - Apply constraints (facingMode, aspectRatio)
 * - Manage recording state and stream lifecycle
 *
 * @example
 * ```typescript
 * const recorder = new CameraRecorder();
 * const stream = await recorder.startRecording({
 *   resolution: '1080p',
 *   facingMode: 'user',
 * });
 * // Use stream...
 * await recorder.stopRecording();
 * ```
 */
export class CameraRecorder {
  private stream: MediaStream | null = null;
  private recording = false;

  /**
   * Start camera recording with specified options
   *
   * @param options - Configuration options for camera recording
   * @returns Promise resolving to the MediaStream
   * @throws {CameraRecordingError} If already recording or camera access fails
   */
  async startRecording(
    options: CameraRecordingOptions = {}
  ): Promise<MediaStream> {
    // Check if already recording
    if (this.recording) {
      throw new CameraRecordingError(
        'Recording already in progress',
        'ALREADY_RECORDING'
      );
    }

    // Check MediaDevices API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new CameraRecordingError(
        'MediaDevices API not supported',
        'NOT_SUPPORTED'
      );
    }

    try {
      // Build constraints from options
      const constraints = this.buildConstraints(options);

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.recording = true;

      return this.stream;
    } catch (error) {
      this.stream = null;
      this.recording = false;

      if (error instanceof Error) {
        throw new CameraRecordingError(
          error.message,
          'ACCESS_DENIED'
        );
      }

      throw error;
    }
  }

  /**
   * Stop camera recording and release resources
   *
   * Stops all media tracks and clears the stream reference
   */
  async stopRecording(): Promise<void> {
    if (!this.stream) {
      return;
    }

    // Stop all tracks
    this.stream.getTracks().forEach((track) => {
      track.stop();
    });

    this.stream = null;
    this.recording = false;
  }

  /**
   * Get the current media stream
   *
   * @returns The active MediaStream or null if not recording
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Check if currently recording
   *
   * @returns true if recording is active, false otherwise
   */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Get current camera settings from the active stream
   *
   * @returns Current camera settings or null if not recording
   */
  getCurrentSettings(): CameraSettings | null {
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
      facingMode: settings.facingMode,
      aspectRatio: settings.aspectRatio,
    };
  }

  /**
   * Build MediaStreamConstraints from recording options
   *
   * @private
   * @param options - Camera recording options
   * @returns MediaStreamConstraints object
   */
  private buildConstraints(
    options: CameraRecordingOptions
  ): MediaStreamConstraints {
    const {
      resolution = '1080p',
      facingMode = 'user',
      aspectRatio,
      frameRate,
    } = options;

    // Get resolution config
    const resolutionConfig = RESOLUTION_CONFIGS[resolution];

    // Build video constraints
    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: resolutionConfig.width },
      height: { ideal: resolutionConfig.height },
      facingMode: { ideal: facingMode },
    };

    // Add optional constraints
    if (aspectRatio !== undefined) {
      videoConstraints.aspectRatio = { ideal: aspectRatio };
    }

    if (frameRate !== undefined) {
      videoConstraints.frameRate = { ideal: frameRate };
    }

    return {
      video: videoConstraints,
      audio: false,
    };
  }
}
