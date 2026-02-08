import { describe, it, expect, beforeEach } from 'vitest';
import { BetaFeedbackManager } from '../beta-feedback';
import type { BetaFeedback } from '../types';

describe('BetaFeedbackManager', () => {
  let manager: BetaFeedbackManager;

  beforeEach(() => {
    manager = new BetaFeedbackManager();
  });

  describe('submitFeedback', () => {
    it('should accept valid feedback', async () => {
      const feedback: BetaFeedback = {
        email: 'test@example.com',
        rating: 5,
        comment: 'Great product!',
        category: 'general',
      };

      const result = await manager.submitFeedback(feedback);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('should reject invalid rating', async () => {
      const feedback: BetaFeedback = {
        email: 'test@example.com',
        rating: 6,
        comment: 'Test',
        category: 'general',
      };

      await expect(manager.submitFeedback(feedback)).rejects.toThrow(
        'Rating must be between 1 and 5'
      );
    });

    it('should reject invalid email', async () => {
      const feedback: BetaFeedback = {
        email: 'invalid',
        rating: 5,
        comment: 'Test',
        category: 'general',
      };

      await expect(manager.submitFeedback(feedback)).rejects.toThrow('Invalid email format');
    });

    it('should accept feedback with attachments', async () => {
      const feedback: BetaFeedback = {
        email: 'test@example.com',
        rating: 4,
        comment: 'Bug found',
        category: 'bug',
        attachments: ['screenshot.png', 'logs.txt'],
      };

      const result = await manager.submitFeedback(feedback);

      expect(result.success).toBe(true);
      expect(result.attachments).toEqual(feedback.attachments);
    });

    it('should categorize feedback correctly', async () => {
      const categories = ['bug', 'feature', 'general', 'performance'];

      for (const category of categories) {
        const feedback: BetaFeedback = {
          email: 'test@example.com',
          rating: 5,
          comment: `Test ${category}`,
          category,
        };

        const result = await manager.submitFeedback(feedback);
        expect(result.category).toBe(category);
      }
    });
  });

  describe('getFeedback', () => {
    it('should retrieve feedback by email', async () => {
      const feedback: BetaFeedback = {
        email: 'test@example.com',
        rating: 5,
        comment: 'Great!',
        category: 'general',
      };

      await manager.submitFeedback(feedback);
      const results = await manager.getFeedback({ email: 'test@example.com' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].email).toBe('test@example.com');
    });

    it('should filter by category', async () => {
      await manager.submitFeedback({
        email: 'test1@example.com',
        rating: 5,
        comment: 'Bug report',
        category: 'bug',
      });

      await manager.submitFeedback({
        email: 'test2@example.com',
        rating: 4,
        comment: 'Feature request',
        category: 'feature',
      });

      const bugFeedback = await manager.getFeedback({ category: 'bug' });

      expect(bugFeedback.every(f => f.category === 'bug')).toBe(true);
    });

    it('should filter by rating', async () => {
      await manager.submitFeedback({
        email: 'test1@example.com',
        rating: 5,
        comment: 'Excellent',
        category: 'general',
      });

      await manager.submitFeedback({
        email: 'test2@example.com',
        rating: 3,
        comment: 'Average',
        category: 'general',
      });

      const highRated = await manager.getFeedback({ minRating: 4 });

      expect(highRated.every(f => f.rating >= 4)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should calculate feedback statistics', async () => {
      const feedbackItems: BetaFeedback[] = [
        { email: 'test1@example.com', rating: 5, comment: 'Great', category: 'general' },
        { email: 'test2@example.com', rating: 4, comment: 'Good', category: 'general' },
        { email: 'test3@example.com', rating: 3, comment: 'OK', category: 'bug' },
        { email: 'test4@example.com', rating: 5, comment: 'Excellent', category: 'feature' },
      ];

      for (const item of feedbackItems) {
        await manager.submitFeedback(item);
      }

      const stats = await manager.getStats();

      expect(stats.total).toBe(4);
      expect(stats.averageRating).toBe(4.25);
      expect(stats.byCategory.general).toBe(2);
    });
  });
});
