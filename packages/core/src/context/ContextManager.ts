/**
 * Context Manager with automatic truncation
 */

import { TokenCounter } from './TokenCounter';
import {
  ContextMessage,
  ContextConfig,
  TokenUsage,
  TruncationStrategy,
  MessageImportance,
  MODEL_TOKEN_LIMITS,
} from './types';

/**
 * Oldest-first truncation strategy
 * Removes oldest messages first while preserving system messages
 */
class OldestFirstStrategy implements TruncationStrategy {
  name = 'oldest-first' as const;

  truncate(
    messages: ContextMessage[],
    maxTokens: number,
    currentTokens: number,
    config: ContextConfig
  ): ContextMessage[] {
    const counter = new TokenCounter();
    const result: ContextMessage[] = [];
    const preserveSystemMessages = config.preserveSystemMessages ?? true;
    const preserveRecentCount = config.preserveRecentCount ?? 1;

    // Separate system messages and regular messages
    const systemMessages = preserveSystemMessages
      ? messages.filter((m) => m.role === 'system')
      : [];
    const otherMessages = messages.filter((m) => m.role !== 'system');

    // Always include system messages
    result.push(...systemMessages);

    // Calculate tokens used by system messages
    let tokensUsed = counter.countMessagesTokens(systemMessages, config.model);

    // Preserve recent messages
    const recentMessages = otherMessages.slice(-preserveRecentCount);
    const recentTokens = counter.countMessagesTokens(recentMessages, config.model);

    // Add messages from end, skipping those we'll add as recent
    const middleMessages = otherMessages.slice(0, -preserveRecentCount);

    // Add middle messages from newest to oldest until we hit limit
    for (let i = middleMessages.length - 1; i >= 0; i--) {
      const message = middleMessages[i];
      if (!message) continue;
      const messageTokens = counter.countMessageTokens(message, config.model).tokens;

      if (tokensUsed + messageTokens + recentTokens <= maxTokens) {
        result.push(message);
        tokensUsed += messageTokens;
      }
    }

    // Add recent messages at the end
    result.push(...recentMessages);

    counter.dispose();

    // Restore original order (system messages are already at start)
    const nonSystemResult = result.filter((m) => m.role !== 'system');
    return [...systemMessages, ...nonSystemResult.sort((a, b) => {
      return messages.indexOf(a) - messages.indexOf(b);
    })];
  }
}

/**
 * Sliding window truncation strategy
 * Keeps first N and last M messages
 */
class SlidingWindowStrategy implements TruncationStrategy {
  name = 'sliding-window' as const;

  truncate(
    messages: ContextMessage[],
    maxTokens: number,
    currentTokens: number,
    config: ContextConfig
  ): ContextMessage[] {
    const counter = new TokenCounter();
    const keepFirst = config.slidingWindowConfig?.keepFirst ?? 1;
    const keepLast = config.slidingWindowConfig?.keepLast ?? 5;

    // Separate system messages
    const systemMessages = (config.preserveSystemMessages ?? true)
      ? messages.filter((m) => m.role === 'system')
      : [];
    const otherMessages = messages.filter((m) => m.role !== 'system');

    // Get first and last messages
    const firstMessages = otherMessages.slice(0, keepFirst);
    const lastMessages = otherMessages.slice(-keepLast);

    // Combine and deduplicate
    const combined = [...systemMessages, ...firstMessages];
    const lastMessagesSet = new Set(lastMessages);

    for (const msg of lastMessages) {
      if (!combined.includes(msg)) {
        combined.push(msg);
      }
    }

    // If still over limit, trim from the middle
    let result = combined;
    let tokensUsed = counter.countMessagesTokens(result, config.model);

    while (tokensUsed > maxTokens && result.length > systemMessages.length + 2) {
      // Remove from middle (after first, before last)
      const middleIndex = systemMessages.length + Math.floor(
        (result.length - systemMessages.length) / 2
      );
      result.splice(middleIndex, 1);
      tokensUsed = counter.countMessagesTokens(result, config.model);
    }

    counter.dispose();
    return result;
  }
}

/**
 * Importance-based truncation strategy
 * Preserves messages based on importance level
 */
class ImportanceBasedStrategy implements TruncationStrategy {
  name = 'importance-based' as const;

