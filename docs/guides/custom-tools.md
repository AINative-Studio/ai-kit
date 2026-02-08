# Creating Custom Tools for AI Kit Agents

This guide covers everything you need to know about creating powerful, production-ready tools for AI Kit agents. You'll learn best practices, common patterns, testing strategies, and advanced techniques.

## Table of Contents

1. [Introduction](#introduction)
2. [Tool Fundamentals](#tool-fundamentals)
3. [Building Your First Tool](#building-your-first-tool)
4. [Tool Design Patterns](#tool-design-patterns)
5. [Parameter Validation](#parameter-validation)
6. [Error Handling](#error-handling)
7. [Testing Tools](#testing-tools)
8. [Advanced Techniques](#advanced-techniques)
9. [Best Practices](#best-practices)
10. [Example Tools](#example-tools)

---

## Introduction

Tools are the primary way agents interact with the external world. A well-designed tool:

- Performs a specific, well-defined task
- Has clear, descriptive documentation
- Handles errors gracefully
- Validates inputs rigorously
- Returns structured, useful data
- Is easily testable

**What makes a good tool?**

1. **Single Responsibility**: Does one thing well
2. **Clear Interface**: Obvious what inputs are needed and what output to expect
3. **Robust**: Handles edge cases and errors gracefully
4. **Fast**: Minimizes latency where possible
5. **Observable**: Logs important events for debugging
6. **Testable**: Easy to test in isolation

---

## Tool Fundamentals

### Tool Anatomy

Every AI Kit tool consists of four parts:

```typescript
import { Tool } from '@ainative/ai-kit/core'

const myTool: Tool = {
  // 1. Unique identifier
  name: 'my_tool',

  // 2. Description for the LLM
  description: 'What this tool does and when to use it',

  // 3. Parameter schema (JSON Schema)
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'What this parameter is for',
      },
    },
    required: ['param1'],
  },

  // 4. Implementation
  execute: async (params) => {
    // Tool logic here
    return result
  },
}
```

### How Tools Work

1. **Agent receives input**: User asks a question
2. **Agent reasons**: Determines if a tool is needed
3. **Agent calls tool**: Provides parameters based on schema
4. **Tool executes**: Performs the action
5. **Tool returns**: Sends results back to agent
6. **Agent continues**: Uses results to formulate response

### Tool Schema (JSON Schema)

AI Kit uses JSON Schema for parameter definitions. This allows:
- Automatic validation
- Type safety
- Clear documentation for the LLM
- Better error messages

**Common JSON Schema types:**

```typescript
// String
{
  type: 'string',
  description: 'User email address',
  pattern: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
  minLength: 5,
  maxLength: 100,
}

// Number
{
  type: 'number',
  description: 'Temperature in Celsius',
  minimum: -273.15,
  maximum: 1000,
}

// Boolean
{
  type: 'boolean',
  description: 'Whether to include metadata',
  default: false,
}

// Enum
{
  type: 'string',
  enum: ['small', 'medium', 'large'],
  description: 'Size option',
}

// Array
{
  type: 'array',
  items: { type: 'string' },
  description: 'List of tags',
  minItems: 1,
  maxItems: 10,
}

// Object
{
  type: 'object',
  properties: {
    lat: { type: 'number' },
    lng: { type: 'number' },
  },
  required: ['lat', 'lng'],
  description: 'Geographic coordinates',
}
```

---

## Building Your First Tool

Let's build a weather tool step by step.

### Step 1: Define the Tool Interface

```typescript
// tools/weather.ts

import { Tool } from '@ainative/ai-kit/core'

interface WeatherParams {
  location: string
  unit?: 'celsius' | 'fahrenheit'
}

interface WeatherResult {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
  timestamp: number
}
```

### Step 2: Create the Tool Schema

```typescript
export const weatherTool: Tool = {
  name: 'get_weather',
  description: `Get current weather information for a specific location.
    Use this when the user asks about weather, temperature, or weather conditions.
    Examples: "What's the weather in Paris?", "Is it raining in London?"`,

  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name, optionally with country (e.g., "Paris, France" or "Tokyo")',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit',
        default: 'celsius',
      },
    },
    required: ['location'],
  },

  execute: async (params: WeatherParams): Promise<WeatherResult> => {
    // Implementation coming next
  },
}
```

### Step 3: Implement the Tool Logic

```typescript
export const weatherTool: Tool = {
  // ... schema from above

  execute: async ({ location, unit = 'celsius' }: WeatherParams): Promise<WeatherResult> => {
    try {
      // Call weather API
      const apiKey = process.env.WEATHER_API_KEY
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }

      const data = await response.json()

      // Convert temperature if needed
      const tempC = data.current.temp_c
      const temperature = unit === 'fahrenheit'
        ? (tempC * 9/5) + 32
        : tempC

      return {
        temperature: Math.round(temperature * 10) / 10,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        location: data.location.name,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error('Weather tool error:', error)
      throw new Error(`Failed to get weather for ${location}: ${error.message}`)
    }
  },
}
```

### Step 4: Use the Tool

```typescript
// Use with an agent
import { AgentExecutor } from '@ainative/ai-kit/core'
import { weatherTool } from './tools/weather'

const agent = new AgentExecutor({
  name: 'Weather Assistant',
  systemPrompt: 'You help users with weather information.',
  model: 'claude-sonnet-4',
  tools: [weatherTool],
})

const result = await agent.run('What is the weather in Tokyo?')
console.log(result.answer)
// "The current weather in Tokyo is partly cloudy with a temperature of 18°C..."
```

---

## Tool Design Patterns

### Pattern 1: API Wrapper Tool

Wraps an external API for agent use.

```typescript
export const githubSearchTool: Tool = {
  name: 'github_search',
  description: 'Search for GitHub repositories',

  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (e.g., "react router")',
      },
      sort: {
        type: 'string',
        enum: ['stars', 'forks', 'updated'],
        default: 'stars',
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
    },
    required: ['query'],
  },

  execute: async ({ query, sort = 'stars', limit = 10 }) => {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${limit}`,
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    const data = await response.json()

    return {
      total: data.total_count,
      repositories: data.items.map(repo => ({
        name: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        url: repo.html_url,
        language: repo.language,
      })),
    }
  },
}
```

### Pattern 2: Database Query Tool

Allows agents to query databases safely.

```typescript
import { z } from 'zod'
import { db } from '@/lib/db'

export const databaseQueryTool: Tool = {
  name: 'query_database',
  description: 'Query the application database for user information, orders, or products',

  parameters: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        enum: ['users', 'orders', 'products'],
        description: 'Table to query',
      },
      filters: {
        type: 'object',
        description: 'Filter conditions (e.g., {"status": "active"})',
      },
      limit: {
        type: 'number',
        default: 10,
        maximum: 100,
      },
    },
    required: ['table'],
  },

  execute: async ({ table, filters = {}, limit = 10 }) => {
    // Validate table name to prevent SQL injection
    const allowedTables = ['users', 'orders', 'products']
    if (!allowedTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`)
    }

    // Build safe query
    const query = db.select('*').from(table).limit(limit)

    // Apply filters safely
    for (const [key, value] of Object.entries(filters)) {
      query.where(key, '=', value)
    }

    const results = await query

    return {
      table,
      count: results.length,
      results,
    }
  },
}
```

### Pattern 3: Computation Tool

Performs calculations or data processing.

```typescript
export const calculatorTool: Tool = {
  name: 'calculate',
  description: 'Perform mathematical calculations. Supports basic arithmetic and common functions.',

  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression (e.g., "2 + 2", "sqrt(16)", "sin(pi/2)")',
      },
    },
    required: ['expression'],
  },

  execute: async ({ expression }) => {
    // Use a safe math parser (not eval!)
    const parser = new MathParser()

    try {
      const result = parser.evaluate(expression)

      return {
        expression,
        result,
        formatted: `${expression} = ${result}`,
      }
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`)
    }
  },
}
```

### Pattern 4: File Operation Tool

Handles file reading/writing.

```typescript
import fs from 'fs/promises'
import path from 'path'

export const fileOperationTool: Tool = {
  name: 'file_operations',
  description: 'Read, write, or list files in the workspace',

  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'list', 'delete'],
        description: 'Operation to perform',
      },
      path: {
        type: 'string',
        description: 'File or directory path',
      },
      content: {
        type: 'string',
        description: 'Content to write (for write operation)',
      },
    },
    required: ['operation', 'path'],
  },

  execute: async ({ operation, path: filePath, content }) => {
    // Validate path to prevent directory traversal
    const safePath = path.resolve(process.cwd(), filePath)
    if (!safePath.startsWith(process.cwd())) {
      throw new Error('Invalid path: access denied')
    }

    switch (operation) {
      case 'read':
        const data = await fs.readFile(safePath, 'utf-8')
        return { content: data, size: data.length }

      case 'write':
        if (!content) throw new Error('Content required for write operation')
        await fs.writeFile(safePath, content, 'utf-8')
        return { success: true, path: safePath }

      case 'list':
        const files = await fs.readdir(safePath)
        return { files, count: files.length }

      case 'delete':
        await fs.unlink(safePath)
        return { success: true, path: safePath }

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  },
}
```

### Pattern 5: Composite Tool

Combines multiple operations.

```typescript
export const emailTool: Tool = {
  name: 'send_email',
  description: 'Send an email with optional attachments',

  parameters: {
    type: 'object',
    properties: {
      to: {
        type: 'array',
        items: { type: 'string' },
        description: 'Recipient email addresses',
      },
      subject: {
        type: 'string',
        description: 'Email subject',
      },
      body: {
        type: 'string',
        description: 'Email body (supports HTML)',
      },
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            content: { type: 'string' },
          },
        },
        description: 'File attachments',
      },
    },
    required: ['to', 'subject', 'body'],
  },

  execute: async ({ to, subject, body, attachments = [] }) => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: to.join(', '),
      subject,
      html: body,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    })

    return {
      messageId: info.messageId,
      recipients: to,
      success: true,
    }
  },
}
```

---

## Parameter Validation

Robust parameter validation is critical for tool reliability.

### Using Zod for Validation

```typescript
import { z } from 'zod'

