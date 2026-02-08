import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BetaSignupManager } from '../beta-signup';
import type { BetaSignupData } from '../types';

describe('BetaSignupManager', () => {
  let manager: BetaSignupManager;

  beforeEach(() => {
    manager = new BetaSignupManager();
  });

  describe('signup', () => {
    it('should accept valid email and name', async () => {
      const data: BetaSignupData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await manager.signup(data);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.email).toBe(data.email);
    });

    it('should reject invalid email format', async () => {
      const data: BetaSignupData = {
        email: 'invalid-email',
        name: 'Test User',
      };

      await expect(manager.signup(data)).rejects.toThrow('Invalid email format');
    });

    it('should reject empty name', async () => {
      const data: BetaSignupData = {
        email: 'test@example.com',
        name: '',
      };

      await expect(manager.signup(data)).rejects.toThrow('Name is required');
    });

    it('should reject duplicate email', async () => {
      const data: BetaSignupData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await manager.signup(data);
      await expect(manager.signup(data)).rejects.toThrow('Email already registered');
    });

    it('should enforce rate limiting', async () => {
      const data: BetaSignupData = {
        email: 'rate@example.com',
        name: 'Rate Test',
      };

      // First signup succeeds
      await manager.signup(data);

      // Subsequent rapid attempts with same email should fail (duplicate check)
      await expect(manager.signup(data)).rejects.toThrow('Email already registered');

      // Test global rate limiting with low limit
      const manager2 = new BetaSignupManager({ globalMaxRequests: 3 });

      // Make 5 rapid requests - should hit rate limit after 3
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          manager2.signup({
            email: `test${i}@example.com`,
            name: 'Test',
          }).catch(err => ({ error: err.message }))
        );
      }

      const results = await Promise.all(promises);
      const rateLimitErrors = results.filter(r =>
        typeof r === 'object' && 'error' in r && r.error.includes('Rate limit')
      );

      // At least 2 should be rate limited (5 requests - 3 allowed = 2 rejected)
      expect(rateLimitErrors.length).toBeGreaterThanOrEqual(2);
    });

    it('should store additional metadata', async () => {
      const data: BetaSignupData = {
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          source: 'landing-page',
          referrer: 'twitter',
        },
      };

      const result = await manager.signup(data);

      expect(result.metadata).toEqual(data.metadata);
    });
  });

  describe('getStatus', () => {
    it('should return signup status for existing email', async () => {
      const data: BetaSignupData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await manager.signup(data);
      const status = await manager.getStatus('test@example.com');

      expect(status.exists).toBe(true);
      expect(status.approved).toBeDefined();
    });

    it('should return not found for non-existent email', async () => {
      const status = await manager.getStatus('nonexistent@example.com');

      expect(status.exists).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all signups with pagination', async () => {
      // Create multiple signups
      for (let i = 0; i < 15; i++) {
        await manager.signup({
          email: `user${i}@example.com`,
          name: `User ${i}`,
        });
      }

      const page1 = await manager.list({ limit: 10, offset: 0 });
      const page2 = await manager.list({ limit: 10, offset: 10 });

      expect(page1.items.length).toBe(10);
      expect(page2.items.length).toBe(5);
      expect(page1.total).toBe(15);
    });

    it('should filter by approval status', async () => {
      await manager.signup({
        email: 'approved@example.com',
        name: 'Approved User',
      });

      const results = await manager.list({ approved: true });

      expect(results.items.every(item => item.approved)).toBe(true);
    });
  });
});
