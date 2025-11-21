/**
 * RLHFLogger - Reinforcement Learning from Human Feedback Logger
 *
 * Comprehensive logging system for capturing user feedback and AI interactions
 * to improve model performance through RLHF.
 */

import { randomUUID } from 'crypto';
import {
  RLHFConfig,
  InteractionLog,
  Feedback,
  FeedbackType,
  FeedbackData,
  BinaryFeedback,
  BinaryFeedbackData,
  RatingFeedbackData,
  TextFeedbackData,
  MultiDimensionalFeedbackData,
  ComparativeFeedbackData,
  FeedbackStats,
  IStorageBackend,
  StorageBackend,
  ExportFormat,
  ExportOptions,
  FeedbackFilter,
  BatchOperation,
  FeedbackSession,
  AnalyticsResult,
} from './types';
import { ZeroDBStorage } from './storage/ZeroDBStorage';
import { LocalStorage } from './storage/LocalStorage';
import { MemoryStorage } from './storage/MemoryStorage';

/**
 * Main RLHF Logger class
 */
export class RLHFLogger {
  private config: RLHFConfig;
  private storage: IStorageBackend;
  private batchQueue: BatchOperation[] = [];
  private batchTimer?: NodeJS.Timeout;
  private currentSession?: FeedbackSession;
  private sessionTimer?: NodeJS.Timeout;
  private initialized = false;

  /**
   * Create a new RLHFLogger instance
   */
  constructor(config: RLHFConfig) {
    this.config = this.normalizeConfig(config);
    this.storage = this.createStorageBackend();
  }

  /**
   * Normalize configuration with defaults
   */
  private normalizeConfig(config: RLHFConfig): RLHFConfig {
    return {
      backend: config.backend || StorageBackend.MEMORY,
      backendConfig: config.backendConfig || {},
      enableBatching: config.enableBatching ?? true,
      batchSize: config.batchSize || 50,
      batchFlushInterval: config.batchFlushInterval || 5000,
      enableCompression: config.enableCompression ?? false,
      autoGenerateIds: config.autoGenerateIds ?? true,
      enableSessionTracking: config.enableSessionTracking ?? true,
      sessionTimeout: config.sessionTimeout || 1800000, // 30 minutes
      allowAnonymous: config.allowAnonymous ?? true,
      defaultMetadata: config.defaultMetadata || {},
      debug: config.debug ?? false,
    };
  }

  /**
   * Create storage backend based on configuration
   */
  private createStorageBackend(): IStorageBackend {
    switch (this.config.backend) {
      case StorageBackend.ZERODB:
        if (!this.config.backendConfig?.zerodb) {
          throw new Error('ZeroDB backend config is required when using ZERODB storage');
        }
        return new ZeroDBStorage(this.config.backendConfig.zerodb);

      case StorageBackend.LOCAL:
        if (!this.config.backendConfig?.local) {
          throw new Error('Local backend config is required when using LOCAL storage');
        }
        return new LocalStorage(this.config.backendConfig.local);

      case StorageBackend.MEMORY:
        return new MemoryStorage(this.config.backendConfig?.memory || {});

      case StorageBackend.CUSTOM:
        if (!this.config.backendConfig?.custom?.implementation) {
          throw new Error('Custom storage backend implementation required');
        }
        return this.config.backendConfig.custom.implementation;

      default:
        throw new Error(`Unsupported storage backend: ${this.config.backend}`);
    }
  }

  /**
   * Initialize the logger
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.storage.initialize();

    if (this.config.enableBatching) {
      this.startBatchTimer();
    }

    if (this.config.enableSessionTracking) {
      this.startSession();
    }

    this.initialized = true;
    this.log('RLHFLogger initialized');
  }

  /**
   * Log an AI interaction
   */
  async logInteraction(
    prompt: string,
    response: string,
    metadata?: {
      model?: string;
      modelParams?: Record<string, any>;
      latency?: number;
      tokenUsage?: { prompt: number; completion: number; total: number };
      userId?: string;
      sessionId?: string;
      context?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
      [key: string]: any;
    }
  ): Promise<string> {
    const interactionId = this.config.autoGenerateIds ? randomUUID() : metadata?.['id'];

    if (!interactionId) {
      throw new Error('Interaction ID required when autoGenerateIds is disabled');
    }

    const interaction: InteractionLog = {
      id: interactionId,
      prompt,
      response,
      model: metadata?.model,
      modelParams: metadata?.modelParams,
      latency: metadata?.latency,
      tokenUsage: metadata?.tokenUsage,
      userId: metadata?.userId,
      sessionId: metadata?.sessionId || this.currentSession?.id,
      context: metadata?.context,
      metadata: {
        ...this.config.defaultMetadata,
        ...metadata,
      },
      timestamp: new Date(),
      feedbackIds: [],
    };

    if (this.config.enableBatching) {
      this.addToBatch('interaction', interaction);
    } else {
      await this.storage.storeInteraction(interaction);
    }

    // Add to current session
    if (this.currentSession) {
      this.currentSession.interactionIds.push(interactionId);
      this.resetSessionTimer();
    }

    this.log('Logged interaction:', interactionId);
    return interactionId;
  }

