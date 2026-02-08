# AI Kit API Reference

Complete API reference documentation for all AI Kit packages.

## Overview

AI Kit is a comprehensive framework for building AI-powered applications. It provides:

- **Framework-agnostic core** for streaming, agents, and state management
- **React integration** with hooks and pre-built components
- **Built-in tools** for agent capabilities
- **Next.js helpers** for App Router and API routes
- **Testing utilities** for comprehensive test coverage

---

## Packages

### [@ainative/ai-kit-core](./core/README.md)

Framework-agnostic core for AI Kit - streaming, agents, state management

**Key Modules:**
- [Streaming](./core/streaming.md) - Real-time LLM streaming with SSE
- [Agents](./core/agents.md) - AI agent creation and execution
- [Security](./core/security.md) - PII detection, prompt injection prevention
- [Memory](./core/memory.md) - Long-term memory management
- [Context](./core/context.md) - Context window management
- [Tracking](./core/tracking.md) - Usage tracking and cost monitoring
- [ZeroDB](./core/zerodb.md) - Database integration
- [Authentication](./core/auth.md) - AINative authentication
- [Session Management](./core/session.md) - User session tracking
- [RLHF](./core/rlhf.md) - Reinforcement learning logging
- [Instrumentation](./core/instrumentation.md) - Auto-instrumentation

**Installation:**
```bash
npm install @ainative/ai-kit-core
```

---

### [@ainative/ai-kit-react](./react/README.md)

React hooks and components for AI Kit

**Key Features:**
- [Hooks](./react/hooks.md) - `useAIStream`, `useConversation`
- [Components](./react/components.md) - Pre-built UI components
- [Component Registry](./react/registry.md) - Custom component registration

**Installation:**
```bash
npm install @ainative/ai-kit-react
```

**Quick Start:**
```typescript
import { useAIStream } from '@ainative/ai-kit-react';

function Chat() {
  const { messages, send, isStreaming } = useAIStream({
    endpoint: '/api/chat',
    model: 'gpt-4'
  });

  return (
    <div>
      {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
      <button onClick={() => send('Hello!')} disabled={isStreaming}>
        Send
      </button>
    </div>
  );
}
```

---

### [@ainative/ai-kit-tools](./tools/README.md)

Built-in tools for AI agents

