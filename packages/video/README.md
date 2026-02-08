# @ainative/ai-kit-video

Video processing utilities for AI Kit, including screen recording, camera recording, audio processing, and AI-powered transcription using OpenAI's Whisper API.

[![npm version](https://img.shields.io/npm/v/@ainative/ai-kit-video.svg)](https://www.npmjs.com/package/@ainative/ai-kit-video)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## Features

### Recording
- **Screen Recording** - Capture screen with customizable settings (quality, frame rate, audio)
- **Camera Recording** - Record from webcam with MediaStream API
- **Audio Recording** - Record audio with noise cancellation and processing
- **Picture-in-Picture** - Composite camera feed over screen recording

### Processing
- **Audio Transcription** - AI-powered transcription using OpenAI Whisper
- **Text Formatting** - Clean and format transcribed text
- **Highlight Detection** - Detect significant moments in video
- **Noise Processing** - Reduce background noise in audio

### Observability
- **Instrumented Recording** - Built-in performance metrics and event logging
- **Correlation IDs** - Track recordings across your application
- **Performance Metrics** - Monitor bitrate, file size, and duration

## Installation

```bash
npm install @ainative/ai-kit-video
```

## Usage

### Screen Recording

```typescript
import { ScreenRecorder } from '@ainative/ai-kit-video/recording'

const recorder = new ScreenRecorder({
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2500000,
  audioBitsPerSecond: 128000
})

// Start recording
const stream = await recorder.getStream()
await recorder.start()

// Stop and get recording
await recorder.stop()
const blob = recorder.getRecordingBlob()
const url = recorder.getRecordingURL()

// Download the recording
const link = document.createElement('a')
link.href = url
link.download = 'screen-recording.webm'
link.click()

// Clean up
recorder.revokeURL(url)
```

### Camera Recording

```typescript
import { CameraRecorder } from '@ainative/ai-kit-video/recording'

const recorder = new CameraRecorder({
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
  },
  audio: true
})

const stream = await recorder.getStream()
await recorder.start()

// Display preview
const videoElement = document.querySelector('video')
videoElement.srcObject = stream

// Stop and save
await recorder.stop()
const blob = recorder.getRecordingBlob()
```

### Audio Transcription with Whisper

```typescript
import { transcribeAudio } from '@ainative/ai-kit-video/processing'

// Transcribe audio file
const result = await transcribeAudio(audioFile, {
  apiKey: process.env.OPENAI_API_KEY,
  language: 'en',
  response_format: 'verbose_json',
  timestamp_granularities: ['segment', 'word']
})

console.log(result.text)
console.log(result.segments) // Segment-level timestamps
console.log(result.words)    // Word-level timestamps
```

### Text Formatting

```typescript
import { TextFormatter } from '@ainative/ai-kit-video/processing'

const formatter = new TextFormatter({
  removeFillerWords: true,
  correctPunctuation: true,
  capitalizeFirstWord: true
})

const formatted = formatter.format(transcribedText)
console.log(formatted)
```

### Noise Cancellation

```typescript
import { NoiseProcessor } from '@ainative/ai-kit-video/recording'

const processor = new NoiseProcessor({
  noiseReduction: 0.8,
  autoGain: true
})

// Process audio stream
const cleanStream = await processor.process(audioStream)
```

### Instrumented Recording with Observability

```typescript
import { InstrumentedScreenRecorder } from '@ainative/ai-kit-video/recording'

const recorder = new InstrumentedScreenRecorder({
  correlationId: 'user-session-123',
  logger: customLogger,
  enablePerformanceMetrics: true
})

// All events are logged with correlation ID
recorder.on('recording_started', (event) => {
  console.log(`Recording started: ${event.recordingId}`)
  console.log(`Correlation: ${event.correlationId}`)
})

recorder.on('performance_metrics', (metrics) => {
  console.log(`Bitrate: ${metrics.avgBitrate}`)
  console.log(`File size: ${metrics.fileSize}`)
})

await recorder.start()
```

### Picture-in-Picture Composite

```typescript
import { PiPCompositor } from '@ainative/ai-kit-video/recording'

const compositor = new PiPCompositor({
  position: 'bottom-right',
  size: { width: 320, height: 180 },
  borderRadius: 8,
  border: '2px solid white'
})

// Combine screen and camera
const screenStream = await screenRecorder.getStream()
const cameraStream = await cameraRecorder.getStream()

const composite = compositor.composite(screenStream, cameraStream)
```

## API Reference

### Recording Classes

#### `ScreenRecorder`
- `getStream(): Promise<MediaStream>` - Get display media stream
- `start(): Promise<void>` - Start recording
- `stop(): Promise<void>` - Stop recording
- `pause(): void` - Pause recording
- `resume(): void` - Resume recording
- `getRecordingBlob(): Blob` - Get recorded video as Blob
- `getRecordingURL(): string` - Get Blob URL for download
- `revokeURL(url: string): void` - Revoke Blob URL to free memory

#### `CameraRecorder`
- Same API as ScreenRecorder
- Automatically cleans up MediaStream on page unload
- Prevents memory leaks with proper resource disposal

#### `AudioRecorder`
- Record audio only with customizable settings
- Built-in noise reduction
- Auto-gain control

#### `InstrumentedScreenRecorder`
- Extends ScreenRecorder with observability
- Emits performance metrics and lifecycle events
- Supports correlation IDs for distributed tracing

### Processing Functions

#### `transcribeAudio(file, options)`
Transcribe audio using OpenAI Whisper API.

**Options:**
- `apiKey` (required) - OpenAI API key
- `language` - ISO-639-1 language code (e.g., 'en', 'es')
- `prompt` - Guide the model's style or terminology
- `response_format` - 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
- `temperature` - Sampling temperature (0-1)
- `timestamp_granularities` - ['word', 'segment']

**Returns:** `TranscriptionResult`
- `text` - Full transcription
- `language` - Detected language (verbose_json only)
- `duration` - Audio duration in seconds (verbose_json only)
- `segments` - Timestamped segments
- `words` - Word-level timestamps

#### `formatSegments(segments)`
Format transcription segments into readable text with timestamps.

#### `extractSpeakers(text)`
Extract speaker-labeled text from transcription (requires speaker hints in prompt).

#### `estimateTranscriptionCost(durationSeconds)`
Calculate estimated cost for Whisper transcription ($0.006/minute).

### Utility Classes

#### `TextFormatter`
Clean and format transcribed text.

**Options:**
- `removeFillerWords` - Remove 'um', 'uh', 'like', etc.
- `correctPunctuation` - Add proper punctuation
- `capitalizeFirstWord` - Capitalize first word of sentences
- `removeExtraSpaces` - Normalize whitespace

#### `NoiseProcessor`
Process audio streams to reduce background noise.

**Options:**
- `noiseReduction` - Noise reduction strength (0-1)
- `autoGain` - Enable automatic gain control
- `echoCancellation` - Enable echo cancellation

## TypeScript Support

This package is written in TypeScript and includes complete type definitions.

```typescript
import type {
  RecordingConfig,
  TranscriptionOptions,
  TranscriptionResult,
  InstrumentationConfig
} from '@ainative/ai-kit-video'
```

## Browser Compatibility

- Chrome/Edge 87+
- Firefox 94+
- Safari 15.4+
- Requires HTTPS for MediaStream APIs

## Memory Management

All recorders automatically clean up resources:
- Blob URLs are revocable via `revokeURL()`
- MediaStreams are stopped on page unload
- No memory leaks from unreleased resources

```typescript
// Manual cleanup
recorder.stop()
const url = recorder.getRecordingURL()
// ... use the URL
recorder.revokeURL(url) // Free memory
```

## Performance

- **Screen Recording**: 2.5 Mbps video, 128 kbps audio (default)
- **Camera Recording**: 1920x1080 @ 30fps (configurable)
- **Whisper Transcription**: ~$0.006 per minute of audio

## Examples

See the [examples directory](https://github.com/AINative-Studio/ai-kit/tree/main/examples) for complete working examples:
- Screen recording with download
- Camera recording with preview
- Audio transcription with Whisper
- PiP composite recording
- Instrumented recording with metrics

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/AINative-Studio/ai-kit/blob/main/docs/contributing/CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](./LICENSE) for details.

## Support

- [GitHub Issues](https://github.com/AINative-Studio/ai-kit/issues)
- [Documentation](https://ainative.studio/ai-kit)

---

**Built by [AINative Studio](https://ainative.studio)**
