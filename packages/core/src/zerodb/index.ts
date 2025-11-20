/**
 * ZeroDB CRUD Operations Module
 *
 * Complete CRUD client for ZeroDB with advanced features including
 * query builder, transactions, connection pooling, and health monitoring.
 *
 * @example
 * ```typescript
 * import { createZeroDBClient } from '@ainative/ai-kit-core/zerodb'
 *
 * const client = createZeroDBClient({
 *   projectId: 'your-project-id',
 *   apiKey: 'your-api-key'
 * })
 *
 * // Insert data
 * await client.insert('users', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * })
 *
 * // Query with builder
 * const users = await client.query('users')
 *   .where('status', 'eq', 'active')
 *   .orderBy('created_at', 'desc')
 *   .limit(10)
 *   .all()
 * ```
 */

export { ZeroDBClient, createZeroDBClient } from './ZeroDBClient'
export { QueryBuilder } from './QueryBuilder'
export * from './types'
