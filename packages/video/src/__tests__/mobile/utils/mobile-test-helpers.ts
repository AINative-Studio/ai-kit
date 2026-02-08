/**
 * Mobile Test Helpers
 *
 * Utilities for testing mobile device scenarios including:
 * - User agent mocking for iOS and Android
 * - Mobile viewport simulation
 * - Touch event simulation
 * - Device capability detection
 */

import { vi } from 'vitest'

export interface MobileDevice {
  name: string
  userAgent: string
  viewport: {
    width: number
    height: number
  }
  platform: 'iOS' | 'Android'
  browser: 'Safari' | 'Chrome' | 'Firefox'
  supportsGetDisplayMedia: boolean
  supportsGetUserMedia: boolean
  supportsMediaRecorder: boolean
}

/**
 * Common mobile device configurations
 */
export const MOBILE_DEVICES: Record<string, MobileDevice> = {
  iPhoneSE: {
    name: 'iPhone SE',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667 },
    platform: 'iOS',
    browser: 'Safari',
    supportsGetDisplayMedia: false,
    supportsGetUserMedia: true,
    supportsMediaRecorder: true,
  },
  iPhone12: {
    name: 'iPhone 12',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    platform: 'iOS',
    browser: 'Safari',
    supportsGetDisplayMedia: false,
    supportsGetUserMedia: true,
    supportsMediaRecorder: true,
  },
  iPhone14Pro: {
    name: 'iPhone 14 Pro',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 393, height: 852 },
    platform: 'iOS',
    browser: 'Safari',
    supportsGetDisplayMedia: false,
    supportsGetUserMedia: true,
    supportsMediaRecorder: true,
  },
  iPadAir: {
    name: 'iPad Air',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 820, height: 1180 },
    platform: 'iOS',
    browser: 'Safari',
    supportsGetDisplayMedia: false,
    supportsGetUserMedia: true,
    supportsMediaRecorder: true,
  },
  galaxyS20: {
    name: 'Samsung Galaxy S20',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G980F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36',
    viewport: { width: 360, height: 800 },
    platform: 'Android',
    browser: 'Chrome',
    supportsGetDisplayMedia: false,
    supportsGetUserMedia: true,
    supportsMediaRecorder: true,
  },
  galaxyS21: {
    name: 'Samsung Galaxy S21',
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.88 Mobile Safari/537.36',
    viewport: { width: 360, height: 800 },
    platform: 'Android',
    browser: 'Chrome',
    supportsGetDisplayMedia: false,
    supportsGetUserMedia: true,
    supportsMediaRecorder: true,
  },
  pixelXL: {
    name: 'Google Pixel XL',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    platform: 'Android',
    browser: 'Chrome',
    supportsGetDisplayMedia: false,
    supportsGetUserMedia: true,
    supportsMediaRecorder: true,
  },
}

/**
 * Screen orientations
 */
export type Orientation = 'portrait' | 'landscape'

/**
 * Mock navigator properties for mobile device
 */
export function mockMobileNavigator(device: MobileDevice) {
  Object.defineProperty(global.navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: device.userAgent,
  })

  Object.defineProperty(global.navigator, 'platform', {
    writable: true,
    configurable: true,
    value: device.platform === 'iOS' ? 'iPhone' : 'Linux armv8l',
  })

  Object.defineProperty(global.navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: 5,
  })
}

/**
 * Mock window properties for mobile viewport
 */
export function mockMobileViewport(device: MobileDevice, orientation: Orientation = 'portrait') {
  const width = orientation === 'portrait' ? device.viewport.width : device.viewport.height
  const height = orientation === 'portrait' ? device.viewport.height : device.viewport.width

  Object.defineProperty(global.window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })

  Object.defineProperty(global.window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })

  Object.defineProperty(global.window, 'screen', {
    writable: true,
    configurable: true,
    value: {
      width,
      height,
      availWidth: width,
      availHeight: height,
      orientation: {
        type: orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary',
        angle: orientation === 'portrait' ? 0 : 90,
      },
    },
  })
}

/**
 * Mock MediaDevices API with mobile constraints
 */
