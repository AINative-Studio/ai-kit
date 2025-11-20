/**
 * RLHF (Reinforcement Learning from Human Feedback) Types
 *
 * Type definitions for RLHF logging system
 */

/**
 * Feedback type enumeration
 */
export enum FeedbackType {
  /** Binary thumbs up/down feedback */
  BINARY = 'binary',
  /** Rating scale (1-5 stars) */
  RATING = 'rating',
  /** Text comment feedback */
  TEXT = 'text',
  /** Multi-dimensional ratings */
  MULTI_DIMENSIONAL = 'multi_dimensional',
  /** Comparative feedback between multiple responses */
  COMPARATIVE = 'comparative',
}

/**
 * Binary feedback values
 */
export enum BinaryFeedback {
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
}

/**
 * Storage backend types
 */
export enum StorageBackend {
  /** ZeroDB cloud storage */
  ZERODB = 'zerodb',
  /** Local file storage */
  LOCAL = 'local',
  /** Custom storage implementation */
  CUSTOM = 'custom',
  /** In-memory storage (testing only) */
  MEMORY = 'memory',
}

/**
 * Export format types
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  JSONL = 'jsonl',
  PARQUET = 'parquet',
}

/**
 * Binary feedback data
 */
export interface BinaryFeedbackData {
  value: BinaryFeedback;
  timestamp: Date;
}

/**
 * Rating feedback data (1-5 scale)
 */
export interface RatingFeedbackData {
  rating: number; // 1-5
  maxRating?: number; // Default 5
  comment?: string;
  timestamp: Date;
}

/**
 * Text feedback data
 */
export interface TextFeedbackData {
  comment: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

/**
 * Multi-dimensional rating data
 */
export interface MultiDimensionalFeedbackData {
  dimensions: {
    [dimensionName: string]: number;
  };
  weights?: {
    [dimensionName: string]: number;
  };
  overallComment?: string;
  timestamp: Date;
}

/**
 * Comparative feedback data
 */
export interface ComparativeFeedbackData {
  preferredResponseId: string;
  comparedResponseIds: string[];
  reason?: string;
  confidenceLevel?: number; // 0-1
  timestamp: Date;
}

/**
 * Generic feedback data union
 */
export type FeedbackData =
  | BinaryFeedbackData
  | RatingFeedbackData
  | TextFeedbackData
  | MultiDimensionalFeedbackData
  | ComparativeFeedbackData;

/**
 * User feedback record
 */
export interface Feedback {
  /** Unique feedback ID */
  id: string;
  /** Associated interaction ID */
  interactionId: string;
  /** Feedback type */
  type: FeedbackType;
  /** Feedback data */
  data: FeedbackData;
  /** User ID (optional) */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Timestamp */
  timestamp: Date;
  /** Feedback source (web, mobile, api, etc.) */
  source?: string;
}

/**
 * AI interaction log
 */
export interface InteractionLog {
  /** Unique interaction ID */
  id: string;
  /** User prompt/input */
  prompt: string;
  /** AI response/output */
  response: string;
  /** Model used */
  model?: string;
  /** Model parameters */
  modelParams?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    [key: string]: any;
  };
  /** Latency in milliseconds */
  latency?: number;
  /** Token usage */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** User ID (optional) */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Context/conversation history */
  context?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Timestamp */
  timestamp: Date;
  /** Associated feedback IDs */
  feedbackIds?: string[];
}

/**
 * Feedback session
 */
export interface FeedbackSession {
  /** Session ID */
  id: string;
  /** User ID (optional) */
  userId?: string;
  /** Session start time */
  startTime: Date;
  /** Session end time */
  endTime?: Date;
  /** Interaction IDs in this session */
  interactionIds: string[];
  /** Feedback IDs in this session */
  feedbackIds: string[];
  /** Session metadata */
  metadata?: Record<string, any>;
}

/**
 * Aggregated feedback statistics
 */
export interface FeedbackStats {
  /** Total interactions logged */
  totalInteractions: number;
  /** Total feedback received */
  totalFeedback: number;
  /** Feedback rate (feedback/interactions) */
  feedbackRate: number;
  /** Binary feedback stats */
  binary?: {
    thumbsUp: number;
    thumbsDown: number;
    ratio: number; // thumbsUp/(thumbsUp+thumbsDown)
  };
  /** Rating stats */
  rating?: {
    average: number;
    median: number;
    distribution: { [rating: number]: number };
    count: number;
  };
  /** Text feedback stats */
  text?: {
    count: number;
    averageLength: number;
    sentimentDistribution?: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  /** Multi-dimensional stats */
  multiDimensional?: {
    count: number;
    dimensionAverages: { [dimension: string]: number };
  };
  /** Comparative stats */
  comparative?: {
    count: number;
    averageConfidence?: number;
  };
  /** Time range */
  timeRange: {
    start: Date;
    end: Date;
  };
  /** Feedback by type */
  byType: {
    [key in FeedbackType]?: number;
  };
}

/**
 * Storage backend interface
 */
export interface IStorageBackend {
  /** Initialize storage backend */
  initialize(): Promise<void>;

