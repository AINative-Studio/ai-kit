import { useState, useCallback, useRef, useEffect } from 'react';

export interface RecordingHookOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  includeCursor?: boolean;
  includeAudio?: boolean;
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export interface UseScreenRecordingReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Blob | null;
  pauseRecording: () => void;
  resumeRecording: () => void;
  recordingState: 'idle' | 'recording' | 'paused';
  recordingBlob: Blob | null;
  duration: number;
  error: Error | null;
}

const QUALITY_SETTINGS = {
  low: { videoBitsPerSecond: 2500000 },
  medium: { videoBitsPerSecond: 5000000 },
  high: { videoBitsPerSecond: 8000000 },
  ultra: { videoBitsPerSecond: 16000000 },
};

export function useScreenRecording(
  options: RecordingHookOptions = {}
): UseScreenRecordingReturn {
  const {
    quality = 'medium',
    includeCursor = true,
    includeAudio = false,
    onStart,
    onStop,
    onError,
  } = options;

  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Get display media
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: includeCursor ? 'always' : 'never',
        } as any,
        audio: includeAudio,
      });

      streamRef.current = stream;

      // Create media recorder
      const qualitySettings = QUALITY_SETTINGS[quality];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        ...qualitySettings,
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordingBlob(blob);
        setRecordingState('idle');
        onStop?.(blob);

        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorderRef.current.start(100);
      setRecordingState('recording');
      startTimeRef.current = Date.now();

      // Update duration
      durationIntervalRef.current = window.setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);

      onStart?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setRecordingState('idle');
      onError?.(error);
    }
  }, [quality, includeCursor, includeAudio, onStart, onStop, onError]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || recordingState === 'idle') {
      return null;
    }

    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());

    return recordingBlob;
  }, [recordingState, recordingBlob]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [recordingState]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');

      startTimeRef.current = Date.now() - duration * 1000;
      durationIntervalRef.current = window.setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    }
  }, [recordingState, duration]);

  // Setup beforeunload handler to cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    recordingState,
    recordingBlob,
    duration,
    error,
  };
}
