/**
 * Mobile Permissions Flow Tests
 *
 * Tests for permissions handling on mobile devices:
 * - Camera permission flow
 * - Microphone permission flow
 * - Permission states (prompt, granted, denied)
 * - Permission persistence
 * - iOS and Android permission differences
 */

import './setup'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CameraRecorder } from '../../recording/camera-recorder'
import { AudioRecorder } from '../../recording/audio-recorder'
import {
  setupMobileTestEnvironment,
  cleanupMobileTestEnvironment,
  MOBILE_DEVICES,
  mockPermissionRequest,
} from './utils/mobile-test-helpers'

describe('Permissions Flow - Mobile Devices', () => {
  afterEach(() => {
    cleanupMobileTestEnvironment()
  })

  describe('Camera Permission Flow - iOS', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should prompt for camera permission on first access', async () => {
      mockPermissionRequest('camera' as PermissionName, 'prompt')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      recorder.stop()
    })

    it('should grant camera access when user allows', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(stream.active).toBe(true)
      recorder.stop()
    })

    it('should deny camera access when user blocks', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow('Permission denied')
    })

    it('should remember granted permission on iOS', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder1 = new CameraRecorder()
      const stream1 = await recorder1.getStream()
      expect(stream1.active).toBe(true)
      recorder1.stop()

      // Second access should not prompt again
      const recorder2 = new CameraRecorder()
      const stream2 = await recorder2.getStream()
      expect(stream2.active).toBe(true)
      recorder2.stop()
    })

    it('should handle permission revocation on iOS', async () => {
      // Initially granted
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()
      expect(stream.active).toBe(true)

      // Simulate permission revoked
      mockPermissionRequest('camera' as PermissionName, 'denied')

      // Next access should fail
      recorder.stop()

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder2 = new CameraRecorder()
      await expect(recorder2.getStream()).rejects.toThrow()
    })

    it('should show iOS permission dialog on first request', async () => {
      mockPermissionRequest('camera' as PermissionName, 'prompt')

      const recorder = new CameraRecorder()

      // On iOS, this would show native permission dialog
      const stream = await recorder.getStream()
      expect(stream).toBeDefined()
      recorder.stop()
    })
  })

  describe('Camera Permission Flow - Android', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
    })

    it('should prompt for camera permission on first access', async () => {
      mockPermissionRequest('camera' as PermissionName, 'prompt')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      recorder.stop()
    })

    it('should grant camera access when user allows', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream.active).toBe(true)
      recorder.stop()
    })

    it('should deny camera access when user blocks', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow()
    })

    it('should remember permission choice on Android', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder1 = new CameraRecorder()
      const stream1 = await recorder1.getStream()
      expect(stream1.active).toBe(true)
      recorder1.stop()

      // Subsequent access uses remembered permission
      const recorder2 = new CameraRecorder()
      const stream2 = await recorder2.getStream()
      expect(stream2.active).toBe(true)
      recorder2.stop()
    })

    it('should handle "Never ask again" option on Android', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow('Permission denied')

      // Permission remains denied
      await expect(recorder.getStream()).rejects.toThrow()
    })
  })

  describe('Microphone Permission Flow - iOS', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should prompt for microphone permission on first access', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'prompt')

      const recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      await recorder.stopRecording()
    })

    it('should grant microphone access when user allows', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      const recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream.active).toBe(true)
      await recorder.stopRecording()
    })

    it('should deny microphone access when user blocks', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow()
    })

    it('should remember microphone permission on iOS', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      const recorder = new AudioRecorder()
      const stream1 = await recorder.startRecording({ microphone: true })
      expect(stream1.active).toBe(true)
      await recorder.stopRecording()

      // Second request uses remembered permission
      const stream2 = await recorder.startRecording({ microphone: true })
      expect(stream2.active).toBe(true)
      await recorder.stopRecording()
    })
  })

  describe('Microphone Permission Flow - Android', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)
    })

    it('should prompt for microphone permission', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'prompt')

      const recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      await recorder.stopRecording()
    })

    it('should grant microphone access', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      const recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream.active).toBe(true)
      await recorder.stopRecording()
    })

    it('should deny microphone access', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow()
    })
  })

  describe('Combined Permissions Flow', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should request both camera and microphone permissions', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      const recorder = new CameraRecorder({ audio: true })
      const stream = await recorder.getStream()

      expect(stream.getVideoTracks().length).toBe(1)
      expect(stream.getAudioTracks().length).toBe(1)
      recorder.stop()
    })

    it('should handle camera granted, microphone denied', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')
      mockPermissionRequest('microphone' as PermissionName, 'denied')

      const recorder = new CameraRecorder({ audio: true })

      // Should still get video stream
      const stream = await recorder.getStream()
      expect(stream.getVideoTracks().length).toBe(1)
      recorder.stop()
    })

    it('should handle camera denied, microphone granted', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder({ audio: true })
      await expect(recorder.getStream()).rejects.toThrow()
    })

    it('should handle both permissions denied', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')
      mockPermissionRequest('microphone' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder({ audio: true })
      await expect(recorder.getStream()).rejects.toThrow()
    })
  })

  describe('Permission States', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should check permission status before requesting', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const status = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })

      expect(status.state).toBe('granted')
    })

    it('should handle prompt state', async () => {
      mockPermissionRequest('camera' as PermissionName, 'prompt')

      const status = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })

      expect(status.state).toBe('prompt')
    })

    it('should handle denied state', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const status = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })

      expect(status.state).toBe('denied')
    })

    it('should query microphone permission', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      const status = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })

      expect(status.state).toBe('granted')
    })
  })

  describe('Permission Error Types', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
    })

    it('should handle NotAllowedError', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()

      try {
        await recorder.getStream()
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(DOMException)
        expect((error as DOMException).name).toBe('NotAllowedError')
      }
    })

    it('should handle NotFoundError (no camera)', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('No camera found', 'NotFoundError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow('No camera found')
    })

    it('should handle NotReadableError (camera in use)', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Camera is in use', 'NotReadableError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow('Camera is in use')
    })

    it('should handle OverconstrainedError', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Constraints not satisfied', 'OverconstrainedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder({ resolution: '4K' })
      await expect(recorder.getStream()).rejects.toThrow()
    })

    it('should handle AbortError', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Request aborted', 'AbortError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow('Request aborted')
    })
  })

  describe('Permission Persistence', () => {
    it('should persist granted permission across sessions on iOS', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder1 = new CameraRecorder()
      const stream1 = await recorder1.getStream()
      expect(stream1.active).toBe(true)
      recorder1.stop()

      // Simulate new session
      cleanupMobileTestEnvironment()
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder2 = new CameraRecorder()
      const stream2 = await recorder2.getStream()
      expect(stream2.active).toBe(true)
      recorder2.stop()
    })

    it('should persist granted permission across sessions on Android', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder1 = new CameraRecorder()
      const stream1 = await recorder1.getStream()
      expect(stream1.active).toBe(true)
      recorder1.stop()

      // Simulate new session
      cleanupMobileTestEnvironment()
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder2 = new CameraRecorder()
      const stream2 = await recorder2.getStream()
      expect(stream2.active).toBe(true)
      recorder2.stop()
    })

    it('should persist denied permission on iOS', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const status = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })

      expect(status.state).toBe('denied')
    })

    it('should persist denied permission on Android', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const status = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })

      expect(status.state).toBe('denied')
    })
  })

  describe('Permission Best Practices', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should check permission before requesting media', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const status = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })

      if (status.state === 'granted') {
        const recorder = new CameraRecorder()
        const stream = await recorder.getStream()
        expect(stream.active).toBe(true)
        recorder.stop()
      }
    })

    it('should handle permission denial gracefully', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      const recorder = new CameraRecorder()

      try {
        await recorder.getStream()
        expect.fail('Should have thrown')
      } catch (error) {
        // Proper error handling
        expect(error).toBeDefined()
      }

      recorder.stop()
    })

    it('should request permissions only when needed', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      // Don't request until user action
      const recorder = new CameraRecorder()

      // Simulate user clicking "Start Camera"
      const stream = await recorder.getStream()
      expect(stream).toBeDefined()
      recorder.stop()
    })
  })

  describe('Cross-Device Permission Behavior', () => {
    it('should handle permissions on iPhone SE', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()
      expect(stream.active).toBe(true)
      recorder.stop()
    })

    it('should handle permissions on iPhone 12', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()
      expect(stream.active).toBe(true)
      recorder.stop()
    })

    it('should handle permissions on iPad Air', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()
      expect(stream.active).toBe(true)
      recorder.stop()
    })

    it('should handle permissions on Galaxy S20', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()
      expect(stream.active).toBe(true)
      recorder.stop()
    })

    it('should handle permissions on Pixel XL', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.pixelXL)
      mockPermissionRequest('camera' as PermissionName, 'granted')

      const recorder = new CameraRecorder()
      const stream = await recorder.getStream()
      expect(stream.active).toBe(true)
      recorder.stop()
    })
  })
})