const weatherParamsSchema = z.object({
  location: z.string().min(2).max(100),
  unit: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
})

export const weatherTool: Tool = {
  name: 'get_weather',
  // ... rest of tool definition

  execute: async (params) => {
    // Validate and parse
    const validated = weatherParamsSchema.parse(params)

    // Now TypeScript knows the exact types
    const { location, unit } = validated

    // ... rest of implementation
  },
}
```

### Custom Validation

```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const emailTool: Tool = {
  name: 'send_email',
  // ... parameters

  execute: async ({ to, subject, body }) => {
    // Validate emails
    for (const email of to) {
      if (!validateEmail(email)) {
        throw new Error(`Invalid email address: ${email}`)
      }
    }

    // Validate subject length
    if (subject.length > 200) {
      throw new Error('Subject too long (max 200 characters)')
    }

    // Validate body not empty
    if (!body.trim()) {
      throw new Error('Email body cannot be empty')
    }

    // ... rest of implementation
  },
}
```

### Sanitization

Always sanitize user inputs:

```typescript
import DOMPurify from 'isomorphic-dompurify'

export const contentTool: Tool = {
  name: 'create_content',
  // ... parameters

  execute: async ({ html }) => {
    // Sanitize HTML to prevent XSS
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href'],
    })

    // ... rest of implementation
  },
}
```

---

## Error Handling

Proper error handling makes tools reliable and debuggable.

### Error Types

```typescript
// Define custom error types
class ToolError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message)
    this.name = 'ToolError'
  }
}

