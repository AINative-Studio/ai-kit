/**
 * Tests for toHaveCost matcher
 */

import { describe, it, expect } from 'vitest';
import { toHaveCost } from '../../src/matchers/toHaveCost';

describe('toHaveCost matcher', () => {
  describe('Exact cost matching', () => {
    it('should pass with exact cost match', () => {
      const usage = {
        cost: {
          totalCost: 0.005,
          promptCost: 0.003,
          completionCost: 0.002,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { exact: 0.005 });
      expect(result.pass).toBe(true);
    });

    it('should pass with exact cost within tolerance', () => {
      const usage = {
        cost: {
          totalCost: 0.00501,
          promptCost: 0.003,
          completionCost: 0.002,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { exact: 0.005, tolerance: 0.001 });
      expect(result.pass).toBe(true);
    });

    it('should fail when cost exceeds tolerance', () => {
      const usage = {
        cost: {
          totalCost: 0.01,
          promptCost: 0.006,
          completionCost: 0.004,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { exact: 0.005, tolerance: 0.0001 });
      expect(result.pass).toBe(false);
    });
  });

  describe('Min/Max cost constraints', () => {
    it('should pass with minimum cost', () => {
      const usage = {
        cost: {
          totalCost: 0.01,
          promptCost: 0.006,
          completionCost: 0.004,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { min: 0.005 });
      expect(result.pass).toBe(true);
    });

    it('should fail below minimum cost', () => {
      const usage = {
        cost: {
          totalCost: 0.003,
          promptCost: 0.002,
          completionCost: 0.001,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { min: 0.005 });
      expect(result.pass).toBe(false);
    });

    it('should pass with maximum cost', () => {
      const usage = {
        cost: {
          totalCost: 0.003,
          promptCost: 0.002,
          completionCost: 0.001,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { max: 0.01 });
      expect(result.pass).toBe(true);
    });

    it('should fail above maximum cost', () => {
      const usage = {
        cost: {
          totalCost: 0.02,
          promptCost: 0.012,
          completionCost: 0.008,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { max: 0.01 });
      expect(result.pass).toBe(false);
    });
  });

  describe('Currency validation', () => {
    it('should pass with matching currency', () => {
      const usage = {
        cost: {
          totalCost: 0.005,
          promptCost: 0.003,
          completionCost: 0.002,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { currency: 'USD' });
      expect(result.pass).toBe(true);
    });

    it('should fail with mismatched currency', () => {
      const usage = {
        cost: {
          totalCost: 0.005,
          promptCost: 0.003,
          completionCost: 0.002,
          currency: 'USD',
        },
      };

      const result = toHaveCost(usage, { currency: 'EUR' });
      expect(result.pass).toBe(false);
    });
  });

  describe('Different input formats', () => {
    it('should handle Usage objects', () => {
      const usage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        estimatedCost: 0.005,
      };

      const result = toHaveCost(usage, { exact: 0.005 });
      expect(result.pass).toBe(true);
    });

    it('should handle AggregatedUsage objects', () => {
      const aggregated = {
        totalCost: 0.05,
        byProvider: {
          openai: { totalCost: 0.03 },
          anthropic: { totalCost: 0.02 },
        },
      };

      const result = toHaveCost(aggregated, { min: 0.04 });
      expect(result.pass).toBe(true);
    });
  });
});
