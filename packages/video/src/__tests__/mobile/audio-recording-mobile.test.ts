/**
 * Mobile Audio Recording Tests
 *
 * Tests for audio recording functionality on mobile devices:
 * - Microphone access on iOS and Android
 * - Mobile-specific audio constraints
 * - Permission handling
 * - Audio processing features
 * - Background recording limitations
 */

import './setup'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioRecorder } from '../../recording/audio-recorder'
import {
  setupMobileTestEnvironment,
  cleanupMobileTestEnvironment,
  MOBILE_DEVICES,
  mockPermissionRequest,
  type MobileDevice,
} from './utils/mobile-test-helpers'

describe('AudioRecorder - Mobile Devices', () => {
  let recorder: AudioRecorder

  afterEach(async () => {
    if (recorder && recorder.isRecording()) {
      try {
        await recorder.stopRecording()
      } catch {
        // Ignore cleanup errors
      }
    }
    cleanupMobileTestEnvironment()
  })

  describe('iOS Mobile Safari - Audio', () => {
    let device: MobileDevice

    beforeEach(() => {
      device = MOBILE_DEVICES.iPhone14Pro
      setupMobileTestEnvironment(device)
    })

    it('should access microphone on iPhone', async () => {
      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(stream.active).toBe(true)
      expect(recorder.isRecording()).toBe(true)
    })

    it('should handle microphone permission on iOS', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream.active).toBe(true)
    })

    it('should handle microphone permission denied on iOS', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow('Permission denied')
    })

    it('should support echo cancellation on iOS', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        echoCancellation: true,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should support noise suppression on iOS', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        noiseCancellation: true,
      })

      expect(recorder.isRecording()).toBe(true)
      expect(recorder.isNoiseCancellationEnabled()).toBe(true)
    })

    it('should handle 44.1kHz sample rate on iOS', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        sampleRate: 44100,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should handle 48kHz sample rate on iOS', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        sampleRate: 48000,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should record and stop on iOS', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      expect(recorder.isRecording()).toBe(true)

      const blob = await recorder.stopRecording()

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('audio/webm')
      expect(recorder.isRecording()).toBe(false)
    })

    it('should pause and resume recording on iOS', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      expect(recorder.isRecording()).toBe(true)

      recorder.pauseRecording()
      expect(recorder.isPaused()).toBe(true)

      recorder.resumeRecording()
      expect(recorder.isPaused()).toBe(false)
      expect(recorder.isRecording()).toBe(true)
    })

    it('should monitor audio level on iOS', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      const level = recorder.getAudioLevel()
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(1)
    })
  })

  describe('iOS iPad - Audio', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)
    })

    it('should access microphone on iPad', async () => {
      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(stream.active).toBe(true)
    })

    it('should support higher quality audio on iPad', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        sampleRate: 48000,
        echoCancellation: true,
        noiseCancellation: true,
      })

      expect(recorder.isRecording()).toBe(true)
    })
  })

  describe('Android Chrome Mobile - Audio', () => {
    let device: MobileDevice

    beforeEach(() => {
      device = MOBILE_DEVICES.galaxyS21
      setupMobileTestEnvironment(device)
    })

    it('should access microphone on Android', async () => {
      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(stream.active).toBe(true)
    })

    it('should handle microphone permission on Android', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream.active).toBe(true)
    })

    it('should support echo cancellation on Android', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        echoCancellation: true,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should support noise suppression on Android', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        noiseCancellation: true,
      })

      expect(recorder.isRecording()).toBe(true)
      expect(recorder.isNoiseCancellationEnabled()).toBe(true)
    })

    it('should handle 44.1kHz sample rate on Android', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        sampleRate: 44100,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should record and stop on Android', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      const blob = await recorder.stopRecording()

      expect(blob).toBeInstanceOf(Blob)
      expect(recorder.isRecording()).toBe(false)
    })

    it('should enumerate audio devices on Android', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(d => d.kind === 'audioinput')

      expect(audioInputs.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Mobile Audio Constraints', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should apply default audio constraints', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should apply custom sample rate', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        sampleRate: 48000,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should enable echo cancellation', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        echoCancellation: true,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should disable echo cancellation', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        echoCancellation: false,
      })

      expect(recorder.isRecording()).toBe(true)
    })

    it('should enable noise cancellation', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        noiseCancellation: true,
      })

      expect(recorder.isNoiseCancellationEnabled()).toBe(true)
    })

    it('should disable noise cancellation', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        noiseCancellation: false,
      })

      // Can still be enabled later
      recorder.enableNoiseCancellation()
      expect(recorder.isNoiseCancellationEnabled()).toBe(true)
    })

    it('should handle overconstrained error', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Constraints cannot be satisfied', 'OverconstrainedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({
          microphone: true,
          sampleRate: 192000, // Unrealistic for mobile
        })
      ).rejects.toThrow()
    })
  })

  describe('Mobile Audio Permissions', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)
    })

    it('should handle permission prompt', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'prompt')

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
    })

    it('should handle permission granted', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'granted')

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream.active).toBe(true)
    })

    it('should handle permission denied', async () => {
      mockPermissionRequest('microphone' as PermissionName, 'denied')

      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow()
    })

    it('should handle permission revoked during recording', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      expect(recorder.isRecording()).toBe(true)

      // Permission can be revoked, but recording continues until stopped
      // In real scenario, track.readyState would change to 'ended'
    })
  })

  describe('Mobile Audio Recording State', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should track recording state', async () => {
      recorder = new AudioRecorder()

      expect(recorder.isRecording()).toBe(false)

      await recorder.startRecording({ microphone: true })
      expect(recorder.isRecording()).toBe(true)

      await recorder.stopRecording()
      expect(recorder.isRecording()).toBe(false)
    })

    it('should track paused state', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      expect(recorder.isPaused()).toBe(false)

      recorder.pauseRecording()
      expect(recorder.isPaused()).toBe(true)

      recorder.resumeRecording()
      expect(recorder.isPaused()).toBe(false)
    })

    it('should prevent starting while already recording', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow('Already recording')
    })

    it('should prevent stopping when not recording', async () => {
      recorder = new AudioRecorder()

      await expect(recorder.stopRecording()).rejects.toThrow('Not recording')
    })

    it('should prevent pausing when not recording', () => {
      recorder = new AudioRecorder()

      expect(() => recorder.pauseRecording()).toThrow('Not recording')
    })

    it('should prevent resuming when not paused', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      expect(() => recorder.resumeRecording()).toThrow('Not paused')
    })
  })

  describe('Mobile Audio Level Monitoring', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)
    })

    it('should return audio level during recording', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      const level = recorder.getAudioLevel()
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(1)
    })

    it('should return zero when not recording', () => {
      recorder = new AudioRecorder()

      const level = recorder.getAudioLevel()
      expect(level).toBe(0)
    })

    it('should update audio level continuously', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      const level1 = recorder.getAudioLevel()
      const level2 = recorder.getAudioLevel()

      // Both readings should be valid
      expect(level1).toBeGreaterThanOrEqual(0)
      expect(level2).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Mobile Noise Cancellation', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should enable noise cancellation', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        noiseCancellation: true,
      })

      expect(recorder.isNoiseCancellationEnabled()).toBe(true)
    })

    it('should disable noise cancellation', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        noiseCancellation: true,
      })

      recorder.disableNoiseCancellation()
      expect(recorder.isNoiseCancellationEnabled()).toBe(false)
    })

    it('should toggle noise cancellation', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({
        microphone: true,
        noiseCancellation: false,
      })

      expect(recorder.isNoiseCancellationEnabled()).toBe(false)

      recorder.enableNoiseCancellation()
      expect(recorder.isNoiseCancellationEnabled()).toBe(true)

      recorder.disableNoiseCancellation()
      expect(recorder.isNoiseCancellationEnabled()).toBe(false)
    })
  })

  describe('Mobile Background Recording', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    })

    it('should continue recording when app goes to background', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      // Simulate app going to background
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      })

      // Recording should continue on mobile (behavior varies by OS)
      expect(recorder.isRecording()).toBe(true)
    })

    it('should handle app returning to foreground', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      // Simulate background
      Object.defineProperty(document, 'hidden', { value: true })

      // Return to foreground
      Object.defineProperty(document, 'hidden', { value: false })

      expect(recorder.isRecording()).toBe(true)
    })
  })

  describe('Mobile Audio Formats', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)
    })

    it('should support WebM audio format', async () => {
      recorder = new AudioRecorder()
      await recorder.startRecording({ microphone: true })

      const blob = await recorder.stopRecording()
      expect(blob.type).toBe('audio/webm')
    })

    it('should check MediaRecorder audio support', () => {
      expect(MediaRecorder.isTypeSupported('audio/webm')).toBe(true)
      expect(MediaRecorder.isTypeSupported('audio/webm;codecs=opus')).toBe(true)
    })
  })

  describe('Mobile Error Handling', () => {
    beforeEach(() => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
    })

    it('should handle microphone not found', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('No microphone found', 'NotFoundError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow('No microphone found')
    })

    it('should handle microphone in use', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Microphone is already in use', 'NotReadableError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow('Microphone is already in use')
    })

    it('should handle abort error', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(
        new DOMException('Request was aborted', 'AbortError')
      )

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
      })

      recorder = new AudioRecorder()
      await expect(
        recorder.startRecording({ microphone: true })
      ).rejects.toThrow('Request was aborted')
    })
  })

  describe('Cross-Device Audio Testing', () => {
    it('should work on iPhone SE', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(recorder.isRecording()).toBe(true)
    })

    it('should work on iPhone 12', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(recorder.isRecording()).toBe(true)
    })

    it('should work on iPhone 14 Pro', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(recorder.isRecording()).toBe(true)
    })

    it('should work on iPad Air', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.iPadAir)

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(recorder.isRecording()).toBe(true)
    })

    it('should work on Galaxy S20', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS20)

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(recorder.isRecording()).toBe(true)
    })

    it('should work on Galaxy S21', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.galaxyS21)

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(recorder.isRecording()).toBe(true)
    })

    it('should work on Pixel XL', async () => {
      setupMobileTestEnvironment(MOBILE_DEVICES.pixelXL)

      recorder = new AudioRecorder()
      const stream = await recorder.startRecording({ microphone: true })

      expect(stream).toBeDefined()
      expect(recorder.isRecording()).toBe(true)
    })
  })
})
