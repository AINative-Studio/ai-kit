# Getting Started with AI Kit

Welcome to AI Kit - the comprehensive SDK that makes any web framework AI-native. This guide will take you from zero to building production-ready AI applications in under an hour.

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [Framework Integration](#framework-integration)
6. [Common Patterns](#common-patterns)
7. [Next Steps](#next-steps)

---

## Introduction

### What is AI Kit?

AI Kit is **not a framework replacement**. It's the critical infrastructure layer that makes existing frameworks (Next.js, Svelte, Vue, etc.) AI-native by providing production-grade primitives that every AI application needs.

Think of it as "Stripe for LLM Applications" - you don't want to build payment infrastructure from scratch, and you shouldn't have to build AI infrastructure either.

### The Problem AI Kit Solves

Building AI features today requires writing hundreds of lines of boilerplate code:

```tsx
// What developers write today (100+ lines of repetitive code)
const [messages, setMessages] = useState([])
const [isStreaming, setIsStreaming] = useState(false)
const [error, setError] = useState(null)

async function chat(prompt) {
  setIsStreaming(true)
  setError(null)

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', content: prompt }]
      })
    })

    if (!response.ok) throw new Error('Request failed')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      accumulated += chunk

      setMessages(prev => {
        const updated = [...prev]
        if (updated[updated.length - 1]?.role === 'assistant') {
          updated[updated.length - 1].content = accumulated
        } else {
          updated.push({ role: 'assistant', content: accumulated })
        }
        return updated
      })
    }
  } catch (err) {
    setError(err)
  } finally {
    setIsStreaming(false)
  }
}

// And you still need to handle:
// - Token counting and cost tracking
// - Retry logic and error recovery
// - Response caching
// - Rate limiting
// - Conversation persistence
// - Context window management
// - Security and guardrails
```

**With AI Kit, this becomes:**

```tsx
import { useAIStream } from '@ainative/ai-kit/react'

const { messages, send, isStreaming } = useAIStream({
  endpoint: '/api/chat',
  onCost: (tokens) => trackCost(tokens),
  onError: (err) => handleError(err),
  cache: true
})

// That's it. Everything else is handled automatically.
```

### Key Features Overview

AI Kit provides six core capabilities:

1. **Streaming Primitives** - Handle real-time LLM responses elegantly across any framework
2. **Agent Orchestration** - Coordinate multi-step AI workflows with tool calling
3. **Tool/Component Mapping** - Bridge LLM outputs to UI components automatically
4. **State Management** - Handle conversation context, memory, and history
5. **Cost & Observability** - Track every penny and millisecond of LLM usage
6. **Safety & Guardrails** - Protect against prompt injection, PII leakage, and abuse

### When to Use AI Kit

AI Kit is perfect for:

- Building conversational AI interfaces (chatbots, assistants)
- Adding AI capabilities to existing applications
- Creating multi-agent systems that use tools
- Applications requiring cost tracking and monitoring
- Production deployments needing security guardrails
- Teams wanting to move fast without reinventing infrastructure

AI Kit is NOT for:

- Training or fine-tuning models (use external providers)
- Hosting your own LLM infrastructure (use OpenAI, Anthropic, etc.)
- Building UI components (use your framework's component library)
- Vector databases (use ZeroDB or other vector stores)

### Architecture Overview

AI Kit follows a layered architecture:

```
┌─────────────────────────────────────────────────────┐
│  Application Layer (Your Code)                      │
├─────────────────────────────────────────────────────┤
│  Framework Adapters                                 │
│  (React, Svelte, Vue, Next.js)                      │
├─────────────────────────────────────────────────────┤
│  AI Kit Core                                        │
│  - Streaming      - State         - Security        │
│  - Agents         - Observability - Integrations    │
├─────────────────────────────────────────────────────┤
│  LLM Providers                                      │
│  (OpenAI, Anthropic, Llama, etc.)                   │
└─────────────────────────────────────────────────────┘
```

**Core Layer**: Framework-agnostic implementations of streaming, agents, state management, observability, and security.

**Adapter Layer**: Framework-specific bindings (hooks for React, stores for Svelte, composables for Vue).

**Application Layer**: Your application code using AI Kit's primitives.

This architecture ensures:
- Framework flexibility (switch frameworks without rewriting AI logic)
- Testability (core logic is framework-agnostic)
- Performance (minimal abstraction overhead)
- Type safety (full TypeScript support throughout)

---

## Installation

### Prerequisites

Before installing AI Kit, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **TypeScript**: Version 5.0 or higher (recommended but optional)
- **Framework**: React 18+, Svelte 4+, Vue 3+, or Next.js 13+

Check your Node.js version:

```bash
node --version  # Should be v18.0.0 or higher
```

If you need to upgrade Node.js, we recommend using [nvm](https://github.com/nvm-sh/nvm):

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install latest LTS version
nvm install --lts

# Use it
nvm use --lts
```

### Package Selection Guide

AI Kit is modular. Choose the packages you need:

**For React Applications:**
```bash
npm install @ainative/ai-kit
```
This includes both core and React adapter.

**For Svelte Applications:**
```bash
npm install @ainative/ai-kit-svelte
```

**For Vue Applications:**
```bash
npm install @ainative/ai-kit-vue
```

**For Next.js Applications:**
```bash
npm install @ainative/ai-kit @ainative/ai-kit-nextjs
```
Core + React + Next.js utilities.

**Additional Packages:**

```bash
# Built-in agent tools
npm install @ainative/ai-kit-tools

# AINative Auth integration
npm install @ainative/ai-kit-auth

# AINative RLHF integration
npm install @ainative/ai-kit-rlhf

# AINative ZeroDB integration
npm install @ainative/ai-kit-zerodb

# Design System MCP integration
npm install @ainative/ai-kit-design-system
```

### Installation with Different Package Managers

**Using npm:**
```bash
npm install @ainative/ai-kit
```

**Using yarn:**
```bash
yarn add @ainative/ai-kit
```

**Using pnpm:**
```bash
pnpm add @ainative/ai-kit
```

**Using bun:**
```bash
bun add @ainative/ai-kit
```

### Environment Setup

AI Kit requires API keys for LLM providers. Create a `.env` file in your project root:

```bash
# .env

# LLM Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# AI Kit Configuration (optional)
AIKIT_LOG_LEVEL=info
AIKIT_CACHE_ENABLED=true
AIKIT_MAX_RETRIES=3

# AINative Services (optional)
AINATIVE_API_URL=https://api.ainative.studio
AINATIVE_PROJECT_ID=your-project-id
AINATIVE_API_KEY=your-api-key
```

**Important Security Notes:**

1. Never commit `.env` files to version control
2. Add `.env` to your `.gitignore`:
   ```
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```
3. Use environment-specific files for different deployments:
   - `.env.development` - Development environment
   - `.env.production` - Production environment
   - `.env.test` - Testing environment

### API Key Configuration

Different frameworks handle environment variables differently:

**Next.js:**
```tsx
// next.config.js
module.exports = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
}

// Or use NEXT_PUBLIC_ prefix for client-side access
// NEXT_PUBLIC_AIKIT_ENDPOINT=https://api.example.com
```

**Vite (React, Svelte, Vue):**
```bash
# .env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

```tsx
// Access in code
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
```

**Create React App:**
```bash
# .env
REACT_APP_ANTHROPIC_API_KEY=sk-ant-...
```

```tsx
// Access in code
const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY
```

**Important:** API keys should NEVER be exposed to the client. Always make LLM calls from your backend/API routes.

### Verifying Installation

Create a simple test file to verify your installation:

```tsx
// test-aikit.js
import { AIStream } from '@ainative/ai-kit/core'

console.log('AI Kit installed successfully!')
console.log('Version:', require('@ainative/ai-kit/package.json').version)
```

Run it:
```bash
node test-aikit.js
```

If you see the version number, you're ready to go!

### TypeScript Configuration

For optimal TypeScript support, add these settings to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "types": ["@ainative/ai-kit/types"]
  }
}
```

### Troubleshooting Installation

**Module not found errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Install type definitions
npm install -D @types/node
```

**Version conflicts:**
```bash
# Check for conflicting versions
npm ls @ainative/ai-kit

# Force resolution (npm)
npm install @ainative/ai-kit --force

# Force resolution (yarn)
yarn install --force
```

---

## Quick Start

Let's build your first AI-powered feature in 5 minutes. We'll create a streaming chat interface that you can drop into any React application.

### First AI Stream in 5 Minutes

**Step 1: Create an API endpoint**

Create a file `pages/api/chat.ts` (Next.js) or `server/chat.ts` (other frameworks):

```typescript
// pages/api/chat.ts (Next.js)
import { StreamingResponse } from '@ainative/ai-kit/core'
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  const { messages } = req.body

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4',
    max_tokens: 1024,
    messages: messages,
    stream: true,
  })

  // Convert to web stream
  const response = new StreamingResponse({
    stream: stream,
    onToken: (token) => {
      console.log('Token:', token)
    },
  })

  return response.stream()
}
```

**Step 2: Create the chat component**

```tsx
// components/Chat.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState } from 'react'

export default function Chat() {
  const [input, setInput] = useState('')

  const { messages, send, isStreaming, error } = useAIStream({
    endpoint: '/api/chat',
    onCost: (usage) => {
      console.log('Cost:', usage.estimatedCost)
      console.log('Tokens:', usage.totalTokens)
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    await send(input)
    setInput('')
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
        {error && (
          <div className="error">Error: {error.message}</div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
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

**Step 3: Add some styles**

```css
/* styles/chat.css */
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.messages {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 6px;
}

.message.user {
  background: #e3f2fd;
  margin-left: 20%;
}

.message.assistant {
  background: #f5f5f5;
  margin-right: 20%;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  padding: 10px;
  border-radius: 6px;
}

form {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
}

button {
  padding: 12px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

**Step 4: Use it in your app**

```tsx
// pages/index.tsx or App.tsx
import Chat from './components/Chat'

export default function Home() {
  return (
    <div>
      <h1>My AI Chat App</h1>
      <Chat />
    </div>
  )
}
```

That's it! You now have a fully functional streaming chat interface with automatic:
- Token counting
- Cost tracking
- Error handling
- Retry logic
- Message history

### Basic Chat Interface

Let's enhance our chat with more features:

```tsx
// components/EnhancedChat.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState, useRef, useEffect } from 'react'

export default function EnhancedChat() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const {
    messages,
    send,
    isStreaming,
    error,
    retry,
    reset,
    usage
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
      console.log('Total cost:', usage.estimatedCost)
    },
    onError: (err) => {
      console.error('Stream error:', err)
    },
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    await send(input)
    setInput('')
  }

  return (
    <div className="enhanced-chat">
      {/* Header with stats */}
      <div className="chat-header">
        <h2>AI Assistant</h2>
        <div className="stats">
          <span>Messages: {messages.length}</span>
          <span>Tokens: {usage.totalTokens}</span>
          <span>Cost: ${usage.estimatedCost.toFixed(4)}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Start a conversation!</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-header">
              <strong>{msg.role === 'user' ? 'You' : 'Assistant'}</strong>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}

        {error && (
          <div className="error">
            <p>Error: {error.message}</p>
            <button onClick={retry}>Retry</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
        <button type="button" onClick={reset} disabled={isStreaming}>
          Clear
        </button>
      </form>
    </div>
  )
}
```

### Adding Tools

Now let's add tools so the AI can perform actions:

```tsx
// lib/tools.ts
import { Tool } from '@ainative/ai-kit/core'

export const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get the current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g. San Francisco, CA',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'The unit for temperature',
      },
    },
    required: ['location'],
  },
  execute: async ({ location, unit = 'fahrenheit' }) => {
    // Call weather API
    const response = await fetch(
      `https://api.weather.com/v1/current?location=${location}&unit=${unit}`
    )
    const data = await response.json()

    return {
      temperature: data.temperature,
      condition: data.condition,
      humidity: data.humidity,
    }
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
        description: 'The mathematical expression to evaluate, e.g. "2 + 2"',
      },
    },
    required: ['expression'],
  },
  execute: async ({ expression }) => {
    // Safe evaluation (use a proper math parser in production)
    try {
      const result = eval(expression)
      return { result }
    } catch (error) {
      return { error: 'Invalid expression' }
    }
  },
}
```

### Simple Agent Setup

Create an agent that uses tools:

```tsx
// lib/agents.ts
import { AgentExecutor } from '@ainative/ai-kit/core'
import { weatherTool, calculatorTool } from './tools'

