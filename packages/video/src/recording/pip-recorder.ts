/**
 * Picture-in-Picture Recorder
 * Composites screen and camera streams using canvas-based rendering
 */

export type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';

export interface CustomPosition {
  x: number;
  y: number;
}

export interface PipRecorderOptions {
  pipPosition?: PipPosition;
  customPosition?: CustomPosition;
  pipSize?: number;
  pipOpacity?: number;
  enablePreview?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface PreviewState {
  enabled: boolean;
  canvas?: HTMLCanvasElement;
  position?: PipPosition;
  size?: number;
  opacity?: number;
}

export interface CameraCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * PipRecorder - Records screen with picture-in-picture camera overlay
 */
export class PipRecorder {
  private pipPosition: PipPosition = 'bottom-right';
  private customPosition?: CustomPosition;
  private pipSize: number = 0.2;
  private pipOpacity: number = 1.0;
  private enablePreview: boolean = false;

  private screenStream?: MediaStream;
  private cameraStream?: MediaStream;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private compositeStream?: MediaStream;

  private screenVideo?: HTMLVideoElement;
  private cameraVideo?: HTMLVideoElement;

  private mediaRecorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private animationFrameId?: number;

  private isInitializedFlag: boolean = false;
  private isRecordingFlag: boolean = false;

  constructor(options?: PipRecorderOptions) {
    if (options) {
      if (options.pipPosition) {
        this.pipPosition = options.pipPosition;
      }
      if (options.customPosition) {
        this.customPosition = options.customPosition;
      }
      if (options.pipSize !== undefined) {
        this.pipSize = options.pipSize;
      }
      if (options.pipOpacity !== undefined) {
        this.pipOpacity = options.pipOpacity;
      }
      if (options.enablePreview !== undefined) {
        this.enablePreview = options.enablePreview;
      }
    }
  }

  /**
   * Initialize the recorder with media streams
   */
  async initialize(screenStream: MediaStream, cameraStream: MediaStream): Promise<void> {
    if (!screenStream) {
      throw new Error('Screen stream is required');
    }

    this.screenStream = screenStream;
    this.cameraStream = cameraStream;

    // Create video elements to render streams
    this.screenVideo = document.createElement('video');
    this.screenVideo.srcObject = screenStream;
    this.screenVideo.autoplay = true;
    this.screenVideo.muted = true;

    if (cameraStream) {
      this.cameraVideo = document.createElement('video');
      this.cameraVideo.srcObject = cameraStream;
      this.cameraVideo.autoplay = true;
      this.cameraVideo.muted = true;
    }

    // Wait for video metadata to load
    await new Promise<void>((resolve) => {
      if (this.screenVideo) {
        this.screenVideo.onloadedmetadata = () => resolve();
      }
    });

    if (this.cameraVideo) {
      await new Promise<void>((resolve) => {
        if (this.cameraVideo) {
          this.cameraVideo.onloadedmetadata = () => resolve();
        }
      });
    }

    // Create canvas for compositing
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.screenVideo.videoWidth || 1920;
    this.canvas.height = this.screenVideo.videoHeight || 1080;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.context = ctx;

    // Create composite stream from canvas
    this.compositeStream = this.canvas.captureStream(30);

    this.isInitializedFlag = true;
  }

  /**
   * Start recording the composite stream
   */
  async startRecording(options?: MediaRecorderOptions): Promise<MediaRecorder> {
    if (!this.isInitializedFlag) {
      throw new Error('Recorder must be initialized before starting');
    }

    if (!this.compositeStream) {
      throw new Error('Composite stream not available');
    }

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.compositeStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    this.isRecordingFlag = true;

    // Start rendering loop
    this.renderLoop();

    return this.mediaRecorder;
  }

  /**
   * Stop recording and return the recorded video blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
      this.isRecordingFlag = false;

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  /**
   * Render loop for compositing streams
   */
  private renderLoop = (): void => {
    if (!this.isRecordingFlag || !this.context || !this.canvas) {
      return;
    }

    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw screen
    if (this.screenVideo) {
      this.context.drawImage(this.screenVideo, 0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw camera overlay
    if (this.cameraVideo && this.cameraStream) {
      const coords = this.calculateCameraCoordinates();

      this.context.save();
      this.context.globalAlpha = this.pipOpacity;
      this.context.drawImage(
        this.cameraVideo,
        coords.x,
        coords.y,
        coords.width,
        coords.height
      );
      this.context.restore();
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Calculate camera position based on settings
   */
  private calculateCameraCoordinates(): CameraCoordinates {
    if (!this.canvas) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const cameraWidth = this.canvas.width * this.pipSize;
    const cameraHeight = this.canvas.height * this.pipSize;

    let x = 0;
    let y = 0;

    if (this.pipPosition === 'custom' && this.customPosition) {
      x = this.customPosition.x;
      y = this.customPosition.y;
    } else {
      switch (this.pipPosition) {
        case 'top-left':
          x = 0;
          y = 0;
          break;
        case 'top-right':
          x = this.canvas.width - cameraWidth;
          y = 0;
          break;
        case 'bottom-left':
          x = 0;
          y = this.canvas.height - cameraHeight;
          break;
        case 'bottom-right':
        default:
          x = this.canvas.width - cameraWidth;
          y = this.canvas.height - cameraHeight;
          break;
      }
    }

    return { x, y, width: cameraWidth, height: cameraHeight };
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop all tracks
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
    }
    if (this.compositeStream) {
      this.compositeStream.getTracks().forEach(track => track.stop());
    }

    this.isRecordingFlag = false;
  }

  // Getters
  isInitialized(): boolean {
    return this.isInitializedFlag;
  }

  isRecording(): boolean {
    return this.isRecordingFlag;
  }

  getCanvas(): HTMLCanvasElement | undefined {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D | undefined {
    return this.context;
  }

  getPosition(): PipPosition {
    return this.pipPosition;
  }

  getSize(): number {
    return this.pipSize;
  }

  getOpacity(): number {
    return this.pipOpacity;
  }

  getCameraCoordinates(): CameraCoordinates {
    return this.calculateCameraCoordinates();
  }

  getPreviewState(): PreviewState {
    return {
      enabled: this.enablePreview,
      canvas: this.enablePreview ? this.canvas : undefined,
      position: this.pipPosition,
      size: this.pipSize,
      opacity: this.pipOpacity,
    };
  }

  // Setters
  setPosition(position: PipPosition): void {
    const validPositions: PipPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'custom'];
    if (!validPositions.includes(position)) {
      throw new Error('Invalid position');
    }
    this.pipPosition = position;
  }

  setCustomPosition(position: CustomPosition): void {
    this.customPosition = position;
    this.pipPosition = 'custom';
  }

  setSize(size: number): void {
    if (size < 0.1 || size > 0.5) {
      throw new Error('Size must be between 0.1 and 0.5');
    }
    this.pipSize = size;
  }

  setOpacity(opacity: number): void {
    if (opacity < 0.1 || opacity > 1.0) {
      throw new Error('Opacity must be between 0.1 and 1.0');
    }
    this.pipOpacity = opacity;
  }
}