**Available Tools:**
- [Calculator](./tools/README.md#calculator) - Mathematical computations
- [WebSearch](./tools/README.md#websearch) - Web search integration
- [CodeInterpreter](./tools/README.md#codeinterpreter) - Safe code execution
- [ZeroDBTool](./tools/README.md#zerodbtool) - Database CRUD operations
- [ZeroDBQuery](./tools/README.md#zerodbquery) - Advanced queries

**Installation:**
```bash
npm install @ainative/ai-kit-tools
```

**Quick Start:**
```typescript
import { Agent } from '@ainative/ai-kit-core/agents';
import { Calculator, WebSearch } from '@ainative/ai-kit-tools';

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

### [@ainative/ai-kit-nextjs](./nextjs/README.md)

Next.js integration for AI Kit

**Features:**
- Route helpers for App Router
- SSE streaming utilities
- Authentication middleware
- Rate limiting middleware

**Installation:**
```bash
npm install @ainative/ai-kit-nextjs
```

**Quick Start:**
```typescript
// app/api/chat/route.ts
import { createStreamingResponse } from '@ainative/ai-kit-nextjs';
import { OpenAI } from 'openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const openai = new OpenAI();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true
  });

  return createStreamingResponse(completion);
}
```

---

### [@ainative/ai-kit-testing](./testing/README.md)

Testing utilities for AI Kit

**Features:**
- Mock LLM responses and streams
- Mock agents and tools
- Pre-built test fixtures
- Custom Jest/Vitest matchers

**Installation:**
```bash
npm install -D @ainative/ai-kit-testing
```

**Quick Start:**
```typescript
import { mockAIStream, expect } from '@ainative/ai-kit-testing';

it('should handle streaming', async () => {
  const stream = mockAIStream({
    messages: ['Hello', ' world']
  });

  const result = await processStream(stream);
  expect(result).toMatchStreamOutput('Hello world');
});
```

---

## Quick Navigation

### By Feature

#### Streaming
- [AIStream](./core/streaming.md#aistream) - Client-side streaming
- [StreamingResponse](./core/streaming.md#streamingresponse) - Server-side SSE
- [useAIStream Hook](./react/hooks.md#useaistream) - React streaming hook
- [Next.js Streaming](./nextjs/README.md#createstreamingresponse) - App Router integration

#### Agents
- [Agent](./core/agents.md#agent) - Agent creation
- [AgentExecutor](./core/agents.md#agentexecutor) - Execute agent tasks
- [StreamingAgentExecutor](./core/agents.md#streamingagentexecutor) - Stream agent responses
- [AgentSwarm](./core/agents.md#agentswarm) - Multi-agent orchestration
- [Tools](./tools/README.md) - Built-in tools

#### Security
- [PIIDetector](./core/security.md#piidetector) - PII detection and redaction
- [PromptInjectionDetector](./core/security.md#promptinjectiondetector) - Injection prevention
- [ContentModerator](./core/security.md#contentmoderator) - Content moderation
- [JailbreakDetector](./core/security.md#jailbreakdetector) - Jailbreak detection

#### State Management
- [Memory](./core/memory.md) - Long-term memory
- [Context Management](./core/context.md) - Context windows
- [Session Management](./core/session.md) - User sessions
- [Conversation Store](./core/store.md) - Conversation persistence

#### Observability
- [Usage Tracking](./core/tracking.md) - Token and cost tracking
- [RLHF Logging](./core/rlhf.md) - Feedback collection
- [Instrumentation](./core/instrumentation.md) - Auto-instrumentation
- [Monitoring](./core/monitoring.md) - Query monitoring
- [Reporting](./core/reporting.md) - Usage reports

### By Use Case

#### Building a Chat App
1. [Set up streaming endpoint](./nextjs/README.md)
2. [Use React hook](./react/hooks.md#useaistream)
3. [Add conversation persistence](./react/hooks.md#useconversation)
4. [Implement security checks](./core/security.md)
5. [Track usage](./core/tracking.md)

#### Creating an AI Agent
1. [Define agent configuration](./core/agents.md#agent)
2. [Add tools](./tools/README.md)
3. [Execute tasks](./core/agents.md#agentexecutor)
4. [Stream responses](./core/agents.md#streamingagentexecutor)
5. [Test agent](./testing/README.md)

#### Implementing Security
1. [Detect PII](./core/security.md#piidetector)
2. [Prevent prompt injection](./core/security.md#promptinjectiondetector)
3. [Moderate content](./core/security.md#contentmoderator)
4. [Detect jailbreaks](./core/security.md#jailbreakdetector)

---

## Common Patterns

### Streaming Chat with Security

```typescript
import { useAIStream } from '@ainative/ai-kit-react';
import { PIIDetector } from '@ainative/ai-kit-core/security';

function SecureChat() {
  const piiDetector = new PIIDetector();

  const { messages, send } = useAIStream({
    endpoint: '/api/chat',
    model: 'gpt-4',
    onToken: (token) => console.log('Token:', token)
  });

  const handleSend = (input: string) => {
    // Check for PII before sending
    const result = piiDetector.detect(input);

    if (result.containsPII) {
      console.warn('PII detected:', result.detectedTypes);
      // Use redacted version
      send(result.redacted);
    } else {
      send(input);
    }
  };

  return (
    <div>
      {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
      <input onKeyPress={(e) => {
        if (e.key === 'Enter') handleSend(e.target.value);
      }} />
    </div>
  );
}
```

### Agent with Tools and Tracking

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';
import { Calculator, WebSearch } from '@ainative/ai-kit-tools';
import { UsageTracker } from '@ainative/ai-kit-core/tracking';

const tracker = new UsageTracker();

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

const executor = new AgentExecutor(agent);

const result = await executor.execute('What is 15% of the GDP of France?');

// Track usage
await tracker.trackSuccess({
  model: 'gpt-4',
  promptTokens: result.trace.usage.promptTokens,
  completionTokens: result.trace.usage.completionTokens,
  durationMs: result.trace.durationMs
});

console.log('Result:', result.response);
console.log('Cost:', await tracker.getAggregated().totalCost);
```

### Multi-Agent System

```typescript
import { AgentSwarm } from '@ainative/ai-kit-core/agents';
import { Calculator, WebSearch, ZeroDBTool } from '@ainative/ai-kit-tools';

const researcher = new Agent({
  name: 'Researcher',
  tools: [WebSearch, ZeroDBTool],
  llm: { provider: 'openai', model: 'gpt-4', apiKey: process.env.OPENAI_API_KEY }
});

const analyst = new Agent({
  name: 'Analyst',
  tools: [Calculator],
  llm: { provider: 'openai', model: 'gpt-4', apiKey: process.env.OPENAI_API_KEY }
});

const swarm = new AgentSwarm({
  agents: [researcher, analyst],
  communicationMode: 'sequential'
});

const result = await swarm.execute(
  'Research the GDP of top 5 countries and calculate the average'
);
```

---

## TypeScript Support

All AI Kit packages are written in TypeScript and include complete type definitions.

```typescript
import type {
  // Core types
  AIStreamConfig,
  AgentConfig,
  ToolDefinition,
  Message,
  Usage,

  // Security types
  PIIDetectionResult,
  ModerationResult,

  // Memory types
  MemoryRecord,
  FactExtraction,

  // Tracking types
  UsageRecord,
  AggregatedUsage
} from '@ainative/ai-kit-core';
```

---

## Environment Variables

Common environment variables used across AI Kit:

```bash
# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# AINative Platform
AINATIVE_API_KEY=ain_...

# ZeroDB
ZERODB_PROJECT_ID=proj_...
ZERODB_API_KEY=zdb_...

# Web Search (optional)
SERPER_API_KEY=...
BING_API_KEY=...

# Redis (optional)
REDIS_URL=redis://...
```

---

## Framework Support

### Next.js (App Router)
```typescript
// app/api/chat/route.ts
import { createStreamingResponse } from '@ainative/ai-kit-nextjs';
export async function POST(req: Request) { /* ... */ }
```

### Express
```typescript
import { StreamingResponse } from '@ainative/ai-kit-core/streaming';
app.post('/api/chat', async (req, res) => {
  const stream = new StreamingResponse(res);
  // ...
});
```

### React
```typescript
import { useAIStream } from '@ainative/ai-kit-react';
function Chat() { /* ... */ }
```

### Vue (Coming Soon)
```typescript
import { createAIStream } from '@ainative/ai-kit-vue';
```

---

## Best Practices

1. **Always handle errors gracefully**
2. **Use streaming for better UX**
3. **Implement security by default**
4. **Track usage and costs**
5. **Test with mocks and fixtures**
6. **Use TypeScript for type safety**
7. **Monitor performance and usage**
8. **Implement retry logic**
9. **Clean up resources on unmount**
10. **Validate inputs before processing**

---

## Examples

See the [examples directory](../../examples/) for complete, working examples:

- [Basic Chat](../../examples/chat/)
- [Agent with Tools](../../examples/agent/)
- [Security Pipeline](../../examples/security/)
- [Multi-Agent System](../../examples/swarm/)
- [Next.js Integration](../../examples/nextjs/)
- [React Components](../../examples/react/)

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to AI Kit.

---

## License

MIT - See [LICENSE](../../LICENSE) for details.

---

## Support

- [Documentation](https://docs.ainative.studio/ai-kit)
- [GitHub Issues](https://github.com/AINative-Studio/ai-kit/issues)
- [Discord Community](https://discord.com/invite/paipalooza)
- [Email Support](mailto:support@ainative.studio)

---

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for version history and updates.
