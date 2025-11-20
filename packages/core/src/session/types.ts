/**
 * Type definitions for session management
 */

/**
 * Session data stored for each session
 */
export interface SessionData {
  /** User ID associated with the session */
  userId: string
  /** Custom session data */
  data: Record<string, any>
  /** Timestamp when session was created (milliseconds) */
  createdAt: number
  /** Timestamp when session was last accessed (milliseconds) */
  lastAccessedAt: number
  /** Timestamp when session expires (milliseconds) */
  expiresAt: number
  /** IP address of the session (optional) */
  ipAddress?: string
  /** User agent string (optional) */
  userAgent?: string
  /** Session metadata */
  metadata?: Record<string, any>
}

/**
 * Session object returned to consumers
 */
export interface Session {
  /** Unique session identifier */
  sessionId: string
  /** User ID associated with the session */
  userId: string
  /** Custom session data */
  data: Record<string, any>
  /** Timestamp when session was created (milliseconds) */
  createdAt: number
  /** Timestamp when session was last accessed (milliseconds) */
  lastAccessedAt: number
  /** Timestamp when session expires (milliseconds) */
  expiresAt: number
  /** Whether the session is expired */
  isExpired: boolean
  /** IP address of the session (optional) */
  ipAddress?: string
  /** User agent string (optional) */
  userAgent?: string
  /** Session metadata */
  metadata?: Record<string, any>
}

/**
 * Expiration strategy for sessions
 */
export enum ExpirationStrategy {
  /** Session expires after a fixed time from creation */
  FIXED = 'fixed',
  /** Session expiration extends on each access (sliding window) */
  SLIDING = 'sliding',
  /** Session uses both fixed and sliding expiration */
  HYBRID = 'hybrid'
}

/**
 * Storage backend type for sessions
 */
export enum StorageBackend {
  /** In-memory storage (not persistent) */
  MEMORY = 'memory',
  /** Redis storage (persistent, distributed) */
  REDIS = 'redis',
  /** ZeroDB storage (persistent, encrypted) */
  ZERODB = 'zerodb'
}

/**
 * Base configuration for session manager
 */
export interface BaseSessionConfig {
  /** Default TTL in seconds (default: 3600 = 1 hour) */
  ttl?: number
  /** Expiration strategy (default: sliding) */
  expirationStrategy?: ExpirationStrategy
  /** Namespace/prefix for session keys */
  namespace?: string
  /** Enable session data encryption */
  encryptData?: boolean
  /** Encryption key (required if encryptData is true) */
  encryptionKey?: string
  /** Maximum concurrent sessions per user (0 = unlimited) */
  maxSessionsPerUser?: number
  /** Enable session locking for concurrent access */
  enableLocking?: boolean
  /** Lock timeout in milliseconds (default: 5000) */
  lockTimeout?: number
  /** Cleanup interval in milliseconds (default: 300000 = 5 minutes) */
  cleanupInterval?: number
  /** Enable automatic cleanup of expired sessions */
  autoCleanup?: boolean
}

/**
 * Configuration for in-memory session store
 */
export interface InMemorySessionConfig extends BaseSessionConfig {
  type: 'memory'
  /** Maximum number of sessions to store (LRU eviction) */
  maxSessions?: number
}

/**
 * Configuration for Redis session store
 */
export interface RedisSessionConfig extends BaseSessionConfig {
  type: 'redis'
  /** Redis connection URL */
  url?: string
  /** Redis host */
  host?: string
  /** Redis port */
  port?: number
  /** Redis password */
  password?: string
  /** Redis database number */
  db?: number
  /** Key prefix for Redis keys */
  keyPrefix?: string
}

/**
 * Configuration for ZeroDB session store
 */
export interface ZeroDBSessionConfig extends BaseSessionConfig {
  type: 'zerodb'
  /** ZeroDB project ID */
  projectId: string
  /** ZeroDB API key */
  apiKey: string
  /** Table name for sessions */
  tableName?: string
}

/**
 * Union type for all session configurations
 */
export type SessionConfig = InMemorySessionConfig | RedisSessionConfig | ZeroDBSessionConfig

/**
 * Options for creating a new session
 */
export interface CreateSessionOptions {
  /** Custom TTL in seconds (overrides default) */
  ttl?: number
  /** IP address of the client */
  ipAddress?: string
  /** User agent string */
  userAgent?: string
  /** Custom metadata */
  metadata?: Record<string, any>
}

/**
 * Options for updating a session
 */
export interface UpdateSessionOptions {
  /** Whether to update the lastAccessedAt timestamp */
  updateLastAccessed?: boolean
  /** Merge data instead of replacing */
  merge?: boolean
}

/**
 * Options for refreshing a session
 */
export interface RefreshSessionOptions {
  /** Custom TTL in seconds (overrides default) */
  ttl?: number
}

/**
 * Options for listing sessions
 */
export interface ListSessionsOptions {
  /** Include expired sessions */
  includeExpired?: boolean
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

/**
 * Session statistics
 */
export interface SessionStats {
  /** Total number of sessions */
  totalSessions: number
  /** Number of active (non-expired) sessions */
  activeSessions: number
  /** Number of expired sessions */
  expiredSessions: number
  /** Sessions grouped by user ID */
  sessionsByUser?: Record<string, number>
  /** Average session duration in milliseconds */
  averageDuration?: number
}

/**
 * Session store interface that all storage backends must implement
 */
export interface SessionStore {
  /**
   * Get a session by ID
   */
  get(sessionId: string): Promise<SessionData | null>

  /**
   * Set/update a session
   */
  set(sessionId: string, data: SessionData): Promise<void>

  /**
   * Delete a session
   */
  delete(sessionId: string): Promise<boolean>

  /**
   * Check if a session exists
   */
  exists(sessionId: string): Promise<boolean>

  /**
   * Get all sessions for a user
   */
  getByUserId(userId: string): Promise<Map<string, SessionData>>

  /**
   * Delete all sessions for a user
   */
  deleteByUserId(userId: string): Promise<number>

  /**
   * Get all session IDs
   */
  getAllSessionIds(): Promise<string[]>

  /**
   * Remove expired sessions
   */
  cleanup(): Promise<number>

  /**
   * Get session statistics
   */
  getStats(): Promise<SessionStats>

  /**
   * Acquire a lock for a session
   */
  acquireLock?(sessionId: string, timeout: number): Promise<boolean>

  /**
   * Release a lock for a session
   */
  releaseLock?(sessionId: string): Promise<void>

  /**
   * Close the store connection
   */
  close?(): Promise<void>
}

/**
 * Session event types
 */
export enum SessionEvent {
  CREATED = 'session:created',
  UPDATED = 'session:updated',
  REFRESHED = 'session:refreshed',
  DELETED = 'session:deleted',
  EXPIRED = 'session:expired',
  LOCKED = 'session:locked',
  UNLOCKED = 'session:unlocked'
}

/**
 * Session event payload
 */
export interface SessionEventPayload {
  /** Session ID */
  sessionId: string
  /** User ID */
  userId: string
  /** Event type */
  event: SessionEvent
  /** Timestamp */
  timestamp: number
  /** Additional data */
  data?: Record<string, any>
}
