/**
 * Type definitions for conversation summarization
 */

import { Message } from '../types';

/**
 * Compression level for summaries
 */
export enum CompressionLevel {
  /** Very brief summary - key points only */
  BRIEF = 'brief',
  /** Moderate summary - balanced detail */
  MODERATE = 'moderate',
  /** Detailed summary - comprehensive */
  DETAILED = 'detailed',
}

/**
 * Summarization strategy
 */
export type SummaryStrategy =
  | 'single-pass'
  | 'rolling'
  | 'hierarchical'
  | 'extractive'
  | 'hybrid';

/**
 * LLM provider for summarization
 */
export type SummaryProvider = 'openai' | 'anthropic';

/**
 * Configuration for conversation summarization
 */
export interface SummaryConfig {
  /**
   * Summarization strategy to use
   */
  strategy: SummaryStrategy;

  /**
   * Compression level
   */
  compressionLevel: CompressionLevel;

  /**
   * LLM provider for summarization
   */
  provider: SummaryProvider;

  /**
   * Provider-specific configuration
   */
  providerConfig: {
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };

  /**
   * Custom prompt template for summarization
   */
  customPrompt?: string;

  /**
   * Chunk size for rolling and hierarchical strategies (number of messages)
   */
  chunkSize?: number;

  /**
   * Maximum number of key points to extract
   */
  maxKeyPoints?: number;

  /**
   * Whether to cache summaries
   */
  enableCache?: boolean;

  /**
   * Cache TTL in seconds (0 = no expiration)
   */
  cacheTTL?: number;

  /**
   * Whether to include metadata in summaries
   */
  includeMetadata?: boolean;

  /**
   * Custom metadata to include in summary
   */
  metadata?: Record<string, any>;
}

/**
 * Summary of a conversation or conversation chunk
 */
export interface Summary {
  /**
   * Unique identifier for this summary
   */
  id: string;

  /**
   * Conversation ID this summary belongs to
   */
  conversationId: string;

  /**
   * The summarized content
   */
  content: string;

  /**
   * Key points extracted from the conversation
   */
  keyPoints?: string[];

  /**
   * Strategy used to generate this summary
   */
  strategy: SummaryStrategy;

  /**
   * Compression level used
   */
  compressionLevel: CompressionLevel;

  /**
   * Number of messages summarized
   */
  messageCount: number;

  /**
   * Range of messages summarized (indices)
   */
  messageRange?: {
    start: number;
    end: number;
  };

  /**
   * Timestamp when summary was created
   */
  createdAt: number;

  /**
   * Timestamp when summary was last updated
   */
  updatedAt?: number;

  /**
   * Token usage for generating this summary
   */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /**
   * Parent summary ID (for hierarchical summaries)
   */
  parentSummaryId?: string;

  /**
   * Child summary IDs (for hierarchical summaries)
   */
  childSummaryIds?: string[];

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Result of a summarization operation
 */
export interface SummarizationResult {
  /**
   * The primary summary
   */
  summary: Summary;

  /**
   * Additional summaries (for hierarchical strategy)
   */
  additionalSummaries?: Summary[];

  /**
   * Whether the summary was retrieved from cache
   */
  cached: boolean;

  /**
   * Total time taken to generate summary (ms)
   */
  durationMs: number;
}

/**
 * Options for summarization
 */
export interface SummarizeOptions {
  /**
   * Start index for messages to summarize
   */
  startIndex?: number;

  /**
   * End index for messages to summarize
   */
  endIndex?: number;

  /**
   * Whether to force regeneration (skip cache)
   */
  forceRegenerate?: boolean;

  /**
   * Additional context to include in summarization
   */
  context?: string;

  /**
   * Custom metadata for this summary
   */
  metadata?: Record<string, any>;
}

/**
 * Cache entry for summaries
 */
export interface SummaryCacheEntry {
  /**
   * Cache key
   */
  key: string;

  /**
   * Cached summary
   */
  summary: Summary;

  /**
   * Timestamp when cached
   */
  cachedAt: number;

  /**
   * TTL in seconds
   */
  ttl: number;
}

/**
 * Statistics for summarization operations
 */
export interface SummarizationStats {
  /**
   * Total number of summaries generated
   */
  totalSummaries: number;

  /**
   * Number of cached summaries used
   */
  cacheHits: number;

  /**
   * Number of summaries regenerated
   */
  cacheMisses: number;

  /**
   * Total tokens used for summarization
   */
  totalTokens: number;

  /**
   * Average time per summary (ms)
   */
  averageDurationMs: number;

  /**
   * Total time spent on summarization (ms)
   */
  totalDurationMs: number;
}

/**
 * Extractive summary sentence
 */
export interface ExtractedSentence {
  /**
   * The extracted sentence
   */
  text: string;

  /**
   * Score/importance of this sentence
   */
  score: number;

  /**
   * Source message index
   */
  messageIndex: number;

  /**
   * Role of the message author
   */
  role: string;
}

/**
 * Options for incremental summarization
 */
export interface IncrementalSummaryOptions {
  /**
   * Existing summary to build upon
   */
  existingSummary: Summary;

  /**
   * New messages to incorporate
   */
  newMessages: Message[];

  /**
   * Whether to merge or append new content
   */
  mode: 'merge' | 'append';
}
