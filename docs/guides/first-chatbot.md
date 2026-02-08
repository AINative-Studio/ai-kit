# Building Your First Chatbot with AI Kit

This comprehensive tutorial will guide you through building a production-ready chatbot from scratch using AI Kit. By the end, you'll have a fully functional chatbot with conversation persistence, cost tracking, and deployment-ready code.

## Table of Contents

1. [What We're Building](#what-were-building)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Adding Features](#adding-features)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Next Steps](#next-steps)

---

## What We're Building

We'll build a customer support chatbot with these features:

- Real-time streaming responses
- Conversation persistence across page reloads
- Multi-user support with separate conversation histories
- Cost tracking and usage monitoring
- Error handling and retry logic
- Typing indicators and loading states
- Message timestamps
- Clear conversation functionality
- Responsive design
- Production-ready deployment configuration

**Tech Stack:**
- Framework: Next.js 14 (App Router)
- AI SDK: AI Kit
- LLM Provider: Anthropic Claude
- Styling: Tailwind CSS
- Database: Redis (for conversation persistence)
- Deployment: Vercel

---

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- Basic React/Next.js knowledge
- An Anthropic API key ([get one here](https://console.anthropic.com/))
- A code editor (VS Code recommended)

**Check your setup:**

```bash
node --version  # Should be v18+
npm --version   # Should be 9+
```

---

## Project Setup

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest customer-support-bot
```

When prompted, choose:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: No

Navigate to the project:

```bash
cd customer-support-bot
```

### Step 2: Install Dependencies

```bash
npm install @ainative/ai-kit @anthropic-ai/sdk
npm install -D @types/node
```

### Step 3: Environment Setup

Create `.env.local`:

```bash
# .env.local

# Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-...

# AI Kit Configuration
AIKIT_LOG_LEVEL=info
AIKIT_CACHE_ENABLED=true

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Add `.env.local` to `.gitignore`:

```
# .gitignore
.env.local
.env*.local
```

### Step 4: Project Structure

Create the following directory structure:

```
customer-support-bot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint
│   ├── chat/
│   │   ├── page.tsx              # Chat page
│   │   └── layout.tsx            # Chat layout
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── Chat.tsx                  # Main chat component
│   ├── Message.tsx               # Message component
│   ├── ChatInput.tsx             # Input component
│   └── UsageStats.tsx            # Usage statistics
├── lib/
│   ├── config.ts                 # Configuration
│   ├── store.ts                  # Conversation store
│   └── utils.ts                  # Utilities
├── types/
│   └── index.ts                  # Type definitions
├── .env.local                    # Environment variables
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## Backend Implementation

### Step 1: Create Type Definitions

Create `types/index.ts`:

```typescript
// types/index.ts

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface ChatRequest {
  messages: Message[]
  conversationId?: string
  userId?: string
}

export interface ChatResponse {
  message: Message
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

export interface ConversationMetadata {
  id: string
  userId: string
  createdAt: number
  updatedAt: number
  messageCount: number
  totalCost: number
}
```

### Step 2: Create Configuration

Create `lib/config.ts`:

```typescript
// lib/config.ts

export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-sonnet-4',
    maxTokens: 2048,
    temperature: 0.7,
  },

  system: {
    prompt: `You are a helpful customer support assistant for TechCo, a software company.

Your responsibilities:
- Answer customer questions about products and services
- Help troubleshoot common issues
- Provide clear, concise, and friendly responses
- Escalate complex issues to human agents when necessary

Guidelines:
- Always be polite and professional
- Ask clarifying questions when needed
- Provide step-by-step instructions for technical issues
- Acknowledge when you don't know something

Company information:
- Product: CloudSync - Cloud storage and synchronization service
- Support hours: 24/7
- Support email: support@techco.com
- Knowledge base: https://help.techco.com`,
  },

  limits: {
    maxMessagesPerConversation: 100,
    maxTokensPerMessage: 4000,
    conversationTTL: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },

  pricing: {
    'claude-sonnet-4': {
      input: 0.003 / 1000,  // $0.003 per 1K input tokens
      output: 0.015 / 1000, // $0.015 per 1K output tokens
    },
  },
} as const

export function validateConfig() {
  if (!config.anthropic.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
}
```

### Step 3: Create Conversation Store

Create `lib/store.ts`:

```typescript
// lib/store.ts

import { Message, ConversationMetadata } from '@/types'

// In-memory store (replace with Redis in production)
const conversations = new Map<string, Message[]>()
const metadata = new Map<string, ConversationMetadata>()

export class ConversationStore {
  async save(conversationId: string, messages: Message[]): Promise<void> {
    conversations.set(conversationId, messages)

    const meta = metadata.get(conversationId) || {
      id: conversationId,
      userId: 'anonymous',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      totalCost: 0,
    }

    meta.updatedAt = Date.now()
    meta.messageCount = messages.length
    metadata.set(conversationId, meta)
  }

  async load(conversationId: string): Promise<Message[]> {
    return conversations.get(conversationId) || []
  }

  async append(conversationId: string, message: Message): Promise<void> {
    const messages = await this.load(conversationId)
    messages.push(message)
    await this.save(conversationId, messages)
  }

  async clear(conversationId: string): Promise<void> {
    conversations.delete(conversationId)
    metadata.delete(conversationId)
  }

  async getMetadata(conversationId: string): Promise<ConversationMetadata | null> {
    return metadata.get(conversationId) || null
  }

  async updateCost(conversationId: string, cost: number): Promise<void> {
    const meta = await this.getMetadata(conversationId)
    if (meta) {
      meta.totalCost += cost
      metadata.set(conversationId, meta)
    }
  }
}

export const store = new ConversationStore()
```

### Step 4: Create Chat API Route

Create `app/api/chat/route.ts`:

```typescript
// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { config, validateConfig } from '@/lib/config'
import { store } from '@/lib/store'
import { ChatRequest, Message } from '@/types'

// Validate configuration on startup
validateConfig()

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
})

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, conversationId = 'default' } = body

    // Validate input
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Load conversation history
    const history = await store.load(conversationId)

    // Prepare messages for Anthropic
    const anthropicMessages = [
      ...history.filter(m => m.role !== 'system'),
      ...messages,
    ].map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Create streaming response
    const stream = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      temperature: config.anthropic.temperature,
      system: config.system.prompt,
      messages: anthropicMessages,
      stream: true,
    })

    // Track tokens for cost calculation
    let promptTokens = 0
    let completionTokens = 0
    let fullResponse = ''

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const token = event.delta.type === 'text_delta'
                ? event.delta.text
                : ''

              fullResponse += token

              // Send token to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
              )
            } else if (event.type === 'message_start') {
              promptTokens = event.message.usage.input_tokens
            } else if (event.type === 'message_delta') {
              completionTokens = event.usage.output_tokens
            }
          }

          // Calculate cost
          const pricing = config.pricing['claude-sonnet-4']
          const estimatedCost =
            promptTokens * pricing.input +
            completionTokens * pricing.output

          // Save assistant message
          const assistantMessage: Message = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: fullResponse,
            timestamp: Date.now(),
            metadata: {
              promptTokens,
              completionTokens,
              estimatedCost,
            },
          }

          await store.append(conversationId, messages[0])
          await store.append(conversationId, assistantMessage)
          await store.updateCost(conversationId, estimatedCost)

          // Send final metadata
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              done: true,
              usage: {
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
                estimatedCost,
              },
            })}\n\n`)
          )

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Frontend Implementation

### Step 1: Create Message Component

Create `components/Message.tsx`:

```typescript
// components/Message.tsx

