/**
 * Core + Video Integration Tests
 *
 * Tests the integration between @ainative/ai-kit-core and @ainative/ai-kit-video
 * including:
 * - Video transcription with AI processing
 * - Screen recording with real-time AI analysis
 * - Video processing pipelines with context management
 * - Error handling across packages
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ScreenRecorder,
  ScreenRecordingError,
  type RecordingResult,
} from '@ainative/ai-kit-video';
import { AIStream, TokenCounter, SessionManager } from '@ainative/ai-kit-core';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

describe('Core + Video Integration', () => {
  let mockMediaStream: MediaStream;
  let mockMediaRecorder: any;

  beforeEach(() => {
    // Mock MediaStream
    mockMediaStream = {
      getTracks: vi.fn().mockReturnValue([
        {
          kind: 'video',
          stop: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      ]),
      getVideoTracks: vi.fn().mockReturnValue([{
        getSettings: vi.fn().mockReturnValue({
          width: 1920,
          height: 1080,
          frameRate: 30,
        }),
      }]),
      getAudioTracks: vi.fn().mockReturnValue([]),
    } as unknown as MediaStream;

    // Mock MediaRecorder
    mockMediaRecorder = vi.fn().mockImplementation((stream, options) => ({
      state: 'inactive',
      stream,
      options,
      ondataavailable: null,
      onstop: null,
      onerror: null,
      start: vi.fn(function(this: any) {
        this.state = 'recording';
        // Simulate data available after small delay
        setTimeout(() => {
          if (this.ondataavailable) {
            this.ondataavailable({
              data: new Blob(['test video data'], { type: 'video/webm' }),
            });
          }
        }, 10);
      }),
      stop: vi.fn(function(this: any) {
        this.state = 'stopped';
        if (this.onstop) {
          this.onstop();
        }
      }),
      pause: vi.fn(function(this: any) {
        this.state = 'paused';
      }),
      resume: vi.fn(function(this: any) {
        this.state = 'recording';
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    // Mock browser APIs
    global.navigator.mediaDevices = {
      getDisplayMedia: vi.fn().mockResolvedValue(mockMediaStream),
    } as any;

    global.MediaRecorder = mockMediaRecorder as any;
    global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Video Recording with Session Management', () => {
    it('should record screen and store session data', async () => {
      // Arrange
      const sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: {
          recording: true,
          quality: 'high',
        },
      });

      // Act
      const recorder = new ScreenRecorder({ quality: 'high' });
      await recorder.start();

      // Update session with recording metadata
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          recordingStarted: Date.now(),
          state: 'recording',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      const result = await recorder.stop();

      // Update session with recording result
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          recordingStopped: Date.now(),
          state: 'completed',
          videoSize: result.size,
          duration: result.duration,
        },
      });

      // Assert
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.url).toContain('blob:');
      expect(result.size).toBeGreaterThan(0);

      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.state).toBe('completed');
      expect(updatedSession?.metadata.videoSize).toBe(result.size);
      expect(updatedSession?.metadata.duration).toBe(result.duration);
    });

    it('should handle recording errors and update session', async () => {
      // Arrange
      const sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { recording: true },
      });

      // Mock error scenario
      global.navigator.mediaDevices.getDisplayMedia = vi.fn()
        .mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      const recorder = new ScreenRecorder();

      try {
        await recorder.start();
      } catch (error) {
        // Update session with error info
        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            error: (error as Error).message,
            state: 'failed',
          },
        });
      }

      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.state).toBe('failed');
      expect(updatedSession?.metadata.error).toContain('Permission denied');
    });
  });

  describe('Video Processing with Token Management', () => {
    it('should process video transcript with token counting', async () => {
      // Arrange
      const tokenCounter = new TokenCounter();
      const transcript = `
        This is a test video transcript.
        It contains multiple sentences and paragraphs.
        We need to track token usage for AI processing.
      `.trim();

      // Act
      const tokenCount = await tokenCounter.count(transcript);
      const cost = tokenCounter.estimateCost(tokenCount.total, 'gpt-4');

      // Assert
      expect(tokenCount.total).toBeGreaterThan(0);
      expect(tokenCount.tokens).toBeGreaterThan(0);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be small for this text
    });

    it('should handle long transcripts with context truncation', async () => {
      // Arrange
      const tokenCounter = new TokenCounter();

      // Create a very long transcript that exceeds context limits
      const longTranscript = Array(1000)
        .fill('This is a sample sentence from the video transcript.')
        .join(' ');

      // Act
      const tokenCount = await tokenCounter.count(longTranscript);

      // Assert
      expect(tokenCount.total).toBeGreaterThan(1000);

      // Verify we can truncate if needed
      const maxTokens = 2000;
      if (tokenCount.total > maxTokens) {
        // In real scenario, would use ContextManager to truncate
        const truncationRatio = maxTokens / tokenCount.total;
        const truncatedLength = Math.floor(longTranscript.length * truncationRatio);
        const truncated = longTranscript.slice(0, truncatedLength);

        const truncatedCount = await tokenCounter.count(truncated);
        expect(truncatedCount.total).toBeLessThanOrEqual(maxTokens);
      }
    });
  });

  describe('Streaming Video Analysis', () => {
    it('should stream AI analysis of video content', async () => {
      // Arrange
      const videoContext = 'Analyzing screen recording for key moments';

      // Mock streaming response
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              const chunks = [
                { choices: [{ delta: { content: 'Key moment detected at ' } }] },
                { choices: [{ delta: { content: '00:15 - ' } }] },
                { choices: [{ delta: { content: 'User clicked button' } }] },
                { choices: [{ finish_reason: 'stop' }] },
              ];

              chunks.forEach((chunk, i) => {
                const line = `data: ${JSON.stringify(chunk)}\n\n`;
                controller.enqueue(encoder.encode(line));
              });

              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            },
          });

          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      // Act
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: videoContext }],
          stream: true,
        }),
      });

      const aiStream = AIStream(response);
      const chunks: string[] = [];

      const reader = aiStream.getReader();
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const text = new TextDecoder().decode(value);
          chunks.push(text);
        }
      }

      // Assert
      const fullResponse = chunks.join('');
      expect(fullResponse).toContain('Key moment detected');
      expect(fullResponse).toContain('00:15');
      expect(fullResponse).toContain('User clicked button');
    });

    it('should handle streaming errors gracefully', async () => {
      // Arrange
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.error();
        })
      );

      // Act & Assert
      await expect(async () => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Streaming failed');
        }
      }).rejects.toThrow();
    });
  });

  describe('Complete Video Recording Workflow', () => {
    it('should record, process, and analyze video end-to-end', async () => {
      // Arrange
      const sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });
      const tokenCounter = new TokenCounter();

      // Step 1: Create session
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'video-analysis' },
      });

      // Step 2: Record screen
      const recorder = new ScreenRecorder({ quality: 'medium', audio: true });
      await recorder.start();

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'recording',
          recordingStarted: Date.now(),
        },
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      const result = await recorder.stop();

      // Step 3: Simulate transcript generation
      const mockTranscript = 'User demonstrated the login flow by clicking the sign-in button.';
      const tokenCount = await tokenCounter.count(mockTranscript);

      // Step 4: Update session with results
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'completed',
          recordingCompleted: Date.now(),
          videoSize: result.size,
          transcriptTokens: tokenCount.total,
          transcript: mockTranscript,
        },
      });

      // Assert
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.step).toBe('completed');
      expect(finalSession?.metadata.videoSize).toBeGreaterThan(0);
      expect(finalSession?.metadata.transcriptTokens).toBeGreaterThan(0);
      expect(finalSession?.metadata.transcript).toBe(mockTranscript);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.url).toContain('blob:');
    });

    it('should handle partial failures in workflow', async () => {
      // Arrange
      const sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'video-analysis' },
      });

      // Step 1: Successful recording
      const recorder = new ScreenRecorder();
      await recorder.start();
      await new Promise(resolve => setTimeout(resolve, 50));
      const result = await recorder.stop();

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'recording_complete',
          videoSize: result.size,
        },
      });

      // Step 2: Simulate transcription failure
      const transcriptionError = 'Transcription service unavailable';

      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          step: 'transcription_failed',
          error: transcriptionError,
          hasVideo: true, // Video is available even though transcription failed
        },
      });

      // Assert
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.step).toBe('transcription_failed');
      expect(finalSession?.metadata.error).toBe(transcriptionError);
      expect(finalSession?.metadata.hasVideo).toBe(true);
      expect(finalSession?.metadata.videoSize).toBeGreaterThan(0);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle concurrent recordings with resource tracking', async () => {
      // Arrange
      const sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const recordings = 3;
      const sessions = await Promise.all(
        Array.from({ length: recordings }, (_, i) =>
          sessionManager.createSession({
            userId: `user-${i}`,
            metadata: { recordingIndex: i },
          })
        )
      );

      // Act
      const recorders = sessions.map(() => new ScreenRecorder({ quality: 'low' }));

      // Start all recordings
      await Promise.all(recorders.map(r => r.start()));

      // Update sessions
      await Promise.all(
        sessions.map((session, i) =>
          sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              state: 'recording',
              startTime: Date.now(),
            },
          })
        )
      );

      // Wait and stop
      await new Promise(resolve => setTimeout(resolve, 50));
      const results = await Promise.all(recorders.map(r => r.stop()));

      // Update with results
      await Promise.all(
        sessions.map((session, i) =>
          sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              state: 'completed',
              videoSize: results[i].size,
            },
          })
        )
      );

      // Assert
      expect(results).toHaveLength(recordings);
      results.forEach(result => {
        expect(result.blob).toBeInstanceOf(Blob);
        expect(result.size).toBeGreaterThan(0);
      });

      // Verify all sessions completed
      const updatedSessions = await Promise.all(
        sessions.map(s => sessionManager.getSession(s.id))
      );
      updatedSessions.forEach(session => {
        expect(session?.metadata.state).toBe('completed');
        expect(session?.metadata.videoSize).toBeGreaterThan(0);
      });
    });

    it('should properly cleanup resources after recording', async () => {
      // Arrange
      const recorder = new ScreenRecorder();
      await recorder.start();
      const stream = mockMediaStream;

      // Act
      await recorder.stop();

      // Assert - verify cleanup was called
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        expect(track.stop).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Across Packages', () => {
    it('should propagate video errors to session management', async () => {
      // Arrange
      const sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
      });

      // Mock browser error
      global.navigator.mediaDevices.getDisplayMedia = vi.fn()
        .mockRejectedValue(new Error('NotAllowedError: Permission denied'));

      // Act
      const recorder = new ScreenRecorder();
      let caughtError: Error | null = null;

      try {
        await recorder.start();
      } catch (error) {
        caughtError = error as Error;

        // Record error in session
        await sessionManager.updateSession(session.id, {
          metadata: {
            error: caughtError.message,
            errorCode: 'RECORDING_PERMISSION_DENIED',
            failedAt: Date.now(),
          },
        });
      }

      // Assert
      expect(caughtError).toBeTruthy();
      expect(caughtError?.message).toContain('Permission denied');

      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.error).toContain('Permission denied');
      expect(updatedSession?.metadata.errorCode).toBe('RECORDING_PERMISSION_DENIED');
    });

    it('should handle streaming errors with proper session state', async () => {
      // Arrange
      const sessionManager = new SessionManager({
        storage: { type: 'memory' },
      });

      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: { workflow: 'streaming-analysis' },
      });

      // Mock API error
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return new HttpResponse(null, { status: 429 });
        })
      );

      // Act
      let apiError: Error | null = null;
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'test' }],
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (error) {
        apiError = error as Error;

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            error: apiError.message,
            errorCode: 'API_RATE_LIMIT',
          },
        });
      }

      // Assert
      expect(apiError).toBeTruthy();
      expect(apiError?.message).toContain('429');

      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.error).toContain('429');
      expect(updatedSession?.metadata.errorCode).toBe('API_RATE_LIMIT');
    });
  });
});
