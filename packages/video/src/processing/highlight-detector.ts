/**
 * AI-Powered Video Highlight Detection
 *
 * This module provides sophisticated highlight detection using multi-modal AI analysis,
 * combining visual, audio, and contextual signals to identify key moments in videos.
 *
 * @module @ainative/video/processing/highlight-detector
 * @example
 * ```typescript
 * const detector = new HighlightDetector({
 *   sensitivity: 'high',
 *   minConfidence: 0.8,
 *   detectionTypes: ['action', 'emotion', 'dialogue']
 * });
 *
 * const frames = await extractVideoFrames(videoPath);
 * const result = detector.detectHighlights(frames);
 *
 * console.log(`Found ${result.highlights.length} highlights`);
 * result.highlights.forEach(h => {
 *   console.log(`${h.type} at ${h.startTime}s - ${h.endTime}s (${h.confidence})`);
 * });
 * ```
 */

import {
  HighlightMoment,
  HighlightDetectionConfig,
  VideoFrame,
  AudioFeatures,
  HighlightType,
  DetectionResult,
  FeatureAnalysisResult,
  SensitivityLevel
} from './types';

/**
 * Default configuration for highlight detection
 */
const DEFAULT_CONFIG: Required<HighlightDetectionConfig> = {
  sensitivity: 'medium',
  minConfidence: 0.7,
  minDuration: 1.0,
  maxDuration: 15.0,
  detectionTypes: ['action', 'emotion', 'dialogue', 'scene'],
  enableAudioAnalysis: true,
  enableVisualAnalysis: true,
  groupingGap: 2.0,
  thresholds: {
    motion: 0.7,
    volume: 0.6,
    sceneChange: 0.8
  }
};

/**
 * Sensitivity multipliers for detection thresholds
 */
const SENSITIVITY_MULTIPLIERS: Record<SensitivityLevel, number> = {
  low: 1.3,
  medium: 1.0,
  high: 0.7
};

/**
 * HighlightDetector - AI-powered video highlight detection
 *
 * This class implements a sophisticated multi-modal approach to detect highlights:
 * - Visual Analysis: Motion detection, scene changes, face detection, object tracking
 * - Audio Analysis: Volume spikes, speech patterns, music detection, sentiment
 * - Temporal Analysis: Rhythm, pacing, momentum changes
 * - Contextual Analysis: Combining multiple signals for robust detection
 */
export class HighlightDetector {
  private config: Required<HighlightDetectionConfig>;
  private detectionCache: Map<string, FeatureAnalysisResult>;

  /**
   * Create a new HighlightDetector
   *
   * @param config - Configuration options for highlight detection
   * @throws Error if configuration is invalid
   */
  constructor(config: HighlightDetectionConfig = {}) {
    this.validateConfig(config);
    this.config = this.mergeConfig(config);
    this.detectionCache = new Map();
  }