import { Message as MessageType } from '@/types'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold opacity-75">
            {isUser ? 'You' : 'Support'}
          </span>
          <span className="text-xs opacity-50">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  )
}
```

### Step 2: Create Chat Input Component

Create `components/ChatInput.tsx`:

```typescript
// components/ChatInput.tsx

import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t dark:border-gray-700 p-4">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

### Step 3: Create Usage Stats Component

Create `components/UsageStats.tsx`:

```typescript
// components/UsageStats.tsx

interface UsageStatsProps {
  messageCount: number
  totalTokens: number
  totalCost: number
}

export function UsageStats({
  messageCount,
  totalTokens,
  totalCost,
}: UsageStatsProps) {
  return (
    <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400">
      <div>
        <span className="font-medium">Messages:</span> {messageCount}
      </div>
      <div>
        <span className="font-medium">Tokens:</span> {totalTokens.toLocaleString()}
      </div>
      <div>
        <span className="font-medium">Cost:</span> ${totalCost.toFixed(4)}
      </div>
    </div>
  )
}
```

### Step 4: Create Main Chat Component

Create `components/Chat.tsx`:

```typescript
// components/Chat.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { Message } from './Message'
import { ChatInput } from './ChatInput'
import { UsageStats } from './UsageStats'
import { Message as MessageType } from '@/types'

export function Chat() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState({
    totalTokens: 0,
    totalCost: 0,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversationId = useRef(`conv_${Date.now()}`)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    const userMessage: MessageType = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsStreaming(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage],
          conversationId: conversationId.current,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let assistantMessage: MessageType = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.token) {
                assistantMessage.content += data.token
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { ...assistantMessage }
                  return updated
                })
              } else if (data.done && data.usage) {
                setUsage(prev => ({
                  totalTokens: prev.totalTokens + data.usage.totalTokens,
                  totalCost: prev.totalCost + data.usage.estimatedCost,
                }))
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Chat error:', err)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleClear = () => {
    if (confirm('Clear conversation?')) {
      setMessages([])
      setUsage({ totalTokens: 0, totalCost: 0 })
      conversationId.current = `conv_${Date.now()}`
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Customer Support
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              How can we help you today?
            </p>
          </div>
          <button
            onClick={handleClear}
            disabled={isStreaming}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start a conversation
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Ask us anything about our products or services
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isStreaming && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="border-t dark:border-gray-700 p-4">
        <UsageStats
          messageCount={messages.length}
          totalTokens={usage.totalTokens}
          totalCost={usage.totalCost}
        />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        placeholder="Type your message..."
      />
    </div>
  )
}
```

