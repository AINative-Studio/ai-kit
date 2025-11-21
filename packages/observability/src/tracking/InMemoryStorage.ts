/**
 * In-memory storage backend for usage tracking
 */

import {
  StorageBackend,
  UsageRecord,
  UsageFilter,
  AggregatedUsage,
  ExportFormat,
} from './types';
import { aggregateRecords, filterRecords, exportToFormat } from './utils';

/**
 * In-memory storage backend
 * Stores all records in memory
 */
export class InMemoryStorage implements StorageBackend {
  private records: UsageRecord[] = [];
  private maxRecords: number;

  constructor(maxRecords: number = 10000) {
    this.maxRecords = maxRecords;
  }

  async store(record: UsageRecord): Promise<void> {
    this.records.push(record);

    // Keep only the most recent records if we exceed maxRecords
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  async getAll(filter?: UsageFilter): Promise<UsageRecord[]> {
    if (!filter) {
      return [...this.records];
    }

    return filterRecords(this.records, filter);
  }

  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    const records = await this.getAll(filter);
    return aggregateRecords(records);
  }

  async clear(): Promise<void> {
    this.records = [];
  }

  async export(format: ExportFormat, filter?: UsageFilter): Promise<string> {
    const records = await this.getAll(filter);
    return exportToFormat(records, format);
  }

  /**
   * Get current record count
   */
  getRecordCount(): number {
    return this.records.length;
  }
}