class APIError extends ToolError {
  constructor(message: string, public readonly statusCode: number) {
    super(message, 'API_ERROR', statusCode >= 500)
  }
}

class ValidationError extends ToolError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', false)
  }
}
```

### Comprehensive Error Handling

```typescript
export const apiTool: Tool = {
  name: 'api_call',
  // ... parameters

  execute: async ({ url, method, body }) => {
    try {
      // Validate URL
      let parsedUrl
      try {
        parsedUrl = new URL(url)
      } catch {
        throw new ValidationError(`Invalid URL: ${url}`)
      }

      // Make request with timeout
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      // Handle HTTP errors
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      return await response.json()

    } catch (error) {
      // Handle different error types
      if (error.name === 'AbortError') {
        throw new ToolError('Request timeout', 'TIMEOUT', true)
      }

      if (error instanceof ToolError) {
        throw error
      }

      // Wrap unknown errors
      throw new ToolError(
        `API call failed: ${error.message}`,
        'UNKNOWN_ERROR',
        false
      )
    }
  },
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts
      const isRetryable = error instanceof ToolError && error.retryable

      if (isLastAttempt || !isRetryable) {
        throw error
      }

      console.log(`Retry attempt ${attempt}/${maxAttempts}`)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw new Error('Unreachable')
}

