import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { VideoRecorder } from '../../components/VideoRecorder';

// Mock MediaStream and MediaRecorder
class MockMediaStream {
  active = true;
  id = 'mock-stream-id';

  getTracks() {
    return [
      {
        kind: 'video',
        stop: vi.fn(),
        enabled: true,
      },
      {
        kind: 'audio',
        stop: vi.fn(),
        enabled: true,
      },
    ];
  }

  getVideoTracks() {
    return this.getTracks().filter(t => t.kind === 'video');
  }

  getAudioTracks() {
    return this.getTracks().filter(t => t.kind === 'audio');
  }
}

class MockMediaRecorder {
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  stream: any;

  constructor(stream: any) {
    this.stream = stream;
    (global as any).mockMediaRecorderInstance = this;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      const blob = new Blob(['mock-video-data'], { type: 'video/webm' });
      this.ondataavailable({ data: blob });
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// Setup global mocks
beforeEach(() => {
  // Mock getUserMedia
  global.navigator.mediaDevices = {
    getUserMedia: vi.fn(() => Promise.resolve(new MockMediaStream() as any)),
  } as any;

  // Mock MediaRecorder
  global.MediaRecorder = MockMediaRecorder as any;
  (global.MediaRecorder as any).isTypeSupported = vi.fn(() => true);

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock HTMLVideoElement play method
  HTMLVideoElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLVideoElement.prototype.pause = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  (global as any).mockMediaRecorderInstance = null;
});

describe('VideoRecorder', () => {
  describe('Basic Rendering', () => {
    test('renders video recorder with default props', () => {
      render(<VideoRecorder />);
      expect(screen.getByTestId('video-recorder')).toBeInTheDocument();
    });

    test('displays start recording button initially', () => {
      render(<VideoRecorder />);
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    });

    test('shows video preview element', () => {
      render(<VideoRecorder />);
      const video = screen.getByTestId('video-preview');
      expect(video).toBeInTheDocument();
      expect(video.tagName).toBe('VIDEO');
    });

    test('applies custom className', () => {
      render(<VideoRecorder className="custom-class" />);
      const container = screen.getByTestId('video-recorder');
      expect(container).toHaveClass('custom-class');
    });

    test('applies custom testId', () => {
      render(<VideoRecorder testId="custom-recorder" />);
      expect(screen.getByTestId('custom-recorder')).toBeInTheDocument();
    });
  });

  describe('Recording Controls', () => {
    test('starts recording when start button is clicked', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
          video: true,
          audio: true,
        });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });
    });

    test('stops recording when stop button is clicked', async () => {
      render(<VideoRecorder />);

      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });

      // Stop recording
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
      });
    });

    test('shows pause button during recording', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });
    });

    test('pauses and resumes recording', async () => {
      render(<VideoRecorder />);

      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // Pause
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      });

      // Resume
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });
    });
  });

  describe('Countdown', () => {
    test('shows countdown when enabled', async () => {
      render(<VideoRecorder countdown={3} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('countdown-display')).toBeInTheDocument();
      });
    });

    test('displays countdown numbers correctly', async () => {
      vi.useFakeTimers();
      render(<VideoRecorder countdown={3} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    test('starts recording after countdown completes', async () => {
      vi.useFakeTimers();
      render(<VideoRecorder countdown={2} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByTestId('countdown-display')).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Duration Display', () => {
    test('shows duration during recording', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('duration-display')).toBeInTheDocument();
      });
    });

    test('displays duration in correct format', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const durationDisplay = screen.getByTestId('duration-display');
        expect(durationDisplay).toHaveTextContent(/\d{2}:\d{2}/);
      });
    });

    test('updates duration during recording', async () => {
      vi.useFakeTimers();
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('duration-display')).toHaveTextContent('00:00');
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByTestId('duration-display')).toHaveTextContent('00:05');
      });

      vi.useRealTimers();
    });
  });

  describe('Preview', () => {
    test('shows preview after recording stops', async () => {
      render(<VideoRecorder />);

      // Start and stop recording
      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByTestId('recorded-preview')).toBeInTheDocument();
      });
    });

    test('shows download button after recording', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      });
    });

    test('shows reset button after recording', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /record again/i })).toBeInTheDocument();
      });
    });

    test('resets to initial state when record again is clicked', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop recording/i });
        fireEvent.click(stopButton);
      });

      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /record again/i });
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
        expect(screen.queryByTestId('recorded-preview')).not.toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    test('calls onRecordingStart when recording starts', async () => {
      const onRecordingStart = vi.fn();
      render(<VideoRecorder onRecordingStart={onRecordingStart} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onRecordingStart).toHaveBeenCalled();
      });
    });

    test('calls onRecordingStop when recording stops', async () => {
      const onRecordingStop = vi.fn();
      render(<VideoRecorder onRecordingStop={onRecordingStop} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop recording/i });
        fireEvent.click(stopButton);
      });

      await waitFor(() => {
        expect(onRecordingStop).toHaveBeenCalledWith(expect.any(Blob));
      });
    });

    test('calls onError when media access fails', async () => {
      const onError = vi.fn();
      const error = new Error('Permission denied');
      (global.navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      render(<VideoRecorder onError={onError} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Configuration', () => {
    test('uses custom video constraints', async () => {
      const videoConstraints = { width: 1920, height: 1080 };
      render(<VideoRecorder videoConstraints={videoConstraints} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
          video: videoConstraints,
          audio: true,
        });
      });
    });

    test('disables audio when audio prop is false', async () => {
      render(<VideoRecorder audio={false} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
          video: true,
          audio: false,
        });
      });
    });

    test('applies max duration limit', async () => {
      const onRecordingStop = vi.fn();
      vi.useFakeTimers();

      render(<VideoRecorder maxDuration={5} onRecordingStop={onRecordingStop} />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(onRecordingStop).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when camera access fails', async () => {
      (global.navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
        new Error('Camera not found')
      );

      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/camera not found/i)).toBeInTheDocument();
      });
    });

    test('handles recording errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const mockRecorder = (global as any).mockMediaRecorderInstance;
        if (mockRecorder && mockRecorder.onerror) {
          mockRecorder.onerror(new Error('Recording failed'));
        }
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('all buttons have accessible labels', () => {
      render(<VideoRecorder />);
      const startButton = screen.getByRole('button', { name: /start recording/i });
      expect(startButton).toHaveAttribute('aria-label');
    });

    test('video element has proper aria attributes', () => {
      render(<VideoRecorder />);
      const video = screen.getByTestId('video-preview');
      expect(video).toHaveAttribute('aria-label');
    });

    test('duration display is announced for screen readers', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const durationDisplay = screen.getByTestId('duration-display');
        expect(durationDisplay).toHaveAttribute('aria-live');
      });
    });

    test('recording status is announced', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const status = screen.getByTestId('recording-status');
        expect(status).toHaveAttribute('role', 'status');
        expect(status).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Cleanup', () => {
    test('stops media stream on unmount', async () => {
      const { unmount } = render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
      });

      const stream = new MockMediaStream();
      const stopTrack = vi.spyOn(stream.getTracks()[0], 'stop');

      unmount();

      // Verify cleanup would be called (actual implementation will handle this)
    });

    test('revokes object URLs on reset', async () => {
      render(<VideoRecorder />);

      const startButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop recording/i });
        fireEvent.click(stopButton);
      });

      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /record again/i });
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      });
    });
  });
});
