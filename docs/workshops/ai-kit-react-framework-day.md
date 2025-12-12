# AI Kit Framework Day — React Edition

## Workshop Lesson Plan & Script

**Duration:** 3-4 hours (with breaks)
**Format:** Virtual workshop via Google Meet with live coding & screen sharing
**Platform:** Google Meet (link will be shared 24hrs before)
**Difficulty:** Intermediate React developers

---

## Virtual Workshop Guidelines

### For Attendees
- **Camera:** Keep your camera on if comfortable - it helps with engagement!
- **Microphone:** Stay muted unless speaking to reduce background noise
- **Questions:** Use the Google Meet chat for questions, or raise your hand to unmute
- **Screen Share:** You may be asked to share your screen during challenges
- **Breakout Rooms:** We'll use Google Meet breakout rooms for pair activities

### For Instructors
- Share your screen with VS Code + terminal visible
- Use a large font size (16-18pt minimum) for code visibility
- Check chat regularly for questions
- Use polls/reactions for quick engagement checks
- Have a co-host monitor chat while you present

---

## Pre-Workshop Setup (Send to Attendees 24hrs Before)

```bash
# Prerequisites checklist
node --version  # v18+ required
pnpm --version  # or npm/yarn

# Clone the starter repo
git clone https://github.com/AINativeOrg/ai-kit-react-workshop-starter
cd ai-kit-react-workshop-starter
pnpm install

# Create .env.local file
ANTHROPIC_API_KEY=your_key_here
ZERODB_API_KEY=your_key_here
ZERODB_PROJECT_ID=your_project_id
```

---

## Workshop Agenda

| Time | Section | Activity |
|------|---------|----------|
| 0:00 | Icebreaker | "AI App Show & Tell" |
| 0:15 | Part 1 | AI Kit Architecture Deep Dive |
| 0:45 | Part 2 | Hands-on: Building Chat UI |
| 1:15 | Break | Coffee & Questions |
| 1:30 | Part 3 | ZeroDB Integration |
| 2:00 | Part 4 | Advanced Patterns & Tools |
| 2:30 | Part 5 | Ship It! Deploy to Vercel |
| 3:00 | Wrap-up | Q&A + Resources |

---

## Icebreaker: "AI App Show & Tell" (15 min)

### Script:

> **Instructor:** "Before we dive in, let's see what AI apps you've all been using! Open your favorite AI-powered app on your phone or browser. You have 30 seconds to find one."
>
> *Wait 30 seconds*
>
> **Instructor:** "Now I'm going to put you in breakout rooms of 3-4 people. Take turns sharing your screen and showing:
> 1. What the app does
> 2. One thing you love about the UI
> 3. One thing that frustrates you
>
> You have 8 minutes in your breakout room, then we'll come back and share highlights!"
>
> *Create breakout rooms, 3-4 people each, 8 minutes*
>
> **After breakout rooms:**
>
> **Instructor:** "Welcome back! Who saw something cool they want to share? Drop a message in chat or unmute!"

**Purpose:** Gets students thinking about AI UX patterns they'll be building, and helps virtual attendees connect with each other early.

---

## Part 1: AI Kit Architecture (30 min)

### Slide 1: The Problem We're Solving

> **Instructor:** "Quick poll! React with a thumbs up in Meet if you've ever tried to build a chat interface from scratch..."
>
> *Wait for reactions*
>
> "Now keep that reaction if you enjoyed managing streaming state, error handling, retry logic, and token counting..."
>
> *Watch reactions disappear*
>
> "That's exactly why AI Kit exists. Let me show you a better way."

### Slide 2: The AI Kit Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                    Your React App                            │
├─────────────────────────────────────────────────────────────┤
│  @ainative/ai-kit-react                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ useAIChat   │ │useCompletion│ │  useTool    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│  @ainative/ai-kit-core                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Streaming  │ │   Agents    │ │   Tools     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│  ZeroDB (Backend)                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Vectors   │ │   Memory    │ │   Events    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Live Demo: State Patterns for AI Flows

> **Instructor:** "Let's look at the three states every AI feature needs to handle..."

```tsx
// Traditional approach (messy!)
const [messages, setMessages] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [streamingContent, setStreamingContent] = useState('');
const abortControllerRef = useRef(null);
// ... 50 more lines of boilerplate

// AI Kit approach (clean!)
const { messages, isLoading, error, append, stop } = useAIChat({
  api: '/api/chat',
  onError: (err) => toast.error(err.message),
});
```