  /**
   * Log binary feedback (thumbs up/down)
   */
  async logBinaryFeedback(
    interactionId: string,
    value: BinaryFeedback,
    metadata?: {
      userId?: string;
      sessionId?: string;
      source?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const data: BinaryFeedbackData = {
      value,
      timestamp: new Date(),
    };

    return this.logFeedback(interactionId, FeedbackType.BINARY, data, metadata);
  }

  /**
   * Log rating feedback (1-5 stars)
   */
  async logRating(
    interactionId: string,
    rating: number,
    comment?: string,
    metadata?: {
      maxRating?: number;
      userId?: string;
      sessionId?: string;
      source?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const maxRating = metadata?.maxRating || 5;

    if (rating < 1 || rating > maxRating) {
      throw new Error(`Rating must be between 1 and ${maxRating}`);
    }

    const data: RatingFeedbackData = {
      rating,
      maxRating,
      comment,
      timestamp: new Date(),
    };

    return this.logFeedback(interactionId, FeedbackType.RATING, data, metadata);
  }

  /**
   * Log text feedback (comments)
   */
  async logTextFeedback(
    interactionId: string,
    comment: string,
    sentiment?: 'positive' | 'negative' | 'neutral',
    metadata?: {
      userId?: string;
      sessionId?: string;
      source?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const data: TextFeedbackData = {
      comment,
      sentiment,
      timestamp: new Date(),
    };

    return this.logFeedback(interactionId, FeedbackType.TEXT, data, metadata);
  }

  /**
   * Log multi-dimensional feedback
   */
  async logMultiDimensionalFeedback(
    interactionId: string,
    dimensions: { [dimensionName: string]: number },
    options?: {
      weights?: { [dimensionName: string]: number };
      overallComment?: string;
      userId?: string;
      sessionId?: string;
      source?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const data: MultiDimensionalFeedbackData = {
      dimensions,
      weights: options?.weights,
      overallComment: options?.overallComment,
      timestamp: new Date(),
    };

    return this.logFeedback(interactionId, FeedbackType.MULTI_DIMENSIONAL, data, options);
  }

  /**
   * Log comparative feedback
   */
  async logComparativeFeedback(
    preferredResponseId: string,
    comparedResponseIds: string[],
    options?: {
      reason?: string;
      confidenceLevel?: number;
      userId?: string;
      sessionId?: string;
      source?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    if (options?.confidenceLevel !== undefined &&
        (options.confidenceLevel < 0 || options.confidenceLevel > 1)) {
      throw new Error('Confidence level must be between 0 and 1');
    }

    const data: ComparativeFeedbackData = {
      preferredResponseId,
      comparedResponseIds,
      reason: options?.reason,
      confidenceLevel: options?.confidenceLevel,
      timestamp: new Date(),
    };

    return this.logFeedback(preferredResponseId, FeedbackType.COMPARATIVE, data, options);
  }

  /**
   * Generic feedback logging method
   */
  async logFeedback(
    interactionId: string,
    type: FeedbackType,
    data: FeedbackData,
    metadata?: {
      userId?: string;
      sessionId?: string;
      source?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    const feedbackId = this.config.autoGenerateIds ? randomUUID() : metadata?.['id'];

    if (!feedbackId) {
      throw new Error('Feedback ID required when autoGenerateIds is disabled');
    }

    const feedback: Feedback = {
      id: feedbackId,
      interactionId,
      type,
      data,
      userId: metadata?.userId,
      sessionId: metadata?.sessionId || this.currentSession?.id,
      source: metadata?.source,
      metadata: {
        ...this.config.defaultMetadata,
        ...metadata,
      },
      timestamp: new Date(),
    };

    if (this.config.enableBatching) {
      this.addToBatch('feedback', feedback);
    } else {
      await this.storage.storeFeedback(feedback);
    }

    // Add to current session
    if (this.currentSession) {
      this.currentSession.feedbackIds.push(feedbackId);
      this.resetSessionTimer();
    }

    this.log('Logged feedback:', feedbackId);
    return feedbackId;
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(startTime?: Date, endTime?: Date): Promise<FeedbackStats> {
    return this.storage.calculateStats(startTime, endTime);
  }

  /**
   * Get interaction by ID
   */
  async getInteraction(interactionId: string): Promise<InteractionLog | null> {
    return this.storage.getInteraction(interactionId);
  }

  /**
   * Get feedback by ID
   */
  async getFeedback(feedbackId: string): Promise<Feedback | null> {
    return this.storage.getFeedback(feedbackId);
  }

  /**
   * Get all feedback for an interaction
   */
  async getFeedbackForInteraction(interactionId: string): Promise<Feedback[]> {
    return this.storage.getFeedbackForInteraction(interactionId);
  }

  /**
   * Get interactions in time range
   */
  async getInteractions(startTime: Date, endTime: Date, limit?: number): Promise<InteractionLog[]> {
    return this.storage.getInteractions(startTime, endTime, limit);
  }

  /**
   * Get feedback in time range
   */
  async getFeedbackInRange(startTime: Date, endTime: Date, limit?: number): Promise<Feedback[]> {
    return this.storage.getFeedbackInRange(startTime, endTime, limit);
  }

  /**
   * Export feedback data
   */
  async exportFeedback(
    format: ExportFormat,
    options?: Omit<ExportOptions, 'format'>
  ): Promise<string | Buffer> {
    const exportOptions: ExportOptions = {
      format,
      includeInteractions: true,
      includeFeedback: true,
      includeMetadata: true,
      prettyPrint: format === ExportFormat.JSON,
      ...options,
    };

    return this.storage.exportData(
      exportOptions.format,
      exportOptions.startTime,
      exportOptions.endTime
    );
  }

  /**
   * Query and analyze feedback
   */
  async queryFeedback(filter: FeedbackFilter): Promise<Feedback[]> {
    let feedback = await this.storage.getFeedbackInRange(
      filter.startTime || new Date(0),
      filter.endTime || new Date(),
      filter.limit
    );

    // Apply filters
    if (filter.types && filter.types.length > 0) {
      feedback = feedback.filter(f => filter.types!.includes(f.type));
    }

    if (filter.userId) {
      feedback = feedback.filter(f => f.userId === filter.userId);
    }

    if (filter.sessionId) {
      feedback = feedback.filter(f => f.sessionId === filter.sessionId);
    }

    if (filter.interactionIds && filter.interactionIds.length > 0) {
      feedback = feedback.filter(f => filter.interactionIds!.includes(f.interactionId));
    }

    if (filter.source) {
      feedback = feedback.filter(f => f.source === filter.source);
    }

    if (filter.minRating !== undefined || filter.maxRating !== undefined) {
      feedback = feedback.filter(f => {
        if (f.type === FeedbackType.RATING) {
          const data = f.data as RatingFeedbackData;
          if (filter.minRating !== undefined && data.rating < filter.minRating) {
            return false;
          }
          if (filter.maxRating !== undefined && data.rating > filter.maxRating) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply offset
    if (filter.offset) {
      feedback = feedback.slice(filter.offset);
    }

    return feedback;
  }

  /**
   * Get analytics results
   */
  async getAnalytics(filter?: FeedbackFilter): Promise<AnalyticsResult> {
    const stats = await this.storage.calculateStats(
      filter?.startTime,
      filter?.endTime
    );

    const result: AnalyticsResult = {
      query: {
        startTime: filter?.startTime,
        endTime: filter?.endTime,
        filters: filter,
      },
      stats,
      generatedAt: new Date(),
    };

    return result;
  }

  /**
   * Flush batch queue manually
   */
  async flush(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const interactions = this.batchQueue
      .filter(op => op.type === 'interaction')
      .map(op => op.data as InteractionLog);

    const feedback = this.batchQueue
      .filter(op => op.type === 'feedback')
      .map(op => op.data as Feedback);

    this.log(`Flushing batch: ${interactions.length} interactions, ${feedback.length} feedback`);

    if (interactions.length > 0) {
      await this.storage.storeInteractionsBatch(interactions);
    }

    if (feedback.length > 0) {
      await this.storage.storeFeedbackBatch(feedback);
    }

    this.batchQueue = [];
  }

  /**
   * Start a new feedback session
   */
  startSession(userId?: string, metadata?: Record<string, any>): string {
    if (this.currentSession) {
      this.endSession();
    }

    const sessionId = randomUUID();
    this.currentSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      interactionIds: [],
      feedbackIds: [],
      metadata,
    };

    this.resetSessionTimer();
    this.log('Started session:', sessionId);
    return sessionId;
  }

  /**
   * End current feedback session
   */
  endSession(): FeedbackSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = new Date();
    const session = { ...this.currentSession };

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = undefined;
    }

    this.currentSession = undefined;
    this.log('Ended session:', session.id);
    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): FeedbackSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Close the logger and cleanup
   */
  async close(): Promise<void> {
    this.log('Closing RLHFLogger');

    // Flush any pending batches
    if (this.config.enableBatching) {
      await this.flush();
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = undefined;
      }
    }

    // End current session
    if (this.currentSession) {
      this.endSession();
    }

    // Close storage
    await this.storage.close();
    this.initialized = false;
  }

  /**
   * Add operation to batch queue
   */
  private addToBatch(type: 'interaction' | 'feedback', data: InteractionLog | Feedback): void {
    this.batchQueue.push({
      type,
      data,
      timestamp: new Date(),
    });

    // Flush if batch size reached
    if (this.batchQueue.length >= (this.config.batchSize || 50)) {
      this.flush().catch(err => {
        console.error('Error flushing batch:', err);
      });
    }
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flush().catch(err => {
        console.error('Error flushing batch:', err);
      });
    }, this.config.batchFlushInterval || 5000);
  }

  /**
   * Reset session timeout timer
   */
  private resetSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.log('Session timeout, ending session');
      this.endSession();
    }, this.config.sessionTimeout || 1800000);
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[RLHFLogger]', ...args);
    }
  }
}

/**
 * Create a new RLHFLogger instance
 */
export function createRLHFLogger(config: RLHFConfig): RLHFLogger {
  return new RLHFLogger(config);
}
