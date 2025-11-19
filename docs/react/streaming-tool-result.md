# StreamingToolResult Component

Real-time tool execution status display with progress indicators, error handling, and customizable result rendering.

## Overview

The `StreamingToolResult` component provides a comprehensive UI for displaying tool execution status as it progresses. It seamlessly transitions between states (idle → executing → success/error) and provides visual feedback at every stage.

## Features

- **Progress Indicators**: Visual feedback during tool execution with determinate and indeterminate modes
- **Real-time Status Updates**: Smooth transitions between execution states with accessible announcements
- **Error Handling**: Clear error messages with optional retry functionality
- **Success Display**: Formatted result display with JSON prettification
- **Accessibility**: Full ARIA support with live regions and semantic HTML
- **Customization**: Custom renderers for results and errors, configurable colors and display options
- **Duration Tracking**: Automatic tracking and display of execution time

## Installation

```bash
npm install @ainative/ai-kit
# or
pnpm add @ainative/ai-kit
```

## Basic Usage

### Simple Execution Display

```tsx
import { StreamingToolResult, ToolExecutionStatus } from '@ainative/ai-kit';

function ToolExecutionDemo() {
  const [status, setStatus] = useState<ToolExecutionStatus>({
    state: 'executing',
    toolName: 'web_search',
    message: 'Searching the web...',
    progress: 50,
  });

  return (
    <StreamingToolResult
      status={status}
      showProgress
      showStatusMessage
    />
  );
}
```

### Complete Workflow Example

```tsx
import {
  StreamingToolResult,
  ToolExecutionStatus,
  ToolResultData
} from '@ainative/ai-kit';

function ToolWorkflow() {
  const [status, setStatus] = useState<ToolExecutionStatus>({
    state: 'idle',
    toolName: 'calculator',
  });

  const [result, setResult] = useState<ToolResultData | undefined>();

  const executeTool = async () => {
    // Start execution
    setStatus({
      state: 'executing',
      toolName: 'calculator',
      message: 'Calculating...',
      startTime: new Date().toISOString(),
    });

    try {
      // Simulate tool execution
      const response = await callTool();

      setResult({
        toolCallId: 'call_123',
        toolName: 'calculator',
        result: response.data,
        metadata: {
          durationMs: 1500,
          timestamp: new Date().toISOString(),
        },
      });

      setStatus({
        state: 'success',
        toolName: 'calculator',
        endTime: new Date().toISOString(),
        durationMs: 1500,
      });
    } catch (error) {
      setStatus({
        state: 'error',
        toolName: 'calculator',
        error: error.message,
        endTime: new Date().toISOString(),
      });
    }
  };

  return (
    <div>
      <button onClick={executeTool}>Execute Tool</button>

      <StreamingToolResult
        status={status}
        result={result}
        enableRetry
        onRetry={executeTool}
        onComplete={(result) => console.log('Tool completed:', result)}
        onError={(error) => console.error('Tool failed:', error)}
      />
    </div>
  );
}
```

## State Management

### Execution States

The component supports four execution states:

1. **`idle`**: Tool is ready but not executing
2. **`executing`**: Tool is currently running
3. **`success`**: Tool completed successfully
4. **`error`**: Tool execution failed

### Status Updates

```tsx
// Idle state
const idleStatus: ToolExecutionStatus = {
  state: 'idle',
  toolName: 'my_tool',
};

// Executing with indeterminate progress
const executingStatus: ToolExecutionStatus = {
  state: 'executing',
  toolName: 'my_tool',
  message: 'Processing request...',
};

// Executing with determinate progress
const progressStatus: ToolExecutionStatus = {
  state: 'executing',
  toolName: 'my_tool',
  message: 'Processing request...',
  progress: 75, // 0-100
};

// Success state
const successStatus: ToolExecutionStatus = {
  state: 'success',
  toolName: 'my_tool',
  durationMs: 2500,
};

// Error state
const errorStatus: ToolExecutionStatus = {
  state: 'error',
  toolName: 'my_tool',
  error: 'Connection timeout',
};
```

## Progress Indicators

### Indeterminate Progress

Shows continuous animation when progress is unknown:

```tsx
<StreamingToolResult
  status={{
    state: 'executing',
    toolName: 'web_search',
    message: 'Searching...',
  }}
  showProgress
/>
```

### Determinate Progress

Shows specific progress percentage:

```tsx
<StreamingToolResult
  status={{
    state: 'executing',
    toolName: 'file_upload',
    message: 'Uploading file...',
    progress: 65, // 65%
  }}
  showProgress
  progressColor="#10b981"
/>
```

## Customization

### Custom Result Rendering

```tsx
<StreamingToolResult
  status={status}
  result={result}
  renderResult={(result) => (
    <div className="custom-result">
      <h3>Custom Result Display</h3>
      <pre>{JSON.stringify(result.result, null, 2)}</pre>
      <p>Completed at: {result.metadata?.timestamp}</p>
    </div>
  )}
/>
```

