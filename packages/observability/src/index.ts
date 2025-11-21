/**
 * @ainative/ai-kit-observability
 *
 * Usage tracking, cost monitoring, and observability dashboards for AI applications.
 *
 * @packageDocumentation
 */

// ============================================================================
// Usage Tracking - Track API usage and costs
// ============================================================================
export { UsageTracker } from './tracking/UsageTracker';
export { InMemoryStorage } from './tracking/InMemoryStorage';
export { FileStorage } from './tracking/FileStorage';
export type {
  UsageRecord,
  CostBreakdown,
  AggregatedUsage,
  ProviderUsage,
  ModelUsage,
  UserUsage,
  ConversationUsage,
  DateUsage,
  UsageFilter,
  ExportFormat,
  TrackingConfig,
  StorageBackend,
  ModelPricing,
  LLMProvider,
} from './tracking/types';
export {
  OPENAI_PRICING,
  ANTHROPIC_PRICING,
  ALL_PRICING,
  getModelPricing,
  calculateCost,
  detectProvider,
} from './tracking/pricing';
export {
  filterRecords,
  aggregateRecords,
  exportToFormat,
  generateId,
} from './tracking/utils';

// ============================================================================
// Monitoring - Real-time query monitoring and performance tracking
// ============================================================================
export { QueryMonitor, createQueryMonitor } from './monitoring/QueryMonitor';
export type {
  QueryEvent,
  QueryMetrics,
  Pattern,
  Alert,
  MonitorConfig,
  QueryContext,
  MonitoringStats,
  QueryEventType,
  PatternType,
  AlertSeverity,
  AlertType,
} from './monitoring/types';

// ============================================================================
// Instrumentation - Automatic tracing and metrics collection
// ============================================================================
export {
  InstrumentationManager,
  getInstrumentation,
  setInstrumentation,
  resetInstrumentation,
} from './instrumentation/InstrumentationManager';
export {
  OpenAIInterceptor,
  AnthropicInterceptor,
  GenericLLMInterceptor,
  ToolCallInterceptor,
  AgentExecutionInterceptor,
  createLoggingLLMInterceptor,
  createLoggingToolInterceptor,
  createLoggingAgentInterceptor,
} from './instrumentation/interceptors';
export type {
  InstrumentationConfig,
  Span,
  TraceContext,
  SpanStatus,
  SpanKind,
  Metric,
  MetricType,
  LLMInterceptor,
  ToolInterceptor,
  AgentInterceptor,
  TraceExporter,
  MetricsCollector,
  InterceptorContext,
  LLMMetrics,
  ToolMetrics,
  AgentMetrics,
} from './instrumentation/types';

// ============================================================================
// Alerts - Cost threshold monitoring and notifications
// ============================================================================
export { AlertManager } from './alerts/AlertManager';
export type {
  Alert as CostAlert,
  AlertConfig,
  Threshold,
  AlertCallback,
  WebhookConfig,
  EmailConfig,
  ChannelConfig,
  UsageMetrics as AlertUsageMetrics,
  AlertHistoryEntry,
} from './alerts/types';

// ============================================================================
// Reporting - Generate usage reports in multiple formats
// ============================================================================
export { ReportGenerator } from './reporting/ReportGenerator';
export type { UsageDataSource } from './reporting/ReportGenerator';
export { UsageTrackerAdapter } from './reporting/UsageTrackerAdapter';
export type {
  Report,
  ReportConfig,
  ReportFormat,
  ReportType,
  AggregationPeriod,
  TrendDirection,
  TrendAnalysis,
  TopConsumer,
  Anomaly,
  TimeSeriesPoint,
  ChartData,
  SummaryReport,
  DetailedReport,
  CostReport,
  ModelComparisonReport,
  UserReport,
  TrendReport,
  ReportFormatter,
} from './reporting/types';
export * from './reporting/formatters';
