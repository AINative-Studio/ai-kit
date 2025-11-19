# AI-Native AI Kit: Production Requirements Document

## Product Overview

A framework-agnostic SDK that provides essential primitives for building AI-powered applications. The "Stripe for LLM Applications" - not a full framework, but the critical infrastructure that every AI app needs and doesn't want to build from scratch.

---

## Core Philosophy

**Not a framework replacement.** AI Kit is infrastructure that makes existing frameworks (Next.js, Svelte, Vue, etc.) AI-native by providing:

1. **Streaming primitives** - Handle real-time LLM responses elegantly
2. **Agent orchestration** - Coordinate multi-step AI workflows
3. **Tool/component mapping** - Bridge LLM outputs to UI components
4. **State management** - Handle conversation context and memory
5. **Cost/observability** - Track tokens, latency, caching
6. **Safety/guardrails** - Prompt injection detection, PII filtering

---

## Strategic Positioning

### What We're NOT Building

- ❌ Another React framework (Next.js exists)
- ❌ UI component library (shadcn/ui exists)
- ❌ LLM provider (OpenAI, Anthropic exist)

### What We ARE Building

- ✅ The glue layer between LLMs and frameworks
- ✅ Production-grade primitives for AI features
- ✅ Developer experience tools (debugging, testing, monitoring)
- ✅ Integration with AINative ecosystem (RLHF, ZeroDB, Auth)

### The Market Gap

Current state of AI development:

```tsx
// What developers write today (100+ lines of boilerplate)
const [messages, setMessages] = useState([])
const [isStreaming, setIsStreaming] = useState(false)

async function chat(prompt) {
  setIsStreaming(true)
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [...messages, { role: 'user', content: prompt }] })
  })

  const reader = response.body.getReader()
  let accumulated = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    accumulated += new TextDecoder().decode(value)
    setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: accumulated }])
  }

  setIsStreaming(false)
}

// Track costs? Monitor latency? Handle errors? Retry logic? Cache? Good luck.
```

**With AI Kit:**

```tsx
import { useAIStream } from '@ainative/ai-kit'

const { messages, send, isStreaming } = useAIStream({
  endpoint: '/api/chat',
  onCost: (tokens) => trackCost(tokens), // automatic
  onError: (err) => handleError(err),    // automatic
  cache: true                             // automatic
})

// That's it. Done.
```

---

## Target Users

### Primary: Mid-Senior Engineers Building AI Features

- **Profile**: 3-7 years experience, building product features (not infra)
- **Pain Point**: "I just want to add chat to my app, why is this 500 lines of code?"
- **Success Metric**: Time from idea → working feature < 1 hour

### Secondary: AI-Native Startups

- **Profile**: Small teams (2-10 engineers) building AI-first products
- **Pain Point**: "We're reinventing the wheel for streaming, costs, monitoring"
- **Success Metric**: Can build MVP without hiring ML engineer

### Tertiary: Enterprise Teams

- **Profile**: Large orgs adding AI to existing products
- **Pain Point**: "Need observability, safety, compliance out of the box"
- **Success Metric**: Pass security audit without custom implementation

---

## Core Modules

### Module 1: Streaming Primitives

**Objective:** Make streaming LLM responses trivial in any framework.

**Requirements:**

1. **Framework Adapters**

    ```tsx
    // @ainative/ai-kit/react
    export function useAIStream(config: StreamConfig): StreamResult

    // @ainative/ai-kit/svelte
    export function createAIStream(config: StreamConfig): Readable<StreamResult>

    // @ainative/ai-kit/vue
    export function useAIStream(config: StreamConfig): Ref<StreamResult>

    // @ainative/ai-kit/core (framework-agnostic)
    export class AIStream { /* ... */ }
    ```

2. **StreamConfig Interface**

    ```tsx
    interface StreamConfig {
      endpoint: string                    // API endpoint
      model?: string                      // LLM model (default: from env)
      systemPrompt?: string               // System message
      onToken?: (token: string) => void   // Per-token callback
      onCost?: (usage: Usage) => void     // Cost tracking
      onError?: (error: Error) => void    // Error handling
      retry?: RetryConfig                 // Retry logic
      cache?: boolean | CacheConfig       // Response caching
      timeout?: number                    // Request timeout
    }
    ```

