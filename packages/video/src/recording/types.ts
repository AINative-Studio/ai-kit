// Camera Recording Types
export interface CameraRecordingOptions {
  resolution?: '720p' | '1080p' | '4K';
  facingMode?: 'user' | 'environment';
  frameRate?: 30 | 60;
}

export interface CameraSettings {
  width: number;
  height: number;
  frameRate: number;
  facingMode?: 'user' | 'environment';
}

export const RESOLUTION_CONFIGS: Record<string, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
};

export class CameraRecordingError extends Error {
  constructor(
    message: string,
    public code: 'ALREADY_RECORDING' | 'NO_CAMERA' | 'PERMISSION_DENIED'
  ) {
    super(message);
    this.name = 'CameraRecordingError';
  }
}

// Audio Recording Types
export interface AudioRecordingOptions {
  microphone?: boolean;
  systemAudio?: boolean;
  noiseCancellation?: boolean;
  echoCancellation?: boolean;
  sampleRate?: 44100 | 48000;
}

// Screen Recording Types
export interface ScreenRecordingOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  includeCursor?: boolean;
  includeAudio?: boolean;
  videoBitsPerSecond?: number;
}

// PiP Recording Types
export interface PipOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
  borderRadius?: number;
  padding?: number;
}

// PiP Compositor Types
export type CameraPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CustomPosition {
  x: number;
  y: number;
}

export type PiPPosition = CameraPosition | CustomPosition;

export type CompositorState = 'idle' | 'compositing' | 'stopped' | 'paused';

export interface PiPCompositorOptions {
  screenStream: MediaStream;
  cameraStream: MediaStream;
  position?: PiPPosition;
  cameraSize?: number;
  opacity?: number;
  frameRate?: number;
  width?: number;
  height?: number;
}

export interface PiPCompositorEvents {
  stateChange: CompositorState;
  configChange: {
    position?: PiPPosition;
    cameraSize?: number;
    opacity?: number;
  };
  error: Error;
  start: undefined;
  stop: undefined;
  pause: undefined;
  resume: undefined;
}
