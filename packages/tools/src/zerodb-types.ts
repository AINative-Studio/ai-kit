/**
 * Type definitions for ZeroDB Tool
 * Comprehensive types for agent-based database operations
 */

import { z } from 'zod'

/**
 * Database operation types supported by the tool
 */
export enum DatabaseOperationType {
  SELECT = 'select',
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
  CREATE_TABLE = 'create_table',
  DROP_TABLE = 'drop_table',
  AGGREGATE = 'aggregate',
  SCHEMA = 'schema',
  COUNT = 'count',
  SEARCH = 'search',
}

/**
 * Query intent extracted from natural language
 */
export enum QueryIntent {
  READ = 'read',
  WRITE = 'write',
  MODIFY = 'modify',
  DELETE = 'delete',
  SCHEMA_CHANGE = 'schema_change',
  ANALYTICS = 'analytics',
  SEARCH = 'search',
}

/**
 * Safety check severity levels
 */
export enum SafetyLevel {
  SAFE = 'safe',
  WARNING = 'warning',
  DANGEROUS = 'dangerous',
  BLOCKED = 'blocked',
}

/**
 * Result format options for LLM consumption
 */
export enum ResultFormat {
  JSON = 'json',
  TABLE = 'table',
  MARKDOWN = 'markdown',
  NATURAL_LANGUAGE = 'natural_language',
  STRUCTURED = 'structured',
}

/**
 * Configuration for ZeroDB Tool
 */
export interface ZeroDBToolConfig {
  // Authentication
  apiKey?: string
  jwtToken?: string

  // Connection settings
  baseURL?: string
  projectId: string
  timeout?: number

  // Safety settings
  allowDangerousOperations?: boolean
  requireConfirmation?: boolean
  maxRowsPerQuery?: number

  // Rate limiting
  rateLimit?: {
    maxRequestsPerMinute?: number
    maxRequestsPerHour?: number
  }

  // Schema caching
  cacheSchema?: boolean
  schemaCacheTTL?: number

  // Logging
  enableLogging?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * Zod schema for configuration validation
 */
export const ZeroDBToolConfigSchema = z.object({
  apiKey: z.string().optional(),
  jwtToken: z.string().optional(),
  baseURL: z.string().url().optional(),
  projectId: z.string().min(1),
  timeout: z.number().min(1000).max(300000).optional(),
  allowDangerousOperations: z.boolean().optional().default(false),
  requireConfirmation: z.boolean().optional().default(true),
  maxRowsPerQuery: z.number().min(1).max(10000).optional().default(1000),
  rateLimit: z.object({
    maxRequestsPerMinute: z.number().min(1).max(1000).optional(),
    maxRequestsPerHour: z.number().min(1).max(10000).optional(),
  }).optional(),
  cacheSchema: z.boolean().optional().default(true),
  schemaCacheTTL: z.number().min(60).max(86400).optional().default(3600),
  enableLogging: z.boolean().optional().default(false),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
}).refine(
  (data) => data.apiKey || data.jwtToken,
  {
    message: 'Either apiKey or jwtToken must be provided',
  }
)

/**
 * Parsed database operation from natural language
 */
export interface DatabaseOperation {
  type: DatabaseOperationType
  intent: QueryIntent
  tableName?: string
  columns?: string[] | ColumnSchema[]
  conditions?: Record<string, any>
  data?: Record<string, any>[] | Record<string, any>
  limit?: number
  offset?: number
  orderBy?: { column: string; direction: 'asc' | 'desc' }[]
  groupBy?: string[]
  aggregations?: {
    function: 'count' | 'sum' | 'avg' | 'min' | 'max'
    column?: string
    alias?: string
  }[]
  confidence: number
  rawQuery?: string
}

/**
 * Safety check result
 */
export interface SafetyCheck {
  level: SafetyLevel
  passed: boolean
  warnings: string[]
  errors: string[]
  suggestions?: string[]
  requiresConfirmation: boolean
  blockedReason?: string
}

/**
 * Database schema information
 */
export interface TableSchema {
  tableName: string
  columns: ColumnSchema[]
  primaryKey?: string
  indexes?: IndexSchema[]
  rowCount?: number
  createdAt?: string
  updatedAt?: string
}

/**
 * Column schema details
 */
export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  foreignKeyReference?: {
    table: string
    column: string
  }
  description?: string
}

/**
 * Index schema details
 */
export interface IndexSchema {
  name: string
  columns: string[]
  unique: boolean
  type?: string
}

/**
 * Database schema (all tables)
 */
export interface DatabaseSchema {
  tables: TableSchema[]
  version?: string
  lastUpdated?: string
  totalTables: number
  totalRows?: number
}

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean
  data?: any
  formattedResult?: string
  metadata: {
    operation: DatabaseOperationType
    executionTimeMs: number
    rowsAffected?: number
    rowsReturned?: number
    format: ResultFormat
    safetyCheck?: SafetyCheck
  }
  error?: {
    message: string
    code?: string
    details?: any
    suggestion?: string
  }
  warnings?: string[]
}

/**
 * Natural language parsing result
 */
export interface ParsedNaturalLanguage {
  operation: DatabaseOperation
  confidence: number
  alternativeInterpretations?: DatabaseOperation[]
  ambiguities?: string[]
  missingInformation?: string[]
}

/**
 * Rate limit tracking
 */
export interface RateLimitState {
  requestsThisMinute: number
  requestsThisHour: number
  lastResetMinute: number
  lastResetHour: number
  isLimited: boolean
}

/**
 * Schema cache entry
 */
export interface SchemaCacheEntry {
  schema: DatabaseSchema
  timestamp: number
  expiresAt: number
}

/**
 * Validation result for operations
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  safetyCheck: SafetyCheck
}

/**
 * Query execution context
 */
export interface ExecutionContext {
  operation: DatabaseOperation
  startTime: number
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * Aggregation result
 */
export interface AggregationResult {
  metric: string
  value: number | string
  count?: number
  groupBy?: Record<string, any>
}

/**
 * Search result with relevance
 */
export interface SearchResult {
  item: any
  score: number
  matchedFields?: string[]
  highlights?: Record<string, string>
}

/**
 * Tool capabilities
 */
export interface ToolCapabilities {
  supportedOperations: DatabaseOperationType[]
  maxRowsPerQuery: number
  allowDangerousOperations: boolean
  hasSchemaAccess: boolean
  hasWriteAccess: boolean
  supportedFormats: ResultFormat[]
}

/**
 * Operation statistics
 */
export interface OperationStats {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageExecutionTimeMs: number
  operationsByType: Record<DatabaseOperationType, number>
  totalRowsAffected: number
  totalRowsReturned: number
}