3. **StreamResult Interface**

    ```tsx
    interface StreamResult {
      messages: Message[]           // Conversation history
      isStreaming: boolean          // Streaming state
      error: Error | null           // Error state
      send: (content: string) => Promise<void>  // Send message
      reset: () => void             // Clear conversation
      retry: () => Promise<void>    // Retry last message

      // Metadata
      usage: {
        totalTokens: number
        estimatedCost: number
        latency: number
      }
    }
    ```

4. **Server-Side Utilities**

    ```tsx
    // @ainative/ai-kit/server
    export class StreamingResponse {
      constructor(config: {
        model: string
        messages: Message[]
        onToken?: (token: string) => void
      })

      stream(): ReadableStream<Uint8Array>

      // Helpers
      static fromOpenAI(response: OpenAI.ChatCompletion): StreamingResponse
      static fromAnthropic(response: Anthropic.Message): StreamingResponse
      static fromLlama(response: LlamaResponse): StreamingResponse
    }
    ```

**Acceptance Criteria:**

- Works in React, Svelte, Vue (tested in all 3 frameworks)
- Handles SSE and WebSocket transports
- Automatic reconnection on disconnect (3 retries, exponential backoff)
- Token counting accurate to ±1% (compared to provider billing)
- **Test Coverage: 90%+** (critical infra, must be bulletproof)

**Testing Requirements:**

```tsx
// __tests__/streaming/
- react-adapter.test.tsx (hooks, state updates, cleanup)
- svelte-adapter.test.ts (stores, reactivity)
- vue-adapter.test.ts (refs, computed)
- core-stream.test.ts (transport, reconnect, error handling)
- server-utilities.test.ts (response formatting, providers)
```

---

### Module 2: Agent Orchestration

**Objective:** Coordinate multi-step AI workflows with tool calling.

**Requirements:**

1. **Agent Definition**

    ```tsx
    interface Agent {
      name: string
      systemPrompt: string
      model: string
      tools: Tool[]
      maxIterations?: number        // Prevent infinite loops
      temperature?: number
      streaming?: boolean
    }

    interface Tool {
      name: string
      description: string           // What it does (for LLM)
      parameters: JSONSchema        // Expected params
      execute: (params: any) => Promise<any>
    }
    ```

2. **Agent Executor**

    ```tsx
    export class AgentExecutor {
      constructor(agent: Agent)

      async run(input: string): Promise<AgentResult> {
        // 1. Send to LLM with tool descriptions
        // 2. If tool call → execute tool
        // 3. Send result back to LLM
        // 4. Repeat until final answer or max iterations
        // 5. Return result + execution trace
      }

      stream(input: string): AsyncIterator<AgentStep>
    }

    interface AgentResult {
      answer: string
      steps: AgentStep[]
      usage: Usage
      executionTime: number
    }

    interface AgentStep {
      type: 'thought' | 'tool_call' | 'tool_result' | 'answer'
      content: string
      timestamp: number
    }
    ```

3. **Built-in Tools**

    ```tsx
    // @ainative/ai-kit/tools
    export const webSearch: Tool          // Web search via API
    export const calculator: Tool         // Safe math evaluation
    export const codeInterpreter: Tool    // Execute code in sandbox
    export const zerodbQuery: Tool        // Query ZeroDB
    export const rlhfFeedback: Tool       // Submit RLHF feedback
    ```

4. **Multi-Agent Coordination**

    ```tsx
    export class AgentSwarm {
      constructor(agents: Agent[])

      async delegate(input: string): Promise<SwarmResult> {
        // 1. Supervisor agent decides which agent to use
        // 2. Delegate to specialist agent
        // 3. Collect results
        // 4. Synthesize final answer
      }
    }
    ```

**Acceptance Criteria:**

- Agent can call multiple tools in sequence
- Execution trace shows all steps (for debugging)
- Max iterations prevents infinite loops (tested with bad prompts)
- Built-in tools work correctly (web search returns results, calculator computes)
- Multi-agent coordination routes correctly (supervisor picks right agent 90%+ accuracy)
- **Test Coverage: 85%+** (complex logic, needs thorough testing)

**Testing Requirements:**

```tsx
// __tests__/agents/
- agent-executor.test.ts (single tool, multiple tools, max iterations)
- tool-calling.test.ts (parameter validation, execution, error handling)
- built-in-tools.test.ts (each tool independently)
- agent-swarm.test.ts (delegation, routing, synthesis)
- execution-trace.test.ts (step logging, timestamps)
```