export const assistantAgent = new AgentExecutor({
  name: 'Personal Assistant',
  systemPrompt: `You are a helpful personal assistant. You can:
    - Check the weather using the get_weather tool
    - Perform calculations using the calculate tool
    - Answer general questions

    Always use tools when appropriate to provide accurate information.`,
  model: 'claude-sonnet-4',
  tools: [weatherTool, calculatorTool],
  maxIterations: 5,
  temperature: 0.7,
})

// Use the agent
const result = await assistantAgent.run('What is the weather in San Francisco?')
console.log(result.answer)
console.log('Steps:', result.steps)
```

**API endpoint for agent:**

```typescript
// pages/api/agent.ts
import { assistantAgent } from '@/lib/agents'

export default async function handler(req, res) {
  const { message } = req.body

  try {
    const result = await assistantAgent.run(message)

    res.status(200).json({
      answer: result.answer,
      steps: result.steps,
      usage: result.usage,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

**React component for agent:**

```tsx
// components/AgentChat.tsx
import { useState } from 'react'

export default function AgentChat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: input }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        steps: data.steps,
      }])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  return (
    <div className="agent-chat">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}

            {msg.steps && (
              <details className="execution-steps">
                <summary>View execution steps</summary>
                <ul>
                  {msg.steps.map((step, i) => (
                    <li key={i}>
                      <strong>{step.type}:</strong> {step.content}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

### Error Handling Basics

AI Kit provides comprehensive error handling:

```tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { AIKitError, NetworkError, RateLimitError, AuthError } from '@ainative/ai-kit/core'

export default function ChatWithErrorHandling() {
  const { messages, send, error } = useAIStream({
    endpoint: '/api/chat',
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
      onRetry: (attempt) => {
        console.log(`Retry attempt ${attempt}`)
      },
    },
    onError: (err) => {
      // Handle specific error types
      if (err instanceof RateLimitError) {
        alert('Rate limit exceeded. Please wait a moment.')
      } else if (err instanceof AuthError) {
        alert('Authentication failed. Please check your API key.')
      } else if (err instanceof NetworkError) {
        alert('Network error. Please check your connection.')
      } else {
        alert('An error occurred: ' + err.message)
      }
    },
  })

  return (
    <div>
      {/* Chat UI */}
      {error && (
        <div className="error-banner">
          <h4>Error</h4>
          <p>{error.message}</p>
          {error.retryable && (
            <button onClick={() => send(messages[messages.length - 1].content)}>
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## Core Concepts

Understanding these core concepts will help you build more sophisticated AI applications with AI Kit.

### AI Streams Explained

An AI Stream is the fundamental primitive in AI Kit. It represents a bidirectional communication channel with an LLM that supports:

1. **Streaming responses** - Tokens arrive in real-time
2. **Message history** - Maintains conversation context
3. **Automatic retries** - Handles transient failures
4. **Cost tracking** - Monitors token usage and costs
5. **Caching** - Reduces redundant API calls

**Stream Lifecycle:**

```
User Input → Send → LLM Processing → Streaming Response → Complete
     ↑                                                        ↓
     └────────────── Message History ────────────────────────┘
```

**Creating a stream (framework-agnostic):**

```typescript
import { AIStream } from '@ainative/ai-kit/core'

const stream = new AIStream({
  endpoint: '/api/chat',
  model: 'claude-sonnet-4',
  systemPrompt: 'You are a helpful assistant.',
  onToken: (token) => {
    console.log('Token:', token)
  },
  onComplete: (message) => {
    console.log('Complete message:', message)
  },
  onError: (error) => {
    console.error('Error:', error)
  },
})

// Send a message
await stream.send('Hello!')

// Get message history
const messages = stream.getMessages()

// Reset conversation
stream.reset()
```

**Stream configuration options:**

```typescript
interface StreamConfig {
  // Required
  endpoint: string                    // API endpoint for chat

  // LLM Configuration
  model?: string                      // Model name (default: from env)
  systemPrompt?: string               // System message
  maxTokens?: number                  // Max response tokens
  temperature?: number                // Randomness (0-1)
  topP?: number                       // Nucleus sampling

  // Callbacks
  onToken?: (token: string) => void   // Per-token callback
  onComplete?: (msg: Message) => void // On completion
  onError?: (error: Error) => void    // On error
  onCost?: (usage: Usage) => void     // Cost tracking

  // Retry Logic
  retry?: {
    maxAttempts: number               // Max retry attempts
    backoff: 'linear' | 'exponential' // Backoff strategy
    onRetry?: (attempt: number) => void
  }

  // Caching
  cache?: boolean | {
    ttl: number                       // Time to live (ms)
    key?: (messages) => string        // Cache key generator
  }

  // Timeout
  timeout?: number                    // Request timeout (ms)
}
```

**Advanced stream features:**

```typescript
// Streaming with custom headers
const stream = new AIStream({
  endpoint: '/api/chat',
  headers: {
    'X-User-ID': userId,
    'X-Session-ID': sessionId,
  },
})

// Streaming with middleware
stream.use((message, next) => {
  // Pre-process message
  console.log('Sending:', message)
  const result = await next(message)
  // Post-process response
  console.log('Received:', result)
  return result
})

// Streaming with abort
const controller = new AbortController()
const stream = new AIStream({
  endpoint: '/api/chat',
  signal: controller.signal,
})

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000)
```

### Agents and Tools

Agents are AI systems that can use tools to accomplish tasks. They follow a "reasoning loop":

```
1. Receive input
2. Reason about what to do
3. Use tools if needed
4. Repeat until task is complete
5. Return final answer
```

**Agent anatomy:**

```typescript
interface Agent {
  name: string                       // Agent name
  systemPrompt: string               // Instructions
  model: string                      // LLM model
  tools: Tool[]                      // Available tools
  maxIterations?: number             // Safety limit
  temperature?: number               // Creativity
  streaming?: boolean                // Stream responses
}

interface Tool {
  name: string                       // Tool identifier
  description: string                // What it does (for LLM)
  parameters: JSONSchema             // Expected parameters
  execute: (params: any) => Promise<any>  // Implementation
}
```

**Creating custom tools:**

```typescript
const searchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information about a topic',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      limit: {
        type: 'number',
        description: 'Number of results to return',
        default: 5,
      },
    },
    required: ['query'],
  },
  execute: async ({ query, limit = 5 }) => {
    // Implement web search
    const response = await fetch(
      `https://api.search.com/search?q=${query}&limit=${limit}`
    )
    const data = await response.json()
    return data.results
  },
}
```

**Agent execution:**

```typescript
import { AgentExecutor } from '@ainative/ai-kit/core'

const agent = new AgentExecutor({
  name: 'Research Assistant',
  systemPrompt: 'You help users research topics by searching the web.',
  model: 'claude-sonnet-4',
  tools: [searchTool],
  maxIterations: 10,
})

// Run agent (returns final answer)
const result = await agent.run('What is quantum computing?')

console.log(result.answer)
console.log(result.steps)      // All reasoning steps
console.log(result.usage)      // Token usage
console.log(result.executionTime) // Time taken
```

**Streaming agent responses:**

```typescript
// Stream each step as it happens
for await (const step of agent.stream('What is quantum computing?')) {
  if (step.type === 'thought') {
    console.log('Thinking:', step.content)
  } else if (step.type === 'tool_call') {
    console.log('Calling tool:', step.toolName)
  } else if (step.type === 'tool_result') {
    console.log('Result:', step.result)
  } else if (step.type === 'answer') {
    console.log('Answer:', step.content)
  }
}
```

**Multi-agent coordination:**

```typescript
import { AgentSwarm } from '@ainative/ai-kit/core'

const researchAgent = new AgentExecutor({
  name: 'Researcher',
  systemPrompt: 'You research topics and gather information.',
  tools: [searchTool],
})

const writerAgent = new AgentExecutor({
  name: 'Writer',
  systemPrompt: 'You write clear, engaging content based on research.',
  tools: [],
})

const swarm = new AgentSwarm([researchAgent, writerAgent])

// Supervisor delegates to appropriate agent
const result = await swarm.delegate('Write an article about quantum computing')
// Supervisor chooses researchAgent → gathers info → passes to writerAgent → final article
```

### Message Management

Messages are the core data structure in AI Kit:

```typescript
interface Message {
  id: string                         // Unique identifier
  role: 'user' | 'assistant' | 'system'  // Message role
  content: string                    // Message text
  timestamp: number                  // Creation time
  metadata?: Record<string, any>     // Custom data
}
```

**Message operations:**

```typescript
import { MessageManager } from '@ainative/ai-kit/core'

const manager = new MessageManager()

// Add messages
manager.add({
  role: 'user',
  content: 'Hello!',
})

// Get all messages
const messages = manager.getAll()

// Filter messages
const userMessages = manager.filter({ role: 'user' })

// Search messages
const results = manager.search('quantum computing')

// Clear messages
manager.clear()

// Get recent messages
const recent = manager.getRecent(10)  // Last 10 messages
```

**Message formatting for different providers:**

```typescript
// OpenAI format
const openaiMessages = manager.toOpenAI()

// Anthropic format
const anthropicMessages = manager.toAnthropic()

// Custom format
const customMessages = manager.transform((msg) => ({
  sender: msg.role,
  text: msg.content,
  time: msg.timestamp,
}))
```

### Context and Memory

Context management ensures conversations fit within LLM token limits:

```typescript
import { ContextManager } from '@ainative/ai-kit/core'

const contextManager = new ContextManager({
  maxTokens: 8000,              // Model's context limit
  reserveTokens: 2000,          // Reserve for response
  strategy: 'sliding',          // Truncation strategy
})

// Truncate messages to fit context
const truncated = await contextManager.truncate(messages)
```

**Truncation strategies:**

1. **Sliding Window** - Keep most recent N messages
   ```typescript
   strategy: 'sliding'
   ```

2. **Summarization** - Summarize old messages, keep recent verbatim
   ```typescript
   strategy: 'summarize'
   ```

3. **Hybrid** - Summarize middle, keep first and last messages
   ```typescript
   strategy: 'hybrid'
   ```

**Long-term memory:**

```typescript
import { MemoryLayer } from '@ainative/ai-kit/core'
import { ZeroDBClient } from '@ainative/ai-kit/zerodb'

const zerodb = new ZeroDBClient({
  apiUrl: process.env.ZERODB_API_URL,
  projectId: process.env.ZERODB_PROJECT_ID,
})

const memory = new MemoryLayer(zerodb)

// Store memories
await memory.store(userId, 'preferences', {
  theme: 'dark',
  language: 'en',
})

// Retrieve memories
const preferences = await memory.retrieve(userId, 'preferences')

// Semantic search
const relevant = await memory.search(userId, 'user likes dark mode')

// Auto-enrich context with relevant memories
const enriched = await memory.enrichContext(userId, currentPrompt)
```

### Usage Tracking

Track token usage and costs automatically:

```typescript
import { UsageTracker } from '@ainative/ai-kit/core'

const tracker = new UsageTracker({
  provider: 'anthropic',
  pricing: {
    'claude-sonnet-4': {
      input: 0.003 / 1000,      // $ per input token
      output: 0.015 / 1000,     // $ per output token
    },
  },
  storage: 'redis',
})

// Track usage
await tracker.track({
  model: 'claude-sonnet-4',
  promptTokens: 100,
  completionTokens: 200,
  latency: 1234,
  userId: 'user-123',
})

// Get usage report
const report = await tracker.getUsage({
  userId: 'user-123',
  dateRange: [startDate, endDate],
})

console.log(report.totalCost)
console.log(report.totalTokens)
console.log(report.avgLatency)
console.log(report.breakdown.byModel)
console.log(report.breakdown.byDay)
```

**Automatic tracking with streams:**

```typescript
const stream = useAIStream({
  endpoint: '/api/chat',
  onCost: (usage) => {
    // Automatically called after each response
    console.log('Tokens:', usage.totalTokens)
    console.log('Cost:', usage.estimatedCost)
    console.log('Latency:', usage.latency)
  },
})
```

**Cost alerts:**

```typescript
import { CostAlerts } from '@ainative/ai-kit/core'

const alerts = new CostAlerts(tracker)

// Set daily budget
alerts.setThreshold({
  type: 'daily',
  limit: 100,  // $100/day
  action: (usage) => {
    sendEmail(`Daily budget exceeded: $${usage.totalCost}`)
  },
})

// Set per-user limit
alerts.setThreshold({
  type: 'per_user',
  limit: 10,  // $10/user
  action: (usage) => {
    disableUser(usage.userId)
  },
})
```

---

## Framework Integration

AI Kit provides first-class support for popular web frameworks. Choose the integration that matches your stack.

### React Integration

AI Kit's React adapter provides hooks and components for building AI-powered interfaces.

**Installation:**
```bash
npm install @ainative/ai-kit
```

**Basic usage:**

```tsx
import { useAIStream } from '@ainative/ai-kit/react'

function ChatComponent() {
  const { messages, send, isStreaming } = useAIStream({
    endpoint: '/api/chat',
  })

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => send('Hello')} disabled={isStreaming}>
        Send
      </button>
    </div>
  )
}
```

**Available hooks:**

```tsx
// Streaming
const { messages, send, isStreaming, error, retry, reset, usage } =
  useAIStream(config)

// Agent
const { run, stream, isRunning, result, steps } =
  useAgent(agent)

// Conversation persistence
const { messages, isLoading, save, load } =
  useConversation(conversationId, options)

// Usage tracking
const { usage, isLoading, refresh } =
  useUsage(filters)
```

**Available components:**

```tsx
import {
  AgentResponse,
  UsageDashboard,
  StreamingMessage,
  ToolResult,
} from '@ainative/ai-kit/react'

// Render agent execution steps
<AgentResponse
  steps={steps}
  components={{
    web_search: SearchResults,
    calculator: CalculatorResult,
  }}
/>

// Usage dashboard
<UsageDashboard userId={userId} />

// Streaming message with typing indicator
<StreamingMessage content={content} isStreaming={isStreaming} />
```

### Next.js Setup

Next.js has special considerations for API routes and server components.

**API Route Helpers:**

```typescript
// app/api/chat/route.ts (App Router)
import { createStreamingRoute } from '@ainative/ai-kit/nextjs'
import { StreamingResponse } from '@ainative/ai-kit/core'
import Anthropic from '@anthropic-ai/sdk'

export const POST = createStreamingRoute(async (req) => {
  const { messages } = await req.json()

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4',
    max_tokens: 1024,
    messages: messages,
    stream: true,
  })

  return new StreamingResponse({ stream })
})
```

**Middleware:**

```typescript
import { withRateLimit, withAuth } from '@ainative/ai-kit/nextjs'

export const POST = withAuth(
  withRateLimit(
    createStreamingRoute(handler),
    { windowMs: 60000, maxRequests: 100 }
  )
)
```

**Server Components (App Router):**

```tsx
// app/chat/page.tsx
import { Suspense } from 'react'
import ChatComponent from './ChatComponent'

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatComponent />
    </Suspense>
  )
}
```

**Environment Variables:**

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Vue.js Usage

AI Kit provides Vue 3 composables for reactive AI features.

**Installation:**
```bash
npm install @ainative/ai-kit-vue
```

**Basic usage:**

```vue
<script setup>
import { useAIStream } from '@ainative/ai-kit/vue'
import { ref } from 'vue'

