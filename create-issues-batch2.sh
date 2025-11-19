#!/bin/bash

# AIKIT-11
gh issue create --title "[AIKIT-11] Streaming agent execution" --body "**User Story:** As a developer, I want streaming agent execution so I can show progress in real-time

**Acceptance Criteria:**
- Returns async iterator of agent steps
- Emits thoughts, tool calls, tool results, final answer
- UI can update as agent thinks

**Story Points:** 8" --label "epic:agent-orchestration,story-points:8,phase:1-mvp"

# AIKIT-12
gh issue create --title "[AIKIT-12] Web search tool" --body "**User Story:** As a developer, I want a web search tool so agents can find information online

**Acceptance Criteria:**
- Integrates with search API (Brave, Google, etc.)
- Returns structured results (title, snippet, URL)
- Handles rate limiting and errors

**Story Points:** 8" --label "epic:agent-orchestration,story-points:8,phase:1-mvp"

# AIKIT-13
gh issue create --title "[AIKIT-13] Calculator tool" --body "**User Story:** As a developer, I want a calculator tool so agents can do precise math

**Acceptance Criteria:**
- Safe evaluation (no eval() exploits)
- Supports basic arithmetic, algebra, statistics
- Returns formatted results

**Story Points:** 5" --label "epic:agent-orchestration,story-points:5,phase:1-mvp"

# AIKIT-14
gh issue create --title "[AIKIT-14] Code interpreter tool" --body "**User Story:** As a developer, I want a code interpreter tool so agents can execute code safely

**Acceptance Criteria:**
- Sandboxed execution environment
- Supports Python, JavaScript
- Timeout protection (max 30s execution)

**Story Points:** 13" --label "epic:agent-orchestration,story-points:13,phase:3-advanced"

# AIKIT-15
gh issue create --title "[AIKIT-15] ZeroDB query tool" --body "**User Story:** As a developer, I want a ZeroDB query tool so agents can access database data

**Acceptance Criteria:**
- Converts natural language to ZeroDB queries
- Returns formatted results
- Handles query errors

**Story Points:** 8" --label "epic:agent-orchestration,story-points:8,phase:3-advanced"

# AIKIT-16
gh issue create --title "[AIKIT-16] AgentSwarm for multi-agent coordination" --body "**User Story:** As a developer, I want an AgentSwarm that coordinates multiple agents so I can delegate complex tasks

**Acceptance Criteria:**
- Supervisor agent routes tasks to specialists
- Collects and synthesizes results
- Returns combined execution trace

**Story Points:** 13" --label "epic:agent-orchestration,story-points:13,phase:3-advanced"

# AIKIT-17
gh issue create --title "[AIKIT-17] Component registry" --body "**User Story:** As a developer, I want a component registry so I can map tool results to UI components

**Acceptance Criteria:**
- Register component with tool name
- Type-safe prop mapping function
- Dynamic lookup at runtime

**Story Points:** 5" --label "epic:tool-component-mapping,story-points:5,phase:3-advanced"

# AIKIT-18
gh issue create --title "[AIKIT-18] AgentResponse component" --body "**User Story:** As a React developer, I want an AgentResponse component so tool results render automatically

**Acceptance Criteria:**
- Maps tool results to registered components
- Renders markdown for text responses
- Handles unknown tools gracefully

**Story Points:** 8" --label "epic:tool-component-mapping,story-points:8,phase:3-advanced"

# AIKIT-19
gh issue create --title "[AIKIT-19] Streaming tool result components" --body "**User Story:** As a developer, I want streaming tool result components so UI updates as tools execute

**Acceptance Criteria:**
- Shows progress bar during execution
- Updates to final result on completion
- Shows error state on failure

**Story Points:** 5" --label "epic:tool-component-mapping,story-points:5,phase:3-advanced"

# AIKIT-20
gh issue create --title "[AIKIT-20] Conversation store" --body "**User Story:** As a developer, I want a conversation store so messages persist across sessions

**Acceptance Criteria:**
- Supports memory, Redis, ZeroDB backends
- CRUD operations: save, load, append, clear
- Configurable TTL

**Story Points:** 8" --label "epic:state-management,story-points:8,phase:1-mvp"

echo "Created issues 11-20!"