### Custom Error Rendering

```tsx
<StreamingToolResult
  status={status}
  renderError={(error) => (
    <div className="custom-error">
      <h3>Oops! Something went wrong</h3>
      <p>{error}</p>
      <button onClick={handleSupport}>Contact Support</button>
    </div>
  )}
/>
```

### Custom Styling

```tsx
<StreamingToolResult
  status={status}
  result={result}
  className="my-custom-class"
  style={{
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }}
  progressColor="#8b5cf6"
/>
```

## Display Options

### Show/Hide Features

```tsx
<StreamingToolResult
  status={status}
  result={result}
  // Display options
  showProgress={true}           // Show progress bar during execution
  showStatusMessage={true}      // Show status message text
  showToolName={true}          // Show tool name in header
  showDuration={true}          // Show execution duration
/>
```

### Hide All Extras

Minimal display with just the essential information:

```tsx
<StreamingToolResult
  status={status}
  result={result}
  showProgress={false}
  showStatusMessage={false}
  showToolName={false}
  showDuration={false}
/>
```

## Error Handling and Retry

### Enable Retry Functionality

```tsx
function ToolWithRetry() {
  const [status, setStatus] = useState<ToolExecutionStatus>({
    state: 'error',
    toolName: 'api_call',
    error: 'Network connection failed',
  });

  const handleRetry = () => {
    setStatus({ state: 'executing', toolName: 'api_call' });
    // Retry logic here
  };

  return (
    <StreamingToolResult
      status={status}
      enableRetry
      onRetry={handleRetry}
    />
  );
}
```

### Error Callbacks

```tsx
<StreamingToolResult
  status={status}
  result={result}
  onError={(error) => {
    // Log to analytics
    analytics.track('tool_execution_failed', { error });

    // Show toast notification
    toast.error(`Tool failed: ${error}`);

    // Send to error monitoring
    errorMonitoring.captureException(new Error(error));
  }}
/>
```

## Lifecycle Callbacks

### On Complete

Triggered when execution succeeds:

```tsx
<StreamingToolResult
  status={status}
  result={result}
  onComplete={(result) => {
    console.log('Tool completed successfully');
    console.log('Result:', result.result);
    console.log('Duration:', result.metadata?.durationMs);

    // Update parent state
    saveResult(result);

    // Navigate to next step
    nextStep();
  }}
/>
```

### On Error

Triggered when execution fails:

```tsx
<StreamingToolResult
  status={status}
  onError={(error) => {
    console.error('Tool execution failed:', error);

    // Show user-friendly error
    showErrorNotification(error);

    // Attempt recovery
    attemptRecovery();
  }}
/>
```

## Integration with StreamingAgentExecutor

Use with the agent execution system from AIKIT-11:

```tsx
import { StreamingAgentExecutor } from '@ainative/ai-kit-core';
import { StreamingToolResult, ToolExecutionStatus } from '@ainative/ai-kit';

function AgentToolExecution() {
  const [toolStatus, setToolStatus] = useState<ToolExecutionStatus>({
    state: 'idle',
  });
  const [toolResult, setToolResult] = useState<ToolResultData>();

  const executeAgent = async () => {
    const executor = new StreamingAgentExecutor(agent);

    for await (const event of executor.stream(input)) {
      if (event.type === 'tool_call') {
        setToolStatus({
          state: 'executing',
          toolName: event.toolCall.name,
          message: `Calling ${event.toolCall.name}...`,
        });
      }

      if (event.type === 'tool_result') {
        if (event.result.error) {
          setToolStatus({
            state: 'error',
            toolName: event.result.toolName,
            error: event.result.error.message,
          });
        } else {
          setToolStatus({
            state: 'success',
            toolName: event.result.toolName,
          });
          setToolResult(event.result);
        }
      }
    }
  };

  return (
    <div>
      <button onClick={executeAgent}>Run Agent</button>
      <StreamingToolResult status={toolStatus} result={toolResult} />
    </div>
  );
}
```

## Accessibility Features

The component is fully accessible with:

- **ARIA Live Regions**: Status updates announced to screen readers
- **ARIA Labels**: Descriptive labels for all states
- **ARIA Busy**: Indicates when tool is executing
- **Semantic HTML**: Proper use of roles and attributes
- **Keyboard Navigation**: Full keyboard support for retry button

### Custom ARIA Labels

```tsx
<StreamingToolResult
  status={status}
  result={result}
  ariaLabel="Web search tool execution status"
/>
```

## Advanced Patterns

### Progress Simulation

Simulate progress for long-running operations:

