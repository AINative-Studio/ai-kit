/**
 * Conversation Summarizer
 *
 * Automatic summarization of long conversations using various strategies
 */

import { Message } from '../types';
import { LLMProvider } from '../agents/llm/LLMProvider';
import { OpenAIProvider } from '../agents/llm/OpenAIProvider';
import { AnthropicProvider } from '../agents/llm/AnthropicProvider';
import { generateShortId } from '../utils/id';
import {
  SummaryConfig,
  Summary,
  SummarizationResult,
  SummarizeOptions,
  CompressionLevel,
  SummaryStrategy,
  SummaryCacheEntry,
  SummarizationStats,
  IncrementalSummaryOptions,
} from './types';
import {
  extractKeySentences,
  extractKeyPoints,
  createExtractiveSummary,
  extractKeywords,
} from './extractive';

/**
 * Default prompts for different compression levels
 */
const DEFAULT_PROMPTS = {
  [CompressionLevel.BRIEF]:
    'Provide a very brief 2-3 sentence summary of this conversation, focusing only on the most critical points.',
  [CompressionLevel.MODERATE]:
    'Summarize this conversation in a paragraph, covering the main topics and key decisions.',
  [CompressionLevel.DETAILED]:
    'Provide a comprehensive summary of this conversation, including all important topics, decisions, and context.',
};

/**
 * Conversation Summarizer
 */
export class ConversationSummarizer {
  private config: SummaryConfig;
  private provider: LLMProvider;
  private cache: Map<string, SummaryCacheEntry>;
  private stats: SummarizationStats;

  constructor(config: SummaryConfig) {
    this.config = {
      chunkSize: 10,
      maxKeyPoints: 5,
      enableCache: true,
      cacheTTL: 3600, // 1 hour default
      includeMetadata: true,
      ...config,
    };

    this.provider = this.createProvider();
    this.cache = new Map();
    this.stats = {
      totalSummaries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokens: 0,
      averageDurationMs: 0,
      totalDurationMs: 0,
    };
  }