---

### Module 3: Tool/Component Mapping

**Objective:** Bridge LLM tool calls to UI components automatically.

**Requirements:**

1. **Component Registry**

    ```tsx
    interface ComponentMap {
      [toolName: string]: {
        component: React.ComponentType<any>
        props: (toolResult: any) => object
      }
    }

    // Usage
    const registry = new ComponentRegistry()

    registry.register('web_search', {
      component: SearchResults,
      props: (result) => ({
        results: result.items,
        query: result.query
      })
    })
    ```

2. **React Integration**

    ```tsx
    // @ainative/ai-kit/react
    export function AgentResponse({
      steps,
      components
    }: {
      steps: AgentStep[]
      components: ComponentMap
    }) {
      return steps.map(step => {
        if (step.type === 'tool_result') {
          const mapping = components[step.toolName]
          const Component = mapping.component
          const props = mapping.props(step.result)
          return <Component {...props} />
        }

        if (step.type === 'thought' || step.type === 'answer') {
          return <Markdown content={step.content} />
        }
      })
    }
    ```

3. **Streaming Component Updates**

    ```tsx
    // Updates component as tool executes
    export function StreamingToolResult({ tool, execution }: Props) {
      const [progress, setProgress] = useState(0)
      const [result, setResult] = useState(null)

      // Update UI as tool streams progress
      execution.on('progress', setProgress)
      execution.on('complete', setResult)

      return (
        <div>
          {!result && <ProgressBar value={progress} />}
          {result && <ToolResultComponent data={result} />}
        </div>
      )
    }
    ```

**Acceptance Criteria:**

- Component registry supports dynamic registration
- Tool results map to components correctly (type-safe)
- Streaming updates work (progress → final result)
- Markdown rendering for text responses (with syntax highlighting)
- **Test Coverage: 80%+** (UI integration, less critical than core)

**Testing Requirements:**

```tsx
// __tests__/component-mapping/
- component-registry.test.ts (register, lookup, type safety)
- agent-response.test.tsx (rendering, tool results, markdown)
- streaming-updates.test.tsx (progress, completion, error states)
```

---

### Module 4: State Management

**Objective:** Handle conversation context, memory, and history.

**Requirements:**

1. **Conversation Store**

    ```tsx
    export class ConversationStore {
      constructor(config: {
        provider: 'memory' | 'redis' | 'zerodb'
        ttl?: number                    // Time to live
        maxMessages?: number            // Max history length
      })

      // Core operations
      async save(id: string, messages: Message[]): Promise<void>
      async load(id: string): Promise<Message[]>
      async append(id: string, message: Message): Promise<void>
      async clear(id: string): Promise<void>

      // Advanced
      async search(query: string): Promise<Conversation[]>  // Semantic search
      async summarize(id: string): Promise<string>          // Summarize long history
    }
    ```

2. **Context Window Management**

    ```tsx
    export class ContextManager {
      constructor(config: {
        maxTokens: number               // Model's context limit
        reserveTokens: number           // Reserve for response
        strategy: 'sliding' | 'summarize' | 'hybrid'
      })

      async truncate(messages: Message[]): Promise<Message[]> {
        // Fit messages within context window
        // Options:
        // - 'sliding': Keep most recent N messages
        // - 'summarize': Summarize old messages, keep recent verbatim
        // - 'hybrid': Summarize middle, keep first + last messages
      }
    }
    ```

3. **Memory Integration**

    ```tsx
    // Integration with ZeroDB MCP for persistent memory
    export class MemoryLayer {
      constructor(zerodb: ZeroDBClient)

      async store(userId: string, key: string, value: any): Promise<void>
      async retrieve(userId: string, key: string): Promise<any>
      async search(userId: string, query: string): Promise<any[]>

      // Smart retrieval: automatically inject relevant memories into context
      async enrichContext(userId: string, currentPrompt: string): Promise<Memory[]>
    }
    ```

4. **React Hooks**

    ```tsx
    // @ainative/ai-kit/react
    export function useConversation(id: string, options?: {
      store?: ConversationStore
      contextManager?: ContextManager
    }) {
      const [messages, setMessages] = useState<Message[]>([])
      const [isLoading, setIsLoading] = useState(true)

      // Load from store on mount
      useEffect(() => {
        store.load(id).then(setMessages).finally(() => setIsLoading(false))
      }, [id])

      // Auto-save on message changes
      useEffect(() => {
        if (messages.length > 0) {
          store.save(id, messages)
        }
      }, [messages])

      return { messages, isLoading }
    }
    ```