```tsx
function ToolWithProgressSimulation() {
  const [status, setStatus] = useState<ToolExecutionStatus>({
    state: 'executing',
    toolName: 'data_processing',
    progress: 0,
  });

  useEffect(() => {
    if (status.state === 'executing') {
      const interval = setInterval(() => {
        setStatus((prev) => ({
          ...prev,
          progress: Math.min((prev.progress || 0) + 5, 95),
        }));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [status.state]);

  return <StreamingToolResult status={status} />;
}
```

### Multi-Tool Execution

Display multiple tools executing:

```tsx
function MultiToolExecution() {
  const [tools, setTools] = useState<Map<string, ToolExecutionStatus>>(new Map());

  return (
    <div className="tools-grid">
      {Array.from(tools.entries()).map(([id, status]) => (
        <StreamingToolResult
          key={id}
          status={status}
          testId={`tool-${id}`}
        />
      ))}
    </div>
  );
}
```

### Duration Tracking

Track execution time automatically:

```tsx
function ToolWithDuration() {
  const [status, setStatus] = useState<ToolExecutionStatus>({
    state: 'idle',
    toolName: 'database_query',
  });

  const execute = async () => {
    const startTime = new Date().toISOString();

    setStatus({
      state: 'executing',
      toolName: 'database_query',
      startTime,
    });

    // Execute tool
    const result = await runQuery();

    const endTime = new Date().toISOString();
    const durationMs =
      new Date(endTime).getTime() - new Date(startTime).getTime();

    setStatus({
      state: 'success',
      toolName: 'database_query',
      startTime,
      endTime,
      durationMs,
    });
  };

  return (
    <StreamingToolResult
      status={status}
      showDuration
    />
  );
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `ToolExecutionStatus` | Required | Current execution status |
| `result` | `ToolResultData` | `undefined` | Tool result data (shown on success) |
| `progressColor` | `string` | `'#3b82f6'` | Progress bar color |
| `showProgress` | `boolean` | `true` | Show progress bar during execution |
| `showStatusMessage` | `boolean` | `true` | Show status message |
| `showToolName` | `boolean` | `true` | Show tool name in header |
| `showDuration` | `boolean` | `true` | Show execution duration |
| `enableRetry` | `boolean` | `false` | Enable retry button on error |
| `onRetry` | `() => void` | `undefined` | Retry callback |
| `onComplete` | `(result) => void` | `undefined` | Called when execution succeeds |
| `onError` | `(error) => void` | `undefined` | Called when execution fails |
| `renderResult` | `(result) => ReactNode` | `undefined` | Custom result renderer |
| `renderError` | `(error) => ReactNode` | `undefined` | Custom error renderer |
| `className` | `string` | `''` | Custom CSS class |
| `style` | `CSSProperties` | `undefined` | Custom inline styles |
| `testId` | `string` | `'streaming-tool-result'` | Test ID for testing |
| `ariaLabel` | `string` | Auto-generated | Custom ARIA label |

### ToolExecutionStatus Type

```typescript
interface ToolExecutionStatus {
  state: 'idle' | 'executing' | 'success' | 'error';
  progress?: number;        // 0-100 for determinate progress
  message?: string;         // Status message to display
  toolName?: string;        // Name of the tool
  error?: string;           // Error message if state is 'error'
  startTime?: string;       // ISO timestamp
  endTime?: string;         // ISO timestamp
  durationMs?: number;      // Duration in milliseconds
}
```

### ToolResultData Type

```typescript
interface ToolResultData {
  toolCallId: string;       // Unique tool call ID
  toolName: string;         // Name of the tool
  result: unknown;          // Result data
  error?: {                 // Error information
    message: string;
    code?: string;
    stack?: string;
  };
  metadata?: {              // Execution metadata
    durationMs?: number;
    timestamp?: string;
    retryCount?: number;
  };
}
```

## Related Components

- **[ProgressBar](./progress-bar.md)**: Standalone progress indicator component
- **[StreamingMessage](./streaming-message.md)**: Display streaming AI messages
- **[AgentResponse](./agent-response.md)**: Complete agent response display (AIKIT-18)

## Best Practices

1. **Always provide toolName**: Helps users understand what's executing
2. **Use determinate progress when possible**: More informative than indeterminate
3. **Provide clear status messages**: Guide users through the execution process
4. **Handle errors gracefully**: Use onError callback and consider enabling retry
5. **Track duration**: Helps identify slow operations and optimize
6. **Use custom renderers for complex results**: Provide better UX for specific data types
7. **Make it accessible**: Use ariaLabel for screen reader users
8. **Test different states**: Ensure UI works well in all execution states

## Examples Repository

Find complete working examples in the [examples/react/streaming-tool-result](../../examples/react/streaming-tool-result) directory.

## Support

- **Issues**: [GitHub Issues](https://github.com/AINative-Studio/ai-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AINative-Studio/ai-kit/discussions)
- **Documentation**: [AI Kit Docs](https://ai-kit.ainative.studio)
