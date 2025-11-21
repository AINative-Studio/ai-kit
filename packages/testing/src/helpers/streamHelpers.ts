/**
 * Helper functions for testing streaming functionality
 */

import { EventEmitter } from 'events';
import type {
  Message,
  Usage,
  WaitForStreamOptions,
  WaitForStreamResult,
  MockSSEResponseOptions,
} from '../types';

/**
 * Wait for a stream to complete with timeout
 */
export async function waitForStream(
  stream: EventEmitter,
  options: WaitForStreamOptions = {}
): Promise<WaitForStreamResult> {
  const {
    timeout = 5000,
    expectedMessages,
    expectedContent,
    collectTokens = false,
  } = options;

  const startTime = Date.now();
  const messages: Message[] = [];
  const tokens: string[] = [];
  let usage: Usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  let completed = false;
  let error: Error | undefined;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Stream did not complete within ${timeout}ms`
        )
      );
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
      stream.removeListener('message', onMessage);
      stream.removeListener('token', onToken);
      stream.removeListener('usage', onUsage);
      stream.removeListener('streaming-end', onStreamingEnd);
      stream.removeListener('error', onError);
    };

    const checkCompletion = () => {
      if (expectedMessages && messages.length >= expectedMessages) {
        cleanup();
        resolve({
          messages,
          tokens: collectTokens ? tokens : undefined,
          usage,
          durationMs: Date.now() - startTime,
          completed: true,
          error,
        });
      }

      if (expectedContent) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.content.includes(expectedContent)) {
          cleanup();
          resolve({
            messages,
            tokens: collectTokens ? tokens : undefined,
            usage,
            durationMs: Date.now() - startTime,
            completed: true,
            error,
          });
        }
      }
    };

    const onMessage = (message: Message) => {
      messages.push(message);
      checkCompletion();
    };

    const onToken = (token: string) => {
      if (collectTokens) {
        tokens.push(token);
      }
    };

    const onUsage = (u: Usage) => {
      usage = u;
    };

    const onStreamingEnd = () => {
      completed = true;
      cleanup();
      resolve({
        messages,
        tokens: collectTokens ? tokens : undefined,
        usage,
        durationMs: Date.now() - startTime,
        completed,
        error,
      });
    };

    const onError = (err: Error) => {
      error = err;
      cleanup();
      resolve({
        messages,
        tokens: collectTokens ? tokens : undefined,
        usage,
        durationMs: Date.now() - startTime,
        completed: false,
        error,
      });
    };

    stream.on('message', onMessage);
    stream.on('token', onToken);
    stream.on('usage', onUsage);
    stream.on('streaming-end', onStreamingEnd);
    stream.on('error', onError);
  });
}

/**
 * Mock a streaming SSE response
 */
export function mockStreamingResponse(
  options: MockSSEResponseOptions
): ReadableStream<Uint8Array> {
  const { events, eventDelay = 10, simulateError = false, error, errorAfterEvent } = options;

  return new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < events.length; i++) {
          // Check if we should throw error
          if (simulateError && errorAfterEvent !== undefined && i === errorAfterEvent) {
            throw error || new Error('Simulated SSE error');
          }

          const event = events[i];
          if (!event) continue;

          const encoder = new TextEncoder();

          // Build SSE format
          let sseData = '';

          if (event.id) {
            sseData += `id: ${event.id}\n`;
          }

          if (event.type) {
            sseData += `event: ${event.type}\n`;
          }

          if (event.retry) {
            sseData += `retry: ${event.retry}\n`;
          }

          sseData += `data: ${event.data}\n\n`;

          controller.enqueue(encoder.encode(sseData));

          // Simulate network delay
          if (eventDelay > 0 && i < events.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, eventDelay));
          }
        }

        // Throw error at the end if configured
        if (simulateError && errorAfterEvent === undefined) {
          throw error || new Error('Simulated SSE error');
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/**
 * Collect all tokens from a stream
 */
export async function collectStreamTokens(
  stream: EventEmitter,
  timeout: number = 5000
): Promise<string[]> {
  const tokens: string[] = [];

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Token collection timed out after ${timeout}ms`));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
      stream.removeListener('token', onToken);
      stream.removeListener('streaming-end', onEnd);
      stream.removeListener('error', onError);
    };

    const onToken = (token: string) => {
      tokens.push(token);
    };

    const onEnd = () => {
      cleanup();
      resolve(tokens);
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    stream.on('token', onToken);
    stream.on('streaming-end', onEnd);
    stream.on('error', onError);
  });
}

/**
 * Collect all messages from a stream
 */
export async function collectStreamMessages(
  stream: EventEmitter,
  timeout: number = 5000
): Promise<Message[]> {
  const messages: Message[] = [];

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Message collection timed out after ${timeout}ms`));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
      stream.removeListener('message', onMessage);
      stream.removeListener('streaming-end', onEnd);
      stream.removeListener('error', onError);
    };

    const onMessage = (message: Message) => {
      messages.push(message);
    };

    const onEnd = () => {
      cleanup();
      resolve(messages);
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    stream.on('message', onMessage);
    stream.on('streaming-end', onEnd);
    stream.on('error', onError);
  });
}
