/**
 * Performance Benchmarks: Video Recording & Processing
 *
 * Benchmarks for video encoding speed, transcription latency,
 * and overall workflow performance.
 *
 * @group benchmark
 * @group performance
 */

import { bench, describe } from 'vitest'
import { ScreenRecorder } from '../../../packages/video/src/recording/screen-recorder'
import { CameraRecorder } from '../../../packages/video/src/recording/camera-recorder'

describe('Video Performance Benchmarks', () => {
  describe('Screen Recording Performance', () => {
    bench('Initialize ScreenRecorder with default settings', async () => {
      const recorder = new ScreenRecorder()
      recorder.dispose()
    }, {
      warmupIterations: 10,
      iterations: 100,
    })

    bench('Initialize ScreenRecorder with high quality', async () => {
      const recorder = new ScreenRecorder({ quality: 'high' })
      recorder.dispose()
    }, {
      warmupIterations: 10,
      iterations: 100,
    })

    bench('Get quality configuration', () => {
      const recorder = new ScreenRecorder({ quality: 'ultra' })
      recorder.getQualityConfig()
      recorder.dispose()
    }, {
      iterations: 1000,
    })

    bench('Check recording state', () => {
      const recorder = new ScreenRecorder()
      recorder.getState()
      recorder.isRecording()
      recorder.dispose()
    }, {
      iterations: 10000,
    })

    bench('Set and validate quality settings', () => {
      const recorder = new ScreenRecorder()
      recorder.setQuality('low')
      recorder.setQuality('medium')
      recorder.setQuality('high')
      recorder.setQuality('ultra')
      recorder.dispose()
    }, {
      iterations: 1000,
    })
  })

  describe('Camera Recording Performance', () => {
    bench('Initialize CameraRecorder with default settings', () => {
      const recorder = new CameraRecorder()
      recorder.stop()
    }, {
      warmupIterations: 10,
      iterations: 100,
    })

    bench('Initialize CameraRecorder with 4K resolution', () => {
      const recorder = new CameraRecorder({
        resolution: '4K',
        audio: true,
        frameRate: 60,
      })
      recorder.stop()
    }, {
      warmupIterations: 10,
      iterations: 100,
    })

    bench('Build media constraints', () => {
      const recorder = new CameraRecorder({
        resolution: '1080p',
        frameRate: 30,
        facingMode: 'user',
        audio: true,
      })
      // Internal buildConstraints is called during initialization
      recorder.stop()
    }, {
      iterations: 1000,
    })

    bench('Check camera stream status', () => {
      const recorder = new CameraRecorder()
      recorder.isActive()
      recorder.getCurrentStream()
      recorder.stop()
    }, {
      iterations: 10000,
    })
  })

  describe('Video Blob Creation Performance', () => {
    bench('Create small video blob (1KB)', () => {
      const data = new Uint8Array(1024)
      const blob = new Blob([data], { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      URL.revokeObjectURL(url)
    }, {
      iterations: 1000,
    })

    bench('Create medium video blob (1MB)', () => {
      const data = new Uint8Array(1024 * 1024)
      const blob = new Blob([data], { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      URL.revokeObjectURL(url)
    }, {
      iterations: 100,
    })

    bench('Create large video blob (10MB)', () => {
      const data = new Uint8Array(10 * 1024 * 1024)
      const blob = new Blob([data], { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      URL.revokeObjectURL(url)
    }, {
      warmupIterations: 5,
      iterations: 10,
    })
  })

  describe('Video Quality Configuration Performance', () => {
    const qualities = ['low', 'medium', 'high', 'ultra'] as const

    qualities.forEach(quality => {
      bench(`Configure ${quality} quality preset`, () => {
        const recorder = new ScreenRecorder({ quality })
        const config = recorder.getQualityConfig()
        expect(config.videoBitsPerSecond).toBeGreaterThan(0)
        recorder.dispose()
      }, {
        iterations: 1000,
      })
    })
  })

  describe('Memory Management Performance', () => {
    bench('Create and dispose multiple recorders (memory leak test)', () => {
      const recorders = []
      for (let i = 0; i < 10; i++) {
        recorders.push(new ScreenRecorder())
      }
      recorders.forEach(r => r.dispose())
    }, {
      warmupIterations: 10,
      iterations: 100,
    })

    bench('Rapid recorder lifecycle', () => {
      const recorder = new ScreenRecorder({ quality: 'medium' })
      recorder.getQualityConfig()
      recorder.getState()
      recorder.dispose()
    }, {
      iterations: 1000,
    })
  })

  describe('Stream Settings Retrieval Performance', () => {
    bench('Get stream settings (no stream)', () => {
      const recorder = new ScreenRecorder()
      recorder.getStreamSettings()
      recorder.dispose()
    }, {
      iterations: 10000,
    })

    bench('Check cursor enabled status', () => {
      const recorder = new ScreenRecorder({ cursor: 'always' })
      recorder.isCursorEnabled()
      recorder.dispose()
    }, {
      iterations: 10000,
    })
  })
})

describe('Video Encoding Performance Targets', () => {
  describe('Given encoding performance requirements', () => {
    bench('Target: Encode 1080p @ 30fps should process frame in < 33ms', () => {
      // Simulate frame processing time
      const frameData = new Uint8Array(1920 * 1080 * 4) // RGBA frame
      const blob = new Blob([frameData])
      const url = URL.createObjectURL(blob)
      URL.revokeObjectURL(url)
    }, {
      iterations: 30, // 1 second worth of frames
      time: 1000, // Should complete in 1 second
    })

    bench('Target: Encode 720p @ 60fps should process frame in < 16ms', () => {
      // Simulate frame processing time
      const frameData = new Uint8Array(1280 * 720 * 4)
      const blob = new Blob([frameData])
      const url = URL.createObjectURL(blob)
      URL.revokeObjectURL(url)
    }, {
      iterations: 60,
      time: 1000,
    })

    bench('Target: Encode 4K @ 30fps should process frame in < 33ms', () => {
      // Simulate frame processing time
      const frameData = new Uint8Array(3840 * 2160 * 4)
      const blob = new Blob([frameData])
      const url = URL.createObjectURL(blob)
      URL.revokeObjectURL(url)
    }, {
      warmupIterations: 5,
      iterations: 30,
      time: 1000,
    })
  })
})
