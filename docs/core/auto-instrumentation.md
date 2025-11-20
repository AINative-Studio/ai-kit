# Automatic Instrumentation

The AI Kit Instrumentation module provides automatic instrumentation, tracing, metrics collection, and monitoring for AI applications with zero-config setup.

## Features

- **Automatic Instrumentation**: Zero-config automatic instrumentation of LLM providers, agents, and tools
- **Distributed Tracing**: Full support for distributed tracing with span creation and context propagation
- **Metrics Collection**: Comprehensive metrics for requests, tokens, errors, retries, and performance
- **Provider Interceptors**: Built-in interceptors for OpenAI, Anthropic, and generic LLM providers
- **Custom Interceptors**: Easy creation of custom interceptors for specific needs
- **OpenTelemetry Compatible**: Follows OpenTelemetry patterns for compatibility

## Installation

```bash
npm install @ainative/ai-kit-core
# or
pnpm add @ainative/ai-kit-core
```

## Quick Start

### Basic Usage (Zero-Config)

```typescript
import { getInstrumentation } from '@ainative/ai-kit-core/instrumentation';

// Get global instrumentation instance (auto-initialized)
const instrumentation = getInstrumentation();

// Instrument an LLM call
const response = await instrumentation.instrumentLLMCall(
  'openai',
  'gpt-4',
  { messages: [{ role: 'user', content: 'Hello!' }] },
  async () => {
    // Your LLM call here
    return await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }]
    });
  }
);

// Get collected metrics
const metrics = instrumentation.getMetrics();
console.log('Metrics:', metrics);
```

### Custom Configuration

```typescript
import { InstrumentationManager } from '@ainative/ai-kit-core/instrumentation';

const instrumentation = new InstrumentationManager({
  enabled: true,
  serviceName: 'my-ai-app',
  environment: 'production',
  samplingRate: 1.0, // Sample 100% of traces
  collectMetrics: true,
  enableTracing: true,
  logLevel: 'info',
  metadata: {
    version: '1.0.0',
    region: 'us-west-2'
  }
});
```

## Core Concepts

### Traces and Spans

Traces represent complete execution flows, while spans represent individual operations within a trace.

```typescript
// Start a trace
const trace = instrumentation.startTrace('user-query-processing');

// Create a span for a specific operation
const context = { traceId: trace.traceId };
const span = instrumentation.createSpan('retrieve-context', 'internal', context);

// Add attributes to the span
instrumentation.addSpanAttributes(span.spanId, {
  'query': userQuery,
  'context.size': contextData.length
});

// End the span
instrumentation.endSpan(span.spanId, 'ok');

// End the trace
await instrumentation.endTrace(trace.traceId);
```

### Metrics Collection

The instrumentation manager automatically collects various metrics:

```typescript
// Metrics are automatically collected during instrumentation
await instrumentation.instrumentLLMCall(
  'openai',
  'gpt-4',
  request,
  async () => llmCall()
);

// Retrieve metrics
const metrics = instrumentation.getMetrics();

// Metrics include:
// - llm.request.duration (histogram)
// - llm.request.total (counter)
// - llm.tokens.prompt (counter)
// - llm.tokens.completion (counter)
// - llm.tokens.total (counter)
// - llm.errors (counter)
// - llm.retries (counter)
// - llm.cache.hits (counter)
```

### Manual Metrics Recording

```typescript
const collector = instrumentation.getMetricsCollector();

// Record a counter
collector.recordCounter('custom.requests', 1, { endpoint: '/api/chat' });

// Record a gauge
collector.recordGauge('custom.queue.size', 42, { queue: 'high-priority' });

// Record a histogram
collector.recordHistogram('custom.processing.time', 125, { operation: 'parse' });
```

## Instrumentation Methods

### LLM Instrumentation

```typescript
const response = await instrumentation.instrumentLLMCall(
  'openai',      // provider
  'gpt-4',       // model
  request,       // request object
  async () => {  // function to instrument
    return await llm.chat(request);
  },
  context        // optional trace context
);
```

**Collected Metrics:**
- Request duration
- Time to first token (TTFT)
- Token counts (prompt, completion, total)
- Success/failure status
- Error types
- Retry counts
- Cache hits

### Tool Instrumentation

