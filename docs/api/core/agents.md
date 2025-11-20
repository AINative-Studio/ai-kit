# Agents API Reference

AI agent creation, execution, and orchestration with tool calling support.

## Overview

The agents module provides a complete framework for building AI agents:

- **Agent**: Base agent class with tool management
- **AgentExecutor**: Execute multi-step agent tasks
- **StreamingAgentExecutor**: Stream agent responses in real-time
- **AgentSwarm**: Multi-agent orchestration and collaboration
- **LLM Providers**: OpenAI and Anthropic provider implementations

## Installation

```bash
npm install @ainative/ai-kit-core
```

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';
```

---

## Agent

Base agent class with tool registration and management.

### Constructor

```typescript
new Agent(config: AgentConfig)
```

**Parameters:**

```typescript
interface AgentConfig {
  id?: string;                    // Auto-generated if not provided
  name: string;                   // Agent name
  description: string;            // What the agent does
  instructions?: string;          // Additional instructions
  tools?: ToolDefinition[];       // Tools available to the agent
  llm: {
    provider: 'openai' | 'anthropic';
    model: string;
    apiKey: string;
    temperature?: number;
    maxTokens?: number;
  };
}
```

**Example:**

```typescript
import { Agent } from '@ainative/ai-kit-core/agents';
import { Calculator, WebSearch } from '@ainative/ai-kit-tools';

const agent = new Agent({
  name: 'ResearchAssistant',
  description: 'Helps with research and data analysis',
  instructions: 'Always cite sources and show calculations',
  tools: [Calculator, WebSearch],
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7
  }
});
```

### Methods

#### registerTool(tool: ToolDefinition): void

Register a single tool with the agent.

```typescript
import { CustomTool } from './tools';

agent.registerTool(CustomTool);
```

---

#### registerTools(tools: ToolDefinition[]): void

Register multiple tools at once.

```typescript
agent.registerTools([Tool1, Tool2, Tool3]);
```

---

#### unregisterTool(toolName: string): boolean

Remove a tool by name.

```typescript
const removed = agent.unregisterTool('calculator');
console.log(removed); // true if tool was found and removed
```

---

#### getTool(toolName: string): ToolDefinition | undefined

Get a registered tool by name.

```typescript
const calculator = agent.getTool('calculator');
if (calculator) {
  console.log(calculator.description);
}
```

---

#### getTools(): ToolDefinition[]

Get all registered tools.

```typescript
const allTools = agent.getTools();
console.log(`Agent has ${allTools.length} tools`);
```

---

#### hasTool(toolName: string): boolean

Check if a tool is registered.

```typescript
if (agent.hasTool('web_search')) {
  console.log('Web search available');
}
```

---

#### getToolSchemas(): Array<{name, description, parameters}>

Get tool schemas formatted for LLM function calling.

```typescript
const schemas = agent.getToolSchemas();
// Returns OpenAI/Anthropic compatible function schemas
```

---

#### validateToolCall(toolCall: ToolCall): ValidationResult

Validate tool call parameters against the tool's schema.

```typescript
const result = agent.validateToolCall({
  id: 'call_123',
  name: 'calculator',
  parameters: { operation: 'add', a: 5, b: 3 }
});

if (result.valid) {
  console.log('Valid:', result.validatedParams);
} else {
  console.error('Invalid:', result.error);
}
```

---

## AgentExecutor

Execute multi-step agent tasks with automatic tool calling.

### Constructor

```typescript
new AgentExecutor(agent: Agent, config?: ExecutionConfig)
```

**Parameters:**

```typescript
interface ExecutionConfig {
  maxSteps?: number;              // Max steps before stopping (default: 10)
  streaming?: boolean;            // Enable streaming (default: false)
  onStream?: StreamCallback;      // Stream event callback
  verbose?: boolean;              // Detailed logging (default: false)
  llmProvider?: LLMProvider;      // Custom LLM provider
  context?: Record<string, any>;  // Additional context
}
```

**Example:**

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';

const agent = new Agent({
  name: 'MathHelper',
  description: 'Solves math problems',
  tools: [Calculator],
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY
  }
});

const executor = new AgentExecutor(agent, {
  maxSteps: 5,
  verbose: true
});
```

### Methods

#### execute(input: string, config?: ExecutionConfig): Promise<ExecutionResult>

Execute the agent with the given input.

```typescript
const result = await executor.execute('What is 15% of 250?');

console.log('Response:', result.response);
console.log('Steps taken:', result.trace.stats.totalSteps);
console.log('Tool calls:', result.trace.stats.totalToolCalls);
console.log('Success:', result.success);
```

**Returns:**

```typescript
interface ExecutionResult {
  response: string;               // Final agent response
  state: AgentState;              // Final execution state
  trace: ExecutionTrace;          // Complete execution trace
  success: boolean;               // Whether execution succeeded
  error?: Error;                  // Error if failed
}
```

---

### Complete Example