export function mockMobileMediaDevices(device: MobileDevice) {
  const getUserMediaMock = vi.fn()
  const getDisplayMediaMock = vi.fn()
  const enumerateDevicesMock = vi.fn()

  // Setup getUserMedia mock
  getUserMediaMock.mockImplementation(async (constraints: MediaStreamConstraints) => {
    if (!device.supportsGetUserMedia) {
      throw new DOMException('getUserMedia is not supported', 'NotSupportedError')
    }

    // Simulate mobile camera constraints
    const mockStream = createMockMediaStream({
      video: !!constraints.video,
      audio: !!constraints.audio,
      facingMode: device.platform === 'iOS' ? 'user' : 'environment',
    })

    return mockStream
  })

  // Setup getDisplayMedia mock
  getDisplayMediaMock.mockImplementation(async () => {
    if (!device.supportsGetDisplayMedia) {
      throw new DOMException('getDisplayMedia is not supported on mobile', 'NotSupportedError')
    }

    return createMockMediaStream({ video: true, audio: false })
  })

  // Setup enumerateDevices mock
  enumerateDevicesMock.mockResolvedValue([
    {
      deviceId: 'front-camera',
      kind: 'videoinput',
      label: 'Front Camera',
      groupId: 'camera-group',
    },
    {
      deviceId: 'back-camera',
      kind: 'videoinput',
      label: 'Back Camera',
      groupId: 'camera-group',
    },
    {
      deviceId: 'microphone',
      kind: 'audioinput',
      label: 'Microphone',
      groupId: 'audio-group',
    },
  ])

  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    configurable: true,
    value: {
      getUserMedia: getUserMediaMock,
      getDisplayMedia: getDisplayMediaMock,
      enumerateDevices: enumerateDevicesMock,
      getSupportedConstraints: vi.fn(() => ({
        width: true,
        height: true,
        aspectRatio: true,
        frameRate: true,
        facingMode: true,
        resizeMode: true,
        sampleRate: true,
        sampleSize: true,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
        latency: true,
        channelCount: true,
      })),
    },
  })

  return {
    getUserMedia: getUserMediaMock,
    getDisplayMedia: getDisplayMediaMock,
    enumerateDevices: enumerateDevicesMock,
  }
}

/**
 * Create mock MediaStream
 */
export function createMockMediaStream(options: {
  video: boolean
  audio: boolean
  facingMode?: string
}): MediaStream {
  const tracks: MediaStreamTrack[] = []

  if (options.video) {
    const videoTrack = {
      kind: 'video',
      id: 'video-track-id',
      label: 'Camera',
      enabled: true,
      muted: false,
      readyState: 'live',
      stop: vi.fn(),
      getSettings: vi.fn(() => ({
        width: 1280,
        height: 720,
        frameRate: 30,
        facingMode: options.facingMode || 'user',
        aspectRatio: 16 / 9,
        deviceId: options.facingMode === 'environment' ? 'back-camera' : 'front-camera',
      })),
      getCapabilities: vi.fn(() => ({
        width: { min: 320, max: 1920 },
        height: { min: 240, max: 1080 },
        frameRate: { min: 15, max: 60 },
        facingMode: ['user', 'environment'],
      })),
      getConstraints: vi.fn(() => ({
        facingMode: options.facingMode,
      })),
      applyConstraints: vi.fn(),
    } as unknown as MediaStreamTrack

    tracks.push(videoTrack)
  }

  if (options.audio) {
    const audioTrack = {
      kind: 'audio',
      id: 'audio-track-id',
      label: 'Microphone',
      enabled: true,
      muted: false,
      readyState: 'live',
      stop: vi.fn(),
      getSettings: vi.fn(() => ({
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })),
      getCapabilities: vi.fn(() => ({
        sampleRate: { min: 8000, max: 48000 },
        channelCount: { min: 1, max: 2 },
        echoCancellation: [true, false],
        noiseSuppression: [true, false],
      })),
      getConstraints: vi.fn(() => ({})),
      applyConstraints: vi.fn(),
    } as unknown as MediaStreamTrack

    tracks.push(audioTrack)
  }

  return {
    id: 'mock-stream-id',
    active: true,
    getTracks: vi.fn(() => tracks),
    getVideoTracks: vi.fn(() => tracks.filter(t => t.kind === 'video')),
    getAudioTracks: vi.fn(() => tracks.filter(t => t.kind === 'audio')),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
  } as unknown as MediaStream
}