```typescript
const result = await instrumentation.instrumentToolCall(
  'calculator',  // tool name
  params,        // tool parameters
  async () => {  // function to instrument
    return await tool.execute(params);
  },
  context        // optional trace context
);
```

**Collected Metrics:**
- Execution duration
- Success/failure status
- Error types
- Retry counts
- Queue time
- Result size

### Agent Instrumentation

```typescript
const result = await instrumentation.instrumentAgentExecution(
  'assistant',   // agent ID
  userInput,     // input message
  async () => {  // function to instrument
    return await agent.execute(userInput);
  },
  context        // optional trace context
);
```

**Collected Metrics:**
- Total execution duration
- Number of steps
- Number of LLM calls
- Number of tool calls
- Total tokens used
- Success/failure status

## Interceptors

Interceptors allow you to hook into different stages of execution.

### Using Built-in Interceptors

```typescript
import {
  OpenAIInterceptor,
  AnthropicInterceptor,
  ToolCallInterceptor,
  AgentExecutionInterceptor
} from '@ainative/ai-kit-core/instrumentation';

// Register LLM interceptors
instrumentation.registerLLMInterceptor(new OpenAIInterceptor());
instrumentation.registerLLMInterceptor(new AnthropicInterceptor());

// Register tool interceptor
instrumentation.registerToolInterceptor(new ToolCallInterceptor());

// Register agent interceptor
instrumentation.registerAgentInterceptor(new AgentExecutionInterceptor());
```

### Creating Custom Interceptors

#### LLM Interceptor

```typescript
import { LLMInterceptor, InterceptorContext } from '@ainative/ai-kit-core/instrumentation';

const customLLMInterceptor: LLMInterceptor = {
  async beforeRequest(request, context) {
    console.log('LLM request starting:', context.trace.traceId);
    // Add custom logic, modify span attributes, etc.
    if (context.span) {
      context.span.attributes['custom.attribute'] = 'value';
    }
  },

  async afterResponse(request, response, context) {
    console.log('LLM request completed');
    // Process response, collect custom metrics, etc.
  },

  async onError(request, error, context) {
    console.error('LLM request failed:', error.message);
    // Handle error, send alerts, etc.
  }
};

instrumentation.registerLLMInterceptor(customLLMInterceptor);
```

#### Tool Interceptor

```typescript
import { ToolInterceptor } from '@ainative/ai-kit-core/instrumentation';

const customToolInterceptor: ToolInterceptor = {
  async beforeExecution(toolName, params, context) {
    console.log(`Executing tool: ${toolName}`);
  },

  async afterExecution(toolName, params, result, context) {
    console.log(`Tool completed: ${toolName}`);
  },

  async onError(toolName, params, error, context) {
    console.error(`Tool failed: ${toolName}`, error);
  }
};

instrumentation.registerToolInterceptor(customToolInterceptor);
```

#### Agent Interceptor

```typescript
import { AgentInterceptor } from '@ainative/ai-kit-core/instrumentation';

const customAgentInterceptor: AgentInterceptor = {
  async beforeExecution(agentId, input, context) {
    console.log(`Agent ${agentId} starting execution`);
  },

  async afterExecution(agentId, input, result, context) {
    console.log(`Agent ${agentId} completed`);
    // Access execution stats from context.data
    console.log('Steps:', context.data?.steps);
    console.log('LLM calls:', context.data?.llmCalls);
  },

  async onError(agentId, input, error, context) {
    console.error(`Agent ${agentId} failed:`, error);
  }
};

instrumentation.registerAgentInterceptor(customAgentInterceptor);
```

### Logging Interceptors

Convenient logging interceptors are provided:

```typescript
import {
  createLoggingLLMInterceptor,
  createLoggingToolInterceptor,
  createLoggingAgentInterceptor
} from '@ainative/ai-kit-core/instrumentation';

instrumentation.registerLLMInterceptor(createLoggingLLMInterceptor());
instrumentation.registerToolInterceptor(createLoggingToolInterceptor());
instrumentation.registerAgentInterceptor(createLoggingAgentInterceptor());
```

## Trace Exporter

Export traces to external systems:

