/**
 * Tests for ReportGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReportGenerator,
  UsageDataSource,
  ReportConfig,
  JSONFormatter,
  CSVFormatter,
  HTMLFormatter,
  MarkdownFormatter,
} from '../../src/reporting';
import type {
  UsageRecord,
  AggregatedUsage,
  UsageFilter,
  LLMProvider,
} from '../../src/tracking/types';

// Mock data source for testing
class MockDataSource implements UsageDataSource {
  private records: UsageRecord[] = [];

  constructor(records?: UsageRecord[]) {
    if (records) {
      this.records = records;
    }
  }

  async getRecords(filter?: UsageFilter): Promise<UsageRecord[]> {
    let filtered = [...this.records];

    if (filter) {
      if (filter.userId) {
        filtered = filtered.filter((r) => r.userId === filter.userId);
      }

      if (filter.model) {
        filtered = filtered.filter((r) => r.model === filter.model);
      }

      if (filter.startDate) {
        filtered = filtered.filter((r) => r.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        filtered = filtered.filter((r) => r.timestamp <= filter.endDate!);
      }

      if (filter.provider) {
        filtered = filtered.filter((r) => r.provider === filter.provider);
      }

      if (filter.conversationId) {
        filtered = filtered.filter((r) => r.conversationId === filter.conversationId);
      }

      if (filter.success !== undefined) {
        filtered = filtered.filter((r) => r.success === filter.success);
      }
    }

    return filtered;
  }

  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    const records = await this.getRecords(filter);

    if (records.length === 0) {
      return this.emptyAggregation();
    }

    const totalRequests = records.length;
    const successfulRequests = records.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const totalPromptTokens = records.reduce(
      (sum, r) => sum + r.promptTokens,
      0
    );
    const totalCompletionTokens = records.reduce(
      (sum, r) => sum + r.completionTokens,
      0
    );
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost.totalCost, 0);
    const avgCostPerRequest =
      totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgDurationMs =
      records.reduce((sum, r) => sum + r.durationMs, 0) / totalRequests;

    // Aggregate by provider
    const byProvider: Record<LLMProvider, any> = {
      openai: {
        provider: 'openai' as LLMProvider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
      },
      anthropic: {
        provider: 'anthropic' as LLMProvider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
      },
      unknown: {
        provider: 'unknown' as LLMProvider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
      },
    };

    records.forEach((r) => {
      const provider = byProvider[r.provider];
      provider.totalRequests++;
      if (r.success) provider.successfulRequests++;
      else provider.failedRequests++;
      provider.totalTokens += r.totalTokens;
      provider.totalCost += r.cost.totalCost;
    });

    // Aggregate by model
    const byModel: Record<string, any> = {};
    records.forEach((r) => {
      if (!byModel[r.model]) {
        byModel[r.model] = {
          model: r.model,
          provider: r.provider,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      const model = byModel[r.model];
      model.totalRequests++;
      if (r.success) model.successfulRequests++;
      else model.failedRequests++;
      model.totalTokens += r.totalTokens;
      model.totalCost += r.cost.totalCost;
    });

    // Aggregate by user
    const byUser: Record<string, any> = {};
    records.forEach((r) => {
      if (r.userId) {
        if (!byUser[r.userId]) {
          byUser[r.userId] = {
            userId: r.userId,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            totalCost: 0,
          };
        }
        const user = byUser[r.userId];
        user.totalRequests++;
        if (r.success) user.successfulRequests++;
        else user.failedRequests++;
        user.totalTokens += r.totalTokens;
        user.totalCost += r.cost.totalCost;
      }
    });

    // Aggregate by date
    const byDate: Record<string, any> = {};
    records.forEach((r) => {
      const date = r.timestamp.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = {
          date,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      const day = byDate[date];
      day.totalRequests++;
      if (r.success) day.successfulRequests++;
      else day.failedRequests++;
      day.totalTokens += r.totalTokens;
      day.totalCost += r.cost.totalCost;
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
      byUser: Object.keys(byUser).length > 0 ? byUser : undefined,
      byConversation: undefined,
      byDate: Object.keys(byDate).length > 0 ? byDate : undefined,
    };
  }

  private emptyAggregation(): AggregatedUsage {
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
        openai: {
          provider: 'openai',
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        },
        anthropic: {
          provider: 'anthropic',
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        },
        unknown: {
          provider: 'unknown',
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        },
      },
      byModel: {},
    };
  }
}

// Helper to create mock usage records
function createMockRecord(
  overrides: Partial<UsageRecord> = {}
): UsageRecord {
  return {
    id: 'test-' + Math.random(),
    timestamp: new Date(),
    provider: 'openai',
    model: 'gpt-4',
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
    durationMs: 1000,
    success: true,
    cost: {
      promptCost: 0.003,
      completionCost: 0.003,
      totalCost: 0.006,
      currency: 'USD',
    },
    ...overrides,
  };
}

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  let dataSource: MockDataSource;

  beforeEach(() => {
    dataSource = new MockDataSource();
    generator = new ReportGenerator(dataSource);
  });

  describe('Summary Report', () => {
    it('should generate a summary report', async () => {
      const records = [
        createMockRecord({
          userId: 'user1',
          model: 'gpt-4',
          timestamp: new Date('2024-06-01'),
        }),
        createMockRecord({
          userId: 'user2',
          model: 'gpt-3.5-turbo',
          timestamp: new Date('2024-06-02'),
        }),
        createMockRecord({
          userId: 'user1',
          model: 'gpt-4',
          timestamp: new Date('2024-06-03'),
        }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'summary',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        includeAnomalies: false,
        topN: 5,
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('summary');
      expect(report.overview.totalRequests).toBe(3);
      expect(report.topConsumers.length).toBeGreaterThan(0);
      expect(report.trends).toHaveProperty('cost');
      expect(report.trends).toHaveProperty('tokens');
      expect(report.trends).toHaveProperty('requests');
    });

    it('should identify top consumers', async () => {
      const records = [
        createMockRecord({
          userId: 'user1',
          model: 'gpt-4',
          timestamp: new Date('2024-06-01'),
          cost: { promptCost: 0.01, completionCost: 0.01, totalCost: 0.02, currency: 'USD' },
        }),
        createMockRecord({
          userId: 'user2',
          model: 'gpt-3.5-turbo',
          timestamp: new Date('2024-06-02'),
          cost: { promptCost: 0.001, completionCost: 0.001, totalCost: 0.002, currency: 'USD' },
        }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'summary',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        topN: 10,
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('summary');
      expect(report.topConsumers.length).toBeGreaterThan(0);
      // Top consumer should be user1 or gpt-4 (highest cost)
      const topConsumer = report.topConsumers[0];
      expect(topConsumer.totalCost).toBeGreaterThan(0);
    });
  });

  describe('Detailed Report', () => {
    it('should generate a detailed report', async () => {
      const records = [
        createMockRecord({ model: 'gpt-4', timestamp: new Date('2024-06-01') }),
        createMockRecord({ model: 'gpt-3.5-turbo', timestamp: new Date('2024-06-02') }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'detailed',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('detailed');
      expect(report.records).toHaveLength(2);
      expect(report.aggregated.totalRequests).toBe(2);
    });

    it('should filter records in detailed report', async () => {
      const records = [
        createMockRecord({ userId: 'user1', model: 'gpt-4', timestamp: new Date('2024-06-01') }),
        createMockRecord({ userId: 'user2', model: 'gpt-3.5-turbo', timestamp: new Date('2024-06-02') }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'detailed',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        filter: {
          userId: 'user1',
        },
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('detailed');
      expect(report.records).toHaveLength(1);
      expect(report.records[0].userId).toBe('user1');
    });
  });

  describe('Cost Report', () => {
    it('should generate a cost report', async () => {
      const records = [
        createMockRecord({
          model: 'gpt-4',
          timestamp: new Date('2024-06-01'),
          cost: { promptCost: 0.01, completionCost: 0.01, totalCost: 0.02, currency: 'USD' },
        }),
        createMockRecord({
          model: 'gpt-3.5-turbo',
          timestamp: new Date('2024-06-02'),
          cost: { promptCost: 0.001, completionCost: 0.001, totalCost: 0.002, currency: 'USD' },
        }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'cost',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        includeCharts: true,
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('cost');
      expect(report.totalCost).toBeGreaterThan(0);
      expect(report.breakdown.byModel).toBeDefined();
      expect(report.breakdown.byDay).toBeDefined();
      expect(report.projections).toHaveProperty('daily');
      expect(report.projections).toHaveProperty('weekly');
      expect(report.projections).toHaveProperty('monthly');
      expect(report.charts.length).toBeGreaterThan(0);
    });

    it('should calculate cost breakdown by model', async () => {
      const records = [
        createMockRecord({
          model: 'gpt-4',
          timestamp: new Date('2024-06-01'),
          cost: { promptCost: 0.01, completionCost: 0.01, totalCost: 0.02, currency: 'USD' },
        }),
        createMockRecord({
          model: 'gpt-4',
          timestamp: new Date('2024-06-02'),
          cost: { promptCost: 0.01, completionCost: 0.01, totalCost: 0.02, currency: 'USD' },
        }),
        createMockRecord({
          model: 'gpt-3.5-turbo',
          timestamp: new Date('2024-06-03'),
          cost: { promptCost: 0.001, completionCost: 0.001, totalCost: 0.002, currency: 'USD' },
        }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'cost',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('cost');
      expect(report.breakdown.byModel.length).toBe(2);
      // gpt-4 should have higher cost
      const gpt4 = report.breakdown.byModel.find((m) => m.model === 'gpt-4');
      expect(gpt4).toBeDefined();
      expect(gpt4!.cost).toBeCloseTo(0.04);
    });
  });

  describe('Model Comparison Report', () => {
    it('should generate a model comparison report', async () => {
      const records = [
        createMockRecord({
          model: 'gpt-4',
          timestamp: new Date('2024-06-01'),
          durationMs: 1000,
          cost: { promptCost: 0.01, completionCost: 0.01, totalCost: 0.02, currency: 'USD' },
        }),
        createMockRecord({
          model: 'gpt-3.5-turbo',
          timestamp: new Date('2024-06-02'),
          durationMs: 500,
          cost: { promptCost: 0.001, completionCost: 0.001, totalCost: 0.002, currency: 'USD' },
        }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'model-comparison',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        includeCharts: true,
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('model-comparison');
      expect(report.models.length).toBe(2);
      expect(report.charts.length).toBeGreaterThan(0);

      const gpt4 = report.models.find((m) => m.model === 'gpt-4');
      expect(gpt4).toBeDefined();
      expect(gpt4!.avgDurationMs).toBe(1000);
      expect(gpt4!.successRate).toBe(100);
    });
  });

  describe('User Report', () => {
    it('should generate a user report', async () => {
      const records = [
        createMockRecord({ userId: 'user1', model: 'gpt-4', timestamp: new Date('2024-06-01') }),
        createMockRecord({ userId: 'user1', model: 'gpt-4', timestamp: new Date('2024-06-02') }),
        createMockRecord({ userId: 'user2', model: 'gpt-3.5-turbo', timestamp: new Date('2024-06-03') }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'user',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        includeCharts: true,
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('user');
      expect(report.users.length).toBe(2);
      expect(report.charts.length).toBeGreaterThan(0);

      const user1 = report.users.find((u) => u.userId === 'user1');
      expect(user1).toBeDefined();
      expect(user1!.requestCount).toBe(2);
      expect(user1!.favoriteModel).toBe('gpt-4');
    });
  });

  describe('Trend Report', () => {
    it('should generate a trend report', async () => {
      const baseDate = new Date('2024-01-01');
      const records = [
        createMockRecord({
          timestamp: new Date(baseDate.getTime()),
          cost: { promptCost: 0.01, completionCost: 0.01, totalCost: 0.02, currency: 'USD' },
        }),
        createMockRecord({
          timestamp: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000),
          cost: { promptCost: 0.015, completionCost: 0.015, totalCost: 0.03, currency: 'USD' },
        }),
        createMockRecord({
          timestamp: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000),
          cost: { promptCost: 0.02, completionCost: 0.02, totalCost: 0.04, currency: 'USD' },
        }),
      ];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'trend',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        aggregationPeriod: 'daily',
        includeCharts: true,
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('trend');
      expect(report.aggregationPeriod).toBe('daily');
      expect(report.trends.cost.length).toBeGreaterThan(0);
      expect(report.trends.tokens.length).toBeGreaterThan(0);
      expect(report.trends.requests.length).toBeGreaterThan(0);
      expect(report.analysis.cost.direction).toBeDefined();
      expect(report.charts.length).toBeGreaterThan(0);
    });

    it('should detect increasing trend', async () => {
      const baseDate = new Date('2024-01-01');
      const records = Array.from({ length: 20 }, (_, i) =>
        createMockRecord({
          timestamp: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
          cost: {
            promptCost: 0.01 * (i + 1),
            completionCost: 0.01 * (i + 1),
            totalCost: 0.02 * (i + 1),
            currency: 'USD',
          },
        })
      );
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'trend',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        aggregationPeriod: 'daily',
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('trend');
      expect(report.analysis.cost.direction).toBe('increasing');
      expect(report.analysis.cost.percentageChange).toBeGreaterThan(0);
    });
  });

  describe('Formatters', () => {
    it('should format report as JSON', async () => {
      const records = [createMockRecord({ timestamp: new Date('2024-06-01') })];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'summary',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const report = await generator.generate(config);
      const formatter = new JSONFormatter();
      const output = formatter.format(report, config);

      expect(output).toBeTruthy();
      expect(typeof output).toBe('string');
      const parsed = JSON.parse(output);
      expect(parsed.type).toBe('summary');
    });

    it('should format report as CSV', async () => {
      const records = [createMockRecord({ timestamp: new Date('2024-06-01') })];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'detailed',
        format: 'csv',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const report = await generator.generate(config);
      const formatter = new CSVFormatter();
      const output = formatter.format(report, config);

      expect(output).toBeTruthy();
      expect(typeof output).toBe('string');
      expect(output).toContain(',');
    });

    it('should format report as HTML', async () => {
      const records = [createMockRecord({ timestamp: new Date('2024-06-01') })];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'summary',
        format: 'html',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const report = await generator.generate(config);
      const formatter = new HTMLFormatter();
      const output = formatter.format(report, config);

      expect(output).toBeTruthy();
      expect(typeof output).toBe('string');
      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('<html');
    });

    it('should format report as Markdown', async () => {
      const records = [createMockRecord({ timestamp: new Date('2024-06-01') })];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'summary',
        format: 'markdown',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const report = await generator.generate(config);
      const formatter = new MarkdownFormatter();
      const output = formatter.format(report, config);

      expect(output).toBeTruthy();
      expect(typeof output).toBe('string');
      expect(output).toContain('#');
      expect(output).toContain('|');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', async () => {
      const config: ReportConfig = {
        type: 'summary',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('summary');
      expect(report.overview.totalRequests).toBe(0);
      expect(report.topConsumers).toHaveLength(0);
    });

    it('should handle single record', async () => {
      const records = [createMockRecord({ timestamp: new Date('2024-06-01') })];
      dataSource = new MockDataSource(records);
      generator = new ReportGenerator(dataSource);

      const config: ReportConfig = {
        type: 'trend',
        format: 'json',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        aggregationPeriod: 'daily',
      };

      const report = await generator.generate(config);

      expect(report.type).toBe('trend');
      expect(report.trends.cost.length).toBeGreaterThan(0);
    });
  });
});