  truncate(
    messages: ContextMessage[],
    maxTokens: number,
    currentTokens: number,
    config: ContextConfig
  ): ContextMessage[] {
    const counter = new TokenCounter();
    const importanceOrder = [
      MessageImportance.SYSTEM,
      MessageImportance.CRITICAL,
      MessageImportance.HIGH,
      MessageImportance.NORMAL,
      MessageImportance.LOW,
    ];

    // Group messages by importance
    const grouped = new Map<MessageImportance, ContextMessage[]>();
    for (const importance of importanceOrder) {
      grouped.set(importance, []);
    }

    // Classify messages
    for (const message of messages) {
      const importance = message.importance ?? (
        message.role === 'system'
          ? MessageImportance.SYSTEM
          : MessageImportance.NORMAL
      );
      grouped.get(importance)?.push(message);
    }

    // Add messages by importance until we hit the limit
    const result: ContextMessage[] = [];
    let tokensUsed = 0;

    for (const importance of importanceOrder) {
      const messagesOfImportance = grouped.get(importance) ?? [];

      for (const message of messagesOfImportance) {
        const messageTokens = counter.countMessageTokens(message, config.model).tokens;

        if (tokensUsed + messageTokens <= maxTokens) {
          result.push(message);
          tokensUsed += messageTokens;
        } else if (importance === MessageImportance.SYSTEM || importance === MessageImportance.CRITICAL) {
          // Always include system and critical messages, even if over limit
          result.push(message);
          tokensUsed += messageTokens;
        }
      }
    }

    counter.dispose();

    // Restore original order
    return result.sort((a, b) => messages.indexOf(a) - messages.indexOf(b));
  }
}

/**
 * Least relevant truncation strategy (using embeddings if available)
 * Falls back to oldest-first if no embeddings
 */
class LeastRelevantStrategy implements TruncationStrategy {
  name = 'least-relevant' as const;

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) continue;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  truncate(
    messages: ContextMessage[],
    maxTokens: number,
    currentTokens: number,
    config: ContextConfig
  ): ContextMessage[] {
    const counter = new TokenCounter();
    const preserveSystemMessages = config.preserveSystemMessages ?? true;
    const preserveRecentCount = config.preserveRecentCount ?? 2;

    // Check if we have embeddings
    const hasEmbeddings = messages.some((m) => m.embedding && m.embedding.length > 0);

    if (!hasEmbeddings) {
      // Fallback to oldest-first strategy
      const strategy = new OldestFirstStrategy();
      return strategy.truncate(messages, maxTokens, currentTokens, config);
    }

    // Separate messages
    const systemMessages = preserveSystemMessages
      ? messages.filter((m) => m.role === 'system')
      : [];
    const otherMessages = messages.filter((m) => m.role !== 'system');

    // Get recent messages (to preserve and use as context for relevance)
    const recentMessages = otherMessages.slice(-preserveRecentCount);
    const middleMessages = otherMessages.slice(0, -preserveRecentCount);

    // Calculate average embedding of recent messages
    const recentEmbeddings = recentMessages
      .filter((m) => m.embedding)
      .map((m) => m.embedding!);

    let avgEmbedding: number[] | null = null;
    if (recentEmbeddings.length > 0 && recentEmbeddings[0]) {
      const embeddingLength = recentEmbeddings[0].length;
      avgEmbedding = new Array(embeddingLength).fill(0);

      for (const embedding of recentEmbeddings) {
        if (!embedding) continue;
        for (let i = 0; i < embeddingLength; i++) {
          const val = embedding[i];
          if (val !== undefined && avgEmbedding[i] !== undefined) {
            avgEmbedding[i] += val;
          }
        }
      }

      for (let i = 0; i < embeddingLength; i++) {
        avgEmbedding[i] /= recentEmbeddings.length;
      }
    }

    // Score messages by relevance to recent context
    const scoredMessages = middleMessages.map((message) => {
      let relevanceScore = 0;

      if (avgEmbedding && message.embedding) {
        relevanceScore = this.cosineSimilarity(message.embedding, avgEmbedding);
      }

      return { message, score: relevanceScore };
    });

    // Sort by relevance (highest first)
    scoredMessages.sort((a, b) => b.score - a.score);

    // Build result with most relevant messages
    const result: ContextMessage[] = [...systemMessages];
    let tokensUsed = counter.countMessagesTokens(systemMessages, config.model);
    const recentTokens = counter.countMessagesTokens(recentMessages, config.model);

    // Add most relevant messages until we hit limit
    for (const { message } of scoredMessages) {
      const messageTokens = counter.countMessageTokens(message, config.model).tokens;

      if (tokensUsed + messageTokens + recentTokens <= maxTokens) {
        result.push(message);
        tokensUsed += messageTokens;
      }
    }

    // Add recent messages
    result.push(...recentMessages);

    counter.dispose();

    // Restore original order
    return result.sort((a, b) => messages.indexOf(a) - messages.indexOf(b));
  }
}

