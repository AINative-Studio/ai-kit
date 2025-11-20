# React Integration Guide

Complete guide for integrating AI Kit with React 18+ applications. This guide covers hooks, components, state management, streaming, and production deployment patterns.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Core Integration](#core-integration)
3. [Hooks Reference](#hooks-reference)
4. [Component Patterns](#component-patterns)
5. [State Management](#state-management)
6. [Streaming & Suspense](#streaming--suspense)
7. [Error Boundaries](#error-boundaries)
8. [Performance Optimization](#performance-optimization)
9. [Server Components vs Client Components](#server-components-vs-client-components)
10. [Complete Examples](#complete-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Prerequisites

Before integrating AI Kit with React, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **React**: Version 18.0.0 or higher
- **TypeScript**: Version 5.0 or higher (recommended)
- **Build Tool**: Vite, Create React App, or Next.js

Check your versions:

```bash
node --version    # Should be v18.0.0+
npm list react    # Should be 18.0.0+
```

### Installation

Install AI Kit for React:

```bash
# Using npm
npm install @ainative/ai-kit

# Using yarn
yarn add @ainative/ai-kit

# Using pnpm
pnpm add @ainative/ai-kit

# Using bun
bun add @ainative/ai-kit
```

### TypeScript Configuration

For optimal TypeScript support, update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["@ainative/ai-kit/types"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Environment Variables

Create a `.env` file in your project root:

```bash
# .env

# LLM Provider API Keys
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...

# AI Kit Configuration
VITE_AIKIT_ENDPOINT=http://localhost:3000/api
VITE_AIKIT_LOG_LEVEL=info

# AINative Services (Optional)
VITE_AINATIVE_API_URL=https://api.ainative.studio
VITE_AINATIVE_PROJECT_ID=your-project-id
```

**Security Note**: Never expose API keys to the client. Use server-side API routes for LLM calls.

### Project Structure

Organize your React AI Kit project:

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   ├── agents/
│   │   ├── AgentDashboard.tsx
│   │   └── AgentCard.tsx
│   └── ui/
│       ├── StreamingMessage.tsx
│       └── ToolResult.tsx
├── hooks/
│   ├── useChat.ts
│   ├── useAgent.ts
│   └── useUsageTracking.ts
├── lib/
│   ├── ai-config.ts
│   ├── tools.ts
│   └── agents.ts
├── stores/
│   ├── conversationStore.ts
│   └── usageStore.ts
├── types/
│   └── ai.types.ts
└── App.tsx
```

---

## Core Integration

### Basic Streaming Setup

The simplest way to integrate AI streaming in React:

```tsx
// components/SimpleChat.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState } from 'react'

export default function SimpleChat() {
  const [input, setInput] = useState('')

  const { messages, send, isStreaming } = useAIStream({
    endpoint: '/api/chat',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    await send(input)
    setInput('')
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming}>
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

### Advanced Streaming with Options

Full-featured streaming configuration:

```tsx
// components/AdvancedChat.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState, useCallback } from 'react'

export default function AdvancedChat() {
  const [input, setInput] = useState('')

  const {
    messages,
    send,
    isStreaming,
    error,
    retry,
    reset,
    usage,
    abort,
  } = useAIStream({
    endpoint: '/api/chat',
    systemPrompt: 'You are a helpful assistant.',
    maxTokens: 2048,
    temperature: 0.7,
    cache: {
      ttl: 3600000, // 1 hour
      key: (messages) => JSON.stringify(messages.slice(-5)),
    },
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
      onRetry: (attempt) => {
        console.log(`Retry attempt ${attempt}`)
      },
    },
    onToken: (token) => {
      console.log('Token received:', token)
    },
    onComplete: (message) => {
      console.log('Complete message:', message)
    },
    onCost: (usage) => {
      console.log('Cost:', usage.estimatedCost)
      console.log('Tokens:', usage.totalTokens)
    },
    onError: (err) => {
      console.error('Stream error:', err)
    },
  })

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isStreaming) return

      await send(input)
      setInput('')
    },
    [input, isStreaming, send]
  )

  const handleAbort = useCallback(() => {
    abort()
  }, [abort])

  return (
    <div className="advanced-chat">
      <div className="chat-header">
        <h2>AI Assistant</h2>
        <div className="stats">
          <span>Messages: {messages.length}</span>
          <span>Tokens: {usage.totalTokens}</span>
          <span>Cost: ${usage.estimatedCost.toFixed(4)}</span>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {error && (
          <div className="error">
            <p>{error.message}</p>
            <button onClick={retry}>Retry</button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming}>
          Send
        </button>
        {isStreaming && (
          <button type="button" onClick={handleAbort}>
            Stop
          </button>
        )}
        <button type="button" onClick={reset}>
          Clear
        </button>
      </form>
    </div>
  )
}
```

### Agent Integration

Using AI agents with React:

```tsx
// components/AgentChat.tsx
import { useAgent } from '@ainative/ai-kit/react'
import { assistantAgent } from '@/lib/agents'
import { useState } from 'react'

export default function AgentChat() {
  const [input, setInput] = useState('')

  const { run, stream, isRunning, result, steps, error } = useAgent(
    assistantAgent
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isRunning) return

    await run(input)
    setInput('')
  }

  return (
    <div className="agent-chat">
      <div className="results">
        {result && (
          <div className="final-answer">
            <h3>Answer:</h3>
            <p>{result.answer}</p>
          </div>
        )}

        {steps.length > 0 && (
          <details className="execution-steps">
            <summary>View Execution Steps ({steps.length})</summary>
            <ul>
              {steps.map((step, i) => (
                <li key={i}>
                  <strong>{step.type}:</strong> {step.content}
                  {step.toolName && <em> (Tool: {step.toolName})</em>}
                </li>
              ))}
            </ul>
          </details>
        )}

        {error && (
          <div className="error">
            <p>Error: {error.message}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent..."
          disabled={isRunning}
        />
        <button type="submit" disabled={isRunning}>
          {isRunning ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

### Tool Usage

Creating and using custom tools:

```tsx
// lib/tools.ts
import { Tool } from '@ainative/ai-kit/core'

export const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City and state, e.g. San Francisco, CA',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'fahrenheit',
      },
    },
    required: ['location'],
  },
  execute: async ({ location, unit }) => {
    // Call weather API
    const response = await fetch(
      `/api/weather?location=${location}&unit=${unit}`
    )
    return await response.json()
  },
}

export const calculatorTool: Tool = {
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate',
      },
    },
    required: ['expression'],
  },
  execute: async ({ expression }) => {
    try {
      // Use a safe math evaluator in production
      const result = eval(expression)
      return { result }
    } catch (error) {
      return { error: 'Invalid expression' }
    }
  },
}
```

### Context Management

Managing conversation context:

```tsx
// hooks/useConversation.ts
import { useAIStream } from '@ainative/ai-kit/react'
import { ConversationStore } from '@ainative/ai-kit/core'
import { useEffect } from 'react'

const store = new ConversationStore({
  provider: 'localStorage',
  maxMessages: 100,
})

export function useConversation(conversationId: string) {
  const stream = useAIStream({
    endpoint: '/api/chat',
  })

  // Load conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      const messages = await store.load(conversationId)
      // Initialize stream with loaded messages
      messages.forEach((msg) => {
        // Add to stream (implementation-specific)
      })
    }

    loadConversation()
  }, [conversationId])

  // Save on message complete
  useEffect(() => {
    const saveConversation = async () => {
      await store.save(conversationId, stream.messages)
    }

    if (stream.messages.length > 0) {
      saveConversation()
    }
  }, [conversationId, stream.messages])

  return stream
}
```

---

## Hooks Reference

### useAIStream

The primary hook for streaming LLM responses.

**Signature:**

```typescript
function useAIStream(config: StreamConfig): StreamState
```

**Configuration:**

```typescript
interface StreamConfig {
  endpoint: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  cache?: boolean | CacheConfig
  retry?: RetryConfig
  timeout?: number
  headers?: Record<string, string>
  onToken?: (token: string) => void
  onComplete?: (message: Message) => void
  onCost?: (usage: Usage) => void
  onError?: (error: Error) => void
}
```

**Return Value:**

```typescript
interface StreamState {
  messages: Message[]
  send: (content: string | Message) => Promise<void>
  isStreaming: boolean
  error: Error | null
  retry: () => Promise<void>
  reset: () => void
  abort: () => void
  usage: Usage
}
```

**Example:**

```tsx
const { messages, send, isStreaming, error, retry, reset, usage } =
  useAIStream({
    endpoint: '/api/chat',
    systemPrompt: 'You are a helpful assistant.',
    maxTokens: 2048,
    temperature: 0.7,
    cache: true,
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
    },
    onCost: (usage) => {
      console.log('Cost:', usage.estimatedCost)
    },
  })
```

### useAgent

Hook for executing AI agents with tools.

**Signature:**

```typescript
function useAgent(agent: AgentExecutor): AgentState
```

**Return Value:**

```typescript
interface AgentState {
  run: (input: string) => Promise<AgentResult>
  stream: (input: string) => AsyncIterator<AgentStep>
  isRunning: boolean
  result: AgentResult | null
  steps: AgentStep[]
  error: Error | null
}
```

**Example:**

```tsx
import { useAgent } from '@ainative/ai-kit/react'
import { myAgent } from '@/lib/agents'

function AgentComponent() {
  const { run, isRunning, result, steps } = useAgent(myAgent)

  const handleRun = async () => {
    await run('What is the weather in San Francisco?')
  }

  return (
    <div>
      <button onClick={handleRun} disabled={isRunning}>
        Run Agent
      </button>
      {result && <div>{result.answer}</div>}
      {steps.map((step, i) => (
        <div key={i}>{step.content}</div>
      ))}
    </div>
  )
}
```

### useConversation

Hook for managing persistent conversations.

**Signature:**

```typescript
function useConversation(
  conversationId: string,
  options?: ConversationOptions
): ConversationState
```

**Return Value:**

```typescript
interface ConversationState {
  messages: Message[]
  isLoading: boolean
  save: () => Promise<void>
  load: () => Promise<void>
  clear: () => Promise<void>
  update: (messageId: string, content: string) => Promise<void>
}
```

**Example:**

```tsx
import { useConversation } from '@ainative/ai-kit/react'

function ConversationComponent({ userId }: { userId: string }) {
  const conversationId = `user-${userId}-chat`

  const { messages, isLoading, save, load, clear } = useConversation(
    conversationId,
    {
      autoSave: true,
      maxMessages: 100,
    }
  )

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      {isLoading && <div>Loading conversation...</div>}
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={clear}>Clear History</button>
    </div>
  )
}
```

### useUsage

Hook for tracking LLM usage and costs.

**Signature:**

```typescript
function useUsage(filters?: UsageFilters): UsageState
```

**Return Value:**

```typescript
interface UsageState {
  usage: UsageReport
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}
```

**Example:**

```tsx
import { useUsage } from '@ainative/ai-kit/react'

