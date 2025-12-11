/**
 * Custom assertion utilities for AI Kit tests
 */

import type { Message, Usage } from '@ainative/ai-kit-core';

// Lazy import vitest to avoid CommonJS require() errors
let expect: any;
function getExpect() {
  if (!expect) {
    try {
      expect = require('vitest').expect;
    } catch (e) {
      throw new Error('vitest is required to use testing utilities. Install it with: npm install -D vitest');
    }
  }
  return expect;
}

/**
 * Assert that a value is a valid message
 */
export function assertValidMessage(message: any): asserts message is Message {
  getExpect()(message).toBeDefined();
  getExpect()(message).toHaveProperty('id');
  getExpect()(message).toHaveProperty('role');
  getExpect()(message).toHaveProperty('content');
  getExpect()(message).toHaveProperty('timestamp');
  getExpect()(typeof message.id).toBe('string');
  getExpect()(['user', 'assistant', 'system']).toContain(message.role);
  getExpect()(typeof message.content).toBe('string');
  getExpect()(typeof message.timestamp).toBe('number');
}

/**
 * Assert that a value is valid usage data
 */
export function assertValidUsage(usage: any): asserts usage is Usage {
  getExpect()(usage).toBeDefined();
  getExpect()(usage).toHaveProperty('promptTokens');
  getExpect()(usage).toHaveProperty('completionTokens');
  getExpect()(usage).toHaveProperty('totalTokens');
  getExpect()(typeof usage.promptTokens).toBe('number');
  getExpect()(typeof usage.completionTokens).toBe('number');
  getExpect()(typeof usage.totalTokens).toBe('number');
  getExpect()(usage.promptTokens).toBeGreaterThanOrEqual(0);
  getExpect()(usage.completionTokens).toBeGreaterThanOrEqual(0);
  getExpect()(usage.totalTokens).toBeGreaterThanOrEqual(0);
}

/**
 * Assert that a stream event is valid
 */
export function assertValidStreamEvent(event: any, type: string) {
  getExpect()(event).toBeDefined();
  getExpect()(event.type).toBe(type);
  getExpect()(event.data).toBeDefined();
}

/**
 * Assert that an error has the expected structure
 */
export function assertValidError(error: any, expectedMessage?: string) {
  getExpect()(error).toBeInstanceOf(Error);
  if (expectedMessage) {
    getExpect()(error.message).toContain(expectedMessage);
  }
}

/**
 * Assert that a value is within range
 */
export function assertInRange(value: number, min: number, max: number) {
  getExpect()(value).toBeGreaterThanOrEqual(min);
  getExpect()(value).toBeLessThanOrEqual(max);
}

/**
 * Assert that two arrays have the same elements (order independent)
 */
export function assertArraysEqual<T>(actual: T[], expected: T[]) {
  getExpect()(actual).toHaveLength(expected.length);
  getExpect()(new Set(actual)).toEqual(new Set(expected));
}

/**
 * Assert that an async function throws
 */
export async function assertAsyncThrows(
  fn: () => Promise<any>,
  expectedError?: string | RegExp
) {
  let error: Error | undefined;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  getExpect()(error).toBeDefined();
  if (expectedError) {
    if (typeof expectedError === 'string') {
      getExpect()(error!.message).toContain(expectedError);
    } else {
      getExpect()(error!.message).toMatch(expectedError);
    }
  }
}

/**
 * Assert that an object matches a subset
 */
export function assertObjectContains(obj: any, subset: any) {
  for (const key in subset) {
    getExpect()(obj).toHaveProperty(key);
    if (typeof subset[key] === 'object' && subset[key] !== null) {
      assertObjectContains(obj[key], subset[key]);
    } else {
      getExpect()(obj[key]).toEqual(subset[key]);
    }
  }
}

/**
 * Assert that a function was called with specific arguments
 */
export function assertCalledWithMatch(mockFn: any, expectedArgs: any[]) {
  getExpect()(mockFn).toHaveBeenCalled();
  const calls = mockFn.mock.calls;
  const foundMatch = calls.some((call: any[]) =>
    expectedArgs.every((expectedArg, index) => {
      if (typeof expectedArg === 'object') {
        return JSON.stringify(call[index]) === JSON.stringify(expectedArg);
      }
      return call[index] === expectedArg;
    })
  );
  getExpect()(foundMatch).toBe(true);
}

/**
 * Assert that a value is a valid ISO date string
 */
export function assertValidISODate(value: any) {
  getExpect()(typeof value).toBe('string');
  const date = new Date(value);
  getExpect()(date.toISOString()).toBe(value);
}

/**
 * Assert that two values are approximately equal (for floating point)
 */
export function assertApproximatelyEqual(
  actual: number,
  expected: number,
  tolerance: number = 0.0001
) {
  const diff = Math.abs(actual - expected);
  getExpect()(diff).toBeLessThanOrEqual(tolerance);
}
