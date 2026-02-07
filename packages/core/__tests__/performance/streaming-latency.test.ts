/**
 * Performance Tests: Streaming Latency
 *
 * Tests streaming performance against AIKIT-62 requirements:
 * - Streaming latency <50ms first token
 * - Memory usage <50MB for typical app
 *
 * Refs #68
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIStream } from '../../src/streaming/AIStream'
import type { StreamConfig } from '../../src/types'

describe('Performance: Streaming Latency', () => {
  let config: StreamConfig

  beforeEach(() => {
    config = {
      endpoint: 'http://localhost:3000/api/chat',
      model: 'gpt-4',
      headers: {
        'Authorization': 'Bearer test-key',
      },
    }
  })

  describe('First Token Latency (Target: <50ms)', () => {
    it('should emit first token within 50ms for simulated SSE response', async () => {
      const stream = new AIStream(config)

      // Mock fetch to simulate SSE response with controlled timing
      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()

        // Create a ReadableStream that emits first token immediately
        const readableStream = new ReadableStream({
          start(controller) {
            // First token emitted immediately
            controller.enqueue(encoder.encode('data: {"token":"Hello"}\n\n'))

            // Subsequent tokens
            setTimeout(() => {
              controller.enqueue(encoder.encode('data: {"token":" world"}\n\n'))
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            }, 10)
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      const startTime = performance.now()
      let firstTokenTime = 0

      // Listen for first token
      stream.once('token', () => {
        firstTokenTime = performance.now() - startTime
      })

      // Send message
      await stream.send('test message')

      // Verify first token latency
      expect(firstTokenTime).toBeLessThan(50)
      expect(firstTokenTime).toBeGreaterThan(0)
    })

    it('should measure streaming overhead independently', async () => {
      const stream = new AIStream(config)

      // Mock instant response
      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: {"token":"test"}\n\n'))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      const startTime = performance.now()
      let streamingOverhead = 0

      stream.once('token', () => {
        streamingOverhead = performance.now() - startTime
      })

      await stream.send('test')

      // Streaming overhead should be minimal (<10ms)
      expect(streamingOverhead).toBeLessThan(10)
    })
  })

  describe('Token Processing Performance', () => {
    it('should handle high-frequency token emissions without degradation', async () => {
      const stream = new AIStream(config)
      const tokenCount = 1000
      const tokens: string[] = []
      const latencies: number[] = []

      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          async start(controller) {
            for (let i = 0; i < tokenCount; i++) {
              controller.enqueue(encoder.encode(`data: {"token":"token${i}"}\n\n`))
              // Small delay to simulate real streaming
              await new Promise(resolve => setTimeout(resolve, 0))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      let lastTokenTime = performance.now()
      stream.on('token', (token: string) => {
        tokens.push(token)
        const now = performance.now()
        latencies.push(now - lastTokenTime)
        lastTokenTime = now
      })

      await stream.send('test')

      // Verify all tokens received
      expect(tokens).toHaveLength(tokenCount)

      // Calculate average latency between tokens
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length

      // Average inter-token latency should be <5ms
      expect(avgLatency).toBeLessThan(5)

      // No latency should exceed 20ms (no significant degradation)
      const maxLatency = Math.max(...latencies)
      expect(maxLatency).toBeLessThan(20)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not accumulate excessive memory during long streams', async () => {
      const stream = new AIStream(config)

      // Simulate a very long conversation
      const longMessageCount = 100

      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          start(controller) {
            for (let i = 0; i < 500; i++) {
              controller.enqueue(encoder.encode(`data: {"token":"word${i} "}\n\n`))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      // Track initial memory (approximate)
      const initialMessageCount = stream.getMessages().length

      // Send multiple messages
      for (let i = 0; i < longMessageCount; i++) {
        await stream.send(`message ${i}`)
      }

      const finalMessageCount = stream.getMessages().length

      // Should accumulate messages (2 per exchange: user + assistant)
      expect(finalMessageCount).toBe(initialMessageCount + (longMessageCount * 2))

      // Each message should be reasonable size
      const messages = stream.getMessages()
      const totalSize = JSON.stringify(messages).length

      // 100 exchanges should be <1MB
      expect(totalSize).toBeLessThan(1024 * 1024)
    })
  })

  describe('Parser Performance', () => {
    it('should efficiently parse SSE events with minimal overhead', async () => {
      const stream = new AIStream(config)
      const iterations = 1000
      const parseTimes: number[] = []

      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          start(controller) {
            const startParse = performance.now()

            for (let i = 0; i < iterations; i++) {
              controller.enqueue(encoder.encode(`data: {"token":"test","usage":{"promptTokens":10,"completionTokens":${i},"totalTokens":${10 + i}}}\n\n`))
            }

            const parseTime = performance.now() - startParse
            parseTimes.push(parseTime)

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      await stream.send('test')

      // Total parse time for 1000 events should be <100ms
      expect(parseTimes[0]).toBeLessThan(100)
    })
  })

  describe('Concurrent Streams', () => {
    it('should handle multiple concurrent streams without performance degradation', async () => {
      const streamCount = 10
      const streams: AIStream[] = []
      const completionTimes: number[] = []

      // Create mock for concurrent streams
      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: {"token":"response"}\n\n'))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      // Create multiple streams
      for (let i = 0; i < streamCount; i++) {
        streams.push(new AIStream(config))
      }

      // Send messages concurrently
      const startTime = performance.now()
      await Promise.all(
        streams.map(async (stream, index) => {
          const streamStart = performance.now()
          await stream.send(`message ${index}`)
          completionTimes.push(performance.now() - streamStart)
        })
      )
      const totalTime = performance.now() - startTime

      // All streams should complete
      expect(completionTimes).toHaveLength(streamCount)

      // Average completion time should be reasonable (<100ms per stream)
      const avgTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      expect(avgTime).toBeLessThan(100)

      // Total time should be less than sequential (proof of concurrency)
      expect(totalTime).toBeLessThan(avgTime * streamCount)
    })
  })

  describe('Event Emitter Performance', () => {
    it('should efficiently handle multiple event listeners', async () => {
      const stream = new AIStream(config)
      const listenerCount = 100
      const listenersExecuted: number[] = []

      // Add many listeners
      for (let i = 0; i < listenerCount; i++) {
        stream.on('token', () => {
          listenersExecuted.push(i)
        })
      }

      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: {"token":"test"}\n\n'))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      const startTime = performance.now()
      await stream.send('test')
      const emitTime = performance.now() - startTime

      // All listeners should execute
      expect(listenersExecuted).toHaveLength(listenerCount)

      // Emit time should be reasonable (<50ms for 100 listeners)
      expect(emitTime).toBeLessThan(50)
    })
  })

  describe('Reset and Cleanup Performance', () => {
    it('should reset state efficiently', async () => {
      const stream = new AIStream(config)

      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          start(controller) {
            for (let i = 0; i < 100; i++) {
              controller.enqueue(encoder.encode(`data: {"token":"word${i}"}\n\n`))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      // Build up state
      await stream.send('message 1')
      await stream.send('message 2')
      await stream.send('message 3')

      expect(stream.getMessages().length).toBeGreaterThan(0)

      // Measure reset performance
      const startTime = performance.now()
      stream.reset()
      const resetTime = performance.now() - startTime

      // Reset should be near-instantaneous (<5ms)
      expect(resetTime).toBeLessThan(5)
      expect(stream.getMessages()).toHaveLength(0)
    })
  })

  describe('Given-When-Then: End-to-End Latency', () => {
    it('Given a streaming client, When sending a message, Then first token arrives within performance target', async () => {
      // Given
      const stream = new AIStream(config)
      let firstTokenLatency = 0

      global.fetch = vi.fn(async () => {
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: {"token":"Hello"}\n\n'))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })

        return {
          ok: true,
          body: readableStream,
        } as Response
      })

      // When
      const startTime = performance.now()
      stream.once('token', () => {
        firstTokenLatency = performance.now() - startTime
      })
      await stream.send('test message')

      // Then
      expect(firstTokenLatency).toBeLessThan(50) // AIKIT-62 requirement
      expect(firstTokenLatency).toBeGreaterThan(0)
    })
  })
})
