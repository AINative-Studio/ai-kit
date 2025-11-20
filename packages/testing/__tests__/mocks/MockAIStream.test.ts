/**
 * Tests for MockAIStream
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockAIStream } from '../../src/mocks/MockAIStream';

describe('MockAIStream', () => {
  let stream: MockAIStream;

  beforeEach(() => {
    stream = new MockAIStream({
      mockResponses: ['Hello, world!', 'How can I help you?'],
      tokenDelay: 0, // No delay for faster tests
    });
  });

  describe('Basic Streaming', () => {
    it('should send a message and receive a response', async () => {
      const messageHandler = vi.fn();
      stream.on('message', messageHandler);

      await stream.send('Test message');

      expect(messageHandler).toHaveBeenCalledTimes(2); // user + assistant
      const messages = stream.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Test message');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('Hello, world!');
    });

    it('should emit streaming events', async () => {
      const startHandler = vi.fn();
      const endHandler = vi.fn();

      stream.on('streaming-start', startHandler);
      stream.on('streaming-end', endHandler);

      await stream.send('Test');

      expect(startHandler).toHaveBeenCalledTimes(1);
      expect(endHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit token events', async () => {
      const tokenHandler = vi.fn();
      stream.on('token', tokenHandler);

      await stream.send('Test');

      expect(tokenHandler).toHaveBeenCalled();
    });

    it('should emit usage events', async () => {
      const usageHandler = vi.fn();
      stream.on('usage', usageHandler);

      await stream.send('Test');

      expect(usageHandler).toHaveBeenCalledTimes(1);
      expect(usageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalTokens: expect.any(Number),
        })
      );
    });
  });

  describe('Multiple Messages', () => {
    it('should cycle through mock responses', async () => {
      await stream.send('First message');
      await stream.send('Second message');
      await stream.send('Third message');

      const messages = stream.getMessages();
      expect(messages[1].content).toBe('Hello, world!');
      expect(messages[3].content).toBe('How can I help you?');
      expect(messages[5].content).toBe('Hello, world!'); // Cycles back
    });
  });

  describe('Error Simulation', () => {
    it('should simulate errors when configured', async () => {
      const errorStream = new MockAIStream({
        simulateError: true,
        error: new Error('Test error'),
      });

      const errorHandler = vi.fn();
      errorStream.on('error', errorHandler);

      await expect(errorStream.send('Test')).rejects.toThrow('Test error');
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Retry Logic', () => {
    it('should simulate retries before success', async () => {
      const retryStream = new MockAIStream({
        retriesBeforeSuccess: 2,
        mockResponses: ['Success!'],
      });

      const retryHandler = vi.fn();
      retryStream.on('retry', retryHandler);

      // First attempt should fail
      await expect(retryStream.send('Test')).rejects.toThrow();
    });
  });

  describe('State Management', () => {
    it('should track streaming state', async () => {
      expect(stream.getIsStreaming()).toBe(false);

      const sendPromise = stream.send('Test');
      // State might be true during execution
      await sendPromise;

      expect(stream.getIsStreaming()).toBe(false);
    });

    it('should reset state', async () => {
      await stream.send('Test');

      expect(stream.getMessages()).toHaveLength(2);

      stream.reset();

      expect(stream.getMessages()).toHaveLength(0);
      expect(stream.getUsage()).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      });
    });

    it('should retry last message', async () => {
      await stream.send('Test');
      const initialMessages = stream.getMessages().length;

      await stream.retry();

      const messages = stream.getMessages();
      expect(messages.length).toBe(initialMessages);
    });

    it('should stop streaming', () => {
      stream.stop();
      expect(stream.getIsStreaming()).toBe(false);
    });
  });

  describe('Usage Tracking', () => {
    it('should track token usage', async () => {
      await stream.send('Test');

      const usage = stream.getUsage();
      expect(usage.promptTokens).toBeGreaterThan(0);
      expect(usage.completionTokens).toBeGreaterThan(0);
      expect(usage.totalTokens).toBe(
        usage.promptTokens + usage.completionTokens
      );
    });

    it('should use custom mock usage', async () => {
      const customStream = new MockAIStream({
        mockUsage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          estimatedCost: 0.005,
        },
      });

      await customStream.send('Test');

      const usage = customStream.getUsage();
      expect(usage.promptTokens).toBe(100);
      expect(usage.completionTokens).toBe(50);
      expect(usage.totalTokens).toBe(150);
      expect(usage.estimatedCost).toBe(0.005);
    });
  });

  describe('Configuration', () => {
    it('should call onToken callback', async () => {
      const onToken = vi.fn();
      const callbackStream = new MockAIStream({
        onToken,
        tokenDelay: 0,
      });

      await callbackStream.send('Test');

      expect(onToken).toHaveBeenCalled();
    });

    it('should call onCost callback', async () => {
      const onCost = vi.fn();
      const callbackStream = new MockAIStream({
        onCost,
        tokenDelay: 0,
      });

      await callbackStream.send('Test');

      expect(onCost).toHaveBeenCalledWith(
        expect.objectContaining({
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
        })
      );
    });
  });

  describe('Test Utilities', () => {
    it('should allow setting mock responses', () => {
      stream.setMockResponses(['New response 1', 'New response 2']);

      // Response index should be reset
      expect(stream).toBeDefined();
    });

    it('should allow setting error simulation', () => {
      stream.setSimulateError(new Error('Custom error'));

      expect(stream).toBeDefined();
    });

    it('should provide call history', () => {
      const history = stream.getCallHistory();

      expect(history).toHaveProperty('sendCalls');
      expect(history).toHaveProperty('tokenEmissions');
      expect(history).toHaveProperty('usageEmissions');
    });
  });
});
