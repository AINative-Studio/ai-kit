# ZeroDB CRUD Operations

Complete guide to using ZeroDB CRUD operations in AI Kit for building robust, scalable data-driven applications.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Connection Setup](#connection-setup)
- [CRUD Operations](#crud-operations)
- [Query Builder](#query-builder)
- [Transactions](#transactions)
- [Batch Operations](#batch-operations)
- [Connection Pooling](#connection-pooling)
- [Error Handling](#error-handling)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)
- [Examples](#examples)

## Overview

The ZeroDB CRUD client provides a comprehensive interface for database operations in AI applications. It includes:

- **Full CRUD Operations**: Create, Read, Update, Delete with advanced options
- **Query Builder**: Fluent API for building complex queries
- **Transaction Support**: ACID-compliant transactions with rollback
- **Connection Pooling**: Efficient connection management with health monitoring
- **Batch Operations**: Execute multiple operations atomically
- **Retry Logic**: Automatic retries with exponential backoff
- **Type Safety**: Full TypeScript support with comprehensive types

## Installation

The ZeroDB module is included in the AI Kit core package:

```bash
npm install @ainative/ai-kit-core
```

## Quick Start

```typescript
import { createZeroDBClient } from '@ainative/ai-kit-core/zerodb'

// Create client
const client = createZeroDBClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key'
})

// Insert data
await client.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active'
})

// Query data
const users = await client.query('users')
  .where('status', 'eq', 'active')
  .orderBy('created_at', 'desc')
  .limit(10)
  .all()

// Update data
await client.update('users',
  { status: 'inactive' },
  { filter: { condition: { field: 'id', operator: 'eq', value: 1 } } }
)

// Delete data
await client.delete('users', {
  filter: { condition: { field: 'status', operator: 'eq', value: 'deleted' } }
})

// Close connection
await client.close()
```

## Connection Setup

### Basic Configuration

```typescript
import { createZeroDBClient, ZeroDBConfig } from '@ainative/ai-kit-core/zerodb'

const config: ZeroDBConfig = {
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  baseUrl: 'https://api.zerodb.io', // Optional, defaults to production
  timeout: 30000 // Request timeout in milliseconds
}

const client = createZeroDBClient(config)
```

### Connection Pooling Configuration

```typescript
const client = createZeroDBClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  pool: {
    min: 2,              // Minimum connections
    max: 10,             // Maximum connections
    idleTimeout: 30000,  // Idle timeout in ms
    acquireTimeout: 5000, // Acquisition timeout in ms
    validate: true       // Enable connection validation
  }
})
```

### Retry Configuration

```typescript
const client = createZeroDBClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  retry: {
    maxRetries: 3,           // Maximum retry attempts
    initialDelay: 1000,      // Initial delay in ms
    maxDelay: 10000,         // Maximum delay in ms
    backoffMultiplier: 2,    // Backoff multiplier
    retryableErrors: [       // Retryable error codes
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ]
  }
})
```

### Debug Mode

```typescript
const client = createZeroDBClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  debug: true // Enable detailed logging
})
```

## CRUD Operations

### Insert Operations

#### Insert Single Record

```typescript
const result = await client.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})

console.log(`Inserted ${result.rowsAffected} rows`)
```

#### Insert Multiple Records

```typescript
const users = [
  { name: 'John Doe', email: 'john@example.com' },
  { name: 'Jane Smith', email: 'jane@example.com' },
  { name: 'Bob Johnson', email: 'bob@example.com' }
]

const result = await client.insert('users', users)
console.log(`Inserted ${result.rowsAffected} rows`)
```

#### Insert with Returning

```typescript
const result = await client.insert('users',
  { name: 'John Doe', email: 'john@example.com' },
  { returning: true }
)

console.log('Inserted user:', result.rows[0])
```

#### Insert with Conflict Handling

```typescript
// Ignore on conflict
await client.insert('users',
  { id: 1, name: 'John Doe' },
  {
    onConflict: {
      target: ['id'],
      action: 'ignore'
    }
  }
)

// Update on conflict
await client.insert('users',
  { id: 1, name: 'John Doe Updated', email: 'john.new@example.com' },
  {
    onConflict: {
      target: ['id'],
      action: 'update',
      updateFields: ['name', 'email']
    }
  }
)
```

### Select Operations

#### Select All Records

```typescript
const result = await client.select('users')
console.log('Users:', result.rows)
```

#### Select Specific Fields

```typescript
const result = await client.select('users', {
  select: ['id', 'name', 'email']
})
```

#### Select with Filter

```typescript
const result = await client.select('users', {
  filter: {
    condition: {
      field: 'status',
      operator: 'eq',
      value: 'active'
    }
  }
})
```

#### Select with Sorting

```typescript
const result = await client.select('users', {
  sort: [
    { field: 'created_at', direction: 'desc' },
    { field: 'name', direction: 'asc' }
  ]
})
```

#### Select with Pagination

```typescript
const result = await client.select('users', {
  limit: 20,
  offset: 40
})
```

#### Select with Count

```typescript
const result = await client.select('users', {
  count: true,
  filter: {
    condition: {
      field: 'status',
      operator: 'eq',
      value: 'active'
    }
  }
})

console.log(`Found ${result.count} active users`)
```

#### Select with Joins

```typescript
const result = await client.select('users', {
  joins: [
    {
      table: 'profiles',
      type: 'left',
      on: { left: 'id', right: 'user_id' }
    },
    {
      table: 'posts',
      type: 'left',
      on: { left: 'id', right: 'author_id' }
    }
  ]
})
```

### Update Operations

#### Update Records

```typescript
const result = await client.update('users',
  { status: 'inactive', updated_at: new Date().toISOString() },
  {
    filter: {
      condition: {
        field: 'id',
        operator: 'eq',
        value: 1
      }
    }
  }
)

console.log(`Updated ${result.rowsAffected} rows`)
```

#### Update with Returning

```typescript
const result = await client.update('users',
  { status: 'active' },
  {
    filter: {
      condition: { field: 'id', operator: 'eq', value: 1 }
    },
    returning: true
  }
)

console.log('Updated user:', result.rows[0])
```

#### Bulk Update

```typescript
const result = await client.update('users',
  { status: 'inactive' },
  {
    filter: {
      condition: {
        field: 'last_login',
        operator: 'lt',
        value: '2023-01-01'
      }
    }
  }
)

console.log(`Deactivated ${result.rowsAffected} inactive users`)
```

### Delete Operations

#### Delete Records

```typescript
const result = await client.delete('users', {
  filter: {
    condition: {
      field: 'id',
      operator: 'eq',
      value: 1
    }
  }
})

console.log(`Deleted ${result.rowsAffected} rows`)
```

#### Delete with Returning

```typescript
const result = await client.delete('users', {
  filter: {
    condition: { field: 'id', operator: 'eq', value: 1 }
  },
  returning: true
})

console.log('Deleted user:', result.rows[0])
```

#### Bulk Delete

```typescript
const result = await client.delete('users', {
  filter: {
    and: [
      {
        condition: {
          field: 'status',
          operator: 'eq',
          value: 'deleted'
        }
      },
      {
        condition: {
          field: 'created_at',
          operator: 'lt',
          value: '2023-01-01'
        }
      }
    ]
  }
})

console.log(`Permanently deleted ${result.rowsAffected} users`)
```

### Upsert Operations

#### Upsert Single Record

```typescript
const result = await client.upsert('users', {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
})
```

#### Upsert with Custom Conflict Target

```typescript
const result = await client.upsert('users',
  { email: 'john@example.com', name: 'John Doe', age: 30 },
  {
    onConflict: {
      target: ['email'],
      action: 'update',
      updateFields: ['name', 'age']
    }
  }
)
```

#### Upsert Multiple Records

```typescript
const users = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Bob Johnson' }
]

const result = await client.upsert('users', users)
```

## Query Builder

The query builder provides a fluent API for building complex queries with method chaining.

### Basic Queries

```typescript
// Simple query
const users = await client.query('users')
  .where('status', 'eq', 'active')
  .all()

// Query with multiple conditions
const users = await client.query('users')
  .where('status', 'eq', 'active')
  .and('age', 'gte', 18)
  .orderBy('created_at', 'desc')
  .limit(10)
  .all()
```

### Filter Operators

```typescript
// Equal
.where('status', 'eq', 'active')

// Not equal
.where('status', 'ne', 'deleted')

// Greater than
.where('age', 'gt', 18)

// Greater than or equal
.where('age', 'gte', 18)

// Less than
.where('score', 'lt', 100)

// Less than or equal
.where('score', 'lte', 100)

// In array
.where('status', 'in', ['active', 'pending'])

// Not in array
.where('status', 'nin', ['deleted', 'banned'])

// Pattern matching
.where('email', 'like', '%@example.com')

// Case-insensitive pattern matching
.where('name', 'ilike', '%john%')

// IS NULL
.where('deleted_at', 'is', null)

// Array contains
.where('tags', 'contains', 'featured')
```

### Logical Operators

```typescript
// AND conditions
const users = await client.query('users')
  .where('status', 'eq', 'active')
  .and('age', 'gte', 18)
  .and('verified', 'eq', true)
  .all()

// OR conditions
const users = await client.query('users')
  .where('status', 'eq', 'active')
  .or('status', 'eq', 'pending')
  .all()

// NOT conditions
const users = await client.query('users')
  .not('status', 'eq', 'deleted')
  .not('banned', 'eq', true)
  .all()

// Complex combinations
const users = await client.query('users')
  .where('age', 'gte', 18)
  .and('verified', 'eq', true)
  .or('premium', 'eq', true)
  .not('status', 'eq', 'deleted')
  .all()
```

### Field Selection

```typescript
const users = await client.query('users')
  .select('id', 'name', 'email')
  .where('status', 'eq', 'active')
  .all()
```

### Sorting

```typescript
// Single field
const users = await client.query('users')
  .orderBy('created_at', 'desc')
  .all()

// Multiple fields
const users = await client.query('users')
  .orderBy('last_name', 'asc')
  .orderBy('first_name', 'asc')
  .all()
```

### Pagination

```typescript
// Using limit and offset
const users = await client.query('users')
  .limit(20)
  .offset(40)
  .all()

// Using paginate helper
const users = await client.query('users')
  .paginate(3, 20) // Page 3, 20 per page
  .all()
```

### Joins

```typescript
const users = await client.query('users')
  .join('profiles', { left: 'id', right: 'user_id' }, 'left')
  .join('posts', { left: 'id', right: 'author_id' }, 'left')
  .where('users.status', 'eq', 'active')
  .all()
```

### Execution Methods

```typescript
// Execute and get full result
const result = await client.query('users')
  .where('status', 'eq', 'active')
  .execute()

console.log(result.rows)
console.log(result.count)

// Get all rows
const users = await client.query('users')
  .where('status', 'eq', 'active')
  .all()

// Get first row
const user = await client.query('users')
  .where('id', 'eq', 1)
  .first()

// Count rows
const count = await client.query('users')
  .where('status', 'eq', 'active')
  .count()
```

### Query Builder Utilities

```typescript
// Clone query
const baseQuery = client.query('users')
  .where('status', 'eq', 'active')

const query1 = baseQuery.clone().orderBy('name', 'asc')
const query2 = baseQuery.clone().orderBy('created_at', 'desc')

// Reset query
const query = client.query('users')
  .where('status', 'eq', 'active')
  .limit(10)
  .reset()

// Get query options (for debugging)
const query = client.query('users')
  .where('status', 'eq', 'active')
  .limit(10)

console.log(query.getOptions())
```

## Transactions

Transactions ensure ACID compliance for multiple operations.

### Basic Transaction

```typescript
await client.transaction(async (tx) => {
  await tx.insert('users', { name: 'John Doe' })
  await tx.insert('profiles', { user_id: 1, bio: 'Developer' })
})
```

### Transaction with Return Value

```typescript
const result = await client.transaction(async (tx) => {
  const user = await tx.insert('users',
    { name: 'John Doe', email: 'john@example.com' },
    { returning: true }
  )

  const userId = user.rows[0].id

  await tx.insert('profiles', {
    user_id: userId,
    bio: 'Software Developer'
  })

  return { userId, success: true }
})

console.log('Created user:', result.userId)
```

### Transaction with Error Handling

```typescript
try {
  await client.transaction(async (tx) => {
    await tx.insert('users', { name: 'John Doe' })

    // This will cause rollback
    throw new Error('Something went wrong')

    await tx.insert('profiles', { user_id: 1 })
  })
} catch (error) {
  console.error('Transaction rolled back:', error)
}
```

### Transaction Options

```typescript
await client.transaction(async (tx) => {
  // Your operations
}, {
  isolationLevel: 'serializable',
  readOnly: false,
  timeout: 60000
})
```

### Nested Transactions

```typescript
await client.transaction(async (tx1) => {
  await tx1.insert('users', { name: 'User 1' })

  await tx1.transaction(async (tx2) => {
    await tx2.insert('users', { name: 'User 2' })
    await tx2.insert('profiles', { user_id: 2 })
  })

  await tx1.insert('users', { name: 'User 3' })
})
```

### Transaction Events

```typescript
client.on('transactionStart', (id) => {
  console.log('Transaction started:', id)
})

client.on('transactionCommit', (id) => {
  console.log('Transaction committed:', id)
})

client.on('transactionRollback', (id) => {
  console.log('Transaction rolled back:', id)
})

await client.transaction(async (tx) => {
  await tx.insert('users', { name: 'John Doe' })
})
```

## Batch Operations

Execute multiple operations atomically in a single transaction.

### Basic Batch

```typescript
const result = await client.batch([
  { type: 'insert', table: 'users', data: { name: 'John' } },
  { type: 'insert', table: 'users', data: { name: 'Jane' } },
  { type: 'insert', table: 'users', data: { name: 'Bob' } }
])

console.log(`Executed ${result.operationsExecuted} operations`)
console.log(`Affected ${result.totalRowsAffected} rows`)
```

### Mixed Batch Operations

```typescript
const result = await client.batch([
  {
    type: 'insert',
    table: 'users',
    data: { name: 'New User' }
  },
  {
    type: 'update',
    table: 'users',
    data: { status: 'active' },
    filter: {
      condition: { field: 'id', operator: 'eq', value: 1 }
    }
  },
  {
    type: 'delete',
    table: 'users',
    filter: {
      condition: { field: 'status', operator: 'eq', value: 'deleted' }
    }
  }
])
```

### Batch with Options

```typescript
await client.batch([
  {
    type: 'insert',
    table: 'users',
    data: { name: 'John Doe' },
    options: { returning: true }
  },
  {
    type: 'update',
    table: 'users',
    data: { last_login: new Date().toISOString() },
    filter: {
      condition: { field: 'id', operator: 'eq', value: 1 }
    },
    options: { returning: true }
  }
])
```

## Connection Pooling

### Pool Statistics

```typescript
const stats = client.getPoolStats()

console.log('Total connections:', stats.total)
console.log('Active connections:', stats.active)
console.log('Idle connections:', stats.idle)
console.log('Waiting requests:', stats.waiting)
```

### Health Check

```typescript
const health = await client.healthCheck()

if (health.connected) {
  console.log('Database is healthy')
  console.log('Response time:', health.responseTime, 'ms')
  console.log('Pool stats:', health.pool)
} else {
  console.error('Database is unhealthy:', health.error)
}
```

### Connection Lifecycle

```typescript
// Client automatically connects on first use
const client = createZeroDBClient(config)

// Perform operations
await client.insert('users', { name: 'John' })

// Check if closed
console.log('Is closed:', client.isClosed())

// Close connection
await client.close()
```

## Error Handling

### Basic Error Handling

```typescript
try {
  await client.insert('users', { name: 'John Doe' })
} catch (error) {
  console.error('Insert failed:', error.message)
}
```

### Error Events

```typescript
client.on('error', (error) => {
  console.error('Database error:', error)
  // Log to monitoring service
})

client.on('query', (operation, duration) => {
  if (duration > 1000) {
    console.warn(`Slow query detected: ${operation} took ${duration}ms`)
  }
})
```

### Retry Logic

The client automatically retries failed operations with exponential backoff:

```typescript
const client = createZeroDBClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
})

// Automatically retries on connection errors
await client.insert('users', { name: 'John' })
```

## Advanced Features

### Complex Filters

```typescript
const result = await client.select('users', {
  filter: {
    and: [
      {
        condition: {
          field: 'age',
          operator: 'gte',
          value: 18
        }
      },
      {
        or: [
          {
            condition: {
              field: 'status',
              operator: 'eq',
              value: 'active'
            }
          },
          {
            condition: {
              field: 'status',
              operator: 'eq',
              value: 'pending'
            }
          }
        ]
      },
      {
        not: {
          condition: {
            field: 'banned',
            operator: 'eq',
            value: true
          }
        }
      }
    ]
  }
})
```

### Custom Configuration

```typescript
const client = createZeroDBClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  baseUrl: 'https://custom.zerodb.io',
  timeout: 60000,
  pool: {
    min: 5,
    max: 20,
    idleTimeout: 60000,
    acquireTimeout: 10000
  },
  retry: {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 15000,
    backoffMultiplier: 3
  },
  debug: true
})
```

## Best Practices

### 1. Always Use Filters for Updates and Deletes

```typescript
// BAD: Will throw error (safety measure)
await client.update('users', { status: 'inactive' })

// GOOD: Specify filter
await client.update('users',
  { status: 'inactive' },
  {
    filter: {
      condition: { field: 'last_login', operator: 'lt', value: '2023-01-01' }
    }
  }
)
```

### 2. Use Transactions for Related Operations

```typescript
// Ensure data consistency
await client.transaction(async (tx) => {
  const user = await tx.insert('users', userData, { returning: true })
  await tx.insert('profiles', { user_id: user.rows[0].id, ...profileData })
  await tx.insert('settings', { user_id: user.rows[0].id, ...settingsData })
})
```

### 3. Leverage Query Builder for Complex Queries

```typescript
const users = await client.query('users')
  .select('id', 'name', 'email')
  .where('status', 'eq', 'active')
  .and('age', 'gte', 18)
  .orderBy('created_at', 'desc')
  .paginate(1, 20)
  .all()
```

### 4. Use Batch Operations for Multiple Writes

```typescript
await client.batch([
  { type: 'insert', table: 'logs', data: log1 },
  { type: 'insert', table: 'logs', data: log2 },
  { type: 'insert', table: 'logs', data: log3 }
])
```

### 5. Monitor Connection Health

```typescript
setInterval(async () => {
  const health = await client.healthCheck()
  if (!health.connected) {
    console.error('Database connection lost')
    // Alert monitoring service
  }
}, 60000)
```

### 6. Handle Errors Gracefully

```typescript
try {
  await client.insert('users', userData)
} catch (error) {
  // Log error
  console.error('Failed to insert user:', error)

  // Return appropriate response
  return { success: false, error: error.message }
}
```

### 7. Close Connections on Shutdown

```typescript
process.on('SIGTERM', async () => {
  await client.close()
  process.exit(0)
})
```

## API Reference

### ZeroDBClient

#### Constructor

```typescript
new ZeroDBClient(config: ZeroDBConfig)
```

#### Methods

- `insert<T>(table, data, options?)`: Insert records
- `select<T>(table, options?)`: Select records
- `update<T>(table, data, options?)`: Update records
- `delete<T>(table, options?)`: Delete records
- `upsert<T>(table, data, options?)`: Upsert records
- `batch(operations)`: Execute batch operations
- `query<T>(table)`: Create query builder
- `transaction<T>(callback, options?)`: Execute transaction
- `healthCheck()`: Check connection health
- `getPoolStats()`: Get pool statistics
- `getConfig()`: Get configuration
- `isClosed()`: Check if closed
- `close()`: Close connection

### QueryBuilder

#### Methods

- `select(...fields)`: Select specific fields
- `where(field, operator, value)`: Add WHERE condition
- `and(field, operator, value)`: Add AND condition
- `or(field, operator, value)`: Add OR condition
- `not(field, operator, value)`: Add NOT condition
- `orderBy(field, direction)`: Add ORDER BY
- `limit(limit)`: Add LIMIT
- `offset(offset)`: Add OFFSET
- `join(table, on, type?)`: Add JOIN
- `groupBy(...fields)`: Add GROUP BY
- `having(field, operator, value)`: Add HAVING
- `paginate(page, pageSize)`: Paginate results
- `execute()`: Execute query
- `first()`: Get first result
- `all()`: Get all results
- `count()`: Count results
- `clone()`: Clone query builder
- `reset()`: Reset query builder
- `getOptions()`: Get query options

## Examples

### User Management System

```typescript
import { createZeroDBClient } from '@ainative/ai-kit-core/zerodb'

const db = createZeroDBClient({
  projectId: 'user-mgmt',
  apiKey: process.env.ZERODB_API_KEY
})

// Create user with profile
async function createUser(userData: any, profileData: any) {
  return db.transaction(async (tx) => {
    const user = await tx.insert('users', userData, { returning: true })
    const userId = user.rows[0].id

    await tx.insert('profiles', {
      user_id: userId,
      ...profileData
    })

    return userId
  })
}

// Get active users
async function getActiveUsers(page: number = 1, pageSize: number = 20) {
  return db.query('users')
    .select('id', 'name', 'email', 'created_at')
    .where('status', 'eq', 'active')
    .orderBy('created_at', 'desc')
    .paginate(page, pageSize)
    .all()
}

// Deactivate inactive users
async function deactivateInactiveUsers(days: number = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return db.update('users',
    { status: 'inactive' },
    {
      filter: {
        condition: {
          field: 'last_login',
          operator: 'lt',
          value: cutoffDate.toISOString()
        }
      }
    }
  )
}
```

### Analytics Pipeline

```typescript
// Batch insert analytics events
async function logEvents(events: any[]) {
  const operations = events.map(event => ({
    type: 'insert' as const,
    table: 'events',
    data: {
      ...event,
      timestamp: new Date().toISOString()
    }
  }))

  return db.batch(operations)
}

// Query analytics data
async function getEventStats(startDate: string, endDate: string) {
  return db.query('events')
    .where('timestamp', 'gte', startDate)
    .and('timestamp', 'lte', endDate)
    .count()
}
```

### Content Management

```typescript
// Get published posts with author
async function getPublishedPosts(limit: number = 10) {
  return db.query('posts')
    .select('posts.id', 'posts.title', 'users.name as author')
    .join('users', { left: 'author_id', right: 'id' }, 'inner')
    .where('posts.status', 'eq', 'published')
    .orderBy('posts.published_at', 'desc')
    .limit(limit)
    .all()
}

// Update post and create revision
async function updatePost(postId: number, updates: any) {
  return db.transaction(async (tx) => {
    const oldPost = await tx.query('posts')
      .where('id', 'eq', postId)
      .first()

    await tx.insert('post_revisions', {
      post_id: postId,
      content: oldPost.content,
      revised_at: new Date().toISOString()
    })

    await tx.update('posts', updates, {
      filter: {
        condition: { field: 'id', operator: 'eq', value: postId }
      }
    })
  })
}
```

---

For more examples and use cases, visit the [AI Kit documentation](https://ainative.studio/docs).
