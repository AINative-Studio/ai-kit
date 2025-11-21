/**
 * HTML formatter for reports
 */

import type { Report, ReportConfig, ReportFormatter } from '../types';

export class HTMLFormatter implements ReportFormatter {
  format(report: Report, config: ReportConfig): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.getTitle(report)}</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${this.formatReportContent(report)}
    </div>
</body>
</html>
`;
    return html.trim();
  }

  private getTitle(report: Report): string {
    const typeNames = {
      summary: 'Summary Report',
      detailed: 'Detailed Report',
      cost: 'Cost Report',
      'model-comparison': 'Model Comparison Report',
      user: 'User Report',
      trend: 'Trend Report',
    };
    return typeNames[report.type] || 'Usage Report';
  }

  private getStyles(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 32px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 24px;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .period {
            background: #ecf0f1;
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #7f8c8d;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
        }
        th {
            background: #3498db;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #ecf0f1;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .metric {
            display: inline-block;
            background: #e8f4f8;
            padding: 5px 10px;
            border-radius: 4px;
            margin: 5px;
            font-size: 14px;
        }
        .metric-label {
            color: #7f8c8d;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-value {
            color: #2c3e50;
            font-size: 20px;
            font-weight: 600;
        }
        .trend-up {
            color: #e74c3c;
        }
        .trend-down {
            color: #27ae60;
        }
        .trend-stable {
            color: #95a5a6;
        }
        .severity-high {
            color: #e74c3c;
            font-weight: 600;
        }
        .severity-medium {
            color: #f39c12;
        }
        .severity-low {
            color: #3498db;
        }
        .number {
            text-align: right;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
    `;
  }

  private formatReportContent(report: Report): string {
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
    return `
        <h1>Usage Summary Report</h1>
        <div class="period">
            ${report.period.start.toISOString()} to ${report.period.end.toISOString()}
        </div>

        <h2>Overview</h2>
        <div class="grid">
            <div class="card">
                <div class="metric-label">Total Requests</div>
                <div class="metric-value">${report.overview.totalRequests.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="metric-label">Total Cost</div>
                <div class="metric-value">$${report.overview.totalCost.toFixed(4)}</div>
            </div>
            <div class="card">
                <div class="metric-label">Total Tokens</div>
                <div class="metric-value">${report.overview.totalTokens.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="metric-label">Avg Duration</div>
                <div class="metric-value">${report.overview.avgDurationMs.toFixed(2)}ms</div>
            </div>
        </div>

        <h2>Top Consumers</h2>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>ID</th>
                    <th class="number">Total Cost</th>
                    <th class="number">Total Tokens</th>
                    <th class="number">Requests</th>
                    <th class="number">% of Total</th>
                </tr>
            </thead>
            <tbody>
                ${report.topConsumers.map(consumer => `
                    <tr>
                        <td>${consumer.type}</td>
                        <td>${this.escapeHtml(consumer.id)}</td>
                        <td class="number">$${consumer.totalCost.toFixed(4)}</td>
                        <td class="number">${consumer.totalTokens.toLocaleString()}</td>
                        <td class="number">${consumer.requestCount.toLocaleString()}</td>
                        <td class="number">${consumer.percentageOfTotal.toFixed(2)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>Trends</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Direction</th>
                    <th class="number">Change</th>
                    <th class="number">Projection</th>
                    <th class="number">Confidence</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Cost</td>
                    <td class="${this.getTrendClass(report.trends.cost.direction)}">${report.trends.cost.direction}</td>
                    <td class="number">${report.trends.cost.percentageChange.toFixed(2)}%</td>
                    <td class="number">$${report.trends.cost.projection.toFixed(4)}</td>
                    <td class="number">${(report.trends.cost.confidence * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                    <td>Tokens</td>
                    <td class="${this.getTrendClass(report.trends.tokens.direction)}">${report.trends.tokens.direction}</td>
                    <td class="number">${report.trends.tokens.percentageChange.toFixed(2)}%</td>
                    <td class="number">${report.trends.tokens.projection.toFixed(0)}</td>
                    <td class="number">${(report.trends.tokens.confidence * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                    <td>Requests</td>
                    <td class="${this.getTrendClass(report.trends.requests.direction)}">${report.trends.requests.direction}</td>
                    <td class="number">${report.trends.requests.percentageChange.toFixed(2)}%</td>
                    <td class="number">${report.trends.requests.projection.toFixed(0)}</td>
                    <td class="number">${(report.trends.requests.confidence * 100).toFixed(0)}%</td>
                </tr>
            </tbody>
        </table>

        ${report.anomalies.length > 0 ? `
            <h2>Anomalies</h2>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Type</th>
                        <th class="number">Value</th>
                        <th class="number">Expected</th>
                        <th class="number">Deviation</th>
                        <th>Severity</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.anomalies.map(anomaly => `
                        <tr>
                            <td>${anomaly.timestamp.toISOString()}</td>
                            <td>${anomaly.type}</td>
                            <td class="number">${anomaly.value.toFixed(4)}</td>
                            <td class="number">${anomaly.expectedValue.toFixed(4)}</td>
                            <td class="number">${anomaly.deviation.toFixed(4)}</td>
                            <td class="severity-${anomaly.severity}">${anomaly.severity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : ''}
    `;
  }

  private formatDetailedReport(report: Report & { type: 'detailed' }): string {
    return `
        <h1>Detailed Usage Report</h1>
        <div class="period">
            ${report.period.start.toISOString()} to ${report.period.end.toISOString()}
        </div>

        <h2>Summary</h2>
        <div class="grid">
            <div class="card">
                <div class="metric-label">Total Records</div>
                <div class="metric-value">${report.records.length.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="metric-label">Total Cost</div>
                <div class="metric-value">$${report.aggregated.totalCost.toFixed(4)}</div>
            </div>
            <div class="card">
                <div class="metric-label">Total Tokens</div>
                <div class="metric-value">${report.aggregated.totalTokens.toLocaleString()}</div>
            </div>
        </div>

        <h2>Records</h2>
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Model</th>
                    <th>User</th>
                    <th class="number">Tokens</th>
                    <th class="number">Cost</th>
                    <th class="number">Duration</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${report.records.slice(0, 100).map(record => `
                    <tr>
                        <td>${record.timestamp.toISOString()}</td>
                        <td>${this.escapeHtml(record.model)}</td>
                        <td>${this.escapeHtml(record.userId || 'N/A')}</td>
                        <td class="number">${record.totalTokens.toLocaleString()}</td>
                        <td class="number">$${record.cost.totalCost.toFixed(6)}</td>
                        <td class="number">${record.durationMs.toFixed(0)}ms</td>
                        <td>${record.success ? '✓ Success' : '✗ Failed'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${report.records.length > 100 ? `<p><em>Showing 100 of ${report.records.length.toLocaleString()} records</em></p>` : ''}
    `;
  }

  private formatCostReport(report: Report & { type: 'cost' }): string {
    return `
        <h1>Cost Report</h1>
        <div class="period">
            ${report.period.start.toISOString()} to ${report.period.end.toISOString()}
        </div>

        <div class="grid">
            <div class="card">
                <div class="metric-label">Total Cost</div>
                <div class="metric-value">$${report.totalCost.toFixed(4)}</div>
            </div>
            <div class="card">
                <div class="metric-label">Daily Projection</div>
                <div class="metric-value">$${report.projections.daily.toFixed(4)}</div>
            </div>
            <div class="card">
                <div class="metric-label">Weekly Projection</div>
                <div class="metric-value">$${report.projections.weekly.toFixed(4)}</div>
            </div>
            <div class="card">
                <div class="metric-label">Monthly Projection</div>
                <div class="metric-value">$${report.projections.monthly.toFixed(4)}</div>
            </div>
        </div>

        <h2>Cost by Model</h2>
        <table>
            <thead>
                <tr>
                    <th>Model</th>
                    <th class="number">Cost</th>
                    <th class="number">Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${report.breakdown.byModel.map(item => `
                    <tr>
                        <td>${this.escapeHtml(item.model)}</td>
                        <td class="number">$${item.cost.toFixed(4)}</td>
                        <td class="number">${item.percentage.toFixed(2)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${report.breakdown.byUser.length > 0 ? `
            <h2>Cost by User</h2>
            <table>
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th class="number">Cost</th>
                        <th class="number">Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.breakdown.byUser.map(item => `
                        <tr>
                            <td>${this.escapeHtml(item.userId)}</td>
                            <td class="number">$${item.cost.toFixed(4)}</td>
                            <td class="number">${item.percentage.toFixed(2)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : ''}
    `;
  }

  private formatModelComparisonReport(
    report: Report & { type: 'model-comparison' }
  ): string {
    return `
        <h1>Model Comparison Report</h1>
        <div class="period">
            ${report.period.start.toISOString()} to ${report.period.end.toISOString()}
        </div>

        <table>
            <thead>
                <tr>
                    <th>Model</th>
                    <th>Provider</th>
                    <th class="number">Total Cost</th>
                    <th class="number">Avg Cost/Req</th>
                    <th class="number">Requests</th>
                    <th class="number">Avg Duration</th>
                    <th class="number">Success Rate</th>
                </tr>
            </thead>
            <tbody>
                ${report.models.map(model => `
                    <tr>
                        <td>${this.escapeHtml(model.model)}</td>
                        <td>${model.provider}</td>
                        <td class="number">$${model.totalCost.toFixed(4)}</td>
                        <td class="number">$${model.avgCostPerRequest.toFixed(6)}</td>
                        <td class="number">${model.requestCount.toLocaleString()}</td>
                        <td class="number">${model.avgDurationMs.toFixed(0)}ms</td>
                        <td class="number">${model.successRate.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
  }

  private formatUserReport(report: Report & { type: 'user' }): string {
    return `
        <h1>User Report</h1>
        <div class="period">
            ${report.period.start.toISOString()} to ${report.period.end.toISOString()}
        </div>

        <table>
            <thead>
                <tr>
                    <th>User ID</th>
                    <th class="number">Total Cost</th>
                    <th class="number">Total Tokens</th>
                    <th class="number">Requests</th>
                    <th>Favorite Model</th>
                    <th>Last Active</th>
                </tr>
            </thead>
            <tbody>
                ${report.users.map(user => `
                    <tr>
                        <td>${this.escapeHtml(user.userId)}</td>
                        <td class="number">$${user.totalCost.toFixed(4)}</td>
                        <td class="number">${user.totalTokens.toLocaleString()}</td>
                        <td class="number">${user.requestCount.toLocaleString()}</td>
                        <td>${this.escapeHtml(user.favoriteModel)}</td>
                        <td>${user.lastActiveDate.toISOString().split('T')[0]}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
  }

  private formatTrendReport(report: Report & { type: 'trend' }): string {
    return `
        <h1>Trend Report</h1>
        <div class="period">
            ${report.period.start.toISOString()} to ${report.period.end.toISOString()}
        </div>
        <div class="period">
            Aggregation Period: ${report.aggregationPeriod}
        </div>

        <h2>Trend Analysis</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Direction</th>
                    <th class="number">Change</th>
                    <th class="number">Projection</th>
                    <th class="number">Confidence</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Cost</td>
                    <td class="${this.getTrendClass(report.analysis.cost.direction)}">${report.analysis.cost.direction}</td>
                    <td class="number">${report.analysis.cost.percentageChange.toFixed(2)}%</td>
                    <td class="number">$${report.analysis.cost.projection.toFixed(4)}</td>
                    <td class="number">${(report.analysis.cost.confidence * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                    <td>Tokens</td>
                    <td class="${this.getTrendClass(report.analysis.tokens.direction)}">${report.analysis.tokens.direction}</td>
                    <td class="number">${report.analysis.tokens.percentageChange.toFixed(2)}%</td>
                    <td class="number">${report.analysis.tokens.projection.toFixed(0)}</td>
                    <td class="number">${(report.analysis.tokens.confidence * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                    <td>Requests</td>
                    <td class="${this.getTrendClass(report.analysis.requests.direction)}">${report.analysis.requests.direction}</td>
                    <td class="number">${report.analysis.requests.percentageChange.toFixed(2)}%</td>
                    <td class="number">${report.analysis.requests.projection.toFixed(0)}</td>
                    <td class="number">${(report.analysis.requests.confidence * 100).toFixed(0)}%</td>
                </tr>
            </tbody>
        </table>

        <h2>Cost Trend Data</h2>
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th class="number">Cost</th>
                </tr>
            </thead>
            <tbody>
                ${report.trends.cost.slice(0, 20).map(point => `
                    <tr>
                        <td>${point.timestamp.toISOString()}</td>
                        <td class="number">$${point.value.toFixed(4)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${report.trends.cost.length > 20 ? `<p><em>Showing 20 of ${report.trends.cost.length} data points</em></p>` : ''}
    `;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private getTrendClass(direction: string): string {
    switch (direction) {
      case 'increasing':
        return 'trend-up';
      case 'decreasing':
        return 'trend-down';
      case 'stable':
        return 'trend-stable';
      default:
        return '';
    }
  }
}
