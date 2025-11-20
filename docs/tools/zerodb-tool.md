# ZeroDB Tool - AI Agent Database Access

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Configuration](#configuration)
6. [Core Concepts](#core-concepts)
7. [Natural Language Processing](#natural-language-processing)
8. [Safety & Security](#safety--security)
9. [Operation Types](#operation-types)
10. [Result Formatting](#result-formatting)
11. [Schema Management](#schema-management)
12. [Error Handling](#error-handling)
13. [Rate Limiting](#rate-limiting)
14. [Statistics & Monitoring](#statistics--monitoring)
15. [Advanced Usage](#advanced-usage)
16. [Best Practices](#best-practices)
17. [API Reference](#api-reference)
18. [Examples](#examples)
19. [Troubleshooting](#troubleshooting)

---

## Overview

The ZeroDB Tool is a powerful AI agent integration that enables natural language database operations for ZeroDB. It translates human-readable queries into safe, validated database operations with comprehensive error handling and security features.

### Key Capabilities

- **Natural Language Understanding**: Convert plain English to database operations
- **Safety First**: Built-in validation prevents dangerous operations
- **Multiple Formats**: Output data in JSON, tables, markdown, or natural language
- **Schema Awareness**: Automatic schema introspection and caching
- **Rate Limiting**: Protect your database from excessive requests
- **Statistics Tracking**: Monitor usage and performance metrics

### Use Cases

- AI chatbots with database access
- Natural language data analytics
- Automated reporting systems
- Voice-controlled database queries
- Data exploration tools
- Agent-based automation workflows

---

## Features

### Natural Language Processing

- Understands multiple query variations (SELECT, GET, FIND, etc.)
- Extracts table names, columns, conditions, and limits
- Handles complex queries with JOINs and aggregations
- Provides confidence scores for ambiguous queries
- Suggests corrections for incomplete queries

### Safety & Validation

- **Dangerous Operation Detection**: Warns about DELETE, UPDATE, DROP TABLE
- **WHERE Clause Enforcement**: Blocks destructive operations without conditions
- **Configurable Safety Levels**: SAFE, WARNING, DANGEROUS, BLOCKED
- **Confirmation Requirements**: Optional user confirmation for risky operations
- **Row Limits**: Prevents accidentally querying millions of rows

### Performance Features

- **Schema Caching**: Reduce API calls with configurable TTL
- **Rate Limiting**: Per-minute and per-hour request throttling
- **Execution Tracking**: Monitor query performance
- **Batch Operations**: Execute multiple queries efficiently

---

## Installation

```bash
npm install @ainative/ai-kit-tools
```

Or with pnpm:

```bash
pnpm add @ainative/ai-kit-tools
```

---

## Quick Start

### Basic Setup

```typescript
import { ZeroDBTool, ResultFormat } from '@ainative/ai-kit-tools'

// Create tool instance
const dbTool = new ZeroDBTool({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
})

// Execute natural language query
const result = await dbTool.execute('select from users limit 10')

console.log(result.formattedResult)
```

### With Factory Function

```typescript
import { createZeroDBTool } from '@ainative/ai-kit-tools'

const dbTool = createZeroDBTool({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  maxRowsPerQuery: 500,
})
```

---

## Configuration

### Configuration Options

```typescript
interface ZeroDBToolConfig {
  // Authentication (required - one of these)
  apiKey?: string
  jwtToken?: string

  // Connection (required)
  projectId: string

  // Optional settings
  baseURL?: string                    // Default: 'https://api.ainative.studio'
  timeout?: number                    // Default: 30000 (30 seconds)

  // Safety settings
  allowDangerousOperations?: boolean  // Default: false
  requireConfirmation?: boolean       // Default: true
  maxRowsPerQuery?: number           // Default: 1000

  // Rate limiting
  rateLimit?: {
    maxRequestsPerMinute?: number    // Default: unlimited
    maxRequestsPerHour?: number      // Default: unlimited
  }

  // Schema caching
  cacheSchema?: boolean               // Default: true
  schemaCacheTTL?: number            // Default: 3600 (1 hour)

  // Logging
  enableLogging?: boolean             // Default: false
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
```

### Configuration Examples

#### Production Configuration

```typescript
const productionTool = new ZeroDBTool({
  jwtToken: process.env.ZERODB_JWT_TOKEN,
  projectId: process.env.ZERODB_PROJECT_ID,
  maxRowsPerQuery: 100,
  allowDangerousOperations: false,
  requireConfirmation: true,
  rateLimit: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
  },
  enableLogging: true,
  logLevel: 'info',
})
```

#### Development Configuration

```typescript
const devTool = new ZeroDBTool({
  apiKey: 'dev-api-key',
  projectId: 'dev-project',
  maxRowsPerQuery: 1000,
  allowDangerousOperations: true,
  requireConfirmation: false,
  cacheSchema: false, // Disable caching during development
  enableLogging: true,
  logLevel: 'debug',
})
```

---

## Core Concepts

### Operation Types

The tool supports various database operations:

```typescript
enum DatabaseOperationType {
  SELECT = 'select',         // Query data
  INSERT = 'insert',         // Add new records
  UPDATE = 'update',         // Modify existing records
  DELETE = 'delete',         // Remove records
  CREATE_TABLE = 'create_table',  // Create new table
  DROP_TABLE = 'drop_table', // Delete table
  AGGREGATE = 'aggregate',   // Aggregations (SUM, AVG, etc.)
  SCHEMA = 'schema',         // Get schema information
  COUNT = 'count',           // Count rows
  SEARCH = 'search',         // Full-text search
}
```

### Query Intent

Operations are classified by intent:

```typescript
enum QueryIntent {
  READ = 'read',              // Safe read operations
  WRITE = 'write',            // Data insertion
  MODIFY = 'modify',          // Data modification
  DELETE = 'delete',          // Data deletion
  SCHEMA_CHANGE = 'schema_change',  // Structure changes
  ANALYTICS = 'analytics',    // Aggregations and analysis
  SEARCH = 'search',          // Search operations
}
```

### Safety Levels

```typescript
enum SafetyLevel {
  SAFE = 'safe',              // No risks detected
  WARNING = 'warning',        // Minor concerns
  DANGEROUS = 'dangerous',    // Requires confirmation
  BLOCKED = 'blocked',        // Not allowed
}
```

---

## Natural Language Processing

### Supported Query Patterns

#### SELECT Queries

```typescript
// All these variations work:
await dbTool.execute('select from users')
await dbTool.execute('get all products')
await dbTool.execute('find records in orders')
await dbTool.execute('retrieve data from customers')
await dbTool.execute('show me users')
await dbTool.execute('list products')
```

#### With Conditions

```typescript
await dbTool.execute('select from users where status=active')
await dbTool.execute('get products where price>100')
await dbTool.execute('find orders where customer_id=123')
```

#### With Limits and Offsets

```typescript
await dbTool.execute('select from users limit 50')
await dbTool.execute('get top 10 products')
await dbTool.execute('first 20 orders')
await dbTool.execute('select from users limit 10 offset 20')
```

#### With Ordering

```typescript
await dbTool.execute('select from users order by created_at desc')
await dbTool.execute('get products order by price asc')
```

#### With Column Selection

```typescript
await dbTool.execute('select name, email from users')
await dbTool.execute('get id, title, price from products')
```

### Complex Queries

```typescript
// Multi-clause queries
await dbTool.execute(
  'select name, email from users where status=active order by created_at desc limit 10'
)

// Aggregations
await dbTool.execute('count rows in users')
await dbTool.execute('sum(amount) from orders')
await dbTool.execute('average price from products')
await dbTool.execute('max(score) from games')

// Group by
await dbTool.execute('count from orders group by status')
```

### Confidence Scores

The parser provides confidence scores to indicate query certainty:

```typescript
const parsed = dbTool.parseNaturalLanguage('select from users')
console.log(parsed.confidence) // 0.8 - 1.0 for clear queries

const ambiguous = dbTool.parseNaturalLanguage('get some data')
console.log(ambiguous.confidence) // 0.3 - 0.5 for unclear queries
```

---

## Safety & Security

### Validation System

Every operation is validated before execution:

```typescript
const result = await dbTool.execute('delete from users')

if (!result.success) {
  console.log(result.error?.message)
  // "DELETE without WHERE clause is not allowed"

  console.log(result.error?.suggestion)
  // "Add specific conditions to limit which rows are deleted"
}
```

### Safety Checks

#### DELETE Protection

```typescript
// BLOCKED - no WHERE clause
await dbTool.execute('delete from users')

// ALLOWED - with specific condition
await dbTool.execute('delete from users where id=123')
```

#### UPDATE Protection

```typescript
// WARNING - updates all rows
await dbTool.execute('update users set status=active')

// SAFE - with condition
await dbTool.execute('update users set status=active where id=123')
```

#### DROP TABLE Protection

```typescript
// Configure to allow dangerous operations
const tool = new ZeroDBTool({
  apiKey: 'key',
  projectId: 'project',
  allowDangerousOperations: true,
})

// Still requires confirmation
const result = await tool.execute('drop table old_data')
console.log(result.metadata.safetyCheck?.requiresConfirmation) // true
```

### Custom Validation

```typescript
// Validate before executing
const operation = dbTool.parseNaturalLanguage('delete from users where status=inactive')
const validation = dbTool.validate(operation.operation)

if (!validation.valid) {
  console.error('Validation failed:', validation.errors)
} else if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings)
}
```

---

## Operation Types

### SELECT Operations

```typescript
// Basic select
const result = await dbTool.execute('select from users limit 10')

// With specific columns
const result = await dbTool.execute('select name, email, created_at from users')

// With filtering
const result = await dbTool.execute(
  'select from users where role=admin and status=active'
)

// With ordering
const result = await dbTool.execute(
  'select from products order by price desc limit 20'
)
```

### INSERT Operations

```typescript
// Note: INSERT requires data to be provided programmatically
const operation = dbTool.parseNaturalLanguage('insert into users')

// Then execute with data
const result = await dbTool.execute('insert into users', {
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  },
})
```

### UPDATE Operations

```typescript
// Update with condition
await dbTool.execute('update users set status=active where id=123')

// Multiple fields
await dbTool.execute(
  'update products set price=99.99, stock=100 where sku=ABC123'
)
```

### DELETE Operations

```typescript
// Delete specific records
await dbTool.execute('delete from users where status=inactive and last_login<2020-01-01')

// Count before delete
const count = await dbTool.execute('count from users where status=inactive')
// Then delete
await dbTool.execute('delete from users where status=inactive')
```

### COUNT Operations

```typescript
// Simple count
const result = await dbTool.execute('count rows in users')

// Count with condition
const result = await dbTool.execute('count from users where status=active')

// Count by group
const result = await dbTool.execute('count from orders group by status')
```

### AGGREGATE Operations

```typescript
// Sum
await dbTool.execute('sum(amount) from orders')

// Average
await dbTool.execute('avg(price) from products')

// Min/Max
await dbTool.execute('min(created_at) from users')
await dbTool.execute('max(score) from games')

// Multiple aggregations
await dbTool.execute('sum(amount), avg(amount), count(*) from orders group by customer_id')
```

### SCHEMA Operations

```typescript
// Get all schemas
const result = await dbTool.execute('show database schema')

// Get specific table schema
const result = await dbTool.execute('describe table users')

// Schema result includes:
// - Column names and types
// - Primary keys
// - Foreign keys
// - Indexes
// - Row count
```

---

## Result Formatting

### Available Formats

```typescript
enum ResultFormat {
  JSON = 'json',
  TABLE = 'table',
  MARKDOWN = 'markdown',
  NATURAL_LANGUAGE = 'natural_language',
  STRUCTURED = 'structured',
}
```

### JSON Format

```typescript
const result = await dbTool.execute('select from users limit 3', ResultFormat.JSON)

console.log(result.formattedResult)
/*
[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
  },
  {
    "id": 2,
    "name": "Bob",
    "email": "bob@example.com"
  }
]
*/
```

### TABLE Format

```typescript
const result = await dbTool.execute('select from users limit 3', ResultFormat.TABLE)

console.log(result.formattedResult)
/*
id | name  | email
---|-------|-------------------
1  | Alice | alice@example.com
2  | Bob   | bob@example.com
*/
```

### MARKDOWN Format

```typescript
const result = await dbTool.execute('select from users limit 3', ResultFormat.MARKDOWN)

console.log(result.formattedResult)
/*
| id | name | email |
| --- | --- | --- |
| 1 | Alice | alice@example.com |
| 2 | Bob | bob@example.com |
*/
```

### NATURAL_LANGUAGE Format

```typescript
const result = await dbTool.execute('select from users', ResultFormat.NATURAL_LANGUAGE)

console.log(result.formattedResult)
// "Found 2 results. First result: {"id":1,"name":"Alice","email":"alice@example.com"}"
```

### STRUCTURED Format

```typescript
const result = await dbTool.execute('select from users limit 2', ResultFormat.STRUCTURED)

console.log(result.formattedResult)
/*
Array[2]:
  [0]: {"id":1,"name":"Alice","email":"alice@example.com"}
  [1]: {"id":2,"name":"Bob","email":"bob@example.com"}
*/
```

---

## Schema Management

### Getting Schema

```typescript
// Get entire database schema
const schema = await dbTool.getSchema()

console.log(schema.totalTables)
console.log(schema.tables)

// Get specific table schema
const userSchema = await dbTool.getSchema('users')

console.log(userSchema.columns)
console.log(userSchema.primaryKey)
console.log(userSchema.indexes)
```

### Schema Structure

```typescript
interface DatabaseSchema {
  tables: TableSchema[]
  version?: string
  lastUpdated?: string
  totalTables: number
  totalRows?: number
}

interface TableSchema {
  tableName: string
  columns: ColumnSchema[]
  primaryKey?: string
  indexes?: IndexSchema[]
  rowCount?: number
  createdAt?: string
  updatedAt?: string
}

interface ColumnSchema {
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
```

### Schema Caching

```typescript
// Schema is cached by default for 1 hour
const tool = new ZeroDBTool({
  apiKey: 'key',
  projectId: 'project',
  cacheSchema: true,
  schemaCacheTTL: 3600, // 1 hour in seconds
})

// First call fetches from API
await tool.getSchema() // API call

// Subsequent calls use cache
await tool.getSchema() // From cache
await tool.getSchema() // From cache

// After TTL expires, refetches
// ... 1 hour later ...
await tool.getSchema() // API call again
```

---

## Error Handling

### Error Types

```typescript
interface ToolResult {
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
```

### Handling Errors

```typescript
const result = await dbTool.execute('delete from users')

if (!result.success) {
  console.error('Error:', result.error?.message)
  console.error('Code:', result.error?.code)

  if (result.error?.suggestion) {
    console.log('Suggestion:', result.error.suggestion)
  }

  // Handle based on error code
  switch (result.error?.code) {
    case 'VALIDATION_ERROR':
      // Handle validation errors
      break
    case 'EXECUTION_ERROR':
      // Handle execution errors
      break
    case 'RATE_LIMIT_EXCEEDED':
      // Handle rate limiting
      break
  }
}
```

### Warnings

```typescript
const result = await dbTool.execute('update users set status=active')

if (result.success && result.warnings) {
  result.warnings.forEach(warning => {
    console.warn('Warning:', warning)
  })
}
```

### Safety Check Results

```typescript
const result = await dbTool.execute('delete from users where id=123')

const safetyCheck = result.metadata.safetyCheck

if (safetyCheck) {
  console.log('Safety Level:', safetyCheck.level)
  console.log('Warnings:', safetyCheck.warnings)
  console.log('Requires Confirmation:', safetyCheck.requiresConfirmation)

  if (safetyCheck.suggestions) {
    console.log('Suggestions:', safetyCheck.suggestions)
  }
}
```

---

## Rate Limiting

### Configuration

```typescript
const tool = new ZeroDBTool({
  apiKey: 'key',
  projectId: 'project',
  rateLimit: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
  },
})
```

### Handling Rate Limits

```typescript
try {
  const result = await dbTool.execute('select from users')
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    console.log('Rate limit hit, waiting...')
    await new Promise(resolve => setTimeout(resolve, 60000))
    // Retry after waiting
  }
}
```

### Manual Limit Checking

```typescript
// Rate limit state is tracked internally
// Resets automatically every minute/hour
```

---

## Statistics & Monitoring

### Getting Statistics

```typescript
const stats = dbTool.getStats()

console.log('Total Operations:', stats.totalOperations)
console.log('Successful:', stats.successfulOperations)
console.log('Failed:', stats.failedOperations)
console.log('Average Execution Time:', stats.averageExecutionTimeMs, 'ms')
console.log('Total Rows Returned:', stats.totalRowsReturned)
console.log('Total Rows Affected:', stats.totalRowsAffected)

// Operations by type
console.log('SELECT operations:', stats.operationsByType.select)
console.log('INSERT operations:', stats.operationsByType.insert)
```

### Statistics Structure

```typescript
interface OperationStats {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageExecutionTimeMs: number
  operationsByType: Record<DatabaseOperationType, number>
  totalRowsAffected: number
  totalRowsReturned: number
}
```

### Resetting Statistics

```typescript
// Reset all stats to zero
dbTool.resetStats()

const stats = dbTool.getStats()
console.log(stats.totalOperations) // 0
```

---

## Advanced Usage

### Custom Result Processing

```typescript
const result = await dbTool.execute('select from users limit 100')

if (result.success) {
  // Process raw data
  const users = result.data

  // Apply custom transformations
  const activeUsers = users.filter(u => u.status === 'active')

  // Format differently
  const customFormat = dbTool.formatResults(activeUsers, ResultFormat.TABLE)
}
```

### Batch Operations

```typescript
const queries = [
  'select from users limit 10',
  'select from products where status=active',
  'count from orders',
]

const results = await Promise.all(
  queries.map(query => dbTool.execute(query))
)

results.forEach((result, index) => {
  console.log(`Query ${index + 1}:`, result.success ? 'Success' : 'Failed')
})
```

### Pre-validation

```typescript
// Parse and validate before execution
const parsed = dbTool.parseNaturalLanguage('delete from users where id=123')

const validation = dbTool.validate(parsed.operation)

if (validation.valid) {
  // Proceed with execution
  const result = await dbTool.execute('delete from users where id=123')
} else {
  console.error('Validation failed:', validation.errors)
}
```

### Combining with AI

```typescript
import { Anthropic } from '@anthropic-ai/sdk'

const anthropic = new Anthropic()
const dbTool = createZeroDBTool({ apiKey: 'key', projectId: 'project' })

// Get natural language query from user
const userMessage = "Show me all active users who signed up last month"

// Use Claude to generate structured query
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: `Convert this to a database query: ${userMessage}`
    }
  ],
})

// Execute the generated query
const result = await dbTool.execute(response.content[0].text)

// Format for user
console.log(result.formattedResult)
```

---

## Best Practices

### 1. Always Use Limits

```typescript
// Good
await dbTool.execute('select from users limit 100')

// Risky - could return millions of rows
await dbTool.execute('select from users')
```

### 2. Validate Dangerous Operations

```typescript
// Pre-validate destructive operations
const parsed = dbTool.parseNaturalLanguage(userQuery)

if (parsed.operation.intent === QueryIntent.DELETE) {
  // Show warning to user
  console.log('This will delete data. Are you sure?')

  const validation = dbTool.validate(parsed.operation)
  console.log('Safety check:', validation.safetyCheck)
}
```

### 3. Use Appropriate Result Formats

```typescript
// For AI consumption
const result = await dbTool.execute(query, ResultFormat.NATURAL_LANGUAGE)

// For logging/debugging
const result = await dbTool.execute(query, ResultFormat.JSON)

// For terminal output
const result = await dbTool.execute(query, ResultFormat.TABLE)

// For documentation
const result = await dbTool.execute(query, ResultFormat.MARKDOWN)
```

### 4. Cache Schema in Production

```typescript
const tool = new ZeroDBTool({
  apiKey: 'key',
  projectId: 'project',
  cacheSchema: true,
  schemaCacheTTL: 3600, // 1 hour
})
```

### 5. Monitor Statistics

```typescript
// Periodically check stats
setInterval(() => {
  const stats = dbTool.getStats()

  if (stats.failedOperations / stats.totalOperations > 0.1) {
    console.warn('High failure rate detected')
  }

  if (stats.averageExecutionTimeMs > 1000) {
    console.warn('Slow queries detected')
  }
}, 60000) // Every minute
```

### 6. Handle Rate Limits Gracefully

```typescript
async function executeWithRetry(query: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await dbTool.execute(query)
    } catch (error) {
      if (error.message.includes('Rate limit') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      throw error
    }
  }
}
```

### 7. Log Security Events

```typescript
const result = await dbTool.execute(userQuery)

if (result.metadata.safetyCheck?.level === SafetyLevel.DANGEROUS) {
  console.log('SECURITY: Dangerous operation attempted', {
    query: userQuery,
    user: currentUser,
    timestamp: new Date(),
  })
}
```

---

## API Reference

### ZeroDBTool Class

#### Constructor

```typescript
new ZeroDBTool(config: ZeroDBToolConfig)
```

#### Methods

**execute(input: string, format?: ResultFormat): Promise<ToolResult>**

Execute a natural language database query.

**parseNaturalLanguage(query: string): ParsedNaturalLanguage**

Parse natural language into structured operation.

**validate(operation: DatabaseOperation): ValidationResult**

Validate an operation before execution.

**getSchema(tableName?: string): Promise<DatabaseSchema | TableSchema>**

Get database or table schema.

**formatResults(data: any, format?: ResultFormat): string**

Format data for LLM consumption.

**getCapabilities(): ToolCapabilities**

Get tool capabilities and supported operations.

**getStats(): OperationStats**

Get operation statistics.

**resetStats(): void**

Reset statistics to zero.

### Factory Functions

**createZeroDBTool(config: ZeroDBToolConfig): ZeroDBTool**

Create a new ZeroDBTool instance.

---

## Examples

See the [examples directory](../../examples/zerodb-tool/) for complete examples:

- Basic usage
- AI agent integration
- Custom validation
- Batch processing
- Real-time analytics

---

## Troubleshooting

### Common Issues

**Issue: "Rate limit exceeded"**

Solution: Configure rate limits or implement retry logic.

**Issue: "DELETE without WHERE clause is not allowed"**

Solution: Add specific conditions to your DELETE query.

**Issue: "Table name not specified"**

Solution: Ensure your query includes a clear table reference.

**Issue: "Low confidence query"**

Solution: Make your query more specific with table names and conditions.

**Issue: "DROP TABLE is blocked"**

Solution: Set `allowDangerousOperations: true` in configuration.

---

## Support

For issues and questions:

- GitHub Issues: https://github.com/AINative-Studio/ai-kit/issues
- Documentation: https://docs.ainative.studio/ai-kit/tools/zerodb
- Discord: https://discord.gg/ainative-studio

---

*Last updated: 2025-01-19*