export const weatherTool: Tool = {
  name: 'get_weather',
  // ... parameters

  execute: async (params) => {
    return withRetry(async () => {
      // API call here
    }, 3, 1000)
  },
}
```

---

## Testing Tools

### Unit Testing

```typescript
// __tests__/tools/weather.test.ts

import { weatherTool } from '@/tools/weather'

describe('weatherTool', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn()
  })

  it('returns weather data for valid location', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temp_c: 20,
          condition: { text: 'Sunny' },
          humidity: 60,
          wind_kph: 10,
        },
        location: { name: 'London' },
      }),
    })

    const result = await weatherTool.execute({
      location: 'London',
      unit: 'celsius',
    })

    expect(result.temperature).toBe(20)
    expect(result.condition).toBe('Sunny')
    expect(result.location).toBe('London')
  })

  it('converts to fahrenheit when requested', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { temp_c: 0, condition: { text: 'Cold' }, humidity: 80, wind_kph: 5 },
        location: { name: 'Oslo' },
      }),
    })

    const result = await weatherTool.execute({
      location: 'Oslo',
      unit: 'fahrenheit',
    })

    expect(result.temperature).toBe(32)
  })

  it('throws error for invalid location', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    })

    await expect(
      weatherTool.execute({ location: 'InvalidCity123' })
    ).rejects.toThrow('Weather API error')
  })
})
```

### Integration Testing

```typescript
// __tests__/tools/integration.test.ts

import { AgentExecutor } from '@ainative/ai-kit/core'
import { weatherTool } from '@/tools/weather'

describe('Weather Tool Integration', () => {
  it('works with agent', async () => {
    const agent = new AgentExecutor({
      name: 'Test Agent',
      systemPrompt: 'You help with weather.',
      model: 'claude-sonnet-4',
      tools: [weatherTool],
    })

    const result = await agent.run('What is the weather in Paris?')

    expect(result.answer).toContain('Paris')
    expect(result.steps).toHaveLength(3) // thought, tool_call, answer
    expect(result.steps[1].type).toBe('tool_call')
  })
})
```

---

## Advanced Techniques

### Streaming Tool Results

For long-running operations, stream progress:

```typescript
export const longRunningTool: Tool = {
  name: 'process_data',
  // ... parameters

  execute: async ({ data }, { onProgress }) => {
    const total = data.length
    const results = []

    for (let i = 0; i < total; i++) {
      // Process item
      const result = await processItem(data[i])
      results.push(result)

      // Report progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percentage: ((i + 1) / total) * 100,
        })
      }
    }

    return results
  },
}
```

### Tool Composition

Create tools that use other tools:

```typescript
export const compositeTool: Tool = {
  name: 'research_and_email',
  description: 'Research a topic and email the results',

  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string' },
      recipient: { type: 'string' },
    },
    required: ['topic', 'recipient'],
  },

  execute: async ({ topic, recipient }) => {
    // Use web search tool
    const searchResults = await webSearchTool.execute({ query: topic })

    // Use email tool
    const emailResult = await emailTool.execute({
      to: [recipient],
      subject: `Research on ${topic}`,
      body: formatResults(searchResults),
    })

    return {
      research: searchResults,
      email: emailResult,
    }
  },
}
```

### Caching Tool Results

```typescript
import { createHash } from 'crypto'

