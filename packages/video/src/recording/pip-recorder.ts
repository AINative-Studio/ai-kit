export type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface PipRecorderOptions {
  pipPosition?: PipPosition;
  pipSize?: number;
  pipOpacity?: number;
  enablePreview?: boolean;
}

export interface PipPreviewState {
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

export class PipRecorder {
  private options: Required<PipRecorderOptions>;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private screenStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private screenVideo: HTMLVideoElement | null = null;
  private cameraVideo: HTMLVideoElement | null = null;
  private compositeStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private animationFrameId: number | null = null;
  private initialized = false;
  private recording = false;

  constructor(options: PipRecorderOptions = {}) {
    this.options = {
      pipPosition: options.pipPosition || 'bottom-right',
      pipSize: options.pipSize !== undefined ? options.pipSize : 0.2,
      pipOpacity: options.pipOpacity !== undefined ? options.pipOpacity : 1.0,
      enablePreview: options.enablePreview !== undefined ? options.enablePreview : false
    };

    this.validateOptions();
  }

  private validateOptions(): void {
    const validPositions: PipPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    if (!validPositions.includes(this.options.pipPosition)) {
      throw new Error('Invalid position');
    }

    if (this.options.pipSize < 0.1 || this.options.pipSize > 0.5) {
      throw new Error('Size must be between 0.1 and 0.5');
    }

    if (this.options.pipOpacity < 0.1 || this.options.pipOpacity > 1.0) {
      throw new Error('Opacity must be between 0.1 and 1.0');
    }
  }

  public getPosition(): PipPosition {
    return this.options.pipPosition;
  }

  public setPosition(position: PipPosition): void {
    const validPositions: PipPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    if (!validPositions.includes(position)) {
      throw new Error('Invalid position');
    }
    this.options.pipPosition = position;
  }

  public getSize(): number {
    return this.options.pipSize;
  }

  public setSize(size: number): void {
    if (size < 0.1 || size > 0.5) {
      throw new Error('Size must be between 0.1 and 0.5');
    }
    this.options.pipSize = size;
  }

  public getOpacity(): number {
    return this.options.pipOpacity;
  }

  public setOpacity(opacity: number): void {
    if (opacity < 0.1 || opacity > 1.0) {
      throw new Error('Opacity must be between 0.1 and 1.0');
    }
    this.options.pipOpacity = opacity;
  }

  public async initialize(screenStream: MediaStream, cameraStream: MediaStream): Promise<void> {
    if (!screenStream) {
      throw new Error('Screen stream is required');
    }

    this.screenStream = screenStream;
    this.cameraStream = cameraStream;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    if (!this.context) {
      throw new Error('Failed to create canvas context');
    }

    this.screenVideo = document.createElement('video');
    this.screenVideo.srcObject = this.screenStream;
    this.screenVideo.autoplay = true;
    this.screenVideo.muted = true;

    await new Promise<void>((resolve) => {
      this.screenVideo!.onloadedmetadata = () => {
        this.canvas!.width = this.screenVideo!.videoWidth;
        this.canvas!.height = this.screenVideo!.videoHeight;
        resolve();
      };
    });

    if (this.cameraStream) {
      this.cameraVideo = document.createElement('video');
      this.cameraVideo.srcObject = this.cameraStream;
      this.cameraVideo.autoplay = true;
      this.cameraVideo.muted = true;

      await new Promise<void>((resolve) => {
        this.cameraVideo!.onloadedmetadata = () => resolve();
      });
    }

    this.initialized = true;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    if (!this.context) {
      throw new Error('Context not initialized');
    }
    return this.context;
  }

  public getCameraCoordinates(): CameraCoordinates {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const cameraWidth = canvasWidth * this.options.pipSize;
    const cameraHeight = canvasHeight * this.options.pipSize;

    let x = 0;
    let y = 0;

    switch (this.options.pipPosition) {
      case 'top-left':
        x = 0;
        y = 0;
        break;
      case 'top-right':
        x = canvasWidth - cameraWidth;
        y = 0;
        break;
      case 'bottom-left':
        x = 0;
        y = canvasHeight - cameraHeight;
        break;
      case 'bottom-right':
        x = canvasWidth - cameraWidth;
        y = canvasHeight - cameraHeight;
        break;
    }

    return { x, y, width: cameraWidth, height: cameraHeight };
  }

  private drawFrame(): void {
    if (!this.context || !this.canvas || !this.screenVideo) {
      return;
    }

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.drawImage(this.screenVideo, 0, 0, this.canvas.width, this.canvas.height);

    if (this.cameraVideo && this.cameraStream) {
      const coords = this.getCameraCoordinates();

      this.context.save();
      this.context.globalAlpha = this.options.pipOpacity;
      this.context.drawImage(
        this.cameraVideo,
        coords.x,
        coords.y,
        coords.width,
        coords.height
      );
      this.context.restore();
    }

    if (this.recording) {
      this.animationFrameId = requestAnimationFrame(() => this.drawFrame());
    }
  }

  public async startRecording(): Promise<MediaRecorder> {
    if (!this.initialized) {
      throw new Error('Recorder must be initialized');
    }

    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    this.compositeStream = this.canvas.captureStream(30);

    this.mediaRecorder = new MediaRecorder(this.compositeStream, {
      mimeType: 'video/webm;codecs=vp8'
    });

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.recording = true;
    this.mediaRecorder.start(100);
    this.drawFrame();

    return this.mediaRecorder;
  }

  public isRecording(): boolean {
    return this.recording;
  }

  public async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recording = false;

        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }

        if (this.screenStream) {
          this.screenStream.getTracks().forEach(track => track.stop());
        }

        if (this.cameraStream) {
          this.cameraStream.getTracks().forEach(track => track.stop());
        }

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  public getPreviewState(): PipPreviewState {
    if (!this.options.enablePreview) {
      return { enabled: false };
    }

    return {
      enabled: true,
      canvas: this.canvas || undefined,
      position: this.options.pipPosition,
      size: this.options.pipSize,
      opacity: this.options.pipOpacity
    };
  }
}