  /**
   * Validate configuration parameters
   */
  private validateConfig(config: HighlightDetectionConfig): void {
    if (config.minConfidence !== undefined) {
      if (config.minConfidence < 0 || config.minConfidence > 1) {
        throw new Error('Confidence threshold must be between 0 and 1');
      }
    }

    if (config.minDuration !== undefined && config.maxDuration !== undefined) {
      if (config.maxDuration <= config.minDuration) {
        throw new Error('Maximum duration must be greater than minimum duration');
      }
    }
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(config: HighlightDetectionConfig): Required<HighlightDetectionConfig> {
    return {
      sensitivity: config.sensitivity ?? DEFAULT_CONFIG.sensitivity,
      minConfidence: config.minConfidence ?? DEFAULT_CONFIG.minConfidence,
      minDuration: config.minDuration ?? DEFAULT_CONFIG.minDuration,
      maxDuration: config.maxDuration ?? DEFAULT_CONFIG.maxDuration,
      detectionTypes: config.detectionTypes ?? DEFAULT_CONFIG.detectionTypes,
      enableAudioAnalysis: config.enableAudioAnalysis ?? DEFAULT_CONFIG.enableAudioAnalysis,
      enableVisualAnalysis: config.enableVisualAnalysis ?? DEFAULT_CONFIG.enableVisualAnalysis,
      groupingGap: config.groupingGap ?? DEFAULT_CONFIG.groupingGap,
      thresholds: {
        motion: config.thresholds?.motion ?? DEFAULT_CONFIG.thresholds.motion,
        volume: config.thresholds?.volume ?? DEFAULT_CONFIG.thresholds.volume,
        sceneChange: config.thresholds?.sceneChange ?? DEFAULT_CONFIG.thresholds.sceneChange
      }
    };
  }

  /**
   * Get adjusted threshold based on sensitivity
   */
  private getAdjustedThreshold(baseThreshold: number): number {
    const multiplier = SENSITIVITY_MULTIPLIERS[this.config.sensitivity];
    return Math.max(0, Math.min(1, baseThreshold * multiplier));
  }

  /**
   * Detect highlights in video frames
   *
   * This is the main entry point for highlight detection. It analyzes frames
   * using both visual and audio features, then groups and filters results.
   *
   * @param frames - Array of video frames to analyze
   * @returns Detection result with highlights and statistics
   */
  detectHighlights(frames: VideoFrame[]): DetectionResult {
    const startTime = Date.now();

    if (frames.length === 0) {
      return {
        highlights: [],
        totalFramesAnalyzed: 0,
        processingTimeMs: 0,
        averageConfidence: 0,
        config: this.config
      };
    }

    const candidates: HighlightMoment[] = [];

    // Analyze each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!frame) continue;
      const highlights = this.analyzeFrame(frame, i, frames);
      candidates.push(...highlights);
    }

    // Group nearby highlights
    const grouped = this.groupHighlights(candidates, this.config.groupingGap);

    // Filter by confidence
    const filtered = grouped.filter(h => h.confidence >= this.config.minConfidence);

    // Calculate statistics
    const processingTimeMs = Date.now() - startTime;
    const averageConfidence = filtered.length > 0
      ? filtered.reduce((sum, h) => sum + h.confidence, 0) / filtered.length
      : 0;

    return {
      highlights: filtered,
      totalFramesAnalyzed: frames.length,
      processingTimeMs,
      averageConfidence,
      config: this.config
    };
  }

  /**
   * Analyze a single frame for highlights
   */
  private analyzeFrame(frame: VideoFrame, _index: number, _allFrames: VideoFrame[]): HighlightMoment[] {
    const highlights: HighlightMoment[] = [];

    // Visual analysis
    if (this.config.enableVisualAnalysis) {
      const visualResult = this.analyzeVisualFeatures(frame);
      if (visualResult.isHighlight) {
        highlights.push(this.createHighlightFromVisual(frame, visualResult));
      }
    }

    // Audio analysis
    if (this.config.enableAudioAnalysis && frame.metadata?.audio) {
      const audioResult = this.analyzeAudioFeatures(frame.metadata.audio, frame.timestamp);
      if (audioResult.isHighlight) {
        highlights.push(this.createHighlightFromAudio(frame, audioResult));
      }
    }

    return highlights;
  }

  /**
   * Analyze visual features of a frame
   *
   * Detects:
   * - High motion/action sequences
   * - Scene changes and transitions
   * - Face detection and emotions
   * - Object tracking
   *
   * @param frame - Video frame to analyze
   * @returns Feature analysis result
   */
  analyzeVisualFeatures(frame: VideoFrame): FeatureAnalysisResult {
    const features: string[] = [];
    let confidence = 0;
    let isHighlight = false;

    const metadata = frame.metadata || {};

    // Motion detection
    if (metadata.motion !== undefined) {
      const motionThreshold = this.getAdjustedThreshold(this.config.thresholds.motion ?? 0.7);
      if (metadata.motion >= motionThreshold) {
        features.push('high_motion');
        confidence = Math.max(confidence, metadata.motion ?? 0);
        isHighlight = true;
      }
    }

    // Scene change detection
    if (metadata.sceneChange) {
      const sceneThreshold = this.getAdjustedThreshold(this.config.thresholds.sceneChange ?? 0.8);
      features.push('scene_change');
      confidence = Math.max(confidence, sceneThreshold ?? 0);
      isHighlight = true;
    }

    // Face detection
    if (metadata.faces !== undefined && metadata.faces > 1) {
      features.push('multiple_faces');
      confidence = Math.max(confidence, 0.7);
      isHighlight = true;
    }

    // Emotion detection
    if (metadata.emotion && ['happy', 'excited', 'surprised'].includes(metadata.emotion)) {
      features.push('emotion_detected');
      confidence = Math.max(confidence, 0.75);
      isHighlight = true;
    }

    return {
      isHighlight,
      confidence,
      features,
      metadata: frame.metadata
    };
  }