const cache = new Map()

function getCacheKey(toolName: string, params: any): string {
  return createHash('sha256')
    .update(`${toolName}:${JSON.stringify(params)}`)
    .digest('hex')
}

export function withCache(tool: Tool, ttl: number = 3600000): Tool {
  return {
    ...tool,
    execute: async (params) => {
      const key = getCacheKey(tool.name, params)
      const cached = cache.get(key)

      if (cached && Date.now() - cached.timestamp < ttl) {
        console.log(`Cache hit for ${tool.name}`)
        return cached.result
      }

      const result = await tool.execute(params)

      cache.set(key, {
        result,
        timestamp: Date.now(),
      })

      return result
    },
  }
}

// Usage
export const cachedWeatherTool = withCache(weatherTool, 600000) // 10 min cache
```

---

## Best Practices

### 1. Clear, Descriptive Names

```typescript
// Good
const getUserByIdTool: Tool = { name: 'get_user_by_id', ... }

// Bad
const tool1: Tool = { name: 'user', ... }
```

### 2. Comprehensive Descriptions

```typescript
// Good
description: `Search for GitHub repositories by keyword.
  Returns repository name, description, stars, and URL.
  Use when user wants to find open source projects or libraries.
  Examples: "Find React routing libraries", "Search for Python data science repos"`

// Bad
description: 'Search GitHub'
```

### 3. Type Safety

```typescript
// Define interfaces for params and results
interface SearchParams {
  query: string
  limit?: number
}

interface SearchResult {
  repositories: Repository[]
  total: number
}

const tool: Tool = {
  execute: async (params: SearchParams): Promise<SearchResult> => {
    // TypeScript will enforce types
  }
}
```

### 4. Logging

```typescript
export const apiTool: Tool = {
  name: 'api_call',

  execute: async (params) => {
    console.log(`[${Date.now()}] API call started:`, params.url)

    const startTime = Date.now()
    const result = await makeRequest(params)
    const duration = Date.now() - startTime

    console.log(`[${Date.now()}] API call completed in ${duration}ms`)

    return result
  },
}
```

### 5. Rate Limiting

```typescript
import Bottleneck from 'bottleneck'

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200,  // 5 requests/second
})

export const rateLimitedTool: Tool = {
  execute: async (params) => {
    return limiter.schedule(async () => {
      // Tool implementation
    })
  },
}
```

---

## Example Tools

### Web Scraper Tool

```typescript
import * as cheerio from 'cheerio'

export const webScraperTool: Tool = {
  name: 'scrape_webpage',
  description: 'Extract text content from a webpage',

  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to scrape',
      },
      selector: {
        type: 'string',
        description: 'CSS selector to extract (optional)',
      },
    },
    required: ['url'],
  },

  execute: async ({ url, selector }) => {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)

    if (selector) {
      return {
        content: $(selector).text().trim(),
        url,
      }
    }

    return {
      title: $('title').text(),
      content: $('body').text().trim().slice(0, 5000),
      url,
    }
  },
}
```

### SQL Query Tool

```typescript
import { z } from 'zod'
import { db } from '@/lib/db'

const sqlParamsSchema = z.object({
  query: z.string(),
  params: z.array(z.any()).optional(),
})

export const sqlQueryTool: Tool = {
  name: 'execute_sql',
  description: 'Execute a safe SQL query (SELECT only)',

  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL SELECT query',
      },
      params: {
        type: 'array',
        description: 'Query parameters',
      },
    },
    required: ['query'],
  },

  execute: async (params) => {
    const { query, params: queryParams = [] } = sqlParamsSchema.parse(params)

    // Only allow SELECT queries
    if (!query.trim().toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed')
    }

    const results = await db.raw(query, queryParams)

    return {
      rows: results,
      count: results.length,
    }
  },
}
```

---

**Next Steps:**

- [Production Deployment Guide](./production-deployment.md)
- [Getting Started Guide](./getting-started.md)
- [AI Kit API Reference](../api/core.md)

**Need help?** support@ainative.studio | [Discord](https://discord.com/invite/paipalooza)
