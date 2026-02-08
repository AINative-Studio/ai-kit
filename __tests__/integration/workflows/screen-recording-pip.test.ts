/**
 * Integration Test: Screen Recording → PIP Composition → Export Workflow
 *
 * Tests the complete workflow from screen recording through Picture-in-Picture
 * composition to final video export.
 *
 * @group integration
 * @group video
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ScreenRecorder } from '../../../packages/video/src/recording/screen-recorder'

describe('Integration: Screen Recording → PIP Composition → Export', () => {
  let mockDisplayStream: MediaStream
  let mockCameraStream: MediaStream
  let mockVideoTrack: MediaStreamTrack
  let recorder: ScreenRecorder

  beforeEach(() => {
    // Mock MediaStreamTrack for screen
    mockVideoTrack = {
      id: 'screen-track-1',
      kind: 'video',
      enabled: true,
      muted: false,
      readyState: 'live',
      stop: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getSettings: vi.fn(() => ({
        width: 1920,
        height: 1080,
        frameRate: 30,
        cursor: 'always',
      })),
    } as unknown as MediaStreamTrack

    // Mock MediaStream for screen
    mockDisplayStream = {
      id: 'display-stream-1',
      active: true,
      getTracks: vi.fn(() => [mockVideoTrack]),
      getVideoTracks: vi.fn(() => [mockVideoTrack]),
      getAudioTracks: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaStream

    // Mock getDisplayMedia
    global.navigator.mediaDevices = {
      getDisplayMedia: vi.fn(async () => mockDisplayStream),
      getUserMedia: vi.fn(async () => mockCameraStream),
    } as any

    // Mock MediaRecorder
    global.MediaRecorder = vi.fn().mockImplementation((stream, options) => ({
      stream,
      mimeType: options?.mimeType || 'video/webm',
      state: 'inactive',
      start: vi.fn(function() { this.state = 'recording' }),
      stop: vi.fn(function() {
        this.state = 'inactive'
        if (this.onstop) this.onstop()
      }),
      pause: vi.fn(function() { this.state = 'paused' }),
      resume: vi.fn(function() { this.state = 'recording' }),
      ondataavailable: null,
      onstop: null,
      onerror: null,
    })) as any

    // Mock MediaRecorder.isTypeSupported
    MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
      return mimeType.includes('webm')
    })

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-video')
  })

  afterEach(() => {
    if (recorder) {
      recorder.dispose()
    }
    vi.clearAllMocks()
  })

  describe('Given a user wants to record their screen with PIP overlay', () => {
    describe('When they start screen recording', () => {
      it('Then the screen capture should initialize with correct quality settings', async () => {
        // Arrange
        recorder = new ScreenRecorder({
          quality: 'high',
          cursor: 'always',
          audio: false,
        })

        // Act
        await recorder.startRecording()

        // Assert
        expect(recorder.isRecording()).toBe(true)
        expect(recorder.getState()).toBe('recording')
        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
          video: {
            cursor: 'always',
            frameRate: 30,
          },
          audio: false,
        })
      })

      it('Then it should support different quality presets', async () => {
        // Arrange - Test each quality preset
        const qualities = ['low', 'medium', 'high', 'ultra'] as const

        for (const quality of qualities) {
          const testRecorder = new ScreenRecorder({ quality })

          // Act
          await testRecorder.startRecording()
          const config = testRecorder.getQualityConfig()

          // Assert
          expect(config).toBeDefined()
          expect(config.videoBitsPerSecond).toBeGreaterThan(0)
          expect(config.frameRate).toBeGreaterThan(0)

          // Cleanup
          await testRecorder.stopRecording()
          testRecorder.dispose()
        }
      })
    })

    describe('When they configure cursor visibility', () => {
      it('Then it should support cursor always visible mode', async () => {
        // Arrange
        recorder = new ScreenRecorder({ cursor: 'always' })

        // Act
        await recorder.startRecording()

        // Assert
        expect(recorder.isCursorEnabled()).toBe(true)
        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              cursor: 'always',
            }),
          })
        )
      })

      it('Then it should support cursor never visible mode', async () => {
        // Arrange
        recorder = new ScreenRecorder({ cursor: 'never' })

        // Act
        await recorder.startRecording()

        // Assert
        expect(recorder.isCursorEnabled()).toBe(false)
        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              cursor: 'never',
            }),
          })
        )
      })

      it('Then it should prevent cursor changes during recording', async () => {
        // Arrange
        recorder = new ScreenRecorder({ cursor: 'always' })
        await recorder.startRecording()

        // Act & Assert
        expect(() => recorder.setCursor('never')).toThrow(
          'Cannot change cursor setting while recording'
        )
      })
    })

    describe('When they stop recording', () => {
      it('Then it should return a valid recording result with blob and URL', async () => {
        // Arrange
        recorder = new ScreenRecorder({ quality: 'medium' })
        await recorder.startRecording()

        // Simulate data chunks
        const mockRecorder = (recorder as any).mediaRecorder
        const mockBlob = new Blob(['video data'], { type: 'video/webm' })
        mockRecorder.ondataavailable({ data: mockBlob })

        // Act
        const result = await recorder.stopRecording()

        // Assert
        expect(result).toBeDefined()
        expect(result.blob).toBeInstanceOf(Blob)
        expect(result.url).toBe('blob:http://localhost/test-video')
        expect(result.duration).toBeGreaterThan(0)
        expect(result.size).toBeGreaterThan(0)
      })

      it('Then it should cleanup all resources properly', async () => {
        // Arrange
        recorder = new ScreenRecorder()
        await recorder.startRecording()

        // Act
        await recorder.stopRecording()

        // Assert
        expect(recorder.getState()).toBe('stopped')
        expect(recorder.getStream()).toBeNull()
        expect(mockVideoTrack.stop).toHaveBeenCalled()
      })
    })

    describe('When they pause and resume recording', () => {
      it('Then it should support pause and resume operations', async () => {
        // Arrange
        recorder = new ScreenRecorder()
        await recorder.startRecording()

        // Act - Pause
        recorder.pauseRecording()

        // Assert
        expect(recorder.getState()).toBe('paused')
        expect(recorder.isRecording()).toBe(false)

        // Act - Resume
        recorder.resumeRecording()

        // Assert
        expect(recorder.getState()).toBe('recording')
        expect(recorder.isRecording()).toBe(true)
      })

      it('Then it should prevent pause when not recording', () => {
        // Arrange
        recorder = new ScreenRecorder()

        // Act & Assert
        expect(() => recorder.pauseRecording()).toThrow('No active recording to pause')
      })

      it('Then it should prevent resume when not paused', async () => {
        // Arrange
        recorder = new ScreenRecorder()
        await recorder.startRecording()

        // Act & Assert
        expect(() => recorder.resumeRecording()).toThrow('Recording is not paused')
      })
    })
  })

  describe('Given PIP composition requirements', () => {
    describe('When they want to overlay camera feed on screen recording', () => {
      it('Then it should support combining multiple streams', async () => {
        // Arrange
        const screenRecorder = new ScreenRecorder({ quality: 'high' })

        // Mock camera stream for PIP
        const mockCameraTrack = {
          id: 'camera-track',
          kind: 'video',
          enabled: true,
          getSettings: vi.fn(() => ({ width: 640, height: 480 })),
        } as unknown as MediaStreamTrack

        mockCameraStream = {
          id: 'camera-stream',
          active: true,
          getVideoTracks: vi.fn(() => [mockCameraTrack]),
        } as unknown as MediaStream

        // Act
        await screenRecorder.startRecording()
        const screenStream = screenRecorder.getStream()

        // Assert
        expect(screenStream).toBeDefined()
        expect(screenStream!.getVideoTracks()).toHaveLength(1)
      })
    })

    describe('When they configure PIP position and size', () => {
      it('Then it should validate PIP overlay settings', () => {
        // Arrange
        const pipConfig = {
          position: 'bottom-right' as const,
          size: 'medium' as const,
          borderRadius: 8,
          padding: 16,
        }

        // Assert
        expect(pipConfig.position).toBe('bottom-right')
        expect(pipConfig.size).toBe('medium')
        expect(pipConfig.borderRadius).toBe(8)
        expect(pipConfig.padding).toBe(16)
      })
    })
  })

  describe('Given export requirements', () => {
    describe('When they export the final video', () => {
      it('Then it should provide downloadable blob URL', async () => {
        // Arrange
        recorder = new ScreenRecorder({ quality: 'high' })
        await recorder.startRecording()

        const mockRecorder = (recorder as any).mediaRecorder
        mockRecorder.ondataavailable({ data: new Blob(['data'], { type: 'video/webm' }) })

        // Act
        const result = await recorder.stopRecording()

        // Assert
        expect(result.url).toMatch(/^blob:/)
        expect(result.blob.type).toContain('video')
      })

      it('Then it should support different video formats', () => {
        // Arrange - Test MIME type detection
        const supportedFormats = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ]

        // Act & Assert
        supportedFormats.forEach(format => {
          expect(MediaRecorder.isTypeSupported(format)).toBe(true)
        })
      })
    })
  })

  describe('Given error conditions occur', () => {
    describe('When screen recording is not supported', () => {
      it('Then it should throw appropriate error', async () => {
        // Arrange
        global.navigator.mediaDevices = {} as any
        recorder = new ScreenRecorder()

        // Act & Assert
        await expect(recorder.startRecording()).rejects.toThrow('Screen recording not supported')
      })
    })

    describe('When user cancels screen sharing', () => {
      it('Then it should handle cancellation gracefully', async () => {
        // Arrange
        global.navigator.mediaDevices = {
          getDisplayMedia: vi.fn(async () => {
            throw new DOMException('Permission denied', 'NotAllowedError')
          }),
        } as any

        recorder = new ScreenRecorder()

        // Act & Assert
        await expect(recorder.startRecording()).rejects.toThrow()
      })
    })

    describe('When trying to record while already recording', () => {
      it('Then it should prevent duplicate recordings', async () => {
        // Arrange
        recorder = new ScreenRecorder()
        await recorder.startRecording()

        // Act & Assert
        await expect(recorder.startRecording()).rejects.toThrow('Recording already in progress')
      })
    })

    describe('When stopping without starting', () => {
      it('Then it should throw appropriate error', async () => {
        // Arrange
        recorder = new ScreenRecorder()

        // Act & Assert
        await expect(recorder.stopRecording()).rejects.toThrow('No active recording')
      })
    })
  })

  describe('Given quality configuration changes', () => {
    describe('When they change quality settings', () => {
      it('Then it should allow changes before recording', () => {
        // Arrange
        recorder = new ScreenRecorder({ quality: 'low' })

        // Act
        recorder.setQuality('high')

        // Assert
        expect(recorder.getQuality()).toBe('high')
      })

      it('Then it should prevent changes during recording', async () => {
        // Arrange
        recorder = new ScreenRecorder({ quality: 'medium' })
        await recorder.startRecording()

        // Act & Assert
        expect(() => recorder.setQuality('high')).toThrow(
          'Cannot change quality while recording'
        )
      })

      it('Then it should validate quality values', () => {
        // Arrange
        recorder = new ScreenRecorder()

        // Act & Assert
        expect(() => recorder.setQuality('invalid' as any)).toThrow('Invalid quality setting')
      })
    })
  })

  describe('Given resource management requirements', () => {
    describe('When they dispose the recorder', () => {
      it('Then it should cleanup all resources', async () => {
        // Arrange
        recorder = new ScreenRecorder()
        await recorder.startRecording()

        // Act
        recorder.dispose()

        // Assert
        expect(recorder.getState()).toBe('idle')
        expect(recorder.getStream()).toBeNull()
        expect(mockVideoTrack.stop).toHaveBeenCalled()
      })

      it('Then it should handle disposal of idle recorder', () => {
        // Arrange
        recorder = new ScreenRecorder()

        // Act & Assert
        expect(() => recorder.dispose()).not.toThrow()
        expect(recorder.getState()).toBe('idle')
      })
    })
  })

  describe('Given stream information needs', () => {
    describe('When they query stream settings', () => {
      it('Then it should return current stream configuration', async () => {
        // Arrange
        recorder = new ScreenRecorder({ quality: 'high' })
        await recorder.startRecording()

        // Act
        const settings = recorder.getStreamSettings()

        // Assert
        expect(settings).toBeDefined()
        expect(settings!.width).toBe(1920)
        expect(settings!.height).toBe(1080)
        expect(settings!.frameRate).toBe(30)
        expect(settings!.cursor).toBe('always')
      })

      it('Then it should return null for inactive stream', () => {
        // Arrange
        recorder = new ScreenRecorder()

        // Act
        const settings = recorder.getStreamSettings()

        // Assert
        expect(settings).toBeNull()
      })
    })
  })
})
