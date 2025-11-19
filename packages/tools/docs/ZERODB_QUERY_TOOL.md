# ZeroDB Query Tool Documentation

## Overview

The ZeroDB Query Tool is a powerful natural language interface for querying ZeroDB. It converts plain English queries into ZeroDB API calls and returns formatted results in various formats (JSON, tables, lists, or summaries).

## Features

- **Natural Language Processing**: Convert plain English to ZeroDB queries
- **Multiple Query Types**: Support for tables, vectors, files, events, and more
- **Flexible Output**: JSON, table, list, or summary formats
- **Comprehensive Error Handling**: Clear error messages with debugging information
- **Type Safety**: Full TypeScript support with Zod validation
- **High Test Coverage**: 80%+ test coverage with comprehensive test suite

## Installation

```bash
npm install @ainative/ai-kit-tools
# or
pnpm add @ainative/ai-kit-tools
# or
yarn add @ainative/ai-kit-tools
```

## Quick Start

```typescript
import { createZeroDBQueryTool, ResultFormat } from '@ainative/ai-kit-tools';

// Create a query tool instance
const queryTool = createZeroDBQueryTool({
  apiKey: 'ZERODB_your_api_key',
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  baseURL: 'https://api.ainative.studio', // optional
  timeout: 30000, // optional, default 30s
});

// Execute a natural language query
const result = await queryTool.query('list tables');

if (result.success) {
  console.log(result.data);
  console.log(`Query took ${result.metadata.executionTimeMs}ms`);
} else {
  console.error(result.error?.message);
}
```

## Configuration

### ZeroDBConfig

```typescript
interface ZeroDBConfig {
  apiKey?: string;          // ZeroDB API key (required if no jwtToken)
  jwtToken?: string;        // JWT authentication token (required if no apiKey)
  baseURL?: string;         // API base URL (default: https://api.ainative.studio)
  timeout?: number;         // Request timeout in ms (default: 30000, min: 1000)
  projectId?: string;       // ZeroDB project UUID (required for queries)
}
```

### Authentication

You can authenticate using either an API key or JWT token:

```typescript
// Using API key
const tool = createZeroDBQueryTool({
  apiKey: 'ZERODB_your_api_key',
  projectId: 'project-uuid',
});

// Using JWT token
const tool = createZeroDBQueryTool({
  jwtToken: 'your_jwt_token',
  projectId: 'project-uuid',
});
```

## Supported Query Types

### 1. Table Operations

#### List Tables
```typescript
// Natural language
await queryTool.query('list tables');
await queryTool.query('show tables');
await queryTool.query('what tables do I have');
await queryTool.query('tables');
```

#### Query Table
```typescript
// Basic query
await queryTool.query('select from users');
await queryTool.query('query users table');
await queryTool.query('find in products');

// With limit
await queryTool.query('select from users limit 50');
await queryTool.query('get first 20 from orders');

// With filter
await queryTool.query('select from users where status=active');
```

### 2. Vector Operations

#### Search Vectors
```typescript
// Basic search
await queryTool.query('search vectors');
await queryTool.query('find similar documents');
await queryTool.query('semantic search');

// With limit
await queryTool.query('search vectors top 5');
```

#### List Vectors
```typescript
// Basic list
await queryTool.query('list vectors');
await queryTool.query('show vectors');

// With pagination
await queryTool.query('list vectors limit 50 offset 100');
```

### 3. File Operations

```typescript
await queryTool.query('list files');
await queryTool.query('show files');
await queryTool.query('files');
```

### 4. Event Operations

```typescript
// All events
await queryTool.query('list events');
await queryTool.query('show events');

// Filter by topic
await queryTool.query('list events topic user_actions');
```

### 5. Project Information

```typescript
await queryTool.query('project info');
await queryTool.query('project details');
await queryTool.query('describe project');
```

### 6. Database Status

```typescript
await queryTool.query('database status');
await queryTool.query('db status');
await queryTool.query('storage usage');
```

## Result Formats

### JSON Format (Default)

```typescript
const result = await queryTool.query('list tables', ResultFormat.JSON);
// Returns formatted JSON string
```

Example output:
```json
[
  {
    "table_name": "users",
    "row_count": 150,
    "created_at": "2025-01-01T00:00:00Z"
  },
  {
    "table_name": "products",
    "row_count": 500,
    "created_at": "2025-01-02T00:00:00Z"
  }
]
```

### Table Format

```typescript
const result = await queryTool.query('list tables', ResultFormat.TABLE);
```