const input = ref('')

const { messages, send, isStreaming } = useAIStream({
  endpoint: '/api/chat',
})

const handleSubmit = async () => {
  await send(input.value)
  input.value = ''
}
</script>

<template>
  <div class="chat">
    <div v-for="message in messages" :key="message.id">
      <strong>{{ message.role }}:</strong> {{ message.content }}
    </div>

    <form @submit.prevent="handleSubmit">
      <input v-model="input" :disabled="isStreaming" />
      <button type="submit" :disabled="isStreaming">Send</button>
    </form>
  </div>
</template>
```

**Available composables:**

```typescript
// Streaming
const { messages, send, isStreaming, error } = useAIStream(config)

// Agent
const { run, result, isRunning, steps } = useAgent(agent)

// Conversation
const { messages, isLoading, save, load } = useConversation(id)
```

**Components:**

```vue
<script setup>
import { AgentResponse, UsageDashboard } from '@ainative/ai-kit/vue'
</script>

<template>
  <AgentResponse :steps="steps" :components="componentMap" />
  <UsageDashboard :userId="userId" />
</template>
```

### Svelte Integration

AI Kit provides Svelte stores and actions for reactive AI features.

**Installation:**
```bash
npm install @ainative/ai-kit-svelte
```

**Basic usage:**

```svelte
<script>
  import { createAIStream } from '@ainative/ai-kit/svelte'

  let input = ''

  const stream = createAIStream({
    endpoint: '/api/chat',
  })

  const handleSubmit = async () => {
    await stream.send(input)
    input = ''
  }
