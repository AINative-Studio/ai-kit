/**
 * @ainative/ai-kit-video
 * Video processing and recording utilities for AI Kit
 * @packageDocumentation
 */

// Export processing utilities
export * from './processing'

// Export recording utilities with instrumentation (Issue #135)
export {
  ScreenRecorder,
  ScreenRecordingError,
  type ScreenRecordingQuality,
  type CursorMode,
  type RecordingState,
  type ScreenRecorderOptions,
  type QualityConfig,
  type RecordingResult,
  type StreamSettings,
} from './recording/screen-recorder';

export {
  InstrumentedScreenRecorder,
  createInstrumentedScreenRecorder,
} from './recording/instrumented-screen-recorder';

export { AudioRecorder } from './recording/audio-recorder';
export { CameraRecorder, createCameraRecorder } from './recording/camera-recorder';
export { type AudioRecordingOptions } from './recording/types';

// Export observability utilities (Issue #135)
export {
  Logger,
  createLogger,
  LogLevel,
  type LoggerConfig,
  type LogEvent,
  type LogEventType,
} from './utils/logger';
