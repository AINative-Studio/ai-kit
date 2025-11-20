/**
 * Custom assertion utilities for AI Kit tests
 */

import { expect } from 'vitest';
import type { Message, Usage } from '@ainative/ai-kit-core';

/**
 * Assert that a value is a valid message
 */
export function assertValidMessage(message: any): asserts message is Message {
  expect(message).toBeDefined();
  expect(message).toHaveProperty('id');
  expect(message).toHaveProperty('role');
  expect(message).toHaveProperty('content');
  expect(message).toHaveProperty('timestamp');
  expect(typeof message.id).toBe('string');
  expect(['user', 'assistant', 'system']).toContain(message.role);
  expect(typeof message.content).toBe('string');
  expect(typeof message.timestamp).toBe('number');
}

/**
 * Assert that a value is valid usage data
 */
export function assertValidUsage(usage: any): asserts usage is Usage {
  expect(usage).toBeDefined();
  expect(usage).toHaveProperty('promptTokens');
  expect(usage).toHaveProperty('completionTokens');
  expect(usage).toHaveProperty('totalTokens');
  expect(typeof usage.promptTokens).toBe('number');
  expect(typeof usage.completionTokens).toBe('number');
  expect(typeof usage.totalTokens).toBe('number');
  expect(usage.promptTokens).toBeGreaterThanOrEqual(0);
  expect(usage.completionTokens).toBeGreaterThanOrEqual(0);
  expect(usage.totalTokens).toBeGreaterThanOrEqual(0);
}

/**
 * Assert that a stream event is valid
 */
export function assertValidStreamEvent(event: any, type: string) {
  expect(event).toBeDefined();
  expect(event.type).toBe(type);
  expect(event.data).toBeDefined();
}

/**
 * Assert that an error has the expected structure
 */
export function assertValidError(error: any, expectedMessage?: string) {
  expect(error).toBeInstanceOf(Error);
  if (expectedMessage) {
    expect(error.message).toContain(expectedMessage);
  }
}

/**
 * Assert that a value is within range
 */
export function assertInRange(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Assert that two arrays have the same elements (order independent)
 */
export function assertArraysEqual<T>(actual: T[], expected: T[]) {
  expect(actual).toHaveLength(expected.length);
  expect(new Set(actual)).toEqual(new Set(expected));
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

  expect(error).toBeDefined();
  if (expectedError) {
    if (typeof expectedError === 'string') {
      expect(error!.message).toContain(expectedError);
    } else {
      expect(error!.message).toMatch(expectedError);
    }
  }
}

/**
 * Assert that an object matches a subset
 */
export function assertObjectContains(obj: any, subset: any) {
  for (const key in subset) {
    expect(obj).toHaveProperty(key);
    if (typeof subset[key] === 'object' && subset[key] !== null) {
      assertObjectContains(obj[key], subset[key]);
    } else {
      expect(obj[key]).toEqual(subset[key]);
    }
  }
}

/**
 * Assert that a function was called with specific arguments
 */
export function assertCalledWithMatch(mockFn: any, expectedArgs: any[]) {
  expect(mockFn).toHaveBeenCalled();
  const calls = mockFn.mock.calls;
  const foundMatch = calls.some((call: any[]) =>
    expectedArgs.every((expectedArg, index) => {
      if (typeof expectedArg === 'object') {
        return JSON.stringify(call[index]) === JSON.stringify(expectedArg);
      }
      return call[index] === expectedArg;
    })
  );
  expect(foundMatch).toBe(true);
}

/**
 * Assert that a value is a valid ISO date string
 */
export function assertValidISODate(value: any) {
  expect(typeof value).toBe('string');
  const date = new Date(value);
  expect(date.toISOString()).toBe(value);
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
  expect(diff).toBeLessThanOrEqual(tolerance);
}
