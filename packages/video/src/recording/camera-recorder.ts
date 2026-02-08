/**
 * Camera Recorder - AIKIT-73
 *
 * Provides camera access with support for multiple resolutions (720p, 1080p, 4K),
 * configurable constraints, and stream management.
 */

export type Resolution = '720p' | '1080p' | '4K'
export type FacingMode = 'user' | 'environment' | 'left' | 'right'

export interface CameraRecorderOptions {
  /**
   * Video resolution preset
   * @default '720p'
   */
  resolution?: Resolution

  /**
   * Enable/disable audio recording
   * @default false
   */
  audio?: boolean

  /**
   * Target frame rate
   */
  frameRate?: number

  /**
   * Target aspect ratio
   */
  aspectRatio?: number

  /**
   * Camera facing mode (user: front camera, environment: back camera)
   */
  facingMode?: FacingMode

  /**
   * Custom video constraints (overrides resolution preset)
   */
  videoConstraints?: MediaTrackConstraints
}

interface ResolutionDimensions {
  width: number
  height: number
}

const RESOLUTION_MAP: Record<Resolution, ResolutionDimensions> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
}

export class CameraRecorder {
  private stream: MediaStream | null = null
  private options: CameraRecorderOptions

  constructor(options: CameraRecorderOptions = {}) {
    this.options = {
      resolution: '720p',
      audio: false,
      ...options,
    }
  }

  /**
   * Request camera access and return the MediaStream
   * @returns Promise<MediaStream> The camera media stream
   * @throws Error if camera access is denied or not available
   */
  async getStream(): Promise<MediaStream> {
    // Return cached stream if already active
    if (this.stream && this.stream.active) {
      return this.stream
    }

    try {
      const constraints = this.buildConstraints()
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      return this.stream
    } catch (error) {
      // Re-throw the error to allow proper handling in tests and applications
      throw error
    }
  }

  /**
   * Build MediaStreamConstraints from options
   * @private
   */
  private buildConstraints(): MediaStreamConstraints {
    const { resolution, audio, frameRate, aspectRatio, facingMode, videoConstraints } = this.options

    // Use custom constraints if provided
    if (videoConstraints) {
      return {
        video: videoConstraints,
        audio,
      }
    }

    // Build video constraints from options
    const videoOptions: MediaTrackConstraints = {}

    // Apply resolution
    const dimensions = RESOLUTION_MAP[resolution || '720p']
    videoOptions.width = { ideal: dimensions.width }
    videoOptions.height = { ideal: dimensions.height }

    // Apply optional constraints
    if (frameRate !== undefined) {
      videoOptions.frameRate = { ideal: frameRate }
    }

    if (aspectRatio !== undefined) {
      videoOptions.aspectRatio = { ideal: aspectRatio }
    }

    if (facingMode !== undefined) {
      videoOptions.facingMode = { ideal: facingMode }
    }

    return {
      video: videoOptions,
      audio,
    }
  }

  /**
   * Stop the current stream and release camera access
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  /**
   * Get current stream settings
   * @returns MediaTrackSettings | null The current video track settings or null if no stream
   */
  getSettings(): MediaTrackSettings | null {
    if (!this.stream) {
      return null
    }

    const videoTrack = this.stream.getVideoTracks()[0]
    if (!videoTrack) {
      return null
    }

    return videoTrack.getSettings()
  }

  /**
   * Check if the stream is currently active
   * @returns boolean True if stream is active, false otherwise
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active
  }

  /**
   * Get the current MediaStream
   * @returns MediaStream | null The current stream or null
   */
  getCurrentStream(): MediaStream | null {
    return this.stream
  }
}

/**
 * Create a camera recorder instance
 * @param options Camera recorder options
 * @returns CameraRecorder instance
 */
export function createCameraRecorder(options?: CameraRecorderOptions): CameraRecorder {
  return new CameraRecorder(options)
}
