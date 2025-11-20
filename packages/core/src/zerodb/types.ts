/**
 * Type definitions for ZeroDB CRUD operations
 *
 * Provides comprehensive type safety for database operations including
 * CRUD operations, query building, transactions, and connection management.
 */

/**
 * ZeroDB connection configuration
 */
export interface ZeroDBConfig {
  /** ZeroDB project ID */
  projectId: string

  /** API key for authentication */
  apiKey: string

  /** Base URL for ZeroDB API (optional, defaults to production URL) */
  baseUrl?: string

  /** Connection pool configuration */
  pool?: PoolConfig

  /** Retry configuration for failed requests */
  retry?: RetryConfig

  /** Request timeout in milliseconds */
  timeout?: number

  /** Enable debug logging */
  debug?: boolean
}

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  /** Minimum number of connections to maintain */
  min?: number

  /** Maximum number of connections */
  max?: number

  /** Idle timeout in milliseconds */
  idleTimeout?: number

  /** Connection acquisition timeout in milliseconds */
  acquireTimeout?: number

  /** Enable connection validation */
  validate?: boolean
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number

  /** Initial retry delay in milliseconds */
  initialDelay?: number

  /** Maximum retry delay in milliseconds */
  maxDelay?: number

  /** Backoff multiplier */
  backoffMultiplier?: number

  /** Retry on these error codes */
  retryableErrors?: string[]
}

/**
 * Query filter operators
 */
export type FilterOperator =
  | 'eq'    // Equal
  | 'ne'    // Not equal
  | 'gt'    // Greater than
  | 'gte'   // Greater than or equal
  | 'lt'    // Less than
  | 'lte'   // Less than or equal
  | 'in'    // In array
  | 'nin'   // Not in array
  | 'like'  // Pattern matching
  | 'ilike' // Case-insensitive pattern matching
  | 'is'    // IS NULL / IS NOT NULL
  | 'contains' // Array contains
  | 'overlap'  // Array overlap

/**
 * Query filter condition
 */
export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: any
}

/**
 * Complex filter with logical operators
 */
export interface Filter {
  and?: Filter[]
  or?: Filter[]
  not?: Filter
  condition?: FilterCondition
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Sort specification
 */
export interface SortSpec {
  field: string
  direction: SortDirection
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Number of records to return */
  limit?: number

  /** Number of records to skip */
  offset?: number

  /** Cursor for cursor-based pagination */
  cursor?: string
}

/**
 * Query options
 */
export interface QueryOptions extends PaginationOptions {
  /** Fields to select (if not specified, returns all) */
  select?: string[]

  /** Filter conditions */
  filter?: Filter

  /** Sort specifications */
  sort?: SortSpec[]

  /** Include total count in response */
  count?: boolean

  /** Join other tables */
  joins?: JoinSpec[]
}

/**
 * Join specification
 */
export interface JoinSpec {
  /** Table to join */
  table: string

  /** Join type */
  type?: 'inner' | 'left' | 'right' | 'full'

  /** Join condition */
  on: {
    left: string
    right: string
  }

  /** Alias for joined table */
  alias?: string
}

/**
 * Aggregation function
 */
export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max'

/**
 * Aggregation specification
 */
export interface AggregateSpec {
  function: AggregateFunction
  field?: string
  alias?: string
}

/**
 * Group by options
 */
export interface GroupByOptions {
  /** Fields to group by */
  fields: string[]

  /** Aggregations to compute */
  aggregates: AggregateSpec[]

  /** Filter on groups (HAVING clause) */
  having?: Filter
}

/**
 * Insert options
 */
export interface InsertOptions {
  /** Return inserted records */
  returning?: boolean

  /** On conflict action */
  onConflict?: {
    /** Conflict target fields */
    target: string[]

    /** Action: 'ignore' or 'update' */
    action: 'ignore' | 'update'

    /** Fields to update on conflict (if action is 'update') */
    updateFields?: string[]
  }
}

/**
 * Update options
 */
export interface UpdateOptions {
  /** Return updated records */
  returning?: boolean

  /** Filter for records to update */
  filter?: Filter
}

/**
 * Delete options
 */
export interface DeleteOptions {
  /** Return deleted records */
  returning?: boolean

  /** Filter for records to delete */
  filter?: Filter
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Transaction isolation level */
  isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable'

  /** Read-only transaction */
  readOnly?: boolean

  /** Transaction timeout in milliseconds */
  timeout?: number
}

/**
 * Batch operation type
 */
export type BatchOperationType = 'insert' | 'update' | 'delete'

/**
 * Batch operation
 */
export interface BatchOperation {
  type: BatchOperationType
  table: string
  data?: Record<string, any> | Record<string, any>[]
  filter?: Filter
  options?: InsertOptions | UpdateOptions | DeleteOptions
}

/**
 * Query result
 */
export interface QueryResult<T = any> {
  /** Result rows */
  rows: T[]

  /** Total count (if requested) */
  count?: number

  /** Next cursor for pagination */
  nextCursor?: string

  /** Execution metadata */
  metadata?: {
    executionTime: number
    rowsScanned: number
  }
}

/**
 * CRUD result
 */
export interface CRUDResult<T = any> {
  /** Success status */
  success: boolean

