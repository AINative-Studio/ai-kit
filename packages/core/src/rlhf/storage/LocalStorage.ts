/**
 * Local File Storage Backend
 *
 * Storage backend implementation using local filesystem for RLHF logging
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
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

export interface LocalStorageConfig {
  dataDir: string;
  compress?: boolean;
  maxFileSize?: number; // in MB
  rotateFiles?: boolean;
}

/**
 * Local file storage backend implementation
 */
export class LocalStorage implements IStorageBackend {
  private config: LocalStorageConfig;
  private interactionsFile: string;
  private feedbackFile: string;
  private initialized = false;
  private currentFileSize = 0;
  private fileRotationIndex = 0;

  constructor(config: LocalStorageConfig) {
    this.config = {
      compress: false,
      maxFileSize: 100, // 100 MB
      rotateFiles: true,
      ...config,
    };

    this.interactionsFile = path.join(this.config.dataDir, 'interactions.jsonl');
    this.feedbackFile = path.join(this.config.dataDir, 'feedback.jsonl');
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Create data directory if it doesn't exist
    await fs.mkdir(this.config.dataDir, { recursive: true });

    // Check current file sizes
    try {
      const stats = await fs.stat(this.interactionsFile);
      this.currentFileSize = stats.size / (1024 * 1024); // Convert to MB
    } catch (err) {
      // File doesn't exist yet
      this.currentFileSize = 0;
    }

    this.initialized = true;
  }

  async storeInteraction(interaction: InteractionLog): Promise<void> {
    const line = JSON.stringify(interaction) + '\n';
    await this.appendToFile(this.interactionsFile, line);
  }

  async storeFeedback(feedback: Feedback): Promise<void> {
    const line = JSON.stringify(feedback) + '\n';
    await this.appendToFile(this.feedbackFile, line);
  }

  async storeInteractionsBatch(interactions: InteractionLog[]): Promise<void> {
    const lines = interactions.map(i => JSON.stringify(i) + '\n').join('');
    await this.appendToFile(this.interactionsFile, lines);
  }

  async storeFeedbackBatch(feedback: Feedback[]): Promise<void> {
    const lines = feedback.map(f => JSON.stringify(f) + '\n').join('');
    await this.appendToFile(this.feedbackFile, lines);
  }

  async getInteraction(id: string): Promise<InteractionLog | null> {
    const interactions = await this.readFile<InteractionLog>(this.interactionsFile);
    return interactions.find(i => i.id === id) || null;
  }

  async getFeedback(id: string): Promise<Feedback | null> {
    const feedback = await this.readFile<Feedback>(this.feedbackFile);
    return feedback.find(f => f.id === id) || null;
  }

  async getFeedbackForInteraction(interactionId: string): Promise<Feedback[]> {
    const feedback = await this.readFile<Feedback>(this.feedbackFile);
    return feedback.filter(f => f.interactionId === interactionId);
  }

  async getInteractions(startTime: Date, endTime: Date, limit?: number): Promise<InteractionLog[]> {
    const interactions = await this.readFile<InteractionLog>(this.interactionsFile);

    let filtered = interactions.filter(i => {
      const timestamp = new Date(i.timestamp);
      return timestamp >= startTime && timestamp <= endTime;
    });

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  async getFeedbackInRange(startTime: Date, endTime: Date, limit?: number): Promise<Feedback[]> {
    const feedback = await this.readFile<Feedback>(this.feedbackFile);

    let filtered = feedback.filter(f => {
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
          ...interactions.map(i => JSON.stringify({ type: 'interaction', ...i })),
          ...feedback.map(f => JSON.stringify({ type: 'feedback', ...f })),
        ];
        return lines.join('\n');

      case ExportFormat.CSV:
        return this.convertToCSV(feedback);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async close(): Promise<void> {
    // Compress files if enabled
    if (this.config.compress) {
      await this.compressFile(this.interactionsFile);
      await this.compressFile(this.feedbackFile);
    }

    this.initialized = false;
  }

  /**
   * Append data to file
   */
  private async appendToFile(filePath: string, data: string): Promise<void> {
    // Check if file rotation is needed
    if (this.config.rotateFiles && this.currentFileSize >= (this.config.maxFileSize || 100)) {
      await this.rotateFile(filePath);
    }

    await fs.appendFile(filePath, data, 'utf8');
    this.currentFileSize += data.length / (1024 * 1024);
  }

  /**
   * Read file and parse JSONL
   */
  private async readFile<T>(filePath: string): Promise<T[]> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      return lines.map(line => {
        const parsed = JSON.parse(line);
        // Convert timestamp strings back to Date objects
        if (parsed.timestamp) {
          parsed.timestamp = new Date(parsed.timestamp);
        }
        if (parsed.data && parsed.data.timestamp) {
          parsed.data.timestamp = new Date(parsed.data.timestamp);
        }
        return parsed;
      });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Rotate file when max size reached
   */
  private async rotateFile(filePath: string): Promise<void> {
    this.fileRotationIndex++;
    const ext = path.extname(filePath);
    const base = filePath.slice(0, -ext.length);
    const newPath = `${base}.${this.fileRotationIndex}${ext}`;

    try {
      await fs.rename(filePath, newPath);
      this.currentFileSize = 0;

      // Compress rotated file if enabled
      if (this.config.compress) {
        await this.compressFile(newPath);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  /**
   * Compress file using gzip
   */
  private async compressFile(filePath: string): Promise<void> {
    try {
      const source = createReadStream(filePath);
      const destination = createWriteStream(`${filePath}.gz`);
      const gzip = createGzip();

      await pipeline(source, gzip, destination);

      // Delete original file after compression
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Error compressing file:', err);
      }
    }
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
      const median = sorted[Math.floor(sorted.length / 2)];

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
        const data = f.data as any;
        Object.entries(data.dimensions).forEach(([dim, value]) => {
          dimensionSums[dim] = (dimensionSums[dim] || 0) + (value as number);
          dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;
        });
      });

      const dimensionAverages: { [key: string]: number } = {};
      Object.keys(dimensionSums).forEach(dim => {
        dimensionAverages[dim] = dimensionSums[dim] / dimensionCounts[dim];
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
        .map(f => (f.data as any).confidenceLevel)
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
