# @ainative/ai-kit-tools API Reference

Built-in tools for AI agents

## Installation

```bash
npm install @ainative/ai-kit-tools
```

## Overview

Pre-built tools for agent capabilities:

- **Calculator**: Mathematical computations
- **WebSearch**: Web search integration
- **CodeInterpreter**: Execute code safely
- **ZeroDBTool**: Database CRUD operations
- **ZeroDBQuery**: Advanced database queries

## Quick Start

```typescript
import { Calculator, WebSearch } from '@ainative/ai-kit-tools';
import { Agent } from '@ainative/ai-kit-core/agents';

const agent = new Agent({
  name: 'Assistant',
  description: 'Helpful assistant',
  tools: [Calculator, WebSearch],
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  }
});
```

---

## Calculator

Perform mathematical calculations.

### Tool Definition

```typescript
import { Calculator } from '@ainative/ai-kit-tools';

// Tool schema
{
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'sin', 'cos', 'tan']),
    a: z.number(),
    b: z.number().optional()
  })
}
```

### Usage

```typescript
const result = await Calculator.execute({
  operation: 'multiply',
  a: 15,
  b: 20
});
console.log(result); // 300
```

### Supported Operations

- `add`: Addition (a + b)
- `subtract`: Subtraction (a - b)
- `multiply`: Multiplication (a * b)
- `divide`: Division (a / b)
- `power`: Exponentiation (a ^ b)
- `sqrt`: Square root (√a)
- `sin`: Sine (sin(a))
- `cos`: Cosine (cos(a))
- `tan`: Tangent (tan(a))

---

## WebSearch

Search the web using integrated search APIs.

### Tool Definition

```typescript
import { WebSearch } from '@ainative/ai-kit-tools';

// Tool schema
{
  name: 'web_search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string(),
    numResults: z.number().min(1).max(10).default(5)
  })
}
```

### Configuration

Set up API keys:

```bash
SERPER_API_KEY=your_key_here
```

Or configure programmatically:

```typescript
import { configureWebSearch } from '@ainative/ai-kit-tools';

configureWebSearch({
  provider: 'serper',  // or 'bing', 'google'
  apiKey: process.env.SERPER_API_KEY
});
```

### Usage

```typescript
const results = await WebSearch.execute({
  query: 'latest AI developments',
  numResults: 5
});

console.log(results);
// [
//   {
//     title: 'Latest AI News',
//     url: 'https://...',
//     snippet: '...',
//     date: '2024-01-15'
//   },
//   ...
// ]
```

---

## CodeInterpreter

Execute code safely in a sandboxed environment.

### Tool Definition

```typescript
import { CodeInterpreter } from '@ainative/ai-kit-tools';

// Tool schema
{
  name: 'code_interpreter',
  description: 'Execute Python code safely',
  parameters: z.object({
    code: z.string(),
    language: z.enum(['python', 'javascript']).default('python'),
    timeout: z.number().default(5000)
  })
}
```

### Usage

```typescript
const result = await CodeInterpreter.execute({
  code: `
import math
print(math.factorial(10))
  `,
  language: 'python',
  timeout: 5000
});

console.log(result.output);    // '3628800'
console.log(result.success);   // true
```

### Security

- Sandboxed execution environment
- Resource limits (CPU, memory, time)
- No network access
- No file system access

---

## ZeroDBTool

Perform CRUD operations on ZeroDB.

### Tool Definition

```typescript
import { ZeroDBTool } from '@ainative/ai-kit-tools';

// Tool schema
{
  name: 'zerodb_crud',
  description: 'Perform database CRUD operations',
  parameters: z.object({
    operation: z.enum(['create', 'read', 'update', 'delete']),
    table: z.string(),
    data: z.record(z.any()).optional(),
    filter: z.record(z.any()).optional()
  })
}
```

### Configuration

```typescript
import { configureZeroDBTool } from '@ainative/ai-kit-tools';

configureZeroDBTool({
  projectId: process.env.ZERODB_PROJECT_ID,
  apiKey: process.env.ZERODB_API_KEY
});
```

### Usage

```typescript
// Create
await ZeroDBTool.execute({
  operation: 'create',
  table: 'users',
  data: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// Read
const users = await ZeroDBTool.execute({
  operation: 'read',
  table: 'users',
  filter: { active: true }
});

// Update
await ZeroDBTool.execute({
  operation: 'update',
  table: 'users',
  filter: { email: 'john@example.com' },
  data: { verified: true }
});

// Delete
await ZeroDBTool.execute({
  operation: 'delete',
  table: 'users',
  filter: { id: '123' }
});
```