### Interactive Exercise: "Spot the Bug" (5 min)

Show buggy streaming code, have students identify issues:

```tsx
// What's wrong with this code?
const handleStream = async () => {
  const response = await fetch('/api/chat');
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    setContent(prev => prev + new TextDecoder().decode(value));
  }
};
```

**Bugs to find:**
1. No error handling
2. No abort controller for cancellation
3. Memory leak if component unmounts
4. No loading state
5. Race conditions with rapid calls

> **Instructor:** "AI Kit handles ALL of this for you. Let's build something!"

---

## Part 2: Building a Chat UI (30 min)

### Live Coding Session

> **Instructor:** "Everyone open your starter project. We're going to build a production-ready chat in 30 minutes. Yes, really!"

#### Step 1: Create the Chat Page (5 min)

```tsx
// app/chat/page.tsx
'use client';

import { useAIChat } from '@ainative/ai-kit-react';
import { ChatMessage, ChatInput, StreamingIndicator } from '@ainative/ai-kit-react';

export default function ChatPage() {
  const {
    messages,
    input,
    setInput,
    append,
    isLoading,
    error,
    stop,
  } = useAIChat({
    api: '/api/chat',
    initialMessages: [
      { role: 'assistant', content: 'Hey! I\'m your AI assistant. What would you like to build today?' }
    ],
  });

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Kit Chat</h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            isStreaming={isLoading && i === messages.length - 1}
          />
        ))}
        {isLoading && <StreamingIndicator />}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error.message}
        </div>
      )}

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => append({ role: 'user', content: input })}
        isLoading={isLoading}
        onStop={stop}
        placeholder="Ask me anything..."
      />
    </div>
  );
}
```

#### Step 2: Create the API Route (5 min)

```tsx
// app/api/chat/route.ts
import { AIClient, streamResponse } from '@ainative/ai-kit-core';

const client = new AIClient({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await client.chat({
    model: 'claude-sonnet-4-20250514',
    messages,
    stream: true,
  });

  return streamResponse(stream);
}
```

> **Checkpoint:** "Everyone should have a working chat now! Send a message and watch it stream."

#### Step 3: Add Markdown Rendering (5 min)

```tsx
// Update ChatMessage to use StreamingMessage for rich content
import { StreamingMessage } from '@ainative/ai-kit-react';

<StreamingMessage
  content={msg.content}
  isStreaming={isLoading && i === messages.length - 1}
  enableMarkdown={true}
  enableCodeHighlight={true}
/>
```

#### Step 4: Add Message Actions (5 min)

```tsx
// Add copy, regenerate, and feedback buttons
<ChatMessage
  role={msg.role}
  content={msg.content}
  actions={
    <div className="flex gap-2 mt-2">
      <button onClick={() => navigator.clipboard.writeText(msg.content)}>
        Copy
      </button>
      {msg.role === 'assistant' && (
        <button onClick={() => regenerate(i)}>
          Regenerate
        </button>
      )}
    </div>
  }
/>
```

### Mini Challenge (10 min)

> **Instructor:** "Now it's your turn! Add ONE of these features to your chat:
> 1. A 'Clear Chat' button
> 2. A character counter for the input
> 3. A typing indicator that shows '...' while loading
> 4. Dark mode toggle
>
> You have 10 minutes. Work on your own, and drop a message in chat when you're done!
> If you get stuck, ask in chat and we'll help you out.
>
> I'll play some chill coding music while you work..."
>
> *Share a lo-fi playlist or keep mic open for questions*
>
> **After 10 minutes:**
>
> **Instructor:** "Time's up! Who wants to share their screen and show what they built? Don't be shy - imperfect code is welcome!"

---

## Break (15 min)

> **Instructor:** "Great work everyone! Take 15 minutes - grab some coffee, stretch, step away from your screen for a bit.
>
> I'll keep the Meet open if anyone wants to hang out and chat, but feel free to turn off your camera and take a real break.
>
> Drop a coffee emoji in chat when you're back and ready to continue!"
>
> *Keep Meet open, maybe share a 15-minute countdown timer on screen*

---

## Part 3: ZeroDB Integration (30 min)

### Why ZeroDB?

> **Instructor:** "Your chat works great, but what happens when you refresh the page?"
>
> *Demonstrate: refresh browser, all messages gone*
>
> "Let's fix that AND add some superpowers: vector search, memory, and semantic recall."

### Live Coding: Persistent Chat History

