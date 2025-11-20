/**
 * Custom matcher: toHaveStreamed
 * Asserts that streaming occurred with optional constraints
 */

import type { ToHaveStreamedOptions, StreamingAssertion } from '../types';

/**
 * Extract streaming assertion data from a mock stream or result
 */
function extractStreamingData(received: any): StreamingAssertion {
  // Handle MockAIStream
  if (received.getMessages && received.getIsStreaming !== undefined) {
    const messages = received.getMessages();
    const usage = received.getUsage();

    return {
      occurred: messages.length > 0,
      tokenCount: usage.completionTokens || 0,
      tokens: [], // MockAIStream doesn't track individual tokens
      finalContent: messages[messages.length - 1]?.content || '',
      durationMs: 0, // Not tracked in mock
    };
  }

  // Handle WaitForStreamResult
  if (received.completed !== undefined && received.messages) {
    const finalMessage = received.messages[received.messages.length - 1];

    return {
      occurred: received.completed,
      tokenCount: received.tokens?.length || 0,
      tokens: received.tokens || [],
      finalContent: finalMessage?.content || '',
      durationMs: received.durationMs || 0,
    };
  }

  // Handle raw streaming data
  if (received.tokens || received.messages) {
    return {
      occurred: true,
      tokenCount: received.tokens?.length || 0,
      tokens: received.tokens || [],
      finalContent: received.finalContent || '',
      durationMs: received.durationMs || 0,
    };
  }

  return {
    occurred: false,
    tokenCount: 0,
    tokens: [],
    finalContent: '',
    durationMs: 0,
  };
}

/**
 * toHaveStreamed matcher
 */
export function toHaveStreamed(
  received: any,
  options: ToHaveStreamedOptions = {}
): { pass: boolean; message: () => string } {
  const data = extractStreamingData(received);
  const { minTokens, maxTokens, content, completed } = options;

  // Check if streaming occurred
  if (!data.occurred) {
    return {
      pass: false,
      message: () => 'Expected streaming to have occurred, but it did not',
    };
  }

  // Check completion status
  if (completed !== undefined) {
    const actualCompleted = received.completed || data.tokenCount > 0;
    if (actualCompleted !== completed) {
      return {
        pass: false,
        message: () =>
          `Expected streaming to ${completed ? 'complete' : 'not complete'}, but it ${actualCompleted ? 'completed' : 'did not complete'}`,
      };
    }
  }

  // Check minimum tokens
  if (minTokens !== undefined && data.tokenCount < minTokens) {
    return {
      pass: false,
      message: () =>
        `Expected at least ${minTokens} tokens to be streamed, but got ${data.tokenCount}`,
    };
  }

  // Check maximum tokens
  if (maxTokens !== undefined && data.tokenCount > maxTokens) {
    return {
      pass: false,
      message: () =>
        `Expected at most ${maxTokens} tokens to be streamed, but got ${data.tokenCount}`,
    };
  }

  // Check content
  if (content !== undefined && !data.finalContent.includes(content)) {
    return {
      pass: false,
      message: () =>
        `Expected streaming content to include "${content}", but got "${data.finalContent}"`,
    };
  }

  return {
    pass: true,
    message: () =>
      `Expected streaming not to have occurred with the given constraints`,
  };
}
