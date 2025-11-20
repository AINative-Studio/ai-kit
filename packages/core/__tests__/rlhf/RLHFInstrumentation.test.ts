import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RLHFInstrumentation, createInstrumentation } from '../../src/rlhf/RLHFInstrumentation'
import { AIStream } from '../../src/streaming/AIStream'
import type {
  CapturedInteraction,
  FeedbackEvent,
  InstrumentationConfig,
} from '../../src/rlhf/instrumentation-types'
import type { Message, Usage } from '../../src/types'

// Mock fetch globally
global.fetch = vi.fn()

describe('RLHFInstrumentation', () => {
  let instrumentation: RLHFInstrumentation

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (instrumentation) {
      instrumentation.destroy()
    }
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should create instance with default config', () => {
      instrumentation = new RLHFInstrumentation()
      expect(instrumentation).toBeInstanceOf(RLHFInstrumentation)
    })

    it('should create instance with custom config', () => {
      instrumentation = new RLHFInstrumentation({
        enabled: false,
        sampleRate: 0.5,
        maxBufferSize: 500,
      })

      const metrics = instrumentation.getMetrics()
      expect(metrics).toBeDefined()
      expect(metrics.totalInteractions).toBe(0)
    })

    it('should initialize with enabled state by default', () => {
      instrumentation = new RLHFInstrumentation()
      const metrics = instrumentation.getMetrics()
      expect(metrics.startedAt).toBeGreaterThan(0)
    })

    it('should initialize with disabled state when configured', () => {
      instrumentation = new RLHFInstrumentation({ enabled: false })
      expect(instrumentation).toBeDefined()
    })

    it('should initialize metrics correctly', () => {
      instrumentation = new RLHFInstrumentation()
      const metrics = instrumentation.getMetrics()

      expect(metrics.totalInteractions).toBe(0)
      expect(metrics.totalFeedback).toBe(0)
      expect(metrics.totalErrors).toBe(0)
      expect(metrics.bufferSize).toBe(0)
      expect(metrics.averageResponseTime).toBe(0)
      expect(metrics.feedbackRate).toBe(0)
      expect(metrics.errorRate).toBe(0)
    })
  })

  describe('createInstrumentation factory', () => {
    it('should create instrumentation instance', () => {
      instrumentation = createInstrumentation()
      expect(instrumentation).toBeInstanceOf(RLHFInstrumentation)
    })

    it('should pass config to constructor', () => {
      instrumentation = createInstrumentation({ sampleRate: 0.7 })
      expect(instrumentation).toBeInstanceOf(RLHFInstrumentation)
    })
  })

  describe('instrument method', () => {
    it('should instrument an AIStream', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      const instrumented = instrumentation.instrument(stream)
      expect(instrumented).toBe(stream)
    })

    it('should return stream unchanged when disabled', () => {
      instrumentation = new RLHFInstrumentation({ enabled: false })
      const stream = new AIStream({ endpoint: '/api/chat' })

      const instrumented = instrumentation.instrument(stream)
      expect(instrumented).toBe(stream)
    })

    it('should listen to stream message events', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      instrumentation.instrument(stream)

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      stream.emit('message', userMessage)
      expect(instrumentation.getMetrics().totalInteractions).toBe(0) // Not completed yet
    })

    it('should listen to stream token events', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      instrumentation.instrument(stream)
      stream.emit('token', 'Hello')

      // Should not throw
      expect(instrumentation).toBeDefined()
    })

    it('should listen to stream error events', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      instrumentation.instrument(stream)
      stream.emit('error', new Error('Test error'))

      const metrics = instrumentation.getMetrics()
      expect(metrics.totalErrors).toBe(1)
    })

    it('should listen to stream usage events', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      const usage: Usage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      }

      instrumentation.instrument(stream)
      stream.emit('usage', usage)

      // Should not throw
      expect(instrumentation).toBeDefined()
    })

    it('should handle stream reset events', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      instrumentation.instrument(stream)
      stream.emit('reset')

      // Should not throw
      expect(instrumentation).toBeDefined()
    })
  })

  describe('captureInteraction method', () => {
    it('should capture interaction with prompt and response', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now() + 1000,
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })

      expect(interaction).toBeDefined()
      expect(interaction?.prompt).toEqual(prompt)
      expect(interaction?.response).toEqual(response)
      expect(interaction?.id).toBeDefined()
      expect(interaction?.sessionId).toBeDefined()
    })

    it('should not capture when disabled', () => {
      instrumentation = new RLHFInstrumentation({ enabled: false })

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })
      expect(interaction).toBeNull()
    })

    it('should not capture when captureInteractions is false', () => {
      instrumentation = new RLHFInstrumentation({ captureInteractions: false })

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })
      expect(interaction).toBeNull()
    })

    it('should apply sampling rate', () => {
      instrumentation = new RLHFInstrumentation({ sampleRate: 0 })

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })
      expect(interaction).toBeNull()
    })

    it('should include usage data when provided', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const usage: Usage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      }

      const interaction = instrumentation.captureInteraction({ prompt, response, usage })

      expect(interaction?.usage).toEqual(usage)
    })

    it('should include error data when provided', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Error occurred',
        timestamp: Date.now(),
      }

      const error = new Error('Test error')

      const interaction = instrumentation.captureInteraction({ prompt, response, error })

      expect(interaction?.error).toBeDefined()
      expect(interaction?.error?.message).toBe('Test error')
    })

    it('should emit interaction-captured event', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const callback = vi.fn()
      instrumentation.on('interaction-captured', callback)

      instrumentation.captureInteraction({ prompt, response })

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should call onInteractionCaptured callback', () => {
      const callback = vi.fn()
      instrumentation = new RLHFInstrumentation({ onInteractionCaptured: callback })

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should update metrics after capturing', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now() + 1000,
      }

      instrumentation.captureInteraction({ prompt, response })

      const metrics = instrumentation.getMetrics()
      expect(metrics.totalInteractions).toBe(1)
      expect(metrics.bufferSize).toBe(1)
    })
  })

  describe('captureFeedback method', () => {
    it('should capture feedback event', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })

      instrumentation.captureFeedback({
        interactionId: interaction!.id,
        type: 'thumbs-up',
        value: true,
      })

      const metrics = instrumentation.getMetrics()
      expect(metrics.totalFeedback).toBe(1)
    })

    it('should not capture feedback when disabled', () => {
      instrumentation = new RLHFInstrumentation({ enabled: false })

      instrumentation.captureFeedback({
        interactionId: 'test-id',
        type: 'thumbs-up',
        value: true,
      })

      const metrics = instrumentation.getMetrics()
      expect(metrics.totalFeedback).toBe(0)
    })

    it('should not capture feedback when captureFeedback is false', () => {
      instrumentation = new RLHFInstrumentation({ captureFeedback: false })

      instrumentation.captureFeedback({
        interactionId: 'test-id',
        type: 'thumbs-up',
        value: true,
      })

      const metrics = instrumentation.getMetrics()
      expect(metrics.totalFeedback).toBe(0)
    })

    it('should attach feedback to interaction', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })

      instrumentation.captureFeedback({
        interactionId: interaction!.id,
        type: 'thumbs-up',
        value: true,
      })

      const interactions = instrumentation.getInteractions()
      expect(interactions[0].feedback).toHaveLength(1)
      expect(interactions[0].feedback![0].type).toBe('thumbs-up')
    })

    it('should emit feedback-captured event', () => {
      instrumentation = new RLHFInstrumentation()

      const callback = vi.fn()
      instrumentation.on('feedback-captured', callback)

      instrumentation.captureFeedback({
        interactionId: 'test-id',
        type: 'thumbs-up',
        value: true,
      })

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should call onFeedbackCaptured callback', () => {
      const callback = vi.fn()
      instrumentation = new RLHFInstrumentation({ onFeedbackCaptured: callback })

      instrumentation.captureFeedback({
        interactionId: 'test-id',
        type: 'thumbs-up',
        value: true,
      })

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should update feedback metrics', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })

      instrumentation.captureFeedback({
        interactionId: interaction!.id,
        type: 'thumbs-up',
        value: true,
      })

      const metrics = instrumentation.getMetrics()
      expect(metrics.feedbackRate).toBe(1)
      expect(metrics.positiveFeedbackRate).toBe(1)
    })
  })

  describe('collectContext method', () => {
    it('should collect context data', () => {
      instrumentation = new RLHFInstrumentation()
      const context = instrumentation.collectContext()

      expect(context).toBeDefined()
      expect(context.timezone).toBeDefined()
    })

    it('should return empty context when collectContext is false', () => {
      instrumentation = new RLHFInstrumentation({ collectContext: false })
      const context = instrumentation.collectContext()

      expect(context).toEqual({})
    })

    it('should include custom context when provided', () => {
      instrumentation = new RLHFInstrumentation({
        customContext: { environment: 'test' },
      })
      const context = instrumentation.collectContext()

      expect(context.custom).toEqual({ environment: 'test' })
    })
  })

  describe('enable and disable methods', () => {
    it('should enable instrumentation', () => {
      instrumentation = new RLHFInstrumentation({ enabled: false })

      instrumentation.enable()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })
      expect(interaction).toBeDefined()
    })

    it('should disable instrumentation', () => {
      instrumentation = new RLHFInstrumentation()

      instrumentation.disable()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })
      expect(interaction).toBeNull()
    })

    it('should emit enabled event', () => {
      instrumentation = new RLHFInstrumentation({ enabled: false })

      const callback = vi.fn()
      instrumentation.on('enabled', callback)

      instrumentation.enable()

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should emit disabled event', () => {
      instrumentation = new RLHFInstrumentation()

      const callback = vi.fn()
      instrumentation.on('disabled', callback)

      instrumentation.disable()

      expect(callback).toHaveBeenCalledOnce()
    })
  })

  describe('getMetrics method', () => {
    it('should return current metrics', () => {
      instrumentation = new RLHFInstrumentation()

      const metrics = instrumentation.getMetrics()

      expect(metrics.totalInteractions).toBe(0)
      expect(metrics.totalFeedback).toBe(0)
      expect(metrics.totalErrors).toBe(0)
    })

    it('should return metrics copy, not reference', () => {
      instrumentation = new RLHFInstrumentation()

      const metrics1 = instrumentation.getMetrics()
      const metrics2 = instrumentation.getMetrics()

      expect(metrics1).not.toBe(metrics2)
    })
  })

  describe('getInteractions method', () => {
    beforeEach(() => {
      instrumentation = new RLHFInstrumentation()
    })

    it('should return all interactions', () => {
      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })
      instrumentation.captureInteraction({ prompt, response })

      const interactions = instrumentation.getInteractions()
      expect(interactions).toHaveLength(2)
    })

    it('should filter by session ID', () => {
      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })

      const interactions = instrumentation.getInteractions({
        sessionId: interaction!.sessionId,
      })

      expect(interactions).toHaveLength(1)
    })

    it('should filter by date range', () => {
      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      const interactions = instrumentation.getInteractions({
        startDate: Date.now() - 1000,
        endDate: Date.now() + 1000,
      })

      expect(interactions).toHaveLength(1)
    })

    it('should filter by feedback presence', () => {
      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })

      instrumentation.captureFeedback({
        interactionId: interaction!.id,
        type: 'thumbs-up',
        value: true,
      })

      const withFeedback = instrumentation.getInteractions({ hasFeedback: true })
      const withoutFeedback = instrumentation.getInteractions({ hasFeedback: false })

      expect(withFeedback).toHaveLength(1)
      expect(withoutFeedback).toHaveLength(0)
    })

    it('should apply limit and offset', () => {
      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })
      instrumentation.captureInteraction({ prompt, response })
      instrumentation.captureInteraction({ prompt, response })

      const interactions = instrumentation.getInteractions({
        limit: 2,
        offset: 1,
      })

      expect(interactions).toHaveLength(2)
    })
  })

  describe('clear method', () => {
    it('should clear all captured data', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      instrumentation.clear()

      const interactions = instrumentation.getInteractions()
      expect(interactions).toHaveLength(0)

      const metrics = instrumentation.getMetrics()
      expect(metrics.bufferSize).toBe(0)
    })
  })

  describe('flush method', () => {
    it('should flush buffered interactions', async () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      const callback = vi.fn()
      instrumentation.on('flushed', callback)

      await instrumentation.flush()

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should not flush when buffer is empty', async () => {
      instrumentation = new RLHFInstrumentation()

      const callback = vi.fn()
      instrumentation.on('flushed', callback)

      await instrumentation.flush()

      expect(callback).not.toHaveBeenCalled()
    })

    it('should upload to remote endpoint when configured', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
      global.fetch = mockFetch

      instrumentation = new RLHFInstrumentation({
        storage: 'remote',
        remoteEndpoint: 'https://api.example.com/rlhf',
      })

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      await instrumentation.flush()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/rlhf',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })
  })

  describe('custom instrumentors', () => {
    it('should add custom instrumentor', () => {
      instrumentation = new RLHFInstrumentation()

      const instrumentor = vi.fn((interaction: CapturedInteraction) => interaction)
      instrumentation.addInstrumentor(instrumentor)

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      expect(instrumentor).toHaveBeenCalledOnce()
    })

    it('should remove custom instrumentor', () => {
      instrumentation = new RLHFInstrumentation()

      const instrumentor = vi.fn((interaction: CapturedInteraction) => interaction)
      instrumentation.addInstrumentor(instrumentor)
      instrumentation.removeInstrumentor(instrumentor)

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      expect(instrumentor).not.toHaveBeenCalled()
    })

    it('should allow instrumentor to modify interaction', () => {
      instrumentation = new RLHFInstrumentation()

      const instrumentor = (interaction: CapturedInteraction) => ({
        ...interaction,
        metadata: { customField: 'customValue' },
      })

      instrumentation.addInstrumentor(instrumentor)

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      const interactions = instrumentation.getInteractions()
      expect(interactions[0].metadata?.customField).toBe('customValue')
    })

    it('should allow instrumentor to filter interaction', () => {
      instrumentation = new RLHFInstrumentation()

      const instrumentor = () => null

      instrumentation.addInstrumentor(instrumentor)

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      const interaction = instrumentation.captureInteraction({ prompt, response })

      expect(interaction).toBeNull()
    })
  })

  describe('middleware', () => {
    it('should add middleware', () => {
      instrumentation = new RLHFInstrumentation()

      const middleware = vi.fn((interaction: CapturedInteraction, next: () => void) => next())
      instrumentation.addMiddleware(middleware)

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      expect(middleware).toHaveBeenCalledOnce()
    })

    it('should remove middleware', () => {
      instrumentation = new RLHFInstrumentation()

      const middleware = vi.fn((interaction: CapturedInteraction, next: () => void) => next())
      instrumentation.addMiddleware(middleware)
      instrumentation.removeMiddleware(middleware)

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      expect(middleware).not.toHaveBeenCalled()
    })
  })

  describe('destroy method', () => {
    it('should clean up resources', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      instrumentation.destroy()

      const interactions = instrumentation.getInteractions()
      expect(interactions).toHaveLength(0)
    })

    it('should remove all listeners', () => {
      instrumentation = new RLHFInstrumentation()

      const callback = vi.fn()
      instrumentation.on('interaction-captured', callback)

      instrumentation.destroy()

      expect(instrumentation.listenerCount('interaction-captured')).toBe(0)
    })
  })

  describe('buffer management', () => {
    it('should emit buffer-full event when buffer reaches max size', () => {
      instrumentation = new RLHFInstrumentation({ maxBufferSize: 2 })

      const callback = vi.fn()
      instrumentation.on('buffer-full', callback)

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })
      instrumentation.captureInteraction({ prompt, response })

      expect(callback).toHaveBeenCalledOnce()
    })

    it('should call onBufferFull callback when buffer is full', () => {
      const callback = vi.fn()
      instrumentation = new RLHFInstrumentation({
        maxBufferSize: 1,
        onBufferFull: callback,
      })

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })

      expect(callback).toHaveBeenCalledOnce()
    })
  })

  describe('error handling', () => {
    it('should capture errors from stream', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      instrumentation.instrument(stream)

      const callback = vi.fn()
      instrumentation.on('error-captured', callback)

      stream.emit('error', new Error('Test error'))

      expect(callback).toHaveBeenCalledOnce()
      expect(instrumentation.getMetrics().totalErrors).toBe(1)
    })

    it('should not capture errors when captureErrors is false', () => {
      instrumentation = new RLHFInstrumentation({ captureErrors: false })
      const stream = new AIStream({ endpoint: '/api/chat' })

      instrumentation.instrument(stream)

      stream.emit('error', new Error('Test error'))

      expect(instrumentation.getMetrics().totalErrors).toBe(0)
    })
  })

  describe('session tracking', () => {
    it('should track interactions per session', () => {
      instrumentation = new RLHFInstrumentation()

      const prompt: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const response: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      }

      instrumentation.captureInteraction({ prompt, response })
      instrumentation.captureInteraction({ prompt, response })

      const metrics = instrumentation.getMetrics()
      const sessionCounts = Array.from(metrics.interactionsPerSession.values())

      expect(sessionCounts[0]).toBe(2)
    })
  })

  describe('complete interaction flow', () => {
    it('should capture complete interaction from stream events', () => {
      instrumentation = new RLHFInstrumentation()
      const stream = new AIStream({ endpoint: '/api/chat' })

      instrumentation.instrument(stream)

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      }

      const assistantMessage: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now() + 1000,
      }

      stream.emit('message', userMessage)
      stream.emit('message', assistantMessage)

      const metrics = instrumentation.getMetrics()
      expect(metrics.totalInteractions).toBe(1)

      const interactions = instrumentation.getInteractions()
      expect(interactions[0].prompt.content).toBe('Hello')
      expect(interactions[0].response.content).toBe('Hi there!')
    })
  })
})
