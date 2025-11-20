/**
 * Custom matchers for AI Kit testing
 */

import { toHaveStreamed } from './toHaveStreamed';
import { toHaveCost } from './toHaveCost';
import { toMatchTokenCount } from './toMatchTokenCount';
import { toHaveError } from './toHaveError';

/**
 * All custom matchers
 */
export const customMatchers = {
  toHaveStreamed,
  toHaveCost,
  toMatchTokenCount,
  toHaveError,
};

/**
 * Register custom matchers with Vitest
 */
export function extendExpect(expect: any): void {
  expect.extend(customMatchers);
}

// Export individual matchers
export { toHaveStreamed } from './toHaveStreamed';
export { toHaveCost } from './toHaveCost';
export { toMatchTokenCount } from './toMatchTokenCount';
export { toHaveError } from './toHaveError';