/**
 * Context Manager for automatic context truncation
 */
export class ContextManager {
  private config: ContextConfig;
  private counter: TokenCounter;
  private strategies: Map<TruncationStrategyType, TruncationStrategy>;

  constructor(config: ContextConfig) {
    this.config = {
      reservedTokens: 1000,
      preserveSystemMessages: true,
      preserveRecentCount: 1,
      warningThreshold: 0.8,
      truncationStrategy: 'oldest-first',
      ...config,
    };

    this.counter = new TokenCounter();

    // Initialize strategies
    this.strategies = new Map([
      ['oldest-first', new OldestFirstStrategy()],
      ['sliding-window', new SlidingWindowStrategy()],
      ['importance-based', new ImportanceBasedStrategy()],
      ['least-relevant', new LeastRelevantStrategy()],
    ]);
  }

  /**
   * Get current token usage
   */
  getTokenUsage(messages: ContextMessage[]): TokenUsage {
    const messageTokens = this.counter.countMessagesTokens(messages, this.config.model);
    const reservedTokens = this.config.reservedTokens ?? 1000;
    const maxTokens = this.config.maxTokens;

    return {
      totalTokens: messageTokens,
      messageTokens: messageTokens,
      overheadTokens: 3, // base overhead
      remainingTokens: Math.max(0, maxTokens - messageTokens - reservedTokens),
    };
  }

  /**
   * Check if messages need truncation
   */
  needsTruncation(messages: ContextMessage[]): boolean {
    const usage = this.getTokenUsage(messages);
    const maxTokens = this.config.maxTokens - (this.config.reservedTokens ?? 1000);
    return usage.totalTokens > maxTokens;
  }

  /**
   * Check if approaching token limit
   */
  isApproachingLimit(messages: ContextMessage[]): boolean {
    const usage = this.getTokenUsage(messages);
    const maxTokens = this.config.maxTokens - (this.config.reservedTokens ?? 1000);
    const threshold = this.config.warningThreshold ?? 0.8;
    return usage.totalTokens >= maxTokens * threshold;
  }

  /**
   * Truncate messages using configured strategy
   */
  truncate(messages: ContextMessage[]): ContextMessage[] {
    const maxTokens = this.config.maxTokens - (this.config.reservedTokens ?? 1000);
    const currentTokens = this.counter.countMessagesTokens(messages, this.config.model);

    // Check if truncation is needed
    if (currentTokens <= maxTokens) {
      return messages;
    }

    // Get strategy
    let strategy: TruncationStrategy;

    if (this.config.truncationStrategy === 'custom' && this.config.customTruncationFn) {
      // Use custom function
      const result = this.config.customTruncationFn(messages, maxTokens);
      if (this.config.onTruncate) {
        const removed = messages.filter((m) => !result.includes(m));
        this.config.onTruncate(removed, result);
      }
      return result;
    } else {
      strategy = this.strategies.get(this.config.truncationStrategy ?? 'oldest-first')!;
    }

    // Execute truncation
    const result = strategy.truncate(messages, maxTokens, currentTokens, this.config);

    // Callback
    if (this.config.onTruncate) {
      const removed = messages.filter((m) => !result.includes(m));
      this.config.onTruncate(removed, result);
    }

    return result;
  }

  /**
   * Add message with automatic truncation
   */
  addMessage(
    messages: ContextMessage[],
    newMessage: ContextMessage
  ): ContextMessage[] {
    const updatedMessages = [...messages, newMessage];

    // Check for warning threshold
    if (this.isApproachingLimit(updatedMessages) && this.config.onWarning) {
      const usage = this.getTokenUsage(updatedMessages);
      this.config.onWarning(usage);
    }

    // Truncate if needed
    if (this.needsTruncation(updatedMessages)) {
      return this.truncate(updatedMessages);
    }

    return updatedMessages;
  }

  /**
   * Add multiple messages with automatic truncation
   */
  addMessages(
    messages: ContextMessage[],
    newMessages: ContextMessage[]
  ): ContextMessage[] {
    let result = messages;

    for (const message of newMessages) {
      result = this.addMessage(result, message);
    }

    return result;
  }

  /**
   * Get maximum token limit for current model
   */
  getModelMaxTokens(): number {
    return MODEL_TOKEN_LIMITS[this.config.model] ?? 8192;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Register a custom truncation strategy
   */
  registerStrategy(strategy: TruncationStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.counter.dispose();
  }
}
