/**
 * In-memory storage for usage events
 */

import type { UsageRecord, UsageFilter, StorageBackend } from './types';

export class MemoryStorage implements StorageBackend {
  private events: UsageRecord[] = [];

  async save(event: UsageRecord): Promise<void> {
    this.events.push(event);
  }

  async getEvents(filters: UsageFilter = {}): Promise<UsageRecord[]> {
    let filtered = [...this.events];

    if (filters.userId) {
      filtered = filtered.filter((e) => e.userId === filters.userId);
    }

    if (filters.conversationId) {
      filtered = filtered.filter((e) => e.conversationId === filters.conversationId);
    }

    if (filters.model) {
      filtered = filtered.filter((e) => e.model === filters.model);
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(
        (e) => e.timestamp >= start && e.timestamp <= end
      );
    }

    if (filters.minCost !== undefined) {
      filtered = filtered.filter((e) => e.cost >= filters.minCost!);
    }

    if (filters.maxCost !== undefined) {
      filtered = filtered.filter((e) => e.cost <= filters.maxCost!);
    }

    return filtered;
  }

  async clear(): Promise<void> {
    this.events = [];
  }

  // Helper method for testing
  get eventCount(): number {
    return this.events.length;
  }
}