Example output:
```
table_name | row_count | created_at
-----------+-----------+---------------------
users      | 150       | 2025-01-01T00:00:00Z
products   | 500       | 2025-01-02T00:00:00Z
```

### List Format

```typescript
const result = await queryTool.query('list tables', ResultFormat.LIST);
```

Example output:
```
1. {"table_name":"users","row_count":150,"created_at":"2025-01-01T00:00:00Z"}
2. {"table_name":"products","row_count":500,"created_at":"2025-01-02T00:00:00Z"}
```

### Summary Format

```typescript
const result = await queryTool.query('list tables', ResultFormat.SUMMARY);
```

Example output:
```
Found 2 result(s)
```

## Query Result Structure

```typescript
interface QueryResult {
  success: boolean;
  data: any;
  metadata: {
    queryType: QueryType;       // Type of query executed
    executionTimeMs: number;    // Execution time in milliseconds
    rowCount?: number;          // Number of results (for arrays)
    format: ResultFormat;       // Output format used
  };
  error?: {
    message: string;            // Error message
    code?: string;              // Error code
    details?: any;              // Additional error details
  };
}
```

## Error Handling

The tool provides comprehensive error handling with clear error messages:

```typescript
const result = await queryTool.query('invalid query');

if (!result.success) {
  console.error(`Error: ${result.error?.message}`);
  console.error(`Code: ${result.error?.code}`);
  console.error(`Details:`, result.error?.details);
}
```

### Common Error Codes

- `LOW_CONFIDENCE`: Query parsing confidence is too low
- `QUERY_ERROR`: Error executing the query
- `VALIDATION_ERROR`: Invalid configuration or parameters
- `AUTH_ERROR`: Authentication failure
- `NETWORK_ERROR`: Network request failure

## Advanced Usage

### Manual Query Parsing

```typescript
import { QueryParser } from '@ainative/ai-kit-tools';

const parsed = QueryParser.parse('select from users limit 10');
console.log(parsed.type);        // QueryType.TABLE_QUERY
console.log(parsed.confidence);  // 0.85
console.log(parsed.parameters);  // { tableName: 'users', limit: 10 }
```

### Custom Result Formatting

```typescript
import { ResultFormatter, ResultFormat } from '@ainative/ai-kit-tools';

const data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

const json = ResultFormatter.format(data, ResultFormat.JSON);
const table = ResultFormatter.format(data, ResultFormat.TABLE);
const list = ResultFormatter.format(data, ResultFormat.LIST);
const summary = ResultFormatter.format(data, ResultFormat.SUMMARY);
```

### Configuration Validation

```typescript
const tool = createZeroDBQueryTool(config);

const validation = tool.validateConfig();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

### Using Zod Schema for Validation

```typescript
import { ZeroDBConfigSchema } from '@ainative/ai-kit-tools';

const config = {
  apiKey: 'test-key',
  projectId: '550e8400-e29b-41d4-a716-446655440000',
};

const result = ZeroDBConfigSchema.safeParse(config);
if (!result.success) {
  console.error('Validation failed:', result.error);
}
```

## Best Practices

### 1. Configuration Management

```typescript
// Store configuration in environment variables
const config = {
  apiKey: process.env.ZERODB_API_KEY,
  projectId: process.env.ZERODB_PROJECT_ID,
  baseURL: process.env.ZERODB_BASE_URL || 'https://api.ainative.studio',
};

const tool = createZeroDBQueryTool(config);
```

### 2. Error Handling

```typescript
async function safeQuery(query: string) {
  try {
    const result = await tool.query(query);

    if (!result.success) {
      // Handle query failure
      console.error('Query failed:', result.error?.message);
      return null;
    }

    return result.data;
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return null;
  }
}
```

### 3. Performance Monitoring

```typescript
const result = await tool.query('list tables');

console.log(`Query: ${result.metadata.queryType}`);
console.log(`Execution time: ${result.metadata.executionTimeMs}ms`);
console.log(`Results: ${result.metadata.rowCount || 'N/A'}`);
```

### 4. Reusable Tool Instance

```typescript
// Create once, use multiple times
class ZeroDBService {
  private tool: ZeroDBQueryTool;

  constructor(config: ZeroDBConfig) {
    this.tool = createZeroDBQueryTool(config);
  }

  async getTables() {
    return this.tool.query('list tables', ResultFormat.TABLE);
  }

  async getFiles() {
    return this.tool.query('list files', ResultFormat.JSON);
  }

