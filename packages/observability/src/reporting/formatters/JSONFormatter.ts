/**
 * JSON formatter for reports
 */

import type { Report, ReportConfig, ReportFormatter } from '../types';

export class JSONFormatter implements ReportFormatter {
  format(report: Report, config: ReportConfig): string {
    return JSON.stringify(report, null, 2);
  }
}