#### Step 1: Initialize ZeroDB Client

```tsx
// lib/zerodb.ts
import { ZeroDBClient } from '@ainative/zerodb-sdk';

export const zerodb = new ZeroDBClient({
  apiKey: process.env.ZERODB_API_KEY!,
  projectId: process.env.ZERODB_PROJECT_ID!,
});

// Create a table for chat sessions (run once)
export async function initChatTable() {
  await zerodb.createTable({
    table_name: 'chat_sessions',
    schema: {
      fields: {
        session_id: { type: 'string', required: true },
        messages: { type: 'array', required: true },
        created_at: { type: 'timestamp', required: true },
        updated_at: { type: 'timestamp', required: true },
      },
      indexes: [{ field: 'session_id', unique: true }],
    },
  });
}
```

#### Step 2: Add Save/Load Functions

```tsx
// lib/chat-storage.ts
import { zerodb } from './zerodb';

export async function saveChat(sessionId: string, messages: Message[]) {
  await zerodb.updateRows({
    table_id: 'chat_sessions',
    filter: { session_id: sessionId },
    update: {
      $set: {
        messages,
        updated_at: new Date().toISOString(),
      },
    },
    upsert: true,
  });
}

export async function loadChat(sessionId: string): Promise<Message[]> {
  const results = await zerodb.queryRows({
    table_id: 'chat_sessions',
    filter: { session_id: sessionId },
    limit: 1,
  });

  return results.rows[0]?.messages ?? [];
}
```

#### Step 3: Wire Up the UI

```tsx
// app/chat/page.tsx - updated
'use client';

import { useEffect } from 'react';
import { useAIChat } from '@ainative/ai-kit-react';
import { saveChat, loadChat } from '@/lib/chat-storage';

export default function ChatPage() {
  const sessionId = 'demo-session'; // In real app: use auth or UUID

  const chat = useAIChat({
    api: '/api/chat',
    onFinish: (message) => {
      // Auto-save after each response
      saveChat(sessionId, [...chat.messages, message]);
    },
  });

  // Load chat on mount
  useEffect(() => {
    loadChat(sessionId).then((messages) => {
      if (messages.length > 0) {
        chat.setMessages(messages);
      }
    });
  }, []);

  // ... rest of component
}
```

### Vector Search Demo (10 min)

> **Instructor:** "Now let's add the magic - semantic search over your chat history!"

```tsx
// Add a search feature to find relevant past conversations
import { useAICompletion } from '@ainative/ai-kit-react';

function ChatSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = async () => {
    // Generate embedding for the query
    const embedding = await zerodb.generateEmbedding(query);

    // Search chat history semantically
    const searchResults = await zerodb.searchVectors({
      query_vector: embedding,
      namespace: 'chat_messages',
      limit: 5,
      threshold: 0.7,
    });

    setResults(searchResults.results);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Search Past Chats</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What did we discuss about..."
        className="w-full p-2 border rounded"
      />
      <button onClick={search} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Search
      </button>

      {results.map((r, i) => (
        <div key={i} className="mt-2 p-2 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">Score: {r.similarity.toFixed(2)}</p>
          <p>{r.document}</p>
        </div>
      ))}
    </div>
  );
}
```

### Group Activity: "Memory Architect" (8 min)

> **Instructor:** "Time for another breakout session! I'm putting you in pairs to design a memory system for ONE of these use cases:
> 1. A coding assistant that remembers your tech stack preferences
> 2. A customer support bot that recalls past tickets
> 3. A personal journal AI that surfaces relevant past entries
>
> Discuss: What do you store? How do you retrieve it? When do you inject it into context?
>
> Use a shared Google Doc or just talk it through - you'll have 5 minutes, then we'll share ideas!"
>
> *Create breakout rooms, 2 people each, 5 minutes*
>
> **After breakout rooms:**
>
> **Instructor:** "Welcome back! Let's hear some designs. Who wants to share what they came up with? Unmute or drop your ideas in chat!"

---

## Part 4: Advanced Patterns & Tools (30 min)

### Pattern 1: Tool Invocation UI

```tsx
// Building a tool-enabled assistant
import { useTool } from '@ainative/ai-kit-react';

function WeatherAssistant() {
  const { invoke, isLoading, result, error } = useTool({
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
      },
      required: ['location'],
    },
    execute: async ({ location }) => {
      const res = await fetch(`/api/weather?city=${location}`);
      return res.json();
    },
  });

  return (
    <div>
      <button onClick={() => invoke({ location: 'San Francisco' })}>
        {isLoading ? 'Checking...' : 'Get SF Weather'}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p>Temperature: {result.temp}°F</p>
          <p>Conditions: {result.conditions}</p>
        </div>
      )}
    </div>
  );
}
```

