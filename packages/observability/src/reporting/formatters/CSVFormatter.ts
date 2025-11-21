/**
 * CSV formatter for reports
 */

import type { Report, ReportConfig, ReportFormatter } from '../types';

export class CSVFormatter implements ReportFormatter {
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

    // Overview section
    lines.push('Overview');
    lines.push(
      'Total Requests,Successful,Failed,Total Tokens,Total Cost,Avg Duration'
    );
    lines.push(
      [
        report.overview.totalRequests,
        report.overview.successfulRequests,
        report.overview.failedRequests,
        report.overview.totalTokens,
        report.overview.totalCost.toFixed(4),
        report.overview.avgDurationMs.toFixed(2),
      ].join(',')
    );
    lines.push('');

    // Top consumers section
    lines.push('Top Consumers');
    lines.push('Type,ID,Total Cost,Total Tokens,Request Count,Percentage');
    report.topConsumers.forEach((consumer) => {
      lines.push(
        [
          consumer.type,
          this.escapeCSV(consumer.id),
          consumer.totalCost.toFixed(4),
          consumer.totalTokens,
          consumer.requestCount,
          consumer.percentageOfTotal.toFixed(2),
        ].join(',')
      );
    });
    lines.push('');

    // Trends section
    lines.push('Trends');
    lines.push('Metric,Direction,Percentage Change,Projection,Confidence');
    lines.push(
      [
        'Cost',
        report.trends.cost.direction,
        report.trends.cost.percentageChange.toFixed(2),
        report.trends.cost.projection.toFixed(4),
        report.trends.cost.confidence.toFixed(2),
      ].join(',')
    );
    lines.push(
      [
        'Tokens',
        report.trends.tokens.direction,
        report.trends.tokens.percentageChange.toFixed(2),
        report.trends.tokens.projection.toFixed(0),
        report.trends.tokens.confidence.toFixed(2),
      ].join(',')
    );
    lines.push(
      [
        'Requests',
        report.trends.requests.direction,
        report.trends.requests.percentageChange.toFixed(2),
        report.trends.requests.projection.toFixed(0),
        report.trends.requests.confidence.toFixed(2),
      ].join(',')
    );