**Acceptance Criteria:**

- Conversations persist across page reloads (tested with Redis)
- Context truncation stays within token limits (tested with long conversations)
- Memory search returns relevant results (semantic similarity > 0.7)
- Auto-save doesn't cause race conditions (tested with rapid updates)
- **Test Coverage: 85%+** (data integrity is critical)

**Testing Requirements:**

```tsx
// __tests__/state-management/
- conversation-store.test.ts (CRUD, TTL, max messages)
- context-manager.test.ts (truncation strategies, token counting)
- memory-layer.test.ts (store, retrieve, search, enrichment)
- react-hooks.test.tsx (loading, auto-save, race conditions)
```

---

### Module 5: Cost & Observability

**Objective:** Track every penny and millisecond of LLM usage.

**Requirements:**

1. **Usage Tracking**

    ```tsx
    export class UsageTracker {
      constructor(config: {
        provider: 'openai' | 'anthropic' | 'llama' | 'custom'
        pricing: PricingConfig       // $ per token
        storage: 'memory' | 'redis' | 'postgres'
      })

      async track(event: {
        model: string
        promptTokens: number
        completionTokens: number
        latency: number
        cacheHit?: boolean
        userId?: string
        metadata?: object
      }): Promise<void>

      async getUsage(filters: {
        userId?: string
        dateRange?: [Date, Date]
        model?: string
      }): Promise<UsageReport>
    }

    interface UsageReport {
      totalTokens: number
      totalCost: number
      avgLatency: number
      requestCount: number
      cacheHitRate: number
      breakdown: {
        byModel: Record<string, ModelUsage>
        byUser: Record<string, UserUsage>
        byDay: DailyUsage[]
      }
    }
    ```

2. **Real-Time Monitoring**

    ```tsx
    export class MonitoringClient {
      constructor(config: {
        endpoint?: string            // Optional external monitoring service
        samplingRate?: number        // % of requests to log (default: 100%)
      })

      // Automatic instrumentation
      instrumentAgent(agent: Agent): Agent
      instrumentStream(stream: AIStream): AIStream

      // Manual events
      logEvent(event: {
        type: 'generation' | 'tool_call' | 'error' | 'cache_hit'
        data: object
        timestamp: number
      }): void

      // Query interface
      async query(filters: QueryFilters): Promise<Event[]>
    }
    ```

3. **Cost Alerts**

    ```tsx
    export class CostAlerts {
      constructor(tracker: UsageTracker)

      setThreshold(config: {
        type: 'daily' | 'monthly' | 'per_user'
        limit: number                // $ amount
        action: (usage: UsageReport) => void
      }): void

      // Example:
      alerts.setThreshold({
        type: 'daily',
        limit: 100,
        action: (usage) => {
          if (usage.totalCost > 100) {
            sendAlert(`Daily cost exceeded: ${usage.totalCost}`)
          }
        }
      })
    }
    ```

4. **Dashboard Components**

    ```tsx
    // @ainative/ai-kit/react
    export function UsageDashboard({ userId }: { userId?: string }) {
      const usage = useUsage({ userId, dateRange: [startOfMonth, now] })

      return (
        <div>
          <CostChart data={usage.breakdown.byDay} />
          <LatencyChart data={usage.avgLatency} />
          <ModelBreakdown data={usage.breakdown.byModel} />
          <CacheHitRate rate={usage.cacheHitRate} />
        </div>
      )
    }
    ```

**Acceptance Criteria:**

- Token counting matches provider billing (±1% accuracy)
- Latency measurements include all overhead (network, processing, queuing)
- Cost alerts trigger within 1 minute of threshold breach
- Dashboard displays real-time data (< 5 second lag)
- **Test Coverage: 80%+** (money is involved, must be accurate)

**Testing Requirements:**

```tsx
// __tests__/observability/
- usage-tracker.test.ts (tracking, storage, retrieval, accuracy)
- monitoring-client.test.ts (instrumentation, logging, querying)
- cost-alerts.test.ts (threshold triggers, alert delivery)
- dashboard-components.test.tsx (data display, real-time updates)
```

