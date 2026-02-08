import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Recording states
 */
export type RecordingState = 'idle' | 'recording' | 'paused';

/**
 * Options for recording state management
 */
export interface UseRecordingStateOptions {
  /**
   * Callback when recording starts
   */
  onStart?: () => void;

  /**
   * Callback when recording stops
   */
  onStop?: () => void;

  /**
   * Callback when recording is paused
   */
  onPause?: () => void;

  /**
   * Callback when recording is resumed
   */
  onResume?: () => void;

  /**
   * Callback when duration changes
   */
  onDurationChange?: (duration: number) => void;
}

/**
 * State for recording management
 */
export interface RecordingStateData {
  /**
   * Current recording state
   */
  recordingState: RecordingState;

  /**
   * Current recording duration in seconds
   */
  duration: number;

  /**
   * Whether the recording is active (recording or paused)
   */
  isActive: boolean;
}

/**
 * Actions for recording state management
 */
export interface RecordingStateActions {
  /**
   * Start recording
   */
  start: () => void;

  /**
   * Stop recording
   */
  stop: () => void;

  /**
   * Pause recording
   */
  pause: () => void;

  /**
   * Resume recording
   */
  resume: () => void;

  /**
   * Reset state
   */
  reset: () => void;
}

/**
 * Return type for useRecordingState hook
 */
export interface UseRecordingStateReturn extends RecordingStateData, RecordingStateActions {}

/**
 * Hook for managing recording state and duration tracking
 *
 * @param options - Configuration options
 * @returns Recording state and control actions
 *
 * @example
 * ```tsx
 * const {
 *   recordingState,
 *   duration,
 *   start,
 *   stop,
 *   pause,
 *   resume
 * } = useRecordingState({
 *   onStart: () => console.log('Started'),
 *   onStop: () => console.log('Stopped')
 * });
 * ```
 *
 * Built by AINative
 */
export function useRecordingState(
  options: UseRecordingStateOptions = {}
): UseRecordingStateReturn {
  const { onStart, onStop, onPause, onResume, onDurationChange } = options;

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);

  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedDurationRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  const isActive = recordingState !== 'idle';

  // Update duration
  const updateDuration = useCallback(() => {
    if (recordingState === 'recording') {
      const elapsed = (Date.now() - startTimeRef.current - totalPausedDurationRef.current) / 1000;
      setDuration(elapsed);
      onDurationChange?.(elapsed);
    }
  }, [recordingState, onDurationChange]);

  // Start interval when recording
  useEffect(() => {
    if (recordingState === 'recording') {
      intervalRef.current = window.setInterval(updateDuration, 100);
    } else if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [recordingState, updateDuration]);

  // Start recording
  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    totalPausedDurationRef.current = 0;
    pausedTimeRef.current = 0;
    setDuration(0);
    setRecordingState('recording');
    onStart?.();
  }, [onStart]);

  // Stop recording
  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRecordingState('idle');
    setDuration(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    totalPausedDurationRef.current = 0;
    onStop?.();
  }, [onStop]);

  // Pause recording
  const pause = useCallback(() => {
    if (recordingState === 'recording') {
      pausedTimeRef.current = Date.now();
      setRecordingState('paused');
      onPause?.();
    }
  }, [recordingState, onPause]);

  // Resume recording
  const resume = useCallback(() => {
    if (recordingState === 'paused') {
      const pausedDuration = Date.now() - pausedTimeRef.current;
      totalPausedDurationRef.current += pausedDuration;
      pausedTimeRef.current = 0;
      setRecordingState('recording');
      onResume?.();
    }
  }, [recordingState, onResume]);

  // Reset state
  const reset = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRecordingState('idle');
    setDuration(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    totalPausedDurationRef.current = 0;
  }, []);

  return {
    recordingState,
    duration,
    isActive,
    start,
    stop,
    pause,
    resume,
    reset
  };
}
