/**
 * Report generator for usage analytics
 */

import type {
  UsageRecord,
  AggregatedUsage,
  UsageFilter,
  ModelUsage as TrackingModelUsage,
  UserUsage as TrackingUserUsage,
  LLMProvider,
} from '../tracking/types';
import type {
  Report,
  ReportConfig,
  SummaryReport,
  DetailedReport,
  CostReport,
  ModelComparisonReport,
  UserReport,
  TrendReport,
  TopConsumer,
  Anomaly,
  TrendAnalysis,
  TimeSeriesPoint,
  ChartData,
  AggregationPeriod,
} from './types';

/**
 * Data source interface for report generation
 */
export interface UsageDataSource {
  getRecords(filter?: UsageFilter): Promise<UsageRecord[]>;
  getAggregated(filter?: UsageFilter): Promise<AggregatedUsage>;
}

/**
 * Report generator class
 */
export class ReportGenerator {
  constructor(private dataSource: UsageDataSource) {}

  /**
   * Generate a report based on configuration
   */
  async generate(config: ReportConfig): Promise<Report> {
    const filter: UsageFilter = {
      ...config.filter,
      startDate: config.period.start,
      endDate: config.period.end,
    };

    switch (config.type) {
      case 'summary':
        return this.generateSummaryReport(config, filter);
      case 'detailed':
        return this.generateDetailedReport(config, filter);
      case 'cost':
        return this.generateCostReport(config, filter);
      case 'model-comparison':
        return this.generateModelComparisonReport(config, filter);
      case 'user':
        return this.generateUserReport(config, filter);
      case 'trend':
        return this.generateTrendReport(config, filter);
      default:
        throw new Error(`Unknown report type: ${config.type}`);
    }
  }

  /**
   * Generate summary report
   */
  private async generateSummaryReport(
    config: ReportConfig,
    filter: UsageFilter
  ): Promise<SummaryReport> {
    const records = await this.dataSource.getRecords(filter);
    const aggregated = await this.dataSource.getAggregated(filter);

    const topConsumers = this.identifyTopConsumers(
      records,
      aggregated,
      config.topN || 10
    );

    const trends = {
      cost: this.analyzeTrend(records, 'cost'),
      tokens: this.analyzeTrend(records, 'tokens'),
      requests: this.analyzeTrend(records, 'requests'),
    };

    const anomalies = config.includeAnomalies
      ? this.detectAnomalies(records)
      : [];

    return {
      type: 'summary',
      period: config.period,
      overview: aggregated,
      topConsumers,
      trends,
      anomalies,
    };
  }

  /**
   * Generate detailed report
   */
  private async generateDetailedReport(
    config: ReportConfig,
    filter: UsageFilter
  ): Promise<DetailedReport> {
    const records = await this.dataSource.getRecords(filter);
    const aggregated = await this.dataSource.getAggregated(filter);

    return {
      type: 'detailed',
      period: config.period,
      records,
      aggregated,
    };
  }