---

### Module 6: Safety & Guardrails

**Objective:** Protect against prompt injection, PII leakage, and malicious use.

**Requirements:**

1. **Prompt Injection Detection**

    ```tsx
    export class PromptGuard {
      constructor(config: {
        sensitivity: 'low' | 'medium' | 'high'
        action: 'warn' | 'block' | 'sanitize'
      })

      async check(input: string): Promise<GuardResult> {
        // Patterns to detect:
        // - "Ignore previous instructions"
        // - "You are now DAN"
        // - Base64/hex encoded instructions
        // - Unicode obfuscation
        // - Role-play jailbreaks
      }
    }

    interface GuardResult {
      safe: boolean
      confidence: number           // 0-1
      threats: Threat[]
      sanitized?: string           // If action = 'sanitize'
    }

    interface Threat {
      type: 'injection' | 'jailbreak' | 'obfuscation'
      pattern: string
      severity: 'low' | 'medium' | 'high'
    }
    ```

2. **PII Detection & Redaction**

    ```tsx
    export class PIIGuard {
      constructor(config: {
        patterns: PIIPattern[]       // What to detect (email, SSN, etc.)
        action: 'redact' | 'hash' | 'block'
      })

      async scan(text: string): Promise<PIIResult> {
        // Detect: emails, phone numbers, SSN, credit cards, addresses
        // Redact: "My email is john@example.com" → "My email is [EMAIL_REDACTED]"
      }
    }

    interface PIIPattern {
      type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'custom'
      regex?: RegExp
      confidence: number
    }
    ```

3. **Content Moderation**

    ```tsx
    export class ContentModerator {
      constructor(config: {
        categories: ModerationCategory[]
        threshold: number            // 0-1 confidence
        provider?: 'openai' | 'custom'
      })

      async moderate(text: string): Promise<ModerationResult> {
        // Check for: hate speech, violence, sexual content, etc.
      }
    }

    type ModerationCategory =
      | 'hate'
      | 'violence'
      | 'sexual'
      | 'self-harm'
      | 'harassment'
    ```

4. **Rate Limiting**

    ```tsx
    export class RateLimiter {
      constructor(config: {
        windowMs: number             // Time window
        maxRequests: number          // Max in window
        keyGenerator: (req: Request) => string  // Usually userId or IP
        storage: 'memory' | 'redis'
      })

      async check(key: string): Promise<RateLimitResult> {
        // Returns: { allowed: boolean, remaining: number, resetAt: Date }
      }
    }
    ```

**Acceptance Criteria:**

- Prompt injection detection catches 95%+ of common attacks (tested against benchmark)
- PII redaction identifies all emails, phones, SSNs (100% recall on test set)
- Content moderation API integration works (OpenAI Moderation API)
- Rate limiting blocks excessive requests (tested with load testing)
- **Test Coverage: 90%+** (security is critical)

**Testing Requirements:**

```tsx
// __tests__/safety/
- prompt-guard.test.ts (injection patterns, jailbreaks, obfuscation)
- pii-guard.test.ts (detection recall, redaction accuracy)
- content-moderator.test.ts (API integration, threshold handling)
- rate-limiter.test.ts (window enforcement, distributed scenarios)
```

---

### Module 7: Framework Adapters

**Objective:** First-class support for popular frameworks.

**Requirements:**

1. **React Adapter** (`@ainative/ai-kit/react`)

    ```tsx
    // Hooks
    export function useAIStream(config: StreamConfig): StreamResult
    export function useAgent(agent: Agent): AgentController
    export function useConversation(id: string): ConversationController
    export function useUsage(filters?: UsageFilters): UsageReport

    // Components
    export function AgentResponse({ steps, components }: Props)
    export function UsageDashboard({ userId }: Props)
    export function StreamingMessage({ content, isStreaming }: Props)
    ```

2. **Svelte Adapter** (`@ainative/ai-kit/svelte`)

    ```tsx
    // Stores
    export function createAIStream(config: StreamConfig): Readable<StreamResult>
    export function createAgent(agent: Agent): Readable<AgentController>
    export function createConversation(id: string): Readable<ConversationController>

    // Actions
    export function aiStream(node: HTMLElement, config: StreamConfig): ActionReturn
    ```

