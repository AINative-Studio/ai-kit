/**
 * File-based storage backend for usage tracking
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  StorageBackend,
  UsageRecord,
  UsageFilter,
  AggregatedUsage,
  ExportFormat,
} from './types';
import { aggregateRecords, filterRecords, exportToFormat } from './utils';

/**
 * File storage backend
 * Appends records to a file in JSON Lines format
 */
export class FileStorage implements StorageBackend {
  private filePath: string;
  private exportFormat: ExportFormat;

  constructor(filePath: string, exportFormat: ExportFormat = 'jsonl') {
    this.filePath = filePath;
    this.exportFormat = exportFormat;
  }

  async store(record: UsageRecord): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    // Append record to file in JSON Lines format
    const line = JSON.stringify(record) + '\n';
    await fs.appendFile(this.filePath, line, 'utf-8');
  }

  async getAll(filter?: UsageFilter): Promise<UsageRecord[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const lines = content.trim().split('\n').filter((line) => line.length > 0);

      const records: UsageRecord[] = lines.map((line) => {
        const record = JSON.parse(line);
        // Convert timestamp string back to Date
        record.timestamp = new Date(record.timestamp);
        return record;
      });

      if (!filter) {
        return records;
      }

      return filterRecords(records, filter);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async getAggregated(filter?: UsageFilter): Promise<AggregatedUsage> {
    const records = await this.getAll(filter);
    return aggregateRecords(records);
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async export(format: ExportFormat, filter?: UsageFilter): Promise<string> {
    const records = await this.getAll(filter);
    return exportToFormat(records, format);
  }
}
