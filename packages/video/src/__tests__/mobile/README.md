# Mobile Device Testing Guide

Comprehensive mobile device testing for camera/recording features in the @ainative/ai-kit-video package.

## Overview

This test suite provides extensive coverage for mobile device scenarios including:
- Screen recording on mobile browsers
- Camera recording with device constraints
- Audio recording with mobile permissions
- MediaStream API mobile compatibility
- Touch interactions for video controls
- Mobile-specific permissions flow

## Test Structure

```
mobile/
├── utils/
│   └── mobile-test-helpers.ts       # Mobile test utilities and mocks
├── screen-recording-mobile.test.ts  # Screen recording tests
├── camera-recording-mobile.test.ts  # Camera recording tests
├── audio-recording-mobile.test.ts   # Audio recording tests
├── mediastream-api-mobile.test.ts   # MediaStream API compatibility
├── touch-interactions-mobile.test.ts # Touch event tests
├── permissions-flow-mobile.test.ts  # Permission handling tests
└── README.md                        # This file
```

## Supported Devices

The test suite includes mocked configurations for:

### iOS Devices
- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 14 Pro (393x852)
- iPad Air (820x1180)

### Android Devices
- Samsung Galaxy S20 (360x800)
- Samsung Galaxy S21 (360x800)
- Google Pixel XL (412x915)

## Running Tests

### Run all mobile tests
```bash
npm test -- src/__tests__/mobile
```

### Run specific mobile test suites
```bash
# Screen recording tests
npm test -- src/__tests__/mobile/screen-recording-mobile.test.ts

# Camera recording tests
npm test -- src/__tests__/mobile/camera-recording-mobile.test.ts

# Audio recording tests
npm test -- src/__tests__/mobile/audio-recording-mobile.test.ts

# MediaStream API tests
npm test -- src/__tests__/mobile/mediastream-api-mobile.test.ts

# Touch interaction tests
npm test -- src/__tests__/mobile/touch-interactions-mobile.test.ts

# Permission flow tests
npm test -- src/__tests__/mobile/permissions-flow-mobile.test.ts
```

### Run with watch mode
```bash
npm test -- src/__tests__/mobile --watch
```

### Run with coverage
```bash
npm test -- src/__tests__/mobile --coverage
```

## Test Categories

### 1. Screen Recording Tests

**File:** `screen-recording-mobile.test.ts`

Tests screen recording functionality across mobile devices:

- iOS Safari limitations (getDisplayMedia not supported)
- Android Chrome support
- Mobile-specific constraints
- Permission handling
- Orientation changes
- Quality presets for mobile
- Error handling

**Key Test Cases:**
```typescript
// iOS limitation
'should throw error when getDisplayMedia is not supported on iOS'

// Viewport adaptation
'should adapt to iOS viewport size'

// Orientation handling
'should handle orientation change on iOS'

// Quality recommendations
'should recommend low quality for older devices'
```

### 2. Camera Recording Tests

**File:** `camera-recording-mobile.test.ts`

Tests camera access and recording on mobile devices:

- Front/back camera switching
- Mobile-specific constraints (facingMode)
- Device orientation handling
- Camera permissions
- Resolution adaptation
- Cross-device compatibility

**Key Test Cases:**
```typescript
// Camera switching
'should access front camera on iPhone'
'should access back camera on iPhone'

// Resolution support
'should support 720p resolution on iPhone'
'should support 1080p resolution on modern iPhone'
'should handle 4K resolution request on iPhone'

// Orientation handling
'should handle orientation change while recording'
```

### 3. Audio Recording Tests

**File:** `audio-recording-mobile.test.ts`

Tests audio recording capabilities on mobile:

- Microphone access
- Mobile-specific audio constraints
- Echo cancellation and noise suppression
- Sample rate support
- Permission handling
- Background recording
- Cross-device compatibility

**Key Test Cases:**
```typescript
// Basic recording
'should access microphone on iPhone'
'should record and stop on iOS'

// Audio processing
'should support echo cancellation on iOS'
'should support noise suppression on iOS'

// State management
'should pause and resume recording on iOS'
'should monitor audio level on iOS'
```

### 4. MediaStream API Tests

**File:** `mediastream-api-mobile.test.ts`

Tests MediaStream API compatibility across browsers:

- getUserMedia support
- getDisplayMedia limitations
- Device enumeration
- Supported constraints
- MediaRecorder support
- Track management
- Platform detection

**Key Test Cases:**
```typescript
// API support
'should have mediaDevices on iOS Safari'
'should support getUserMedia on mobile'

// Device enumeration
'should enumerate devices'
'should identify front and back cameras'

// Constraints
'should support facingMode on mobile'
'should support audio constraints'
```