3. **Vue Adapter** (`@ainative/ai-kit/vue`)

    ```tsx
    // Composables
    export function useAIStream(config: StreamConfig): Ref<StreamResult>
    export function useAgent(agent: Agent): Ref<AgentController>
    export function useConversation(id: string): Ref<ConversationController>

    // Components
    export const AgentResponse: DefineComponent<Props>
    export const UsageDashboard: DefineComponent<Props>
    ```

4. **Next.js Utilities** (`@ainative/ai-kit/nextjs`)

    ```tsx
    // API Route Helpers
    export function createStreamingRoute(handler: StreamHandler): NextApiHandler
    export function withRateLimit(handler: NextApiHandler, config: RateLimitConfig): NextApiHandler
    export function withAuth(handler: NextApiHandler): NextApiHandler

    // Example:
    export default withAuth(
      withRateLimit(
        createStreamingRoute(async (req, res) => {
          const stream = new StreamingResponse({ /* ... */ })
          return stream.stream()
        }),
        { windowMs: 60000, maxRequests: 100 }
      )
    )
    ```

**Acceptance Criteria:**

- React adapter works in Next.js, Remix, Vite (tested in all 3)
- Svelte adapter works in SvelteKit (tested)
- Vue adapter works in Nuxt, Vite (tested in both)
- All adapters have same API surface (documented in migration guide)
- **Test Coverage: 85%+** (framework integration is critical)

**Testing Requirements:**

```tsx
// __tests__/adapters/
- react-adapter.test.tsx (all hooks, all components)
- svelte-adapter.test.ts (stores, actions)
- vue-adapter.test.ts (composables, components)
- nextjs-utilities.test.ts (route helpers, middleware)
```

---

### Module 8: AINative Ecosystem Integration

**Objective:** Deep integration with AINative services.

**Requirements:**

1. **Authentication Integration**

    ```tsx
    // @ainative/ai-kit/auth
    export class AINativeAuth {
      constructor(config: {
        apiKey: string
        apiUrl: string
      })

      async login(email: string, password: string): Promise<AuthResult>
      async register(email: string, password: string): Promise<AuthResult>
      async logout(): Promise<void>
      async getCurrentUser(): Promise<User | null>

      // Middleware
      withAuth<T>(handler: (user: User) => T): T
    }
    ```

2. **RLHF Integration**

    ```tsx
    // @ainative/ai-kit/rlhf
    export class RLHFClient {
      constructor(config: { apiUrl: string, apiKey: string })

      async logGeneration(data: GenerationLog): Promise<void>
      async submitFeedback(data: Feedback): Promise<void>
      async getInsights(filters: InsightFilters): Promise<Insights>

      // Auto-instrumentation
      instrumentAgent(agent: Agent): Agent  // Automatically logs all generations
    }
    ```

3. **ZeroDB Integration**

    ```tsx
    // @ainative/ai-kit/zerodb
    export class ZeroDBClient {
      constructor(config: {
        apiUrl: string
        projectId: string
        credentials: { username: string, password: string }
      })

      async getSchema(table: string): Promise<Schema>
      async query(table: string, filters?: object): Promise<any[]>
      async insert(table: string, data: object): Promise<any>
      async update(table: string, id: string, data: object): Promise<any>
      async delete(table: string, id: string): Promise<void>

      // Tool for agents
      asAgentTool(): Tool  // Expose ZeroDB operations as agent tool
    }
    ```

4. **Design System MCP Integration**

    ```tsx
    // @ainative/ai-kit/design-system
    export class DesignSystemClient {
      constructor(config: { mcpServerUrl: string })

      async extractTokens(path: string): Promise<DesignTokens>
      async generateTheme(baseColors: string[]): Promise<Theme>
      async validateDesign(code: string): Promise<ValidationResult>

      // Prompt enhancement
      async getDesignConstraints(): Promise<string>  // For injection into prompts
    }
    ```

**Acceptance Criteria:**

- All AINative services accessible via unified SDK
- Authentication works (tested with real API)
- RLHF auto-instrumentation logs all generations (tested)
- ZeroDB CRUD operations work (integration test)
- Design System MCP extracts tokens correctly (tested with fixtures)
- **Test Coverage: 80%+** (integration tests, may use mocks)

**Testing Requirements:**

```tsx
// __tests__/ecosystem/
- auth-integration.test.ts (login, register, middleware)
- rlhf-integration.test.ts (logging, feedback, auto-instrumentation)
- zerodb-integration.test.ts (CRUD, schema, agent tool)
- design-system-integration.test.ts (tokens, themes, validation)
```

