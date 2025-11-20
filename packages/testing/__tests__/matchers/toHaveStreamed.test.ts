/**
 * Tests for toHaveStreamed matcher
 */

import { describe, it, expect } from 'vitest';
import { toHaveStreamed } from '../../src/matchers/toHaveStreamed';
import { MockAIStream } from '../../src/mocks/MockAIStream';

describe('toHaveStreamed matcher', () => {
  describe('Basic streaming detection', () => {
    it('should pass when streaming occurred', async () => {
      const stream = new MockAIStream({
        mockResponses: ['Test response'],
        tokenDelay: 0,
      });

      await stream.send('Test');

      const result = toHaveStreamed(stream);
      expect(result.pass).toBe(true);
    });

    it('should fail when streaming did not occur', () => {
      const stream = new MockAIStream();

      const result = toHaveStreamed(stream);
      expect(result.pass).toBe(false);
    });
  });

  describe('Token count constraints', () => {
    it('should pass with minimum token count', async () => {
      const stream = new MockAIStream({
        mockResponses: ['One two three four five'],
        tokenDelay: 0,
        mockUsage: { completionTokens: 10 },
      });

      await stream.send('Test');

      const result = toHaveStreamed(stream, { minTokens: 5 });
      expect(result.pass).toBe(true);
    });

    it('should fail when below minimum token count', async () => {
      const stream = new MockAIStream({
        mockResponses: ['Short'],
        tokenDelay: 0,
        mockUsage: { completionTokens: 3 },
      });

      await stream.send('Test');

      const result = toHaveStreamed(stream, { minTokens: 10 });
      expect(result.pass).toBe(false);
    });

    it('should pass with maximum token count', async () => {
      const stream = new MockAIStream({
        mockResponses: ['Short response'],
        tokenDelay: 0,
        mockUsage: { completionTokens: 5 },
      });

      await stream.send('Test');

      const result = toHaveStreamed(stream, { maxTokens: 10 });
      expect(result.pass).toBe(true);
    });

    it('should fail when above maximum token count', async () => {
      const stream = new MockAIStream({
        mockResponses: ['Very long response'],
        tokenDelay: 0,
        mockUsage: { completionTokens: 20 },
      });

      await stream.send('Test');

      const result = toHaveStreamed(stream, { maxTokens: 10 });
      expect(result.pass).toBe(false);
    });
  });

  describe('Content matching', () => {
    it('should pass when content includes expected text', async () => {
      const stream = new MockAIStream({
        mockResponses: ['This is a test response'],
        tokenDelay: 0,
      });

      await stream.send('Test');

      const result = toHaveStreamed(stream, { content: 'test response' });
      expect(result.pass).toBe(true);
    });

    it('should fail when content does not include expected text', async () => {
      const stream = new MockAIStream({
        mockResponses: ['Different content'],
        tokenDelay: 0,
      });

      await stream.send('Test');

      const result = toHaveStreamed(stream, { content: 'expected text' });
      expect(result.pass).toBe(false);
    });
  });

  describe('WaitForStreamResult support', () => {
    it('should handle WaitForStreamResult objects', () => {
      const result = toHaveStreamed({
        completed: true,
        messages: [
          { id: '1', role: 'user', content: 'Test', timestamp: Date.now() },
          { id: '2', role: 'assistant', content: 'Response', timestamp: Date.now() },
        ],
        tokens: ['Response'],
        usage: { promptTokens: 5, completionTokens: 1, totalTokens: 6 },
        durationMs: 100,
      });

      expect(result.pass).toBe(true);
    });

    it('should check completion status', () => {
      const result = toHaveStreamed(
        {
          completed: false,
          messages: [],
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          durationMs: 0,
        },
        { completed: true }
      );

      expect(result.pass).toBe(false);
    });
  });
});
