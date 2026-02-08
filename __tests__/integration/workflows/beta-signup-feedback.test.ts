/**
 * Integration Test: Beta Signup → Feedback Collection → Analytics Workflow
 *
 * Tests the complete workflow from beta program signup through feedback
 * collection to analytics aggregation and export.
 *
 * @group integration
 * @group rlhf
 * @group analytics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  FeedbackType,
  BinaryFeedback,
  StorageBackend,
  type Feedback,
  type InteractionLog,
  type RLHFConfig,
} from '../../../packages/core/src/rlhf/types'

describe('Integration: Beta Signup → Feedback Collection → Analytics', () => {
  let mockStorage: any
  let sessionId: string
  let userId: string

  beforeEach(() => {
    sessionId = `session-${Date.now()}`
    userId = `user-${Date.now()}`

    // Mock storage backend
    mockStorage = {
      interactions: new Map<string, InteractionLog>(),
      feedback: new Map<string, Feedback>(),

      async initialize() {},

      async storeInteraction(interaction: InteractionLog) {
        this.interactions.set(interaction.id, interaction)
      },

      async storeFeedback(feedback: Feedback) {
        this.feedback.set(feedback.id, feedback)
      },

      async storeInteractionsBatch(interactions: InteractionLog[]) {
        interactions.forEach(i => this.interactions.set(i.id, i))
      },

      async storeFeedbackBatch(feedbackList: Feedback[]) {
        feedbackList.forEach(f => this.feedback.set(f.id, f))
      },

      async getInteraction(id: string) {
        return this.interactions.get(id) || null
      },

      async getFeedback(id: string) {
        return this.feedback.get(id) || null
      },

      async getFeedbackForInteraction(interactionId: string) {
        return Array.from(this.feedback.values()).filter(
          f => f.interactionId === interactionId
        )
      },

      async getInteractions(startTime: Date, endTime: Date, limit?: number) {
        const results = Array.from(this.interactions.values()).filter(
          i => i.timestamp >= startTime && i.timestamp <= endTime
        )
        return limit ? results.slice(0, limit) : results
      },

      async getFeedbackInRange(startTime: Date, endTime: Date, limit?: number) {
        const results = Array.from(this.feedback.values()).filter(
          f => f.timestamp >= startTime && f.timestamp <= endTime
        )
        return limit ? results.slice(0, limit) : results
      },

      async calculateStats(startTime?: Date, endTime?: Date) {
        const allFeedback = Array.from(this.feedback.values())
        const filtered = startTime && endTime
          ? allFeedback.filter(f => f.timestamp >= startTime && f.timestamp <= endTime)
          : allFeedback

        const totalInteractions = this.interactions.size
        const totalFeedback = filtered.length

        return {
          totalInteractions,
          totalFeedback,
          feedbackRate: totalInteractions > 0 ? totalFeedback / totalInteractions : 0,
          timeRange: {
            start: startTime || new Date(0),
            end: endTime || new Date(),
          },
          byType: {},
        }
      },

      async exportData(format: string, startTime?: Date, endTime?: Date) {
        const interactions = Array.from(this.interactions.values())
        const feedback = Array.from(this.feedback.values())
        return JSON.stringify({ interactions, feedback })
      },

      async close() {
        this.interactions.clear()
        this.feedback.clear()
      },
    }
  })

  afterEach(async () => {
    await mockStorage.close()
    vi.clearAllMocks()
  })

  describe('Given a new user signs up for the beta program', () => {
    describe('When they complete the signup process', () => {
      it('Then their session should be tracked', async () => {
        // Arrange
        const signupData = {
          userId,
          email: 'beta-user@example.com',
          interests: ['AI', 'video processing', 'transcription'],
          source: 'landing-page',
        }

        // Act
        const session = {
          id: sessionId,
          userId: signupData.userId,
          startTime: new Date(),
          metadata: {
            signupSource: signupData.source,
            interests: signupData.interests,
          },
        }

        // Assert
        expect(session.id).toBeDefined()
        expect(session.userId).toBe(userId)
        expect(session.metadata.signupSource).toBe('landing-page')
      })

      it('Then their first interaction should be logged', async () => {
        // Arrange
        const interaction: InteractionLog = {
          id: `interaction-${Date.now()}`,
          prompt: 'Welcome! How can I help you today?',
          response: 'I would like to learn about video transcription features.',
          model: 'claude-sonnet-4',
          userId,
          sessionId,
          timestamp: new Date(),
          metadata: {
            isFirstInteraction: true,
            signupCompleted: true,
          },
        }

        // Act
        await mockStorage.storeInteraction(interaction)

        // Assert
        const retrieved = await mockStorage.getInteraction(interaction.id)
        expect(retrieved).toBeDefined()
        expect(retrieved?.userId).toBe(userId)
        expect(retrieved?.metadata.isFirstInteraction).toBe(true)
      })
    })

    describe('When they start using the platform', () => {
      it('Then multiple interactions should be tracked in sequence', async () => {
        // Arrange
        const interactions: InteractionLog[] = [
          {
            id: 'int-1',
            prompt: 'How do I record my screen?',
            response: 'You can use the ScreenRecorder class...',
            model: 'claude-sonnet-4',
            userId,
            sessionId,
            timestamp: new Date(),
            latency: 234,
          },
          {
            id: 'int-2',
            prompt: 'Can I add camera overlay?',
            response: 'Yes, you can use PIP composition...',
            model: 'claude-sonnet-4',
            userId,
            sessionId,
            timestamp: new Date(Date.now() + 1000),
            latency: 189,
          },
          {
            id: 'int-3',
            prompt: 'How do I transcribe the recording?',
            response: 'Use the transcribeAudio function...',
            model: 'claude-sonnet-4',
            userId,
            sessionId,
            timestamp: new Date(Date.now() + 2000),
            latency: 256,
          },
        ]

        // Act
        await mockStorage.storeInteractionsBatch(interactions)

        // Assert
        const retrieved = await mockStorage.getInteractions(
          new Date(0),
          new Date(Date.now() + 10000)
        )
        expect(retrieved).toHaveLength(3)
        expect(retrieved.map(i => i.id)).toEqual(['int-1', 'int-2', 'int-3'])
      })
    })
  })

  describe('Given users provide feedback on their experience', () => {
    describe('When they submit binary thumbs up/down feedback', () => {
      it('Then positive feedback should be stored correctly', async () => {
        // Arrange
        const interactionId = 'int-positive'
        await mockStorage.storeInteraction({
          id: interactionId,
          prompt: 'Test prompt',
          response: 'Helpful response',
          userId,
          sessionId,
          timestamp: new Date(),
        })

        const feedback: Feedback = {
          id: `feedback-${Date.now()}`,
          interactionId,
          type: FeedbackType.BINARY,
          data: {
            value: BinaryFeedback.THUMBS_UP,
            timestamp: new Date(),
          },
          userId,
          sessionId,
          timestamp: new Date(),
          source: 'web-app',
        }

        // Act
        await mockStorage.storeFeedback(feedback)

        // Assert
        const retrieved = await mockStorage.getFeedbackForInteraction(interactionId)
        expect(retrieved).toHaveLength(1)
        expect(retrieved[0].type).toBe(FeedbackType.BINARY)
        expect((retrieved[0].data as any).value).toBe(BinaryFeedback.THUMBS_UP)
      })

      it('Then negative feedback should be captured with context', async () => {
        // Arrange
        const interactionId = 'int-negative'
        await mockStorage.storeInteraction({
          id: interactionId,
          prompt: 'Test prompt',
          response: 'Unhelpful response',
          userId,
          sessionId,
          timestamp: new Date(),
        })

        const feedback: Feedback = {
          id: `feedback-neg-${Date.now()}`,
          interactionId,
          type: FeedbackType.BINARY,
          data: {
            value: BinaryFeedback.THUMBS_DOWN,
            timestamp: new Date(),
          },
          userId,
          sessionId,
          timestamp: new Date(),
          metadata: {
            reason: 'incorrect-information',
            details: 'The response did not address my question about PIP',
          },
        }

        // Act
        await mockStorage.storeFeedback(feedback)

        // Assert
        const retrieved = await mockStorage.getFeedback(feedback.id)
        expect(retrieved).toBeDefined()
        expect(retrieved?.metadata?.reason).toBe('incorrect-information')
      })
    })

    describe('When they submit rating feedback', () => {
      it('Then 1-5 star ratings should be recorded', async () => {
        // Arrange
        const interactionId = 'int-rating'
        await mockStorage.storeInteraction({
          id: interactionId,
          prompt: 'Explain video encoding',
          response: 'Detailed explanation...',
          userId,
          sessionId,
          timestamp: new Date(),
        })

        const feedback: Feedback = {
          id: `feedback-rating-${Date.now()}`,
          interactionId,
          type: FeedbackType.RATING,
          data: {
            rating: 4,
            maxRating: 5,
            comment: 'Very helpful explanation, could use more examples',
            timestamp: new Date(),
          },
          userId,
          sessionId,
          timestamp: new Date(),
        }

        // Act
        await mockStorage.storeFeedback(feedback)

        // Assert
        const retrieved = await mockStorage.getFeedback(feedback.id)
        expect(retrieved).toBeDefined()
        expect((retrieved!.data as any).rating).toBe(4)
        expect((retrieved!.data as any).comment).toContain('helpful')
      })
    })

    describe('When they submit detailed text feedback', () => {
      it('Then comprehensive feedback should be preserved', async () => {
        // Arrange
        const interactionId = 'int-text'
        await mockStorage.storeInteraction({
          id: interactionId,
          prompt: 'Feature request for transcription',
          response: 'Thank you for the suggestion',
          userId,
          sessionId,
          timestamp: new Date(),
        })

        const feedback: Feedback = {
          id: `feedback-text-${Date.now()}`,
          interactionId,
          type: FeedbackType.TEXT,
          data: {
            comment: 'It would be great to have speaker diarization support in the transcription feature. This would help identify different speakers in meetings.',
            sentiment: 'positive' as const,
            timestamp: new Date(),
          },
          userId,
          sessionId,
          timestamp: new Date(),
          metadata: {
            category: 'feature-request',
            priority: 'medium',
          },
        }

        // Act
        await mockStorage.storeFeedback(feedback)

        // Assert
        const retrieved = await mockStorage.getFeedback(feedback.id)
        expect(retrieved).toBeDefined()
        expect((retrieved!.data as any).comment).toContain('speaker diarization')
        expect((retrieved!.data as any).sentiment).toBe('positive')
      })
    })

    describe('When they submit multi-dimensional feedback', () => {
      it('Then ratings across multiple dimensions should be captured', async () => {
        // Arrange
        const interactionId = 'int-multi'
        await mockStorage.storeInteraction({
          id: interactionId,
          prompt: 'Help with screen recording setup',
          response: 'Comprehensive setup guide...',
          userId,
          sessionId,
          timestamp: new Date(),
        })

        const feedback: Feedback = {
          id: `feedback-multi-${Date.now()}`,
          interactionId,
          type: FeedbackType.MULTI_DIMENSIONAL,
          data: {
            dimensions: {
              accuracy: 5,
              completeness: 4,
              clarity: 5,
              timeliness: 4,
            },
            weights: {
              accuracy: 0.4,
              completeness: 0.3,
              clarity: 0.2,
              timeliness: 0.1,
            },
            overallComment: 'Excellent guide with clear steps',
            timestamp: new Date(),
          },
          userId,
          sessionId,
          timestamp: new Date(),
        }

        // Act
        await mockStorage.storeFeedback(feedback)

        // Assert
        const retrieved = await mockStorage.getFeedback(feedback.id)
        expect(retrieved).toBeDefined()
        const data = retrieved!.data as any
        expect(data.dimensions.accuracy).toBe(5)
        expect(data.dimensions.clarity).toBe(5)
        expect(data.weights.accuracy).toBe(0.4)
      })
    })
  })

  describe('Given feedback needs to be analyzed for insights', () => {
    describe('When calculating aggregate statistics', () => {
      it('Then feedback rates should be computed correctly', async () => {
        // Arrange - Add interactions
        await mockStorage.storeInteractionsBatch([
          { id: '1', prompt: 'Q1', response: 'A1', userId, sessionId, timestamp: new Date() },
          { id: '2', prompt: 'Q2', response: 'A2', userId, sessionId, timestamp: new Date() },
          { id: '3', prompt: 'Q3', response: 'A3', userId, sessionId, timestamp: new Date() },
          { id: '4', prompt: 'Q4', response: 'A4', userId, sessionId, timestamp: new Date() },
        ])

        // Add feedback for 2 out of 4 interactions
        await mockStorage.storeFeedbackBatch([
          {
            id: 'f1',
            interactionId: '1',
            type: FeedbackType.BINARY,
            data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
            timestamp: new Date(),
          },
          {
            id: 'f2',
            interactionId: '2',
            type: FeedbackType.BINARY,
            data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
            timestamp: new Date(),
          },
        ])

        // Act
        const stats = await mockStorage.calculateStats()

        // Assert
        expect(stats.totalInteractions).toBe(4)
        expect(stats.totalFeedback).toBe(2)
        expect(stats.feedbackRate).toBe(0.5) // 50% feedback rate
      })

      it('Then time-based filtering should work correctly', async () => {
        // Arrange
        const now = Date.now()
        const yesterday = new Date(now - 24 * 60 * 60 * 1000)
        const tomorrow = new Date(now + 24 * 60 * 60 * 1000)

        await mockStorage.storeFeedback({
          id: 'old-feedback',
          interactionId: 'int-old',
          type: FeedbackType.BINARY,
          data: { value: BinaryFeedback.THUMBS_UP, timestamp: yesterday },
          timestamp: yesterday,
        })

        await mockStorage.storeFeedback({
          id: 'new-feedback',
          interactionId: 'int-new',
          type: FeedbackType.BINARY,
          data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
          timestamp: new Date(),
        })

        // Act
        const todayStats = await mockStorage.calculateStats(new Date(), tomorrow)

        // Assert - Should only include today's feedback
        expect(todayStats.totalFeedback).toBe(1)
      })
    })

    describe('When exporting feedback data', () => {
      it('Then data should be exportable in JSON format', async () => {
        // Arrange
        await mockStorage.storeInteraction({
          id: 'export-int',
          prompt: 'Test',
          response: 'Response',
          userId,
          sessionId,
          timestamp: new Date(),
        })

        await mockStorage.storeFeedback({
          id: 'export-feedback',
          interactionId: 'export-int',
          type: FeedbackType.RATING,
          data: { rating: 5, timestamp: new Date() },
          timestamp: new Date(),
        })

        // Act
        const exported = await mockStorage.exportData('json')
        const parsed = JSON.parse(exported)

        // Assert
        expect(parsed.interactions).toHaveLength(1)
        expect(parsed.feedback).toHaveLength(1)
        expect(parsed.interactions[0].id).toBe('export-int')
        expect(parsed.feedback[0].id).toBe('export-feedback')
      })
    })
  })

  describe('Given batch operations are needed for performance', () => {
    describe('When processing large volumes of feedback', () => {
      it('Then batch storage should handle multiple items efficiently', async () => {
        // Arrange
        const batchSize = 100
        const feedbackBatch: Feedback[] = []

        for (let i = 0; i < batchSize; i++) {
          feedbackBatch.push({
            id: `batch-feedback-${i}`,
            interactionId: `batch-int-${i}`,
            type: FeedbackType.BINARY,
            data: {
              value: i % 2 === 0 ? BinaryFeedback.THUMBS_UP : BinaryFeedback.THUMBS_DOWN,
              timestamp: new Date(),
            },
            timestamp: new Date(),
          })
        }

        // Act
        const startTime = Date.now()
        await mockStorage.storeFeedbackBatch(feedbackBatch)
        const duration = Date.now() - startTime

        // Assert
        expect(mockStorage.feedback.size).toBe(batchSize)
        expect(duration).toBeLessThan(1000) // Should complete in < 1 second
      })
    })
  })

  describe('Given error conditions in the feedback workflow', () => {
    describe('When feedback is submitted for non-existent interaction', () => {
      it('Then it should still be stored with warning', async () => {
        // Arrange
        const feedback: Feedback = {
          id: 'orphan-feedback',
          interactionId: 'non-existent-interaction',
          type: FeedbackType.BINARY,
          data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
          timestamp: new Date(),
        }

        // Act
        await mockStorage.storeFeedback(feedback)

        // Assert
        const retrieved = await mockStorage.getFeedback(feedback.id)
        expect(retrieved).toBeDefined()
        expect(retrieved?.interactionId).toBe('non-existent-interaction')
      })
    })

    describe('When anonymous feedback is submitted', () => {
      it('Then it should be accepted without userId', async () => {
        // Arrange
        const anonymousFeedback: Feedback = {
          id: 'anon-feedback',
          interactionId: 'some-interaction',
          type: FeedbackType.RATING,
          data: { rating: 3, timestamp: new Date() },
          timestamp: new Date(),
          metadata: { anonymous: true },
        }

        // Act
        await mockStorage.storeFeedback(anonymousFeedback)

        // Assert
        const retrieved = await mockStorage.getFeedback(anonymousFeedback.id)
        expect(retrieved).toBeDefined()
        expect(retrieved?.userId).toBeUndefined()
        expect(retrieved?.metadata?.anonymous).toBe(true)
      })
    })
  })

  describe('Given cross-session analytics requirements', () => {
    describe('When tracking user journey across multiple sessions', () => {
      it('Then feedback from different sessions should be aggregated by user', async () => {
        // Arrange
        const session1 = 'session-1'
        const session2 = 'session-2'

        await mockStorage.storeFeedbackBatch([
          {
            id: 'f-s1-1',
            interactionId: 'int-s1-1',
            type: FeedbackType.BINARY,
            data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
            userId,
            sessionId: session1,
            timestamp: new Date(),
          },
          {
            id: 'f-s2-1',
            interactionId: 'int-s2-1',
            type: FeedbackType.BINARY,
            data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
            userId,
            sessionId: session2,
            timestamp: new Date(),
          },
        ])

        // Act
        const allFeedback = Array.from(mockStorage.feedback.values())
        const userFeedback = allFeedback.filter(f => f.userId === userId)

        // Assert
        expect(userFeedback).toHaveLength(2)
        expect(new Set(userFeedback.map(f => f.sessionId))).toEqual(new Set([session1, session2]))
      })
    })
  })

  describe('Given feedback collection performance requirements', () => {
    describe('When measuring feedback submission time', () => {
      it('Then feedback should be stored within acceptable latency', async () => {
        // Arrange
        const feedback: Feedback = {
          id: 'perf-test',
          interactionId: 'perf-int',
          type: FeedbackType.BINARY,
          data: { value: BinaryFeedback.THUMBS_UP, timestamp: new Date() },
          timestamp: new Date(),
        }

        // Act
        const start = Date.now()
        await mockStorage.storeFeedback(feedback)
        const latency = Date.now() - start

        // Assert
        expect(latency).toBeLessThan(100) // Should complete in < 100ms
      })
    })
  })
})
