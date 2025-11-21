/**
 * Usage tracker for monitoring LLM usage and costs
 */

import {
  UsageRecord,
  TrackingConfig,
  StorageBackend,
  UsageFilter,
  AggregatedUsage,
  ExportFormat,
  LLMProvider,
} from './types';
import { InMemoryStorage } from './InMemoryStorage';
import { FileStorage } from './FileStorage';
import { calculateCost, detectProvider } from './pricing';
import { generateId } from './utils';

/**
 * Main usage tracker class
 * Provides automatic tracking of LLM API calls with cost calculation
 */
export class UsageTracker {
  private storage: StorageBackend;
  private config: TrackingConfig;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = {
      enabled: true,
      storage: 'memory',
      autoFlush: false,
      maxRecords: 10000,
      ...config,
    };

    // Initialize storage backend
    this.storage = this.createStorage();

    // Setup auto-flush if configured
    if (this.config.autoFlush && this.config.flushIntervalMs) {
      this.flushTimer = setInterval(() => {
        this.flush().catch(console.error);
      }, this.config.flushIntervalMs);
    }
  }

  /**
   * Create storage backend based on configuration
   */
  private createStorage(): StorageBackend {
    switch (this.config.storage) {
      case 'file':
        if (!this.config.filePath) {
          throw new Error('File path is required for file storage');
        }
        return new FileStorage(
          this.config.filePath,
          this.config.exportFormat || 'jsonl'
        );

      case 'memory':
      default:
        return new InMemoryStorage(this.config.maxRecords);
    }
  }

  /**
   * Track a single API call
   */
  async track(params: {
    model: string;
    provider?: LLMProvider;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    success: boolean;
    error?: string;
    userId?: string;
    conversationId?: string;
    metadata?: Record<string, any>;
  }): Promise<UsageRecord> {
    if (!this.config.enabled) {
      throw new Error('Usage tracking is disabled');
    }

    // Auto-detect provider if not provided
    const provider = params.provider || detectProvider(params.model);

    // Calculate token totals
    const totalTokens = params.promptTokens + params.completionTokens;

    // Calculate cost
    const cost = calculateCost(
      params.model,
      provider,
      params.promptTokens,
      params.completionTokens
    );

    // Create usage record
    const record: UsageRecord = {
      id: generateId(),
      timestamp: new Date(),
      provider,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens,
      durationMs: params.durationMs,
      success: params.success,
      error: params.error,
      cost,
      userId: params.userId,
      conversationId: params.conversationId,
      metadata: params.metadata,
    };

    // Store the record
    await this.storage.store(record);

    return record;
  }

  /**
   * Track a successful API call
   */
  async trackSuccess(params: {
    model: string;
    provider?: LLMProvider;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    userId?: string;
    conversationId?: string;
    metadata?: Record<string, any>;
  }): Promise<UsageRecord> {
    return this.track({
      ...params,
      success: true,
    });
  }

  /**
   * Track a failed API call
   */
  async trackFailure(params: {
    model: string;
    provider?: LLMProvider;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    error: string;
    userId?: string;
    conversationId?: string;
    metadata?: Record<string, any>;
  }): Promise<UsageRecord> {
    return this.track({
      ...params,
      success: false,
    });
  }

  /**
   * Get all usage records with optional filtering
   */
  async getRecords(filter?: UsageFilter): Promise<UsageRecord[]> {
    return this.storage.getAll(filter);
  }

  /**
   * Get aggregated usage statistics
   */
  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    return this.storage.getAggregated(filter);
  }

  /**
   * Export usage data in specified format
   */
  async export(format: ExportFormat, filter?: UsageFilter): Promise<string> {
    return this.storage.export(format, filter);
  }

  /**
   * Clear all usage data
   */
  async clear(): Promise<void> {
    await this.storage.clear();
  }

  /**
   * Flush data to persistent storage (for file storage)
   */
  async flush(): Promise<void> {
    // No-op for memory storage, file storage writes immediately
    // This method is here for future database implementation
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  /**
   * Wrap an LLM API call with automatic tracking
   */
  async wrap<T>(
    fn: () => Promise<T>,
    params: {
      model: string;
      provider?: LLMProvider;
      userId?: string;
      conversationId?: string;
      metadata?: Record<string, any>;
      extractTokens: (result: T) => {
        promptTokens: number;
        completionTokens: number;
      };
    }
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let success = true;
    let error: string | undefined;

    try {
      result = await fn();
    } catch (err: any) {
      success = false;
      error = err.message || String(err);
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;

      try {
        const tokens = success
          ? params.extractTokens(result!)
          : { promptTokens: 0, completionTokens: 0 };

        await this.track({
          model: params.model,
          provider: params.provider,
          promptTokens: tokens.promptTokens,
          completionTokens: tokens.completionTokens,
          durationMs,
          success,
          error,
          userId: params.userId,
          conversationId: params.conversationId,
          metadata: params.metadata,
        });
      } catch (trackError) {
        // Don't fail the original request if tracking fails
        console.error('Failed to track usage:', trackError);
      }
    }

    return result!;
  }
}
