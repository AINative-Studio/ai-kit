/**
 * Custom matcher: toHaveCost
 * Asserts cost calculations with tolerance
 */

import type { ToHaveCostOptions, CostAssertion } from '../types';

/**
 * Extract cost data from received value
 */
function extractCostData(received: any): CostAssertion {
  // Handle Usage object
  if (received.estimatedCost !== undefined) {
    return {
      totalCost: received.estimatedCost,
      promptCost: 0,
      completionCost: 0,
      currency: 'USD',
    };
  }

  // Handle UsageRecord
  if (received.cost) {
    return {
      totalCost: received.cost.totalCost,
      promptCost: received.cost.promptCost,
      completionCost: received.cost.completionCost,
      currency: received.cost.currency,
    };
  }

  // Handle AggregatedUsage
  if (received.totalCost !== undefined && received.byProvider !== undefined) {
    const byProvider: Record<string, number> = {};
    Object.entries(received.byProvider || {}).forEach(([provider, data]: [string, any]) => {
      byProvider[provider] = data.totalCost;
    });

    return {
      totalCost: received.totalCost,
      promptCost: 0,
      completionCost: 0,
      currency: 'USD',
      byProvider,
    };
  }

  // Handle raw cost object
  if (received.totalCost !== undefined) {
    return {
      totalCost: received.totalCost,
      promptCost: received.promptCost || 0,
      completionCost: received.completionCost || 0,
      currency: received.currency || 'USD',
    };
  }

  return {
    totalCost: 0,
    promptCost: 0,
    completionCost: 0,
    currency: 'USD',
  };
}

/**
 * Compare costs with tolerance
 */
function compareCosts(
  actual: number,
  expected: number,
  tolerance: number
): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

/**
 * toHaveCost matcher
 */
export function toHaveCost(
  received: any,
  options: ToHaveCostOptions = {}
): { pass: boolean; message: () => string } {
  const data = extractCostData(received);
  const { exact, min, max, tolerance = 0.0001, currency } = options;

  // Check currency
  if (currency && data.currency !== currency) {
    return {
      pass: false,
      message: () =>
        `Expected currency to be ${currency}, but got ${data.currency}`,
    };
  }

  // Check exact cost
  if (exact !== undefined) {
    if (!compareCosts(data.totalCost, exact, tolerance)) {
      return {
        pass: false,
        message: () =>
          `Expected cost to be ${exact} (±${tolerance}), but got ${data.totalCost}`,
      };
    }
  }

  // Check minimum cost
  if (min !== undefined && data.totalCost < min) {
    return {
      pass: false,
      message: () =>
        `Expected cost to be at least ${min}, but got ${data.totalCost}`,
    };
  }

  // Check maximum cost
  if (max !== undefined && data.totalCost > max) {
    return {
      pass: false,
      message: () =>
        `Expected cost to be at most ${max}, but got ${data.totalCost}`,
    };
  }

  return {
    pass: true,
    message: () =>
      `Expected cost not to match the given constraints`,
  };
}
