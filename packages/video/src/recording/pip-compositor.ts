import type {
  PiPCompositorOptions,
  PiPPosition,
  CameraPosition,
  CompositorState,
  PiPCompositorEvents,
} from './types';

type EventHandler<T = unknown> = (data: T) => void;

export class PiPCompositor {
  private screenStream: MediaStream;
  private cameraStream: MediaStream;
  private position: PiPPosition;
  private cameraSize: number;
  private opacity: number;
  private frameRate: number;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private screenVideo: HTMLVideoElement | null = null;
  private cameraVideo: HTMLVideoElement | null = null;
  private outputStream: MediaStream | null = null;
  private state: CompositorState = 'idle';
  private animationFrameId: number | null = null;
  private eventHandlers: Map<keyof PiPCompositorEvents, Set<EventHandler>> = new Map();

  constructor(options: PiPCompositorOptions) {
    if (!options.screenStream) throw new Error('screenStream is required');
    if (!options.cameraStream) throw new Error('cameraStream is required');

    this.screenStream = options.screenStream;
    this.cameraStream = options.cameraStream;
    this.position = options.position || 'bottom-right';
    this.cameraSize = options.cameraSize ?? 0.2;
    this.opacity = options.opacity ?? 1;
    this.frameRate = options.frameRate || 30;

    this.initializeCanvas(options.width, options.height);
  }

  private initializeCanvas(width?: number, height?: number): void {
    const screenTrack = this.screenStream.getVideoTracks()[0];
    if (!screenTrack) throw new Error('No video track found in screen stream');
    const screenSettings = screenTrack.getSettings();

    this.canvas = document.createElement('canvas');
    this.canvas.width = width || screenSettings.width || 1920;
    this.canvas.height = height || screenSettings.height || 1080;

    this.context = this.canvas.getContext('2d');
    if (!this.context) throw new Error('Failed to get 2D context from canvas');

    this.screenVideo = document.createElement('video');
    this.screenVideo.srcObject = this.screenStream;
    this.screenVideo.play();

    this.cameraVideo = document.createElement('video');
    this.cameraVideo.srcObject = this.cameraStream;
    this.cameraVideo.play();
  }

  getState(): CompositorState {
    return this.state;
  }

  getPosition(): PiPPosition {
    return this.position;
  }

  setPosition(position: PiPPosition): void {
    if (typeof position === 'object' && 'x' in position && 'y' in position) {
      if (position.x < 0 || position.y < 0) {
        throw new Error('Position coordinates must be positive');
      }
    }
    this.position = position;
    this.emit('configChange', { position });
  }

  getCameraSize(): number {
    return this.cameraSize;
  }

  setCameraSize(size: number): void {
    if (size < 0 || size > 1) throw new Error('Camera size must be between 0 and 1');
    this.cameraSize = size;
    this.emit('configChange', { cameraSize: size });
  }

  getOpacity(): number {
    return this.opacity;
  }

  setOpacity(opacity: number): void {
    if (opacity < 0 || opacity > 1) throw new Error('Opacity must be between 0 and 1');
    this.opacity = opacity;
    this.emit('configChange', { opacity });
  }

  start(): void {
    if (this.state === 'compositing') throw new Error('Compositor is already running');
    this.state = 'compositing';
    if (this.canvas) {
      this.outputStream = this.canvas.captureStream(this.frameRate);
    }
    this.renderFrame();
    this.emit('start', undefined);
  }

  stop(): void {
    this.state = 'stopped';
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.outputStream = null;
    this.emit('stop', undefined);
  }

  pause(): void {
    if (this.state === 'compositing') {
      this.state = 'paused';
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.emit('pause', undefined);
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'compositing';
      this.renderFrame();
      this.emit('resume', undefined);
    }
  }

  getOutputStream(): MediaStream | null {
    if (this.state === 'idle' || this.state === 'stopped') return null;
    return this.outputStream;
  }

  private renderFrame(): void {
    if (this.state !== 'compositing' || !this.context || !this.canvas) return;

    const ctx = this.context;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (this.screenVideo && this.screenVideo.readyState >= 2) {
      ctx.drawImage(this.screenVideo, 0, 0, canvasWidth, canvasHeight);
    }

    if (this.cameraVideo && this.cameraVideo.readyState >= 2) {
      const cameraWidth = canvasWidth * this.cameraSize;
      const cameraHeight = canvasHeight * this.cameraSize;
      const { x, y } = this.calculateCameraPosition(cameraWidth, cameraHeight);

      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(this.cameraVideo, x, y, cameraWidth, cameraHeight);
      ctx.restore();
    }

    this.animationFrameId = requestAnimationFrame(() => this.renderFrame());
  }

  private calculateCameraPosition(cameraWidth: number, cameraHeight: number): { x: number; y: number } {
    const canvasWidth = this.canvas!.width;
    const canvasHeight = this.canvas!.height;
    const padding = 20;

    if (typeof this.position === 'object' && 'x' in this.position && 'y' in this.position) {
      return { x: this.position.x, y: this.position.y };
    }

    const preset = this.position as CameraPosition;
    switch (preset) {
      case 'top-left':
        return { x: padding, y: padding };
      case 'top-right':
        return { x: canvasWidth - cameraWidth - padding, y: padding };
      case 'bottom-left':
        return { x: padding, y: canvasHeight - cameraHeight - padding };
      case 'bottom-right':
      default:
        return { x: canvasWidth - cameraWidth - padding, y: canvasHeight - cameraHeight - padding };
    }
  }

  on<K extends keyof PiPCompositorEvents>(event: K, handler: EventHandler<PiPCompositorEvents[K]>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler);
  }

  off<K extends keyof PiPCompositorEvents>(event: K, handler: EventHandler<PiPCompositorEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  private emit<K extends keyof PiPCompositorEvents>(event: K, data: PiPCompositorEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  dispose(): void {
    this.stop();
    this.eventHandlers.clear();
    if (this.screenVideo) {
      this.screenVideo.srcObject = null;
      this.screenVideo = null;
    }
    if (this.cameraVideo) {
      this.cameraVideo.srcObject = null;
      this.cameraVideo = null;
    }
    this.canvas = null;
    this.context = null;
  }
}