### 5. Touch Interaction Tests

**File:** `touch-interactions-mobile.test.ts`

Tests touch-based interactions:

- Basic touch events (start, move, end, cancel)
- Multi-touch support
- Swipe gestures
- Pinch-to-zoom
- Long press
- Video player controls
- Cross-device touch support

**Key Test Cases:**
```typescript
// Basic touches
'should detect single touch start'
'should detect touch move'
'should detect touch end'

// Multi-touch
'should detect two-finger touch'
'should detect three-finger touch'

// Gestures
'should detect horizontal swipe'
'should detect pinch start with two fingers'
'should detect long press'

// Recording controls
'should handle start recording button tap'
'should handle camera switch button tap'
```

### 6. Permission Flow Tests

**File:** `permissions-flow-mobile.test.ts`

Tests permission handling on mobile:

- Camera permission flow (iOS/Android)
- Microphone permission flow
- Permission states (prompt, granted, denied)
- Permission persistence
- Combined permissions
- Error types
- Best practices

**Key Test Cases:**
```typescript
// iOS permissions
'should prompt for camera permission on first access'
'should grant camera access when user allows'
'should deny camera access when user blocks'
'should remember granted permission on iOS'

// Android permissions
'should handle "Never ask again" option on Android'

// Combined
'should request both camera and microphone permissions'
'should handle camera granted, microphone denied'

// States
'should check permission status before requesting'
'should handle prompt state'
'should handle denied state'
```

## Test Utilities

### Mobile Test Helpers

**File:** `utils/mobile-test-helpers.ts`

Provides utilities for mobile testing:

#### Device Mocking
```typescript
import { setupMobileTestEnvironment, MOBILE_DEVICES } from './utils/mobile-test-helpers'

// Setup iPhone 14 Pro environment
setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)

// Setup with landscape orientation
setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12, 'landscape')
```

#### Touch Event Creation
```typescript
import { createTouchEvent } from './utils/mobile-test-helpers'

// Single touch
const touchEvent = createTouchEvent('touchstart', [{ x: 100, y: 100 }])

// Multi-touch
const pinchEvent = createTouchEvent('touchmove', [
  { x: 100, y: 100 },
  { x: 200, y: 200 }
])
```

#### Permission Mocking
```typescript
import { mockPermissionRequest } from './utils/mobile-test-helpers'

// Mock granted permission
mockPermissionRequest('camera' as PermissionName, 'granted')

// Mock denied permission
mockPermissionRequest('microphone' as PermissionName, 'denied')
```

#### Platform Detection
```typescript
import { isMobileDevice, isIOS, isAndroid } from './utils/mobile-test-helpers'

if (isMobileDevice()) {
  // Mobile-specific logic
}

if (isIOS()) {
  // iOS-specific handling
}

if (isAndroid()) {
  // Android-specific handling
}
```

## Mobile-Specific Testing Strategies

### 1. User Agent Mocking
Each device configuration includes accurate user agent strings:
```typescript
const device = MOBILE_DEVICES.iPhone14Pro
// User agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)"
```

### 2. Viewport Simulation
Tests adapt to different screen sizes:
```typescript
// Portrait mode
expect(window.innerWidth).toBe(390)
expect(window.innerHeight).toBe(844)

// Landscape mode
setupMobileTestEnvironment(device, 'landscape')
expect(window.innerWidth).toBe(844)
expect(window.innerHeight).toBe(390)
```

### 3. Touch Event Simulation
Tests use realistic touch events:
```typescript
const touchStart = createTouchEvent('touchstart', [{ x: 100, y: 100 }])
element.dispatchEvent(touchStart)
```

### 4. Device Capability Detection
Tests verify appropriate capabilities:
```typescript
// Check supported constraints
const constraints = navigator.mediaDevices.getSupportedConstraints()
expect(constraints.facingMode).toBe(true)

// Check MediaRecorder support
expect(MediaRecorder.isTypeSupported('video/webm')).toBe(true)
```

## Known Mobile Limitations

### iOS Safari
- **Screen Recording:** `getDisplayMedia()` is not supported
- **Audio Context:** May require user interaction to start
- **Camera:** Limited to 720p/1080p in most cases
- **Permissions:** System-level dialogs, can't be programmatically triggered

### Android Chrome
- **Screen Recording:** Generally not supported on mobile
- **Camera:** Better support for higher resolutions (4K)
- **Background Recording:** May be limited by battery optimization
- **Permissions:** More granular control, includes "Never ask again"