### Pattern 2: Debouncing & Rate Limiting

```tsx
// Protect your API and wallet!
import { useAICompletion } from '@ainative/ai-kit-react';
import { useDebouncedCallback } from 'use-debounce';

function SmartAutocomplete() {
  const { complete, completion, isLoading } = useAICompletion({
    api: '/api/complete',
  });

  // Debounce to prevent excessive API calls
  const debouncedComplete = useDebouncedCallback(
    (text: string) => {
      if (text.length > 10) { // Only complete longer inputs
        complete(text);
      }
    },
    500 // Wait 500ms after user stops typing
  );

  return (
    <div>
      <textarea
        onChange={(e) => debouncedComplete(e.target.value)}
        placeholder="Start typing..."
        className="w-full h-32 p-2 border rounded"
      />
      {isLoading && <p className="text-gray-500">Thinking...</p>}
      {completion && (
        <div className="mt-2 p-2 bg-green-50 rounded">
          <p className="text-sm text-gray-600">Suggestion:</p>
          <p>{completion}</p>
        </div>
      )}
    </div>
  );
}
```

### Pattern 3: Error Boundaries for AI

```tsx
// app/components/AIErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AIErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-700">AI Feature Unavailable</h3>
          <p className="text-red-600 mt-2">
            {this.state.error?.message || 'Something went wrong with the AI service.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<AIErrorBoundary>
  <ChatInterface />
</AIErrorBoundary>
```

### Pattern 4: Token Limit Handling

```tsx
// Gracefully handle context limits
const MAX_TOKENS = 4096;
const RESERVED_FOR_RESPONSE = 1024;

function useTokenAwareChat() {
  const chat = useAIChat({ api: '/api/chat' });

  const appendWithTokenCheck = async (message: Message) => {
    const currentTokens = estimateTokens(chat.messages);
    const newTokens = estimateTokens([message]);

    if (currentTokens + newTokens > MAX_TOKENS - RESERVED_FOR_RESPONSE) {
      // Summarize old messages or truncate
      const summarized = await summarizeMessages(chat.messages.slice(0, -5));
      chat.setMessages([
        { role: 'system', content: `Previous context: ${summarized}` },
        ...chat.messages.slice(-5),
      ]);
    }

    return chat.append(message);
  };

  return { ...chat, append: appendWithTokenCheck };
}

function estimateTokens(messages: Message[]): number {
  // Rough estimate: 4 chars = 1 token
  return messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
}
```

### Interactive Quiz: "Which Pattern?" (5 min)

> **Instructor:** "Quick quiz time! I'll describe a problem, you type your answer in the chat. Ready?"

1. "Users are sending 100 requests per second by holding down Enter - which pattern?"
   *Wait for chat answers* → **Debouncing**

2. "The app crashes when Claude returns an error - which pattern?"
   *Wait for chat answers* → **Error Boundary**

3. "The chat forgets everything after 20 messages - which pattern?"
   *Wait for chat answers* → **Token Limit Handling**

4. "I need to call a weather API from the AI - which pattern?"
   *Wait for chat answers* → **Tool Invocation**

> **Instructor:** "Great job everyone! These patterns will save you hours of debugging in production."

---

## Part 5: Ship It! Deploy to Vercel (30 min)

### Pre-Deploy Checklist

```bash
# 1. Ensure all env vars are set
cat .env.local

# 2. Build locally first
pnpm build

# 3. Run production mode locally
pnpm start

# 4. Test critical paths
# - Send a chat message
# - Verify streaming works
# - Check error handling
```

### Live Deploy

> **Instructor:** "Let's deploy this together. Everyone should have a Vercel account."

```bash
# Install Vercel CLI if needed
pnpm i -g vercel

# Login
vercel login

# Deploy!
vercel

# Set environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add ZERODB_API_KEY
vercel env add ZERODB_PROJECT_ID

# Deploy to production
vercel --prod
```

### Post-Deploy: Add Analytics (Optional)

