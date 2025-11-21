/**
 * MockUsageTracker - Test double for UsageTracker
 */

import type {
  UsageRecord,
  UsageFilter,
  AggregatedUsage,
  ExportFormat,
  LLMProvider,
  MockUsageTrackerConfig,
} from '../types';

/**
 * Mock implementation of UsageTracker for testing
 */
export class MockUsageTracker {
  private records: UsageRecord[] = [];
  private enabled: boolean;
  private trackCalls: boolean;
  private mockCostCalculation?: (
    promptTokens: number,
    completionTokens: number
  ) => number;
  private callHistory: Array<{
    method: string;
    params: any;
    timestamp: Date;
  }> = [];

  constructor(config: MockUsageTrackerConfig = {}) {
    this.enabled = config.enabled !== false;
    this.trackCalls = config.trackCalls !== false;
    this.mockCostCalculation = config.mockCostCalculation;
    this.records = config.initialRecords || [];
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
    this.recordCall('track', params);

    if (!this.enabled) {
      throw new Error('Usage tracking is disabled');
    }

    const totalTokens = params.promptTokens + params.completionTokens;

    // Calculate cost
    const totalCost = this.mockCostCalculation
      ? this.mockCostCalculation(params.promptTokens, params.completionTokens)
      : 0.001;

    const record: UsageRecord = {
      id: this.generateId(),
      timestamp: new Date(),
      provider: params.provider || 'openai',
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens,
      durationMs: params.durationMs,
      success: params.success,
      error: params.error,
      cost: {
        promptCost: totalCost * 0.6,
        completionCost: totalCost * 0.4,
        totalCost,
        currency: 'USD',
      },
      userId: params.userId,
      conversationId: params.conversationId,
      metadata: params.metadata,
    };

    if (this.trackCalls) {
      this.records.push(record);
    }

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
    this.recordCall('getRecords', filter);

    if (!filter) {
      return [...this.records];
    }

    return this.records.filter((record) => {
      if (filter.userId && record.userId !== filter.userId) return false;
      if (filter.conversationId && record.conversationId !== filter.conversationId)
        return false;
      if (filter.provider && record.provider !== filter.provider) return false;
      if (filter.model && record.model !== filter.model) return false;
      if (filter.success !== undefined && record.success !== filter.success)
        return false;
      if (filter.startDate && record.timestamp < filter.startDate) return false;
      if (filter.endDate && record.timestamp > filter.endDate) return false;

      return true;
    });
  }

  /**
   * Get aggregated usage statistics
   */
  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    this.recordCall('getAggregated', filter);

    const records = await this.getRecords(filter);

    const totalRequests = records.length;
    const successfulRequests = records.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const totalPromptTokens = records.reduce((sum, r) => sum + r.promptTokens, 0);
    const totalCompletionTokens = records.reduce(
      (sum, r) => sum + r.completionTokens,
      0
    );
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost.totalCost, 0);

    const avgCostPerRequest =
      totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgDurationMs =
      totalRequests > 0
        ? records.reduce((sum, r) => sum + r.durationMs, 0) / totalRequests
        : 0;

    // Build provider breakdown
    const byProvider: Record<LLMProvider, any> = {} as any;
    records.forEach((record) => {
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = {
          provider: record.provider,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      const providerStats = byProvider[record.provider];
      providerStats.totalRequests++;
      if (record.success) providerStats.successfulRequests++;
      else providerStats.failedRequests++;
      providerStats.totalTokens += record.totalTokens;
      providerStats.totalCost += record.cost.totalCost;
    });

    // Build model breakdown
    const byModel: Record<string, any> = {};
    records.forEach((record) => {
      if (!byModel[record.model]) {
        byModel[record.model] = {
          model: record.model,
          provider: record.provider,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      const modelStats = byModel[record.model];
      modelStats.totalRequests++;
      if (record.success) modelStats.successfulRequests++;
      else modelStats.failedRequests++;
      modelStats.totalTokens += record.totalTokens;
      modelStats.totalCost += record.cost.totalCost;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens,
      totalCost,
      avgCostPerRequest,
      avgDurationMs,
      byProvider,
      byModel,
    };
  }

  /**
   * Export usage data in specified format
   */
  async export(format: ExportFormat, filter?: UsageFilter): Promise<string> {
    this.recordCall('export', { format, filter });

    const records = await this.getRecords(filter);

    switch (format) {
      case 'json':
        return JSON.stringify(records, null, 2);
      case 'jsonl':
        return records.map((r) => JSON.stringify(r)).join('\n');
      case 'csv':
        if (records.length === 0) return '';
        const firstRecord = records[0];
        if (!firstRecord) return '';
        const headers = Object.keys(firstRecord).join(',');
        const rows = records.map((r) => Object.values(r).join(','));
        return [headers, ...rows].join('\n');
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Clear all usage data
   */
  async clear(): Promise<void> {
    this.recordCall('clear', undefined);
    this.records = [];
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
    this.recordCall('wrap', params);

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

  /**
   * Get call history for assertions
   */
  getCallHistory(): Array<{ method: string; params: any; timestamp: Date }> {
    return [...this.callHistory];
  }

  /**
   * Get number of records
   */
  getRecordCount(): number {
    return this.records.length;
  }

  /**
   * Add a mock record manually
   */
  addMockRecord(record: Partial<UsageRecord>): void {
    const fullRecord: UsageRecord = {
      id: record.id || this.generateId(),
      timestamp: record.timestamp || new Date(),
      provider: record.provider || 'openai',
      model: record.model || 'gpt-4',
      promptTokens: record.promptTokens || 0,
      completionTokens: record.completionTokens || 0,
      totalTokens: record.totalTokens || 0,
      durationMs: record.durationMs || 0,
      success: record.success !== false,
      error: record.error,
      cost: record.cost || {
        promptCost: 0,
        completionCost: 0,
        totalCost: 0,
        currency: 'USD',
      },
      userId: record.userId,
      conversationId: record.conversationId,
      metadata: record.metadata,
    };

    this.records.push(fullRecord);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record method call
   */
  private recordCall(method: string, params: any): void {
    this.callHistory.push({
      method,
      params,
      timestamp: new Date(),
    });
  }
}
