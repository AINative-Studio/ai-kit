/**
 * Custom matcher: toHaveError
 * Asserts error states and properties
 */

import type { ToHaveErrorOptions, ErrorAssertion } from '../types';

/**
 * Extract error data from received value
 */
function extractErrorData(received: any): ErrorAssertion {
  // Handle Error object
  if (received instanceof Error) {
    return {
      hasError: true,
      message: received.message,
      type: received.constructor.name,
      code: (received as any).code,
      stack: received.stack,
      metadata: Object.keys(received)
        .filter((key) => !['message', 'name', 'stack'].includes(key))
        .reduce((acc: any, key) => {
          acc[key] = (received as any)[key];
          return acc;
        }, {}),
    };
  }

  // Handle ExecutionResult with error
  if (received.error && received.success !== undefined) {
    return extractErrorData(received.error);
  }

  // Handle AgentState with error
  if (received.error && received.step !== undefined) {
    return {
      hasError: true,
      message: received.error.message,
      type: 'AgentError',
      metadata: {
        step: received.error.step,
        cause: received.error.cause,
      },
    };
  }

  // Handle UsageRecord with error
  if (received.error && received.success !== undefined) {
    return {
      hasError: !received.success,
      message: received.error,
      type: 'UsageError',
    };
  }

  // Handle WaitForStreamResult with error
  if (received.error && received.completed !== undefined) {
    return extractErrorData(received.error);
  }

  // Handle error object
  if (received.message || received.error) {
    return {
      hasError: true,
      message: received.message || received.error,
      type: received.type || received.name,
      code: received.code,
      metadata: received.metadata,
    };
  }

  return {
    hasError: false,
  };
}

/**
 * toHaveError matcher
 */
export function toHaveError(
  received: any,
  options: ToHaveErrorOptions = {}
): { pass: boolean; message: () => string } {
  const data = extractErrorData(received);
  const { message, type, code, metadata } = options;

  // Check if error exists
  if (!data.hasError) {
    return {
      pass: false,
      message: () => 'Expected an error to be present, but no error was found',
    };
  }

  // Check error message
  if (message && data.message && !data.message.includes(message)) {
    return {
      pass: false,
      message: () =>
        `Expected error message to include "${message}", but got "${data.message}"`,
    };
  }

  // Check error type
  if (type) {
    const expectedType = typeof type === 'string' ? type : type.name;
    if (data.type !== expectedType) {
      return {
        pass: false,
        message: () =>
          `Expected error type to be "${expectedType}", but got "${data.type}"`,
      };
    }
  }

  // Check error code
  if (code && data.code !== code) {
    return {
      pass: false,
      message: () =>
        `Expected error code to be "${code}", but got "${data.code}"`,
    };
  }

  // Check error metadata
  if (metadata && data.metadata) {
    const missingKeys = Object.keys(metadata).filter(
      (key) => !(key in data.metadata!)
    );

    if (missingKeys.length > 0) {
      return {
        pass: false,
        message: () =>
          `Expected error metadata to contain keys: ${missingKeys.join(', ')}`,
      };
    }

    const mismatchedKeys = Object.keys(metadata).filter((key) => {
      return (
        data.metadata![key] !== undefined &&
        JSON.stringify(data.metadata![key]) !== JSON.stringify(metadata[key])
      );
    });

    if (mismatchedKeys.length > 0) {
      return {
        pass: false,
        message: () =>
          `Expected error metadata values to match for keys: ${mismatchedKeys.join(', ')}`,
      };
    }
  }

  return {
    pass: true,
    message: () => 'Expected no error or error not to match the given constraints',
  };
}
