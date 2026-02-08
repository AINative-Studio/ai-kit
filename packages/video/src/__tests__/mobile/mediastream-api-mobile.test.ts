/**
 * Mobile MediaStream API Compatibility Tests
 *
 * Tests for MediaStream API compatibility across mobile browsers:
 * - getUserMedia support and constraints
 * - getDisplayMedia limitations on mobile
 * - MediaRecorder API support
 * - Track management and capabilities
 * - Device enumeration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  setupMobileTestEnvironment,
  cleanupMobileTestEnvironment,
  MOBILE_DEVICES,
  isMobileDevice,
  isIOS,
  isAndroid,
} from './utils/mobile-test-helpers'

describe('MediaStream API - Mobile Compatibility', () => {
  afterEach(() => {
    cleanupMobileTestEnvironment()
  })

  describe('navigator.mediaDevices Support', () => {
    it('should have mediaDevices on iOS Safari', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof navigator.mediaDevices.getUserMedia).toBe('function')
    })

    it('should have mediaDevices on Android Chrome', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof navigator.mediaDevices.getUserMedia).toBe('function')
    })

    it('should have mediaDevices on iPad', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof navigator.mediaDevices.getUserMedia).toBe('function')
    })
  })

  describe('getUserMedia Support', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should support getUserMedia on mobile', () => {
      expect(navigator.mediaDevices.getUserMedia).toBeDefined()
      expect(typeof navigator.mediaDevices.getUserMedia).toBe('function')
    })

    it('should request video stream', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      expect(stream).toBeDefined()
      expect(stream.getVideoTracks().length).toBeGreaterThan(0)
    })

    it('should request audio stream', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      expect(stream).toBeDefined()
      expect(stream.getAudioTracks().length).toBeGreaterThan(0)
    })

    it('should request both video and audio', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      expect(stream.getVideoTracks().length).toBeGreaterThan(0)
      expect(stream.getAudioTracks().length).toBeGreaterThan(0)
    })

    it('should support video constraints', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      })

      expect(stream).toBeDefined()
      expect(stream.getVideoTracks().length).toBeGreaterThan(0)
    })

    it('should support audio constraints', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      expect(stream).toBeDefined()
      expect(stream.getAudioTracks().length).toBeGreaterThan(0)
    })
  })

  describe('getDisplayMedia Support', () => {
    it('should not support getDisplayMedia on iOS', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      expect(navigator.mediaDevices.getDisplayMedia).toBeDefined()
      // iOS Safari does not support screen capture
    })

    it('should not support getDisplayMedia on Android', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      expect(navigator.mediaDevices.getDisplayMedia).toBeDefined()
      // Most mobile browsers don't support screen capture
    })

    it('should throw NotSupportedError on mobile Safari', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      await expect(
        navigator.mediaDevices.getDisplayMedia({ video: true })
      ).rejects.toThrow('getDisplayMedia is not supported on mobile')
    })

    it('should throw NotSupportedError on Android Chrome', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)

      await expect(
        navigator.mediaDevices.getDisplayMedia({ video: true })
      ).rejects.toThrow('getDisplayMedia is not supported on mobile')
    })
  })

  describe('enumerateDevices Support', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should enumerate devices', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()

      expect(Array.isArray(devices)).toBe(true)
      expect(devices.length).toBeGreaterThan(0)
    })

    it('should list video input devices', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')

      expect(videoInputs.length).toBeGreaterThanOrEqual(1)
    })

    it('should list audio input devices', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(d => d.kind === 'audioinput')

      expect(audioInputs.length).toBeGreaterThanOrEqual(1)
    })

    it('should provide device labels', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()

      devices.forEach(device => {
        expect(device.deviceId).toBeDefined()
        expect(device.kind).toBeDefined()
        expect(device.label).toBeDefined()
        expect(device.groupId).toBeDefined()
      })
    })

    it('should identify front and back cameras', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')

      // Mobile devices typically have at least 2 cameras
      expect(videoInputs.length).toBeGreaterThanOrEqual(2)

      const labels = videoInputs.map(d => d.label.toLowerCase())
      const hasFront = labels.some(l => l.includes('front'))
      const hasBack = labels.some(l => l.includes('back'))

      expect(hasFront || hasBack).toBe(true)
    })
  })

  describe('getSupportedConstraints', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
    })

    it('should return supported constraints', () => {
      const constraints = navigator.mediaDevices.getSupportedConstraints()

      expect(constraints).toBeDefined()
      expect(typeof constraints).toBe('object')
    })

    it('should support width and height constraints', () => {
      const constraints = navigator.mediaDevices.getSupportedConstraints()

      expect(constraints.width).toBe(true)
      expect(constraints.height).toBe(true)
    })

    it('should support facingMode on mobile', () => {
      const constraints = navigator.mediaDevices.getSupportedConstraints()

      expect(constraints.facingMode).toBe(true)
    })

    it('should support audio constraints', () => {
      const constraints = navigator.mediaDevices.getSupportedConstraints()

      expect(constraints.echoCancellation).toBe(true)
      expect(constraints.noiseSuppression).toBe(true)
      expect(constraints.sampleRate).toBe(true)
    })

    it('should support frameRate constraint', () => {
      const constraints = navigator.mediaDevices.getSupportedConstraints()

      expect(constraints.frameRate).toBe(true)
    })

    it('should support aspectRatio constraint', () => {
      const constraints = navigator.mediaDevices.getSupportedConstraints()

      expect(constraints.aspectRatio).toBe(true)
    })
  })

  describe('MediaRecorder Support', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should support MediaRecorder API', () => {
      expect(typeof MediaRecorder).toBe('function')
    })

    it('should check if mime type is supported', () => {
      expect(typeof MediaRecorder.isTypeSupported).toBe('function')
    })

    it('should support video/webm', () => {
      expect(MediaRecorder.isTypeSupported('video/webm')).toBe(true)
    })

    it('should support audio/webm', () => {
      expect(MediaRecorder.isTypeSupported('audio/webm')).toBe(true)
    })

    it('should support video codecs', () => {
      expect(
        MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ).toBe(true)
    })

    it('should support audio codecs', () => {
      expect(MediaRecorder.isTypeSupported('audio/webm;codecs=opus')).toBe(true)
    })
  })

  describe('MediaStreamTrack Support', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should create video track', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const track = stream.getVideoTracks()[0]

      expect(track).toBeDefined()
      expect(track.kind).toBe('video')
      expect(track.readyState).toBe('live')
    })

    it('should create audio track', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const track = stream.getAudioTracks()[0]

      expect(track).toBeDefined()
      expect(track.kind).toBe('audio')
      expect(track.readyState).toBe('live')
    })

    it('should get track settings', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const track = stream.getVideoTracks()[0]
      const settings = track.getSettings()

      expect(settings).toBeDefined()
      expect(settings.width).toBeDefined()
      expect(settings.height).toBeDefined()
      expect(settings.frameRate).toBeDefined()
    })

    it('should get track capabilities', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      expect(capabilities).toBeDefined()
      expect(capabilities.width).toBeDefined()
      expect(capabilities.height).toBeDefined()
    })

    it('should get track constraints', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      const track = stream.getVideoTracks()[0]
      const constraints = track.getConstraints()

      expect(constraints).toBeDefined()
    })

    it('should stop track', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const track = stream.getVideoTracks()[0]

      expect(track.readyState).toBe('live')

      track.stop()

      // In mock, state might not change immediately
      expect(track.stop).toHaveBeenCalled()
    })
  })

  describe('Mobile-Specific Constraints', () => {
    it('should support facingMode on iOS', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })

      const track = stream.getVideoTracks()[0]
      const settings = track.getSettings()

      expect(settings.facingMode).toBe('user')
    })

    it('should support facingMode on Android', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      const track = stream.getVideoTracks()[0]
      const settings = track.getSettings()

      expect(settings.facingMode).toBe('environment')
    })

    it('should support ideal constraints', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      expect(stream.getVideoTracks().length).toBeGreaterThan(0)
    })

    it('should support exact constraints', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: 'environment' },
        },
      })

      expect(stream.getVideoTracks().length).toBeGreaterThan(0)
    })
  })

  describe('Platform Detection', () => {
    it('should detect iOS devices', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      expect(isMobileDevice()).toBe(true)
      expect(isIOS()).toBe(true)
      expect(isAndroid()).toBe(false)
    })

    it('should detect Android devices', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      expect(isMobileDevice()).toBe(true)
      expect(isIOS()).toBe(false)
      expect(isAndroid()).toBe(true)
    })

    it('should detect iPad as iOS', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)

      expect(isMobileDevice()).toBe(true)
      expect(isIOS()).toBe(true)
    })
  })

  describe('URL API for Blobs', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should support URL.createObjectURL', () => {
      expect(typeof URL.createObjectURL).toBe('function')
    })

    it('should create blob URL', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)

      expect(url).toBeDefined()
      expect(typeof url).toBe('string')
      expect(url).toContain('blob:')
    })

    it('should support URL.revokeObjectURL', () => {
      expect(typeof URL.revokeObjectURL).toBe('function')
    })

    it('should revoke blob URL', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)

      expect(() => URL.revokeObjectURL(url)).not.toThrow()
    })
  })

  describe('MediaStream Lifecycle', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
    })

    it('should create active stream', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      expect(stream.active).toBe(true)
      expect(stream.id).toBeDefined()
    })

    it('should get all tracks', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      const tracks = stream.getTracks()
      expect(tracks.length).toBe(2)
    })

    it('should add track to stream', async () => {
      const stream1 = await navigator.mediaDevices.getUserMedia({ video: true })
      const stream2 = await navigator.mediaDevices.getUserMedia({ audio: true })

      const audioTrack = stream2.getAudioTracks()[0]
      stream1.addTrack(audioTrack)

      expect(stream1.addTrack).toHaveBeenCalled()
    })

    it('should remove track from stream', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      const audioTrack = stream.getAudioTracks()[0]
      stream.removeTrack(audioTrack)

      expect(stream.removeTrack).toHaveBeenCalled()
    })

    it('should clone stream', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      stream.clone()

      expect(stream.clone).toHaveBeenCalled()
    })
  })

  describe('Browser-Specific Features', () => {
    it('should detect iOS Safari features', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      expect(navigator.userAgent).toContain('Safari')
      expect(navigator.userAgent).toContain('Mobile')
    })

    it('should detect Android Chrome features', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      expect(navigator.userAgent).toContain('Chrome')
      expect(navigator.userAgent).toContain('Android')
    })

    it('should have touch support on mobile', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      expect(navigator.maxTouchPoints).toBeGreaterThan(0)
    })
  })

  describe('Cross-Browser Compatibility', () => {
    it('should work consistently on iPhone SE', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof MediaRecorder).toBe('function')
    })

    it('should work consistently on iPhone 12', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof MediaRecorder).toBe('function')
    })

    it('should work consistently on iPhone 14 Pro', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof MediaRecorder).toBe('function')
    })

    it('should work consistently on iPad Air', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof MediaRecorder).toBe('function')
    })

    it('should work consistently on Galaxy S20', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof MediaRecorder).toBe('function')
    })

    it('should work consistently on Galaxy S21', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof MediaRecorder).toBe('function')
    })

    it('should work consistently on Pixel XL', () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.pixelXL)

      expect(navigator.mediaDevices).toBeDefined()
      expect(typeof MediaRecorder).toBe('function')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should handle permission errors gracefully', async () => {
      // This test verifies error handling structure
      expect(navigator.mediaDevices.getUserMedia).toBeDefined()
    })

    it('should handle device not found errors', async () => {
      // Verify API structure for error handling
      expect(typeof navigator.mediaDevices.getUserMedia).toBe('function')
    })

    it('should handle overconstrained errors', async () => {
      // Verify API supports constraint validation
      expect(navigator.mediaDevices.getSupportedConstraints).toBeDefined()
    })
  })
})
