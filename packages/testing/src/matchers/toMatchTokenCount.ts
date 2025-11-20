/**
 * Custom matcher: toMatchTokenCount
 * Asserts token counts with optional tolerance
 */

import type { ToMatchTokenCountOptions, TokenCountAssertion } from '../types';

/**
 * Extract token count data from received value
 */
function extractTokenCountData(received: any): TokenCountAssertion {
  // Handle Usage object
  if (received.promptTokens !== undefined && received.completionTokens !== undefined) {
    return {
      promptTokens: received.promptTokens,
      completionTokens: received.completionTokens,
      totalTokens: received.totalTokens || received.promptTokens + received.completionTokens,
      matches: false,
    };
  }

  // Handle UsageRecord
  if (received.totalTokens !== undefined) {
    return {
      promptTokens: received.promptTokens || 0,
      completionTokens: received.completionTokens || 0,
      totalTokens: received.totalTokens,
      matches: false,
    };
  }

  // Handle object with token counts
  return {
    promptTokens: received.promptTokens || 0,
    completionTokens: received.completionTokens || 0,
    totalTokens: received.totalTokens || 0,
    matches: false,
  };
}

/**
 * Compare token counts with tolerance
 */
function compareTokens(
  actual: number,
  expected: number,
  tolerance: number,
  approximate: boolean
): boolean {
  if (!approximate) {
    return actual === expected;
  }

  if (tolerance > 0) {
    return Math.abs(actual - expected) <= tolerance;
  }

  // Default approximate comparison (within 10%)
  const diff = Math.abs(actual - expected);
  const percent = (diff / expected) * 100;
  return percent <= 10;
}

/**
 * toMatchTokenCount matcher
 */
export function toMatchTokenCount(
  received: any,
  options: ToMatchTokenCountOptions = {}
): { pass: boolean; message: () => string } {
  const data = extractTokenCountData(received);
  const {
    promptTokens,
    completionTokens,
    totalTokens,
    tolerance = 0,
    approximate = false,
  } = options;

  const differences: any = {};
  let allMatch = true;

  // Check prompt tokens
  if (promptTokens !== undefined) {
    const matches = compareTokens(
      data.promptTokens,
      promptTokens,
      tolerance,
      approximate
    );

    if (!matches) {
      allMatch = false;
      differences.promptTokens = data.promptTokens - promptTokens;
    }
  }

  // Check completion tokens
  if (completionTokens !== undefined) {
    const matches = compareTokens(
      data.completionTokens,
      completionTokens,
      tolerance,
      approximate
    );

    if (!matches) {
      allMatch = false;
      differences.completionTokens = data.completionTokens - completionTokens;
    }
  }

  // Check total tokens
  if (totalTokens !== undefined) {
    const matches = compareTokens(
      data.totalTokens,
      totalTokens,
      tolerance,
      approximate
    );

    if (!matches) {
      allMatch = false;
      differences.totalTokens = data.totalTokens - totalTokens;
    }
  }

  if (!allMatch) {
    const parts: string[] = [];

    if (differences.promptTokens !== undefined) {
      parts.push(
        `prompt tokens: expected ${promptTokens}, got ${data.promptTokens} (diff: ${differences.promptTokens})`
      );
    }

    if (differences.completionTokens !== undefined) {
      parts.push(
        `completion tokens: expected ${completionTokens}, got ${data.completionTokens} (diff: ${differences.completionTokens})`
      );
    }

    if (differences.totalTokens !== undefined) {
      parts.push(
        `total tokens: expected ${totalTokens}, got ${data.totalTokens} (diff: ${differences.totalTokens})`
      );
    }

    return {
      pass: false,
      message: () =>
        `Expected token counts to match, but found differences:\n${parts.join('\n')}`,
    };
  }

  return {
    pass: true,
    message: () => 'Expected token counts not to match',
  };
}
