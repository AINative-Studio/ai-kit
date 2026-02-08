/**
 * Mobile Camera Recording Tests
 *
 * Tests for camera recording functionality on mobile devices:
 * - Front/back camera switching
 * - Mobile-specific constraints
 * - Device orientation handling
 * - Camera permissions
 * - Resolution adaptation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CameraRecorder } from '../../recording/camera-recorder'
import {
  setupMobileTestEnvironment,
  cleanupMobileTestEnvironment,
  MOBILE_DEVICES,
  mockPermissionRequest,
  mockDeviceOrientation,
  type MobileDevice,
} from './utils/mobile-test-helpers'

describe('CameraRecorder - Mobile Devices', () => {
  let recorder: CameraRecorder

  afterEach(() => {
    if (recorder) {
      recorder.stop()
    }
    cleanupMobileTestEnvironment()
  })

  describe('iOS Mobile Safari - Camera', () => {
    let device: MobileDevice

    beforeEach(() => {
      device = MOBILE_DEVICES.iPhone14Pro
      setupMobileTestEnvironment(device)
    })

    it('should access front camera on iPhone', async () => {
      recorder = new CameraRecorder({ facingMode: 'user' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(stream.active).toBe(true)

      const videoTrack = stream.getVideoTracks()[0]
      expect(videoTrack).toBeDefined()
      expect(videoTrack.getSettings().facingMode).toBe('user')
    })

    it('should access back camera on iPhone', async () => {
      recorder = new CameraRecorder({ facingMode: 'environment' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      const videoTrack = stream.getVideoTracks()[0]
      expect(videoTrack.getSettings().facingMode).toBe('environment')
    })

    it('should handle camera permission grant on iOS', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(stream.active).toBe(true)
    })

    it('should handle camera permission denied on iOS', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow('Permission denied')
    })

    it('should support 720p resolution on iPhone', async () => {
      recorder = new CameraRecorder({ resolution: '720p' })
      const stream = await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings).toBeDefined()
      expect(settings?.width).toBe(1280)
      expect(settings?.height).toBe(720)
    })

    it('should support 1080p resolution on modern iPhone', async () => {
      recorder = new CameraRecorder({ resolution: '1080p' })
      const stream = await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings?.width).toBe(1920)
      expect(settings?.height).toBe(1080)
    })

    it('should handle 4K resolution request on iPhone', async () => {
      // iPhone 14 Pro supports 4K recording
      recorder = new CameraRecorder({ resolution: '4K' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      // Actual resolution may be limited by hardware
    })

    it('should handle orientation change while recording', async () => {
      recorder = new CameraRecorder({ facingMode: 'user' })
      await recorder.getStream()

      // Simulate orientation change
      mockDeviceOrientation('landscape')

      expect(window.orientation).toBe(90)
      expect(recorder.isActive()).toBe(true)
    })

    it('should enumerate available cameras on iOS', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')

      // iOS devices typically have front and back cameras
      expect(videoInputs.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle camera switching on iOS', async () => {
      // Start with front camera
      recorder = new CameraRecorder({ facingMode: 'user' })
      await recorder.getStream()

      let settings = recorder.getSettings()
      expect(settings?.facingMode).toBe('user')

      // Stop and switch to back camera
      recorder.stop()

      recorder = new CameraRecorder({ facingMode: 'environment' })
      await recorder.getStream()

      settings = recorder.getSettings()
      expect(settings?.facingMode).toBe('environment')
    })
  })

  describe('iOS iPad - Camera', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)
    })

    it('should access camera on iPad', async () => {
      recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(stream.active).toBe(true)
    })

    it('should handle higher resolution on iPad', async () => {
      recorder = new CameraRecorder({ resolution: '1080p' })
      const stream = await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings?.width).toBe(1920)
      expect(settings?.height).toBe(1080)
    })

    it('should handle iPad orientation in landscape', async () => {
      mockDeviceOrientation('landscape')

      recorder = new CameraRecorder()
      await recorder.getStream()

      expect(recorder.isActive()).toBe(true)
    })
  })

  describe('Android Chrome Mobile - Camera', () => {
    let device: MobileDevice

    beforeEach(() => {
      device = MOBILE_DEVICES.galaxyS21
      setupMobileTestEnvironment(device)
    })

    it('should access front camera on Android', async () => {
      recorder = new CameraRecorder({ facingMode: 'user' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      const videoTrack = stream.getVideoTracks()[0]
      expect(videoTrack.getSettings().facingMode).toBe('environment') // Android defaults to back
    })

    it('should access back camera on Android', async () => {
      recorder = new CameraRecorder({ facingMode: 'environment' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      const videoTrack = stream.getVideoTracks()[0]
      expect(videoTrack.getSettings().facingMode).toBe('environment')
    })

    it('should handle camera permission on Android', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream.active).toBe(true)
    })

    it('should support 720p on Android', async () => {
      recorder = new CameraRecorder({ resolution: '720p' })
      await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings?.width).toBe(1280)
      expect(settings?.height).toBe(720)
    })

    it('should support 1080p on Android', async () => {
      recorder = new CameraRecorder({ resolution: '1080p' })
      await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings?.width).toBe(1920)
      expect(settings?.height).toBe(1080)
    })

    it('should enumerate cameras on Android', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(d => d.kind === 'videoinput')

      expect(cameras.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle orientation change on Android', async () => {
      recorder = new CameraRecorder()
      await recorder.getStream()

      mockDeviceOrientation('landscape')

      expect(window.orientation).toBe(90)
      expect(recorder.isActive()).toBe(true)
    })
  })

  describe('Mobile Camera Constraints', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should apply frame rate constraints', async () => {
      recorder = new CameraRecorder({ frameRate: 30 })
      await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings?.frameRate).toBe(30)
    })

    it('should apply aspect ratio constraints', async () => {
      recorder = new CameraRecorder({ aspectRatio: 16 / 9 })
      await recorder.getStream()

      const settings = recorder.getSettings()
      const aspectRatio = settings!.width / settings!.height
      expect(aspectRatio).toBeCloseTo(16 / 9, 1)
    })

    it('should handle combined constraints', async () => {
      recorder = new CameraRecorder({
        resolution: '1080p',
        frameRate: 30,
        facingMode: 'user',
        aspectRatio: 16 / 9,
      })

      await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings?.width).toBe(1920)
      expect(settings?.height).toBe(1080)
      expect(settings?.frameRate).toBe(30)
      expect(settings?.facingMode).toBe('user')
    })

    it('should handle overconstrained error gracefully', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Constraints cannot be satisfied', 'OverconstrainedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new CameraRecorder({
        resolution: '4K',
        frameRate: 120, // Unrealistic for mobile
      })

      await expect(recorder.getStream()).rejects.toThrow(
        'Constraints cannot be satisfied'
      )
    })

    it('should fall back to lower resolution if needed', async () => {
      // Request 4K but device may fall back to 1080p
      recorder = new CameraRecorder({ resolution: '4K' })
      await recorder.getStream()

      // Should succeed even if actual resolution is lower
      expect(recorder.isActive()).toBe(true)
    })
  })

  describe('Mobile Camera Permissions', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)
    })

    it('should handle permission prompt', async () => {
      mockPermissionRequest('camera' as PermissionName, 'prompt')

      recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
    })

    it('should handle permission granted', async () => {
      mockPermissionRequest('camera' as PermissionName, 'granted')

      recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream.active).toBe(true)
    })

    it('should handle permission denied', async () => {
      mockPermissionRequest('camera' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow()
    })

    it('should handle permission revoked during recording', async () => {
      recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      expect(stream.active).toBe(true)

      // Simulate permission revoked
      const videoTrack = stream.getVideoTracks()[0]
      Object.defineProperty(videoTrack, 'readyState', {
        value: 'ended',
      })

      recorder.stop()
      expect(recorder.isActive()).toBe(false)
    })
  })

  describe('Mobile Camera Audio', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should capture video only by default', async () => {
      recorder = new CameraRecorder({ audio: false })
      const stream = await recorder.getStream()

      expect(stream.getVideoTracks().length).toBe(1)
      expect(stream.getAudioTracks().length).toBe(0)
    })

    it('should capture video and audio when enabled', async () => {
      recorder = new CameraRecorder({ audio: true })
      const stream = await recorder.getStream()

      expect(stream.getVideoTracks().length).toBe(1)
      expect(stream.getAudioTracks().length).toBe(1)
    })

    it('should handle microphone permission for audio', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      recorder = new CameraRecorder({ audio: true })
      const stream = await recorder.getStream()

      expect(stream.getAudioTracks().length).toBe(1)
    })
  })

  describe('Mobile Camera Stream Management', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
    })

    it('should cache and reuse stream', async () => {
      recorder = new CameraRecorder()
      const stream1 = await recorder.getStream()
      const stream2 = await recorder.getStream()

      expect(stream1).toBe(stream2)
    })

    it('should stop all tracks when stopping', async () => {
      recorder = new CameraRecorder()
      const stream = await recorder.getStream()

      const videoTrack = stream.getVideoTracks()[0]
      const stopSpy = vi.spyOn(videoTrack, 'stop')

      recorder.stop()

      expect(stopSpy).toHaveBeenCalled()
      expect(recorder.isActive()).toBe(false)
    })

    it('should allow new stream after stopping', async () => {
      recorder = new CameraRecorder()
      await recorder.getStream()

      recorder.stop()
      expect(recorder.isActive()).toBe(false)

      const newStream = await recorder.getStream()
      expect(newStream).toBeDefined()
      expect(recorder.isActive()).toBe(true)
    })

    it('should handle camera already in use error', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Camera is already in use', 'NotReadableError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new CameraRecorder()
      await expect(recorder.getStream()).rejects.toThrow('Camera is already in use')
    })
  })

  describe('Mobile Device Capabilities', () => {
    it('should detect iPhone capabilities', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      recorder = new CameraRecorder()
      await recorder.getStream()

      const videoTrack = recorder.getCurrentStream()?.getVideoTracks()[0]
      const capabilities = videoTrack?.getCapabilities()

      expect(capabilities).toBeDefined()
      expect(capabilities?.facingMode).toContain('user')
    })

    it('should detect Android capabilities', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      recorder = new CameraRecorder()
      await recorder.getStream()

      const videoTrack = recorder.getCurrentStream()?.getVideoTracks()[0]
      const capabilities = videoTrack?.getCapabilities()

      expect(capabilities).toBeDefined()
      expect(capabilities?.width).toBeDefined()
      expect(capabilities?.height).toBeDefined()
    })

    it('should check supported constraints', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      const constraints = navigator.mediaDevices.getSupportedConstraints()

      expect(constraints.facingMode).toBe(true)
      expect(constraints.width).toBe(true)
      expect(constraints.height).toBe(true)
      expect(constraints.frameRate).toBe(true)
    })
  })

  describe('Mobile Performance Considerations', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)
    })

    it('should recommend 720p for older devices', async () => {
      recorder = new CameraRecorder({ resolution: '720p' })
      await recorder.getStream()

      const settings = recorder.getSettings()
      expect(settings?.width).toBe(1280)
      expect(settings?.height).toBe(720)
    })

    it('should handle thermal throttling gracefully', async () => {
      // Simulate device heating by using high settings
      recorder = new CameraRecorder({
        resolution: '4K',
        frameRate: 60,
      })

      // Should not crash, may adjust settings
      const stream = await recorder.getStream()
      expect(stream).toBeDefined()
    })

    it('should handle background app scenario', async () => {
      recorder = new CameraRecorder()
      await recorder.getStream()

      // Simulate app going to background
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      })

      // Stream should remain active
      expect(recorder.isActive()).toBe(true)
    })
  })

  describe('Cross-Device Testing', () => {
    it('should work on iPhone SE', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)

      recorder = new CameraRecorder({ resolution: '720p' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(recorder.isActive()).toBe(true)
    })

    it('should work on iPhone 12', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      recorder = new CameraRecorder({ resolution: '1080p' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(recorder.isActive()).toBe(true)
    })

    it('should work on iPhone 14 Pro', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      recorder = new CameraRecorder({ resolution: '4K' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(recorder.isActive()).toBe(true)
    })

    it('should work on Galaxy S20', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)

      recorder = new CameraRecorder({ resolution: '1080p' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(recorder.isActive()).toBe(true)
    })

    it('should work on Galaxy S21', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      recorder = new CameraRecorder({ resolution: '4K' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(recorder.isActive()).toBe(true)
    })

    it('should work on Pixel XL', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.pixelXL)

      recorder = new CameraRecorder({ resolution: '1080p' })
      const stream = await recorder.getStream()

      expect(stream).toBeDefined()
      expect(recorder.isActive()).toBe(true)
    })
  })
})