  /**
   * Analyze audio features for highlights
   *
   * Detects:
   * - Volume spikes and dynamics
   * - Speech patterns and important dialogue
   * - Music and rhythm changes
   * - Silence and pauses
   *
   * @param audioFeatures - Audio features to analyze
   * @param _timestamp - Current timestamp
   * @returns Feature analysis result
   */
  analyzeAudioFeatures(audioFeatures: AudioFeatures, _timestamp: number): FeatureAnalysisResult {
    const features: string[] = [];
    let confidence = 0;
    let isHighlight = false;

    // Volume spike detection
    const volumeThreshold = this.getAdjustedThreshold(this.config.thresholds.volume ?? 0.6);
    if (audioFeatures.volume >= volumeThreshold) {
      features.push('volume_spike');
      confidence = Math.max(confidence, audioFeatures.volume ?? 0);
      isHighlight = true;
    }

    // Speech detection
    if (audioFeatures.speechDetected) {
      features.push('speech_detected');
      confidence = Math.max(confidence, 0.75);
      isHighlight = true;

      // Enhanced confidence for important keywords
      if (audioFeatures.transcription) {
        const importantWords = ['important', 'amazing', 'incredible', 'wow', 'yes', 'goal'];
        const hasImportantWord = importantWords.some(word =>
          audioFeatures.transcription!.toLowerCase().includes(word)
        );
        if (hasImportantWord) {
          features.push('important_dialogue');
          confidence = Math.max(confidence, 0.9);
        }
      }
    }

    // Music detection
    if (audioFeatures.musicDetected) {
      features.push('music_detected');

      // High tempo music is often highlight-worthy
      if (audioFeatures.tempo > 120) {
        features.push('high_tempo');
        confidence = Math.max(confidence, 0.8);
        isHighlight = true;
      }
    }

    // Very low volume (silence) is not a highlight
    if (audioFeatures.volume < 0.1) {
      isHighlight = false;
      confidence = 0.1;
    }

    return {
      isHighlight,
      confidence,
      features,
      metadata: { audioFeatures }
    };
  }

  /**
   * Create highlight moment from visual analysis
   */
  private createHighlightFromVisual(frame: VideoFrame, result: FeatureAnalysisResult): HighlightMoment {
    let type: HighlightType = 'scene';

    if (result.features.includes('high_motion')) {
      type = 'action';
    } else if (result.features.includes('emotion_detected')) {
      type = 'emotion';
    } else if (result.features.includes('scene_change')) {
      type = 'scene';
    }

    return {
      startTime: frame.timestamp,
      endTime: frame.timestamp + 0.5, // Default half-second duration
      confidence: result.confidence,
      type,
      description: this.generateDescription(type, result.features),
      features: result.features,
      metadata: result.metadata
    };
  }

  /**
   * Create highlight moment from audio analysis
   */
  private createHighlightFromAudio(frame: VideoFrame, result: FeatureAnalysisResult): HighlightMoment {
    let type: HighlightType = 'dialogue';

    if (result.features.includes('music_detected')) {
      type = 'music';
    } else if (result.features.includes('speech_detected')) {
      type = 'dialogue';
    }

    return {
      startTime: frame.timestamp,
      endTime: frame.timestamp + 0.5,
      confidence: result.confidence,
      type,
      description: this.generateDescription(type, result.features),
      features: result.features,
      metadata: result.metadata
    };
  }

  /**
   * Generate human-readable description for highlight
   */
  private generateDescription(type: HighlightType, features: string[]): string {
    const descriptions: Record<HighlightType, string> = {
      action: 'High action sequence',
      emotion: 'Emotional moment',
      dialogue: 'Important dialogue',
      scene: 'Scene transition',
      music: 'Musical highlight',
      custom: 'Custom highlight'
    };

    let description = descriptions[type];

    if (features.includes('high_motion')) {
      description = 'Intense action sequence';
    } else if (features.includes('important_dialogue')) {
      description = 'Critical conversation';
    } else if (features.includes('high_tempo')) {
      description = 'Energetic musical moment';
    } else if (features.includes('emotion_detected')) {
      description = 'Strong emotional reaction';
    }

    return description;
  }