</script>

<div class="chat">
  {#each $stream.messages as message}
    <div class="message {message.role}">
      <strong>{message.role}:</strong> {message.content}
    </div>
  {/each}

  <form on:submit|preventDefault={handleSubmit}>
    <input bind:value={input} disabled={$stream.isStreaming} />
    <button type="submit" disabled={$stream.isStreaming}>Send</button>
  </form>
</div>
```

**Available stores:**

```typescript
import { createAIStream, createAgent, createConversation } from '@ainative/ai-kit/svelte'

// Returns a Svelte store
const stream = createAIStream(config)
const agent = createAgent(agentConfig)
const conversation = createConversation(id)

// Access reactive values
$stream.messages
$stream.isStreaming
$stream.error
```

**Actions:**

```svelte
<script>
  import { aiStream } from '@ainative/ai-kit/svelte'
</script>

<div use:aiStream={{ endpoint: '/api/chat' }}>
  <!-- AI stream automatically managed -->
</div>
```

### Vanilla JavaScript

Use AI Kit without any framework:

```typescript
import { AIStream } from '@ainative/ai-kit/core'

const stream = new AIStream({
  endpoint: '/api/chat',
  onToken: (token) => {
    document.querySelector('#output').textContent += token
  },
})

document.querySelector('#send').addEventListener('click', async () => {
  const input = document.querySelector('#input').value
  await stream.send(input)
})
```

---

## Common Patterns

These patterns cover the most common use cases you'll encounter when building AI applications.

### Building a Chatbot

A complete chatbot implementation with all the bells and whistles:

```tsx
// components/Chatbot.tsx
import { useAIStream } from '@ainative/ai-kit/react'
import { useState, useEffect, useRef } from 'react'
import { ConversationStore } from '@ainative/ai-kit/core'

const store = new ConversationStore({
  provider: 'localStorage',
  maxMessages: 100,
})

export default function Chatbot({ conversationId = 'default' }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const {
    messages,
    send,
    isStreaming,
    error,
    retry,
    reset,
    usage
  } = useAIStream({
    endpoint: '/api/chat',
    systemPrompt: 'You are a helpful customer support assistant.',
    onComplete: async (message) => {
      // Save to store
      await store.save(conversationId, messages)
    },
  })

  // Load conversation on mount
  useEffect(() => {
    store.load(conversationId).then(savedMessages => {
      if (savedMessages.length > 0) {
        // Restore conversation
        savedMessages.forEach(msg => {
          // Add to stream (implementation-specific)
        })
      }
    })
  }, [conversationId])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    await send(input)
    setInput('')
  }

  const handleClear = async () => {
    if (confirm('Clear conversation?')) {
      reset()
      await store.clear(conversationId)
    }
  }

  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <h2>Customer Support</h2>
        <div className="actions">
          <button onClick={handleClear}>Clear</button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error.message}</p>
            <button onClick={retry}>Retry</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Send
        </button>
      </form>

      <div className="chatbot-footer">
        <small>
          {usage.totalTokens} tokens used • ${usage.estimatedCost.toFixed(4)} cost
        </small>
      </div>
    </div>
  )
}
```

### Adding Custom Tools

Create powerful custom tools for your agents:

```typescript
// lib/custom-tools.ts
import { Tool } from '@ainative/ai-kit/core'
import { z } from 'zod'  // For validation