### General Mobile Constraints
- **Memory:** Limited compared to desktop
- **CPU:** Thermal throttling may affect high-quality recording
- **Battery:** Recording drains battery quickly
- **Network:** Mobile data constraints for uploads
- **Storage:** Limited space for recorded media

## Testing Best Practices

### 1. Test Mobile-First
Always consider mobile constraints:
```typescript
it('should recommend low quality for older devices', () => {
  setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)
  const recorder = new ScreenRecorder({ quality: 'low' })
  // Low quality recommended for performance
})
```

### 2. Test Both Orientations
Mobile apps must work in portrait and landscape:
```typescript
it('should handle portrait orientation', () => {
  setupMobileTestEnvironment(device, 'portrait')
  // Test portrait layout
})

it('should handle landscape orientation', () => {
  setupMobileTestEnvironment(device, 'landscape')
  // Test landscape layout
})
```

### 3. Test Permission Flows
Mobile permissions are critical:
```typescript
it('should handle permission denied gracefully', async () => {
  mockPermissionRequest('camera', 'denied')
  // Verify graceful handling
})
```

### 4. Test Touch Interactions
Mobile UIs are touch-driven:
```typescript
it('should handle tap on recording button', () => {
  const button = document.getElementById('record')
  const touchEvent = createTouchEvent('touchend', [{ x: 50, y: 50 }])
  button.dispatchEvent(touchEvent)
  // Verify recording started
})
```

### 5. Test Cross-Device
Different devices have different capabilities:
```typescript
describe('Cross-Device Testing', () => {
  it('should work on iPhone SE', async () => {
    setupMobileTestEnvironment(MOBILE_DEVICES.iPhoneSE)
    // Test with older hardware constraints
  })

  it('should work on iPhone 14 Pro', async () => {
    setupMobileTestEnvironment(MOBILE_DEVICES.iPhone14Pro)
    // Test with modern hardware capabilities
  })
})
```

## Coverage Goals

The mobile test suite aims for:
- **Line Coverage:** 80%+
- **Branch Coverage:** 75%+
- **Function Coverage:** 80%+

Current coverage for mobile-specific scenarios:
- Screen Recording: ✅ Comprehensive (with iOS limitations)
- Camera Recording: ✅ Comprehensive
- Audio Recording: ✅ Comprehensive
- MediaStream API: ✅ Comprehensive
- Touch Interactions: ✅ Comprehensive
- Permissions: ✅ Comprehensive

## Debugging Mobile Tests

### Enable Debug Output
```bash
DEBUG=true npm test -- src/__tests__/mobile
```

### Run Single Test
```bash
npm test -- src/__tests__/mobile/camera-recording-mobile.test.ts -t "should access front camera"
```

### Check Mock Calls
```typescript
const getUserMediaMock = vi.mocked(navigator.mediaDevices.getUserMedia)
console.log('getUserMedia called:', getUserMediaMock.mock.calls.length)
console.log('getUserMedia args:', getUserMediaMock.mock.calls[0][0])
```

### Verify Device Setup
```typescript
it('should setup device correctly', () => {
  const env = setupMobileTestEnvironment(MOBILE_DEVICES.iPhone12)
  console.log('Device:', env.device.name)
  console.log('User Agent:', navigator.userAgent)
  console.log('Viewport:', window.innerWidth, 'x', window.innerHeight)
})
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Mobile Tests
  run: npm test -- src/__tests__/mobile --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/mobile/lcov.info
    flags: mobile-tests
```

### Test Reports
Mobile tests generate separate coverage reports:
```bash
coverage/
├── mobile/
│   ├── index.html
│   ├── lcov.info
│   └── coverage-summary.json
```

## Real Device Testing

While these tests mock mobile environments, consider complementing with:

1. **BrowserStack/Sauce Labs:** Test on real devices
2. **Manual Testing:** Physical device testing
3. **User Testing:** Real user scenarios
4. **Performance Monitoring:** Real-world performance metrics

## Contributing

When adding mobile tests:

1. Use existing mobile test helpers
2. Test on multiple device configurations
3. Include both iOS and Android scenarios
4. Test permission flows
5. Test touch interactions
6. Document mobile-specific behavior
7. Update this README with new test cases

## Resources

- [MDN: MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [MDN: Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [iOS Safari Media Capture](https://webkit.org/blog/6784/new-video-policies-for-ios/)
- [Android Chrome Media Capture](https://developer.chrome.com/docs/web-platform/mediastream/)
- [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)

## Issue Tracking

For mobile-specific issues, reference:
- Issue #138: Mobile device testing implementation
- Related issues for specific mobile features

## License

MIT License - See root LICENSE file for details.