  /**
   * Create LLM provider based on configuration
   */
  private createProvider(): LLMProvider {
    const { provider, providerConfig } = this.config;

    if (provider === 'openai') {
      return new OpenAIProvider({
        apiKey: providerConfig.apiKey,
        model: providerConfig.model,
        temperature: providerConfig.temperature ?? 0.3,
        maxTokens: providerConfig.maxTokens ?? 1000,
      });
    } else if (provider === 'anthropic') {
      return new AnthropicProvider({
        apiKey: providerConfig.apiKey,
        model: providerConfig.model,
        temperature: providerConfig.temperature ?? 0.3,
        maxTokens: providerConfig.maxTokens ?? 1000,
      });
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Summarize a conversation
   */
  async summarize(
    conversationId: string,
    messages: Message[],
    options: SummarizeOptions = {}
  ): Promise<SummarizationResult> {
    const startTime = Date.now();

    // Apply message range if specified
    const startIdx = options.startIndex ?? 0;
    const endIdx = options.endIndex ?? messages.length;
    const messagesToSummarize = messages.slice(startIdx, endIdx);

    if (messagesToSummarize.length === 0) {
      throw new Error('No messages to summarize');
    }

    // Check cache if enabled
    if (this.config.enableCache && !options.forceRegenerate) {
      const cached = this.getCachedSummary(
        conversationId,
        startIdx,
        endIdx,
        this.config.strategy
      );
      if (cached) {
        this.stats.cacheHits++;
        return {
          summary: cached,
          cached: true,
          durationMs: Date.now() - startTime,
        };
      }
    }

    this.stats.cacheMisses++;

    // Generate summary based on strategy
    let result: SummarizationResult;

    switch (this.config.strategy) {
      case 'single-pass':
        result = await this.singlePassSummarize(
          conversationId,
          messagesToSummarize,
          options
        );
        break;
      case 'rolling':
        result = await this.rollingSummarize(
          conversationId,
          messagesToSummarize,
          options
        );
        break;
      case 'hierarchical':
        result = await this.hierarchicalSummarize(
          conversationId,
          messagesToSummarize,
          options
        );
        break;
      case 'extractive':
        result = await this.extractiveSummarize(
          conversationId,
          messagesToSummarize,
          options
        );
        break;
      case 'hybrid':
        result = await this.hybridSummarize(
          conversationId,
          messagesToSummarize,
          options
        );
        break;
      default:
        throw new Error(`Unsupported strategy: ${this.config.strategy}`);
    }

    // Update message range
    result.summary.messageRange = { start: startIdx, end: endIdx };

    // Cache the result
    if (this.config.enableCache) {
      this.cacheSummary(result.summary);
    }

    // Update stats
    this.stats.totalSummaries++;
    this.stats.totalDurationMs += result.durationMs;
    this.stats.averageDurationMs =
      this.stats.totalDurationMs / this.stats.totalSummaries;
    if (result.summary.usage) {
      this.stats.totalTokens += result.summary.usage.totalTokens;
    }

    return result;
  }

  /**
   * Single-pass summarization - summarize entire conversation in one LLM call
   */
  private async singlePassSummarize(
    conversationId: string,
    messages: Message[],
    options: SummarizeOptions
  ): Promise<SummarizationResult> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(messages, options.context);
    const response = await this.provider.chat({
      messages: [
        {
          role: 'system',
          content: this.config.customPrompt || DEFAULT_PROMPTS[this.config.compressionLevel],
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString(),
        },
      ],
      temperature: this.config.providerConfig.temperature,
      maxTokens: this.config.providerConfig.maxTokens,
    });

    const summary: Summary = {
      id: `sum-${generateShortId()}`,
      conversationId,
      content: response.content,
      keyPoints: this.extractKeyPointsFromSummary(response.content),
      strategy: 'single-pass',
      compressionLevel: this.config.compressionLevel,
      messageCount: messages.length,
      createdAt: Date.now(),
      usage: response.usage,
      metadata: options.metadata,
    };

    return {
      summary,
      cached: false,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Rolling summarization - summarize in chunks, then summarize summaries
   */
  private async rollingSummarize(
    conversationId: string,
    messages: Message[],
    options: SummarizeOptions
  ): Promise<SummarizationResult> {
    const startTime = Date.now();
    const chunkSize = this.config.chunkSize ?? 10;

    // Split into chunks
    const chunks: Message[][] = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push(messages.slice(i, i + chunkSize));
    }

    // Summarize each chunk
    const chunkSummaries: string[] = [];
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for (const chunk of chunks) {
      const prompt = this.buildPrompt(chunk, options.context);
      const response = await this.provider.chat({
        messages: [
          {
            role: 'system',
            content: 'Summarize this portion of the conversation concisely.',
            timestamp: new Date().toISOString(),
          },
          {
            role: 'user',
            content: prompt,
            timestamp: new Date().toISOString(),
          },
        ],
        temperature: this.config.providerConfig.temperature,
        maxTokens: this.config.providerConfig.maxTokens,
      });

      chunkSummaries.push(response.content);
      if (response.usage) {
        totalUsage.promptTokens += response.usage.promptTokens;
        totalUsage.completionTokens += response.usage.completionTokens;
        totalUsage.totalTokens += response.usage.totalTokens;
      }
    }

    // Summarize the summaries
    const finalPrompt = `Combine these summaries into a ${this.config.compressionLevel} summary:\n\n${chunkSummaries.join('\n\n')}`;
    const finalResponse = await this.provider.chat({
      messages: [
        {
          role: 'system',
          content: this.config.customPrompt || DEFAULT_PROMPTS[this.config.compressionLevel],
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: finalPrompt,
          timestamp: new Date().toISOString(),
        },
      ],
      temperature: this.config.providerConfig.temperature,
      maxTokens: this.config.providerConfig.maxTokens,
    });

    if (finalResponse.usage) {
      totalUsage.promptTokens += finalResponse.usage.promptTokens;
      totalUsage.completionTokens += finalResponse.usage.completionTokens;
      totalUsage.totalTokens += finalResponse.usage.totalTokens;
    }

    const summary: Summary = {
      id: `sum-${generateShortId()}`,
      conversationId,
      content: finalResponse.content,
      keyPoints: this.extractKeyPointsFromSummary(finalResponse.content),
      strategy: 'rolling',
      compressionLevel: this.config.compressionLevel,
      messageCount: messages.length,
      createdAt: Date.now(),
      usage: totalUsage,
      metadata: options.metadata,
    };

    return {
      summary,
      cached: false,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Hierarchical summarization - create multi-level summaries
   */
  private async hierarchicalSummarize(
    conversationId: string,
    messages: Message[],
    options: SummarizeOptions
  ): Promise<SummarizationResult> {
    const startTime = Date.now();
    const chunkSize = this.config.chunkSize ?? 10;

    // Create leaf-level summaries
    const leafSummaries: Summary[] = [];
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      const prompt = this.buildPrompt(chunk, options.context);
      const response = await this.provider.chat({
        messages: [
          {
            role: 'system',
            content: 'Summarize this portion of the conversation.',
            timestamp: new Date().toISOString(),
          },
          {
            role: 'user',
            content: prompt,
            timestamp: new Date().toISOString(),
          },
        ],
        temperature: this.config.providerConfig.temperature,
        maxTokens: this.config.providerConfig.maxTokens ?? 500,
      });

      if (response.usage) {
        totalUsage.promptTokens += response.usage.promptTokens;
        totalUsage.completionTokens += response.usage.completionTokens;
        totalUsage.totalTokens += response.usage.totalTokens;
      }

      leafSummaries.push({
        id: `sum-${generateShortId()}`,
        conversationId,
        content: response.content,
        strategy: 'hierarchical',
        compressionLevel: CompressionLevel.MODERATE,
        messageCount: chunk.length,
        messageRange: { start: i, end: i + chunk.length },
        createdAt: Date.now(),
        usage: response.usage,
      });
    }

    // Create root summary from leaf summaries
    const leafContents = leafSummaries.map((s) => s.content).join('\n\n');
    const finalResponse = await this.provider.chat({
      messages: [
        {
          role: 'system',
          content: this.config.customPrompt || DEFAULT_PROMPTS[this.config.compressionLevel],
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: `Create a ${this.config.compressionLevel} summary from these section summaries:\n\n${leafContents}`,
          timestamp: new Date().toISOString(),
        },
      ],
      temperature: this.config.providerConfig.temperature,
      maxTokens: this.config.providerConfig.maxTokens,
    });

    if (finalResponse.usage) {
      totalUsage.promptTokens += finalResponse.usage.promptTokens;
      totalUsage.completionTokens += finalResponse.usage.completionTokens;
      totalUsage.totalTokens += finalResponse.usage.totalTokens;
    }

    const rootSummary: Summary = {
      id: `sum-${generateShortId()}`,
      conversationId,
      content: finalResponse.content,
      keyPoints: this.extractKeyPointsFromSummary(finalResponse.content),
      strategy: 'hierarchical',
      compressionLevel: this.config.compressionLevel,
      messageCount: messages.length,
      createdAt: Date.now(),
      usage: totalUsage,
      childSummaryIds: leafSummaries.map((s) => s.id),
      metadata: options.metadata,
    };

    // Link parent to children
    leafSummaries.forEach((leaf) => {
      leaf.parentSummaryId = rootSummary.id;
    });

    return {
      summary: rootSummary,
      additionalSummaries: leafSummaries,
      cached: false,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Extractive summarization - extract key sentences without LLM
   */
  private async extractiveSummarize(
    conversationId: string,
    messages: Message[],
    options: SummarizeOptions
  ): Promise<SummarizationResult> {
    const startTime = Date.now();

    // Determine number of sentences based on compression level
    const sentenceCount = {
      [CompressionLevel.BRIEF]: 3,
      [CompressionLevel.MODERATE]: 5,
      [CompressionLevel.DETAILED]: 10,
    }[this.config.compressionLevel];

    const content = createExtractiveSummary(messages, sentenceCount);
    const keyPoints = extractKeyPoints(
      messages,
      this.config.maxKeyPoints ?? 5
    );

    const summary: Summary = {
      id: `sum-${generateShortId()}`,
      conversationId,
      content,
      keyPoints,
      strategy: 'extractive',
      compressionLevel: this.config.compressionLevel,
      messageCount: messages.length,
      createdAt: Date.now(),
      metadata: options.metadata,
    };

    return {
      summary,
      cached: false,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Hybrid summarization - combine extractive and abstractive approaches
   */
  private async hybridSummarize(
    conversationId: string,
    messages: Message[],
    options: SummarizeOptions
  ): Promise<SummarizationResult> {
    const startTime = Date.now();

    // First, extract key sentences
    const keySentences = extractKeySentences(messages, 10);
    const keywords = extractKeywords(messages, 15);

    // Build context from extracted content
    const extractedContext = keySentences.map((s) => s.text).join(' ');

    // Use LLM to create coherent summary from extracted content
    const prompt = `Based on these key points from a conversation:\n\n${extractedContext}\n\nKey topics: ${keywords.join(', ')}\n\nCreate a ${this.config.compressionLevel} coherent summary.`;

    const response = await this.provider.chat({
      messages: [
        {
          role: 'system',
          content: this.config.customPrompt || DEFAULT_PROMPTS[this.config.compressionLevel],
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString(),
        },
      ],
      temperature: this.config.providerConfig.temperature,
      maxTokens: this.config.providerConfig.maxTokens,
    });

    const summary: Summary = {
      id: `sum-${generateShortId()}`,
      conversationId,
      content: response.content,
      keyPoints: keywords.slice(0, this.config.maxKeyPoints ?? 5),
      strategy: 'hybrid',
      compressionLevel: this.config.compressionLevel,
      messageCount: messages.length,
      createdAt: Date.now(),
      usage: response.usage,
      metadata: options.metadata,
    };

    return {
      summary,
      cached: false,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Incremental summarization - append new messages to existing summary
   */
  async summarizeIncremental(
    options: IncrementalSummaryOptions
  ): Promise<SummarizationResult> {
    const startTime = Date.now();
    const { existingSummary, newMessages, mode } = options;

    if (mode === 'append') {
      // Simple append - add new summary to existing
      const newSummaryResult = await this.summarize(
        existingSummary.conversationId,
        newMessages,
        { forceRegenerate: true }
      );

      const combinedSummary: Summary = {
        ...existingSummary,
        id: `sum-${generateShortId()}`,
        content: `${existingSummary.content}\n\n${newSummaryResult.summary.content}`,
        messageCount:
          existingSummary.messageCount + newMessages.length,
        updatedAt: Date.now(),
      };

      return {
        summary: combinedSummary,
        cached: false,
        durationMs: Date.now() - startTime,
      };
    } else {
      // Merge mode - re-summarize with context
      const prompt = `Previous summary: ${existingSummary.content}\n\nNew messages to incorporate:\n${this.buildPrompt(newMessages)}\n\nUpdate the summary to include the new information.`;

      const response = await this.provider.chat({
        messages: [
          {
            role: 'system',
            content: this.config.customPrompt || DEFAULT_PROMPTS[this.config.compressionLevel],
            timestamp: new Date().toISOString(),
          },
          {
            role: 'user',
            content: prompt,
            timestamp: new Date().toISOString(),
          },
        ],
        temperature: this.config.providerConfig.temperature,
        maxTokens: this.config.providerConfig.maxTokens,
      });

      const mergedSummary: Summary = {
        ...existingSummary,
        id: `sum-${generateShortId()}`,
        content: response.content,
        keyPoints: this.extractKeyPointsFromSummary(response.content),
        messageCount:
          existingSummary.messageCount + newMessages.length,
        updatedAt: Date.now(),
        usage: response.usage,
      };

      return {
        summary: mergedSummary,
        cached: false,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Build prompt from messages
   */
  private buildPrompt(messages: Message[], context?: string): string {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    if (context) {
      return `Context: ${context}\n\nConversation:\n${conversationText}`;
    }

    return `Conversation:\n${conversationText}`;
  }

  /**
   * Extract key points from summary text
   */
  private extractKeyPointsFromSummary(summary: string): string[] {
    // Simple extraction - look for bullet points or numbered lists
    const bulletPoints = summary.match(/^[-•*]\s+(.+)$/gm);
    if (bulletPoints) {
      return bulletPoints
        .map((p) => p.replace(/^[-•*]\s+/, '').trim())
        .slice(0, this.config.maxKeyPoints ?? 5);
    }

    const numberedPoints = summary.match(/^\d+\.\s+(.+)$/gm);
    if (numberedPoints) {
      return numberedPoints
        .map((p) => p.replace(/^\d+\.\s+/, '').trim())
        .slice(0, this.config.maxKeyPoints ?? 5);
    }

    // Fallback - split by sentences and take first few
    return summary
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .slice(0, this.config.maxKeyPoints ?? 5);
  }

  /**
   * Get cached summary if available and not expired
   */
  private getCachedSummary(
    conversationId: string,
    startIdx: number,
    endIdx: number,
    strategy: SummaryStrategy
  ): Summary | null {
    const key = this.getCacheKey(conversationId, startIdx, endIdx, strategy);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    const age = (now - entry.cachedAt) / 1000; // seconds
    if (entry.ttl > 0 && age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.summary;
  }

  /**
   * Cache a summary
   */
  private cacheSummary(summary: Summary): void {
    if (!summary.messageRange) return;

    const key = this.getCacheKey(
      summary.conversationId,
      summary.messageRange.start,
      summary.messageRange.end,
      summary.strategy
    );

    this.cache.set(key, {
      key,
      summary,
      cachedAt: Date.now(),
      ttl: this.config.cacheTTL ?? 3600,
    });
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    conversationId: string,
    startIdx: number,
    endIdx: number,
    strategy: SummaryStrategy
  ): string {
    return `${conversationId}:${startIdx}:${endIdx}:${strategy}:${this.config.compressionLevel}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get summarization statistics
   */
  getStats(): SummarizationStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalSummaries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokens: 0,
      averageDurationMs: 0,
      totalDurationMs: 0,
    };
  }
}