// Database query tool
export const databaseTool: Tool = {
  name: 'query_database',
  description: 'Query the user database for information',
  parameters: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        enum: ['users', 'orders', 'products'],
        description: 'The table to query',
      },
      filters: {
        type: 'object',
        description: 'Filter conditions',
      },
      limit: {
        type: 'number',
        default: 10,
        description: 'Maximum number of results',
      },
    },
    required: ['table'],
  },
  execute: async ({ table, filters = {}, limit = 10 }) => {
    // Implement database query
    const db = await getDatabase()
    const results = await db
      .select('*')
      .from(table)
      .where(filters)
      .limit(limit)

    return results
  },
}

// API call tool
export const apiTool: Tool = {
  name: 'call_api',
  description: 'Make HTTP requests to external APIs',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The API endpoint URL',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET',
      },
      body: {
        type: 'object',
        description: 'Request body (for POST/PUT)',
      },
      headers: {
        type: 'object',
        description: 'Custom headers',
      },
    },
    required: ['url'],
  },
  execute: async ({ url, method = 'GET', body, headers = {} }) => {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    return await response.json()
  },
}

// File operation tool
export const fileTool: Tool = {
  name: 'file_operations',
  description: 'Read and write files',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'append', 'delete'],
      },
      path: {
        type: 'string',
        description: 'File path',
      },
      content: {
        type: 'string',
        description: 'Content to write (for write/append)',
      },
    },
    required: ['operation', 'path'],
  },
  execute: async ({ operation, path, content }) => {
    const fs = require('fs').promises

    switch (operation) {
      case 'read':
        return await fs.readFile(path, 'utf-8')
      case 'write':
        await fs.writeFile(path, content)
        return { success: true }
      case 'append':
        await fs.appendFile(path, content)
        return { success: true }
      case 'delete':
        await fs.unlink(path)
        return { success: true }
    }
  },
}
```

### Streaming Responses

Handle streaming in different scenarios:

```tsx
// Server-Sent Events (SSE)
import { useAIStream } from '@ainative/ai-kit/react'

