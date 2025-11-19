# AgentResponse Component

The `AgentResponse` component automatically renders agent responses by mapping tool results to registered UI components and displaying text responses with markdown formatting.

## Features

- **Automatic Tool Mapping**: Maps tool results to registered components using ComponentRegistry
- **Markdown Rendering**: Renders text responses with full markdown support (GFM)
- **Unknown Tool Handling**: Graceful fallback for tools without registered components
- **Error Boundaries**: Catches and displays component rendering errors
- **Streaming Support**: Real-time updates for streaming responses
- **Accessibility**: ARIA labels and semantic HTML
- **Customizable**: Themes, styles, and metadata display options

## Basic Usage

```tsx
import { AgentResponse, ComponentRegistry } from '@ainative/ai-kit';

const data = {
  response: 'The calculation result is 42.',
  steps: [
    {
      step: 1,
      thought: 'I need to perform a calculation.',
      toolResults: [
        {
          toolCallId: 'call_1',
          toolName: 'calculator',
          result: 42,
        },
      ],
    },
  ],
};

function MyApp() {
  return <AgentResponse data={data} />;
}
```

## With Custom Component Registry

Register custom components for your tools:

```tsx
import { AgentResponse, ComponentRegistry } from '@ainative/ai-kit';

// Create a registry
const registry = new ComponentRegistry();

// Define a custom component for calculator results
const CalculatorResult = ({ result }: { result: number }) => (
  <div className="calculator-result">
    <span className="result-label">Answer:</span>
    <span className="result-value">{result}</span>
  </div>
);

// Register the component
registry.register(
  'calculator',
  CalculatorResult,
  (toolResult: any) => ({ result: toolResult })
);

// Use in your app
function MyApp() {
  const data = {
    response: 'The answer is shown below.',
    steps: [
      {
        step: 1,
        toolResults: [
          {
            toolCallId: 'call_1',
            toolName: 'calculator',
            result: 42,
          },
        ],
      },
    ],
  };

  return <AgentResponse data={data} registry={registry} showSteps />;
}
```

## Props

### AgentResponseProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `AgentResponseData` | **required** | Agent response data including text and tool results |
| `registry` | `ComponentRegistry` | `undefined` | Component registry for tool-to-component mapping |
| `enableMarkdown` | `boolean` | `true` | Enable markdown rendering for text content |
| `codeTheme` | `'dark' \| 'light' \| 'vs-dark' \| 'github' \| 'monokai' \| 'nord' \| 'dracula'` | `'dark'` | Syntax highlighting theme for code blocks |
| `enableCodeCopy` | `boolean` | `true` | Enable copy button in code blocks |
| `showMetadata` | `boolean` | `false` | Display execution metadata (steps, duration, etc.) |
| `showSteps` | `boolean` | `false` | Show execution steps with thoughts and tool calls |
| `streamingState` | `'idle' \| 'streaming' \| 'complete' \| 'error'` | `'idle'` | Current streaming state |
| `className` | `string` | `''` | Additional CSS class name |
| `style` | `React.CSSProperties` | `undefined` | Custom inline styles |
| `errorFallback` | `ReactNode` | `undefined` | Custom error boundary fallback |
| `onContentUpdate` | `(content: string) => void` | `undefined` | Callback when content updates (for streaming) |
| `testId` | `string` | `'agent-response'` | Test ID for testing |

### AgentResponseData

```typescript
interface AgentResponseData {
  // Final response text
  response: string;

  // Execution steps (optional)
  steps?: Array<{
    step: number;
    thought?: string;
    toolCalls?: Array<{
      id: string;
      name: string;
      parameters: Record<string, unknown>;
    }>;
    toolResults?: Array<{
      toolCallId: string;
      toolName: string;
      result: any;
      error?: {
        message: string;
        code?: string;
        stack?: string;
      };
      metadata?: {
        durationMs: number;
        timestamp: string;
        retryCount?: number;
      };
    }>;
  }>;

  // Execution metadata (optional)
  metadata?: {
    totalSteps?: number;
    totalToolCalls?: number;
    durationMs?: number;
    model?: string;
  };
}
```

## Advanced Examples

### Streaming Response

```tsx
import { AgentResponse } from '@ainative/ai-kit';
import { useState, useEffect } from 'react';

function StreamingExample() {
  const [data, setData] = useState({
    response: '',
  });
  const [streamingState, setStreamingState] = useState('idle');

  useEffect(() => {
    // Simulate streaming
    setStreamingState('streaming');
    let content = '';
    const words = 'This is a streaming response'.split(' ');
    
    const interval = setInterval(() => {
      if (words.length === 0) {
        setStreamingState('complete');
        clearInterval(interval);
        return;
      }
      content += words.shift() + ' ';
      setData({ response: content });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <AgentResponse
      data={data}
      streamingState={streamingState}
      onContentUpdate={(content) => console.log('Updated:', content)}
    />
  );
}
```