```typescript
import { TraceExporter, Trace } from '@ainative/ai-kit-core/instrumentation';

const customExporter: TraceExporter = {
  async export(trace: Trace) {
    // Send trace to your monitoring system
    await sendToMonitoring(trace);
  },

  async flush() {
    // Flush any pending traces
  },

  async shutdown() {
    // Clean up resources
  }
};

const instrumentation = new InstrumentationManager({
  traceExporter: customExporter
});
```

## Advanced Usage

### Distributed Tracing

```typescript
// Service A: Create trace and propagate context
const trace = instrumentation.startTrace('cross-service-request');
const context = {
  traceId: trace.traceId,
  parentSpanId: trace.rootSpan.spanId
};

// Pass context to Service B (e.g., in HTTP headers)
await fetch('https://service-b.com/api', {
  headers: {
    'X-Trace-Id': context.traceId,
    'X-Parent-Span-Id': context.parentSpanId
  }
});

// Service B: Continue the trace
const receivedContext = {
  traceId: req.headers['x-trace-id'],
  parentSpanId: req.headers['x-parent-span-id']
};

await instrumentation.instrumentLLMCall(
  'openai',
  'gpt-4',
  request,
  async () => llmCall(),
  receivedContext
);
```

### Custom Metrics Collector

```typescript
import { MetricsCollector } from '@ainative/ai-kit-core/instrumentation';

class PrometheusMetricsCollector implements MetricsCollector {
  // Implement the MetricsCollector interface
  recordCounter(name: string, value: number, labels?: Record<string, string>) {
    // Send to Prometheus
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>) {
    // Send to Prometheus
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    // Send to Prometheus
  }

  recordLLMMetrics(metrics: LLMMetrics) {
    // Process and send LLM metrics
  }

  recordToolMetrics(metrics: ToolMetrics) {
    // Process and send tool metrics
  }

  recordAgentMetrics(metrics: AgentMetrics) {
    // Process and send agent metrics
  }

  getMetrics() {
    return [];
  }

  clear() {
    // Clear internal state if needed
  }
}

const instrumentation = new InstrumentationManager({
  metricsCollector: new PrometheusMetricsCollector()
});
```

### Sampling

Control which traces are collected:

```typescript
// Sample 50% of traces
const instrumentation = new InstrumentationManager({
  samplingRate: 0.5
});

// Sampled traces will be fully instrumented
// Non-sampled traces will create "dummy" traces (no overhead)
```

## Best Practices

### 1. Use Global Instance for Consistency

```typescript
// Use the global instance across your application
import { getInstrumentation } from '@ainative/ai-kit-core/instrumentation';

const instrumentation = getInstrumentation({
  serviceName: 'my-app',
  environment: process.env.NODE_ENV
});
```

### 2. Instrument at the Right Level

```typescript
// ✅ Good: Instrument high-level operations
await instrumentation.instrumentAgentExecution(
  'assistant',
  input,
  async () => agent.execute(input)
);

// ❌ Avoid: Over-instrumenting low-level operations
// (metrics overhead can add up)
```

### 3. Add Meaningful Attributes

```typescript
const span = instrumentation.createSpan('user-query', 'server', context);

instrumentation.addSpanAttributes(span.spanId, {
  'user.id': userId,
  'query.length': query.length,
  'query.language': detectedLanguage,
  'session.id': sessionId
});
```

### 4. Handle Errors Properly

```typescript
try {
  await instrumentation.instrumentLLMCall(
    'openai',
    'gpt-4',
    request,
    async () => llmCall()
  );
} catch (error) {
  // Error is automatically tracked
  // Add additional error handling as needed
  logger.error('LLM call failed', { error });
  throw error;
}
```

### 5. Clean Up Resources

```typescript
// On application shutdown
process.on('SIGTERM', async () => {
  await instrumentation.shutdown();
  process.exit(0);
});
```

### 6. Use Environment-Specific Configuration

```typescript
const instrumentation = new InstrumentationManager({
  enabled: process.env.NODE_ENV !== 'test',
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
});
```

## Configuration Reference

### InstrumentationConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable instrumentation |
| `serviceName` | `string` | `'ai-kit'` | Service name for tracing |
| `environment` | `string` | `'development'` | Environment (dev/staging/prod) |
| `samplingRate` | `number` | `1.0` | Trace sampling rate (0-1) |
| `collectMetrics` | `boolean` | `true` | Enable metrics collection |
| `enableTracing` | `boolean` | `true` | Enable distributed tracing |
| `metadata` | `object` | `{}` | Custom metadata for all traces |
| `metricsCollector` | `MetricsCollector` | Default | Custom metrics collector |
| `traceExporter` | `TraceExporter` | `undefined` | Custom trace exporter |
| `logLevel` | `string` | `'info'` | Log level (debug/info/warn/error) |

## Metrics Reference

### LLM Metrics

- `llm.request.duration` - Request duration (histogram)
- `llm.request.total` - Total requests (counter)
- `llm.tokens.prompt` - Prompt tokens (counter)
- `llm.tokens.completion` - Completion tokens (counter)
- `llm.tokens.total` - Total tokens (counter)
- `llm.time_to_first_token` - TTFT (histogram)
- `llm.retries` - Retry count (counter)
- `llm.errors` - Error count (counter)
- `llm.cache.hits` - Cache hits (counter)

### Tool Metrics

- `tool.execution.duration` - Execution duration (histogram)
- `tool.execution.total` - Total executions (counter)
- `tool.retries` - Retry count (counter)
- `tool.errors` - Error count (counter)
- `tool.queue_time` - Queue time (histogram)

### Agent Metrics

- `agent.execution.duration` - Execution duration (histogram)
- `agent.execution.total` - Total executions (counter)
- `agent.steps` - Number of steps (gauge)
- `agent.llm_calls` - Number of LLM calls (gauge)
- `agent.tool_calls` - Number of tool calls (gauge)
- `agent.tokens.total` - Total tokens (counter)
- `agent.errors` - Error count (counter)

## Examples

### Full Agent Execution with Instrumentation

```typescript
import { InstrumentationManager, OpenAIInterceptor } from '@ainative/ai-kit-core/instrumentation';
import { Agent } from '@ainative/ai-kit-core/agents';

// Setup instrumentation
const instrumentation = new InstrumentationManager({
  serviceName: 'customer-support-bot',
  environment: 'production'
});

instrumentation.registerLLMInterceptor(new OpenAIInterceptor());

// Create agent
const agent = new Agent({
  id: 'support-agent',
  name: 'Customer Support',
  systemPrompt: 'You are a helpful customer support agent.',
  llm: { provider: 'openai', model: 'gpt-4' },
  tools: [/* ... */]
});

// Execute with instrumentation
async function handleUserQuery(userId: string, query: string) {
  const trace = instrumentation.startTrace('user-query');

  try {
    const result = await instrumentation.instrumentAgentExecution(
      agent.config.id,
      query,
      async () => {
        // Execute agent (internal LLM and tool calls will be tracked)
        return await executor.execute(query);
      },
      { traceId: trace.traceId }
    );

    await instrumentation.endTrace(trace.traceId);

    // Get metrics
    const metrics = instrumentation.getMetrics();
    console.log('Execution metrics:', metrics);

    return result;
  } catch (error) {
    await instrumentation.endTrace(trace.traceId);
    throw error;
  }
}
```

## Troubleshooting

### High Memory Usage

If you notice high memory usage:

1. Reduce sampling rate in production
2. Implement trace exporter to flush traces regularly
3. Clear metrics periodically

```typescript
const instrumentation = new InstrumentationManager({
  samplingRate: 0.1 // Only sample 10% of traces
});

// Clear metrics periodically
setInterval(() => {
  instrumentation.clearMetrics();
}, 60000); // Every minute
```

### Missing Metrics

If metrics are not being collected:

1. Check that `collectMetrics` is enabled
2. Verify that instrumentation is enabled
3. Ensure you're using instrumentation methods

```typescript
const config = instrumentation.getConfig();
console.log('Enabled:', config.enabled);
console.log('Collect metrics:', config.collectMetrics);
```

### Trace Context Not Propagating

For distributed tracing across services:

1. Ensure trace context is serialized and sent
2. Verify context is deserialized correctly
3. Pass context to instrumentation methods

```typescript
// Service A
const context = instrumentation.createTraceContext();
await sendToServiceB({ traceId: context.traceId });

// Service B
const context = { traceId: receivedTraceId };
await instrumentation.instrumentLLMCall(provider, model, request, fn, context);
```

## License

MIT
