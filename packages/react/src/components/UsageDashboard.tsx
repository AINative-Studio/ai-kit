/**
 * UsageDashboard - Pre-built React component for displaying AI usage statistics and analytics
 * Provides comprehensive visualization of usage data from UsageTracker
 */

import React, { useState, useMemo, useCallback } from 'react';
import type {
  UsageRecord,
  UsageFilter,
  AggregatedUsage,
  LLMProvider,
  ExportFormat,
} from '@ainative/ai-kit-core/src/tracking/types';

/**
 * Date range preset options
 */
export type DateRangePreset = 'today' | 'week' | 'month' | 'all' | 'custom';

/**
 * Time series granularity
 */
export type TimeSeriesGranularity = 'daily' | 'weekly' | 'monthly';

/**
 * Props for UsageDashboard component
 */
export interface UsageDashboardProps {
  /**
   * Usage records to display
   */
  records: UsageRecord[];

  /**
   * Aggregated usage statistics (optional, will be calculated if not provided)
   */
  aggregatedData?: AggregatedUsage;

  /**
   * Callback to export data
   */
  onExport?: (format: ExportFormat, filter?: UsageFilter) => Promise<string>;

  /**
   * Enable filtering controls
   * @default true
   */
  enableFiltering?: boolean;

  /**
   * Enable export functionality
   * @default true
   */
  enableExport?: boolean;

  /**
   * Enable time series charts
   * @default true
   */
  enableCharts?: boolean;

  /**
   * Show cost breakdown
   * @default true
   */
  showCostBreakdown?: boolean;

  /**
   * Show token usage
   * @default true
   */
  showTokenUsage?: boolean;

  /**
   * Show request metrics
   * @default true
   */
  showRequestMetrics?: boolean;

  /**
   * Theme variant
   * @default 'light'
   */
  theme?: 'light' | 'dark';

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Custom inline styles
   */
  style?: React.CSSProperties;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Test ID for testing
   * @default 'usage-dashboard'
   */
  testId?: string;

  /**
   * Callback when filter changes
   */
  onFilterChange?: (filter: UsageFilter) => void;

  /**
   * Initial date range preset
   * @default 'week'
   */
  defaultDateRange?: DateRangePreset;

  /**
   * Refresh callback
   */
  onRefresh?: () => void;
}

/**
 * Calculate aggregated usage from records
 */