---

## ZeroDBQuery

Advanced database queries with semantic search.

### Tool Definition

```typescript
import { ZeroDBQuery } from '@ainative/ai-kit-tools';

// Tool schema
{
  name: 'zerodb_query',
  description: 'Advanced database queries with semantic search',
  parameters: z.object({
    query: z.string(),
    table: z.string(),
    limit: z.number().default(10),
    semanticSearch: z.boolean().default(false)
  })
}
```

### Usage

```typescript
// Semantic search
const results = await ZeroDBQuery.execute({
  query: 'users interested in machine learning',
  table: 'users',
  semanticSearch: true,
  limit: 5
});

// SQL-like query
const results = await ZeroDBQuery.execute({
  query: 'SELECT * FROM users WHERE age > 25',
  table: 'users',
  semanticSearch: false
});
```

---

## Creating Custom Tools

Create your own tools:

```typescript
import { z } from 'zod';
import type { ToolDefinition } from '@ainative/ai-kit-core/agents';

export const CustomTool: ToolDefinition = {
  name: 'custom_tool',
  description: 'Description of what this tool does',
  parameters: z.object({
    param1: z.string(),
    param2: z.number().optional()
  }),
  async execute(params) {
    const { param1, param2 } = params;

    // Implement tool logic
    const result = await doSomething(param1, param2);

    return result;
  }
};
```

### Best Practices

1. **Clear Descriptions**: Help the LLM understand when to use the tool
2. **Type Safety**: Use Zod schemas for validation
3. **Error Handling**: Return meaningful errors
4. **Idempotency**: Make tools safe to retry
5. **Documentation**: Include examples

### Example: Weather Tool

```typescript
import { z } from 'zod';
import type { ToolDefinition } from '@ainative/ai-kit-core/agents';
import axios from 'axios';

export const WeatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather for a location. Use this when users ask about weather conditions.',
  parameters: z.object({
    location: z.string().describe('City name or zip code'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }),
  async execute(params) {
    try {
      const response = await axios.get('https://api.weather.com/v1/current', {
        params: {
          location: params.location,
          units: params.units,
          apiKey: process.env.WEATHER_API_KEY
        }
      });

      return {
        temperature: response.data.temperature,
        conditions: response.data.conditions,
        humidity: response.data.humidity,
        windSpeed: response.data.windSpeed
      };
    } catch (error) {
      throw new Error(`Failed to fetch weather: ${error.message}`);
    }
  }
};
```

---

## Tool Configuration

### Global Configuration

```typescript
import { configureTools } from '@ainative/ai-kit-tools';

configureTools({
  webSearch: {
    provider: 'serper',
    apiKey: process.env.SERPER_API_KEY
  },
  zerodb: {
    projectId: process.env.ZERODB_PROJECT_ID,
    apiKey: process.env.ZERODB_API_KEY
  },
  codeInterpreter: {
    timeout: 10000,
    maxMemory: '512mb'
  }
});
```

### Per-Tool Configuration

```typescript
import { WebSearch } from '@ainative/ai-kit-tools';

const CustomWebSearch = {
  ...WebSearch,
  config: {
    provider: 'bing',
    apiKey: process.env.BING_API_KEY,
    maxResults: 10
  }
};
```

---

## Complete Example

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';
import {
  Calculator,
  WebSearch,
  CodeInterpreter,
  ZeroDBTool,
  configureTools
} from '@ainative/ai-kit-tools';

// Configure tools
configureTools({
  webSearch: { provider: 'serper', apiKey: process.env.SERPER_API_KEY },
  zerodb: { projectId: process.env.ZERODB_PROJECT_ID, apiKey: process.env.ZERODB_API_KEY }
});

// Create agent with multiple tools
const agent = new Agent({
  name: 'DataAnalyst',
  description: 'Analyzes data using web search, calculations, and database queries',
  tools: [Calculator, WebSearch, CodeInterpreter, ZeroDBTool],
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  }
});

// Execute complex task
const executor = new AgentExecutor(agent);
const result = await executor.execute(`
  Find the current GDP of the top 5 economies,
  calculate the average,
  and store the results in our database
`);

console.log(result.response);
console.log('Tools used:', result.trace.stats.totalToolCalls);
```

---

## See Also

- [Agent API](../core/agents.md)
- [ZeroDB Client](../core/zerodb.md)
- [Creating Custom Tools Guide](../../guides/custom-tools.md)