### With Metadata and Steps

```tsx
import { AgentResponse, ComponentRegistry } from '@ainative/ai-kit';

const registry = new ComponentRegistry();

// Register components for your tools
registry.register('web_search', WebSearchResults, (data) => data);
registry.register('calculator', Calculator, (data) => ({ result: data }));

function DetailedExample() {
  const data = {
    response: '# Research Summary\n\nBased on my search and calculations...',
    steps: [
      {
        step: 1,
        thought: 'I need to search for information about React.',
        toolResults: [
          {
            toolCallId: 'search_1',
            toolName: 'web_search',
            result: [
              { title: 'React Documentation', url: 'https://react.dev' },
              { title: 'React Tutorial', url: 'https://react.dev/tutorial' },
            ],
            metadata: {
              durationMs: 1200,
              timestamp: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
      {
        step: 2,
        thought: 'Now I will calculate the total.',
        toolResults: [
          {
            toolCallId: 'calc_1',
            toolName: 'calculator',
            result: 42,
            metadata: {
              durationMs: 50,
              timestamp: '2024-01-01T00:00:01.000Z',
            },
          },
        ],
      },
    ],
    metadata: {
      totalSteps: 2,
      totalToolCalls: 2,
      durationMs: 1500,
      model: 'gpt-4',
    },
  };

  return (
    <AgentResponse
      data={data}
      registry={registry}
      showSteps
      showMetadata
      codeTheme="github"
    />
  );
}
```

### Error Handling

```tsx
import { AgentResponse } from '@ainative/ai-kit';

function ErrorExample() {
  const data = {
    response: 'An error occurred during execution.',
    steps: [
      {
        step: 1,
        toolResults: [
          {
            toolCallId: 'call_1',
            toolName: 'calculator',
            result: null,
            error: {
              message: 'Division by zero',
              code: 'MATH_ERROR',
            },
          },
        ],
      },
    ],
  };

  const customErrorFallback = (
    <div className="custom-error">
      <h3>Oops! Something went wrong</h3>
      <p>Please try again later.</p>
    </div>
  );

  return (
    <AgentResponse
      data={data}
      showSteps
      errorFallback={customErrorFallback}
    />
  );
}
```

### Custom Styling

```tsx
import { AgentResponse } from '@ainative/ai-kit';

function StyledExample() {
  const data = {
    response: 'Styled response',
  };

  return (
    <AgentResponse
      data={data}
      className="my-custom-class"
      style={{
        backgroundColor: '#f9fafb',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}
    />
  );
}
```

## Component Architecture

The `AgentResponse` component uses a modular architecture:

```
AgentResponse (Main orchestrator)
├── MarkdownRenderer (Text content)
│   └── CodeBlock (Code syntax highlighting)
├── ToolResult (Individual tool results)
│   ├── RegisteredComponent (If found in registry)
│   └── UnknownTool (Fallback for unknown tools)
└── Error Boundary (Catches rendering errors)
```

## Supporting Components

### MarkdownRenderer

Renders markdown content with GitHub Flavored Markdown support.

```tsx
import { MarkdownRenderer } from '@ainative/ai-kit';

<MarkdownRenderer
  content="# Hello\n\nThis is **markdown**"
  codeTheme="dark"
  enableCodeCopy
/>
```

### ToolResult

Renders individual tool execution results.

```tsx
import { ToolResult } from '@ainative/ai-kit';

<ToolResult
  toolName="calculator"
  result={42}
  registry={registry}
  showMetadata
/>
```

### UnknownTool

Fallback component for tools without registered components.

```tsx
import { UnknownTool } from '@ainative/ai-kit';

<UnknownTool
  toolName="unknown_tool"
  result={{ data: 'value' }}
  showRawJson
/>
```

## Accessibility

The `AgentResponse` component follows accessibility best practices:

- **Semantic HTML**: Uses proper HTML5 elements (`<section>`, `<header>`, etc.)
- **ARIA Labels**: `role="region"`, `aria-label="Agent Response"`
- **Live Regions**: `aria-live="polite"` for streaming content
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper labeling for assistive technologies

## Best Practices

1. **Always use ComponentRegistry**: Register components for better UX
2. **Handle streaming properly**: Use `streamingState` and `onContentUpdate`
3. **Show metadata in development**: Helps with debugging
4. **Provide error fallbacks**: Better UX when things go wrong
5. **Use semantic data structures**: Follow the `AgentResponseData` interface

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  AgentResponseProps,
  AgentResponseData,
  ToolResultProps,
  MarkdownRendererProps,
} from '@ainative/ai-kit';
```

## See Also

- [ComponentRegistry Documentation](./component-registry.md)
- [ToolResult Documentation](./tool-result.md)
- [Streaming Guide](./streaming.md)
