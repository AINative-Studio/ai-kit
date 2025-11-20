/**
 * Tests for ConversationSummarizer
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { Message } from '../../src/types';
import { ChatResponse } from '../../src/agents/llm/LLMProvider';
import {
  SummaryConfig,
  CompressionLevel,
} from '../../src/summarization/types';

// Mock the entire LLM provider modules before any imports
vi.mock('../../src/agents/llm/OpenAIProvider', () => {
  return {
    OpenAIProvider: class {
      constructor(config: any) {}
      async chat(): Promise<ChatResponse> {
        return {
          content: 'This is a test summary of the conversation covering the main topics discussed.',
          finishReason: 'stop' as const,
          usage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150,
          },
        };
      }
      getProviderName(): string {
        return 'openai';
      }
    },
  };
});

vi.mock('../../src/agents/llm/AnthropicProvider', () => {
  return {
    AnthropicProvider: class {
      constructor(config: any) {}
      async chat(): Promise<ChatResponse> {
        return {
          content: 'This is a test summary of the conversation covering the main topics discussed.',
          finishReason: 'stop' as const,
          usage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150,
          },
        };
      }
      getProviderName(): string {
        return 'anthropic';
      }
    },
  };
});

// Import after mocking
import { ConversationSummarizer } from '../../src/summarization/ConversationSummarizer';

describe('ConversationSummarizer', () => {
  let testMessages: Message[];

  beforeEach(() => {
    testMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Hello, I need help with my project.',
        timestamp: Date.now() - 10000,
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Of course! I would be happy to help. What kind of project are you working on?',
        timestamp: Date.now() - 9000,
      },
      {
        id: '3',
        role: 'user',
        content: 'I am building a web application using React and TypeScript.',
        timestamp: Date.now() - 8000,
      },
      {
        id: '4',
        role: 'assistant',
        content: 'Great choice! React and TypeScript work very well together. What specific aspect do you need help with?',
        timestamp: Date.now() - 7000,
      },
      {
        id: '5',
        role: 'user',
        content: 'I am struggling with state management and want to know if I should use Redux or Context API.',
        timestamp: Date.now() - 6000,
      },
      {
        id: '6',
        role: 'assistant',
        content: 'Both are good options. For smaller apps, Context API is simpler. For larger apps with complex state, Redux provides better structure.',
        timestamp: Date.now() - 5000,
      },
    ];
  });

  describe('Configuration', () => {
    it('should create summarizer with OpenAI provider', () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      expect(summarizer).toBeDefined();
    });

    it('should create summarizer with Anthropic provider', () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'anthropic',
        providerConfig: {
          apiKey: 'test-key',
          model: 'claude-3-opus-20240229',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      expect(summarizer).toBeDefined();
    });

    it('should throw error for unsupported provider', () => {
      const config: any = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'unsupported',
        providerConfig: {
          apiKey: 'test-key',
          model: 'test-model',
        },
      };

      expect(() => new ConversationSummarizer(config)).toThrow(
        'Unsupported provider'
      );
    });
  });

  describe('Single-Pass Strategy', () => {
    it('should summarize conversation using single-pass strategy', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-1', testMessages);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.conversationId).toBe('test-conv-1');
      expect(result.summary.strategy).toBe('single-pass');
      expect(result.summary.compressionLevel).toBe(CompressionLevel.MODERATE);
      expect(result.summary.messageCount).toBe(testMessages.length);
      expect(result.summary.content).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle brief compression level', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.BRIEF,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-2', testMessages);

      expect(result.summary.compressionLevel).toBe(CompressionLevel.BRIEF);
    });

    it('should handle detailed compression level', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.DETAILED,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-3', testMessages);

      expect(result.summary.compressionLevel).toBe(CompressionLevel.DETAILED);
    });
  });

  describe('Rolling Strategy', () => {
    it('should summarize conversation using rolling strategy', async () => {
      const config: SummaryConfig = {
        strategy: 'rolling',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        chunkSize: 2,
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-4', testMessages);

      expect(result.summary.strategy).toBe('rolling');
      expect(result.summary.content).toBeTruthy();
    });

    it('should use custom chunk size', async () => {
      const config: SummaryConfig = {
        strategy: 'rolling',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        chunkSize: 3,
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-5', testMessages);

      expect(result.summary.messageCount).toBe(testMessages.length);
    });
  });

  describe('Hierarchical Strategy', () => {
    it('should summarize conversation using hierarchical strategy', async () => {
      const config: SummaryConfig = {
        strategy: 'hierarchical',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        chunkSize: 2,
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-6', testMessages);

      expect(result.summary.strategy).toBe('hierarchical');
      expect(result.additionalSummaries).toBeDefined();
      expect(result.additionalSummaries!.length).toBeGreaterThan(0);
      expect(result.summary.childSummaryIds).toBeDefined();
      expect(result.summary.childSummaryIds!.length).toBeGreaterThan(0);
    });

    it('should link parent and child summaries', async () => {
      const config: SummaryConfig = {
        strategy: 'hierarchical',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        chunkSize: 2,
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-7', testMessages);

      const rootId = result.summary.id;
      result.additionalSummaries?.forEach((leaf) => {
        expect(leaf.parentSummaryId).toBe(rootId);
      });
    });
  });

  describe('Extractive Strategy', () => {
    it('should summarize conversation using extractive strategy', async () => {
      const config: SummaryConfig = {
        strategy: 'extractive',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-8', testMessages);

      expect(result.summary.strategy).toBe('extractive');
      expect(result.summary.content).toBeTruthy();
      expect(result.summary.keyPoints).toBeDefined();
      expect(result.summary.keyPoints!.length).toBeGreaterThan(0);
      // Extractive doesn't use LLM, so no usage stats
      expect(result.summary.usage).toBeUndefined();
    });
  });

  describe('Hybrid Strategy', () => {
    it('should summarize conversation using hybrid strategy', async () => {
      const config: SummaryConfig = {
        strategy: 'hybrid',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-11', testMessages);

      expect(result.summary.strategy).toBe('hybrid');
      expect(result.summary.content).toBeTruthy();
      expect(result.summary.keyPoints).toBeDefined();
      expect(result.summary.usage).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache summaries by default', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        enableCache: true,
      };

      const summarizer = new ConversationSummarizer(config);

      // First call - should not be cached
      const result1 = await summarizer.summarize('test-conv-12', testMessages);
      expect(result1.cached).toBe(false);

      // Second call - should be cached
      const result2 = await summarizer.summarize('test-conv-12', testMessages);
      expect(result2.cached).toBe(true);
      expect(result2.summary.id).toBe(result1.summary.id);
    });

    it('should respect forceRegenerate option', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        enableCache: true,
      };

      const summarizer = new ConversationSummarizer(config);

      // First call
      const result1 = await summarizer.summarize('test-conv-13', testMessages);
      expect(result1.cached).toBe(false);

      // Second call with forceRegenerate
      const result2 = await summarizer.summarize('test-conv-13', testMessages, {
        forceRegenerate: true,
      });
      expect(result2.cached).toBe(false);
      expect(result2.summary.id).not.toBe(result1.summary.id);
    });

    it('should clear cache', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        enableCache: true,
      };

      const summarizer = new ConversationSummarizer(config);

      // First call
      await summarizer.summarize('test-conv-14', testMessages);

      // Clear cache
      summarizer.clearCache();

      // Second call should not be cached
      const result = await summarizer.summarize('test-conv-14', testMessages);
      expect(result.cached).toBe(false);
    });
  });

  describe('Message Range', () => {
    it('should summarize specific message range', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-16', testMessages, {
        startIndex: 1,
        endIndex: 4,
      });

      expect(result.summary.messageCount).toBe(3);
      expect(result.summary.messageRange).toEqual({ start: 1, end: 4 });
    });

    it('should throw error for empty message range', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);

      await expect(
        summarizer.summarize('test-conv-17', testMessages, {
          startIndex: 5,
          endIndex: 5,
        })
      ).rejects.toThrow('No messages to summarize');
    });
  });

  describe('Incremental Summarization', () => {
    it('should append new summary to existing (append mode)', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);

      // Create initial summary
      const initial = await summarizer.summarize(
        'test-conv-18',
        testMessages.slice(0, 3)
      );

      // Add new messages
      const newMessages = testMessages.slice(3);
      const result = await summarizer.summarizeIncremental({
        existingSummary: initial.summary,
        newMessages,
        mode: 'append',
      });

      expect(result.summary.messageCount).toBe(testMessages.length);
      expect(result.summary.content).toContain(initial.summary.content);
    });

    it('should merge new content with existing (merge mode)', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);

      // Create initial summary
      const initial = await summarizer.summarize(
        'test-conv-19',
        testMessages.slice(0, 3)
      );

      // Add new messages
      const newMessages = testMessages.slice(3);
      const result = await summarizer.summarizeIncremental({
        existingSummary: initial.summary,
        newMessages,
        mode: 'merge',
      });

      expect(result.summary.messageCount).toBe(testMessages.length);
      expect(result.summary.updatedAt).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should track summarization statistics', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        enableCache: true,
      };

      const summarizer = new ConversationSummarizer(config);

      // Reset stats
      summarizer.resetStats();
      let stats = summarizer.getStats();
      expect(stats.totalSummaries).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);

      // Generate some summaries
      await summarizer.summarize('test-conv-20', testMessages);
      await summarizer.summarize('test-conv-20', testMessages); // Cache hit
      await summarizer.summarize('test-conv-21', testMessages);

      stats = summarizer.getStats();
      expect(stats.totalSummaries).toBe(2); // Only 2 unique summaries
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(2);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.averageDurationMs).toBeGreaterThanOrEqual(0);
      expect(stats.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should reset statistics', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const summarizer = new ConversationSummarizer(config);

      await summarizer.summarize('test-conv-22', testMessages);

      let stats = summarizer.getStats();
      expect(stats.totalSummaries).toBeGreaterThan(0);

      summarizer.resetStats();
      stats = summarizer.getStats();
      expect(stats.totalSummaries).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom prompt', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        customPrompt: 'Create a technical summary focusing on code-related topics.',
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-23', testMessages);

      expect(result.summary.content).toBeTruthy();
    });

    it('should include custom metadata', async () => {
      const config: SummaryConfig = {
        strategy: 'single-pass',
        compressionLevel: CompressionLevel.MODERATE,
        provider: 'openai',
        providerConfig: {
          apiKey: 'test-key',
          model: 'gpt-4',
        },
      };

      const customMetadata = {
        userId: 'user-123',
        sessionId: 'session-456',
      };

      const summarizer = new ConversationSummarizer(config);
      const result = await summarizer.summarize('test-conv-25', testMessages, {
        metadata: customMetadata,
      });

      expect(result.summary.metadata).toEqual(customMetadata);
    });
  });
});