function UsageComponent({ userId }: { userId: string }) {
  const { usage, isLoading, refresh } = useUsage({
    userId,
    dateRange: [startDate, endDate],
  })

  return (
    <div>
      <h2>Usage Stats</h2>
      <p>Total Cost: ${usage.totalCost.toFixed(2)}</p>
      <p>Total Tokens: {usage.totalTokens}</p>
      <p>Average Latency: {usage.avgLatency}ms</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

### useMemory

Hook for long-term conversation memory.

**Signature:**

```typescript
function useMemory(userId: string): MemoryState
```

**Return Value:**

```typescript
interface MemoryState {
  store: (key: string, value: any) => Promise<void>
  retrieve: (key: string) => Promise<any>
  search: (query: string) => Promise<any[]>
  enrich: (prompt: string) => Promise<string>
}
```

**Example:**

```tsx
import { useMemory } from '@ainative/ai-kit/react'

function MemoryComponent({ userId }: { userId: string }) {
  const { store, retrieve, search, enrich } = useMemory(userId)

  useEffect(() => {
    // Store user preferences
    store('preferences', {
      theme: 'dark',
      language: 'en',
    })
  }, [store])

  const handleEnrich = async (prompt: string) => {
    // Enrich prompt with relevant memories
    const enrichedPrompt = await enrich(prompt)
    console.log('Enriched:', enrichedPrompt)
  }

  return <div>{/* UI */}</div>
}
```

---

## Component Patterns

### Message Component

Reusable message component with markdown support:

```tsx
// components/Message.tsx
import { Message as MessageType } from '@ainative/ai-kit/core'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

interface MessageProps {
  message: MessageType
  isStreaming?: boolean
}

export function Message({ message, isStreaming }: MessageProps) {
  return (
    <div className={`message ${message.role}`}>
      <div className="message-header">
        <div className="avatar">
          {message.role === 'user' ? '👤' : '🤖'}
        </div>
        <div className="metadata">
          <strong>{message.role === 'user' ? 'You' : 'Assistant'}</strong>
          <span className="timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="message-content">
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter language={match[1]} PreTag="div" {...props}>
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        >
          {message.content}
        </ReactMarkdown>

        {isStreaming && <span className="cursor">▋</span>}
      </div>
    </div>
  )
}
```

### Streaming Message Component

Component with typing indicator:

```tsx
// components/StreamingMessage.tsx
import { useState, useEffect } from 'react'

interface StreamingMessageProps {
  content: string
  isStreaming: boolean
  typingSpeed?: number
}

export function StreamingMessage({
  content,
  isStreaming,
  typingSpeed = 20,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('')

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content)
      return
    }

    let index = displayedContent.length
    const interval = setInterval(() => {
      if (index < content.length) {
        setDisplayedContent(content.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, typingSpeed)

    return () => clearInterval(interval)
  }, [content, isStreaming, typingSpeed, displayedContent.length])

  return (
    <div className="streaming-message">
      {displayedContent}
      {isStreaming && <span className="cursor-blink">▋</span>}
    </div>
  )
}
```

### Tool Result Component

Display tool execution results:

```tsx
// components/ToolResult.tsx
import { ToolResult as ToolResultType } from '@ainative/ai-kit/core'

interface ToolResultProps {
  result: ToolResultType
  components?: Record<string, React.ComponentType<any>>
}

export function ToolResult({ result, components = {} }: ToolResultProps) {
  const Component = components[result.toolName]

  if (Component) {
    return <Component result={result.data} />
  }

  return (
    <div className="tool-result">
      <div className="tool-header">
        <span className="tool-icon">🔧</span>
        <strong>{result.toolName}</strong>
      </div>

      <div className="tool-output">
        <pre>{JSON.stringify(result.data, null, 2)}</pre>
      </div>
    </div>
  )
}
```

### Agent Dashboard Component

Display agent execution progress:

```tsx
// components/AgentDashboard.tsx
import { AgentStep } from '@ainative/ai-kit/core'
import { ToolResult } from './ToolResult'

interface AgentDashboardProps {
  steps: AgentStep[]
  isRunning: boolean
}

export function AgentDashboard({ steps, isRunning }: AgentDashboardProps) {
  return (
    <div className="agent-dashboard">
      <div className="dashboard-header">
        <h3>Agent Execution</h3>
        {isRunning && <span className="status running">Running...</span>}
      </div>

      <div className="execution-timeline">
        {steps.map((step, index) => (
          <div key={index} className={`step ${step.type}`}>
            <div className="step-number">{index + 1}</div>

            <div className="step-content">
              <strong className="step-type">{step.type}</strong>

              {step.type === 'thought' && (
                <p className="thought">{step.content}</p>
              )}

              {step.type === 'tool_call' && (
                <div className="tool-call">
                  <p>
                    Calling tool: <code>{step.toolName}</code>
                  </p>
                  <pre>{JSON.stringify(step.parameters, null, 2)}</pre>
                </div>
              )}

              {step.type === 'tool_result' && (
                <ToolResult result={step.result} />
              )}

              {step.type === 'answer' && (
                <div className="final-answer">
                  <p>{step.content}</p>
                </div>
              )}
            </div>

            <div className="step-timestamp">
              {new Date(step.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Usage Dashboard Component

Display usage statistics:

```tsx
// components/UsageDashboard.tsx
import { useUsage } from '@ainative/ai-kit/react'
import { useState } from 'react'

interface UsageDashboardProps {
  userId: string
}

export function UsageDashboard({ userId }: UsageDashboardProps) {
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date(),
  ])

  const { usage, isLoading, refresh } = useUsage({
    userId,
    dateRange,
  })

  if (isLoading) {
    return <div>Loading usage data...</div>
  }

  return (
    <div className="usage-dashboard">
      <div className="dashboard-header">
        <h2>Usage Statistics</h2>
        <button onClick={refresh}>Refresh</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Cost</h3>
          <p className="stat-value">${usage.totalCost.toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <h3>Total Tokens</h3>
          <p className="stat-value">{usage.totalTokens.toLocaleString()}</p>
        </div>

        <div className="stat-card">
          <h3>Requests</h3>
          <p className="stat-value">{usage.requestCount}</p>
        </div>

        <div className="stat-card">
          <h3>Avg Latency</h3>
          <p className="stat-value">{usage.avgLatency.toFixed(0)}ms</p>
        </div>
      </div>

      <div className="breakdown">
        <h3>By Model</h3>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Requests</th>
              <th>Tokens</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(usage.breakdown.byModel).map(([model, stats]) => (
              <tr key={model}>
                <td>{model}</td>
                <td>{stats.requests}</td>
                <td>{stats.tokens}</td>
                <td>${stats.cost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## State Management

### Redux Integration

Integrate AI Kit with Redux:

```typescript
// store/aiSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { AIStream } from '@ainative/ai-kit/core'

const stream = new AIStream({ endpoint: '/api/chat' })

export const sendMessage = createAsyncThunk(
  'ai/sendMessage',
  async (content: string) => {
    await stream.send(content)
    return stream.getMessages()
  }
)

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    messages: [],
    isStreaming: false,
    error: null,
  },
  reducers: {
    resetChat: (state) => {
      state.messages = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isStreaming = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages = action.payload
        state.isStreaming = false
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.error.message
        state.isStreaming = false
      })
  },
})

export const { resetChat } = aiSlice.actions
export default aiSlice.reducer
```

**Using with React:**

```tsx
// components/ReduxChat.tsx
import { useDispatch, useSelector } from 'react-redux'
import { sendMessage, resetChat } from '@/store/aiSlice'
import { useState } from 'react'

export function ReduxChat() {
  const dispatch = useDispatch()
  const { messages, isStreaming, error } = useSelector((state) => state.ai)
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    dispatch(sendMessage(input))
    setInput('')
  }

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming}>
          Send
        </button>
      </form>

      <button onClick={() => dispatch(resetChat())}>Reset</button>
    </div>
  )
}
```

### Zustand Integration

Integrate AI Kit with Zustand:

```typescript
// stores/aiStore.ts
import { create } from 'zustand'
import { AIStream, Message } from '@ainative/ai-kit/core'

const stream = new AIStream({
  endpoint: '/api/chat',
  onToken: (token) => {
    useAIStore.getState().updateStreamingContent(token)
  },
})

interface AIStore {
  messages: Message[]
  isStreaming: boolean
  error: Error | null
  streamingContent: string
  send: (content: string) => Promise<void>
  reset: () => void
  updateStreamingContent: (token: string) => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  error: null,
  streamingContent: '',

  send: async (content: string) => {
    set({ isStreaming: true, error: null, streamingContent: '' })

    try {
      await stream.send(content)
      set({
        messages: stream.getMessages(),
        isStreaming: false,
        streamingContent: '',
      })
    } catch (error) {
      set({ error, isStreaming: false })
    }
  },

  reset: () => {
    stream.reset()
    set({ messages: [], error: null, streamingContent: '' })
  },

  updateStreamingContent: (token: string) => {
    set((state) => ({
      streamingContent: state.streamingContent + token,
    }))
  },
}))
```

**Using with React:**

```tsx
// components/ZustandChat.tsx
import { useAIStore } from '@/stores/aiStore'
import { useState } from 'react'

export function ZustandChat() {
  const { messages, isStreaming, send, reset, streamingContent } = useAIStore()
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    await send(input)
    setInput('')
  }

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {streamingContent && <div>{streamingContent}</div>}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming}>
          Send
        </button>
      </form>

      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### Context API Integration

Using React Context for AI state:

```tsx
// contexts/AIContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { AIStream, Message } from '@ainative/ai-kit/core'

interface AIContextValue {
  messages: Message[]
  isStreaming: boolean
  error: Error | null
  send: (content: string) => Promise<void>
  reset: () => void
}

const AIContext = createContext<AIContextValue | null>(null)

export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const stream = useState(
    () =>
      new AIStream({
        endpoint: '/api/chat',
        onComplete: (message) => {
          setMessages(stream.getMessages())
        },
      })
  )[0]

  const send = useCallback(
    async (content: string) => {
      setIsStreaming(true)
      setError(null)

      try {
        await stream.send(content)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsStreaming(false)
      }
    },
    [stream]
  )

  const reset = useCallback(() => {
    stream.reset()
    setMessages([])
    setError(null)
  }, [stream])

  return (
    <AIContext.Provider value={{ messages, isStreaming, error, send, reset }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}
```

**Usage:**

```tsx
// App.tsx
import { AIProvider, useAI } from '@/contexts/AIContext'

function ChatComponent() {
  const { messages, send, isStreaming } = useAI()
  const [input, setInput] = useState('')

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      <form onSubmit={(e) => {
        e.preventDefault()
        send(input)
        setInput('')
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming}>
          Send
        </button>
      </form>
    </div>
  )
}

function App() {
  return (
    <AIProvider>
      <ChatComponent />
    </AIProvider>
  )
}
```

---

## Streaming & Suspense

### React 18 Suspense Integration

Use Suspense for async AI operations:

```tsx
// components/SuspenseChat.tsx
import { Suspense, use } from 'react'
import { AIStream } from '@ainative/ai-kit/core'

const stream = new AIStream({ endpoint: '/api/chat' })

function Messages() {
  const messages = use(stream.getMessagesAsync())

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}

export function SuspenseChat() {
  return (
    <Suspense fallback={<div>Loading messages...</div>}>
      <Messages />
    </Suspense>
  )
}
```

### Concurrent Rendering

Optimize with concurrent features:

```tsx
// components/ConcurrentChat.tsx
import { useTransition, useState } from 'react'
import { useAIStream } from '@ainative/ai-kit/react'

export function ConcurrentChat() {
  const [isPending, startTransition] = useTransition()
  const { messages, send } = useAIStream({ endpoint: '/api/chat' })
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(() => {
      send(input)
      setInput('')
    })
  }

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {isPending && <div className="loading">Sending...</div>}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### Deferred Values

Use deferred values for better UX:

```tsx
// components/DeferredChat.tsx
import { useDeferredValue, useState } from 'react'
import { useAIStream } from '@ainative/ai-kit/react'

export function DeferredChat() {
  const { messages, send } = useAIStream({ endpoint: '/api/chat' })
  const [input, setInput] = useState('')
  const deferredInput = useDeferredValue(input)

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />

      <div className="preview">
        Preview: {deferredInput}
      </div>
    </div>
  )
}
```

---

## Error Boundaries

### AI Error Boundary

Catch and handle AI-specific errors:

```tsx
// components/AIErrorBoundary.tsx
import { Component, ReactNode } from 'react'
import {
  AIKitError,
  NetworkError,
  RateLimitError,
  AuthError,
} from '@ainative/ai-kit/core'

interface Props {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI Error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry)
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.getErrorMessage(this.state.error)}</p>
          <button onClick={this.retry}>Try Again</button>
        </div>
      )
    }

    return this.props.children
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof RateLimitError) {
      return 'Rate limit exceeded. Please wait a moment.'
    } else if (error instanceof AuthError) {
      return 'Authentication failed. Please check your API key.'
    } else if (error instanceof NetworkError) {
      return 'Network error. Please check your connection.'
    } else if (error instanceof AIKitError) {
      return error.message
    } else {
      return 'An unexpected error occurred.'
    }
  }
}
```

**Usage:**

```tsx
// App.tsx
import { AIErrorBoundary } from '@/components/AIErrorBoundary'
import { ChatComponent } from '@/components/ChatComponent'

function App() {
  return (
    <AIErrorBoundary
      fallback={(error, retry) => (
        <div className="custom-error">
          <h2>AI Error</h2>
          <p>{error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
    >
      <ChatComponent />
    </AIErrorBoundary>
  )
}
```

---

## Performance Optimization

### Code Splitting

Lazy load AI components:

```tsx
// App.tsx
import { lazy, Suspense } from 'react'

const ChatComponent = lazy(() => import('@/components/ChatComponent'))
const AgentDashboard = lazy(() => import('@/components/AgentDashboard'))

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChatComponent />
      </Suspense>

      <Suspense fallback={<div>Loading agent...</div>}>
        <AgentDashboard />
      </Suspense>
    </div>
  )
}
```

### Memoization

Optimize re-renders:

```tsx
// components/OptimizedChat.tsx
import { memo, useMemo, useCallback } from 'react'
import { useAIStream } from '@ainative/ai-kit/react'

const Message = memo(({ message }: { message: Message }) => {
  return (
    <div className="message">
      {message.content}
    </div>
  )
})

export function OptimizedChat() {
  const { messages, send } = useAIStream({ endpoint: '/api/chat' })

  const messageComponents = useMemo(
    () => messages.map((msg) => <Message key={msg.id} message={msg} />),
    [messages]
  )

  const handleSend = useCallback(
    (content: string) => {
      send(content)
    },
    [send]
  )

  return (
    <div>
      {messageComponents}
      <MessageInput onSend={handleSend} />
    </div>
  )
}
```

### Virtual Scrolling

Handle large message lists:

```tsx
// components/VirtualizedChat.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { FixedSizeList as List } from 'react-window'

export function VirtualizedChat() {
  const { messages } = useAIStream({ endpoint: '/api/chat' })

  const Row = ({ index, style }) => (
    <div style={style} className="message">
      {messages[index].content}
    </div>
  )

  return (
    <List
      height={600}
      itemCount={messages.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### Debounced Input

Optimize input handling:

```tsx
// hooks/useDebouncedInput.ts
import { useState, useEffect } from 'react'

export function useDebouncedInput(value: string, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

**Usage:**

```tsx
import { useDebouncedInput } from '@/hooks/useDebouncedInput'

function SearchChat() {
  const [input, setInput] = useState('')
  const debouncedInput = useDebouncedInput(input, 500)
  const { send } = useAIStream({ endpoint: '/api/chat' })

  useEffect(() => {
    if (debouncedInput) {
      send(debouncedInput)
    }
  }, [debouncedInput, send])

  return (
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Type to search..."
    />
  )
}
```

---

## Server Components vs Client Components

### Client Component Pattern

Standard client-side AI integration:

```tsx
// components/ClientChat.tsx
'use client' // Mark as client component

import { useAIStream } from '@ainative/ai-kit/react'
import { useState } from 'react'

export default function ClientChat() {
  const [input, setInput] = useState('')
  const { messages, send, isStreaming } = useAIStream({
    endpoint: '/api/chat',
  })

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      <form onSubmit={(e) => {
        e.preventDefault()
        send(input)
        setInput('')
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### Server Component Pattern (Next.js)

Server-side rendering with AI:

```tsx
// app/chat/page.tsx
import { Suspense } from 'react'
import { getConversationHistory } from '@/lib/conversation'

async function ConversationHistory({ userId }: { userId: string }) {
  const messages = await getConversationHistory(userId)

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}

export default function ChatPage({ params }: { params: { userId: string } }) {
  return (
    <div>
      <Suspense fallback={<div>Loading history...</div>}>
        <ConversationHistory userId={params.userId} />
      </Suspense>

      {/* Client component for interaction */}
      <ClientChat userId={params.userId} />
    </div>
  )
}
```

### Hybrid Pattern

Mix server and client components:

```tsx
// app/chat/layout.tsx
import { ChatProvider } from '@/components/ChatProvider'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  )
}
```

```tsx
// app/chat/[id]/page.tsx
import { Suspense } from 'react'
import { ChatInterface } from '@/components/ChatInterface'
import { ChatHistory } from '@/components/ChatHistory'

export default async function ChatPage({ params }: { params: { id: string } }) {
  return (
    <div className="chat-page">
      <Suspense fallback={<div>Loading...</div>}>
        <ChatHistory conversationId={params.id} />
      </Suspense>

      <ChatInterface conversationId={params.id} />
    </div>
  )
}
```

---

## Complete Examples

### Example 1: Full-Featured Chat Application

```tsx
// components/FullChatApp.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState, useRef, useEffect } from 'react'
import { Message } from './Message'
import { MessageInput } from './MessageInput'
import { ChatHeader } from './ChatHeader'
import { TypingIndicator } from './TypingIndicator'
import { ErrorBanner } from './ErrorBanner'

export function FullChatApp() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const {
    messages,
    send,
    isStreaming,
    error,
    retry,
    reset,
    usage,
    abort,
  } = useAIStream({
    endpoint: '/api/chat',
    systemPrompt: 'You are a helpful assistant.',
    maxTokens: 2048,
    temperature: 0.7,
    cache: true,
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
    },
    onCost: (usage) => {
      console.log('Cost:', usage.estimatedCost)
    },
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isUserScrolling])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom =
      element.scrollHeight - element.scrollTop === element.clientHeight
    setIsUserScrolling(!isAtBottom)
  }

  return (
    <div className="chat-app">
      <ChatHeader
        messagesCount={messages.length}
        tokens={usage.totalTokens}
        cost={usage.estimatedCost}
        onReset={reset}
      />

      <div className="messages-container" onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Ask me anything!</p>
          </div>
        )}

        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}

        {isStreaming && <TypingIndicator />}

        {error && (
          <ErrorBanner
            error={error}
            onRetry={retry}
            onDismiss={() => {}}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={send}
        disabled={isStreaming}
        onAbort={abort}
        isStreaming={isStreaming}
      />
    </div>
  )
}
```

### Example 2: Multi-Agent System

```tsx
// components/MultiAgentSystem.tsx
import { useAgent } from '@ainative/ai-kit/react'
import { useState } from 'react'
import {
  researchAgent,
  writerAgent,
  editorAgent,
} from '@/lib/agents'

export function MultiAgentSystem() {
  const [selectedAgent, setSelectedAgent] = useState('research')
  const [input, setInput] = useState('')

  const agents = {
    research: useAgent(researchAgent),
    writer: useAgent(writerAgent),
    editor: useAgent(editorAgent),
  }

  const currentAgent = agents[selectedAgent]

  const handleRun = async () => {
    await currentAgent.run(input)
    setInput('')
  }

  return (
    <div className="multi-agent-system">
      <div className="agent-selector">
        {Object.keys(agents).map((agentName) => (
          <button
            key={agentName}
            className={selectedAgent === agentName ? 'active' : ''}
            onClick={() => setSelectedAgent(agentName)}
          >
            {agentName}
          </button>
        ))}
      </div>

      <div className="agent-workspace">
        <h2>{selectedAgent} Agent</h2>

        {currentAgent.result && (
          <div className="result">
            <h3>Result:</h3>
            <p>{currentAgent.result.answer}</p>
          </div>
        )}

        {currentAgent.steps.length > 0 && (
          <details className="execution-steps">
            <summary>Execution Steps ({currentAgent.steps.length})</summary>
            <ul>
              {currentAgent.steps.map((step, i) => (
                <li key={i}>
                  <strong>{step.type}:</strong> {step.content}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask the ${selectedAgent} agent...`}
            rows={4}
          />
          <button
            onClick={handleRun}
            disabled={currentAgent.isRunning || !input.trim()}
          >
            {currentAgent.isRunning ? 'Running...' : 'Run Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Example 3: Code Assistant

```tsx
// components/CodeAssistant.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

export function CodeAssistant() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')

  const { messages, send, isStreaming } = useAIStream({
    endpoint: '/api/code-assistant',
    systemPrompt: `You are an expert programmer. Help users with:
      - Code review and debugging
      - Code optimization
      - Documentation
      - Best practices`,
  })

  const handleAnalyze = async () => {
    await send(JSON.stringify({ code, language, action: 'analyze' }))
  }

  const handleOptimize = async () => {
    await send(JSON.stringify({ code, language, action: 'optimize' }))
  }

  const handleDocument = async () => {
    await send(JSON.stringify({ code, language, action: 'document' }))
  }

  return (
    <div className="code-assistant">
      <div className="code-editor">
        <div className="editor-header">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
          </select>

          <div className="actions">
            <button onClick={handleAnalyze} disabled={isStreaming}>
              Analyze
            </button>
            <button onClick={handleOptimize} disabled={isStreaming}>
              Optimize
            </button>
            <button onClick={handleDocument} disabled={isStreaming}>
              Document
            </button>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
          rows={20}
          style={{ fontFamily: 'monospace' }}
        />
      </div>

      <div className="assistant-output">
        <h3>Assistant Output</h3>
        {messages.map((msg) => (
          <div key={msg.id} className="assistant-message">
            {msg.content.includes('```') ? (
              <SyntaxHighlighter language={language}>
                {msg.content.replace(/```[\w]*\n?/g, '')}
              </SyntaxHighlighter>
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Example 4: Multi-Modal Chat

```tsx
// components/MultiModalChat.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState, useRef } from 'react'

export function MultiModalChat() {
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, send, isStreaming } = useAIStream({
    endpoint: '/api/multimodal-chat',
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedImage) {
      await send({
        type: 'multimodal',
        content: [
          { type: 'text', text: input },
          { type: 'image', data: selectedImage },
        ],
      })
      setSelectedImage(null)
    } else {
      await send(input)
    }

    setInput('')
  }

  return (
    <div className="multimodal-chat">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {selectedImage && (
          <div className="image-preview">
            <img src={selectedImage} alt="Preview" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
            >
              Remove
            </button>
          </div>
        )}

        <div className="input-row">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            📎 Attach Image
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isStreaming}
          />

          <button type="submit" disabled={isStreaming || !input.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
```

### Example 5: Customer Support Bot

```tsx
// components/CustomerSupportBot.tsx
import { useAgent } from '@ainative/ai-kit/react'
import { useState, useEffect } from 'react'
import { supportAgent } from '@/lib/agents'

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'pending' | 'resolved'
  createdAt: Date
}

export function CustomerSupportBot() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const { run, result, steps, isRunning } = useAgent(supportAgent)

  useEffect(() => {
    // Load existing tickets
    fetchTickets().then(setTickets)
  }, [])

  const handleNewTicket = async (subject: string, description: string) => {
    await run(`New support ticket: ${subject}\n\nDescription: ${description}`)

    if (result) {
      const newTicket: Ticket = {
        id: crypto.randomUUID(),
        subject,
        status: 'open',
        createdAt: new Date(),
      }
      setTickets([...tickets, newTicket])
      setSelectedTicket(newTicket)
    }
  }

  return (
    <div className="support-bot">
      <div className="tickets-sidebar">
        <h3>Support Tickets</h3>
        <ul>
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className={selectedTicket?.id === ticket.id ? 'active' : ''}
              onClick={() => setSelectedTicket(ticket)}
            >
              <strong>{ticket.subject}</strong>
              <span className={`status ${ticket.status}`}>
                {ticket.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="ticket-details">
        {selectedTicket ? (
          <>
            <h2>{selectedTicket.subject}</h2>

            {result && (
              <div className="agent-response">
                <h3>Suggested Response:</h3>
                <p>{result.answer}</p>
              </div>
            )}

            {steps.length > 0 && (
              <details className="agent-steps">
                <summary>Agent Analysis</summary>
                <ul>
                  {steps.map((step, i) => (
                    <li key={i}>{step.content}</li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>Select a ticket to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Best Practices

### Security Considerations

1. **Never expose API keys to the client:**

```typescript
// ❌ BAD: API key in client code
const stream = new AIStream({
  apiKey: 'sk-ant-...',  // NEVER DO THIS
})

// ✅ GOOD: API calls through server-side routes
const stream = new AIStream({
  endpoint: '/api/chat',  // Server handles API key
})
```

2. **Validate user input:**

```typescript
// lib/validation.ts
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1).max(4000),
  role: z.enum(['user', 'assistant', 'system']),
})

export function validateMessage(message: unknown) {
  return messageSchema.parse(message)
}
```

3. **Implement rate limiting:**

```typescript
// hooks/useRateLimitedStream.ts
import { useAIStream } from '@ainative/ai-kit/react'
import { useState, useCallback } from 'react'

export function useRateLimitedStream(maxRequestsPerMinute: number) {
  const [requestCount, setRequestCount] = useState(0)
  const stream = useAIStream({ endpoint: '/api/chat' })

  const send = useCallback(
    async (content: string) => {
      if (requestCount >= maxRequestsPerMinute) {
        throw new Error('Rate limit exceeded')
      }

      setRequestCount(count => count + 1)
      setTimeout(() => setRequestCount(count => count - 1), 60000)

      return stream.send(content)
    },
    [requestCount, maxRequestsPerMinute, stream]
  )

  return { ...stream, send }
}
```

### Performance Tips

1. **Memoize expensive computations:**

```tsx
const filteredMessages = useMemo(
  () => messages.filter(msg => msg.role === 'user'),
  [messages]
)
```

2. **Use callback refs for auto-scroll:**

```tsx
const messagesEndRef = useCallback((node: HTMLDivElement | null) => {
  if (node) {
    node.scrollIntoView({ behavior: 'smooth' })
  }
}, [])
```

3. **Debounce search inputs:**

```tsx
const debouncedSearch = useDebouncedValue(searchQuery, 300)

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch)
  }
}, [debouncedSearch])
```

### Common Pitfalls

1. **Not handling streaming errors:**

```tsx
// ❌ BAD: No error handling
const { messages, send } = useAIStream({ endpoint: '/api/chat' })

// ✅ GOOD: Handle errors
const { messages, send, error, retry } = useAIStream({
  endpoint: '/api/chat',
  onError: (err) => {
    console.error('Stream error:', err)
    // Show user-friendly error message
  },
})
```

2. **Memory leaks with subscriptions:**

```tsx
// ✅ GOOD: Cleanup subscriptions
useEffect(() => {
  const subscription = stream.subscribe((token) => {
    console.log('Token:', token)
  })

  return () => {
    subscription.unsubscribe()
  }
}, [stream])
```

3. **Not handling component unmount:**

```tsx
useEffect(() => {
  let isMounted = true

  const fetchData = async () => {
    const data = await stream.send(input)
    if (isMounted) {
      setData(data)
    }
  }

  fetchData()

  return () => {
    isMounted = false
  }
}, [input, stream])
```

---

## Troubleshooting

### Common Issues

**Issue: "Stream not updating"**

```tsx
// Check if you're using the hook correctly
const { messages, send } = useAIStream({ endpoint: '/api/chat' })

// Make sure endpoint is correct
console.log('Endpoint:', '/api/chat')

// Check if messages are updating
useEffect(() => {
  console.log('Messages updated:', messages)
}, [messages])
```

**Issue: "Type errors with TypeScript"**

```typescript
// Make sure types are imported
import type { Message, StreamConfig } from '@ainative/ai-kit/core'

// Use proper types
const config: StreamConfig = {
  endpoint: '/api/chat',
  maxTokens: 2048,
}
```

**Issue: "CORS errors"**

```typescript
// Next.js API route
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Handle request
}
```

### Debugging Tips

1. **Enable debug logging:**

```typescript
import { setLogLevel } from '@ainative/ai-kit/core'

setLogLevel('debug')
```

2. **Inspect network requests:**

```tsx
const { messages, send } = useAIStream({
  endpoint: '/api/chat',
  onToken: (token) => {
    console.log('Token:', token)
  },
  onError: (error) => {
    console.error('Error:', error)
  },
})
```

3. **Test with mock data:**

```tsx
const mockStream = {
  messages: [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi!' },
  ],
  send: async (content) => {
    console.log('Mock send:', content)
  },
  isStreaming: false,
}
```

### Getting Help

- **Documentation**: https://docs.ainative.studio
- **GitHub Issues**: https://github.com/AINative-Studio/ai-kit/issues
- **Discord**: https://discord.gg/ainative
- **Email**: support@ainative.studio

---

**Built with care by [AINative Studio](https://ainative.studio)**

Need help? support@ainative.studio | [Documentation](https://docs.ainative.studio) | [GitHub](https://github.com/AINative-Studio/ai-kit)