function SSEExample() {
  const { messages, send } = useAIStream({
    endpoint: '/api/chat',
    transport: 'sse',  // Server-Sent Events
    onToken: (token) => {
      console.log('Token:', token)
    },
  })

  return <div>{/* UI */}</div>
}

// WebSocket
function WebSocketExample() {
  const { messages, send } = useAIStream({
    endpoint: 'ws://localhost:3000/chat',
    transport: 'websocket',
  })

  return <div>{/* UI */}</div>
}

// Custom streaming handler
function CustomStreamingExample() {
  const { messages, send } = useAIStream({
    endpoint: '/api/chat',
    onToken: (token, metadata) => {
      // Custom token processing
      console.log('Token:', token)
      console.log('Metadata:', metadata)

      // Update UI
      updateCustomUI(token)
    },
  })

  return <div>{/* UI */}</div>
}
```

### Multi-modal Interactions

Handle text, images, and other modalities:

```tsx
import { useAIStream } from '@ainative/ai-kit/react'

function MultiModalChat() {
  const [selectedImage, setSelectedImage] = useState(null)

  const { messages, send } = useAIStream({
    endpoint: '/api/chat',
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    const base64 = await fileToBase64(file)
    setSelectedImage(base64)
  }

  const handleSubmit = async (text) => {
    if (selectedImage) {
      // Send message with image
      await send({
        type: 'multimodal',
        content: [
          { type: 'text', text },
          { type: 'image', data: selectedImage },
        ],
      })
      setSelectedImage(null)
    } else {
      // Send text only
      await send(text)
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {selectedImage && <img src={selectedImage} alt="Preview" />}
      {/* Rest of UI */}
    </div>
  )
}
```

### Error Handling

Comprehensive error handling patterns:

```tsx
import {
  useAIStream,
  AIKitError,
  NetworkError,
  RateLimitError,
  AuthError,
  ValidationError,
} from '@ainative/ai-kit/react'

function RobustChat() {
  const [errorState, setErrorState] = useState(null)

  const { messages, send, error, retry } = useAIStream({
    endpoint: '/api/chat',
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
      retryIf: (error) => {
        // Only retry network errors
        return error instanceof NetworkError
      },
    },
    onError: (err) => {
      if (err instanceof RateLimitError) {
        setErrorState({
          type: 'rate_limit',
          message: 'Too many requests. Please wait.',
          retryAfter: err.retryAfter,
        })
      } else if (err instanceof AuthError) {
        setErrorState({
          type: 'auth',
          message: 'Authentication failed. Please check your API key.',
        })
      } else if (err instanceof NetworkError) {
        setErrorState({
          type: 'network',
          message: 'Network error. Retrying...',
        })
      } else {
        setErrorState({
          type: 'unknown',
          message: err.message,
        })
      }
    },
  })

  const handleRetry = async () => {
    setErrorState(null)
    await retry()
  }

  return (
    <div>
      {errorState && (
        <ErrorBanner
          type={errorState.type}
          message={errorState.message}
          onRetry={handleRetry}
        />
      )}
      {/* Rest of UI */}
    </div>
  )
}
```

---

## Next Steps

Congratulations! You've completed the getting started guide. Here's what to explore next.

### Advanced Features to Explore

1. **Advanced Agent Patterns**
   - Multi-agent coordination with AgentSwarm
   - Custom reasoning strategies
   - Tool composition and chaining
   - Agent memory and learning

2. **Production Optimizations**
   - Response caching strategies
   - Context window management
   - Batch processing
   - Load balancing

3. **Security and Guardrails**
   - Prompt injection detection
   - PII detection and redaction
   - Content moderation
   - Rate limiting strategies

4. **Observability and Monitoring**
   - Advanced usage tracking
   - Performance monitoring
   - Cost optimization
   - Error tracking and alerting

5. **AINative Ecosystem Integration**
   - AINative Auth for user management
   - AINative RLHF for model improvement
   - AINative ZeroDB for persistent storage
   - Design System MCP for UI consistency

### Example Projects

Check out these complete example applications:

1. **Customer Support Bot**
   - Location: `examples/customer-support`
   - Features: Multi-agent routing, knowledge base integration, ticket creation
   - Stack: Next.js, Anthropic Claude, ZeroDB

2. **Code Assistant**
   - Location: `examples/code-assistant`
   - Features: Code analysis, debugging suggestions, documentation generation
   - Stack: React, OpenAI GPT-4, GitHub API

3. **Research Assistant**
   - Location: `examples/research-assistant`
   - Features: Web search, PDF analysis, report generation
   - Stack: Svelte, Claude, Web Search API

4. **E-commerce AI**
   - Location: `examples/ecommerce-ai`
   - Features: Product recommendations, order processing, customer insights
   - Stack: Vue, Claude, Stripe

5. **Content Generator**
   - Location: `examples/content-generator`
   - Features: Blog writing, SEO optimization, image generation
   - Stack: Next.js, GPT-4, DALL-E

### Community Resources

- **Discord**: Join our community at [discord.gg/ainative](https://discord.gg/ainative)
- **GitHub Discussions**: Ask questions at [github.com/AINative-Studio/ai-kit/discussions](https://github.com/AINative-Studio/ai-kit/discussions)
- **Twitter**: Follow [@AINativeStudio](https://twitter.com/AINativeStudio) for updates
- **Blog**: Read tutorials at [blog.ainative.studio](https://blog.ainative.studio)

### API Reference Links

- **Core API**: [docs/api/core.md](../api/core.md)
- **React API**: [docs/api/react.md](../api/react.md)
- **Svelte API**: [docs/api/svelte.md](../api/svelte.md)
- **Vue API**: [docs/api/vue.md](../api/vue.md)
- **Tools API**: [docs/api/tools.md](../api/tools.md)
- **Types Reference**: [docs/api/types.md](../api/types.md)

### Further Reading

- **Architecture Guide**: [docs/architecture.md](../architecture.md)
- **Best Practices**: [docs/best-practices.md](../best-practices.md)
- **Performance Guide**: [docs/performance.md](../performance.md)
- **Security Guide**: [docs/security.md](../security.md)
- **Migration Guide**: [docs/migration.md](../migration.md)

### Getting Help

If you run into issues:

1. Check the [FAQ](../faq.md)
2. Search [GitHub Issues](https://github.com/AINative-Studio/ai-kit/issues)
3. Ask in [Discord](https://discord.gg/ainative)
4. Email support@ainative.studio

### Contributing

We welcome contributions! See our [Contributing Guide](../../CONTRIBUTING.md) for:
- Code of Conduct
- Development setup
- Pull request process
- Testing guidelines
- Documentation standards

---

**Next Recommended Guides:**

1. [Building Your First Chatbot](./first-chatbot.md) - Complete tutorial with deployment
2. [Creating Custom Tools](./custom-tools.md) - Advanced tool development
3. [Production Deployment](./production-deployment.md) - Launch checklist and best practices

---

**Built with care by [AINative Studio](https://ainative.studio)**

Need help? support@ainative.studio | [Documentation](https://docs.ainative.studio) | [GitHub](https://github.com/AINative-Studio/ai-kit)