```tsx
// Track AI usage for optimization
import { Analytics } from '@vercel/analytics/react';

// In your layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Celebration Moment!

> **Instructor:** "Everyone share your deployed URL in the Google Meet chat! Let's see what you built!"
>
> *Give 5 minutes for everyone to deploy and share*
>
> **Instructor:** "Amazing work everyone! Let me click through a few of these... [click on shared URLs and react]
>
> Congratulations! You just deployed a production-ready AI application from your home/office/coffee shop. Give yourselves a round of applause - turn on your mics so we can hear it!"
>
> *Encourage everyone to unmute briefly for celebration*

---

## Wrap-up & Resources (15 min)

### What We Built Today

- A streaming chat interface with AI Kit React hooks
- Persistent storage with ZeroDB
- Semantic search over chat history
- Production-ready error handling
- Deployed to Vercel

### Take-Home Challenges

> **Instructor:** "Here are some challenges to try on your own this week:"

1. **Beginner:** Add a "New Chat" button that creates a fresh session
2. **Intermediate:** Implement chat export to Markdown/JSON
3. **Advanced:** Add multi-modal support (image uploads)
4. **Expert:** Build an agent that can browse the web and summarize pages

### Resources

| Resource | Link |
|----------|------|
| AI Kit Docs | https://docs.ainative.dev |
| AI Kit GitHub | https://github.com/AINativeOrg/ai-kit |
| ZeroDB Console | https://console.zerodb.ai |
| Workshop Repo | https://github.com/AINativeOrg/ai-kit-react-workshop |
| Discord Community | https://discord.gg/ainative |

### Feedback Form

> **Instructor:** "Before you go, please fill out our quick feedback form - I'm dropping the link in the chat right now. It really helps us improve these virtual workshops!"
>
> *Drop feedback form link in Google Meet chat*
>
> "I'll keep the Meet open for another 10 minutes if anyone has questions or just wants to chat. Otherwise, feel free to drop off once you've submitted the form!"

### Final Words

> **Instructor:** "Thank you all for joining AI Kit Framework Day! Remember:
>
> 1. **Start small** - Build a chat, then add features
> 2. **Use the hooks** - Don't reinvent streaming state
> 3. **Store everything** - ZeroDB makes it easy
> 4. **Ship fast** - Vercel + AI Kit = production in minutes
>
> Now go build something amazing! Tag us @AINativeOrg when you ship!"

---

## Appendix: Troubleshooting Guide

### Common Issues

| Issue | Solution |
|-------|----------|
| "ANTHROPIC_API_KEY not found" | Check `.env.local` file, restart dev server |
| Streaming not working | Ensure API route returns `streamResponse()` |
| ZeroDB connection failed | Verify project ID and API key |
| Build fails on Vercel | Check environment variables are set |
| CORS errors | Use API routes, not direct client calls |

### Instructor Notes (Virtual Delivery)

**Before the Workshop:**
- Test your audio/video setup and screen sharing
- Have a backup internet connection ready (mobile hotspot)
- Pre-create breakout room configurations in Google Meet
- Prepare a shared Google Doc for collaborative notes
- Have backup API keys ready in case students don't have their own

**During the Workshop:**
- Keep a working deployed demo as reference (have URL ready to share)
- Have a co-host monitor chat while you present
- Use Google Meet reactions/polls for quick engagement checks
- Take screenshots of the Meet for social media
- If someone's stuck, offer to have them share screen for live debugging

**Virtual-Specific Tips:**
- Speak slightly slower than in-person (audio latency)
- Pause more frequently for questions ("Any questions in the chat?")
- Use attendee names when responding to make it personal
- Keep energy high - virtual fatigue is real!
- Have water nearby - you'll be talking a lot!

---

## Component Reference Card

```tsx
// Essential imports
import {
  useAIChat,           // Full chat state management
  useAICompletion,     // Single completions
  useTool,             // Tool invocation
  ChatMessage,         // Message bubble component
  ChatInput,           // Input with send/stop
  StreamingMessage,    // Markdown + code + streaming
  StreamingIndicator,  // Loading dots animation
  CodeBlock,           // Syntax highlighted code
} from '@ainative/ai-kit-react';

// Hook patterns
const chat = useAIChat({ api, initialMessages, onFinish, onError });
const completion = useAICompletion({ api });
const tool = useTool({ name, description, parameters, execute });

// Common props
<ChatMessage role="user|assistant" content="..." isStreaming={boolean} />
<StreamingMessage content="..." enableMarkdown enableCodeHighlight />
<ChatInput value onChange onSubmit isLoading onStop placeholder />
```

---

*Workshop created for AI Kit Framework Day — React Edition*
*Version 1.0 | December 2024*
