# Streaming Agent Execution Examples

This directory contains comprehensive examples demonstrating the StreamingAgentExecutor feature (AIKIT-11).

## Examples

### 1. Basic Streaming (`streaming-agent-basic.ts`)

A simple example showing the fundamentals of streaming agent execution:

- Creating an agent with a calculator tool
- Using `StreamingAgentExecutor` to stream events
- Handling different event types (step, thought, tool_call, tool_result, final_answer)
- Displaying real-time progress

**Run:**
```bash
ts-node examples/streaming-agent-basic.ts
```

### 2. Advanced Usage (`streaming-agent-advanced.ts`)

Advanced patterns and techniques:

- Multiple tools (weather, search, calculator)
- Event aggregation for UI state management
- Event filtering and processing
- Performance monitoring
- Tool usage statistics

**Run:**
```bash
ts-node examples/streaming-agent-advanced.ts
```

### 3. React Integration (`streaming-agent-react.tsx`)

React component and hooks for UI integration:

- Custom `useStreamingAgent` hook
- Real-time event display with auto-scroll
- Abort/cancel functionality
- TailwindCSS-styled UI components
- Event visualization with icons and colors

**Key Features:**
- Type-safe event handling
- Automatic UI updates as agent thinks
- Clean component architecture
- Reusable hook pattern

## Key Concepts

### Event Types

The streaming executor emits the following event types:

1. **step**: Agent starts a new execution step
2. **thought**: Agent's reasoning/thinking (LLM response content)
3. **tool_call**: Agent decides to call a tool
4. **tool_result**: Result from tool execution
5. **final_answer**: Agent's final response
6. **error**: An error occurred

### Async Iterator Pattern

All examples use the async iterator pattern for consuming events:

```typescript
for await (const event of executor.stream(input)) {
  // Handle event
  switch (event.type) {
    case 'thought':
      console.log('Agent thinking:', event.content);
      break;
    case 'tool_call':
      console.log('Calling tool:', event.toolCall.name);
      break;
    case 'final_answer':
      console.log('Final answer:', event.answer);
      break;
  }
}
```

### Real-Time UI Updates

The streaming approach enables real-time UI updates:

```typescript
for await (const event of executor.stream(input)) {
  // Update UI state
  setEvents(prev => [...prev, event]);

  // Update specific UI elements based on event type
  if (event.type === 'thought') {
    setCurrentThought(event.content);
  }
}
```

## Environment Setup

Set your API keys in environment variables:

```bash
export OPENAI_API_KEY="your-key-here"
# or
export ANTHROPIC_API_KEY="your-key-here"
```

## TypeScript Configuration

All examples are fully typed. The streaming executor provides type-safe events:

```typescript
import {
  AgentExecutionEvent,
  ThoughtEvent,
  ToolCallEvent,
  ToolResultEvent,
  FinalAnswerEvent,
} from '@ainative/ai-kit-core/agents';

// Type narrowing with discriminated unions
function handleEvent(event: AgentExecutionEvent) {
  if (event.type === 'thought') {
    // TypeScript knows this is ThoughtEvent
    console.log(event.content);
  }
}
```

## Performance Considerations

- Events are emitted as they occur, enabling immediate UI updates
- No buffering or batching - true real-time streaming
- Minimal overhead compared to non-streaming execution
- Execution trace is still built for post-execution analysis

## Best Practices

1. **Always handle errors**: Wrap streaming loops in try-catch
2. **Display progress**: Show step numbers and current activity
3. **Implement abort**: Allow users to cancel long-running executions
4. **Aggregate state**: Build UI state from events for complex UIs
5. **Type-safe handlers**: Use TypeScript's discriminated unions

## Further Reading

- [Agent Orchestration Documentation](../docs/agents.md)
- [Tool Development Guide](../docs/tools.md)
- [LLM Provider Configuration](../docs/llm-providers.md)