---

## Package Structure

```
@ainative/ai-kit/
├── core/                   # Framework-agnostic core
│   ├── streaming
│   ├── agents
│   ├── state
│   ├── observability
│   └── safety
├── react/                  # React adapter
├── svelte/                 # Svelte adapter
├── vue/                    # Vue adapter
├── nextjs/                 # Next.js utilities
├── auth/                   # AINative Auth
├── rlhf/                   # AINative RLHF
├── zerodb/                 # AINative ZeroDB
├── design-system/          # Design System MCP
└── tools/                  # Built-in agent tools
```

---

## Developer Experience

### Installation

```bash
# Core + React
npm install @ainative/ai-kit

# Or specific adapters
npm install @ainative/ai-kit-svelte
npm install @ainative/ai-kit-vue
```

### Quick Start

```tsx
// 1. Set up streaming chat (5 lines)
import { useAIStream } from '@ainative/ai-kit/react'

function Chat() {
  const { messages, send, isStreaming } = useAIStream({
    endpoint: '/api/chat'
  })

  return (
    <div>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
      <ChatInput onSend={send} disabled={isStreaming} />
    </div>
  )
}

// 2. Set up agent with tools (10 lines)
import { AgentExecutor } from '@ainative/ai-kit/core'
import { webSearch, calculator } from '@ainative/ai-kit/tools'

const agent = new AgentExecutor({
  name: 'Research Assistant',
  systemPrompt: 'You help users research topics.',
  model: 'claude-sonnet-4',
  tools: [webSearch, calculator]
})

const result = await agent.run('What is the GDP of France?')

// 3. Track costs (3 lines)
import { UsageTracker } from '@ainative/ai-kit/observability'

const tracker = new UsageTracker({ provider: 'anthropic' })
await tracker.track({ model: 'claude-sonnet-4', promptTokens: 100, completionTokens: 200 })
```

---

## Success Metrics

### Adoption Metrics (6 months)

- **NPM Downloads**: 10,000+/month
- **GitHub Stars**: 1,000+
- **Active Projects**: 500+
- **Framework Coverage**: React (80%), Svelte (10%), Vue (10%)

### Quality Metrics

- **Test Coverage**: 85%+ overall
- **Bundle Size**: <50KB (core), <100KB (with React adapter)
- **Performance**: <10ms overhead per LLM call
- **Uptime**: 99.9% (for hosted services)

### Developer Satisfaction

- **Time to First Feature**: <30 minutes
- **Documentation Rating**: 4.5+/5
- **Issue Resolution Time**: <48 hours
- **Community Activity**: 50+ Discord members

---

## Non-Functional Requirements

### Performance

- Streaming latency: <50ms first token
- State persistence: <100ms read/write
- Cost tracking: <5ms overhead
- Memory usage: <50MB for typical app

### Security

- All API keys encrypted at rest
- HTTPS only for external services
- Input validation on all public APIs
- Regular security audits (quarterly)

### Compatibility

- Node.js: 18+
- Browsers: Modern evergreen (Chrome, Firefox, Safari, Edge)
- TypeScript: 5.0+
- React: 18+, Svelte: 4+, Vue: 3+

### Documentation

- API reference (auto-generated from TSDoc)
- Getting started guide (<5 min read)
- Framework-specific guides (React, Svelte, Vue)
- Example apps (3-5 full examples)
- Video tutorials (optional, nice-to-have)

---

## Out of Scope (Future Phases)

- Visual builder UI (like Retool for AI)
- Hosted vector database (use ZeroDB)
- Custom model hosting (use external providers)
- Multi-modal support (image/video generation)
- Fine-tuning infrastructure
- Workflow automation UI

---

## Acceptance Criteria Summary

**This PRD is considered complete when:**

1. All 8 modules implemented with specified functionality
2. Overall test coverage ≥85%
3. Works in React, Svelte, Vue (tested)
4. Published to NPM with proper versioning
5. Documentation complete (API ref + guides)
6. AINative ecosystem integration functional
7. Example apps demonstrating key features
8. Performance benchmarks met
9. Security audit passed
10. Developer onboarding <30 minutes

**Deliverable:** Production-ready SDK that makes any framework AI-native.
