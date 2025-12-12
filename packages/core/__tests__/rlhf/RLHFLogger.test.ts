/**
 * RLHFLogger Tests
 *
 * Comprehensive test suite for RLHF logging system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RLHFLogger, createRLHFLogger } from '../../src/rlhf/RLHFLogger';
import { MemoryStorage } from '../../src/rlhf/storage/MemoryStorage';
import {
  RLHFConfig,
  StorageBackend,
  FeedbackType,
  BinaryFeedback,
  ExportFormat,
  FeedbackFilter,
} from '../../src/rlhf/types';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('RLHFLogger', () => {
  let logger: RLHFLogger;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `rlhf-test-${Date.now()}`);
  });

  afterEach(async () => {
    if (logger) {
      await logger.close();
    }
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should initialize logger with memory backend', async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
      };

      logger = new RLHFLogger(config);
      await logger.initialize();

      expect(logger).toBeDefined();
    });

    it('should initialize logger with local backend', async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.LOCAL,
        backendConfig: {
          local: {
            dataDir: tempDir,
          },
        },
      };

      logger = new RLHFLogger(config);
      await logger.initialize();

      expect(logger).toBeDefined();
    });

    it('should create logger with factory function', () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
      };

      logger = createRLHFLogger(config);
      expect(logger).toBeInstanceOf(RLHFLogger);
    });

    it('should apply default configuration', async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
      };

      logger = new RLHFLogger(config);
      await logger.initialize();

      const session = logger.getCurrentSession();
      expect(session).toBeDefined();
    });

    it('should throw error for custom backend without implementation', () => {
      const config: RLHFConfig = {
        backend: StorageBackend.CUSTOM,
      };

      expect(() => new RLHFLogger(config)).toThrow('Custom storage backend implementation required');
    });
  });

  describe('Interaction Logging', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should log basic interaction', async () => {
      const interactionId = await logger.logInteraction(
        'What is the capital of France?',
        'The capital of France is Paris.'
      );

      expect(interactionId).toBeDefined();
      expect(typeof interactionId).toBe('string');

      const interaction = await logger.getInteraction(interactionId);
      expect(interaction).toBeDefined();
      expect(interaction?.prompt).toBe('What is the capital of France?');
      expect(interaction?.response).toBe('The capital of France is Paris.');
    });

    it('should log interaction with metadata', async () => {
      const interactionId = await logger.logInteraction(
        'Tell me a joke',
        'Why did the chicken cross the road?',
        {
          model: 'gpt-4',
          modelParams: { temperature: 0.7, maxTokens: 100 },
          latency: 250,
          tokenUsage: { prompt: 10, completion: 20, total: 30 },
          userId: 'user123',
        }
      );

      const interaction = await logger.getInteraction(interactionId);
      expect(interaction?.model).toBe('gpt-4');
      expect(interaction?.modelParams?.temperature).toBe(0.7);
      expect(interaction?.latency).toBe(250);
      expect(interaction?.tokenUsage?.total).toBe(30);
      expect(interaction?.userId).toBe('user123');
    });

    it('should log interaction with conversation context', async () => {
      const interactionId = await logger.logInteraction(
        'What about Berlin?',
        'Berlin is the capital of Germany.',
        {
          context: [
            { role: 'user', content: 'What is the capital of France?' },
            { role: 'assistant', content: 'The capital of France is Paris.' },
          ],
        }
      );

      const interaction = await logger.getInteraction(interactionId);
      expect(interaction?.context).toHaveLength(2);
      expect(interaction?.context?.[0].role).toBe('user');
    });

    it('should auto-generate interaction IDs', async () => {
      const id1 = await logger.logInteraction('prompt1', 'response1');
      const id2 = await logger.logInteraction('prompt2', 'response2');

      expect(id1).not.toBe(id2);
    });

    it('should add interaction to current session', async () => {
      const interactionId = await logger.logInteraction('test prompt', 'test response');
      const session = logger.getCurrentSession();

      expect(session?.interactionIds).toContain(interactionId);
    });
  });

  describe('Binary Feedback', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should log thumbs up feedback', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logBinaryFeedback(
        interactionId,
        BinaryFeedback.THUMBS_UP
      );

      expect(feedbackId).toBeDefined();

      const feedback = await logger.getFeedback(feedbackId);
      expect(feedback?.type).toBe(FeedbackType.BINARY);
      expect((feedback?.data as any).value).toBe(BinaryFeedback.THUMBS_UP);
    });

    it('should log thumbs down feedback', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logBinaryFeedback(
        interactionId,
        BinaryFeedback.THUMBS_DOWN
      );

      const feedback = await logger.getFeedback(feedbackId);
      expect((feedback?.data as any).value).toBe(BinaryFeedback.THUMBS_DOWN);
    });

    it('should get feedback for interaction', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      await logger.logBinaryFeedback(interactionId, BinaryFeedback.THUMBS_UP);
      await logger.logBinaryFeedback(interactionId, BinaryFeedback.THUMBS_DOWN);

      const feedbackList = await logger.getFeedbackForInteraction(interactionId);
      expect(feedbackList).toHaveLength(2);
    });
  });

  describe('Rating Feedback', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should log rating feedback', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logRating(interactionId, 5);

      const feedback = await logger.getFeedback(feedbackId);
      expect(feedback?.type).toBe(FeedbackType.RATING);
      expect((feedback?.data as any).rating).toBe(5);
    });

    it('should log rating with comment', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logRating(interactionId, 4, 'Great response!');

      const feedback = await logger.getFeedback(feedbackId);
      expect((feedback?.data as any).rating).toBe(4);
      expect((feedback?.data as any).comment).toBe('Great response!');
    });

    it('should validate rating range', async () => {
      const interactionId = await logger.logInteraction('test', 'response');

      await expect(logger.logRating(interactionId, 0)).rejects.toThrow();
      await expect(logger.logRating(interactionId, 6)).rejects.toThrow();
    });

    it('should support custom max rating', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logRating(interactionId, 8, undefined, {
        maxRating: 10,
      });

      const feedback = await logger.getFeedback(feedbackId);
      expect((feedback?.data as any).maxRating).toBe(10);
    });
  });

  describe('Text Feedback', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should log text feedback', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logTextFeedback(
        interactionId,
        'This response was very helpful!'
      );

      const feedback = await logger.getFeedback(feedbackId);
      expect(feedback?.type).toBe(FeedbackType.TEXT);
      expect((feedback?.data as any).comment).toBe('This response was very helpful!');
    });

    it('should log text feedback with sentiment', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logTextFeedback(
        interactionId,
        'Great job!',
        'positive'
      );

      const feedback = await logger.getFeedback(feedbackId);
      expect((feedback?.data as any).sentiment).toBe('positive');
    });
  });

  describe('Multi-Dimensional Feedback', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should log multi-dimensional feedback', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logMultiDimensionalFeedback(interactionId, {
        accuracy: 5,
        helpfulness: 4,
        clarity: 5,
      });

      const feedback = await logger.getFeedback(feedbackId);
      expect(feedback?.type).toBe(FeedbackType.MULTI_DIMENSIONAL);
      expect((feedback?.data as any).dimensions.accuracy).toBe(5);
      expect((feedback?.data as any).dimensions.helpfulness).toBe(4);
    });

    it('should log multi-dimensional feedback with weights', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logMultiDimensionalFeedback(
        interactionId,
        { accuracy: 5, helpfulness: 4 },
        {
          weights: { accuracy: 0.7, helpfulness: 0.3 },
          overallComment: 'Good overall',
        }
      );

      const feedback = await logger.getFeedback(feedbackId);
      expect((feedback?.data as any).weights).toBeDefined();
      expect((feedback?.data as any).overallComment).toBe('Good overall');
    });
  });

  describe('Comparative Feedback', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should log comparative feedback', async () => {
      const id1 = await logger.logInteraction('test', 'response1');
      const id2 = await logger.logInteraction('test', 'response2');

      const feedbackId = await logger.logComparativeFeedback(id1, [id2]);

      const feedback = await logger.getFeedback(feedbackId);
      expect(feedback?.type).toBe(FeedbackType.COMPARATIVE);
      expect((feedback?.data as any).preferredResponseId).toBe(id1);
    });

    it('should log comparative feedback with reason and confidence', async () => {
      const id1 = await logger.logInteraction('test', 'response1');
      const id2 = await logger.logInteraction('test', 'response2');

      const feedbackId = await logger.logComparativeFeedback(id1, [id2], {
        reason: 'More accurate and detailed',
        confidenceLevel: 0.9,
      });

      const feedback = await logger.getFeedback(feedbackId);
      expect((feedback?.data as any).reason).toBe('More accurate and detailed');
      expect((feedback?.data as any).confidenceLevel).toBe(0.9);
    });

    it('should validate confidence level range', async () => {
      const id1 = await logger.logInteraction('test', 'response1');
      const id2 = await logger.logInteraction('test', 'response2');

      await expect(
        logger.logComparativeFeedback(id1, [id2], { confidenceLevel: 1.5 })
      ).rejects.toThrow();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should calculate basic statistics', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');
      await logger.logBinaryFeedback(id1, BinaryFeedback.THUMBS_UP);
      await logger.logRating(id2, 5);

      const stats = await logger.getFeedbackStats();

      expect(stats.totalInteractions).toBe(2);
      expect(stats.totalFeedback).toBe(2);
      expect(stats.feedbackRate).toBe(1);
    });

    it('should calculate binary feedback statistics', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');
      const id3 = await logger.logInteraction('test3', 'response3');

      await logger.logBinaryFeedback(id1, BinaryFeedback.THUMBS_UP);
      await logger.logBinaryFeedback(id2, BinaryFeedback.THUMBS_UP);
      await logger.logBinaryFeedback(id3, BinaryFeedback.THUMBS_DOWN);

      const stats = await logger.getFeedbackStats();

      expect(stats.binary?.thumbsUp).toBe(2);
      expect(stats.binary?.thumbsDown).toBe(1);
      expect(stats.binary?.ratio).toBeCloseTo(0.667, 2);
    });

    it('should calculate rating statistics', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');
      const id3 = await logger.logInteraction('test3', 'response3');

      await logger.logRating(id1, 5);
      await logger.logRating(id2, 4);
      await logger.logRating(id3, 5);

      const stats = await logger.getFeedbackStats();

      expect(stats.rating?.average).toBeCloseTo(4.667, 2);
      expect(stats.rating?.median).toBe(5);
      expect(stats.rating?.count).toBe(3);
      expect(stats.rating?.distribution[5]).toBe(2);
    });

    it('should calculate text feedback statistics', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');

      await logger.logTextFeedback(id1, 'Great!', 'positive');
      await logger.logTextFeedback(id2, 'Not helpful', 'negative');

      const stats = await logger.getFeedbackStats();

      expect(stats.text?.count).toBe(2);
      expect(stats.text?.sentimentDistribution?.positive).toBe(1);
      expect(stats.text?.sentimentDistribution?.negative).toBe(1);
    });

    it('should count feedback by type', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');

      await logger.logBinaryFeedback(id1, BinaryFeedback.THUMBS_UP);
      await logger.logRating(id2, 5);
      await logger.logTextFeedback(id1, 'Good');

      const stats = await logger.getFeedbackStats();

      expect(stats.byType[FeedbackType.BINARY]).toBe(1);
      expect(stats.byType[FeedbackType.RATING]).toBe(1);
      expect(stats.byType[FeedbackType.TEXT]).toBe(1);
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: true,
        batchSize: 5,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should batch interactions', async () => {
      const ids = [];
      for (let i = 0; i < 3; i++) {
        const id = await logger.logInteraction(`prompt${i}`, `response${i}`);
        ids.push(id);
      }

      // Flush manually
      await logger.flush();

      for (const id of ids) {
        const interaction = await logger.getInteraction(id);
        expect(interaction).toBeDefined();
      }
    });

    it('should auto-flush when batch size reached', async () => {
      const ids = [];
      for (let i = 0; i < 6; i++) {
        const id = await logger.logInteraction(`prompt${i}`, `response${i}`);
        ids.push(id);
      }

      // Should have auto-flushed
      const interaction = await logger.getInteraction(ids[0]);
      expect(interaction).toBeDefined();
    });

    it('should flush on close', async () => {
      const id = await logger.logInteraction('test', 'response');
      await logger.close();

      // Re-initialize to check persistence
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();

      // Note: Memory storage doesn't persist, so this is just testing the close flow
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
        enableSessionTracking: true,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should auto-start session on initialization', () => {
      const session = logger.getCurrentSession();
      expect(session).toBeDefined();
      expect(session?.id).toBeDefined();
    });

    it('should manually start session', () => {
      logger.endSession();
      const sessionId = logger.startSession('user123', { device: 'mobile' });

      const session = logger.getCurrentSession();
      expect(session?.id).toBe(sessionId);
      expect(session?.userId).toBe('user123');
      expect(session?.metadata?.device).toBe('mobile');
    });

    it('should track interactions in session', async () => {
      const id = await logger.logInteraction('test', 'response');
      const session = logger.getCurrentSession();

      expect(session?.interactionIds).toContain(id);
    });

    it('should track feedback in session', async () => {
      const interactionId = await logger.logInteraction('test', 'response');
      const feedbackId = await logger.logBinaryFeedback(
        interactionId,
        BinaryFeedback.THUMBS_UP
      );

      const session = logger.getCurrentSession();
      expect(session?.feedbackIds).toContain(feedbackId);
    });

    it('should end session', async () => {
      await logger.logInteraction('test', 'response');

      const session = logger.endSession();
      expect(session).toBeDefined();
      expect(session?.endTime).toBeDefined();

      const currentSession = logger.getCurrentSession();
      expect(currentSession).toBeNull();
    });

    it('should replace session on new session start', async () => {
      const session1Id = logger.getCurrentSession()?.id;
      const session2Id = logger.startSession();

      expect(session1Id).not.toBe(session2Id);
    });
  });

  describe('Query and Filtering', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should query feedback by time range', async () => {
      const start = new Date();
      const id = await logger.logInteraction('test', 'response');
      await logger.logBinaryFeedback(id, BinaryFeedback.THUMBS_UP);
      const end = new Date(Date.now() + 1000);

      const feedback = await logger.getFeedbackInRange(start, end);
      expect(feedback.length).toBeGreaterThan(0);
    });

    it('should query feedback with filters', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');

      await logger.logBinaryFeedback(id1, BinaryFeedback.THUMBS_UP, { userId: 'user1' });
      await logger.logRating(id2, 5, undefined, { userId: 'user2' });

      const filter: FeedbackFilter = {
        userId: 'user1',
      };

      const feedback = await logger.queryFeedback(filter);
      expect(feedback).toHaveLength(1);
      expect(feedback[0].userId).toBe('user1');
    });

    it('should filter by feedback type', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');

      await logger.logBinaryFeedback(id1, BinaryFeedback.THUMBS_UP);
      await logger.logRating(id2, 5);

      const filter: FeedbackFilter = {
        types: [FeedbackType.RATING],
      };

      const feedback = await logger.queryFeedback(filter);
      expect(feedback).toHaveLength(1);
      expect(feedback[0].type).toBe(FeedbackType.RATING);
    });

    it('should filter by rating range', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');
      const id3 = await logger.logInteraction('test3', 'response3');

      await logger.logRating(id1, 2);
      await logger.logRating(id2, 4);
      await logger.logRating(id3, 5);

      const filter: FeedbackFilter = {
        minRating: 4,
      };

      const feedback = await logger.queryFeedback(filter);
      expect(feedback).toHaveLength(2);
    });

    it('should apply limit and offset', async () => {
      for (let i = 0; i < 10; i++) {
        const id = await logger.logInteraction(`test${i}`, `response${i}`);
        await logger.logRating(id, 5);
      }

      const filter: FeedbackFilter = {
        limit: 5,
        offset: 3,
      };

      const feedback = await logger.queryFeedback(filter);
      expect(feedback).toHaveLength(5);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should export feedback as JSON', async () => {
      const id = await logger.logInteraction('test', 'response');
      await logger.logBinaryFeedback(id, BinaryFeedback.THUMBS_UP);

      const exported = await logger.exportFeedback(ExportFormat.JSON);

      expect(typeof exported).toBe('string');
      const data = JSON.parse(exported as string);
      expect(data.feedback).toBeDefined();
      expect(data.interactions).toBeDefined();
    });

    it('should export feedback as JSONL', async () => {
      const id = await logger.logInteraction('test', 'response');
      await logger.logBinaryFeedback(id, BinaryFeedback.THUMBS_UP);

      const exported = await logger.exportFeedback(ExportFormat.JSONL);

      expect(typeof exported).toBe('string');
      const lines = (exported as string).split('\n').filter(l => l.length > 0);
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should export feedback as CSV', async () => {
      const id = await logger.logInteraction('test', 'response');
      await logger.logBinaryFeedback(id, BinaryFeedback.THUMBS_UP);

      const exported = await logger.exportFeedback(ExportFormat.CSV);

      expect(typeof exported).toBe('string');
      expect((exported as string).includes('id,interaction_id')).toBe(true);
    });

    it('should export with time range filter', async () => {
      const start = new Date();
      const id = await logger.logInteraction('test', 'response');
      await logger.logBinaryFeedback(id, BinaryFeedback.THUMBS_UP);
      const end = new Date(Date.now() + 1000);

      const exported = await logger.exportFeedback(ExportFormat.JSON, {
        startTime: start,
        endTime: end,
      });

      const data = JSON.parse(exported as string);
      expect(data.timeRange).toBeDefined();
    });
  });

  describe('Analytics', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should get analytics results', async () => {
      const id1 = await logger.logInteraction('test1', 'response1');
      const id2 = await logger.logInteraction('test2', 'response2');

      await logger.logBinaryFeedback(id1, BinaryFeedback.THUMBS_UP);
      await logger.logRating(id2, 5);

      const analytics = await logger.getAnalytics();

      expect(analytics.stats).toBeDefined();
      expect(analytics.query).toBeDefined();
      expect(analytics.generatedAt).toBeDefined();
    });

    it('should get analytics with filters', async () => {
      const id = await logger.logInteraction('test', 'response');
      await logger.logRating(id, 5, undefined, { userId: 'user123' });

      const filter: FeedbackFilter = {
        userId: 'user123',
      };

      const analytics = await logger.getAnalytics(filter);

      expect(analytics.query.filters).toBeDefined();
      expect(analytics.stats.totalFeedback).toBe(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        autoGenerateIds: false,
      };
      logger = new RLHFLogger(config);
      await logger.initialize();
    });

    it('should throw error when ID required but not provided', async () => {
      await expect(logger.logInteraction('test', 'response')).rejects.toThrow();
    });
  });

  describe('Configuration Options', () => {
    it('should disable batching', async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
      };

      logger = new RLHFLogger(config);
      await logger.initialize();

      const id = await logger.logInteraction('test', 'response');
      const interaction = await logger.getInteraction(id);

      expect(interaction).toBeDefined();
    });

    it('should disable session tracking', async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableSessionTracking: false,
      };

      logger = new RLHFLogger(config);
      await logger.initialize();

      const session = logger.getCurrentSession();
      expect(session).toBeNull();
    });

    it('should apply default metadata', async () => {
      const config: RLHFConfig = {
        backend: StorageBackend.MEMORY,
        enableBatching: false,
        defaultMetadata: {
          app: 'test-app',
          version: '1.0.0',
        },
      };

      logger = new RLHFLogger(config);
      await logger.initialize();

      const id = await logger.logInteraction('test', 'response');
      const interaction = await logger.getInteraction(id);

      expect(interaction?.metadata?.['app']).toBe('test-app');
      expect(interaction?.metadata?.['version']).toBe('1.0.0');
    });
  });
});