### Step 5: Create Chat Page

Create `app/chat/page.tsx`:

```typescript
// app/chat/page.tsx

import { Chat } from '@/components/Chat'

export default function ChatPage() {
  return <Chat />
}
```

### Step 6: Update Home Page

Update `app/page.tsx`:

```typescript
// app/page.tsx

import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Customer Support Bot
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Get instant help from our AI-powered support assistant
        </p>
        <Link
          href="/chat"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          Start Chat
        </Link>
      </div>
    </div>
  )
}
```

---

## Adding Features

### Feature 1: Conversation Persistence with Redis

Install Redis client:

```bash
npm install ioredis
```

Update `lib/store.ts`:

```typescript
// lib/store.ts (with Redis)

import Redis from 'ioredis'
import { Message, ConversationMetadata } from '@/types'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export class ConversationStore {
  private prefix = 'conversation:'
  private metaPrefix = 'meta:'

  async save(conversationId: string, messages: Message[]): Promise<void> {
    await redis.set(
      `${this.prefix}${conversationId}`,
      JSON.stringify(messages),
      'EX',
      7 * 24 * 60 * 60 // 7 days TTL
    )

    const meta: ConversationMetadata = {
      id: conversationId,
      userId: 'anonymous',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: messages.length,
      totalCost: 0,
    }

    await redis.set(
      `${this.metaPrefix}${conversationId}`,
      JSON.stringify(meta),
      'EX',
      7 * 24 * 60 * 60
    )
  }

  async load(conversationId: string): Promise<Message[]> {
    const data = await redis.get(`${this.prefix}${conversationId}`)
    return data ? JSON.parse(data) : []
  }

  async append(conversationId: string, message: Message): Promise<void> {
    const messages = await this.load(conversationId)
    messages.push(message)
    await this.save(conversationId, messages)
  }

  async clear(conversationId: string): Promise<void> {
    await redis.del(`${this.prefix}${conversationId}`)
    await redis.del(`${this.metaPrefix}${conversationId}`)
  }

  async getMetadata(conversationId: string): Promise<ConversationMetadata | null> {
    const data = await redis.get(`${this.metaPrefix}${conversationId}`)
    return data ? JSON.parse(data) : null
  }

  async updateCost(conversationId: string, cost: number): Promise<void> {
    const meta = await this.getMetadata(conversationId)
    if (meta) {
      meta.totalCost += cost
      await redis.set(
        `${this.metaPrefix}${conversationId}`,
        JSON.stringify(meta),
        'EX',
        7 * 24 * 60 * 60
      )
    }
  }
}

export const store = new ConversationStore()
```

