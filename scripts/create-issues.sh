#!/bin/bash

# AIKIT-1
gh issue create \
  --title "[AIKIT-1] Framework-agnostic streaming client" \
  --body "**User Story:** As a developer, I want a framework-agnostic streaming client so I can handle LLM responses without framework lock-in

**Acceptance Criteria:**
- Core \`AIStream\` class handles SSE and WebSocket transports
- Automatic reconnection with exponential backoff (3 retries)
- Test coverage ≥90%

**Story Points:** 8
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:8,phase:1-mvp"

# AIKIT-2
gh issue create \
  --title "[AIKIT-2] Automatic token counting" \
  --body "**User Story:** As a developer, I want automatic token counting so I can track costs without manual calculation

**Acceptance Criteria:**
- Token count accurate to ±1% compared to provider billing
- Supports OpenAI, Anthropic, Llama token counting
- Returns usage data in standardized format

**Story Points:** 5
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:5,phase:1-mvp"

# AIKIT-3
gh issue create \
  --title "[AIKIT-3] Configurable retry logic" \
  --body "**User Story:** As a developer, I want configurable retry logic so failed requests automatically recover

**Acceptance Criteria:**
- Configurable retry count and backoff strategy
- Distinguishes between retriable (5xx) and non-retriable (4xx) errors
- Emits retry events for monitoring

**Story Points:** 5
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:5,phase:1-mvp"

# AIKIT-4
gh issue create \
  --title "[AIKIT-4] React useAIStream hook" \
  --body "**User Story:** As a React developer, I want a \`useAIStream\` hook so I can add streaming chat in 5 lines

**Acceptance Criteria:**
- Hook manages messages state automatically
- Provides \`send\`, \`reset\`, \`retry\` functions
- Handles cleanup on unmount
- Works in Next.js, Remix, Vite

**Story Points:** 8
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:8,phase:1-mvp"

# AIKIT-5
gh issue create \
  --title "[AIKIT-5] Streaming message components" \
  --body "**User Story:** As a React developer, I want streaming message components so I can show partial responses elegantly

**Acceptance Criteria:**
- \`StreamingMessage\` component handles token-by-token updates
- Smooth animations for text appearance
- Supports markdown rendering with syntax highlighting

**Story Points:** 5
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:5,phase:1-mvp"

# AIKIT-6
gh issue create \
  --title "[AIKIT-6] Svelte createAIStream store" \
  --body "**User Story:** As a Svelte developer, I want a \`createAIStream\` store so I can use streaming in SvelteKit

**Acceptance Criteria:**
- Returns Svelte readable store
- Reactive to message updates
- Works in SvelteKit SSR

**Story Points:** 8
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:8,phase:2-multi-framework"

# AIKIT-7
gh issue create \
  --title "[AIKIT-7] Vue useAIStream composable" \
  --body "**User Story:** As a Vue developer, I want a \`useAIStream\` composable so I can use streaming in Nuxt

**Acceptance Criteria:**
- Returns reactive refs
- Works with Vue 3 composition API
- Compatible with Nuxt 3

**Story Points:** 8
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:8,phase:2-multi-framework"

# AIKIT-8
gh issue create \
  --title "[AIKIT-8] StreamingResponse class" \
  --body "**User Story:** As a backend developer, I want a \`StreamingResponse\` class so I can easily create streaming endpoints

**Acceptance Criteria:**
- Helper methods for OpenAI, Anthropic, Llama responses
- Automatic format conversion
- Works with Next.js API routes, Express, Fastify

**Story Points:** 5
**Epic:** Streaming Primitives" \
  --label "epic:streaming-primitives,story-points:5,phase:1-mvp"

# AIKIT-9
gh issue create \
  --title "[AIKIT-9] Define agents with tools" \
  --body "**User Story:** As a developer, I want to define agents with tools so I can create multi-step workflows

**Acceptance Criteria:**
- Agent definition interface with name, prompt, tools
- Tool definition with JSON schema validation
- Max iteration limit prevents infinite loops

**Story Points:** 13
**Epic:** Agent Orchestration" \
  --label "epic:agent-orchestration,story-points:13,phase:1-mvp"

# AIKIT-10
gh issue create \
  --title "[AIKIT-10] AgentExecutor for multi-step tasks" \
  --body "**User Story:** As a developer, I want an \`AgentExecutor\` that runs agents so I can execute multi-step tasks

**Acceptance Criteria:**
- Executes agent with tool calling loop
- Returns execution trace for debugging
- Handles tool errors gracefully

**Story Points:** 13
**Epic:** Agent Orchestration" \
  --label "epic:agent-orchestration,story-points:13,phase:1-mvp"

echo "Created first 10 issues!"