  /**
   * Generate cost report
   */
  private async generateCostReport(
    config: ReportConfig,
    filter: UsageFilter
  ): Promise<CostReport> {
    const records = await this.dataSource.getRecords(filter);
    const aggregated = await this.dataSource.getAggregated(filter);

    const byModel = Object.entries(aggregated.byModel || {}).map(
      ([model, usage]) => ({
        model,
        cost: usage.totalCost,
        percentage: (usage.totalCost / aggregated.totalCost) * 100,
      })
    );

    const byUser = Object.entries(aggregated.byUser || {}).map(
      ([userId, usage]) => ({
        userId,
        cost: usage.totalCost,
        percentage: (usage.totalCost / aggregated.totalCost) * 100,
      })
    );

    const byDay = Object.entries(aggregated.byDate || {})
      .map(([date, usage]) => ({
        date,
        cost: usage.totalCost,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const projections = this.calculateProjections(records);

    const charts: ChartData[] = [];
    if (config.includeCharts) {
      charts.push({
        type: 'line',
        title: 'Cost Over Time',
        xAxis: 'Date',
        yAxis: 'Cost ($)',
        data: byDay.map((d) => ({
          timestamp: new Date(d.date),
          value: d.cost,
          label: d.date,
        })),
      });

      charts.push({
        type: 'pie',
        title: 'Cost by Model',
        data: Object.fromEntries(
          byModel.map((m) => [m.model, m.cost])
        ),
      });
    }

    return {
      type: 'cost',
      period: config.period,
      totalCost: aggregated.totalCost,
      breakdown: {
        byModel: byModel.sort((a, b) => b.cost - a.cost),
        byUser: byUser.sort((a, b) => b.cost - a.cost),
        byDay,
      },
      projections,
      charts,
    };
  }

  /**
   * Generate model comparison report
   */
  private async generateModelComparisonReport(
    config: ReportConfig,
    filter: UsageFilter
  ): Promise<ModelComparisonReport> {
    const records = await this.dataSource.getRecords(filter);
    const aggregated = await this.dataSource.getAggregated(filter);

    const models = Object.entries(aggregated.byModel || {}).map(
      ([model, usage]) => ({
        model,
        provider: usage.provider,
        totalCost: usage.totalCost,
        avgCostPerRequest: usage.totalCost / usage.totalRequests,
        totalTokens: usage.totalTokens,
        avgTokensPerRequest: usage.totalTokens / usage.totalRequests,
        requestCount: usage.totalRequests,
        avgDurationMs:
          records
            .filter((r) => r.model === model)
            .reduce((sum, r) => sum + r.durationMs, 0) /
          usage.totalRequests,
        successRate:
          (usage.successfulRequests / usage.totalRequests) * 100,
      })
    );

    const charts: ChartData[] = [];
    if (config.includeCharts) {
      charts.push({
        type: 'bar',
        title: 'Cost per Model',
        xAxis: 'Model',
        yAxis: 'Cost ($)',
        data: Object.fromEntries(
          models.map((m) => [m.model, m.totalCost])
        ),
      });

      charts.push({
        type: 'bar',
        title: 'Tokens per Model',
        xAxis: 'Model',
        yAxis: 'Tokens',
        data: Object.fromEntries(
          models.map((m) => [m.model, m.totalTokens])
        ),
      });
    }

    return {
      type: 'model-comparison',
      period: config.period,
      models: models.sort((a, b) => b.totalCost - a.totalCost),
      charts,
    };
  }

  /**
   * Generate user report
   */
  private async generateUserReport(
    config: ReportConfig,
    filter: UsageFilter
  ): Promise<UserReport> {
    const records = await this.dataSource.getRecords(filter);
    const aggregated = await this.dataSource.getAggregated(filter);

    const users = Object.entries(aggregated.byUser || {}).map(
      ([userId, usage]) => {
        const userRecords = records.filter((r) => r.userId === userId);
        const modelCounts = userRecords.reduce(
          (acc, r) => {
            acc[r.model] = (acc[r.model] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        const favoriteModel = Object.entries(modelCounts).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || 'unknown';

        const lastActiveDate = new Date(
          Math.max(...userRecords.map((r) => r.timestamp.getTime()))
        );

        return {
          userId,
          totalCost: usage.totalCost,
          totalTokens: usage.totalTokens,
          requestCount: usage.totalRequests,
          avgCostPerRequest: usage.totalCost / usage.totalRequests,
          favoriteModel,
          lastActiveDate,
        };
      }
    );

    const charts: ChartData[] = [];
    if (config.includeCharts) {
      charts.push({
        type: 'bar',
        title: 'Cost per User',
        xAxis: 'User',
        yAxis: 'Cost ($)',
        data: Object.fromEntries(
          users.map((u) => [u.userId, u.totalCost])
        ),
      });
    }

    return {
      type: 'user',
      period: config.period,
      users: users.sort((a, b) => b.totalCost - a.totalCost),
      charts,
    };
  }

  /**
   * Generate trend report
   */
  private async generateTrendReport(
    config: ReportConfig,
    filter: UsageFilter
  ): Promise<TrendReport> {
    const records = await this.dataSource.getRecords(filter);
    const aggregationPeriod = config.aggregationPeriod || 'daily';

    const groupedData = this.groupByPeriod(records, aggregationPeriod);

    const trends = {
      cost: groupedData.map((g) => ({
        timestamp: g.timestamp,
        value: g.totalCost,
        label: g.label,
      })),
      tokens: groupedData.map((g) => ({
        timestamp: g.timestamp,
        value: g.totalTokens,
        label: g.label,
      })),
      requests: groupedData.map((g) => ({
        timestamp: g.timestamp,
        value: g.requestCount,
        label: g.label,
      })),
      avgDuration: groupedData.map((g) => ({
        timestamp: g.timestamp,
        value: g.avgDuration,
        label: g.label,
      })),
    };

    const analysis = {
      cost: this.analyzeTrend(records, 'cost'),
      tokens: this.analyzeTrend(records, 'tokens'),
      requests: this.analyzeTrend(records, 'requests'),
    };

    const charts: ChartData[] = [];
    if (config.includeCharts) {
      charts.push({
        type: 'line',
        title: 'Cost Trend',
        xAxis: 'Time',
        yAxis: 'Cost ($)',
        data: trends.cost,
      });

      charts.push({
        type: 'line',
        title: 'Token Usage Trend',
        xAxis: 'Time',
        yAxis: 'Tokens',
        data: trends.tokens,
      });

      charts.push({
        type: 'line',
        title: 'Request Count Trend',
        xAxis: 'Time',
        yAxis: 'Requests',
        data: trends.requests,
      });
    }

    return {
      type: 'trend',
      period: config.period,
      aggregationPeriod,
      trends,
      analysis,
      charts,
    };
  }

  /**
   * Identify top consumers
   */
  private identifyTopConsumers(
    records: UsageRecord[],
    aggregated: AggregatedUsage,
    topN: number
  ): TopConsumer[] {
    const consumers: TopConsumer[] = [];

    // Top models
    Object.entries(aggregated.byModel || {}).forEach(([model, usage]) => {
      consumers.push({
        id: model,
        type: 'model',
        totalCost: usage.totalCost,
        totalTokens: usage.totalTokens,
        requestCount: usage.totalRequests,
        percentageOfTotal: (usage.totalCost / aggregated.totalCost) * 100,
      });
    });

    // Top users
    Object.entries(aggregated.byUser || {}).forEach(([userId, usage]) => {
      consumers.push({
        id: userId,
        type: 'user',
        totalCost: usage.totalCost,
        totalTokens: usage.totalTokens,
        requestCount: usage.totalRequests,
        percentageOfTotal: (usage.totalCost / aggregated.totalCost) * 100,
      });
    });

    // Top conversations
    Object.entries(aggregated.byConversation || {}).forEach(
      ([conversationId, usage]) => {
        consumers.push({
          id: conversationId,
          type: 'conversation',
          totalCost: usage.totalCost,
          totalTokens: usage.totalTokens,
          requestCount: usage.totalRequests,
          percentageOfTotal: (usage.totalCost / aggregated.totalCost) * 100,
        });
      }
    );

    return consumers.sort((a, b) => b.totalCost - a.totalCost).slice(0, topN);
  }

  /**
   * Analyze trend in data
   */
  private analyzeTrend(
    records: UsageRecord[],
    metric: 'cost' | 'tokens' | 'requests'
  ): TrendAnalysis {
    if (records.length < 2) {
      return {
        direction: 'stable',
        percentageChange: 0,
        projection: 0,
        confidence: 0,
      };
    }

    // Sort by timestamp
    const sorted = [...records].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Split into first and second half
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    let firstValue: number;
    let secondValue: number;

    switch (metric) {
      case 'cost':
        firstValue = firstHalf.reduce(
          (sum, r) => sum + r.cost.totalCost,
          0
        );
        secondValue = secondHalf.reduce(
          (sum, r) => sum + r.cost.totalCost,
          0
        );
        break;
      case 'tokens':
        firstValue = firstHalf.reduce((sum, r) => sum + r.totalTokens, 0);
        secondValue = secondHalf.reduce((sum, r) => sum + r.totalTokens, 0);
        break;
      case 'requests':
        firstValue = firstHalf.length;
        secondValue = secondHalf.length;
        break;
    }

    const percentageChange =
      firstValue > 0 ? ((secondValue - firstValue) / firstValue) * 100 : 0;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(percentageChange) < 5) {
      direction = 'stable';
    } else if (percentageChange > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    // Simple linear projection
    const projection = secondValue + (secondValue - firstValue);

    // Confidence based on data consistency (simplified)
    const confidence = Math.min(records.length / 100, 1);

    return {
      direction,
      percentageChange,
      projection: Math.max(0, projection),
      confidence,
    };
  }

  /**
   * Detect anomalies in usage data
   */
  private detectAnomalies(records: UsageRecord[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (records.length < 10) {
      return anomalies;
    }

    // Calculate mean and standard deviation for cost
    const costs = records.map((r) => r.cost.totalCost);
    const meanCost = costs.reduce((sum, c) => sum + c, 0) / costs.length;
    const stdDevCost = Math.sqrt(
      costs.reduce((sum, c) => sum + Math.pow(c - meanCost, 2), 0) /
        costs.length
    );

    // Detect cost anomalies (values > 2 standard deviations)
    records.forEach((record) => {
      const deviation = Math.abs(record.cost.totalCost - meanCost);
      if (deviation > 2 * stdDevCost) {
        anomalies.push({
          timestamp: record.timestamp,
          type: 'cost',
          value: record.cost.totalCost,
          expectedValue: meanCost,
          deviation,
          severity: deviation > 3 * stdDevCost ? 'high' : 'medium',
        });
      }
    });

    // Calculate error rate
    const errorRate =
      (records.filter((r) => !r.success).length / records.length) * 100;
    if (errorRate > 10) {
      anomalies.push({
        timestamp: new Date(),
        type: 'error-rate',
        value: errorRate,
        expectedValue: 5,
        deviation: errorRate - 5,
        severity: errorRate > 25 ? 'high' : 'medium',
      });
    }

    return anomalies.slice(0, 10); // Return top 10 anomalies
  }

  /**
   * Calculate cost projections
   */
  private calculateProjections(records: UsageRecord[]): {
    daily: number;
    weekly: number;
    monthly: number;
  } {
    if (records.length === 0) {
      return { daily: 0, weekly: 0, monthly: 0 };
    }

    const sorted = [...records].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const firstDate = sorted[0].timestamp;
    const lastDate = sorted[sorted.length - 1].timestamp;
    const durationMs = lastDate.getTime() - firstDate.getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);

    const totalCost = records.reduce(
      (sum, r) => sum + r.cost.totalCost,
      0
    );

    const dailyAvg = durationDays > 0 ? totalCost / durationDays : totalCost;

    return {
      daily: dailyAvg,
      weekly: dailyAvg * 7,
      monthly: dailyAvg * 30,
    };
  }

  /**
   * Group records by time period
   */
  private groupByPeriod(
    records: UsageRecord[],
    period: AggregationPeriod
  ): Array<{
    timestamp: Date;
    label: string;
    requestCount: number;
    totalTokens: number;
    totalCost: number;
    avgDuration: number;
  }> {
    const groups = new Map<
      string,
      {
        timestamp: Date;
        label: string;
        records: UsageRecord[];
      }
    >();

    records.forEach((record) => {
      const key = this.getPeriodKey(record.timestamp, period);
      if (!groups.has(key)) {
        groups.set(key, {
          timestamp: this.getPeriodStart(record.timestamp, period),
          label: key,
          records: [],
        });
      }
      groups.get(key)!.records.push(record);
    });

    return Array.from(groups.values())
      .map((group) => ({
        timestamp: group.timestamp,
        label: group.label,
        requestCount: group.records.length,
        totalTokens: group.records.reduce(
          (sum, r) => sum + r.totalTokens,
          0
        ),
        totalCost: group.records.reduce(
          (sum, r) => sum + r.cost.totalCost,
          0
        ),
        avgDuration:
          group.records.reduce((sum, r) => sum + r.durationMs, 0) /
          group.records.length,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, period: AggregationPeriod): string {
    switch (period) {
      case 'hourly':
        return date.toISOString().slice(0, 13);
      case 'daily':
        return date.toISOString().slice(0, 10);
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      case 'monthly':
        return date.toISOString().slice(0, 7);
      case 'custom':
        return date.toISOString().slice(0, 10);
    }
  }

  /**
   * Get period start date
   */
  private getPeriodStart(date: Date, period: AggregationPeriod): Date {
    const d = new Date(date);
    switch (period) {
      case 'hourly':
        d.setMinutes(0, 0, 0);
        return d;
      case 'daily':
        d.setHours(0, 0, 0, 0);
        return d;
      case 'weekly':
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        return d;
      case 'monthly':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      case 'custom':
        return d;
    }
  }
}
