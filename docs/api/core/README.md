# @ainative/ai-kit-core API Reference

Framework-agnostic core for AI Kit - streaming, agents, state management

## Installation

```bash
npm install @ainative/ai-kit-core
# or
pnpm add @ainative/ai-kit-core
# or
yarn add @ainative/ai-kit-core
```

## Overview

The core package provides the fundamental building blocks for building AI-powered applications. It includes:

- **Streaming**: Real-time streaming from LLM providers (OpenAI, Anthropic)
- **Agents**: AI agent creation, execution, and orchestration
- **Security**: PII detection, prompt injection prevention, content moderation
- **Memory**: Long-term memory management and fact extraction
- **Context**: Context window management and token counting
- **Summarization**: Automatic conversation summarization
- **Authentication**: AINative authentication provider
- **Session Management**: User session tracking and storage
- **ZeroDB Integration**: Database operations and query building
- **Usage Tracking**: Token counting and cost monitoring
- **Instrumentation**: Auto-instrumentation and observability
- **RLHF**: Reinforcement learning logging and feedback
- **Search**: Semantic search capabilities
- **Store**: Conversation and state persistence
- **Monitoring**: Query monitoring and alerting
- **Reporting**: Usage reports and analytics

## Modules

### Streaming
- [AIStream](./streaming.md) - Stream responses from LLMs
- [StreamingResponse](./streaming.md#streamingresponse) - HTTP streaming response utilities
- [Provider Adapters](./streaming.md#adapters) - OpenAI and Anthropic adapters

### Agents
- [Agent](./agents.md) - Create and configure AI agents
- [AgentExecutor](./agents.md#agentexecutor) - Execute agent tasks
- [StreamingAgentExecutor](./agents.md#streamingagentexecutor) - Stream agent responses
- [AgentSwarm](./agents.md#agentswarm) - Multi-agent orchestration
- [LLM Providers](./agents.md#llm-providers) - OpenAI and Anthropic providers

### Security
- [PIIDetector](./security.md) - Detect and redact PII
- [PromptInjectionDetector](./security.md#prompt-injection) - Prevent prompt injection
- [ContentModerator](./security.md#content-moderation) - Moderate content
- [JailbreakDetector](./security.md#jailbreak-detection) - Detect jailbreak attempts

### Memory
- [MemoryStore](./memory.md) - Abstract memory interface
- [UserMemory](./memory.md#usermemory) - User-specific memory
- [FactExtractor](./memory.md#factextractor) - Extract facts from conversations
- [InMemoryMemoryStore](./memory.md#inmemory) - In-memory implementation
- [RedisMemoryStore](./memory.md#redis) - Redis-backed memory
- [ZeroDBMemoryStore](./memory.md#zerodb) - ZeroDB-backed memory

### Context Management
- [ContextManager](./context.md) - Manage context windows
- [TokenCounter](./context.md#tokencounter) - Count tokens efficiently

### Summarization
- [ConversationSummarizer](./summarization.md) - Summarize conversations
- [extractKeyPoints](./summarization.md#extractive) - Extract key points

### Authentication
- [AINativeAuthProvider](./auth.md) - Authenticate with AINative platform

### Session Management
- [SessionManager](./session.md) - Manage user sessions
- [InMemorySessionStore](./session.md#inmemory) - In-memory sessions
- [RedisSessionStore](./session.md#redis) - Redis-backed sessions
- [ZeroDBSessionStore](./session.md#zerodb) - ZeroDB-backed sessions

### ZeroDB
- [ZeroDBClient](./zerodb.md) - Database client
- [QueryBuilder](./zerodb.md#querybuilder) - Build type-safe queries

### Usage Tracking
- [UsageTracker](./tracking.md) - Track API usage and costs
- [calculateCost](./tracking.md#pricing) - Calculate LLM costs

### Instrumentation
- [InstrumentationManager](./instrumentation.md) - Manage instrumentation
- [Interceptors](./instrumentation.md#interceptors) - Request/response interceptors

### RLHF
- [RLHFLogger](./rlhf.md) - Log interactions for RLHF
- [RLHFInstrumentation](./rlhf.md#instrumentation) - Auto-instrument for RLHF

### Search
- [SemanticSearch](./search.md) - Semantic similarity search

### Store
- [ConversationStore](./store.md) - Store conversations
- [createStore](./store.md#factory) - Create custom stores

### Monitoring
- [QueryMonitor](./monitoring.md) - Monitor database queries

### Alerts
- [AlertManager](./alerts.md) - Manage cost and usage alerts

### Reporting
- [ReportGenerator](./reporting.md) - Generate usage reports

## Quick Start Examples

### Streaming

```typescript
import { AIStream } from '@ainative/ai-kit-core/streaming';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
});

const stream = AIStream(response);

// Use in your framework (Next.js, Express, etc.)
return new Response(stream);
```

### Agents

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';
import { Calculator, WebSearch } from '@ainative/ai-kit-tools';

const agent = new Agent({
  name: 'ResearchAssistant',
  description: 'Helps with research and calculations',
  tools: [Calculator, WebSearch],
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  }
});

const executor = new AgentExecutor({ agent });
const result = await executor.execute('What is 15% of the GDP of France?');
console.log(result.output);
```

### Security

```typescript
import { PIIDetector } from '@ainative/ai-kit-core/security';

const detector = new PIIDetector({
  enabledTypes: ['email', 'phone', 'ssn', 'credit_card']
});

const result = detector.detect('My email is john@example.com');
console.log(result.containsPII); // true
console.log(result.detectedTypes); // ['email']
console.log(result.redacted); // 'My email is [REDACTED_EMAIL]'
```

### Memory

```typescript
import { UserMemory } from '@ainative/ai-kit-core/memory';
import { ZeroDBMemoryStore } from '@ainative/ai-kit-core/memory';

const store = new ZeroDBMemoryStore({
  projectId: process.env.ZERODB_PROJECT_ID,
  apiKey: process.env.ZERODB_API_KEY
});

const memory = new UserMemory({
  userId: 'user-123',
  store
});

// Store facts
await memory.addFact('User prefers dark mode');
await memory.addFact('User is interested in machine learning');

// Retrieve relevant memories
const relevant = await memory.getRelevantMemories('What are my preferences?');
console.log(relevant);
```

### Usage Tracking

```typescript
import { UsageTracker } from '@ainative/ai-kit-core/tracking';

const tracker = new UsageTracker();

await tracker.trackSuccess({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  durationMs: 1000,
  userId: 'user-123'
});

const stats = await tracker.getAggregated();
console.log(`Total cost: $${stats.totalCost}`);
console.log(`Total tokens: ${stats.totalTokens}`);
```

## TypeScript Support

All modules include complete TypeScript definitions:

```typescript
import type {
  AIStreamConfig,
  AgentConfig,
  ToolDefinition,
  SecurityConfig,
  MemoryRecord,
  UsageRecord
} from '@ainative/ai-kit-core';
```

## Configuration

Most modules support configuration via environment variables or config objects:

```typescript
// Environment variables
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ZERODB_PROJECT_ID=proj_...
ZERODB_API_KEY=zdb_...

// Config objects
const config = {
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  },
  security: {
    enablePIIDetection: true,
    enablePromptInjection: true
  },
  memory: {
    enabled: true,
    maxRecords: 1000
  }
};
```

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Use streaming for real-time UX**: Stream responses when possible
3. **Enable security by default**: Use PII detection and prompt injection prevention
4. **Track usage**: Monitor costs with UsageTracker
5. **Implement memory**: Use UserMemory for context-aware conversations
6. **Validate inputs**: Always validate user inputs before processing
7. **Use TypeScript**: Leverage type safety for better development experience

## License

MIT

## Links

- [GitHub Repository](https://github.com/AINative-Studio/ai-kit)
- [NPM Package](https://www.npmjs.com/package/@ainative/ai-kit-core)
- [Documentation](https://docs.ainative.studio/ai-kit)

## See Also

- [React Package](../react/README.md)
- [Tools Package](../tools/README.md)
- [Next.js Package](../nextjs/README.md)
- [Testing Package](../testing/README.md)
