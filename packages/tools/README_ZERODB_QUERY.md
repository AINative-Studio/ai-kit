# ZeroDB Query Tool

A natural language interface for querying ZeroDB with TypeScript.

## Quick Start

```typescript
import { createZeroDBQueryTool } from '@ainative/ai-kit-tools';

const tool = createZeroDBQueryTool({
  apiKey: 'ZERODB_your_api_key',
  projectId: '550e8400-e29b-41d4-a716-446655440000',
});

const result = await tool.query('list tables');
console.log(result.data);
```

## Installation

```bash
npm install @ainative/ai-kit-tools
# or
pnpm add @ainative/ai-kit-tools
```

## Features

- 🗣️ Natural language query parsing
- 📊 Multiple output formats (JSON, Table, List, Summary)
- 🔒 Type-safe with full TypeScript support
- ✅ 93.96% test coverage
- 📝 Comprehensive documentation
- 🛡️ Error handling with detailed messages

## Supported Queries

### Tables
```typescript
await tool.query('list tables');
await tool.query('select from users');
await tool.query('select from users limit 50');
```

### Vectors
```typescript
await tool.query('list vectors');
await tool.query('search vectors top 10');
```

### Files & Events
```typescript
await tool.query('list files');
await tool.query('list events');
```

### Project Info
```typescript
await tool.query('project info');
await tool.query('database status');
```

## Result Formats

```typescript
import { ResultFormat } from '@ainative/ai-kit-tools';

// JSON (default)
await tool.query('list tables', ResultFormat.JSON);

// ASCII Table
await tool.query('list tables', ResultFormat.TABLE);

// Numbered List
await tool.query('list tables', ResultFormat.LIST);

// Summary
await tool.query('list tables', ResultFormat.SUMMARY);
```

## Documentation

- [Complete Documentation](./docs/ZERODB_QUERY_TOOL.md)
- [Implementation Report](./docs/AIKIT-15_IMPLEMENTATION_REPORT.md)
- [API Reference](./docs/ZERODB_QUERY_TOOL.md#api-reference)

## Testing

```bash
# Run tests
cd /Users/aideveloper/ai-kit/packages/tools
pnpm test zerodb-query.test.ts

# Run with coverage
pnpm vitest zerodb-query.test.ts --run --coverage
```

### Test Results

- ✅ 76 tests passing
- 📊 93.96% statement coverage
- 🌿 91.72% branch coverage
- 🔧 96.55% function coverage

## Configuration

```typescript
interface ZeroDBConfig {
  apiKey?: string;          // ZeroDB API key (required if no jwtToken)
  jwtToken?: string;        // JWT token (required if no apiKey)
  baseURL?: string;         // API base URL
  timeout?: number;         // Request timeout (min: 1000ms)
  projectId?: string;       // Project UUID (required for queries)
}
```

## Error Handling

```typescript
const result = await tool.query('some query');

if (!result.success) {
  console.error(`Error: ${result.error?.message}`);
  console.error(`Code: ${result.error?.code}`);
  console.error(`Details:`, result.error?.details);
}
```

## Examples

### CLI Tool

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

rl.question('ZeroDB> ', async (query) => {
  const result = await tool.query(query, ResultFormat.TABLE);
  console.log(result.data);
  console.log(`\nExecuted in ${result.metadata.executionTimeMs}ms`);
});
```

### Express API

```typescript
import express from 'express';
import { createZeroDBQueryTool } from '@ainative/ai-kit-tools';

const app = express();
app.use(express.json());

const tool = createZeroDBQueryTool({
  apiKey: process.env.ZERODB_API_KEY!,
  projectId: process.env.ZERODB_PROJECT_ID!,
});

app.post('/query', async (req, res) => {
  const result = await tool.query(req.body.query);
  res.json(result);
});

app.listen(3000);
```

## License

MIT

## Support

- GitHub: https://github.com/AINative-Studio/ai-kit
- Issues: https://github.com/AINative-Studio/ai-kit/issues
- Docs: https://ainative.studio/docs