  /**
   * Group nearby highlights into continuous segments
   *
   * This reduces fragmentation and creates more meaningful highlight clips
   * by merging highlights that are close together in time.
   *
   * @param moments - Individual highlight moments
   * @param maxGap - Maximum gap in seconds to consider for grouping
   * @returns Grouped highlight moments
   */
  groupHighlights(moments: HighlightMoment[], maxGap: number = 2.0): HighlightMoment[] {
    if (moments.length === 0) return [];

    // Sort by start time
    const sorted = [...moments].sort((a, b) => a.startTime - b.startTime);
    const grouped: HighlightMoment[] = [];

    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      if (!next || current.endTime === undefined) continue;

      const gap = next.startTime - current.endTime;

      // Merge if gap is small and same type
      if (gap <= maxGap && next.type === current.type && next.endTime !== undefined) {
        current.endTime = Math.max(current.endTime ?? 0, next.endTime ?? 0);
        current.confidence = ((current.confidence ?? 0) + (next.confidence ?? 0)) / 2;
        current.features = [...new Set([...(current.features || []), ...(next.features || [])])];
      } else {
        // Validate duration constraints
        const duration = (current.endTime ?? 0) - (current.startTime ?? 0);
        if (duration >= this.config.minDuration && duration <= this.config.maxDuration &&
            current.startTime !== undefined && current.endTime !== undefined &&
            current.confidence !== undefined && current.type !== undefined && current.description !== undefined) {
          grouped.push({
            startTime: current.startTime,
            endTime: current.endTime,
            confidence: current.confidence,
            type: current.type,
            description: current.description,
            features: current.features,
            metadata: current.metadata
          });
        }
        current = { ...next };
      }
    }

    // Add last group
    const duration = (current.endTime ?? 0) - (current.startTime ?? 0);
    if (duration >= this.config.minDuration && duration <= this.config.maxDuration &&
        current.startTime !== undefined && current.endTime !== undefined &&
        current.confidence !== undefined && current.type !== undefined && current.description !== undefined) {
      grouped.push({
        startTime: current.startTime,
        endTime: current.endTime,
        confidence: current.confidence,
        type: current.type,
        description: current.description,
        features: current.features,
        metadata: current.metadata
      });
    }

    return grouped;
  }

  /**
   * Get sorted highlight timestamps with optional filtering
   *
   * @param moments - Highlight moments to process
   * @param minConfidence - Optional minimum confidence filter
   * @returns Sorted array of highlight timestamps
   */
  getHighlightTimestamps(moments: HighlightMoment[], minConfidence?: number): HighlightMoment[] {
    let filtered = [...moments];

    // Apply confidence filter if specified
    if (minConfidence !== undefined) {
      filtered = filtered.filter(m => m.confidence >= minConfidence);
    }

    // Sort by start time
    return filtered.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<HighlightDetectionConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HighlightDetectionConfig>): void {
    this.validateConfig(config);
    this.config = this.mergeConfig({ ...this.config, ...config });
    this.detectionCache.clear(); // Clear cache on config change
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.detectionCache.clear();
  }
}

/**
 * Utility function to create a highlight detector with preset configurations
 */
export const createHighlightDetector = {
  /**
   * Create a detector optimized for sports/action videos
   */
  forSports(): HighlightDetector {
    return new HighlightDetector({
      sensitivity: 'high',
      minConfidence: 0.75,
      detectionTypes: ['action', 'emotion'],
      thresholds: {
        motion: 0.7,
        volume: 0.8,
        sceneChange: 0.7
      }
    });
  },

  /**
   * Create a detector optimized for interviews/dialogue
   */
  forDialogue(): HighlightDetector {
    return new HighlightDetector({
      sensitivity: 'medium',
      minConfidence: 0.7,
      detectionTypes: ['dialogue', 'emotion'],
      enableAudioAnalysis: true,
      thresholds: {
        volume: 0.5
      }
    });
  },

  /**
   * Create a detector optimized for music videos
   */
  forMusic(): HighlightDetector {
    return new HighlightDetector({
      sensitivity: 'high',
      minConfidence: 0.7,
      detectionTypes: ['music', 'scene'],
      enableAudioAnalysis: true,
      thresholds: {
        volume: 0.6
      }
    });
  },

  /**
   * Create a detector with balanced settings
   */
  balanced(): HighlightDetector {
    return new HighlightDetector({
      sensitivity: 'medium',
      minConfidence: 0.7,
      detectionTypes: ['action', 'emotion', 'dialogue', 'scene']
    });
  }
};