### Feature 2: User Authentication

Update to include user-specific conversations. First, install NextAuth:

```bash
npm install next-auth @next-auth/prisma-adapter
```

This is a starting point - refer to [NextAuth.js documentation](https://next-auth.js.org/) for complete implementation.

### Feature 3: Markdown Rendering

Install markdown renderer:

```bash
npm install react-markdown remark-gfm
```

Update `Message.tsx`:

```typescript
// components/Message.tsx (with markdown)

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ... existing imports

export function Message({ message }: MessageProps) {
  // ... existing code

  return (
    <div className={/* ... */}>
      <div className="text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
```

### Feature 4: File Uploads

Add file upload capability to the chat:

```typescript
// components/ChatInput.tsx (with file upload)

// Add to existing ChatInput component
const [selectedFile, setSelectedFile] = useState<File | null>(null)

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    setSelectedFile(file)
  }
}

// Update JSX to include file input
<input
  type="file"
  onChange={handleFileChange}
  className="hidden"
  id="file-upload"
/>
<label htmlFor="file-upload" className="cursor-pointer">
  📎
</label>
```

---

## Testing

### Step 1: Unit Tests

Install testing dependencies:

```bash
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

Create `__tests__/Message.test.tsx`:

```typescript
// __tests__/Message.test.tsx

import { render, screen } from '@testing-library/react'
import { Message } from '@/components/Message'

describe('Message', () => {
  it('renders user message correctly', () => {
    const message = {
      id: '1',
      role: 'user' as const,
      content: 'Hello',
      timestamp: Date.now(),
    }

    render(<Message message={message} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    const message = {
      id: '2',
      role: 'assistant' as const,
      content: 'Hi there!',
      timestamp: Date.now(),
    }

    render(<Message message={message} />)
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
  })
})
```

### Step 2: Integration Tests

Create `__tests__/chat.test.tsx`:

```typescript
// __tests__/chat.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Chat } from '@/components/Chat'

// Mock fetch
global.fetch = jest.fn()

describe('Chat', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear()
  })

  it('sends message and displays response', async () => {
    // Mock streaming response
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"token":"Hello"}\n\n'),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<Chat />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByText('Send')

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })
})
```

### Step 3: Run Tests

```bash
npm test
```

---

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy to Vercel:**

- Visit [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables:
  - `ANTHROPIC_API_KEY`
  - `REDIS_URL` (if using Redis)

3. **Configure Redis (if needed):**

Use Vercel KV or Upstash Redis:

```bash
# Add to vercel.json
{
  "env": {
    "REDIS_URL": "@redis-url"
  }
}
```

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set ANTHROPIC_API_KEY=your-key

# Deploy
railway up
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Redis/database connected
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Rate limiting configured
- [ ] CORS settings reviewed
- [ ] Security headers added
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented
- [ ] SSL certificate configured
- [ ] Domain configured

---

## Next Steps

Congratulations! You've built a production-ready chatbot. Here's what to explore next:

1. **Add More Features:**
   - Multi-language support
   - Voice input/output
   - File attachments
   - Image analysis
   - Code syntax highlighting

2. **Improve User Experience:**
   - Dark mode toggle
   - Conversation search
   - Export conversations
   - Custom themes
   - Keyboard shortcuts

3. **Enhance AI Capabilities:**
   - Add custom tools/functions
   - Implement RAG (Retrieval Augmented Generation)
   - Multi-agent support
   - Long-term memory

4. **Scale for Production:**
   - Implement caching
   - Add load balancing
   - Set up monitoring and alerts
   - Optimize database queries
   - Add analytics

5. **Learn More:**
   - [Custom Tools Guide](./custom-tools.md)
   - [Production Deployment](./production-deployment.md)
   - [AI Kit API Reference](../api/core.md)

---

**Need help?** Join our [Discord community](https://discord.com/invite/paipalooza) or email support@ainative.studio

**Want to contribute?** Check out our [Contributing Guide](../../CONTRIBUTING.md)