function calculateAggregatedUsage(records: UsageRecord[]): AggregatedUsage {
  const totalRequests = records.length;
  const successfulRequests = records.filter((r) => r.success).length;
  const failedRequests = totalRequests - successfulRequests;

  const totalPromptTokens = records.reduce((sum, r) => sum + r.promptTokens, 0);
  const totalCompletionTokens = records.reduce((sum, r) => sum + r.completionTokens, 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const totalCost = records.reduce((sum, r) => sum + r.cost.totalCost, 0);
  const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
  const avgDurationMs = totalRequests > 0
    ? records.reduce((sum, r) => sum + r.durationMs, 0) / totalRequests
    : 0;

  const byProvider: Record<LLMProvider, any> = {
    openai: { provider: 'openai' as LLMProvider, totalRequests: 0, successfulRequests: 0, failedRequests: 0, totalTokens: 0, totalCost: 0 },
    anthropic: { provider: 'anthropic' as LLMProvider, totalRequests: 0, successfulRequests: 0, failedRequests: 0, totalTokens: 0, totalCost: 0 },
    unknown: { provider: 'unknown' as LLMProvider, totalRequests: 0, successfulRequests: 0, failedRequests: 0, totalTokens: 0, totalCost: 0 },
  };

  const byModel: Record<string, any> = {};
  const byDate: Record<string, any> = {};

  records.forEach((record) => {
    // By provider
    const providerData = byProvider[record.provider];
    providerData.totalRequests++;
    if (record.success) providerData.successfulRequests++;
    else providerData.failedRequests++;
    providerData.totalTokens += record.totalTokens;
    providerData.totalCost += record.cost.totalCost;

    // By model
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
    const modelData = byModel[record.model];
    modelData.totalRequests++;
    if (record.success) modelData.successfulRequests++;
    else modelData.failedRequests++;
    modelData.totalTokens += record.totalTokens;
    modelData.totalCost += record.cost.totalCost;

    // By date
    const dateKey = record.timestamp.toISOString().split('T')[0];
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
    const dateData = byDate[dateKey];
    dateData.totalRequests++;
    if (record.success) dateData.successfulRequests++;
    else dateData.failedRequests++;
    dateData.totalTokens += record.totalTokens;
    dateData.totalCost += record.cost.totalCost;
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
    byDate,
  };
}

/**
 * Filter records based on filter criteria
 */
function filterRecords(records: UsageRecord[], filter: UsageFilter): UsageRecord[] {
  return records.filter((record) => {
    if (filter.userId && record.userId !== filter.userId) return false;
    if (filter.conversationId && record.conversationId !== filter.conversationId) return false;
    if (filter.provider && record.provider !== filter.provider) return false;
    if (filter.model && record.model !== filter.model) return false;
    if (filter.success !== undefined && record.success !== filter.success) return false;
    if (filter.startDate && record.timestamp < filter.startDate) return false;
    if (filter.endDate && record.timestamp > filter.endDate) return false;
    return true;
  });
}

/**
 * Get date range from preset
 */
function getDateRangeFromPreset(preset: DateRangePreset): { startDate?: Date; endDate?: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: now };
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo, endDate: now };
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { startDate: monthAgo, endDate: now };
    }
    case 'all':
      return {};
    default:
      return {};
  }
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Simple bar chart component
 */
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  testId?: string;
}> = ({ data, maxValue, height = 200, showValues = true, testId = 'bar-chart' }) => {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <div className="usage-dashboard-bar-chart" data-testid={testId} style={{ height: `${height}px` }}>
      <div className="bar-chart-bars">
        {data.map((item, index) => {
          const percentage = max > 0 ? (item.value / max) * 100 : 0;
          return (
            <div key={index} className="bar-chart-item" data-testid={`${testId}-bar-${index}`}>
              <div className="bar-chart-bar-container">
                <div
                  className="bar-chart-bar"
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: item.color || '#3b82f6',
                  }}
                  title={`${item.label}: ${item.value}`}
                >
                  {showValues && percentage > 10 && (
                    <span className="bar-chart-value">{formatNumber(item.value)}</span>
                  )}
                </div>
              </div>
              <div className="bar-chart-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Simple line chart component
 */
const LineChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  testId?: string;
}> = ({ data, height = 200, color = '#3b82f6', testId = 'line-chart' }) => {
  if (data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="usage-dashboard-line-chart" data-testid={testId}>
      <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1 || 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="line-chart-labels">
        {data.map((point, index) => (
          <div key={index} className="line-chart-label">
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Metric card component
 */
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  testId?: string;
}> = ({ title, value, subtitle, color = '#3b82f6', icon, testId = 'metric-card' }) => {
  return (
    <div className="usage-dashboard-metric-card" data-testid={testId}>
      {icon && <div className="metric-card-icon" style={{ color }}>{icon}</div>}
      <div className="metric-card-content">
        <div className="metric-card-title">{title}</div>
        <div className="metric-card-value" style={{ color }}>{value}</div>
        {subtitle && <div className="metric-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

/**
 * UsageDashboard component
 */
export const UsageDashboard: React.FC<UsageDashboardProps> = ({
  records,
  aggregatedData: providedAggregatedData,
  onExport,
  enableFiltering = true,
  enableExport = true,
  enableCharts = true,
  showCostBreakdown = true,
  showTokenUsage = true,
  showRequestMetrics = true,
  theme = 'light',
  className = '',
  style,
  loading = false,
  error,
  testId = 'usage-dashboard',
  onFilterChange,
  defaultDateRange = 'week',
  onRefresh,
}) => {
  const [filter, setFilter] = useState<UsageFilter>(() => getDateRangeFromPreset(defaultDateRange));
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>(defaultDateRange);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  // Filter records
  const filteredRecords = useMemo(() => filterRecords(records, filter), [records, filter]);

  // Calculate or use provided aggregated data
  const aggregatedData = useMemo(() => {
    if (providedAggregatedData) return providedAggregatedData;
    return calculateAggregatedUsage(filteredRecords);
  }, [filteredRecords, providedAggregatedData]);

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilter: Partial<UsageFilter>) => {
      const updatedFilter = { ...filter, ...newFilter };
      setFilter(updatedFilter);
      if (onFilterChange) {
        onFilterChange(updatedFilter);
      }
    },
    [filter, onFilterChange]
  );

  // Handle date range preset change
  const handleDateRangeChange = useCallback(
    (preset: DateRangePreset) => {
      setDateRangePreset(preset);
      if (preset !== 'custom') {
        const dateRange = getDateRangeFromPreset(preset);
        handleFilterChange(dateRange);
      }
    },
    [handleFilterChange]
  );

  // Handle export
  const handleExport = useCallback(async () => {
    if (!onExport) return;
    setExporting(true);
    try {
      const exportData = await onExport(exportFormat, filter);
      const blob = new Blob([exportData], { type: exportFormat === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-export-${Date.now()}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [onExport, exportFormat, filter]);

  // Prepare chart data
  const costByDateData = useMemo(() => {
    if (!aggregatedData.byDate) return [];
    return Object.values(aggregatedData.byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        label: d.date.substring(5), // MM-DD
        value: d.totalCost,
      }));
  }, [aggregatedData]);

  const requestsByModelData = useMemo(() => {
    return Object.values(aggregatedData.byModel)
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10)
      .map((m) => ({
        label: m.model,
        value: m.totalRequests,
        color: m.provider === 'openai' ? '#10a37f' : m.provider === 'anthropic' ? '#d97757' : '#6b7280',
      }));
  }, [aggregatedData]);

  const tokensByModelData = useMemo(() => {
    return Object.values(aggregatedData.byModel)
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 10)
      .map((m) => ({
        label: m.model,
        value: m.totalTokens,
        color: m.provider === 'openai' ? '#10a37f' : m.provider === 'anthropic' ? '#d97757' : '#6b7280',
      }));
  }, [aggregatedData]);

  // Get unique values for filters
  const uniqueModels = useMemo(() => {
    const models = new Set(records.map((r) => r.model));
    return Array.from(models).sort();
  }, [records]);

  const uniqueProviders: LLMProvider[] = ['openai', 'anthropic', 'unknown'];

  // Loading state
  if (loading) {
    return (
      <div className={`usage-dashboard usage-dashboard-${theme} ${className}`} data-testid={testId} style={style}>
        <div className="usage-dashboard-loading" data-testid={`${testId}-loading`}>
          <div className="loading-spinner" />
          <div>Loading usage data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`usage-dashboard usage-dashboard-${theme} ${className}`} data-testid={testId} style={style}>
        <div className="usage-dashboard-error" data-testid={`${testId}-error`} role="alert">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`usage-dashboard usage-dashboard-${theme} ${className}`} data-testid={testId} style={style}>
      <style>{`
        .usage-dashboard {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 24px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .usage-dashboard-dark {
          background: #1f2937;
          color: #f9fafb;
        }

        .usage-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .usage-dashboard-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }

        .usage-dashboard-dark .usage-dashboard-title {
          color: #f9fafb;
        }

        .usage-dashboard-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .usage-dashboard-button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .usage-dashboard-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .usage-dashboard-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .usage-dashboard-dark .usage-dashboard-button {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .usage-dashboard-dark .usage-dashboard-button:hover:not(:disabled) {
          background: #4b5563;
        }

        .usage-dashboard-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .usage-dashboard-filter {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .usage-dashboard-filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .usage-dashboard-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 14px;
          min-width: 150px;
        }

        .usage-dashboard-dark .usage-dashboard-select {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .usage-dashboard-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .usage-dashboard-metric-card {
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .usage-dashboard-dark .usage-dashboard-metric-card {
          background: #374151;
          border-color: #4b5563;
        }

        .metric-card-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .metric-card-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .metric-card-subtitle {
          font-size: 12px;
          color: #9ca3af;
        }

        .usage-dashboard-section {
          margin-bottom: 32px;
        }

        .usage-dashboard-section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #111827;
        }

        .usage-dashboard-dark .usage-dashboard-section-title {
          color: #f9fafb;
        }

        .usage-dashboard-chart-container {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        }

        .usage-dashboard-dark .usage-dashboard-chart-container {
          background: #374151;
          border-color: #4b5563;
        }

        .usage-dashboard-bar-chart {
          position: relative;
          width: 100%;
        }

        .bar-chart-bars {
          display: flex;
          align-items: flex-end;
          height: 100%;
          gap: 8px;
        }

        .bar-chart-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }

        .bar-chart-bar-container {
          width: 100%;
          height: 180px;
          display: flex;
          align-items: flex-end;
        }

        .bar-chart-bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transition: opacity 0.2s;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 8px;
          position: relative;
        }

        .bar-chart-bar:hover {
          opacity: 0.8;
        }

        .bar-chart-value {
          font-size: 11px;
          font-weight: 600;
          color: white;
        }

        .bar-chart-label {
          margin-top: 8px;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .usage-dashboard-line-chart {
          position: relative;
        }

        .line-chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .line-chart-label {
          font-size: 11px;
          color: #6b7280;
        }

        .chart-empty {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
          font-style: italic;
        }

        .usage-dashboard-loading,
        .usage-dashboard-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .error-message {
          color: #dc2626;
          font-size: 16px;
        }

        .usage-dashboard-dark .error-message {
          color: #f87171;
        }

        @media (max-width: 768px) {
          .usage-dashboard {
            padding: 16px;
          }

          .usage-dashboard-metrics {
            grid-template-columns: 1fr;
          }

          .usage-dashboard-filters {
            flex-direction: column;
          }

          .usage-dashboard-select {
            width: 100%;
          }
        }
      `}</style>

      {/* Header */}
      <div className="usage-dashboard-header">
        <h2 className="usage-dashboard-title">Usage Analytics</h2>
        <div className="usage-dashboard-actions">
          {onRefresh && (
            <button
              className="usage-dashboard-button"
              onClick={onRefresh}
              data-testid={`${testId}-refresh-button`}
            >
              🔄 Refresh
            </button>
          )}
          {enableExport && onExport && (
            <>
              <select
                className="usage-dashboard-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                data-testid={`${testId}-export-format-select`}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="jsonl">JSONL</option>
              </select>
              <button
                className="usage-dashboard-button"
                onClick={handleExport}
                disabled={exporting}
                data-testid={`${testId}-export-button`}
              >
                {exporting ? 'Exporting...' : '📥 Export'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      {enableFiltering && (
        <div className="usage-dashboard-filters" data-testid={`${testId}-filters`}>
          <div className="usage-dashboard-filter">
            <label className="usage-dashboard-filter-label">Date Range</label>
            <select
              className="usage-dashboard-select"
              value={dateRangePreset}
              onChange={(e) => handleDateRangeChange(e.target.value as DateRangePreset)}
              data-testid={`${testId}-date-range-select`}
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="usage-dashboard-filter">
            <label className="usage-dashboard-filter-label">Model</label>
            <select
              className="usage-dashboard-select"
              value={filter.model || ''}
              onChange={(e) => handleFilterChange({ model: e.target.value || undefined })}
              data-testid={`${testId}-model-select`}
            >
              <option value="">All Models</option>
              {uniqueModels.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div className="usage-dashboard-filter">
            <label className="usage-dashboard-filter-label">Provider</label>
            <select
              className="usage-dashboard-select"
              value={filter.provider || ''}
              onChange={(e) => handleFilterChange({ provider: e.target.value as LLMProvider || undefined })}
              data-testid={`${testId}-provider-select`}
            >
              <option value="">All Providers</option>
              {uniqueProviders.map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>

          <div className="usage-dashboard-filter">
            <label className="usage-dashboard-filter-label">Status</label>
            <select
              className="usage-dashboard-select"
              value={filter.success === undefined ? '' : filter.success ? 'success' : 'failed'}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange({
                  success: value === '' ? undefined : value === 'success'
                });
              }}
              data-testid={`${testId}-status-select`}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {showRequestMetrics && (
        <div className="usage-dashboard-metrics" data-testid={`${testId}-metrics`}>
          <MetricCard
            title="Total Requests"
            value={formatNumber(aggregatedData.totalRequests)}
            subtitle={`${aggregatedData.successfulRequests} successful`}
            color="#3b82f6"
            testId={`${testId}-metric-requests`}
          />
          <MetricCard
            title="Total Cost"
            value={formatCurrency(aggregatedData.totalCost)}
            subtitle={`${formatCurrency(aggregatedData.avgCostPerRequest)} avg`}
            color="#10b981"
            testId={`${testId}-metric-cost`}
          />
          <MetricCard
            title="Total Tokens"
            value={formatNumber(aggregatedData.totalTokens)}
            subtitle={`${formatNumber(aggregatedData.totalPromptTokens)} prompt + ${formatNumber(aggregatedData.totalCompletionTokens)} completion`}
            color="#8b5cf6"
            testId={`${testId}-metric-tokens`}
          />
          <MetricCard
            title="Avg Duration"
            value={formatDuration(aggregatedData.avgDurationMs)}
            subtitle={`${aggregatedData.failedRequests} failed requests`}
            color="#f59e0b"
            testId={`${testId}-metric-duration`}
          />
        </div>
      )}

      {/* Charts */}
      {enableCharts && (
        <>
          {/* Cost Over Time */}
          {showCostBreakdown && costByDateData.length > 0 && (
            <div className="usage-dashboard-section">
              <h3 className="usage-dashboard-section-title">Cost Over Time</h3>
              <div className="usage-dashboard-chart-container" data-testid={`${testId}-cost-chart`}>
                <LineChart
                  data={costByDateData}
                  height={200}
                  color="#10b981"
                  testId={`${testId}-cost-line-chart`}
                />
              </div>
            </div>
          )}

          {/* Requests by Model */}
          {requestsByModelData.length > 0 && (
            <div className="usage-dashboard-section">
              <h3 className="usage-dashboard-section-title">Requests by Model</h3>
              <div className="usage-dashboard-chart-container" data-testid={`${testId}-requests-chart`}>
                <BarChart
                  data={requestsByModelData}
                  height={200}
                  showValues
                  testId={`${testId}-requests-bar-chart`}
                />
              </div>
            </div>
          )}

          {/* Token Usage by Model */}
          {showTokenUsage && tokensByModelData.length > 0 && (
            <div className="usage-dashboard-section">
              <h3 className="usage-dashboard-section-title">Token Usage by Model</h3>
              <div className="usage-dashboard-chart-container" data-testid={`${testId}-tokens-chart`}>
                <BarChart
                  data={tokensByModelData}
                  height={200}
                  showValues
                  testId={`${testId}-tokens-bar-chart`}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsageDashboard;
