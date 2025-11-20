# AI Kit TypeScript Type Safety Guide

## Table of Contents

1. [Introduction](#introduction)
2. [TypeScript Configuration](#typescript-configuration)
3. [Type Utilities](#type-utilities)
4. [Branded Types](#branded-types)
5. [Result and Option Types](#result-and-option-types)
6. [Streaming Types](#streaming-types)
7. [Agent Types](#agent-types)
8. [Tool Types](#tool-types)
9. [Model Types](#model-types)
10. [Error Types](#error-types)
11. [Configuration Types](#configuration-types)
12. [Type Guards and Assertions](#type-guards-and-assertions)
13. [Best Practices](#best-practices)
14. [Common Patterns](#common-patterns)
15. [Type Testing](#type-testing)
16. [Migration Guide](#migration-guide)

## Introduction

AI Kit is built with complete TypeScript type safety in mind. This guide will help you understand and leverage the comprehensive type system to build robust, type-safe AI applications.

### Goals

- **Zero Runtime Errors**: Catch errors at compile time, not runtime
- **Excellent IntelliSense**: Full autocomplete and inline documentation
- **Self-Documenting Code**: Types serve as living documentation
- **Refactoring Confidence**: Change code safely with compiler guarantees

### Key Features

- Strict mode enabled across all packages
- Comprehensive type exports for all functionality
- Branded types for ID safety
- Discriminated unions for exhaustive checking
- Generic utilities for common patterns
- 100% type coverage (no `any` types)

## TypeScript Configuration

### Strict Mode Settings

All AI Kit packages use the strictest TypeScript configuration:

```json
{
  "compilerOptions": {
    // Strict type checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,

    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Configuring Your Project

To use AI Kit with maximum type safety, add these settings to your `tsconfig.json`:

```json
{
  "extends": "@ainative/ai-kit-core/tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Type Utilities

AI Kit provides a comprehensive set of type utilities in `@ainative/ai-kit-core/types/utils`.

### Deep Utility Types

#### DeepPartial

Makes all properties recursively optional:

```typescript
import type { DeepPartial } from '@ainative/ai-kit-core/types';

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
}

// All properties are now optional at all levels
const partialConfig: DeepPartial<Config> = {
  database: {
    credentials: {
      username: 'admin'
      // password is optional
    }
  }
};
```

#### DeepReadonly

Makes all properties recursively readonly:

```typescript
import type { DeepReadonly } from '@ainative/ai-kit-core/types';

interface State {
  user: {
    name: string;
    settings: {
      theme: string;
    };
  };
}

const immutableState: DeepReadonly<State> = {
  user: {
    name: 'Alice',
    settings: { theme: 'dark' }
  }
};

// Error: Cannot assign to read only property
// immutableState.user.settings.theme = 'light';
```

### RequireAtLeastOne

Requires at least one property from a set:

```typescript
import type { RequireAtLeastOne } from '@ainative/ai-kit-core/types';

interface SearchOptions {
  query?: string;
  tags?: string[];
  author?: string;
}

// Must have at least one of query or tags
type ValidSearch = RequireAtLeastOne<SearchOptions, 'query' | 'tags'>;

const search1: ValidSearch = { query: 'typescript' }; // Valid
const search2: ValidSearch = { tags: ['ai', 'ml'] }; // Valid
// const invalid: ValidSearch = { author: 'john' }; // Error!
```

### RequireExactlyOne

Requires exactly one property from a set:

```typescript
import type { RequireExactlyOne } from '@ainative/ai-kit-core/types';

interface AuthMethod {
  apiKey?: string;
  token?: string;
  oauth?: OAuthConfig;
}

// Must have exactly one authentication method
type Auth = RequireExactlyOne<AuthMethod, 'apiKey' | 'token' | 'oauth'>;

const auth1: Auth = { apiKey: 'key' }; // Valid
// const auth2: Auth = { apiKey: 'key', token: 'token' }; // Error!
```

### JSON Types

Type-safe JSON handling:

```typescript
import type { JsonValue, JsonObject, JsonArray } from '@ainative/ai-kit-core/types';

// Ensures values are JSON-serializable
function saveToStorage(key: string, value: JsonValue): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const config: JsonObject = {
  name: 'My App',
  version: 1,
  features: ['auth', 'logging'],
  settings: {
    theme: 'dark'
  }
};

saveToStorage('config', config); // Valid

// const invalid = { fn: () => {} }; // Error: Function is not JsonValue
```

## Branded Types

Branded types prevent accidental mixing of similar primitive types.

### Built-in Branded Types

```typescript
import type {
  UserId,
  SessionId,
  MessageId,
  AgentId,
  ModelId,
  ToolId
} from '@ainative/ai-kit-core/types';

// Type-safe IDs
const userId: UserId = 'user-123' as UserId;
const sessionId: SessionId = 'session-456' as SessionId;

// Error: Type 'UserId' is not assignable to type 'SessionId'
// const wrongAssignment: SessionId = userId;

function getUser(id: UserId): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// Error: Argument of type 'SessionId' is not assignable to parameter of type 'UserId'
// getUser(sessionId);
```

### Creating Custom Branded Types

```typescript
import type { Brand } from '@ainative/ai-kit-core/types';

// Create your own branded types
type OrderId = Brand<string, 'OrderId'>;
type ProductId = Brand<string, 'ProductId'>;

function getOrder(id: OrderId): Promise<Order> {
  // Implementation
}

const orderId = 'order-123' as OrderId;
const productId = 'product-456' as ProductId;

getOrder(orderId); // Valid
// getOrder(productId); // Error!
```

### Helper Function

```typescript
import { createBrandedId } from '@ainative/ai-kit-core/types';

const userId = createBrandedId<'UserId'>('user-123');
const agentId = createBrandedId<'AgentId'>('agent-456');
```

## Result and Option Types

### Result Type

Type-safe error handling without exceptions:

```typescript
import type { Result, Success, Failure } from '@ainative/ai-kit-core/types';
import { success, failure, isSuccess } from '@ainative/ai-kit-core/types';

async function fetchData(url: string): Promise<Result<Data, FetchError>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return success(data);
  } catch (error) {
    return failure(new FetchError(error.message));
  }
}

// Using the result
const result = await fetchData('/api/data');

if (isSuccess(result)) {
  console.log('Data:', result.data); // Type: Data
} else {
  console.error('Error:', result.error); // Type: FetchError
}
```

### Option Type

Type-safe handling of nullable values:

```typescript
import type { Option, Some, None } from '@ainative/ai-kit-core/types';
import { some, none, isSome, fromNullable } from '@ainative/ai-kit-core/types';

function findUser(id: string): Option<User> {
  const user = database.find(id);
  return fromNullable(user);
}

const userOption = findUser('123');

if (isSome(userOption)) {
  console.log('User:', userOption.value); // Type: User
} else {
  console.log('User not found');
}

// Chaining operations
const userName = userOption
  .map(user => user.name)
  .getOrElse('Anonymous');
```

## Streaming Types

### Message Types

```typescript
import type { Message, MessageRole, MessageContent } from '@ainative/ai-kit-core/types';

const message: Message = {
  id: 'msg-1' as MessageId,
  role: 'user',
  content: 'Hello, AI!',
  timestamp: Date.now() as number,
  metadata: {
    sentiment: 'positive',
    language: 'en'
  }
};

// Multimodal messages
const imageMessage: Message = {
  id: 'msg-2' as MessageId,
  role: 'user',
  content: [
    { type: 'text', data: 'What is in this image?' },
    {
      type: 'image',
      data: 'base64-encoded-image',
      mimeType: 'image/png'
    }
  ],
  timestamp: Date.now() as number
};
```

### Stream Configuration

```typescript
import type { StreamConfig } from '@ainative/ai-kit-core/types';

const config: StreamConfig = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4' as ModelId,
  temperature: 0.7,
  maxTokens: 2000,
  retry: {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000
  },
  cache: {
    enabled: true,
    ttl: 3600,
    storage: 'redis'
  }
};
```

### Stream Events

```typescript
import type { StreamEvent, TokenEvent, StreamDoneEvent } from '@ainative/ai-kit-core/types';

function handleStreamEvent(event: StreamEvent): void {
  switch (event.type) {
    case 'start':
      console.log('Stream started', event.messageId);
      break;

    case 'token':
      process.stdout.write(event.token);
      break;

    case 'done':
      console.log('\\nStream complete', event.usage);
      break;

    case 'error':
      console.error('Stream error', event.error);
      break;

    default:
      // TypeScript ensures exhaustive checking
      const _exhaustive: never = event;
  }
}
```

## Agent Types

### Agent Configuration

```typescript
import type { AgentConfig, AgentCapability } from '@ainative/ai-kit-core/types';

const agentConfig: AgentConfig = {
  id: 'agent-1' as AgentId,
  name: 'Research Assistant',
  role: 'researcher',
  description: 'Helps with research tasks',
  systemPrompt: 'You are a helpful research assistant...',
  capabilities: [
    {
      name: 'web-search',
      description: 'Search the web for information',
      enabled: true,
      config: {
        maxResults: 10
      }
    },
    {
      name: 'summarization',
      description: 'Summarize long documents',
      enabled: true
    }
  ],
  tools: ['search' as ToolId, 'calculator' as ToolId],
  model: 'gpt-4' as ModelId,
  temperature: 0.3,
  maxIterations: 10
};
```

### Task Management

```typescript
import type { Task, TaskResult, TaskPriority } from '@ainative/ai-kit-core/types';

const task: Task = {
  id: 'task-1',
  title: 'Analyze data',
  description: 'Analyze the provided dataset',
  priority: 'high',
  status: 'pending',
  dependencies: ['task-0'], // Must complete task-0 first
  estimatedDuration: 300000, // 5 minutes
  metadata: {
    datasetId: 'dataset-123'
  }
};

async function executeTask(task: Task): Promise<TaskResult> {
  try {
    const output = await processTask(task);
    return {
      success: true,
      output,
      metrics: {
        duration: 250000,
        iterations: 3,
        toolCalls: 5,
        tokensUsed: 1500,
        cost: 0.05
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error
    };
  }
}
```

### Multi-Agent Communication

```typescript
import type { AgentMessage, AgentMessageType } from '@ainative/ai-kit-core/types';

const message: AgentMessage = {
  id: 'msg-1' as MessageId,
  from: 'agent-1' as AgentId,
  to: 'agent-2' as AgentId,
  type: 'request',
  content: {
    action: 'analyze',
    data: { /* ... */ }
  },
  timestamp: Date.now() as number,
  priority: 'high'
};
```

## Tool Types

### Tool Configuration

```typescript
import type { ToolConfig, ToolParameter, ToolReturnSchema } from '@ainative/ai-kit-core/types';

const calculatorTool: ToolConfig = {
  id: 'calculator' as ToolId,
  name: 'Calculator',
  description: 'Perform mathematical calculations',
  category: 'computation',
  version: '1.0.0',
  status: 'available',
  parameters: [
    {
      name: 'operation',
      description: 'The operation to perform',
      schema: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide']
      },
      required: true
    },
    {
      name: 'a',
      description: 'First operand',
      schema: { type: 'number' },
      required: true
    },
    {
      name: 'b',
      description: 'Second operand',
      schema: { type: 'number' },
      required: true
    }
  ],
  returns: {
    type: 'number',
    description: 'The result of the calculation'
  },
  examples: [
    {
      description: 'Add two numbers',
      input: { operation: 'add', a: 5, b: 3 },
      output: 8
    }
  ],
  timeout: 5000,
  retryable: true
};
```

### Tool Execution

```typescript
import type { ToolCall, ToolCallResult, ToolExecutionOptions } from '@ainative/ai-kit-core/types';

const toolCall: ToolCall = {
  id: 'call-1',
  toolId: 'calculator' as ToolId,
  toolName: 'Calculator',
  input: {
    operation: 'add',
    a: 10,
    b: 20
  },
  timestamp: Date.now()
};

async function executeTool(
  call: ToolCall,
  options?: ToolExecutionOptions
): Promise<ToolCallResult> {
  const startTime = Date.now();

  try {
    const tool = registry.get(call.toolId);
    const output = await tool.execute(call.input, options);

    return {
      callId: call.id,
      success: true,
      output,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      callId: call.id,
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error.message,
        recoverable: true
      },
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  }
}
```

## Model Types

### Model Configuration

```typescript
import type { ModelConfig, ModelProvider, ModelCapability } from '@ainative/ai-kit-core/types';

const gpt4: ModelConfig = {
  id: 'gpt-4' as ModelId,
  name: 'GPT-4',
  provider: 'openai',
  category: 'chat',
  version: '0613',
  capabilities: ['chat', 'streaming', 'function-calling', 'vision'],
  contextWindow: 8192,
  maxOutputTokens: 4096,
  inputCostPer1kTokens: 0.03,
  outputCostPer1kTokens: 0.06,
  supportedLanguages: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  defaultParameters: {
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  }
};
```

### Model Selection

```typescript
import type { ModelSelector, ModelSelectionCriteria } from '@ainative/ai-kit-core/types';

const criteria: ModelSelectionCriteria = {
  provider: 'openai',
  category: 'chat',
  capabilities: ['streaming', 'function-calling'],
  minContextWindow: 8000,
  maxCost: 0.05 // per 1k tokens
};

const selectedModel = selector.select(criteria);
const rankedModels = selector.rank(criteria);
```

## Error Types

### Type-Safe Error Handling

```typescript
import type {
  AIKitError,
  ValidationError,
  RateLimitError,
  ModelError
} from '@ainative/ai-kit-core/types';

function handleError(error: AIKitError): void {
  console.error(`[${error.severity}] ${error.category}: ${error.message}`);

  switch (error.category) {
    case 'validation':
      const validationError = error as ValidationError;
      console.error('Field:', validationError.field);
      console.error('Expected:', validationError.expected);
      break;

    case 'rate-limit':
      const rateLimitError = error as RateLimitError;
      console.error('Retry after:', rateLimitError.retryAfter, 'ms');
      setTimeout(() => retry(), rateLimitError.retryAfter);
      break;

    case 'model':
      const modelError = error as ModelError;
      console.error('Model ID:', modelError.modelId);
      tryFallbackModel();
      break;
  }

  if (error.recoverable) {
    console.log('Error is recoverable, will retry');
  }
}
```

## Type Guards and Assertions

### Built-in Type Guards

```typescript
import {
  isDefined,
  isString,
  isNumber,
  isObject,
  isArray,
  isPromise,
  isError,
  hasProperty,
  isNonEmptyArray,
  notNullish
} from '@ainative/ai-kit-core/types';

function processValue(value: unknown): void {
  if (isString(value)) {
    console.log(value.toUpperCase()); // Type: string
  }

  if (isNumber(value)) {
    console.log(value.toFixed(2)); // Type: number
  }

  if (isObject(value) && hasProperty(value, 'name')) {
    console.log(value.name); // Type: unknown, but property exists
  }
}

// Filter nullish values
const values: Array<string | null | undefined> = ['a', null, 'b', undefined, 'c'];
const definedValues: string[] = values.filter(notNullish);
// Type: string[]
```

### Custom Type Guards

```typescript
function isStreamDoneEvent(event: StreamEvent): event is StreamDoneEvent {
  return event.type === 'done';
}

function handleEvent(event: StreamEvent): void {
  if (isStreamDoneEvent(event)) {
    console.log('Usage:', event.usage);
    console.log('Message:', event.message);
  }
}
```

### Assertions

```typescript
import {
  assert,
  assertDefined,
  assertString,
  assertNumber,
  assertNever
} from '@ainative/ai-kit-core/types';

function processConfig(config: unknown): void {
  assertObject(config);

  assert(hasProperty(config, 'apiKey'), 'Config must have apiKey');
  assertString(config.apiKey);

  const apiKey = config.apiKey; // Type: string
}

// Exhaustive checking
function handleStatus(status: TaskStatus): void {
  switch (status) {
    case 'pending':
      // Handle pending
      break;
    case 'in_progress':
      // Handle in progress
      break;
    case 'completed':
      // Handle completed
      break;
    case 'failed':
      // Handle failed
      break;
    case 'cancelled':
      // Handle cancelled
      break;
    default:
      // Compile error if new status added
      assertNever(status);
  }
}
```

## Best Practices

### 1. Use Branded Types for IDs

❌ **Don't:**
```typescript
function getUser(userId: string): Promise<User> { }
function getSession(sessionId: string): Promise<Session> { }

const id = 'some-id';
getUser(id); // Oops, might be a session ID!
```

✅ **Do:**
```typescript
function getUser(userId: UserId): Promise<User> { }
function getSession(sessionId: SessionId): Promise<Session> { }

const userId = 'user-123' as UserId;
const sessionId = 'session-456' as SessionId;

getUser(userId); // ✓
// getUser(sessionId); // Error: Type 'SessionId' is not assignable to 'UserId'
```

### 2. Prefer Result Type Over Throwing

❌ **Don't:**
```typescript
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
}
```

✅ **Do:**
```typescript
async function fetchData(): Promise<Result<Data, FetchError>> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      return failure(new FetchError(response.statusText));
    }
    const data = await response.json();
    return success(data);
  } catch (error) {
    return failure(new FetchError(error.message));
  }
}
```

### 3. Use Discriminated Unions

❌ **Don't:**
```typescript
interface Event {
  type: string;
  data?: unknown;
  error?: Error;
}
```

✅ **Do:**
```typescript
type Event =
  | { type: 'data'; data: Data }
  | { type: 'error'; error: Error }
  | { type: 'done' };

function handleEvent(event: Event): void {
  switch (event.type) {
    case 'data':
      console.log(event.data); // Type: Data
      break;
    case 'error':
      console.error(event.error); // Type: Error
      break;
    case 'done':
      // No extra properties
      break;
  }
}
```

### 4. Avoid `any` and `unknown` Properly

❌ **Don't:**
```typescript
function processValue(value: any): void {
  console.log(value.someProp); // No type safety!
}
```

✅ **Do:**
```typescript
function processValue(value: unknown): void {
  if (isObject(value) && hasProperty(value, 'someProp')) {
    console.log(value.someProp); // Type-safe access
  }
}
```

### 5. Use Readonly for Immutability

```typescript
interface Config {
  readonly apiKey: string;
  readonly endpoint: string;
  readonly options: ReadonlyArray<string>;
}

// Or use utility types
type ImmutableConfig = Readonly<Config>;
type DeepImmutableConfig = DeepReadonly<Config>;
```

### 6. Leverage Utility Types

```typescript
// Pick only needed fields
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>;

// Omit sensitive fields
type PublicUser = Omit<User, 'password' | 'email'>;

// Make all optional
type PartialUser = Partial<User>;

// Make all required
type RequiredUser = Required<User>;
```

## Common Patterns

### Pattern: Type-Safe Event Emitter

```typescript
import type { MessageId, SessionId } from '@ainative/ai-kit-core/types';

type EventMap = {
  message: { id: MessageId; content: string };
  session: { id: SessionId; status: 'started' | 'ended' };
  error: { error: Error };
};

class TypedEventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): void {
    // Implementation
  }

  emit<K extends keyof Events>(
    event: K,
    data: Events[K]
  ): void {
    // Implementation
  }
}

const emitter = new TypedEventEmitter<EventMap>();

emitter.on('message', (data) => {
  console.log(data.id); // Type: MessageId
  console.log(data.content); // Type: string
});

emitter.emit('message', {
  id: 'msg-1' as MessageId,
  content: 'Hello'
});
```

### Pattern: Builder Pattern

```typescript
class StreamConfigBuilder {
  private config: Partial<StreamConfig> = {};

  endpoint(url: string): this {
    this.config.endpoint = url;
    return this;
  }

  model(id: ModelId): this {
    this.config.model = id;
    return this;
  }

  temperature(temp: number): this {
    if (temp < 0 || temp > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    this.config.temperature = temp;
    return this;
  }

  build(): StreamConfig {
    if (!this.config.endpoint) {
      throw new Error('Endpoint is required');
    }
    return this.config as StreamConfig;
  }
}

const config = new StreamConfigBuilder()
  .endpoint('https://api.openai.com/v1/chat/completions')
  .model('gpt-4' as ModelId)
  .temperature(0.7)
  .build();
```

## Type Testing

### Writing Type Tests

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type { Message, MessageRole } from '@ainative/ai-kit-core/types';

describe('Message Types', () => {
  it('should validate message structure', () => {
    const message: Message = {
      id: 'msg-1' as MessageId,
      role: 'user',
      content: 'Hello',
      timestamp: Date.now() as number
    };

    expectTypeOf(message).toMatchTypeOf<Message>();
    expectTypeOf(message.role).toEqualTypeOf<MessageRole>();
  });

  it('should reject invalid roles', () => {
    // @ts-expect-error - Invalid role
    const invalid: MessageRole = 'invalid';
  });
});
```

## Migration Guide

### From Untyped Code

1. **Start with interfaces:**
```typescript
// Before
const config = {
  apiKey: process.env.API_KEY,
  model: 'gpt-4'
};

// After
import type { StreamConfig, ModelId } from '@ainative/ai-kit-core/types';

const config: StreamConfig = {
  endpoint: '/api/stream',
  apiKey: process.env.API_KEY,
  model: 'gpt-4' as ModelId
};
```

2. **Replace string IDs with branded types:**
```typescript
// Before
function getUser(id: string): Promise<User> { }

// After
import type { UserId } from '@ainative/ai-kit-core/types';

function getUser(id: UserId): Promise<User> { }
```

3. **Use Result instead of try/catch:**
```typescript
// Before
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  handleError(error);
}

// After
import type { Result } from '@ainative/ai-kit-core/types';
import { isSuccess } from '@ainative/ai-kit-core/types';

const result = await fetchData();
if (isSuccess(result)) {
  processData(result.data);
} else {
  handleError(result.error);
}
```

## Conclusion

AI Kit's type system provides comprehensive type safety for building robust AI applications. By following this guide and leveraging the provided types, utilities, and patterns, you can:

- Catch bugs at compile time
- Get excellent IDE support
- Write self-documenting code
- Refactor with confidence
- Build maintainable applications

For more information, see:
- [API Documentation](./api.md)
- [Type Reference](./type-reference.md)
- [Examples](../examples/)