  async searchVectors(query: string) {
    return this.tool.query(`search vectors ${query}`);
  }
}
```

## API Reference

### ZeroDBQueryTool

#### Constructor
```typescript
new ZeroDBQueryTool(config: ZeroDBConfig)
```

#### Methods

##### query()
```typescript
async query(
  naturalLanguage: string,
  format?: ResultFormat
): Promise<QueryResult>
```

Execute a natural language query.

##### validateConfig()
```typescript
validateConfig(): { valid: boolean; errors: string[] }
```

Validate the tool configuration.

#### Static Methods

##### getSupportedQueryTypes()
```typescript
static getSupportedQueryTypes(): string[]
```

Get list of supported query types.

##### getSupportedFormats()
```typescript
static getSupportedFormats(): string[]
```

Get list of supported result formats.

### QueryParser

#### Static Methods

##### parse()
```typescript
static parse(naturalLanguage: string): ParsedQuery
```

Parse natural language query into structured format.

### ResultFormatter

#### Static Methods

##### format()
```typescript
static format(data: any, format?: ResultFormat): string
```

Format data according to specified format.

### Factory Function

##### createZeroDBQueryTool()
```typescript
function createZeroDBQueryTool(config: ZeroDBConfig): ZeroDBQueryTool
```

Create a new ZeroDB query tool instance with validation.

## Examples

### Complete Example: Building a CLI Tool

```typescript
import { createZeroDBQueryTool, ResultFormat } from '@ainative/ai-kit-tools';
import * as readline from 'readline';

const tool = createZeroDBQueryTool({
  apiKey: process.env.ZERODB_API_KEY!,
  projectId: process.env.ZERODB_PROJECT_ID!,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question('ZeroDB> ', async (query) => {
    if (query.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    const result = await tool.query(query, ResultFormat.TABLE);

    if (result.success) {
      console.log(result.data);
      console.log(`\nExecuted in ${result.metadata.executionTimeMs}ms`);
    } else {
      console.error(`Error: ${result.error?.message}`);
    }

    console.log();
    prompt();
  });
}

console.log('ZeroDB Query Tool');
console.log('Type "exit" to quit\n');
prompt();
```

### Example: Integration with Express API

```typescript
import express from 'express';
import { createZeroDBQueryTool, ResultFormat } from '@ainative/ai-kit-tools';

const app = express();
app.use(express.json());

const tool = createZeroDBQueryTool({
  apiKey: process.env.ZERODB_API_KEY!,
  projectId: process.env.ZERODB_PROJECT_ID!,
});

app.post('/query', async (req, res) => {
  const { query, format = 'json' } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const formatMap: Record<string, ResultFormat> = {
    json: ResultFormat.JSON,
    table: ResultFormat.TABLE,
    list: ResultFormat.LIST,
    summary: ResultFormat.SUMMARY,
  };

  const result = await tool.query(query, formatMap[format] || ResultFormat.JSON);

  if (result.success) {
    res.json({
      data: result.data,
      metadata: result.metadata,
    });
  } else {
    res.status(500).json({
      error: result.error?.message,
      code: result.error?.code,
    });
  }
});

app.listen(3000, () => {
  console.log('ZeroDB Query API listening on port 3000');
});
```

## Testing

The tool includes comprehensive tests with 80%+ coverage:

```bash
# Run tests
cd /Users/aideveloper/ai-kit/packages/tools
pnpm test

# Run with coverage
pnpm test:coverage
```

## Troubleshooting

### Issue: "Unable to parse query with sufficient confidence"

**Solution**: Use more specific query patterns:
```typescript
// Instead of:
await tool.query('get data');

// Use:
await tool.query('select from users');
await tool.query('list tables');
```

### Issue: "Project ID is required for queries"

**Solution**: Ensure projectId is provided in configuration:
```typescript
const tool = createZeroDBQueryTool({
  apiKey: 'your-key',
  projectId: 'your-project-uuid', // Required!
});
```

### Issue: "timeout must be at least 1000ms"

**Solution**: Set timeout to at least 1000ms:
```typescript
const tool = createZeroDBQueryTool({
  apiKey: 'your-key',
  projectId: 'your-project-uuid',
  timeout: 30000, // At least 1000
});
```

## License

MIT

## Support

For issues and questions:
- GitHub: https://github.com/AINative-Studio/ai-kit
- Documentation: https://ainative.studio/docs
- Email: support@ainative.studio
