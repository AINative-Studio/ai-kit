import React, { useState, useRef, useEffect } from 'react';
import { useScreenRecording } from '../../hooks/useScreenRecording';

export interface VideoRecorderProps {
  mode: 'screen' | 'camera' | 'both';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  onRecordingComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  showPreview?: boolean;
  showControls?: boolean;
  className?: string;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  mode,
  quality = 'medium',
  onRecordingComplete,
  onError,
  showPreview = true,
  showControls = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    recordingState,
    duration,
    error,
  } = useScreenRecording({
    quality,
    includeAudio: true,
    onStop: onRecordingComplete,
    onError,
  });

  useEffect(() => {
    if (mode === 'camera' && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(mediaStream => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch(err => onError?.(err));
    }

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [mode, onError]);

  const handleStart = async () => {
    await startRecording();
    if (mode === 'screen' && videoRef.current) {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setStream(displayStream);
      videoRef.current.srcObject = displayStream;
    }
  };

  const handleStop = () => {
    stopRecording();
    stream?.getTracks().forEach(track => track.stop());
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`video-recorder ${className}`}>
      {showPreview && (
        <div className="video-preview">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              maxWidth: '640px',
              borderRadius: '8px',
              backgroundColor: '#000',
            }}
          />
          {recordingState === 'recording' && (
            <div className="recording-indicator" style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(220, 38, 38, 0.9)',
              borderRadius: '20px',
              color: 'white',
              fontWeight: 'bold',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'white',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              REC {formatDuration(duration)}
            </div>
          )}
        </div>
      )}

      {showControls && (
        <div className="recording-controls" style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          justifyContent: 'center',
        }}>
          {recordingState === 'idle' && (
            <button
              onClick={handleStart}
              style={{
                padding: '12px 24px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Start Recording
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Pause
              </button>
              <button
                onClick={handleStop}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Stop
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Resume
              </button>
              <button
                onClick={handleStop}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Stop
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="error-message" style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '6px',
        }}>
          Error: {error.message}
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
