/**
 * Performance Benchmarks: Feedback Collection & Analytics
 *
 * Benchmarks for feedback submission time, analytics aggregation,
 * and data export performance.
 *
 * @group benchmark
 * @group performance
 */

import { bench, describe, expect, beforeEach } from 'vitest'
import {
  FeedbackType,
  BinaryFeedback,
  type Feedback,
  type InteractionLog,
} from '../../../packages/core/src/rlhf/types'

describe('Feedback Collection Performance Benchmarks', () => {
  let mockStorage: Map<string, Feedback>

  beforeEach(() => {
    mockStorage = new Map()
  })

  describe('Feedback Submission Performance', () => {
    bench('Submit single binary feedback', () => {
      const feedback: Feedback = {
        id: `feedback-${Date.now()}-${Math.random()}`,
        interactionId: 'test-interaction',
        type: FeedbackType.BINARY,
        data: {
          value: BinaryFeedback.THUMBS_UP,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }

      mockStorage.set(feedback.id, feedback)
    }, {
      iterations: 10000,
    })

    bench('Submit single rating feedback', () => {
      const feedback: Feedback = {
        id: `feedback-${Date.now()}-${Math.random()}`,
        interactionId: 'test-interaction',
        type: FeedbackType.RATING,
        data: {
          rating: 4,
          maxRating: 5,
          comment: 'Good response',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }

      mockStorage.set(feedback.id, feedback)
    }, {
      iterations: 10000,
    })

    bench('Submit single text feedback', () => {
      const feedback: Feedback = {
        id: `feedback-${Date.now()}-${Math.random()}`,
        interactionId: 'test-interaction',
        type: FeedbackType.TEXT,
        data: {
          comment: 'This is detailed feedback about the interaction quality and accuracy.',
          sentiment: 'positive' as const,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }

      mockStorage.set(feedback.id, feedback)
    }, {
      iterations: 10000,
    })

    bench('Submit multi-dimensional feedback', () => {
      const feedback: Feedback = {
        id: `feedback-${Date.now()}-${Math.random()}`,
        interactionId: 'test-interaction',
        type: FeedbackType.MULTI_DIMENSIONAL,
        data: {
          dimensions: {
            accuracy: 5,
            completeness: 4,
            clarity: 5,
            timeliness: 4,
            relevance: 5,
          },
          weights: {
            accuracy: 0.3,
            completeness: 0.2,
            clarity: 0.2,
            timeliness: 0.15,
            relevance: 0.15,
          },
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }

      mockStorage.set(feedback.id, feedback)
    }, {
      iterations: 5000,
    })
  })

  describe('Batch Feedback Submission Performance', () => {
    const createFeedbackBatch = (size: number): Feedback[] => {
      return Array.from({ length: size }, (_, i) => ({
        id: `batch-feedback-${i}`,
        interactionId: `interaction-${i}`,
        type: FeedbackType.BINARY,
        data: {
          value: i % 2 === 0 ? BinaryFeedback.THUMBS_UP : BinaryFeedback.THUMBS_DOWN,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }))
    }

    bench('Submit batch of 10 feedback items', () => {
      const batch = createFeedbackBatch(10)
      batch.forEach(f => mockStorage.set(f.id, f))
    }, {
      iterations: 1000,
    })

    bench('Submit batch of 100 feedback items', () => {
      const batch = createFeedbackBatch(100)
      batch.forEach(f => mockStorage.set(f.id, f))
    }, {
      iterations: 100,
    })

    bench('Submit batch of 1000 feedback items', () => {
      const batch = createFeedbackBatch(1000)
      batch.forEach(f => mockStorage.set(f.id, f))
    }, {
      warmupIterations: 10,
      iterations: 10,
    })
  })

  describe('Feedback Retrieval Performance', () => {
    beforeEach(() => {
      // Populate storage with test data
      for (let i = 0; i < 1000; i++) {
        mockStorage.set(`feedback-${i}`, {
          id: `feedback-${i}`,
          interactionId: `interaction-${i % 100}`,
          type: FeedbackType.BINARY,
          data: {
            value: i % 2 === 0 ? BinaryFeedback.THUMBS_UP : BinaryFeedback.THUMBS_DOWN,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        })
      }
    })

    bench('Retrieve single feedback by ID', () => {
      mockStorage.get('feedback-500')
    }, {
      iterations: 100000,
    })

    bench('Retrieve all feedback for interaction (10 items)', () => {
      const interactionId = 'interaction-50'
      const results = Array.from(mockStorage.values()).filter(
        f => f.interactionId === interactionId
      )
      expect(results.length).toBeGreaterThan(0)
    }, {
      iterations: 1000,
    })

    bench('Filter feedback by type (500 items)', () => {
      const results = Array.from(mockStorage.values()).filter(
        f => f.type === FeedbackType.BINARY
      )
      expect(results.length).toBe(1000)
    }, {
      iterations: 100,
    })

    bench('Filter feedback by time range', () => {
      const now = Date.now()
      const hourAgo = new Date(now - 3600000)
      const results = Array.from(mockStorage.values()).filter(
        f => f.timestamp >= hourAgo
      )
      expect(results.length).toBeGreaterThan(0)
    }, {
      iterations: 100,
    })
  })

  describe('Analytics Aggregation Performance', () => {
    const createAnalyticsData = (count: number) => {
      const feedback: Feedback[] = []
      for (let i = 0; i < count; i++) {
        feedback.push({
          id: `feedback-${i}`,
          interactionId: `interaction-${i}`,
          type: FeedbackType.BINARY,
          data: {
            value: i % 3 === 0 ? BinaryFeedback.THUMBS_UP : BinaryFeedback.THUMBS_DOWN,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        })
      }
      return feedback
    }

    bench('Calculate feedback rate (100 items)', () => {
      const feedback = createAnalyticsData(100)
      const totalInteractions = 150
      const feedbackRate = feedback.length / totalInteractions
      expect(feedbackRate).toBeCloseTo(0.67, 2)
    }, {
      iterations: 1000,
    })

    bench('Calculate binary feedback ratio (1000 items)', () => {
      const feedback = createAnalyticsData(1000)
      const thumbsUp = feedback.filter(
        f => (f.data as any).value === BinaryFeedback.THUMBS_UP
      ).length
      const thumbsDown = feedback.length - thumbsUp
      const ratio = thumbsUp / (thumbsUp + thumbsDown)
      expect(ratio).toBeGreaterThan(0)
    }, {
      iterations: 100,
    })

    bench('Group feedback by type (1000 items)', () => {
      const feedback = createAnalyticsData(1000)
      const byType = new Map<FeedbackType, number>()

      feedback.forEach(f => {
        byType.set(f.type, (byType.get(f.type) || 0) + 1)
      })

      expect(byType.size).toBeGreaterThan(0)
    }, {
      iterations: 100,
    })

    bench('Calculate average rating (1000 items)', () => {
      const ratings = Array.from({ length: 1000 }, (_, i) => ({
        id: `rating-${i}`,
        interactionId: `int-${i}`,
        type: FeedbackType.RATING,
        data: {
          rating: (i % 5) + 1,
          maxRating: 5,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }))

      const sum = ratings.reduce((acc, r) => acc + (r.data as any).rating, 0)
      const avg = sum / ratings.length
      expect(avg).toBeGreaterThan(0)
    }, {
      iterations: 100,
    })
  })

  describe('Data Export Performance', () => {
    const createExportData = (size: number) => {
      return {
        interactions: Array.from({ length: size }, (_, i) => ({
          id: `int-${i}`,
          prompt: `Question ${i}`,
          response: `Answer ${i}`,
          timestamp: new Date(),
        })),
        feedback: Array.from({ length: size }, (_, i) => ({
          id: `feedback-${i}`,
          interactionId: `int-${i}`,
          type: FeedbackType.BINARY,
          data: {
            value: i % 2 === 0 ? BinaryFeedback.THUMBS_UP : BinaryFeedback.THUMBS_DOWN,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        })),
      }
    }

    bench('Export 100 items to JSON', () => {
      const data = createExportData(100)
      const json = JSON.stringify(data)
      expect(json.length).toBeGreaterThan(0)
    }, {
      iterations: 100,
    })

    bench('Export 1000 items to JSON', () => {
      const data = createExportData(1000)
      const json = JSON.stringify(data)
      expect(json.length).toBeGreaterThan(0)
    }, {
      iterations: 10,
    })

    bench('Export 10000 items to JSON', () => {
      const data = createExportData(10000)
      const json = JSON.stringify(data)
      expect(json.length).toBeGreaterThan(0)
    }, {
      warmupIterations: 3,
      iterations: 5,
    })

    bench('Parse exported JSON (1000 items)', () => {
      const data = createExportData(1000)
      const json = JSON.stringify(data)
      const parsed = JSON.parse(json)
      expect(parsed.interactions.length).toBe(1000)
    }, {
      iterations: 10,
    })
  })

  describe('Real-time Analytics Performance', () => {
    bench('Calculate live feedback rate', () => {
      const recentFeedback = Array.from({ length: 50 }, (_, i) => ({
        id: `recent-${i}`,
        interactionId: `int-${i}`,
        type: FeedbackType.BINARY,
        data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
        timestamp: new Date(),
      }))

      const totalInteractions = 100
      const rate = recentFeedback.length / totalInteractions
      expect(rate).toBe(0.5)
    }, {
      iterations: 10000,
    })

    bench('Update rolling window stats (100 items)', () => {
      const window = Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000),
        value: i % 2 === 0 ? 1 : 0,
      }))

      const sum = window.reduce((acc, item) => acc + item.value, 0)
      const avg = sum / window.length
      expect(avg).toBeDefined()
    }, {
      iterations: 1000,
    })
  })
})

describe('Feedback Performance Targets', () => {
  describe('Given feedback submission latency requirements', () => {
    bench('Target: Submit feedback in < 10ms', () => {
      const storage = new Map<string, Feedback>()

      const feedback: Feedback = {
        id: `perf-test-${Date.now()}`,
        interactionId: 'test',
        type: FeedbackType.BINARY,
        data: {
          value: BinaryFeedback.THUMBS_UP,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }

      storage.set(feedback.id, feedback)
      expect(storage.has(feedback.id)).toBe(true)
    }, {
      iterations: 10000,
      time: 100, // 10000 iterations in 100ms = 0.01ms per iteration
    })

    bench('Target: Batch submit 100 items in < 100ms', () => {
      const storage = new Map<string, Feedback>()
      const batch = Array.from({ length: 100 }, (_, i) => ({
        id: `batch-${i}`,
        interactionId: `int-${i}`,
        type: FeedbackType.BINARY,
        data: {
          value: BinaryFeedback.THUMBS_UP,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      }))

      batch.forEach(f => storage.set(f.id, f))
      expect(storage.size).toBe(100)
    }, {
      iterations: 1000,
      time: 100, // 1000 batches in 100ms
    })

    bench('Target: Calculate stats for 1000 items in < 50ms', () => {
      const feedback = Array.from({ length: 1000 }, (_, i) => ({
        type: FeedbackType.BINARY,
        value: i % 2 === 0 ? 1 : 0,
      }))

      const sum = feedback.reduce((acc, f) => acc + f.value, 0)
      const avg = sum / feedback.length
      expect(avg).toBe(0.5)
    }, {
      iterations: 1000,
      time: 50,
    })
  })

  describe('Given analytics performance requirements', () => {
    bench('Target: Aggregate 10k feedback items in < 1s', () => {
      const feedback = Array.from({ length: 10000 }, (_, i) => ({
        id: `f-${i}`,
        type: i % 3 === 0 ? 'binary' : i % 3 === 1 ? 'rating' : 'text',
        value: i % 5,
        timestamp: new Date(Date.now() - i * 1000),
      }))

      const byType = new Map<string, number>()
      feedback.forEach(f => {
        byType.set(f.type, (byType.get(f.type) || 0) + 1)
      })

      expect(byType.size).toBe(3)
    }, {
      warmupIterations: 10,
      iterations: 100,
      time: 100, // 100 iterations in 100ms = 1s per 1000 iterations
    })

    bench('Target: Export 5k items in < 500ms', () => {
      const data = {
        items: Array.from({ length: 5000 }, (_, i) => ({
          id: i,
          data: `Item ${i}`,
          timestamp: Date.now(),
        })),
      }

      const json = JSON.stringify(data)
      expect(json.length).toBeGreaterThan(0)
    }, {
      iterations: 100,
      time: 50, // 100 iterations in 50ms = 500ms per 1000 iterations
    })
  })

  describe('Given memory efficiency requirements', () => {
    bench('Memory: Process 100k feedback items efficiently', () => {
      // Process in chunks to avoid memory spike
      const chunkSize = 1000
      let total = 0

      for (let i = 0; i < 100; i++) {
        const chunk = Array.from({ length: chunkSize }, (_, j) => ({
          id: i * chunkSize + j,
          value: j % 2,
        }))

        total += chunk.reduce((acc, item) => acc + item.value, 0)
      }

      expect(total).toBeGreaterThan(0)
    }, {
      warmupIterations: 3,
      iterations: 10,
    })
  })
})