  /** Store interaction log */
  storeInteraction(interaction: InteractionLog): Promise<void>;

  /** Store feedback */
  storeFeedback(feedback: Feedback): Promise<void>;

  /** Store multiple interactions (batch) */
  storeInteractionsBatch(interactions: InteractionLog[]): Promise<void>;

  /** Store multiple feedback items (batch) */
  storeFeedbackBatch(feedback: Feedback[]): Promise<void>;

  /** Get interaction by ID */
  getInteraction(id: string): Promise<InteractionLog | null>;

  /** Get feedback by ID */
  getFeedback(id: string): Promise<Feedback | null>;

  /** Get feedback for interaction */
  getFeedbackForInteraction(interactionId: string): Promise<Feedback[]>;

  /** Get interactions in time range */
  getInteractions(startTime: Date, endTime: Date, limit?: number): Promise<InteractionLog[]>;

  /** Get feedback in time range */
  getFeedbackInRange(startTime: Date, endTime: Date, limit?: number): Promise<Feedback[]>;

  /** Calculate feedback statistics */
  calculateStats(startTime?: Date, endTime?: Date): Promise<FeedbackStats>;

  /** Export feedback data */
  exportData(format: ExportFormat, startTime?: Date, endTime?: Date): Promise<string | Buffer>;

  /** Close storage backend */
  close(): Promise<void>;
}

/**
 * RLHF Logger configuration
 */
export interface RLHFConfig {
  /** Storage backend type */
  backend: StorageBackend;

  /** Backend-specific configuration */
  backendConfig?: {
    /** ZeroDB configuration */
    zerodb?: {
      projectId: string;
      apiKey?: string;
      tableName?: string;
      vectorTableName?: string;
    };

    /** Local file storage configuration */
    local?: {
      dataDir: string;
      compress?: boolean;
      maxFileSize?: number; // in MB
      rotateFiles?: boolean;
    };

    /** Custom backend configuration */
    custom?: {
      implementation: IStorageBackend;
      config?: Record<string, any>;
    };

    /** Memory storage configuration */
    memory?: {
      maxEntries?: number;
    };
  };

  /** Enable batch logging */
  enableBatching?: boolean;

  /** Batch size */
  batchSize?: number;

  /** Batch flush interval (ms) */
  batchFlushInterval?: number;

  /** Enable compression */
  enableCompression?: boolean;

  /** Auto-generate interaction IDs */
  autoGenerateIds?: boolean;

  /** Enable session tracking */
  enableSessionTracking?: boolean;

  /** Default session timeout (ms) */
  sessionTimeout?: number;

  /** Enable anonymous feedback */
  allowAnonymous?: boolean;

  /** Custom metadata to include in all logs */
  defaultMetadata?: Record<string, any>;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Batch operation
 */
export interface BatchOperation {
  type: 'interaction' | 'feedback';
  data: InteractionLog | Feedback;
  timestamp: Date;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;

  /** Start time filter */
  startTime?: Date;

  /** End time filter */
  endTime?: Date;

  /** Include interactions */
  includeInteractions?: boolean;

  /** Include feedback */
  includeFeedback?: boolean;

  /** Filter by feedback type */
  feedbackTypes?: FeedbackType[];

  /** Filter by user ID */
  userId?: string;

  /** Filter by session ID */
  sessionId?: string;

  /** Maximum records to export */
  limit?: number;

  /** Include metadata */
  includeMetadata?: boolean;

  /** Pretty print (JSON only) */
  prettyPrint?: boolean;
}

/**
 * Feedback filter options
 */
export interface FeedbackFilter {
  /** Start time */
  startTime?: Date;

  /** End time */
  endTime?: Date;

  /** Feedback types */
  types?: FeedbackType[];

  /** User ID */
  userId?: string;

  /** Session ID */
  sessionId?: string;

  /** Interaction IDs */
  interactionIds?: string[];

  /** Minimum rating (for rating feedback) */
  minRating?: number;

  /** Maximum rating (for rating feedback) */
  maxRating?: number;

  /** Feedback source */
  source?: string;

  /** Limit */
  limit?: number;

  /** Offset */
  offset?: number;
}

/**
 * Analytics query result
 */
export interface AnalyticsResult {
  /** Query metadata */
  query: {
    startTime?: Date;
    endTime?: Date;
    filters?: FeedbackFilter;
  };

  /** Statistics */
  stats: FeedbackStats;

  /** Trends over time */
  trends?: {
    interval: 'hour' | 'day' | 'week' | 'month';
    data: Array<{
      timestamp: Date;
      stats: Partial<FeedbackStats>;
    }>;
  };

  /** Top issues/complaints (from text feedback) */
  topIssues?: Array<{
    issue: string;
    count: number;
    sentiment: 'negative' | 'neutral';
  }>;

  /** Generated timestamp */
  generatedAt: Date;
}
