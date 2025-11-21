/**
 * ZeroDB Storage Backend
 *
 * Storage backend implementation using ZeroDB for RLHF logging
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
} from '../types';

export interface ZeroDBConfig {
  projectId: string;
  apiKey?: string;
  tableName?: string;
  vectorTableName?: string;
}

/**
 * ZeroDB storage backend implementation
 */
export class ZeroDBStorage implements IStorageBackend {
  private config: ZeroDBConfig;
  private initialized = false;

  constructor(config: ZeroDBConfig) {
    this.config = {
      tableName: 'rlhf_feedback',
      vectorTableName: 'rlhf_vectors',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize ZeroDB connection and create tables if needed
    // In production, this would use the ZeroDB MCP server or SDK
    // The config will be used to connect: await zerodb.connect(this.config)
    void this.config; // Suppress unused warning - will be used in production
    this.initialized = true;
  }

  async storeInteraction(interaction: InteractionLog): Promise<void> {
    // Store interaction in ZeroDB table
    // Use ZeroDB table insert command
    const record = {
      id: interaction.id,
      type: 'interaction',
      data: JSON.stringify(interaction),
      timestamp: interaction.timestamp.toISOString(),
      user_id: interaction.userId,
      session_id: interaction.sessionId,
    };

    // In production: await zerodb.table.insert(this.config.tableName, record)
    void record; // Suppress unused warning - used in production
    void record; // Suppress unused warning - used in production
  }

  async storeFeedback(feedback: Feedback): Promise<void> {
    // Store feedback in ZeroDB table
    const record = {
      id: feedback.id,
      type: 'feedback',
      interaction_id: feedback.interactionId,
      feedback_type: feedback.type,
      data: JSON.stringify(feedback),
      timestamp: feedback.timestamp.toISOString(),
      user_id: feedback.userId,
      session_id: feedback.sessionId,
    };

    // In production: await zerodb.table.insert(this.config.tableName, record)
    void record; // Suppress unused warning - used in production
  }

  async storeInteractionsBatch(interactions: InteractionLog[]): Promise<void> {
    const records = interactions.map(interaction => ({
      id: interaction.id,
      type: 'interaction',
      data: JSON.stringify(interaction),
      timestamp: interaction.timestamp.toISOString(),
      user_id: interaction.userId,
      session_id: interaction.sessionId,
    }));

    // In production: await zerodb.table.insertBatch(this.config.tableName, records)
    void records; // Suppress unused warning - used in production
  }

  async storeFeedbackBatch(feedback: Feedback[]): Promise<void> {
    const records = feedback.map(f => ({
      id: f.id,
      type: 'feedback',
      interaction_id: f.interactionId,
      feedback_type: f.type,
      data: JSON.stringify(f),
      timestamp: f.timestamp.toISOString(),
      user_id: f.userId,
      session_id: f.sessionId,
    }));

    // In production: await zerodb.table.insertBatch(this.config.tableName, records)
    void records; // Suppress unused warning - used in production
  }

  async getInteraction(_id: string): Promise<InteractionLog | null> {
    // Query ZeroDB for interaction by ID
    // In production:
    // const results = await zerodb.table.query(this.config.tableName, {
    //   filter: { id, type: 'interaction' }
    // })
    // return results.length > 0 ? JSON.parse(results[0].data) : null

    return null;
  }

  async getFeedback(_id: string): Promise<Feedback | null> {
    // Query ZeroDB for feedback by ID
    // In production:
    // const results = await zerodb.table.query(this.config.tableName, {
    //   filter: { id, type: 'feedback' }
    // })
    // return results.length > 0 ? JSON.parse(results[0].data) : null

    return null;
  }

  async getFeedbackForInteraction(_interactionId: string): Promise<Feedback[]> {
    // Query ZeroDB for all feedback for an interaction
    // In production:
    // const results = await zerodb.table.query(this.config.tableName, {
    //   filter: { interaction_id: interactionId, type: 'feedback' }
    // })
    // return results.map(r => JSON.parse(r.data))

    return [];
  }

  async getInteractions(_startTime: Date, _endTime: Date, _limit?: number): Promise<InteractionLog[]> {
    // Query ZeroDB for interactions in time range
    // In production:
    // const results = await zerodb.table.query(this.config.tableName, {
    //   filter: {
    //     type: 'interaction',
    //     timestamp: { gte: startTime.toISOString(), lte: endTime.toISOString() }
    //   },
    //   limit
    // })
    // return results.map(r => JSON.parse(r.data))

    return [];
  }

  async getFeedbackInRange(_startTime: Date, _endTime: Date, _limit?: number): Promise<Feedback[]> {
    // Query ZeroDB for feedback in time range
    // In production:
    // const results = await zerodb.table.query(this.config.tableName, {
    //   filter: {
    //     type: 'feedback',
    //     timestamp: { gte: startTime.toISOString(), lte: endTime.toISOString() }
    //   },
    //   limit
    // })
    // return results.map(r => JSON.parse(r.data))

    return [];
  }

  async calculateStats(startTime?: Date, endTime?: Date): Promise<FeedbackStats> {
    const start = startTime || new Date(0);
    const end = endTime || new Date();

    // Get all feedback and interactions in range
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
    // Close ZeroDB connection
    this.initialized = false;
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
      const sorted = ratings.sort((a, b) => a - b);
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