/**
 * Mock MediaRecorder API
 */
export class MockMobileMediaRecorder {
  state: RecordingState = 'inactive'
  stream: MediaStream
  options?: MediaRecorderOptions
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  onpause: (() => void) | null = null
  onresume: (() => void) | null = null
  onstart: (() => void) | null = null
  mimeType: string

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream
    this.options = options
    this.mimeType = options?.mimeType || 'video/webm;codecs=vp8'
  }

  start(timeslice?: number) {
    this.state = 'recording'
    if (this.onstart) {
      this.onstart(new Event('start'))
    }
  }

  stop() {
    this.state = 'inactive'
    if (this.ondataavailable) {
      this.ondataavailable({
        data: new Blob(['mock-data'], { type: this.mimeType }),
      } as BlobEvent)
    }
    if (this.onstop) {
      this.onstop()
    }
  }

  pause() {
    this.state = 'paused'
    if (this.onpause) {
      this.onpause(new Event('pause'))
    }
  }

  resume() {
    this.state = 'recording'
    if (this.onresume) {
      this.onresume(new Event('resume'))
    }
  }

  requestData() {
    if (this.ondataavailable) {
      this.ondataavailable({
        data: new Blob(['mock-data'], { type: this.mimeType }),
      } as BlobEvent)
    }
  }

  static isTypeSupported(mimeType: string): boolean {
    // Mobile browsers typically support these formats
    const supportedTypes = [
      'video/webm',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
      'video/mp4',
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
    ]
    return supportedTypes.some(type => mimeType.startsWith(type.split(';')[0]))
  }
}

/**
 * Create touch event
 */
export function createTouchEvent(
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  touches: Array<{ x: number; y: number; identifier?: number }>,
  target: EventTarget = document.body
): TouchEvent {
  const touchList = touches.map((touch, index) => ({
    identifier: touch.identifier ?? index,
    target,
    clientX: touch.x,
    clientY: touch.y,
    screenX: touch.x,
    screenY: touch.y,
    pageX: touch.x,
    pageY: touch.y,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  }))

  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: touchList as any,
    targetTouches: touchList as any,
    changedTouches: touchList as any,
  })
}

/**
 * Simulate permission request
 */
export function mockPermissionRequest(
  name: PermissionName,
  state: PermissionState = 'granted'
) {
  const permissionStatus = {
    state,
    onchange: null,
  }

  if (!global.navigator.permissions) {
    Object.defineProperty(global.navigator, 'permissions', {
      writable: true,
      configurable: true,
      value: {},
    })
  }

  global.navigator.permissions.query = vi.fn().mockResolvedValue(permissionStatus)
}

/**
 * Mock device orientation
 */
export function mockDeviceOrientation(orientation: Orientation) {
  const event = new Event('orientationchange')
  Object.defineProperty(window, 'orientation', {
    writable: true,
    configurable: true,
    value: orientation === 'portrait' ? 0 : 90,
  })
  window.dispatchEvent(event)
}

/**
 * Check if running on mobile device
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  return /iphone|ipad|android|mobile/.test(userAgent)
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent)
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  return /android/.test(userAgent)
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1
}

/**
 * Setup complete mobile test environment
 */
export function setupMobileTestEnvironment(
  device: MobileDevice,
  orientation: Orientation = 'portrait'
) {
  mockMobileNavigator(device)
  mockMobileViewport(device, orientation)
  const mocks = mockMobileMediaDevices(device)

  // Setup MediaRecorder
  global.MediaRecorder = MockMobileMediaRecorder as any

  // Setup URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()

  return {
    device,
    orientation,
    mocks,
  }
}

/**
 * Cleanup mobile test environment
 */
export function cleanupMobileTestEnvironment() {
  vi.clearAllMocks()
}
