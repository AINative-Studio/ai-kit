/**
 * Core types for AI-powered video highlight detection
 * Built by AINative
 */

export interface DetectionOptions {
  minDuration: number;
  maxDuration: number;
  sensitivity: 'low' | 'medium' | 'high';
  types: ('action' | 'face' | 'scene')[];
}

export interface Highlight {
  startTime: number;
  endTime: number;
  type: 'action' | 'face' | 'scene';
  confidence: number;
  description: string;
}

export interface SceneAnalysis {
  colorHistogram: {
    red: number[];
    green: number[];
    blue: number[];
  };
  brightness: number;
  contrast: number;
  dominantColors: RGB[];
  timestamp?: number;
}

export interface Action {
  type: string;
  confidence: number;
  frameIndex: number;
  motionScore: number;
  timestamp?: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface OpticalFlowResult {
  vectors: MotionVector[];
  magnitude: number;
  direction: number;
  averageMotion: number;
}

export interface MotionVector {
  dx: number;
  dy: number;
  magnitude: number;
}

export interface ActionClassification {
  isAction: boolean;
  confidence: number;
  actionType: 'camera_pan' | 'camera_zoom' | 'object_motion' | 'static';
}

export interface BlockMatch {
  dx: number;
  dy: number;
  error: number;
}

export interface FaceDetection {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  landmarks?: FaceLandmark[];
  emotion?: EmotionPrediction;
}

export interface FaceLandmark {
  type: 'eye' | 'nose' | 'mouth' | 'ear';
  x: number;
  y: number;
}

export interface EmotionPrediction {
  emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'fearful' | 'disgusted';
  confidence: number;
}

export interface HighlightDetectorConfig {
  modelBackend?: 'cpu' | 'webgl' | 'wasm';
  cacheSize?: number;
  enableGpu?: boolean;
  frameRate?: number;
}

export interface ActionClassifierConfig {
  blockSize?: number;
  searchRadius?: number;
  motionThreshold?: number;
}

export interface FaceDetectorConfig {
  minFaceSize?: number;
  scaleFactor?: number;
  confidenceThreshold?: number;
}

export interface SceneAnalyzerConfig {
  histogramBins?: number;
  changeThreshold?: number;
  colorQuantization?: number;
}

export interface VideoFrame {
  imageData: ImageData;
  timestamp: number;
  index: number;
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}
