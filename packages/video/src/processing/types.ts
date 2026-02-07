/**
 * Video Processing Types for Highlight Detection
 * @module @ainative/video/processing
 */

/**
 * Type of highlight detected in the video
 */
export type HighlightType =
  | 'action'      // High motion, intense activity
  | 'emotion'     // Emotional expressions, reactions
  | 'dialogue'    // Important speech or conversation
  | 'scene'       // Scene transitions, visual changes
  | 'music'       // Musical highlights
  | 'custom';     // User-defined highlight types

/**
 * Sensitivity level for highlight detection
 */
export type SensitivityLevel = 'low' | 'medium' | 'high';

/**
 * Video frame with metadata for analysis
 */
export interface VideoFrame {
  /** Timestamp in seconds */
  timestamp: number;
  /** Raw frame data */
  data: Buffer;
  /** Frame metadata for analysis */
  metadata?: {
    /** Motion intensity (0-1) */
    motion?: number;
    /** Scene change detected */
    sceneChange?: boolean;
    /** Number of faces detected */
    faces?: number;
    /** Detected emotion */
    emotion?: string;
    /** Audio features for this frame */
    audio?: AudioFeatures;
    /** Custom metadata */
    [key: string]: any;
  };
}

/**
 * Audio features extracted from video
 */
export interface AudioFeatures {
  /** Audio volume level (0-1) */
  volume: number;
  /** Pitch in Hz */
  pitch: number;
  /** Tempo in BPM */
  tempo: number;
  /** Speech detected in audio */
  speechDetected: boolean;
  /** Music detected in audio */
  musicDetected: boolean;
  /** Transcribed text if available */
  transcription?: string;
  /** Detected language */
  language?: string;
}

/**
 * Configuration for highlight detection
 */
export interface HighlightDetectionConfig {
  /** Sensitivity level for detection */
  sensitivity?: SensitivityLevel;
  /** Minimum confidence score (0-1) */
  minConfidence?: number;
  /** Minimum highlight duration in seconds */
  minDuration?: number;
  /** Maximum highlight duration in seconds */
  maxDuration?: number;
  /** Types of highlights to detect */
  detectionTypes?: HighlightType[];
  /** Enable audio analysis */
  enableAudioAnalysis?: boolean;
  /** Enable visual analysis */
  enableVisualAnalysis?: boolean;
  /** Gap tolerance for grouping highlights (seconds) */
  groupingGap?: number;
  /** Custom detection thresholds */
  thresholds?: {
    /** Motion threshold (0-1) */
    motion?: number;
    /** Volume threshold (0-1) */
    volume?: number;
    /** Scene change threshold (0-1) */
    sceneChange?: number;
  };
}

/**
 * Detected highlight moment
 */
export interface HighlightMoment {
  /** Start timestamp in seconds */
  startTime: number;
  /** End timestamp in seconds */
  endTime: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Type of highlight */
  type: HighlightType;
  /** Human-readable description */
  description: string;
  /** Detected features */
  features?: string[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of highlight detection
 */
export interface DetectionResult {
  /** Detected highlight moments */
  highlights: HighlightMoment[];
  /** Total number of frames analyzed */
  totalFramesAnalyzed: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Average confidence across all highlights */
  averageConfidence: number;
  /** Detection configuration used */
  config: HighlightDetectionConfig;
}

/**
 * Result of feature analysis
 */
export interface FeatureAnalysisResult {
  /** Whether this qualifies as a highlight */
  isHighlight: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Detected features */
  features: string[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Transcription segment with timing
 */
export interface TranscriptionSegment {
  /** Transcribed text */
  text: string;
  /** Start timestamp in seconds */
  start: number;
  /** End timestamp in seconds */
  end: number;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Speaker identifier */
  speaker?: string;
}

/**
 * Text formatting options
 */
export interface TextFormattingOptions {
  /** Enable automatic punctuation */
  enablePunctuation?: boolean;
  /** Enable capitalization */
  enableCapitalization?: boolean;
  /** Enable paragraph detection */
  enableParagraphs?: boolean;
  /** Maximum line length */
  maxLineLength?: number;
}
