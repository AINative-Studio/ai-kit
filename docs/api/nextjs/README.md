# @ainative/ai-kit-nextjs API Reference

Next.js integration for AI Kit with App Router support

## Installation

```bash
npm install @ainative/ai-kit-nextjs
```

## Overview

Next.js-specific utilities:

- **Route Helpers**: API route handlers for streaming
- **Middleware**: Authentication and rate limiting
- **SSE Streaming**: Server-sent events for App Router

## Quick Start

### App Router Streaming

```typescript
// app/api/chat/route.ts
import { createStreamingResponse } from '@ainative/ai-kit-nextjs';
import { OpenAI } from 'openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true
  });

  return createStreamingResponse(completion);
}
```

---

## createStreamingResponse

Create a streaming Response for Next.js App Router.

### Usage

```typescript
import { createStreamingResponse } from '@ainative/ai-kit-nextjs';

export async function POST(req: Request) {
  const stream = await getLLMStream();
  return createStreamingResponse(stream, {
    headers: {
      'X-Custom-Header': 'value'
    }
  });
}
```

**Parameters:**
- `stream`: ReadableStream or async iterable
- `options?`: Configuration options
  - `headers?`: Custom headers
  - `onError?`: Error handler
  - `onComplete?`: Completion handler

---

## withAuth

Middleware for authentication.

### Usage

```typescript
// middleware.ts
import { withAuth } from '@ainative/ai-kit-nextjs';

export default withAuth({
  apiKey: process.env.API_KEY,
  allowedPaths: ['/api/chat', '/api/agent']
});

export const config = {
  matcher: '/api/:path*'
};
```

---

## withRateLimit

Middleware for rate limiting.

### Usage

```typescript
import { withRateLimit } from '@ainative/ai-kit-nextjs';

export default withRateLimit({
  max: 100,           // 100 requests
  window: 60000,      // per minute
  identifier: (req) => req.ip || 'anonymous'
});
```

---

## Complete Example

```typescript
// app/api/chat/route.ts
import { createStreamingResponse, withAuth, withRateLimit } from '@ainative/ai-kit-nextjs';
import { OpenAI } from 'openai';

export const runtime = 'edge';

// Apply middleware
export const middleware = [
  withAuth({ apiKey: process.env.API_KEY }),
  withRateLimit({ max: 100, window: 60000 })
];

export async function POST(req: Request) {
  const { messages } = await req.json();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true
  });

  return createStreamingResponse(completion, {
    onError: (error) => {
      console.error('Streaming error:', error);
    },
    onComplete: () => {
      console.log('Stream completed');
    }
  });
}
```

---

## See Also

- [Streaming API](../core/streaming.md)
- [React Hooks](../react/hooks.md)
