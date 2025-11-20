# Next.js Integration Guide

Complete guide for integrating AI Kit with Next.js 13+ (App Router and Pages Router). This guide covers API routes, route handlers, middleware, Edge runtime, SSR patterns, and production deployment.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [App Router Integration](#app-router-integration)
3. [Pages Router Integration](#pages-router-integration)
4. [API Routes vs Route Handlers](#api-routes-vs-route-handlers)
5. [Middleware Integration](#middleware-integration)
6. [Edge Runtime Usage](#edge-runtime-usage)
7. [Server-Side Streaming](#server-side-streaming)
8. [ISR and SSG Patterns](#isr-and-ssg-patterns)
9. [Authentication Integration](#authentication-integration)
10. [Deployment (Vercel)](#deployment-vercel)
11. [Complete Examples](#complete-examples)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Next.js**: Version 13.4.0 or higher (App Router support)
- **TypeScript**: Version 5.0 or higher (recommended)

Check your versions:

```bash
node --version     # Should be v18.0.0+
npx next --version # Should be 13.4.0+
```

### Creating a New Next.js Project

```bash
# Create new Next.js app
npx create-next-app@latest my-ai-app

# Navigate to project
cd my-ai-app

# Install AI Kit
npm install @ainative/ai-kit @ainative/ai-kit-nextjs

# Install LLM SDKs
npm install @anthropic-ai/sdk openai
```

### Project Structure

Recommended structure for Next.js with AI Kit:

```
my-ai-app/
├── app/                          # App Router (Next.js 13+)
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Chat API route handler
│   │   ├── agent/
│   │   │   └── route.ts          # Agent API route handler
│   │   └── usage/
│   │       └── route.ts          # Usage tracking route
│   ├── chat/
│   │   ├── page.tsx              # Chat page
│   │   └── layout.tsx            # Chat layout
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   └── agents/
│       └── AgentDashboard.tsx
├── lib/
│   ├── ai-config.ts              # AI Kit configuration
│   ├── agents.ts                 # Agent definitions
│   ├── tools.ts                  # Custom tools
│   └── utils.ts                  # Utility functions
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── .env.local                    # Environment variables
└── tsconfig.json                 # TypeScript configuration
```

### Environment Variables

Create `.env.local` for development:

```bash
# .env.local

# LLM Provider API Keys (NEVER expose to client)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# Next.js Public Variables (client-accessible)
NEXT_PUBLIC_API_URL=http://localhost:3000

# AI Kit Configuration
AIKIT_LOG_LEVEL=info
AIKIT_CACHE_ENABLED=true
AIKIT_MAX_RETRIES=3

# AINative Services (Optional)
AINATIVE_API_URL=https://api.ainative.studio
AINATIVE_PROJECT_ID=your-project-id
AINATIVE_API_KEY=your-api-key

# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

**Security Note**: Only variables prefixed with `NEXT_PUBLIC_` are accessible in the browser. Keep API keys server-side only.

### Next.js Configuration

Configure `next.config.js`:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  // Enable React Server Components
  reactStrictMode: true,
  // Optimize for streaming
  swcMinify: true,
}

module.exports = nextConfig
```

### TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    },
    "types": ["@ainative/ai-kit/types"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## App Router Integration

### Basic Route Handler

Create a streaming chat endpoint using App Router:

```typescript
// app/api/chat/route.ts
import { createStreamingRoute } from '@ainative/ai-kit/nextjs'
import { StreamingResponse } from '@ainative/ai-kit/core'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const runtime = 'edge' // Optional: Use Edge Runtime

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 2048,
      messages: messages,
      stream: true,
    })

    return new StreamingResponse({
      stream: stream,
      onToken: (token) => {
        console.log('Token:', token)
      },
    }).stream()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

### Server Component with Streaming

Use React Server Components for AI features:

```tsx
// app/chat/page.tsx
import { Suspense } from 'react'
import ChatInterface from '@/components/ChatInterface'
import { getConversationHistory } from '@/lib/conversation'

export default async function ChatPage() {
  return (
    <div className="chat-page">
      <h1>AI Chat</h1>

      <Suspense fallback={<ChatLoadingSkeleton />}>
        <ConversationHistory />
      </Suspense>

      <ChatInterface />
    </div>
  )
}

async function ConversationHistory() {
  const history = await getConversationHistory()

  return (
    <div className="conversation-history">
      {history.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}

function ChatLoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-message" />
      <div className="skeleton-message" />
      <div className="skeleton-message" />
    </div>
  )
}
```

### Client Component Integration

Create client components for interactive AI features:

```tsx
// components/ChatInterface.tsx
'use client'

import { useAIStream } from '@ainative/ai-kit/react'
import { useState } from 'react'

export default function ChatInterface() {
  const [input, setInput] = useState('')

  const { messages, send, isStreaming, error, retry } = useAIStream({
    endpoint: '/api/chat',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    await send(input)
    setInput('')
  }

  return (
    <div className="chat-interface">
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
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

### Server Actions

Use Next.js 13+ Server Actions for AI operations:

```tsx
// app/actions/chat.ts
'use server'

import { AgentExecutor } from '@ainative/ai-kit/core'
import { myAgent } from '@/lib/agents'

export async function runAgent(input: string) {
  const result = await myAgent.run(input)

  return {
    answer: result.answer,
    steps: result.steps,
    usage: result.usage,
  }
}

export async function saveConversation(userId: string, messages: Message[]) {
  // Save to database
  await db.conversations.create({
    data: {
      userId,
      messages,
    },
  })
}
```

**Using Server Actions:**

```tsx
// components/AgentComponent.tsx
'use client'

import { runAgent } from '@/app/actions/chat'
import { useState } from 'react'

export function AgentComponent() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRun = async () => {
    setIsLoading(true)
    try {
      const result = await runAgent(input)
      setResult(result)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
      />
      <button onClick={handleRun} disabled={isLoading}>
        {isLoading ? 'Running...' : 'Run Agent'}
      </button>

      {result && (
        <div>
          <h3>Answer:</h3>
          <p>{result.answer}</p>
        </div>
      )}
    </div>
  )
}
```

---

## Pages Router Integration

### API Route (Pages Router)

Create API routes using Pages Router:

```typescript
// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { StreamingResponse } from '@ainative/ai-kit/core'
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages } = req.body

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 2048,
      messages: messages,
      stream: true,
    })

    const response = new StreamingResponse({ stream })

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    return response.pipe(res)
  } catch (error) {
    console.error('Chat error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### SSR with getServerSideProps

Server-side render AI content:

```tsx
// pages/chat.tsx
import { GetServerSideProps } from 'next'
import ChatInterface from '@/components/ChatInterface'
import { getConversationHistory } from '@/lib/conversation'

interface ChatPageProps {
  initialMessages: Message[]
}

export default function ChatPage({ initialMessages }: ChatPageProps) {
  return (
    <div>
      <h1>AI Chat</h1>
      <ChatInterface initialMessages={initialMessages} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId } = context.query

  const messages = await getConversationHistory(userId as string)

  return {
    props: {
      initialMessages: messages,
    },
  }
}
```

### SSG with getStaticProps

Static generation with AI content:

```tsx
// pages/docs/[id].tsx
import { GetStaticProps, GetStaticPaths } from 'next'
import { generateDocumentation } from '@/lib/ai-docs'

interface DocPageProps {
  content: string
  title: string
}

export default function DocPage({ content, title }: DocPageProps) {
  return (
    <div>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docIds = await getDocumentIds()

  return {
    paths: docIds.map((id) => ({ params: { id } })),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const docId = params?.id as string

  // Generate documentation using AI
  const doc = await generateDocumentation(docId)

  return {
    props: {
      content: doc.content,
      title: doc.title,
    },
    revalidate: 3600, // Revalidate every hour
  }
}
```

---

## API Routes vs Route Handlers

### Route Handler (App Router)

Modern streaming with Route Handlers:

```typescript
// app/api/stream/route.ts
import { createStreamingRoute } from '@ainative/ai-kit/nextjs'
import { NextRequest } from 'next/server'

export const POST = createStreamingRoute(async (req: NextRequest) => {
  const { messages } = await req.json()

  // Your streaming logic here
  const stream = await createAIStream(messages)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
})

// Support OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

### API Route (Pages Router)

Legacy but still supported:

```typescript
// pages/api/stream.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createStreamingHandler } from '@ainative/ai-kit/nextjs'

export default createStreamingHandler(async (req, res) => {
  const { messages } = req.body

  // Your streaming logic here
  const stream = await createAIStream(messages)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  return stream.pipe(res)
})
```

### Comparison

| Feature | App Router (Route Handler) | Pages Router (API Route) |
|---------|---------------------------|--------------------------|
| Streaming | Native Web Streams | Node.js Streams |
| Edge Runtime | ✅ Supported | ❌ Not supported |
| TypeScript | Better inference | Manual typing |
| File Convention | `route.ts` | `[name].ts` |
| HTTP Methods | Named exports | Single handler |
| Middleware | Composable | Manual |

---

## Middleware Integration

### Rate Limiting Middleware

Protect API routes with rate limiting:

```typescript
// lib/middleware/rateLimit.ts
import { withRateLimit } from '@ainative/ai-kit/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export function createRateLimitMiddleware(options: {
  windowMs: number
  maxRequests: number
}) {
  return withRateLimit(options)
}

// Usage in route handler
// app/api/chat/route.ts
import { createRateLimitMiddleware } from '@/lib/middleware/rateLimit'

const rateLimit = createRateLimitMiddleware({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 requests per minute
})

export const POST = rateLimit(async (req: NextRequest) => {
  // Your handler logic
  return new Response('OK')
})
```

### Authentication Middleware

Protect routes with authentication:

```typescript
// lib/middleware/auth.ts
import { withAuth } from '@ainative/ai-kit/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export function createAuthMiddleware() {
  return withAuth({
    async validate(req: NextRequest) {
      const token = req.headers.get('Authorization')?.replace('Bearer ', '')

      if (!token) {
        throw new Error('Unauthorized')
      }

      const user = await verifyToken(token)
      return user
    },
    onError(error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })
}
```

**Usage:**

```typescript
// app/api/protected/route.ts
import { createAuthMiddleware } from '@/lib/middleware/auth'

const auth = createAuthMiddleware()

export const POST = auth(async (req: NextRequest, context) => {
  // context.user is available here
  const user = context.user

  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Composing Middleware

Chain multiple middleware functions:

```typescript
// lib/middleware/compose.ts
import { NextRequest, NextResponse } from 'next/server'

type Middleware = (
  req: NextRequest,
  context: any
) => Promise<NextResponse> | NextResponse

export function composeMiddleware(...middlewares: Middleware[]) {
  return async (req: NextRequest, context: any = {}) => {
    for (const middleware of middlewares) {
      const response = await middleware(req, context)
      if (response) return response
    }
  }
}
```

**Usage:**

```typescript
// app/api/secure-chat/route.ts
import { composeMiddleware } from '@/lib/middleware/compose'
import { createAuthMiddleware } from '@/lib/middleware/auth'
import { createRateLimitMiddleware } from '@/lib/middleware/rateLimit'

const auth = createAuthMiddleware()
const rateLimit = createRateLimitMiddleware({
  windowMs: 60000,
  maxRequests: 10,
})

export const POST = composeMiddleware(auth, rateLimit)(
  async (req: NextRequest) => {
    // Your handler logic
    return new Response('OK')
  }
)
```

### Global Middleware

Apply middleware to all routes:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Add custom headers
  const response = NextResponse.next()

  response.headers.set('X-Custom-Header', 'AI-Kit')
  response.headers.set('X-Request-ID', crypto.randomUUID())

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
```

---

## Edge Runtime Usage

### Edge-Compatible Route Handler

Run AI endpoints at the edge:

```typescript
// app/api/edge-chat/route.ts
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 2048,
      messages: messages,
      stream: true,
    })

    // Convert to Web ReadableStream
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            const text = chunk.delta.text
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

### Edge Middleware

Lightweight middleware for edge:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
  matcher: ['/api/chat/:path*'],
}

export function middleware(req: NextRequest) {
  // Check rate limits at the edge
  const ip = req.ip || 'unknown'
  const rateLimit = checkRateLimit(ip)

  if (!rateLimit.allowed) {
    return new Response('Too many requests', { status: 429 })
  }

  return NextResponse.next()
}
```

### Edge vs Node Runtime

| Feature | Edge Runtime | Node Runtime |
|---------|-------------|--------------|
| Cold Start | ~50ms | ~200ms |
| Global Deployment | ✅ Yes | ❌ No |
| Node APIs | ⚠️ Limited | ✅ Full |
| npm Packages | ⚠️ Some | ✅ All |
| File System | ❌ No | ✅ Yes |
| Max Duration | 30s | 300s+ |

---

## Server-Side Streaming

### SSE Streaming

Server-Sent Events implementation:

```typescript
// app/api/sse/route.ts
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial message
      controller.enqueue(
        encoder.encode('data: {"type":"start"}\n\n')
      )

      // Simulate streaming
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))

        controller.enqueue(
          encoder.encode(`data: {"type":"token","content":"Token ${i}"}\n\n`)
        )
      }

      // Send completion
      controller.enqueue(
        encoder.encode('data: {"type":"done"}\n\n')
      )

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### WebSocket Alternative

Use Route Handlers for real-time AI:

```typescript
// app/api/realtime/route.ts
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { message } = await req.json()

  // Create bi-directional stream
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Process message and stream response
  processMessage(message, writer)

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

async function processMessage(message: string, writer: WritableStreamDefaultWriter) {
  const encoder = new TextEncoder()

  // Stream tokens
  const tokens = message.split(' ')
  for (const token of tokens) {
    await writer.write(encoder.encode(`data: ${token}\n\n`))
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  await writer.close()
}
```

---

## ISR and SSG Patterns

### Incremental Static Regeneration

Generate AI content with ISR:

```tsx
// app/blog/[slug]/page.tsx
import { generateBlogPost } from '@/lib/ai-content'

export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  const posts = await getAllBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const content = await generateBlogPost(params.slug)

  return (
    <article>
      <h1>{content.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content.body }} />
    </article>
  )
}
```

### On-Demand Revalidation

Revalidate AI-generated pages on demand:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { path } = await req.json()

  try {
    revalidatePath(path)
    return new Response(JSON.stringify({ revalidated: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

### Static Generation with AI

Generate static pages using AI:

```tsx
// scripts/generate-docs.ts
import { AgentExecutor } from '@ainative/ai-kit/core'
import fs from 'fs'
import path from 'path'

const docAgent = new AgentExecutor({
  name: 'Documentation Generator',
  systemPrompt: 'Generate comprehensive documentation.',
  model: 'claude-sonnet-4',
  tools: [],
})

async function generateDocs() {
  const topics = ['installation', 'usage', 'api-reference']

  for (const topic of topics) {
    const result = await docAgent.run(`Generate documentation for: ${topic}`)

    const filePath = path.join(process.cwd(), 'app/docs', `${topic}.mdx`)
    fs.writeFileSync(filePath, result.answer)

    console.log(`Generated: ${topic}.mdx`)
  }
}

generateDocs()
```

---

## Authentication Integration

### NextAuth.js Integration

Secure AI endpoints with NextAuth:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub
      return session
    },
  },
})

export { handler as GET, handler as POST }
```

**Protected Chat Route:**

```typescript
// app/api/chat/route.ts
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages } = await req.json()

  // Process chat for authenticated user
  const response = await processChat(session.user.id, messages)

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

### Custom Authentication

Implement custom auth:

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function createToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch (error) {
    return null
  }
}
```

**Protected Route:**

```typescript
// app/api/protected-chat/route.ts
import { verifyToken } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
    })
  }

  // Process chat for authenticated user
  const { messages } = await req.json()
  const response = await processChat(payload.userId, messages)

  return new Response(JSON.stringify(response))
}
```

---

## Deployment (Vercel)

### Environment Variables

Set environment variables in Vercel:

```bash
# Via Vercel CLI
vercel env add ANTHROPIC_API_KEY
vercel env add OPENAI_API_KEY

# Or via Vercel Dashboard:
# Settings > Environment Variables
```

### Build Configuration

Optimize build for production:

```javascript
// next.config.js
module.exports = {
  // Optimize bundle
  swcMinify: true,

  // Configure headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        ],
      },
    ]
  },

  // Edge functions
  experimental: {
    runtime: 'edge',
  },
}
```

### Deployment Script

Automate deployment:

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "deploy": "vercel --prod",
    "deploy:preview": "vercel"
  }
}
```

### Production Checklist

- [ ] Set all environment variables in Vercel
- [ ] Configure custom domain
- [ ] Enable Edge Functions for chat endpoints
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure rate limiting
- [ ] Test streaming in production
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN caching
- [ ] Enable automatic preview deployments
- [ ] Set up CI/CD pipeline

---

## Complete Examples

### Example 1: Full-Stack Chat App

```tsx
// app/page.tsx
import { Suspense } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">AI Chat</h1>

      <Suspense fallback={<div>Loading...</div>}>
        <ChatInterface />
      </Suspense>
    </main>
  )
}
```

```typescript
// app/api/chat/route.ts
import { createStreamingRoute } from '@ainative/ai-kit/nextjs'
import { StreamingResponse } from '@ainative/ai-kit/core'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const POST = createStreamingRoute(async (req: NextRequest) => {
  const { messages } = await req.json()

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4',
    max_tokens: 2048,
    messages: messages,
    stream: true,
  })

  return new StreamingResponse({ stream }).stream()
})
```

```tsx
// components/ChatInterface.tsx
'use client'

import { useAIStream } from '@ainative/ai-kit/react'
import { useState, useRef, useEffect } from 'react'

export default function ChatInterface() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, send, isStreaming, error, retry } = useAIStream({
    endpoint: '/api/chat',
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    await send(input)
    setInput('')
  }

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-banner">
          <p>{error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isStreaming}
          className="message-input"
        />
        <button type="submit" disabled={isStreaming} className="send-button">
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

### Example 2: Agent Dashboard

```tsx
// app/agents/page.tsx
import { Suspense } from 'react'
import AgentDashboard from '@/components/AgentDashboard'

export default function AgentsPage() {
  return (
    <div className="agents-page">
      <h1>Agent Dashboard</h1>

      <Suspense fallback={<div>Loading agents...</div>}>
        <AgentDashboard />
      </Suspense>
    </div>
  )
}
```

```typescript
// app/api/agent/route.ts
import { NextRequest } from 'next/server'
import { assistantAgent } from '@/lib/agents'

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()

    const result = await assistantAgent.run(input)

    return new Response(
      JSON.stringify({
        answer: result.answer,
        steps: result.steps,
        usage: result.usage,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
```

### Example 3: Documentation Generator

```tsx
// app/docs/generate/page.tsx
'use client'

import { useState } from 'react'

export default function DocGenerator() {
  const [topic, setTopic] = useState('')
  const [doc, setDoc] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })

      const data = await response.json()
      setDoc(data.content)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="doc-generator">
      <h1>Documentation Generator</h1>

      <div className="input-section">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic..."
        />
        <button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {doc && (
        <div className="output-section">
          <h2>Generated Documentation</h2>
          <div className="markdown-content">{doc}</div>
        </div>
      )}
    </div>
  )
}
```

---

## Best Practices

### 1. API Key Security

Never expose API keys to the client:

```typescript
// ❌ BAD: API key in client code
const apiKey = 'sk-ant-...'

// ✅ GOOD: API key in environment variable (server-side only)
const apiKey = process.env.ANTHROPIC_API_KEY
```

### 2. Error Handling

Always handle errors properly:

```typescript
export async function POST(req: NextRequest) {
  try {
    const result = await processRequest(req)
    return new Response(JSON.stringify(result))
  } catch (error) {
    console.error('Error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
```

### 3. Caching Strategy

Implement intelligent caching:

```typescript
// app/api/chat/route.ts
import { unstable_cache } from 'next/cache'

const getCachedResponse = unstable_cache(
  async (prompt: string) => {
    return await generateAIResponse(prompt)
  },
  ['ai-responses'],
  {
    revalidate: 3600, // 1 hour
    tags: ['ai'],
  }
)

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()
  const response = await getCachedResponse(prompt)

  return new Response(JSON.stringify(response))
}
```

### 4. Performance Optimization

Optimize streaming performance:

```typescript
// Use Edge Runtime for faster cold starts
export const runtime = 'edge'

// Enable gzip compression
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}
```

### 5. Rate Limiting

Implement rate limiting:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})

export async function POST(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }

  // Process request
}
```

---

## Troubleshooting

### Common Issues

**Issue: Streaming not working**

```typescript
// Make sure you set correct headers
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
})
```

**Issue: Environment variables not loading**

```bash
# Restart dev server after adding env vars
npm run dev

# Verify env vars are loaded
console.log(process.env.ANTHROPIC_API_KEY)
```

**Issue: CORS errors**

```typescript
// Add CORS headers
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

### Debugging Tips

1. **Enable debug logging:**

```typescript
// next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

2. **Inspect streaming responses:**

```typescript
export async function POST(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      console.log('Stream started')
      // Your streaming logic
    },
  })

  return new Response(stream)
}
```

3. **Test with curl:**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

---

**Built with care by [AINative Studio](https://ainative.studio)**

Need help? support@ainative.studio | [Documentation](https://docs.ainative.studio) | [GitHub](https://github.com/AINative-Studio/ai-kit)
