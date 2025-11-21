/**
 * Types for usage reporting
 */

import type {
  UsageRecord,
  AggregatedUsage,
  UsageFilter,
} from '../tracking/types';

/**
 * Report format types
 */
export type ReportFormat = 'json' | 'csv' | 'html' | 'markdown';

/**
 * Aggregation period for time-based reports
 */
export type AggregationPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Report type
 */
export type ReportType =
  | 'summary'
  | 'detailed'
  | 'cost'
  | 'model-comparison'
  | 'user'
  | 'trend';

/**
 * Trend direction
 */
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: TrendDirection;
  percentageChange: number;
  projection: number;
  confidence: number;
}

/**
 * Top consumer information
 */
export interface TopConsumer {
  id: string;
  type: 'user' | 'model' | 'conversation';
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  percentageOfTotal: number;
}

/**
 * Anomaly detection result
 */
export interface Anomaly {
  timestamp: Date;
  type: 'cost' | 'tokens' | 'latency' | 'error-rate';
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

/**
 * Chart data for visualization
 */
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  xAxis?: string;
  yAxis?: string;
  data: TimeSeriesPoint[] | Record<string, number>;
}

/**
 * Summary report data
 */
export interface SummaryReport {
  type: 'summary';
  period: {
    start: Date;
    end: Date;
  };
  overview: AggregatedUsage;
  topConsumers: TopConsumer[];
  trends: {
    cost: TrendAnalysis;
    tokens: TrendAnalysis;
    requests: TrendAnalysis;
  };
  anomalies: Anomaly[];
}

/**
 * Detailed report data
 */
export interface DetailedReport {
  type: 'detailed';
  period: {
    start: Date;
    end: Date;
  };
  records: UsageRecord[];
  aggregated: AggregatedUsage;
}

/**
 * Cost report data
 */
export interface CostReport {
  type: 'cost';
  period: {
    start: Date;
    end: Date;
  };
  totalCost: number;
  breakdown: {
    byModel: Array<{ model: string; cost: number; percentage: number }>;
    byUser: Array<{ userId: string; cost: number; percentage: number }>;
    byDay: Array<{ date: string; cost: number }>;
  };
  projections: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  charts: ChartData[];
}

/**
 * Model comparison report data
 */
export interface ModelComparisonReport {
  type: 'model-comparison';
  period: {
    start: Date;
    end: Date;
  };
  models: Array<{
    model: string;
    provider: string;
    totalCost: number;
    avgCostPerRequest: number;
    totalTokens: number;
    avgTokensPerRequest: number;
    requestCount: number;
    avgDurationMs: number;
    successRate: number;
  }>;
  charts: ChartData[];
}

/**
 * User report data
 */
export interface UserReport {
  type: 'user';
  period: {
    start: Date;
    end: Date;
  };
  users: Array<{
    userId: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    avgCostPerRequest: number;
    favoriteModel: string;
    lastActiveDate: Date;
  }>;
  charts: ChartData[];
}

/**
 * Trend report data
 */
export interface TrendReport {
  type: 'trend';
  period: {
    start: Date;
    end: Date;
  };
  aggregationPeriod: AggregationPeriod;
  trends: {
    cost: TimeSeriesPoint[];
    tokens: TimeSeriesPoint[];
    requests: TimeSeriesPoint[];
    avgDuration: TimeSeriesPoint[];
  };
  analysis: {
    cost: TrendAnalysis;
    tokens: TrendAnalysis;
    requests: TrendAnalysis;
  };
  charts: ChartData[];
}

/**
 * Union type for all report types
 */
export type Report =
  | SummaryReport
  | DetailedReport
  | CostReport
  | ModelComparisonReport
  | UserReport
  | TrendReport;

/**
 * Report configuration
 */
export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  period: {
    start: Date;
    end: Date;
  };
  filter?: UsageFilter;
  aggregationPeriod?: AggregationPeriod;
  includeCharts?: boolean;
  includeAnomalies?: boolean;
  topN?: number; // For top consumers
}

/**
 * Formatter interface
 */
export interface ReportFormatter {
  format(report: Report, config: ReportConfig): string;
}
