/**
 * Adapter to make UsageTracker work with ReportGenerator
 */

import type { UsageDataSource } from './ReportGenerator';
import type { UsageTracker } from '../tracking/UsageTracker';
import type {
  UsageRecord,
  AggregatedUsage,
  UsageFilter,
} from '../tracking/types';

/**
 * Adapter that wraps UsageTracker to provide the UsageDataSource interface
 */
export class UsageTrackerAdapter implements UsageDataSource {
  constructor(private tracker: UsageTracker) {}

  async getRecords(filter?: UsageFilter): Promise<UsageRecord[]> {
    return this.tracker.getRecords(filter);
  }

  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    return this.tracker.getAggregated(filter);
  }
}
