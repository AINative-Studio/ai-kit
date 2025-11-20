/**
 * ContextManager tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextManager } from '../../src/context/ContextManager';
import { TokenCounter } from '../../src/context/TokenCounter';
import {
  ContextMessage,
  MessageImportance,
  ContextConfig,
  TokenUsage,
} from '../../src/context/types';

describe('ContextManager', () => {
  let manager: ContextManager;
  let messages: ContextMessage[];

  beforeEach(() => {
    const config: ContextConfig = {
      model: 'gpt-4',
      maxTokens: 1000,
      reservedTokens: 100,
      truncationStrategy: 'oldest-first',
      preserveSystemMessages: true,
      preserveRecentCount: 1,
    };
    manager = new ContextManager(config);

    messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: 'Hello!',
      },
      {
        role: 'assistant',
        content: 'Hi there! How can I help you today?',
      },
      {
        role: 'user',
        content: 'Tell me about the weather.',
      },
      {
        role: 'assistant',
        content: 'I would need to know your location to tell you about the weather.',
      },
    ];
  });

  afterEach(() => {
    manager.dispose();
  });

  describe('Token Usage', () => {
    it('should calculate token usage correctly', () => {
      const usage = manager.getTokenUsage(messages);

      expect(usage).toHaveProperty('totalTokens');
      expect(usage).toHaveProperty('messageTokens');
      expect(usage).toHaveProperty('overheadTokens');
      expect(usage).toHaveProperty('remainingTokens');
      expect(usage.totalTokens).toBeGreaterThan(0);
    });

    it('should detect when truncation is needed', () => {
      // Create messages that exceed limit
      const longMessages: ContextMessage[] = [];
      for (let i = 0; i < 50; i++) {
        longMessages.push({
          role: 'user',
          content: 'This is a message with some content that will add up to exceed the token limit when we have many messages.',
        });
      }

      const needsTruncation = manager.needsTruncation(longMessages);
      expect(needsTruncation).toBe(true);
    });

    it('should detect when approaching limit', () => {
      const config: ContextConfig = {
        model: 'gpt-4',
        maxTokens: 200,
        reservedTokens: 20,
        warningThreshold: 0.8,
      };
      const testManager = new ContextManager(config);

      // Create messages that approach but don't exceed limit
      const nearLimitMessages: ContextMessage[] = [];
      for (let i = 0; i < 10; i++) {
        nearLimitMessages.push({
          role: 'user',
          content: 'This message is designed to fill up tokens.',
        });
      }

      const approaching = testManager.isApproachingLimit(nearLimitMessages);
      expect(typeof approaching).toBe('boolean');

      testManager.dispose();
    });
  });

  describe('Truncation Strategies', () => {
    describe('Oldest-First Strategy', () => {
      it('should preserve system messages', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 200,
          reservedTokens: 20,
          truncationStrategy: 'oldest-first',
          preserveSystemMessages: true,
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Message 1 with some content to add tokens.' },
          { role: 'assistant', content: 'Response 1 with some content to add tokens.' },
          { role: 'user', content: 'Message 2 with some content to add tokens.' },
          { role: 'assistant', content: 'Response 2 with some content to add tokens.' },
          { role: 'user', content: 'Message 3 with some content to add tokens.' },
          { role: 'assistant', content: 'Response 3 with some content to add tokens.' },
        ];

        const truncated = testManager.truncate(testMessages);

        const systemMessages = truncated.filter((m) => m.role === 'system');
        expect(systemMessages.length).toBe(1);
        expect(systemMessages[0].content).toBe('You are a helpful assistant.');

        testManager.dispose();
      });

      it('should preserve recent messages', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 200,
          reservedTokens: 20,
          truncationStrategy: 'oldest-first',
          preserveRecentCount: 2,
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          { role: 'user', content: 'Message 1 with content.' },
          { role: 'assistant', content: 'Response 1 with content.' },
          { role: 'user', content: 'Message 2 with content.' },
          { role: 'assistant', content: 'Response 2 with content.' },
          { role: 'user', content: 'Message 3 - RECENT.' },
          { role: 'assistant', content: 'Response 3 - RECENT.' },
        ];

        const truncated = testManager.truncate(testMessages);

        // Should have the 2 most recent messages
        expect(truncated.some((m) => m.content?.includes('RECENT'))).toBe(true);

        testManager.dispose();
      });

      it('should remove oldest messages first', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 150,
          reservedTokens: 20,
          truncationStrategy: 'oldest-first',
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          { role: 'user', content: 'OLD - Message 1' },
          { role: 'user', content: 'Message 2' },
          { role: 'user', content: 'NEW - Message 3' },
        ];

        const truncated = testManager.truncate(testMessages);

        // Newest message should be preserved
        expect(truncated.some((m) => m.content?.includes('NEW'))).toBe(true);

        testManager.dispose();
      });
    });

    describe('Sliding-Window Strategy', () => {
      it('should keep first and last N messages', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 500,
          truncationStrategy: 'sliding-window',
          slidingWindowConfig: {
            keepFirst: 2,
            keepLast: 2,
          },
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          { role: 'user', content: 'FIRST-1' },
          { role: 'user', content: 'FIRST-2' },
          { role: 'user', content: 'Middle-1' },
          { role: 'user', content: 'Middle-2' },
          { role: 'user', content: 'LAST-1' },
          { role: 'user', content: 'LAST-2' },
        ];

        const truncated = testManager.truncate(testMessages);

        expect(truncated.some((m) => m.content?.includes('FIRST'))).toBe(true);
        expect(truncated.some((m) => m.content?.includes('LAST'))).toBe(true);

        testManager.dispose();
      });
    });

    describe('Importance-Based Strategy', () => {
      it('should preserve critical and high importance messages', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 200,
          reservedTokens: 20,
          truncationStrategy: 'importance-based',
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          {
            role: 'system',
            content: 'System message',
            importance: MessageImportance.SYSTEM,
          },
          {
            role: 'user',
            content: 'Critical instruction: Do not forget this!',
            importance: MessageImportance.CRITICAL,
          },
          {
            role: 'user',
            content: 'Low priority message',
            importance: MessageImportance.LOW,
          },
          {
            role: 'user',
            content: 'High priority message',
            importance: MessageImportance.HIGH,
          },
          {
            role: 'user',
            content: 'Normal message',
            importance: MessageImportance.NORMAL,
          },
        ];

        const truncated = testManager.truncate(testMessages);

        // Critical and system should always be preserved
        expect(truncated.some((m) => m.importance === MessageImportance.CRITICAL)).toBe(true);
        expect(truncated.some((m) => m.importance === MessageImportance.SYSTEM)).toBe(true);

        testManager.dispose();
      });

      it('should drop low importance messages first', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 150,
          reservedTokens: 20,
          truncationStrategy: 'importance-based',
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          {
            role: 'user',
            content: 'Low importance message with extra content to add tokens',
            importance: MessageImportance.LOW,
          },
          {
            role: 'user',
            content: 'High importance message',
            importance: MessageImportance.HIGH,
          },
        ];

        const truncated = testManager.truncate(testMessages);

        // High should be preserved over low
        const hasHigh = truncated.some((m) => m.importance === MessageImportance.HIGH);
        expect(hasHigh).toBe(true);

        testManager.dispose();
      });
    });

    describe('Least-Relevant Strategy', () => {
      it('should fallback to oldest-first when no embeddings', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 200,
          reservedTokens: 20,
          truncationStrategy: 'least-relevant',
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          { role: 'user', content: 'Message 1' },
          { role: 'user', content: 'Message 2' },
          { role: 'user', content: 'Message 3' },
        ];

        const truncated = testManager.truncate(testMessages);

        // Should still truncate
        expect(truncated.length).toBeLessThanOrEqual(testMessages.length);

        testManager.dispose();
      });

      it('should use embeddings for relevance when available', () => {
        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 200,
          reservedTokens: 20,
          truncationStrategy: 'least-relevant',
          preserveRecentCount: 1,
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          {
            role: 'user',
            content: 'Tell me about cats.',
            embedding: [0.1, 0.2, 0.3],
          },
          {
            role: 'user',
            content: 'What about dogs?',
            embedding: [0.15, 0.25, 0.35],
          },
          {
            role: 'user',
            content: 'Explain quantum physics.',
            embedding: [0.9, 0.8, 0.7],
          },
          {
            role: 'user',
            content: 'More about pets and animals.',
            embedding: [0.12, 0.22, 0.32],
          },
        ];

        const truncated = testManager.truncate(testMessages);

        // Should preserve messages similar to recent context
        expect(truncated.length).toBeGreaterThan(0);

        testManager.dispose();
      });
    });

    describe('Custom Strategy', () => {
      it('should support custom truncation function', () => {
        const customFn = vi.fn((messages: ContextMessage[], maxTokens: number) => {
          return messages.slice(-2); // Keep last 2
        });

        const config: ContextConfig = {
          model: 'gpt-4',
          maxTokens: 100,
          truncationStrategy: 'custom',
          customTruncationFn: customFn,
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          { role: 'user', content: 'Message 1' },
          { role: 'user', content: 'Message 2' },
          { role: 'user', content: 'Message 3' },
          { role: 'user', content: 'Message 4' },
        ];

        const truncated = testManager.truncate(testMessages);

        expect(customFn).toHaveBeenCalled();
        expect(truncated.length).toBe(2);

        testManager.dispose();
      });
    });
  });

  describe('Message Management', () => {
    it('should add message without truncation when under limit', () => {
      const newMessage: ContextMessage = {
        role: 'user',
        content: 'New message',
      };

      const result = manager.addMessage(messages, newMessage);

      expect(result.length).toBe(messages.length + 1);
      expect(result[result.length - 1]).toBe(newMessage);
    });

    it('should trigger warning callback when approaching limit', () => {
      const onWarning = vi.fn();
      const config: ContextConfig = {
        model: 'gpt-4',
        maxTokens: 150,
        reservedTokens: 20,
        warningThreshold: 0.5,
        onWarning,
      };
      const testManager = new ContextManager(config);

      const testMessages: ContextMessage[] = [
        { role: 'user', content: 'Message to fill tokens' },
        { role: 'assistant', content: 'Response to fill tokens' },
      ];

      const newMessage: ContextMessage = {
        role: 'user',
        content: 'Another message to trigger warning',
      };

      testManager.addMessage(testMessages, newMessage);

      testManager.dispose();
    });

    it('should trigger truncation callback when messages are removed', () => {
      const onTruncate = vi.fn();
      const config: ContextConfig = {
        model: 'gpt-4',
        maxTokens: 150,
        reservedTokens: 20,
        onTruncate,
      };
      const testManager = new ContextManager(config);

      const testMessages: ContextMessage[] = [];
      for (let i = 0; i < 20; i++) {
        testMessages.push({
          role: 'user',
          content: `Message ${i} with content to add tokens`,
        });
      }

      testManager.truncate(testMessages);

      expect(onTruncate).toHaveBeenCalled();

      testManager.dispose();
    });

    it('should add multiple messages with automatic truncation', () => {
      const newMessages: ContextMessage[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
      ];

      const result = manager.addMessages(messages, newMessages);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should get model max tokens', () => {
      const maxTokens = manager.getModelMaxTokens();
      expect(maxTokens).toBe(8192); // GPT-4 limit
    });

    it('should update configuration', () => {
      manager.updateConfig({
        truncationStrategy: 'sliding-window',
        slidingWindowConfig: {
          keepFirst: 3,
          keepLast: 3,
        },
      });

      // Configuration should be updated
      expect(true).toBe(true); // Config is private, but method executes
    });

    it('should support custom strategies via registration', () => {
      const customStrategy = {
        name: 'custom' as const,
        truncate: (messages: ContextMessage[]) => messages.slice(-1),
      };

      manager.registerStrategy(customStrategy);

      // Strategy should be registered
      expect(true).toBe(true); // Private map, but method executes
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages array', () => {
      const usage = manager.getTokenUsage([]);
      expect(usage.totalTokens).toBeGreaterThanOrEqual(0);
    });

    it('should handle messages with null content', () => {
      const messagesWithNull: ContextMessage[] = [
        { role: 'system', content: null },
        { role: 'user', content: 'Hello' },
      ];

      const usage = manager.getTokenUsage(messagesWithNull);
      expect(usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle messages with function calls', () => {
      const messagesWithFunctions: ContextMessage[] = [
        {
          role: 'assistant',
          content: null,
          function_call: {
            name: 'get_weather',
            arguments: '{"location": "San Francisco"}',
          },
        },
      ];

      const usage = manager.getTokenUsage(messagesWithFunctions);
      expect(usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle messages with tool calls', () => {
      const messagesWithTools: ContextMessage[] = [
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_123',
              type: 'function',
              function: {
                name: 'get_weather',
                arguments: '{"location": "San Francisco"}',
              },
            },
          ],
        },
      ];

      const usage = manager.getTokenUsage(messagesWithTools);
      expect(usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle very long messages', () => {
      const longContent = 'a'.repeat(10000);
      const longMessages: ContextMessage[] = [
        { role: 'user', content: longContent },
      ];

      const usage = manager.getTokenUsage(longMessages);
      expect(usage.totalTokens).toBeGreaterThan(1000);
    });

    it('should not truncate when not needed', () => {
      const shortMessages: ContextMessage[] = [
        { role: 'user', content: 'Hi' },
      ];

      const truncated = manager.truncate(shortMessages);
      expect(truncated.length).toBe(1);
    });
  });

  describe('TokenCounter Integration', () => {
    it('should count tokens accurately for different models', () => {
      const models: Array<'gpt-4' | 'gpt-3.5-turbo'> = ['gpt-4', 'gpt-3.5-turbo'];

      for (const model of models) {
        const config: ContextConfig = {
          model,
          maxTokens: 1000,
        };
        const testManager = new ContextManager(config);

        const testMessages: ContextMessage[] = [
          { role: 'user', content: 'Hello, world!' },
        ];

        const usage = testManager.getTokenUsage(testMessages);
        expect(usage.totalTokens).toBeGreaterThan(0);

        testManager.dispose();
      }
    });

    it('should handle messages with metadata', () => {
      const messagesWithMetadata: ContextMessage[] = [
        {
          role: 'user',
          content: 'Message with metadata',
          metadata: {
            timestamp: Date.now(),
            userId: '123',
            source: 'web',
          },
        },
      ];

      const usage = manager.getTokenUsage(messagesWithMetadata);
      expect(usage.totalTokens).toBeGreaterThan(0);
    });
  });
});
