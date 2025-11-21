/**
 * Markdown formatter for reports
 */

import type { Report, ReportConfig, ReportFormatter } from '../types';

export class MarkdownFormatter implements ReportFormatter {
  format(report: Report, config: ReportConfig): string {
    switch (report.type) {
      case 'summary':
        return this.formatSummaryReport(report);
      case 'detailed':
        return this.formatDetailedReport(report);
      case 'cost':
        return this.formatCostReport(report);
      case 'model-comparison':
        return this.formatModelComparisonReport(report);
      case 'user':
        return this.formatUserReport(report);
      case 'trend':
        return this.formatTrendReport(report);
      default:
        throw new Error(`Unknown report type: ${(report as any).type}`);
    }
  }

  private formatSummaryReport(report: Report & { type: 'summary' }): string {
    const lines: string[] = [];

    lines.push('# Usage Summary Report');
    lines.push('');
    lines.push(
      `**Period:** ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`
    );
    lines.push('');

    // Overview
    lines.push('## Overview');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(
      `| Total Requests | ${report.overview.totalRequests.toLocaleString()} |`
    );
    lines.push(
      `| Successful | ${report.overview.successfulRequests.toLocaleString()} |`
    );
    lines.push(
      `| Failed | ${report.overview.failedRequests.toLocaleString()} |`
    );
    lines.push(
      `| Total Tokens | ${report.overview.totalTokens.toLocaleString()} |`
    );
    lines.push(
      `| Total Cost | $${report.overview.totalCost.toFixed(4)} |`
    );
    lines.push(
      `| Avg Cost/Request | $${report.overview.avgCostPerRequest.toFixed(6)} |`
    );
    lines.push(
      `| Avg Duration | ${report.overview.avgDurationMs.toFixed(2)}ms |`
    );
    lines.push('');

    // Top Consumers
    lines.push('## Top Consumers');
    lines.push('');
    lines.push(
      '| Type | ID | Total Cost | Total Tokens | Requests | % of Total |'
    );
    lines.push('|------|----|-----------:|-------------:|---------:|-----------:|');
    report.topConsumers.forEach((consumer) => {
      lines.push(
        `| ${consumer.type} | ${consumer.id} | $${consumer.totalCost.toFixed(4)} | ${consumer.totalTokens.toLocaleString()} | ${consumer.requestCount.toLocaleString()} | ${consumer.percentageOfTotal.toFixed(2)}% |`
      );
    });
    lines.push('');

    // Trends
    lines.push('## Trends');
    lines.push('');
    lines.push('| Metric | Direction | Change | Projection | Confidence |');
    lines.push('|--------|-----------|-------:|-----------:|-----------:|');
    lines.push(
      `| Cost | ${this.getTrendEmoji(report.trends.cost.direction)} ${report.trends.cost.direction} | ${report.trends.cost.percentageChange.toFixed(2)}% | $${report.trends.cost.projection.toFixed(4)} | ${(report.trends.cost.confidence * 100).toFixed(0)}% |`
    );
    lines.push(
      `| Tokens | ${this.getTrendEmoji(report.trends.tokens.direction)} ${report.trends.tokens.direction} | ${report.trends.tokens.percentageChange.toFixed(2)}% | ${report.trends.tokens.projection.toFixed(0)} | ${(report.trends.tokens.confidence * 100).toFixed(0)}% |`
    );
    lines.push(
      `| Requests | ${this.getTrendEmoji(report.trends.requests.direction)} ${report.trends.requests.direction} | ${report.trends.requests.percentageChange.toFixed(2)}% | ${report.trends.requests.projection.toFixed(0)} | ${(report.trends.requests.confidence * 100).toFixed(0)}% |`
    );
    lines.push('');

    // Anomalies
    if (report.anomalies.length > 0) {
      lines.push('## Anomalies');
      lines.push('');
      lines.push(
        '| Timestamp | Type | Value | Expected | Deviation | Severity |'
      );
      lines.push(
        '|-----------|------|------:|---------|----------:|----------|'
      );
      report.anomalies.forEach((anomaly) => {
        lines.push(
          `| ${anomaly.timestamp.toISOString()} | ${anomaly.type} | ${anomaly.value.toFixed(4)} | ${anomaly.expectedValue.toFixed(4)} | ${anomaly.deviation.toFixed(4)} | ${anomaly.severity} |`
        );
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatDetailedReport(report: Report & { type: 'detailed' }): string {
    const lines: string[] = [];

    lines.push('# Detailed Usage Report');
    lines.push('');
    lines.push(
      `**Period:** ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`
    );
    lines.push('');
    lines.push(`**Total Records:** ${report.records.length.toLocaleString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(
      `| Total Cost | $${report.aggregated.totalCost.toFixed(4)} |`
    );
    lines.push(
      `| Total Tokens | ${report.aggregated.totalTokens.toLocaleString()} |`
    );
    lines.push(
      `| Total Requests | ${report.aggregated.totalRequests.toLocaleString()} |`
    );
    lines.push('');

    // Records (showing first 20)
    lines.push('## Records');
    lines.push('');
    lines.push(
      '| Timestamp | Model | User | Tokens | Cost | Duration | Status |'
    );
    lines.push('|-----------|-------|------|-------:|-----:|---------:|--------|');

    const displayRecords = report.records.slice(0, 20);
    displayRecords.forEach((record) => {
      lines.push(
        `| ${record.timestamp.toISOString()} | ${record.model} | ${record.userId || 'N/A'} | ${record.totalTokens.toLocaleString()} | $${record.cost.totalCost.toFixed(6)} | ${record.durationMs.toFixed(0)}ms | ${record.success ? 'Success' : 'Failed'} |`
      );
    });

    if (report.records.length > 20) {
      lines.push('');
      lines.push(
        `*Showing 20 of ${report.records.length.toLocaleString()} records*`
      );
    }
    lines.push('');

    return lines.join('\n');
  }

  private formatCostReport(report: Report & { type: 'cost' }): string {
    const lines: string[] = [];

    lines.push('# Cost Report');
    lines.push('');
    lines.push(
      `**Period:** ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`
    );
    lines.push('');
    lines.push(
      `**Total Cost:** $${report.totalCost.toFixed(4)}`
    );
    lines.push('');

    // Cost by Model
    lines.push('## Cost by Model');
    lines.push('');
    lines.push('| Model | Cost | Percentage |');
    lines.push('|-------|-----:|-----------:|');
    report.breakdown.byModel.forEach((item) => {
      lines.push(
        `| ${item.model} | $${item.cost.toFixed(4)} | ${item.percentage.toFixed(2)}% |`
      );
    });
    lines.push('');

    // Cost by User
    if (report.breakdown.byUser.length > 0) {
      lines.push('## Cost by User');
      lines.push('');
      lines.push('| User ID | Cost | Percentage |');
      lines.push('|---------|-----:|-----------:|');
      report.breakdown.byUser.forEach((item) => {
        lines.push(
          `| ${item.userId} | $${item.cost.toFixed(4)} | ${item.percentage.toFixed(2)}% |`
        );
      });
      lines.push('');
    }

    // Daily Costs
    lines.push('## Daily Costs');
    lines.push('');
    lines.push('| Date | Cost |');
    lines.push('|------|-----:|');
    report.breakdown.byDay.forEach((item) => {
      lines.push(`| ${item.date} | $${item.cost.toFixed(4)} |`);
    });
    lines.push('');

    // Projections
    lines.push('## Projections');
    lines.push('');
    lines.push('| Period | Projected Cost |');
    lines.push('|--------|---------------:|');
    lines.push(`| Daily | $${report.projections.daily.toFixed(4)} |`);
    lines.push(`| Weekly | $${report.projections.weekly.toFixed(4)} |`);
    lines.push(`| Monthly | $${report.projections.monthly.toFixed(4)} |`);
    lines.push('');

    return lines.join('\n');
  }

  private formatModelComparisonReport(
    report: Report & { type: 'model-comparison' }
  ): string {
    const lines: string[] = [];

    lines.push('# Model Comparison Report');
    lines.push('');
    lines.push(
      `**Period:** ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`
    );
    lines.push('');

    lines.push(
      '| Model | Provider | Total Cost | Avg Cost/Req | Total Tokens | Avg Tokens/Req | Requests | Avg Duration | Success Rate |'
    );
    lines.push(
      '|-------|----------|----------:|-------------|------------:|---------------|--------:|-------------|------------:|'
    );

    report.models.forEach((model) => {
      lines.push(
        `| ${model.model} | ${model.provider} | $${model.totalCost.toFixed(4)} | $${model.avgCostPerRequest.toFixed(6)} | ${model.totalTokens.toLocaleString()} | ${model.avgTokensPerRequest.toFixed(0)} | ${model.requestCount.toLocaleString()} | ${model.avgDurationMs.toFixed(0)}ms | ${model.successRate.toFixed(1)}% |`
      );
    });
    lines.push('');

    return lines.join('\n');
  }

  private formatUserReport(report: Report & { type: 'user' }): string {
    const lines: string[] = [];

    lines.push('# User Report');
    lines.push('');
    lines.push(
      `**Period:** ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`
    );
    lines.push('');

    lines.push(
      '| User ID | Total Cost | Total Tokens | Requests | Avg Cost/Req | Favorite Model | Last Active |'
    );
    lines.push(
      '|---------|----------:|------------:|--------:|--------------:|----------------|-------------|'
    );

    report.users.forEach((user) => {
      lines.push(
        `| ${user.userId} | $${user.totalCost.toFixed(4)} | ${user.totalTokens.toLocaleString()} | ${user.requestCount.toLocaleString()} | $${user.avgCostPerRequest.toFixed(6)} | ${user.favoriteModel} | ${user.lastActiveDate.toISOString().split('T')[0]} |`
      );
    });
    lines.push('');

    return lines.join('\n');
  }

  private formatTrendReport(report: Report & { type: 'trend' }): string {
    const lines: string[] = [];

    lines.push('# Trend Report');
    lines.push('');
    lines.push(
      `**Period:** ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`
    );
    lines.push('');
    lines.push(`**Aggregation:** ${report.aggregationPeriod}`);
    lines.push('');

    // Trend Analysis
    lines.push('## Trend Analysis');
    lines.push('');
    lines.push('| Metric | Direction | Change | Projection | Confidence |');
    lines.push('|--------|-----------|-------:|-----------:|-----------:|');
    lines.push(
      `| Cost | ${this.getTrendEmoji(report.analysis.cost.direction)} ${report.analysis.cost.direction} | ${report.analysis.cost.percentageChange.toFixed(2)}% | $${report.analysis.cost.projection.toFixed(4)} | ${(report.analysis.cost.confidence * 100).toFixed(0)}% |`
    );
    lines.push(
      `| Tokens | ${this.getTrendEmoji(report.analysis.tokens.direction)} ${report.analysis.tokens.direction} | ${report.analysis.tokens.percentageChange.toFixed(2)}% | ${report.analysis.tokens.projection.toFixed(0)} | ${(report.analysis.tokens.confidence * 100).toFixed(0)}% |`
    );
    lines.push(
      `| Requests | ${this.getTrendEmoji(report.analysis.requests.direction)} ${report.analysis.requests.direction} | ${report.analysis.requests.percentageChange.toFixed(2)}% | ${report.analysis.requests.projection.toFixed(0)} | ${(report.analysis.requests.confidence * 100).toFixed(0)}% |`
    );
    lines.push('');

    // Cost Trend (showing first 10 points)
    lines.push('## Cost Trend');
    lines.push('');
    lines.push('| Timestamp | Cost |');
    lines.push('|-----------|-----:|');
    report.trends.cost.slice(0, 10).forEach((point) => {
      lines.push(
        `| ${point.timestamp.toISOString()} | $${point.value.toFixed(4)} |`
      );
    });
    if (report.trends.cost.length > 10) {
      lines.push(
        `*Showing 10 of ${report.trends.cost.length} data points*`
      );
    }
    lines.push('');

    return lines.join('\n');
  }

  private getTrendEmoji(direction: string): string {
    switch (direction) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '';
    }
  }
}
