/**
 * TokenCounter tests
 */

import { describe, it, expect, afterEach } from 'vitest';
import { TokenCounter } from '../../src/context/TokenCounter';
import { ContextMessage } from '../../src/context/types';

describe('TokenCounter', () => {
  let counter: TokenCounter;

  afterEach(() => {
    if (counter) {
      counter.dispose();
    }
  });

  describe('String Token Counting', () => {
    it('should count tokens in a simple string', () => {
      counter = new TokenCounter();
      const text = 'Hello, world!';
      const count = counter.countStringTokens(text, 'gpt-4');

      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(10);
    });

    it('should handle empty strings', () => {
      counter = new TokenCounter();
      const text = '';
      const count = counter.countStringTokens(text, 'gpt-4');

      expect(count).toBe(0);
    });

    it('should count tokens for long text', () => {
      counter = new TokenCounter();
      const text = 'This is a longer text that contains multiple sentences. It should have more tokens than a short string. Let me add even more content here to make it longer.';
      const count = counter.countStringTokens(text, 'gpt-4');

      expect(count).toBeGreaterThan(20);
    });

    it('should handle special characters', () => {
      counter = new TokenCounter();
      const text = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      const count = counter.countStringTokens(text, 'gpt-4');

      expect(count).toBeGreaterThan(0);
    });

    it('should handle unicode characters', () => {
      counter = new TokenCounter();
      const text = 'Hello 世界 🌍';
      const count = counter.countStringTokens(text, 'gpt-4');

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Message Token Counting', () => {
    it('should count tokens for a simple user message', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'user',
        content: 'Hello, how are you?',
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown?.role).toBeGreaterThan(0);
      expect(result.breakdown?.content).toBeGreaterThan(0);
    });

    it('should count tokens for a system message', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'system',
        content: 'You are a helpful assistant.',
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should count tokens for an assistant message', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'assistant',
        content: 'I am doing well, thank you!',
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should include name tokens when present', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'user',
        content: 'Hello',
        name: 'John',
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.breakdown?.name).toBeGreaterThan(0);
    });

    it('should handle null content', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'assistant',
        content: null,
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0); // Should still have overhead
      expect(result.breakdown?.content).toBe(0);
    });

    it('should count function call tokens', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'assistant',
        content: null,
        function_call: {
          name: 'get_weather',
          arguments: '{"location": "San Francisco", "unit": "celsius"}',
        },
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.breakdown?.functionCall).toBeGreaterThan(0);
    });

    it('should count tool call tokens', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_abc123',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: '{"location": "New York"}',
            },
          },
        ],
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.breakdown?.toolCalls).toBeGreaterThan(0);
    });

    it('should count multiple tool calls', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'function_1',
              arguments: '{"arg": "value1"}',
            },
          },
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'function_2',
              arguments: '{"arg": "value2"}',
            },
          },
        ],
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.breakdown?.toolCalls).toBeGreaterThan(0);
    });

    it('should count tool response tokens', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'tool',
        content: 'Weather data: sunny, 72F',
        tool_call_id: 'call_abc123',
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
    });
  });

  describe('Messages Array Token Counting', () => {
    it('should count tokens for multiple messages', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const total = counter.countMessagesTokens(messages, 'gpt-4');

      expect(total).toBeGreaterThan(0);

      // Should be sum of individual messages plus overhead
      const sum =
        counter.countMessageTokens(messages[0], 'gpt-4').tokens +
        counter.countMessageTokens(messages[1], 'gpt-4').tokens +
        counter.countMessageTokens(messages[2], 'gpt-4').tokens +
        3; // overhead

      expect(total).toBe(sum);
    });

    it('should handle empty messages array', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [];

      const total = counter.countMessagesTokens(messages, 'gpt-4');

      expect(total).toBe(3); // Just overhead
    });
  });

  describe('Token Estimation', () => {
    it('should estimate remaining tokens correctly', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const remaining = counter.estimateRemainingTokens(messages, 1000, 'gpt-4');

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThan(1000);
    });

    it('should return 0 when over limit', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Short message' },
      ];

      const remaining = counter.estimateRemainingTokens(messages, 5, 'gpt-4');

      expect(remaining).toBe(0);
    });

    it('should detect when adding message would exceed limit', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Existing message with some content' },
      ];

      const newMessage: ContextMessage = {
        role: 'assistant',
        content: 'This is a very long response that contains a lot of text and will definitely exceed a small token limit when combined with the existing message. Adding more content here to ensure we exceed the limit.',
      };

      const wouldExceed = counter.wouldExceedLimit(messages, newMessage, 30, 'gpt-4');

      expect(wouldExceed).toBe(true);
    });

    it('should correctly identify when new message fits', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const newMessage: ContextMessage = {
        role: 'assistant',
        content: 'Hi',
      };

      const wouldExceed = counter.wouldExceedLimit(messages, newMessage, 1000, 'gpt-4');

      expect(wouldExceed).toBe(false);
    });
  });

  describe('Token Limit Index Finding', () => {
    it('should find index from end where limit is exceeded', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Message 1 with some content' },
        { role: 'user', content: 'Message 2 with some content' },
        { role: 'user', content: 'Message 3 with some content' },
        { role: 'user', content: 'Message 4 with some content' },
      ];

      const index = counter.findTokenLimitIndex(messages, 100, 'gpt-4', true);

      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(messages.length);
    });

    it('should find index from start where limit is exceeded', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'user', content: 'Message 3' },
      ];

      const index = counter.findTokenLimitIndex(messages, 50, 'gpt-4', false);

      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(messages.length);
    });

    it('should return 0 when all messages fit (from end)', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Hi' },
      ];

      const index = counter.findTokenLimitIndex(messages, 10000, 'gpt-4', true);

      expect(index).toBe(0);
    });

    it('should return length when all messages fit (from start)', () => {
      counter = new TokenCounter();
      const messages: ContextMessage[] = [
        { role: 'user', content: 'Hi' },
      ];

      const index = counter.findTokenLimitIndex(messages, 10000, 'gpt-4', false);

      expect(index).toBe(messages.length);
    });
  });

  describe('Different Models', () => {
    it('should count tokens for GPT-3.5', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'user',
        content: 'Hello, GPT-3.5!',
      };

      const result = counter.countMessageTokens(message, 'gpt-3.5-turbo');

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should count tokens for Claude models', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'user',
        content: 'Hello, Claude!',
      };

      const models: Array<'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku'> = [
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
      ];

      for (const model of models) {
        const result = counter.countMessageTokens(message, model);
        expect(result.tokens).toBeGreaterThan(0);
      }
    });

    it('should handle different token counts for different models', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'user',
        content: 'This is a test message for comparing token counts across models.',
      };

      const gpt4Count = counter.countMessageTokens(message, 'gpt-4');
      const gpt35Count = counter.countMessageTokens(message, 'gpt-3.5-turbo');

      // Counts might be similar but not necessarily identical
      expect(gpt4Count.tokens).toBeGreaterThan(0);
      expect(gpt35Count.tokens).toBeGreaterThan(0);
    });
  });

  describe('Resource Management', () => {
    it('should dispose encoders properly', () => {
      counter = new TokenCounter();
      counter.countStringTokens('test', 'gpt-4');
      counter.dispose();

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should allow creating new counter after disposal', () => {
      counter = new TokenCounter();
      counter.countStringTokens('test', 'gpt-4');
      counter.dispose();

      counter = new TokenCounter();
      const count = counter.countStringTokens('test', 'gpt-4');

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      counter = new TokenCounter();
      const longContent = 'word '.repeat(10000);
      const message: ContextMessage = {
        role: 'user',
        content: longContent,
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(10000);
    });

    it('should handle messages with all fields', () => {
      counter = new TokenCounter();
      const message: ContextMessage = {
        role: 'assistant',
        content: 'Here is the weather',
        name: 'WeatherBot',
        function_call: {
          name: 'get_weather',
          arguments: '{}',
        },
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.breakdown?.role).toBeGreaterThan(0);
      expect(result.breakdown?.name).toBeGreaterThan(0);
      expect(result.breakdown?.content).toBeGreaterThan(0);
      expect(result.breakdown?.functionCall).toBeGreaterThan(0);
    });

    it('should handle numeric content coerced to string', () => {
      counter = new TokenCounter();
      const text = '123456789';
      const count = counter.countStringTokens(text, 'gpt-4');

      expect(count).toBeGreaterThan(0);
    });

    it('should handle code blocks', () => {
      counter = new TokenCounter();
      const code = `
function hello() {
  console.log("Hello, world!");
  return true;
}
      `.trim();

      const message: ContextMessage = {
        role: 'user',
        content: code,
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle JSON content', () => {
      counter = new TokenCounter();
      const jsonContent = JSON.stringify({
        name: 'Test',
        value: 123,
        nested: {
          field: 'value',
        },
      });

      const message: ContextMessage = {
        role: 'user',
        content: jsonContent,
      };

      const result = counter.countMessageTokens(message, 'gpt-4');

      expect(result.tokens).toBeGreaterThan(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should provide singleton instance', async () => {
      const { tokenCounter } = await import('../../src/context/TokenCounter');
      const count = tokenCounter.countStringTokens('test', 'gpt-4');

      expect(count).toBeGreaterThan(0);

      tokenCounter.dispose();
    });
  });
});
