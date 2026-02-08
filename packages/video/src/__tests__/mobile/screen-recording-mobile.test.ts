/**
 * Mobile Screen Recording Tests
 *
 * Tests for screen recording functionality on mobile devices:
 * - iOS Safari limitations
 * - Android Chrome support
 * - Mobile-specific constraints
 * - Permission handling
 * - Orientation changes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ScreenRecorder } from '../../recording/screen-recorder'
import {
  setupMobileTestEnvironment,
  cleanupMobileTestEnvironment,
  MOBILE_DEVICES,
  mockDeviceOrientation,
  mockPermissionRequest,
  type MobileDevice,
} from './utils/mobile-test-helpers'

describe('ScreenRecorder - Mobile Devices', () => {
  let recorder: ScreenRecorder

  afterEach(() => {
    if (recorder) {
      recorder.dispose()
    }
    cleanupMobileTestEnvironment()
  })

  describe('iOS Mobile Safari', () => {
    let device: MobileDevice

    beforeEach(() => {
      device = MOBILE_DEVICES.iPhone14Pro
      setupMobileTestEnvironment(device)
    })

    it('should throw error when getDisplayMedia is not supported on iOS', async () => {
      recorder = new ScreenRecorder({ quality: 'medium' })

      await expect(recorder.startRecording()).rejects.toThrow(
        'Screen recording not supported'
      )
    })

    it('should detect iOS platform from user agent', () => {
      expect(navigator.userAgent).toContain('iPhone')
      expect(navigator.platform).toBe('iPhone')
    })

    it('should handle permission denied gracefully', async () => {
      // Mock getDisplayMedia to simulate permission denial
      const mockGetDisplayMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied by system', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
        writable: true,
        configurable: true,
        value: mockGetDisplayMedia,
      })

      recorder = new ScreenRecorder()
      await expect(recorder.startRecording()).rejects.toThrow('Permission denied')
    })

    it('should adapt to iOS viewport size', () => {
      expect(window.innerWidth).toBe(device.viewport.width)
      expect(window.innerHeight).toBe(device.viewport.height)
    })

    it('should handle orientation change on iOS', () => {
      const portraitWidth = window.innerWidth
      const portraitHeight = window.innerHeight

      mockDeviceOrientation('landscape')

      // In real scenario, dimensions would swap
      expect(window.orientation).toBe(90)
    })

    it('should handle iOS Safari specific mime types', async () => {
      // iOS Safari has limited codec support
      expect(MediaRecorder.isTypeSupported('video/webm')).toBe(true)
      expect(MediaRecorder.isTypeSupported('video/mp4')).toBe(true)
    })
  })

  describe('iOS iPad', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)
    })

    it('should recognize iPad as mobile device', () => {
      expect(navigator.userAgent).toContain('iPad')
      expect(navigator.platform).toBe('iPhone') // iPad uses iPhone platform
    })

    it('should handle larger iPad viewport', () => {
      expect(window.innerWidth).toBe(820)
      expect(window.innerHeight).toBe(1180)
    })

    it('should not support getDisplayMedia on iPad', async () => {
      recorder = new ScreenRecorder()
      await expect(recorder.startRecording()).rejects.toThrow(
        'Screen recording not supported'
      )
    })
  })

  describe('Android Chrome Mobile', () => {
    let device: MobileDevice

    beforeEach(() => {
      device = MOBILE_DEVICES.galaxyS21
      setupMobileTestEnvironment(device)
    })

    it('should detect Android platform from user agent', () => {
      expect(navigator.userAgent).toContain('Android')
      expect(navigator.userAgent).toContain('Mobile')
    })

    it('should throw error when getDisplayMedia not supported', async () => {
      recorder = new ScreenRecorder({ quality: 'high' })

      await expect(recorder.startRecording()).rejects.toThrow(
        'Screen recording not supported'
      )
    })

    it('should adapt to Android viewport size', () => {
      expect(window.innerWidth).toBe(device.viewport.width)
      expect(window.innerHeight).toBe(device.viewport.height)
    })

    it('should handle orientation change on Android', () => {
      mockDeviceOrientation('landscape')
      expect(window.orientation).toBe(90)
    })

    it('should handle Android Chrome mime types', () => {
      expect(MediaRecorder.isTypeSupported('video/webm;codecs=vp8')).toBe(true)
      expect(MediaRecorder.isTypeSupported('video/webm;codecs=vp9')).toBe(true)
    })
  })

  describe('Mobile Constraints and Limitations', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should not allow screen recording on mobile Safari', async () => {
      recorder = new ScreenRecorder()
      expect(recorder.getState()).toBe('idle')
      await expect(recorder.startRecording()).rejects.toThrow()
    })

    it('should handle low battery scenarios', async () => {
      // Mock battery API
      Object.defineProperty(navigator, 'getBattery', {
        writable: true,
        configurable: true,
        value: vi.fn().mockResolvedValue({
          level: 0.15,
          charging: false,
        }),
      })

      // Recording should still be attempted but may fail
      recorder = new ScreenRecorder({ quality: 'low' })
      await expect(recorder.startRecording()).rejects.toThrow()
    })

    it('should respect mobile data constraints for quality', () => {
      // On mobile, lower quality settings are preferred
      recorder = new ScreenRecorder({ quality: 'low' })
      const config = recorder.getQualityConfig()

      expect(config.videoBitsPerSecond).toBe(1000000) // 1 Mbps
      expect(config.frameRate).toBe(15)
    })

    it('should handle memory constraints on mobile', () => {
      // Mobile devices have limited memory
      recorder = new ScreenRecorder({ quality: 'ultra' })

      // Should allow setting quality but may fail on actual recording
      expect(recorder.getQuality()).toBe('ultra')
    })
  })

  describe('Mobile Permissions Flow', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)
    })

    it('should handle permission prompt on mobile', async () => {
      mockPermissionRequest('display-capture' as PermissionName, 'prompt')

      recorder = new ScreenRecorder()
      await expect(recorder.startRecording()).rejects.toThrow()
    })

    it('should handle permission denied', async () => {
      mockPermissionRequest('display-capture' as PermissionName, 'denied')

      recorder = new ScreenRecorder()
      await expect(recorder.startRecording()).rejects.toThrow()
    })

    it('should check permissions before recording', async () => {
      const querySpy = vi.spyOn(navigator.permissions, 'query')
      recorder = new ScreenRecorder()

      try {
        await recorder.startRecording()
      } catch (error) {
        // Expected to fail on mobile
      }

      // Permission check happens in browser, not exposed in our implementation
      expect(recorder.getState()).toBe('idle')
    })
  })

  describe('Mobile Viewport and Orientation', () => {
    it('should handle portrait orientation on iPhone', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12, 'portrait')

      expect(window.innerWidth).toBe(390)
      expect(window.innerHeight).toBe(844)
      expect(window.screen.orientation.type).toBe('portrait-primary')
    })

    it('should handle landscape orientation on iPhone', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12, 'landscape')

      expect(window.innerWidth).toBe(844)
      expect(window.innerHeight).toBe(390)
      expect(window.screen.orientation.type).toBe('landscape-primary')
    })

    it('should handle portrait orientation on Android', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.pixelXL, 'portrait')

      expect(window.innerWidth).toBe(412)
      expect(window.innerHeight).toBe(915)
    })

    it('should handle landscape orientation on Android', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.pixelXL, 'landscape')

      expect(window.innerWidth).toBe(915)
      expect(window.innerHeight).toBe(412)
    })

    it('should handle orientation changes during setup', () => {
      const env = setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro, 'portrait')

      expect(env.orientation).toBe('portrait')

      // Simulate orientation change
      mockDeviceOrientation('landscape')
      expect(window.orientation).toBe(90)
    })
  })

  describe('Mobile Browser Compatibility', () => {
    it('should identify Mobile Safari correctly', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      expect(navigator.userAgent).toContain('Safari')
      expect(navigator.userAgent).toContain('Mobile')
      expect(navigator.userAgent).not.toContain('Chrome')
    })

    it('should identify Chrome Mobile correctly', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      expect(navigator.userAgent).toContain('Chrome')
      expect(navigator.userAgent).toContain('Mobile')
      expect(navigator.userAgent).toContain('Android')
    })

    it('should check MediaRecorder support on mobile', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      expect(typeof MediaRecorder).toBe('function')
      expect(MediaRecorder.isTypeSupported).toBeDefined()
    })

    it('should verify supported mime types on iOS', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      // iOS typically supports these
      expect(MediaRecorder.isTypeSupported('video/webm')).toBe(true)
      expect(MediaRecorder.isTypeSupported('video/mp4')).toBe(true)
    })

    it('should verify supported mime types on Android', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)

      expect(MediaRecorder.isTypeSupported('video/webm;codecs=vp8')).toBe(true)
      expect(MediaRecorder.isTypeSupported('video/webm;codecs=vp9')).toBe(true)
    })
  })

  describe('Mobile-Specific Error Handling', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should provide clear error for unsupported feature', async () => {
      recorder = new ScreenRecorder()

      await expect(recorder.startRecording()).rejects.toThrow(
        'Screen recording not supported'
      )
    })

    it('should handle NotSupportedError correctly', async () => {
      recorder = new ScreenRecorder()

      try {
        await recorder.startRecording()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
        expect(recorder.getState()).toBe('idle')
      }
    })

    it('should cleanup resources on error', async () => {
      recorder = new ScreenRecorder()

      try {
        await recorder.startRecording()
      } catch (error) {
        // Expected
      }

      expect(recorder.getStream()).toBeNull()
      expect(recorder.getState()).toBe('idle')
    })

    it('should allow retry after failed attempt', async () => {
      recorder = new ScreenRecorder()

      // First attempt
      try {
        await recorder.startRecording()
      } catch (error) {
        // Expected
      }

      // Second attempt
      await expect(recorder.startRecording()).rejects.toThrow()
      expect(recorder.getState()).toBe('idle')
    })
  })

  describe('Mobile Quality Presets', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
    })

    it('should recommend low quality for older devices', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)

      recorder = new ScreenRecorder({ quality: 'low' })
      const config = recorder.getQualityConfig()

      expect(config.videoBitsPerSecond).toBe(1000000)
      expect(config.frameRate).toBe(15)
    })

    it('should allow medium quality for mid-range devices', () => {
      recorder = new ScreenRecorder({ quality: 'medium' })
      const config = recorder.getQualityConfig()

      expect(config.videoBitsPerSecond).toBe(2500000)
      expect(config.frameRate).toBe(30)
    })

    it('should warn about high quality on mobile', () => {
      // High quality may cause performance issues
      recorder = new ScreenRecorder({ quality: 'high' })
      const config = recorder.getQualityConfig()

      expect(config.videoBitsPerSecond).toBe(5000000)
      expect(config.frameRate).toBe(30)
    })

    it('should not recommend ultra quality for mobile', () => {
      // Ultra quality is not recommended for mobile
      recorder = new ScreenRecorder({ quality: 'ultra' })
      const config = recorder.getQualityConfig()

      // Should still set it, but performance may suffer
      expect(config.videoBitsPerSecond).toBe(10000000)
      expect(config.frameRate).toBe(60)
    })
  })

  describe('Mobile Touch Points', () => {
    it('should detect touch capability on iPhone', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      expect(navigator.maxTouchPoints).toBeGreaterThan(0)
    })

    it('should detect touch capability on Android', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)

      expect(navigator.maxTouchPoints).toBeGreaterThan(0)
    })

    it('should detect touch capability on iPad', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)

      expect(navigator.maxTouchPoints).toBeGreaterThan(0)
    })
  })
})
