import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CameraRecorder } from '../camera-recorder'

describe('CameraRecorder', () => {
  let mockMediaStream: MediaStream
  let getUserMediaSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Create mock MediaStream
    mockMediaStream = {
      id: 'test-stream-id',
      active: true,
      getTracks: vi.fn(() => [
        {
          kind: 'video',
          id: 'video-track-id',
          enabled: true,
          readyState: 'live',
          stop: vi.fn(),
          getSettings: vi.fn(() => ({
            width: 1280,
            height: 720,
            frameRate: 30,
          })),
        },
      ]),
      getVideoTracks: vi.fn(() => [
        {
          kind: 'video',
          id: 'video-track-id',
          enabled: true,
          readyState: 'live',
          stop: vi.fn(),
          getSettings: vi.fn(() => ({
            width: 1280,
            height: 720,
            frameRate: 30,
          })),
        },
      ]),
      getAudioTracks: vi.fn(() => []),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
    } as unknown as MediaStream

    // Mock navigator.mediaDevices.getUserMedia
    getUserMediaSpy = vi.fn().mockResolvedValue(mockMediaStream)
    global.navigator = {
      mediaDevices: {
        getUserMedia: getUserMediaSpy,
      },
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Camera Access', () => {
    it('should request camera access with default constraints', async () => {
      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.any(Object),
          audio: false,
        })
      )
      expect(stream).toBeDefined()
      expect(stream.id).toBe('test-stream-id')
    })

    it('should request camera access with audio enabled', async () => {
      const recorder = new CameraRecorder({ audio: true })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.any(Object),
          audio: true,
        })
      )
    })

    it('should handle camera access denied', async () => {
      const error = new Error('Permission denied')
      error.name = 'NotAllowedError'
      getUserMediaSpy.mockRejectedValueOnce(error)

      const recorder = new CameraRecorder()

      await expect(recorder.getStream()).rejects.toThrow('Permission denied')
    })

    it('should handle no camera available', async () => {
      const error = new Error('No camera found')
      error.name = 'NotFoundError'
      getUserMediaSpy.mockRejectedValueOnce(error)

      const recorder = new CameraRecorder()

      await expect(recorder.getStream()).rejects.toThrow('No camera found')
    })
  })

  describe('Resolution Support', () => {
    it('should support 720p resolution (HD)', async () => {
      const recorder = new CameraRecorder({ resolution: '720p' })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }),
        })
      )
    })

    it('should support 1080p resolution (Full HD)', async () => {
      const recorder = new CameraRecorder({ resolution: '1080p' })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }),
        })
      )
    })

    it('should support 4K resolution (Ultra HD)', async () => {
      const recorder = new CameraRecorder({ resolution: '4K' })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: { ideal: 3840 },
            height: { ideal: 2160 },
          }),
        })
      )
    })

    it('should default to 720p when no resolution specified', async () => {
      const recorder = new CameraRecorder()
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }),
        })
      )
    })
  })

  describe('Camera Constraints', () => {
    it('should apply frame rate constraints', async () => {
      const recorder = new CameraRecorder({
        frameRate: 60,
      })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            frameRate: { ideal: 60 },
          }),
        })
      )
    })

    it('should apply aspect ratio constraints', async () => {
      const recorder = new CameraRecorder({
        aspectRatio: 16 / 9,
      })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            aspectRatio: { ideal: 16 / 9 },
          }),
        })
      )
    })

    it('should apply facing mode constraint (user camera)', async () => {
      const recorder = new CameraRecorder({
        facingMode: 'user',
      })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: { ideal: 'user' },
          }),
        })
      )
    })

    it('should apply facing mode constraint (environment camera)', async () => {
      const recorder = new CameraRecorder({
        facingMode: 'environment',
      })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: { ideal: 'environment' },
          }),
        })
      )
    })

    it('should combine multiple constraints', async () => {
      const recorder = new CameraRecorder({
        resolution: '1080p',
        frameRate: 60,
        aspectRatio: 16 / 9,
        facingMode: 'user',
      })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 60 },
            aspectRatio: { ideal: 16 / 9 },
            facingMode: { ideal: 'user' },
          }),
        })
      )
    })

    it('should allow custom video constraints', async () => {
      const customConstraints = {
        width: { min: 640, ideal: 1920, max: 3840 },
        height: { min: 480, ideal: 1080, max: 2160 },
      }

      const recorder = new CameraRecorder({
        videoConstraints: customConstraints,
      })
      await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining(customConstraints),
        })
      )
    })
  })

  describe('Stream Management', () => {
    it('should return the active MediaStream', async () => {
      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream).toBe(mockMediaStream)
      expect(stream.active).toBe(true)
    })

    it('should cache the stream and return same instance on subsequent calls', async () => {
      const recorder = new CameraRecorder()
      const stream1 = await recorder.getStream()
      const stream2 = await recorder.getStream()

      expect(stream1).toBe(stream2)
      expect(getUserMediaSpy).toHaveBeenCalledTimes(1)
    })

    it('should stop all tracks when stopping the stream', async () => {
      const stopSpy = vi.fn()
      const mockTrack = {
        kind: 'video',
        id: 'video-track-id',
        enabled: true,
        readyState: 'live',
        stop: stopSpy,
        getSettings: vi.fn(() => ({
          width: 1280,
          height: 720,
          frameRate: 30,
        })),
      }

      mockMediaStream.getTracks = vi.fn(() => [mockTrack])
      mockMediaStream.getVideoTracks = vi.fn(() => [mockTrack])

      const recorder = new CameraRecorder()
      await recorder.getStream()

      recorder.stop()

      expect(stopSpy).toHaveBeenCalled()
    })

    it('should handle stop when no stream is active', () => {
      const recorder = new CameraRecorder()

      expect(() => recorder.stop()).not.toThrow()
    })

    it('should allow getting new stream after stopping', async () => {
      const recorder = new CameraRecorder()
      const stream1 = await recorder.getStream()

      recorder.stop()

      const stream2 = await recorder.getStream()

      expect(getUserMediaSpy).toHaveBeenCalledTimes(2)
      expect(stream2).toBeDefined()
    })
  })

  describe('Stream Information', () => {
    it('should get current stream settings', async () => {
      const recorder = new CameraRecorder()
      await recorder.getStream()

      const settings = recorder.getSettings()

      expect(settings).toEqual({
        width: 1280,
        height: 720,
        frameRate: 30,
      })
    })

    it('should return null settings when no stream is active', () => {
      const recorder = new CameraRecorder()

      const settings = recorder.getSettings()

      expect(settings).toBeNull()
    })

    it('should check if stream is active', async () => {
      const recorder = new CameraRecorder()

      expect(recorder.isActive()).toBe(false)

      await recorder.getStream()

      expect(recorder.isActive()).toBe(true)

      recorder.stop()

      expect(recorder.isActive()).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle OverconstrainedError', async () => {
      const error = new Error('Constraints cannot be satisfied')
      error.name = 'OverconstrainedError'
      getUserMediaSpy.mockRejectedValueOnce(error)

      const recorder = new CameraRecorder({ resolution: '4K' })

      await expect(recorder.getStream()).rejects.toThrow(
        'Constraints cannot be satisfied'
      )
    })

    it('should handle NotReadableError', async () => {
      const error = new Error('Camera is already in use')
      error.name = 'NotReadableError'
      getUserMediaSpy.mockRejectedValueOnce(error)

      const recorder = new CameraRecorder()

      await expect(recorder.getStream()).rejects.toThrow(
        'Camera is already in use'
      )
    })

    it('should handle AbortError', async () => {
      const error = new Error('Request was aborted')
      error.name = 'AbortError'
      getUserMediaSpy.mockRejectedValueOnce(error)

      const recorder = new CameraRecorder()

      await expect(recorder.getStream()).rejects.toThrow('Request was aborted')
    })
  })
})