  /** Number of rows affected */
  rowsAffected: number

  /** Returned rows (if requested) */
  rows?: T[]

  /** Error message (if failed) */
  error?: string
}

/**
 * Transaction result
 */
export interface TransactionResult {
  /** Success status */
  success: boolean

  /** Number of operations executed */
  operationsExecuted: number

  /** Total rows affected */
  totalRowsAffected: number

  /** Error message (if failed) */
  error?: string
}

/**
 * Connection health status
 */
export interface HealthStatus {
  /** Connection status */
  connected: boolean

  /** Response time in milliseconds */
  responseTime?: number

  /** Error message (if unhealthy) */
  error?: string

  /** Pool statistics */
  pool?: PoolStats
}

/**
 * Connection pool statistics
 */
export interface PoolStats {
  /** Total connections */
  total: number

  /** Active connections */
  active: number

  /** Idle connections */
  idle: number

  /** Waiting requests */
  waiting: number
}

/**
 * Query builder interface
 */
export interface IQueryBuilder<T = any> {
  /** Select specific fields */
  select(...fields: string[]): IQueryBuilder<T>

  /** Add WHERE condition */
  where(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>

  /** Add AND condition */
  and(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>

  /** Add OR condition */
  or(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>

  /** Add NOT condition */
  not(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>

  /** Add ORDER BY */
  orderBy(field: string, direction?: SortDirection): IQueryBuilder<T>

  /** Add LIMIT */
  limit(limit: number): IQueryBuilder<T>

  /** Add OFFSET */
  offset(offset: number): IQueryBuilder<T>

  /** Add JOIN */
  join(table: string, on: { left: string; right: string }, type?: 'inner' | 'left' | 'right' | 'full'): IQueryBuilder<T>

  /** Add GROUP BY */
  groupBy(...fields: string[]): IQueryBuilder<T>

  /** Add HAVING */
  having(field: string, operator: FilterOperator, value: any): IQueryBuilder<T>

  /** Execute query */
  execute(): Promise<QueryResult<T>>

  /** Get first result */
  first(): Promise<T | null>

  /** Get all results */
  all(): Promise<T[]>

  /** Count results */
  count(): Promise<number>
}

/**
 * Table schema definition
 */
export interface TableSchema {
  /** Table name */
  name: string

  /** Columns */
  columns: ColumnDefinition[]

  /** Primary key */
  primaryKey?: string[]

  /** Indexes */
  indexes?: IndexDefinition[]

  /** Unique constraints */
  uniqueConstraints?: string[][]
}

/**
 * Column definition
 */
export interface ColumnDefinition {
  /** Column name */
  name: string

  /** Data type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array'

  /** Nullable */
  nullable?: boolean

  /** Default value */
  default?: any

  /** Auto-increment */
  autoIncrement?: boolean
}

/**
 * Index definition
 */
export interface IndexDefinition {
  /** Index name */
  name: string

  /** Columns */
  columns: string[]

  /** Unique index */
  unique?: boolean

  /** Index type */
  type?: 'btree' | 'hash' | 'gin' | 'gist'
}

/**
 * Migration definition
 */
export interface Migration {
  /** Migration version */
  version: string

  /** Migration description */
  description: string

  /** Up migration function */
  up: (client: any) => Promise<void>

  /** Down migration function */
  down: (client: any) => Promise<void>
}

/**
 * ZeroDB client events
 */
export interface ZeroDBEvents {
  /** Connection established */
  connect: () => void

  /** Connection closed */
  disconnect: () => void

  /** Error occurred */
  error: (error: Error) => void

  /** Query executed */
  query: (query: string, duration: number) => void

  /** Transaction started */
  transactionStart: (id: string) => void

  /** Transaction committed */
  transactionCommit: (id: string) => void

  /** Transaction rolled back */
  transactionRollback: (id: string) => void
}

/**
 * ZeroDB client interface
 */
export interface IZeroDBClient {
  /** Insert records */
  insert<T = any>(table: string, data: Record<string, any> | Record<string, any>[], options?: InsertOptions): Promise<CRUDResult<T>>

  /** Select records */
  select<T = any>(table: string, options?: QueryOptions): Promise<QueryResult<T>>

  /** Update records */
  update<T = any>(table: string, data: Record<string, any>, options?: UpdateOptions): Promise<CRUDResult<T>>

  /** Delete records */
  delete<T = any>(table: string, options?: DeleteOptions): Promise<CRUDResult<T>>

  /** Upsert records */
  upsert<T = any>(table: string, data: Record<string, any> | Record<string, any>[], options?: InsertOptions): Promise<CRUDResult<T>>

  /** Execute batch operations */
  batch(operations: BatchOperation[]): Promise<TransactionResult>

  /** Create query builder */
  query<T = any>(table: string): IQueryBuilder<T>

  /** Execute transaction */
  transaction<T>(callback: (client: IZeroDBClient) => Promise<T>, options?: TransactionOptions): Promise<T>

  /** Check connection health */
  healthCheck(): Promise<HealthStatus>

  /** Close connection */
  close(): Promise<void>
}