    return lines.join('\n');
  }

  private formatDetailedReport(report: Report & { type: 'detailed' }): string {
    const lines: string[] = [];

    lines.push(
      'ID,Timestamp,User ID,Conversation ID,Provider,Model,Prompt Tokens,Completion Tokens,Total Tokens,Duration (ms),Success,Total Cost,Error'
    );

    report.records.forEach((record) => {
      lines.push(
        [
          record.id,
          record.timestamp.toISOString(),
          this.escapeCSV(record.userId || ''),
          this.escapeCSV(record.conversationId || ''),
          record.provider,
          this.escapeCSV(record.model),
          record.promptTokens,
          record.completionTokens,
          record.totalTokens,
          record.durationMs,
          record.success,
          record.cost.totalCost.toFixed(6),
          this.escapeCSV(record.error || ''),
        ].join(',')
      );
    });

    return lines.join('\n');
  }

  private formatCostReport(report: Report & { type: 'cost' }): string {
    const lines: string[] = [];

    // Summary
    lines.push('Cost Report');
    lines.push('Total Cost,' + report.totalCost.toFixed(4));
    lines.push('');

    // By Model
    lines.push('Cost by Model');
    lines.push('Model,Cost,Percentage');
    report.breakdown.byModel.forEach((item) => {
      lines.push(
        [
          this.escapeCSV(item.model),
          item.cost.toFixed(4),
          item.percentage.toFixed(2),
        ].join(',')
      );
    });
    lines.push('');

    // By User
    lines.push('Cost by User');
    lines.push('User ID,Cost,Percentage');
    report.breakdown.byUser.forEach((item) => {
      lines.push(
        [
          this.escapeCSV(item.userId),
          item.cost.toFixed(4),
          item.percentage.toFixed(2),
        ].join(',')
      );
    });
    lines.push('');

    // By Day
    lines.push('Cost by Day');
    lines.push('Date,Cost');
    report.breakdown.byDay.forEach((item) => {
      lines.push([item.date, item.cost.toFixed(4)].join(','));
    });
    lines.push('');

    // Projections
    lines.push('Projections');
    lines.push('Period,Projected Cost');
    lines.push(['Daily', report.projections.daily.toFixed(4)].join(','));
    lines.push(['Weekly', report.projections.weekly.toFixed(4)].join(','));
    lines.push(['Monthly', report.projections.monthly.toFixed(4)].join(','));

    return lines.join('\n');
  }

  private formatModelComparisonReport(
    report: Report & { type: 'model-comparison' }
  ): string {
    const lines: string[] = [];

    lines.push(
      'Model,Provider,Total Cost,Avg Cost/Request,Total Tokens,Avg Tokens/Request,Request Count,Avg Duration (ms),Success Rate (%)'
    );

    report.models.forEach((model) => {
      lines.push(
        [
          this.escapeCSV(model.model),
          model.provider,
          model.totalCost.toFixed(4),
          model.avgCostPerRequest.toFixed(6),
          model.totalTokens,
          model.avgTokensPerRequest.toFixed(2),
          model.requestCount,
          model.avgDurationMs.toFixed(2),
          model.successRate.toFixed(2),
        ].join(',')
      );
    });

    return lines.join('\n');
  }

  private formatUserReport(report: Report & { type: 'user' }): string {
    const lines: string[] = [];

    lines.push(
      'User ID,Total Cost,Total Tokens,Request Count,Avg Cost/Request,Favorite Model,Last Active'
    );

    report.users.forEach((user) => {
      lines.push(
        [
          this.escapeCSV(user.userId),
          user.totalCost.toFixed(4),
          user.totalTokens,
          user.requestCount,
          user.avgCostPerRequest.toFixed(6),
          this.escapeCSV(user.favoriteModel),
          user.lastActiveDate.toISOString(),
        ].join(',')
      );
    });

    return lines.join('\n');
  }

  private formatTrendReport(report: Report & { type: 'trend' }): string {
    const lines: string[] = [];

    // Cost trend
    lines.push('Cost Trend');
    lines.push('Timestamp,Cost');
    report.trends.cost.forEach((point) => {
      lines.push(
        [point.timestamp.toISOString(), point.value.toFixed(4)].join(',')
      );
    });
    lines.push('');

    // Token trend
    lines.push('Token Trend');
    lines.push('Timestamp,Tokens');
    report.trends.tokens.forEach((point) => {
      lines.push([point.timestamp.toISOString(), point.value].join(','));
    });
    lines.push('');

    // Request trend
    lines.push('Request Trend');
    lines.push('Timestamp,Requests');
    report.trends.requests.forEach((point) => {
      lines.push([point.timestamp.toISOString(), point.value].join(','));
    });
    lines.push('');

    // Analysis
    lines.push('Trend Analysis');
    lines.push('Metric,Direction,Percentage Change,Projection,Confidence');
    lines.push(
      [
        'Cost',
        report.analysis.cost.direction,
        report.analysis.cost.percentageChange.toFixed(2),
        report.analysis.cost.projection.toFixed(4),
        report.analysis.cost.confidence.toFixed(2),
      ].join(',')
    );
    lines.push(
      [
        'Tokens',
        report.analysis.tokens.direction,
        report.analysis.tokens.percentageChange.toFixed(2),
        report.analysis.tokens.projection.toFixed(0),
        report.analysis.tokens.confidence.toFixed(2),
      ].join(',')
    );
    lines.push(
      [
        'Requests',
        report.analysis.requests.direction,
        report.analysis.requests.percentageChange.toFixed(2),
        report.analysis.requests.projection.toFixed(0),
        report.analysis.requests.confidence.toFixed(2),
      ].join(',')
    );

    return lines.join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
