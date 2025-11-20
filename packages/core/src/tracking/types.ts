/**
 * Usage tracking types for AI Kit
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic' | 'unknown';

/**
 * Usage record for a single LLM API call
 */
export interface UsageRecord {
  /** Unique identifier for this usage record */
  id: string;
  /** Timestamp when the request was made */
  timestamp: Date;
  /** User identifier (optional) */
  userId?: string;
  /** Conversation/session identifier (optional) */
  conversationId?: string;
  /** LLM provider */
  provider: LLMProvider;
  /** Model name (e.g., "gpt-4", "claude-3-opus") */
  model: string;
  /** Number of prompt tokens */
  promptTokens: number;
  /** Number of completion tokens */
  completionTokens: number;
  /** Total tokens (prompt + completion) */
  totalTokens: number;
  /** Request duration in milliseconds */
  durationMs: number;
  /** Whether the request was successful */
  success: boolean;
  /** Error message if request failed */
  error?: string;
  /** Cost breakdown */
  cost: CostBreakdown;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Cost breakdown for a request
 */
export interface CostBreakdown {
  /** Cost for prompt tokens in USD */
  promptCost: number;
  /** Cost for completion tokens in USD */
  completionCost: number;
  /** Total cost in USD */
  totalCost: number;
  /** Currency (always USD for now) */
  currency: 'USD';
}

/**
 * Aggregated usage statistics
 */
export interface AggregatedUsage {
  /** Total number of requests */
  totalRequests: number;
  /** Number of successful requests */
  successfulRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Total prompt tokens */
  totalPromptTokens: number;
  /** Total completion tokens */
  totalCompletionTokens: number;
  /** Total tokens */
  totalTokens: number;
  /** Total cost in USD */
  totalCost: number;
  /** Average cost per request in USD */
  avgCostPerRequest: number;
  /** Average duration in milliseconds */
  avgDurationMs: number;
  /** Breakdown by provider */
  byProvider: Record<LLMProvider, ProviderUsage>;
  /** Breakdown by model */
  byModel: Record<string, ModelUsage>;
  /** Breakdown by user (if userId is provided) */
  byUser?: Record<string, UserUsage>;
  /** Breakdown by conversation (if conversationId is provided) */
  byConversation?: Record<string, ConversationUsage>;
  /** Breakdown by date (YYYY-MM-DD) */
  byDate?: Record<string, DateUsage>;
}

/**
 * Usage statistics for a provider
 */
export interface ProviderUsage {
  provider: LLMProvider;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
}

/**
 * Usage statistics for a model
 */
export interface ModelUsage {
  model: string;
  provider: LLMProvider;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
}

/**
 * Usage statistics for a user
 */
export interface UserUsage {
  userId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
}

/**
 * Usage statistics for a conversation
 */
export interface ConversationUsage {
  conversationId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
}

/**
 * Usage statistics for a date
 */
export interface DateUsage {
  date: string; // YYYY-MM-DD format
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
}

/**
 * Filter for querying usage records
 */
export interface UsageFilter {
  /** Filter by user ID */
  userId?: string;
  /** Filter by conversation ID */
  conversationId?: string;
  /** Filter by provider */
  provider?: LLMProvider;
  /** Filter by model */
  model?: string;
  /** Filter by date range (start) */
  startDate?: Date;
  /** Filter by date range (end) */
  endDate?: Date;
  /** Filter by success status */
  success?: boolean;
}

/**
 * Export format for usage data
 */
export type ExportFormat = 'json' | 'csv' | 'jsonl';

/**
 * Configuration for usage tracking
 */
export interface TrackingConfig {
  /** Whether tracking is enabled */
  enabled: boolean;
  /** Storage backend type */
  storage: 'memory' | 'file' | 'database';
  /** File path for file storage */
  filePath?: string;
  /** Export format for file storage */
  exportFormat?: ExportFormat;
  /** Database connection string for database storage */
  databaseUrl?: string;
  /** Whether to automatically flush to storage */
  autoFlush?: boolean;
  /** Flush interval in milliseconds */
  flushIntervalMs?: number;
  /** Maximum number of records to keep in memory */
  maxRecords?: number;
}

/**
 * Storage backend interface
 */
export interface StorageBackend {
  /** Store a usage record */
  store(record: UsageRecord): Promise<void>;
  /** Get all usage records */
  getAll(filter?: UsageFilter): Promise<UsageRecord[]>;
  /** Get aggregated usage statistics */
  getAggregated(filter?: UsageFilter): Promise<AggregatedUsage>;
  /** Clear all records */
  clear(): Promise<void>;
  /** Export records to a specific format */
  export(format: ExportFormat, filter?: UsageFilter): Promise<string>;
}

/**
 * Model pricing information
 */
export interface ModelPricing {
  /** Model name */
  model: string;
  /** Provider */
  provider: LLMProvider;
  /** Cost per 1K prompt tokens in USD */
  promptCostPer1k: number;
  /** Cost per 1K completion tokens in USD */
  completionCostPer1k: number;
}
