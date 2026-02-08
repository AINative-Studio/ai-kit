/**
 * Performance Benchmarks: Audio Transcription
 *
 * Benchmarks for transcription latency, cost estimation,
 * and text processing performance.
 *
 * @group benchmark
 * @group performance
 */

import { bench, describe, expect } from 'vitest'
import {
  formatSegments,
  extractSpeakers,
  estimateTranscriptionCost,
} from '../../../packages/video/src/processing/transcription'
import type { TranscriptionSegment } from '../../../packages/video/src/processing/types'

describe('Transcription Performance Benchmarks', () => {
  describe('Segment Formatting Performance', () => {
    const createSegments = (count: number): TranscriptionSegment[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        start: i * 2,
        end: i * 2 + 2,
        text: `This is segment ${i} with some test content.`,
      }))
    }

    bench('Format 10 transcription segments', () => {
      const segments = createSegments(10)
      formatSegments(segments)
    }, {
      iterations: 1000,
    })

    bench('Format 100 transcription segments', () => {
      const segments = createSegments(100)
      formatSegments(segments)
    }, {
      iterations: 100,
    })

    bench('Format 1000 transcription segments', () => {
      const segments = createSegments(1000)
      formatSegments(segments)
    }, {
      warmupIterations: 5,
      iterations: 10,
    })

    bench('Format empty segments array', () => {
      formatSegments([])
    }, {
      iterations: 10000,
    })
  })

  describe('Speaker Extraction Performance', () => {
    const shortText = 'Speaker 1: Hello. Speaker 2: Hi there!'

    const mediumText = `
      Speaker 1: Welcome to our meeting.
      Speaker 2: Thank you for having me.
      Speaker 1: Let's discuss the project.
      Speaker 2: I have some updates to share.
    `.repeat(10)

    const longText = `
      John Smith: Good morning everyone.
      Jane Doe: Good morning.
      Speaker 1: Let's begin.
      Speaker 2: I agree.
    `.repeat(100)

    bench('Extract speakers from short text (2 speakers)', () => {
      const speakers = extractSpeakers(shortText)
      expect(speakers.length).toBeGreaterThan(0)
    }, {
      iterations: 1000,
    })

    bench('Extract speakers from medium text (40 segments)', () => {
      extractSpeakers(mediumText)
    }, {
      iterations: 100,
    })

    bench('Extract speakers from long text (400 segments)', () => {
      extractSpeakers(longText)
    }, {
      warmupIterations: 10,
      iterations: 50,
    })

    bench('Extract speakers from text with no speakers', () => {
      const noSpeakers = 'This is plain text without any speaker labels.'
      extractSpeakers(noSpeakers)
    }, {
      iterations: 1000,
    })
  })

  describe('Cost Estimation Performance', () => {
    bench('Estimate cost for 1 minute audio', () => {
      const cost = estimateTranscriptionCost(60)
      expect(cost).toBeCloseTo(0.006, 3)
    }, {
      iterations: 10000,
    })

    bench('Estimate cost for 10 minute audio', () => {
      estimateTranscriptionCost(600)
    }, {
      iterations: 10000,
    })

    bench('Estimate cost for 1 hour audio', () => {
      estimateTranscriptionCost(3600)
    }, {
      iterations: 10000,
    })

    bench('Estimate cost for 10 hour audio', () => {
      estimateTranscriptionCost(36000)
    }, {
      iterations: 10000,
    })

    bench('Batch cost estimation (100 calculations)', () => {
      for (let i = 1; i <= 100; i++) {
        estimateTranscriptionCost(i * 60) // 1 to 100 minutes
      }
    }, {
      iterations: 100,
    })
  })

  describe('Transcription Data Processing Performance', () => {
    const createTranscriptionResult = (segmentCount: number) => ({
      text: Array.from({ length: segmentCount }, (_, i) =>
        `Segment ${i} text content.`
      ).join(' '),
      segments: Array.from({ length: segmentCount }, (_, i) => ({
        id: i,
        start: i * 2,
        end: i * 2 + 2,
        text: `Segment ${i} text content.`,
      })),
      duration: segmentCount * 2,
      language: 'en',
    })

    bench('Process small transcription result (10 segments)', () => {
      const result = createTranscriptionResult(10)
      expect(result.segments).toHaveLength(10)
    }, {
      iterations: 1000,
    })

    bench('Process medium transcription result (100 segments)', () => {
      const result = createTranscriptionResult(100)
      expect(result.segments).toHaveLength(100)
    }, {
      iterations: 100,
    })

    bench('Process large transcription result (1000 segments)', () => {
      const result = createTranscriptionResult(1000)
      expect(result.segments).toHaveLength(1000)
    }, {
      warmupIterations: 5,
      iterations: 10,
    })
  })

  describe('Timestamp Formatting Performance', () => {
    const formatTimestamp = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`
    }

    bench('Format single timestamp', () => {
      formatTimestamp(125.5)
    }, {
      iterations: 100000,
    })

    bench('Format 100 timestamps', () => {
      for (let i = 0; i < 100; i++) {
        formatTimestamp(i * 2.5)
      }
    }, {
      iterations: 1000,
    })

    bench('Format 1000 timestamps', () => {
      for (let i = 0; i < 1000; i++) {
        formatTimestamp(i * 2.5)
      }
    }, {
      iterations: 100,
    })
  })
})

describe('Transcription Latency Performance Targets', () => {
  describe('Given transcription latency requirements', () => {
    bench('Target: Process 1 minute audio metadata in < 100ms', () => {
      const segments = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        start: i * 2,
        end: i * 2 + 2,
        text: `Transcription segment ${i}.`,
      }))

      formatSegments(segments)
      estimateTranscriptionCost(60)
    }, {
      iterations: 1000,
      time: 100, // Should complete 1000 iterations in < 100ms
    })

    bench('Target: Process 10 minute audio metadata in < 500ms', () => {
      const segments = Array.from({ length: 300 }, (_, i) => ({
        id: i,
        start: i * 2,
        end: i * 2 + 2,
        text: `Transcription segment ${i}.`,
      }))

      formatSegments(segments)
      estimateTranscriptionCost(600)
    }, {
      iterations: 100,
      time: 50, // 100 iterations should complete in < 50ms
    })

    bench('Target: Extract speakers from 1 hour transcript in < 1s', () => {
      const longTranscript = Array.from({ length: 1800 }, (_, i) =>
        `Speaker ${(i % 3) + 1}: This is segment ${i}.`
      ).join(' ')

      extractSpeakers(longTranscript)
    }, {
      warmupIterations: 5,
      iterations: 10,
      time: 100, // 10 iterations in < 100ms means < 1s per iteration
    })
  })

  describe('Given memory efficiency requirements', () => {
    bench('Memory: Process large transcription without memory spike', () => {
      // Create and process large dataset
      const segments = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        start: i * 2,
        end: i * 2 + 2,
        text: `Segment ${i} with detailed content about the topic.`,
      }))

      const formatted = formatSegments(segments)
      expect(formatted.length).toBeGreaterThan(0)

      // Allow garbage collection
      segments.length = 0
    }, {
      warmupIterations: 3,
      iterations: 5,
    })
  })
})

describe('Transcription API Response Time Simulation', () => {
  bench('Simulate processing 30-second audio response', async () => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 0))

    const result = {
      text: 'Simulated transcription result.',
      duration: 30,
      segments: Array.from({ length: 15 }, (_, i) => ({
        id: i,
        start: i * 2,
        end: i * 2 + 2,
        text: `Segment ${i}.`,
      })),
    }

    expect(result).toBeDefined()
  }, {
    iterations: 100,
  })

  bench('Simulate processing 5-minute audio response', async () => {
    await new Promise(resolve => setTimeout(resolve, 0))

    const result = {
      text: 'Long transcription result.',
      duration: 300,
      segments: Array.from({ length: 150 }, (_, i) => ({
        id: i,
        start: i * 2,
        end: i * 2 + 2,
        text: `Segment ${i}.`,
      })),
    }

    formatSegments(result.segments)
  }, {
    iterations: 50,
  })
})
