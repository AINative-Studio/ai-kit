/**
 * Utility functions for usage tracking
 */

import {
  UsageRecord,
  UsageFilter,
  AggregatedUsage,
  ExportFormat,
  LLMProvider,
  ProviderUsage,
  ModelUsage,
  UserUsage,
  ConversationUsage,
  DateUsage,
} from './types';

/**
 * Filter records based on criteria
 */
export function filterRecords(
  records: UsageRecord[],
  filter: UsageFilter
): UsageRecord[] {
  return records.filter((record) => {
    if (filter.userId && record.userId !== filter.userId) {
      return false;
    }

    if (filter.conversationId && record.conversationId !== filter.conversationId) {
      return false;
    }

    if (filter.provider && record.provider !== filter.provider) {
      return false;
    }

    if (filter.model && record.model !== filter.model) {
      return false;
    }

    if (filter.startDate && record.timestamp < filter.startDate) {
      return false;
    }

    if (filter.endDate && record.timestamp > filter.endDate) {
      return false;
    }

    if (filter.success !== undefined && record.success !== filter.success) {
      return false;
    }

    return true;
  });
}

/**
 * Aggregate usage records
 */
export function aggregateRecords(records: UsageRecord[]): AggregatedUsage {
  if (records.length === 0) {
    return createEmptyAggregation();
  }

  const byProvider: Record<LLMProvider, ProviderUsage> = {
    openai: createEmptyProviderUsage('openai'),
    anthropic: createEmptyProviderUsage('anthropic'),
    unknown: createEmptyProviderUsage('unknown'),
  };

  const byModel: Record<string, ModelUsage> = {};
  const byUser: Record<string, UserUsage> = {};
  const byConversation: Record<string, ConversationUsage> = {};
  const byDate: Record<string, DateUsage> = {};

  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let totalDurationMs = 0;

  for (const record of records) {
    totalRequests++;
    if (record.success) {
      successfulRequests++;
    } else {
      failedRequests++;
    }

    totalPromptTokens += record.promptTokens;
    totalCompletionTokens += record.completionTokens;
    totalTokens += record.totalTokens;
    totalCost += record.cost.totalCost;
    totalDurationMs += record.durationMs;

    // Provider aggregation
    const provider = byProvider[record.provider];
    provider.totalRequests++;
    if (record.success) {
      provider.successfulRequests++;
    } else {
      provider.failedRequests++;
    }
    provider.totalTokens += record.totalTokens;
    provider.totalCost += record.cost.totalCost;

    // Model aggregation
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
    const model = byModel[record.model];
    model.totalRequests++;
    if (record.success) {
      model.successfulRequests++;
    } else {
      model.failedRequests++;
    }
    model.totalTokens += record.totalTokens;
    model.totalCost += record.cost.totalCost;

    // User aggregation
    if (record.userId) {
      if (!byUser[record.userId]) {
        byUser[record.userId] = {
          userId: record.userId,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      const user = byUser[record.userId];
      user.totalRequests++;
      if (record.success) {
        user.successfulRequests++;
      } else {
        user.failedRequests++;
      }
      user.totalTokens += record.totalTokens;
      user.totalCost += record.cost.totalCost;
    }

    // Conversation aggregation
    if (record.conversationId) {
      if (!byConversation[record.conversationId]) {
        byConversation[record.conversationId] = {
          conversationId: record.conversationId,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      const conversation = byConversation[record.conversationId];
      conversation.totalRequests++;
      if (record.success) {
        conversation.successfulRequests++;
      } else {
        conversation.failedRequests++;
      }
      conversation.totalTokens += record.totalTokens;
      conversation.totalCost += record.cost.totalCost;
    }

    // Date aggregation
    const dateKey = formatDate(record.timestamp);
    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        date: dateKey,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
      };
    }
    const date = byDate[dateKey];
    date.totalRequests++;
    if (record.success) {
      date.successfulRequests++;
    } else {
      date.failedRequests++;
    }
    date.totalTokens += record.totalTokens;
    date.totalCost += record.cost.totalCost;
  }

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalCost,
    avgCostPerRequest: totalCost / totalRequests,
    avgDurationMs: totalDurationMs / totalRequests,
    byProvider,
    byModel,
    byUser: Object.keys(byUser).length > 0 ? byUser : undefined,
    byConversation: Object.keys(byConversation).length > 0 ? byConversation : undefined,
    byDate: Object.keys(byDate).length > 0 ? byDate : undefined,
  };
}

/**
 * Export records to specified format
 */
export function exportToFormat(
  records: UsageRecord[],
  format: ExportFormat
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(records, null, 2);

    case 'jsonl':
      return records.map((r) => JSON.stringify(r)).join('\n');

    case 'csv':
      return exportToCsv(records);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export records to CSV format
 */
function exportToCsv(records: UsageRecord[]): string {
  if (records.length === 0) {
    return '';
  }

  const headers = [
    'id',
    'timestamp',
    'userId',
    'conversationId',
    'provider',
    'model',
    'promptTokens',
    'completionTokens',
    'totalTokens',
    'durationMs',
    'success',
    'error',
    'promptCost',
    'completionCost',
    'totalCost',
  ];

  const rows = records.map((record) => [
    record.id,
    record.timestamp.toISOString(),
    record.userId || '',
    record.conversationId || '',
    record.provider,
    record.model,
    record.promptTokens,
    record.completionTokens,
    record.totalTokens,
    record.durationMs,
    record.success,
    record.error || '',
    record.cost.promptCost,
    record.cost.completionCost,
    record.cost.totalCost,
  ]);

  const csvLines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvCell(String(cell))).join(',')
  );

  return csvLines.join('\n');
}

/**
 * Escape CSV cell value
 */
function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create empty aggregation
 */
function createEmptyAggregation(): AggregatedUsage {
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    avgCostPerRequest: 0,
    avgDurationMs: 0,
    byProvider: {
      openai: createEmptyProviderUsage('openai'),
      anthropic: createEmptyProviderUsage('anthropic'),
      unknown: createEmptyProviderUsage('unknown'),
    },
    byModel: {},
  };
}

/**
 * Create empty provider usage
 */
function createEmptyProviderUsage(provider: LLMProvider): ProviderUsage {
  return {
    provider,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    totalCost: 0,
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