```typescript
import { Agent, AgentExecutor } from '@ainative/ai-kit-core/agents';
import { Calculator, WebSearch } from '@ainative/ai-kit-tools';

// Create agent
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

// Create executor
const executor = new AgentExecutor(agent, {
  maxSteps: 10,
  verbose: true
});

// Execute task
const result = await executor.execute(
  'Find the GDP of France and calculate what 15% of it would be'
);

console.log('Result:', result.response);
console.log('Trace:', result.trace);
```

---

## StreamingAgentExecutor

Stream agent responses in real-time.

### Constructor

```typescript
new StreamingAgentExecutor(agent: Agent, config?: ExecutionConfig)
```

### Methods

#### stream(input: string, onEvent: StreamCallback): Promise<ExecutionResult>

Execute agent and stream events in real-time.

```typescript
import { StreamingAgentExecutor } from '@ainative/ai-kit-core/agents';

const executor = new StreamingAgentExecutor(agent);

const result = await executor.stream(
  'Calculate 123 * 456',
  (event) => {
    switch (event.type) {
      case 'token':
        process.stdout.write(event.data.token);
        break;
      case 'tool_call':
        console.log('Calling tool:', event.data.name);
        break;
      case 'tool_result':
        console.log('Tool result:', event.data.result);
        break;
    }
  }
);
```

**Stream Events:**

```typescript
type StreamEvent =
  | { type: 'start'; data: { input: string } }
  | { type: 'token'; data: { token: string } }
  | { type: 'tool_call'; data: ToolCall }
  | { type: 'tool_result'; data: ToolResult }
  | { type: 'step_complete'; data: { step: number } }
  | { type: 'complete'; data: { response: string } }
  | { type: 'error'; data: { error: Error } };
```

---

## AgentSwarm

Multi-agent orchestration for complex tasks.

### Constructor

```typescript
new AgentSwarm(config: SwarmConfig)
```

**Parameters:**

```typescript
interface SwarmConfig {
  agents: Agent[];                 // Agents in the swarm
  coordinator?: Agent;             // Coordinator agent (optional)
  communicationMode?: 'sequential' | 'parallel' | 'hierarchical';
  maxRounds?: number;              // Max communication rounds
}
```

**Example:**

```typescript
import { AgentSwarm } from '@ainative/ai-kit-core/agents';

const researcher = new Agent({
  name: 'Researcher',
  description: 'Finds information',
  tools: [WebSearch],
  llm: { provider: 'openai', model: 'gpt-4', apiKey: process.env.OPENAI_API_KEY }
});

const analyst = new Agent({
  name: 'Analyst',
  description: 'Analyzes data',
  tools: [Calculator],
  llm: { provider: 'openai', model: 'gpt-4', apiKey: process.env.OPENAI_API_KEY }
});

const swarm = new AgentSwarm({
  agents: [researcher, analyst],
  communicationMode: 'sequential',
  maxRounds: 3
});

const result = await swarm.execute(
  'Research the GDP of major countries and calculate the average'
);
```

---

## LLM Providers

### OpenAIProvider

```typescript
import { OpenAIProvider } from '@ainative/ai-kit-core/agents/llm';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
});

const response = await provider.complete({
  messages: [{ role: 'user', content: 'Hello!' }],
  tools: agent.getToolSchemas()
});
```

### AnthropicProvider

```typescript
import { AnthropicProvider } from '@ainative/ai-kit-core/agents/llm';

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 2000
});

const response = await provider.complete({
  messages: [{ role: 'user', content: 'Hello!' }],
  tools: agent.getToolSchemas()
});
```

---

## Types

### ToolDefinition

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema;         // Zod schema for validation
  execute: (params: any) => Promise<any>;
}
```

### Example Tool

```typescript
import { z } from 'zod';

const Calculator: ToolDefinition = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number()
  }),
  async execute(params) {
    const { operation, a, b } = params;
    switch (operation) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return a / b;
    }
  }
};
```

---

## Best Practices

### 1. Provide Clear Instructions

```typescript
const agent = new Agent({
  name: 'Assistant',
  description: 'Helps users with tasks',
  instructions: `
    - Always be concise and clear
    - Show your reasoning
    - Ask for clarification if needed
    - Use tools when appropriate
  `,
  tools: [/* ... */],
  llm: { /* ... */ }
});
```

### 2. Set Appropriate Max Steps

```typescript
const executor = new AgentExecutor(agent, {
  maxSteps: 5  // Prevent infinite loops
});
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await executor.execute(input);
  if (!result.success) {
    console.error('Execution failed:', result.error);
  }
} catch (error) {
  console.error('Fatal error:', error);
}
```

### 4. Use Streaming for Better UX

```typescript
const executor = new StreamingAgentExecutor(agent);

await executor.stream(input, (event) => {
  if (event.type === 'token') {
    updateUI(event.data.token);
  }
});
```

### 5. Monitor Execution Traces

```typescript
const result = await executor.execute(input);

console.log('Total steps:', result.trace.stats.totalSteps);
console.log('Tool calls:', result.trace.stats.totalToolCalls);
console.log('Duration:', result.trace.endTime - result.trace.startTime);
```

---

## See Also

- [Tools Package](../tools/README.md)
- [Streaming API](./streaming.md)
- [Usage Tracking](./tracking.md)
- [React Hooks](../react/hooks.md)
