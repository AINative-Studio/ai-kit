/**
 * Memory Storage Backend
 *
 * In-memory storage backend for RLHF logging (primarily for testing)
 */

import {
  IStorageBackend,
  InteractionLog,
  Feedback,
  FeedbackStats,
  ExportFormat,
  FeedbackType,
  BinaryFeedbackData,
  RatingFeedbackData,
  TextFeedbackData,
  BinaryFeedback,
  MultiDimensionalFeedbackData,
  ComparativeFeedbackData,
} from '../types';

export interface MemoryStorageConfig {
  maxEntries?: number;
}

/**
 * In-memory storage backend implementation
 */
export class MemoryStorage implements IStorageBackend {
  private config: MemoryStorageConfig;
  private interactions: Map<string, InteractionLog> = new Map();
  private feedback: Map<string, Feedback> = new Map();
  private interactionsByTime: InteractionLog[] = [];
  private feedbackByTime: Feedback[] = [];
  private initialized = false;

  constructor(config: MemoryStorageConfig = {}) {
    this.config = {
      maxEntries: 10000,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.interactions.clear();
    this.feedback.clear();
    this.interactionsByTime = [];
    this.feedbackByTime = [];
    this.initialized = true;
  }

  async storeInteraction(interaction: InteractionLog): Promise<void> {
    this.interactions.set(interaction.id, interaction);
    this.interactionsByTime.push(interaction);

    // Enforce max entries limit
    if (this.interactionsByTime.length > (this.config.maxEntries || 10000)) {
      const removed = this.interactionsByTime.shift();
      if (removed) {
        this.interactions.delete(removed.id);
      }
    }
  }

  async storeFeedback(feedback: Feedback): Promise<void> {
    this.feedback.set(feedback.id, feedback);
    this.feedbackByTime.push(feedback);

    // Enforce max entries limit
    if (this.feedbackByTime.length > (this.config.maxEntries || 10000)) {
      const removed = this.feedbackByTime.shift();
      if (removed) {
        this.feedback.delete(removed.id);
      }
    }
  }

  async storeInteractionsBatch(interactions: InteractionLog[]): Promise<void> {
    for (const interaction of interactions) {
      await this.storeInteraction(interaction);
    }
  }

  async storeFeedbackBatch(feedback: Feedback[]): Promise<void> {
    for (const f of feedback) {
      await this.storeFeedback(f);
    }
  }

  async getInteraction(id: string): Promise<InteractionLog | null> {
    return this.interactions.get(id) || null;
  }

  async getFeedback(id: string): Promise<Feedback | null> {
    return this.feedback.get(id) || null;
  }

  async getFeedbackForInteraction(interactionId: string): Promise<Feedback[]> {
    return this.feedbackByTime.filter(f => f.interactionId === interactionId);
  }

  async getInteractions(startTime: Date, endTime: Date, limit?: number): Promise<InteractionLog[]> {
    let filtered = this.interactionsByTime.filter(i => {
      const timestamp = new Date(i.timestamp);
      return timestamp >= startTime && timestamp <= endTime;
    });

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  async getFeedbackInRange(startTime: Date, endTime: Date, limit?: number): Promise<Feedback[]> {
    let filtered = this.feedbackByTime.filter(f => {
      const timestamp = new Date(f.timestamp);
      return timestamp >= startTime && timestamp <= endTime;
    });

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  async calculateStats(startTime?: Date, endTime?: Date): Promise<FeedbackStats> {
    const start = startTime || new Date(0);
    const end = endTime || new Date();

    const feedback = await this.getFeedbackInRange(start, end);
    const interactions = await this.getInteractions(start, end);

    return this.computeStats(feedback, interactions, start, end);
  }

  async exportData(
    format: ExportFormat,
    startTime?: Date,
    endTime?: Date
  ): Promise<string | Buffer> {
    const start = startTime || new Date(0);
    const end = endTime || new Date();

    const interactions = await this.getInteractions(start, end);
    const feedback = await this.getFeedbackInRange(start, end);

    const data = {
      interactions,
      feedback,
      exportedAt: new Date().toISOString(),
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(data, null, 2);

      case ExportFormat.JSONL:
        const lines = [
          ...interactions.map(i => JSON.stringify({ ...i, type: 'interaction' })),
          ...feedback.map(f => JSON.stringify({ ...f, type: 'feedback' })),
        ];
        return lines.join('\n');

      case ExportFormat.CSV:
        return this.convertToCSV(feedback);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async close(): Promise<void> {
    // Clean up memory
    this.interactions.clear();
    this.feedback.clear();
    this.interactionsByTime = [];
    this.feedbackByTime = [];
    this.initialized = false;
  }

  /**
   * Get all interactions (for testing)
   */
  getAllInteractions(): InteractionLog[] {
    return [...this.interactionsByTime];
  }

  /**
   * Get all feedback (for testing)
   */
  getAllFeedback(): Feedback[] {
    return [...this.feedbackByTime];
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.interactions.clear();
    this.feedback.clear();
    this.interactionsByTime = [];
    this.feedbackByTime = [];
  }

  /**
   * Compute statistics from feedback and interactions
   */
  private computeStats(
    feedback: Feedback[],
    interactions: InteractionLog[],
    start: Date,
    end: Date
  ): FeedbackStats {
    const stats: FeedbackStats = {
      totalInteractions: interactions.length,
      totalFeedback: feedback.length,
      feedbackRate: interactions.length > 0 ? feedback.length / interactions.length : 0,
      timeRange: { start, end },
      byType: {},
    };

    // Binary feedback stats
    const binaryFeedback = feedback.filter(f => f.type === FeedbackType.BINARY);
    if (binaryFeedback.length > 0) {
      const thumbsUp = binaryFeedback.filter(
        f => (f.data as BinaryFeedbackData).value === BinaryFeedback.THUMBS_UP
      ).length;
      const thumbsDown = binaryFeedback.length - thumbsUp;

      stats.binary = {
        thumbsUp,
        thumbsDown,
        ratio: binaryFeedback.length > 0 ? thumbsUp / binaryFeedback.length : 0,
      };
    }

    // Rating feedback stats
    const ratingFeedback = feedback.filter(f => f.type === FeedbackType.RATING);
    if (ratingFeedback.length > 0) {
      const ratings = ratingFeedback.map(f => (f.data as RatingFeedbackData).rating);
      const sum = ratings.reduce((a, b) => a + b, 0);
      const sorted = [...ratings].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] ?? 0;

      const distribution: { [rating: number]: number } = {};
      ratings.forEach(r => {
        distribution[r] = (distribution[r] || 0) + 1;
      });

      stats.rating = {
        average: sum / ratings.length,
        median,
        distribution,
        count: ratingFeedback.length,
      };
    }

    // Text feedback stats
    const textFeedback = feedback.filter(f => f.type === FeedbackType.TEXT);
    if (textFeedback.length > 0) {
      const comments = textFeedback.map(f => (f.data as TextFeedbackData).comment);
      const totalLength = comments.reduce((sum, c) => sum + c.length, 0);

      const sentimentDistribution = {
        positive: 0,
        negative: 0,
        neutral: 0,
      };

      textFeedback.forEach(f => {
        const sentiment = (f.data as TextFeedbackData).sentiment || 'neutral';
        sentimentDistribution[sentiment]++;
      });

      stats.text = {
        count: textFeedback.length,
        averageLength: totalLength / textFeedback.length,
        sentimentDistribution,
      };
    }

    // Multi-dimensional feedback stats
    const multiDimFeedback = feedback.filter(f => f.type === FeedbackType.MULTI_DIMENSIONAL);
    if (multiDimFeedback.length > 0) {
      const dimensionSums: { [key: string]: number } = {};
      const dimensionCounts: { [key: string]: number } = {};

      multiDimFeedback.forEach(f => {
        const data = f.data as MultiDimensionalFeedbackData;
        Object.entries(data.dimensions).forEach(([dim, value]) => {
          dimensionSums[dim] = (dimensionSums[dim] || 0) + value;
          dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
        });
      });

      const dimensionAverages: { [key: string]: number } = {};
      Object.keys(dimensionSums).forEach(dim => {
        const sum = dimensionSums[dim];
        const count = dimensionCounts[dim];
        if (sum !== undefined && count !== undefined && count > 0) {
          dimensionAverages[dim] = sum / count;
        }
      });

      stats.multiDimensional = {
        count: multiDimFeedback.length,
        dimensionAverages,
      };
    }

    // Comparative feedback stats
    const comparativeFeedback = feedback.filter(f => f.type === FeedbackType.COMPARATIVE);
    if (comparativeFeedback.length > 0) {
      const confidenceLevels = comparativeFeedback
        .map(f => (f.data as ComparativeFeedbackData).confidenceLevel)
        .filter((c): c is number => c !== undefined);

      stats.comparative = {
        count: comparativeFeedback.length,
        averageConfidence:
          confidenceLevels.length > 0
            ? confidenceLevels.reduce((a, b) => a + b, 0) / confidenceLevels.length
            : undefined,
      };
    }

    // Count by type
    feedback.forEach(f => {
      stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Convert feedback to CSV format
   */
  private convertToCSV(feedback: Feedback[]): string {
    const headers = [
      'id',
      'interaction_id',
      'type',
      'timestamp',
      'user_id',
      'session_id',
      'data',
    ];

    const rows = feedback.map(f => [
      f.id,
      f.interactionId,
      f.type,
      f.timestamp.toISOString(),
      f.userId || '',
      f.sessionId || '',
      JSON.stringify(f.data),
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ];

    return csvLines.join('\n');
  }
}
