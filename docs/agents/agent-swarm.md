# AgentSwarm - Multi-Agent Coordination System

## Overview

The `AgentSwarm` is a powerful multi-agent coordination system that enables complex task handling through a supervisor-specialist architecture. A supervisor agent analyzes tasks and delegates them to specialized agents, collects their results, and synthesizes a final response.

## Architecture

### Components

1. **Supervisor Agent**: Coordinates the swarm, makes routing decisions, and synthesizes results
2. **Specialist Agents**: Domain-specific agents that handle particular types of tasks
3. **Task Router**: Determines which specialist(s) should handle a given task
4. **Result Synthesizer**: Combines outputs from multiple specialists into a coherent response

### Workflow

```
User Task → Supervisor → Routing Decision → Specialist Execution → Result Synthesis → Final Response
```

## Features

- **Intelligent Task Routing**: Keyword-based or custom routing logic
- **Parallel Execution**: Execute multiple specialists concurrently
- **Priority Management**: Specialists can have priority levels for conflict resolution
- **Event-Driven**: Rich event system for monitoring and debugging
- **Execution Tracing**: Combined traces from all agents
- **Error Handling**: Graceful handling of specialist failures
- **Flexible Synthesis**: Custom result synthesis strategies

## Basic Usage

### Creating a Simple Swarm

```typescript
import { Agent, AgentSwarm, createAgent, createAgentSwarm } from '@aikit/core';

// Create supervisor agent
const supervisor = createAgent({
  id: 'supervisor',
  name: 'Task Coordinator',
  systemPrompt: 'You are a supervisor that coordinates specialist agents.',
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
  tools: [],
});

// Create specialist agents
const codeExpert = createAgent({
  id: 'code-expert',
  name: 'Code Expert',
  systemPrompt: 'You are an expert programmer who writes clean, efficient code.',
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
  tools: [],
});

const docsExpert = createAgent({
  id: 'docs-expert',
  name: 'Documentation Expert',
  systemPrompt: 'You are an expert technical writer.',
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
  tools: [],
});

// Create swarm
const swarm = createAgentSwarm({
  id: 'dev-swarm',
  name: 'Development Swarm',
  description: 'A swarm for development tasks',
  supervisor,
  specialists: [
    {
      id: 'code-expert',
      agent: codeExpert,
      specialization: 'Programming and code review',
      keywords: ['code', 'function', 'class', 'implement', 'bug', 'debug'],
      priority: 10,
    },
    {
      id: 'docs-expert',
      agent: docsExpert,
      specialization: 'Technical documentation',
      keywords: ['documentation', 'readme', 'guide', 'docs', 'explain'],
      priority: 5,
    },
  ],
});

// Execute a task
const result = await swarm.execute('Write a function to calculate fibonacci numbers');

console.log('Response:', result.response);
console.log('Success:', result.success);
console.log('Specialists used:', result.specialistResults.length);
```

## Advanced Usage

### Custom Task Router

Implement custom routing logic for complex decision-making:

```typescript
const swarm = createAgentSwarm({
  id: 'custom-swarm',
  name: 'Custom Routing Swarm',
  supervisor,
  specialists: [...],
  customRouter: async (task, specialists) => {
    // Analyze task complexity
    const taskLower = task.toLowerCase();

    // Custom routing logic
    if (taskLower.includes('urgent')) {
      return {
        specialistId: 'fast-specialist',
        reason: 'Urgent task requires fast specialist',
        confidence: 0.95,
      };
    }

    // Use ML model or heuristics
    const decision = await analyzeTaskWithML(task, specialists);

    return {
      specialistId: decision.specialistId,
      reason: decision.reason,
      confidence: decision.confidence,
    };
  },
});
```

### Custom Result Synthesizer

Combine results from multiple specialists with custom logic:

```typescript
const swarm = createAgentSwarm({
  id: 'synthesis-swarm',
  name: 'Custom Synthesis Swarm',
  supervisor,
  specialists: [...],
  customSynthesizer: async (results) => {
    // Filter successful results
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      return 'All specialists failed to complete the task.';
    }

    // Custom synthesis logic
    const combined = successfulResults
      .map(r => `[${r.specialization}]\n${r.response}`)
      .join('\n\n---\n\n');

    // Apply post-processing
    const synthesized = await postProcessResults(combined);

    return synthesized;
  },
});
```

### Parallel Execution

Enable parallel execution for independent tasks:

```typescript
const swarm = createAgentSwarm({
  id: 'parallel-swarm',
  name: 'Parallel Execution Swarm',
  supervisor,
  specialists: [...],
  parallelExecution: true,      // Enable parallel execution
  maxConcurrent: 3,              // Max 3 concurrent specialists
  specialistTimeoutMs: 30000,    // 30 second timeout per specialist
});

const result = await swarm.execute('Complex task requiring multiple specialists');

console.log('Parallel executions:', result.stats.parallelExecutions);
console.log('Total duration:', result.stats.totalDurationMs, 'ms');
```

### Event Monitoring

Monitor swarm execution with event listeners:

```typescript
const swarm = createAgentSwarm({...});

// Monitor routing decisions
swarm.on('swarm:routing', ({ task, decision }) => {
  console.log(`Routing to ${decision.specialistId}: ${decision.reason}`);
  console.log(`Confidence: ${decision.confidence}`);
});

// Monitor specialist execution
swarm.on('specialist:start', ({ specialistId, task }) => {
  console.log(`Specialist ${specialistId} starting...`);
});

swarm.on('specialist:complete', ({ specialistId, result }) => {
  console.log(`Specialist ${specialistId} completed in ${result.metadata.durationMs}ms`);
});

swarm.on('specialist:error', ({ specialistId, error }) => {
  console.error(`Specialist ${specialistId} failed:`, error.message);
});

// Monitor synthesis
swarm.on('swarm:synthesis', ({ results }) => {
  console.log(`Synthesizing ${results.length} specialist results`);
});

// Monitor completion
swarm.on('swarm:complete', ({ result }) => {
  console.log('Swarm execution complete!');
  console.log('Stats:', result.stats);
});

await swarm.execute('Task with monitoring');
```

### Dynamic Specialist Registration

Add or remove specialists at runtime:

```typescript
const swarm = createAgentSwarm({
  id: 'dynamic-swarm',
  name: 'Dynamic Swarm',
  supervisor,
  specialists: [
    // Initial specialists
  ],
});

// Add a new specialist
const securityExpert = createAgent({
  id: 'security-expert',
  name: 'Security Expert',
  systemPrompt: 'You are a cybersecurity expert.',
  llm: { provider: 'openai', model: 'gpt-4' },
  tools: [],
});

swarm.registerSpecialist({
  id: 'security-expert',
  agent: securityExpert,
  specialization: 'Security analysis and recommendations',
  keywords: ['security', 'vulnerability', 'exploit', 'attack'],
  priority: 15,
  concurrent: true,
});

// Remove a specialist
swarm.unregisterSpecialist('old-specialist-id');

// Get all specialists
const allSpecialists = swarm.getSpecialists();
console.log('Total specialists:', allSpecialists.length);
```

## API Reference

### AgentSwarm Class

#### Constructor

```typescript
constructor(config: SwarmConfig)
```

Creates a new AgentSwarm instance with the provided configuration.

#### Methods

##### `execute(task: string, config?: ExecutionConfig): Promise<SwarmResult>`

Executes the swarm with the given task.

**Parameters:**
- `task`: The task description to execute
- `config`: Optional execution configuration

**Returns:** Promise resolving to SwarmResult

##### `registerSpecialist(specialist: SpecialistAgent): void`

Registers a new specialist agent.

**Parameters:**
- `specialist`: Specialist agent configuration

##### `unregisterSpecialist(specialistId: string): boolean`

Removes a specialist agent.

**Parameters:**
- `specialistId`: ID of the specialist to remove

**Returns:** `true` if removed, `false` if not found

##### `getSpecialist(specialistId: string): SpecialistAgent | undefined`

Gets a specialist by ID.

**Parameters:**
- `specialistId`: ID of the specialist

**Returns:** SpecialistAgent or undefined

##### `getSpecialists(): SpecialistAgent[]`

Gets all registered specialists.

**Returns:** Array of all specialist agents

##### `getMetadata(): Record<string, unknown>`

Gets swarm metadata including configuration details.

**Returns:** Metadata object

### Types

#### SwarmConfig

```typescript
interface SwarmConfig {
  id: string;                          // Unique swarm identifier
  name: string;                        // Human-readable name
  description?: string;                // Swarm description
  supervisor: Agent;                   // Supervisor agent instance
  specialists: SpecialistAgent[];      // Array of specialists
  maxConcurrent?: number;              // Max concurrent executions
  parallelExecution?: boolean;         // Enable parallel mode
  specialistTimeoutMs?: number;        // Timeout per specialist
  customRouter?: RouterFunction;       // Custom routing logic
  customSynthesizer?: SynthesizerFunction; // Custom synthesis
  metadata?: Record<string, unknown>;  // Custom metadata
}
```

#### SpecialistAgent

```typescript
interface SpecialistAgent {
  id: string;                      // Unique specialist ID
  agent: Agent;                    // Agent instance
  specialization: string;          // Domain/specialization
  keywords?: string[];             // Trigger keywords
  priority?: number;               // Priority level (higher = preferred)
  concurrent?: boolean;            // Can execute concurrently
}
```

#### SwarmResult

```typescript
interface SwarmResult {
  response: string;                      // Final synthesized response
  specialistResults: SpecialistResult[]; // Individual specialist results
  combinedTrace: ExecutionTrace;         // Combined execution trace
  supervisorTrace: ExecutionTrace;       // Supervisor's trace
  success: boolean;                      // Overall success status
  error?: Error;                         // Error if failed
  stats: {
    totalSpecialistsInvoked: number;     // Number of specialists used
    successfulSpecialists: number;       // Successful executions
    failedSpecialists: number;           // Failed executions
    totalDurationMs: number;             // Total execution time
    parallelExecutions: number;          // Number of parallel runs
  };
}
```

#### SpecialistResult

```typescript
interface SpecialistResult {
  specialistId: string;           // Specialist ID
  specialization: string;         // Specialization area
  response: string;               // Specialist response
  trace: ExecutionTrace;          // Execution trace
  success: boolean;               // Success status
  error?: Error;                  // Error if failed
  metadata: {
    startTime: string;            // Start timestamp
    endTime: string;              // End timestamp
    durationMs: number;           // Duration in ms
  };
}
```

#### TaskRoutingDecision

```typescript
interface TaskRoutingDecision {
  specialistId: string;     // ID of chosen specialist
  reason: string;           // Routing rationale
  confidence: number;       // Confidence score (0-1)
}
```

### Events

The AgentSwarm extends EventEmitter and emits the following events:

- `swarm:start` - Swarm execution started
- `swarm:routing` - Routing decision made
- `specialist:start` - Specialist execution started
- `specialist:complete` - Specialist execution completed
- `specialist:error` - Specialist execution failed
- `swarm:synthesis` - Result synthesis started
- `swarm:complete` - Swarm execution completed
- `swarm:error` - Swarm execution failed

## Best Practices

### 1. Specialist Design

**Define clear specializations:**
```typescript
// Good: Clear, focused specialization
{
  id: 'database-expert',
  specialization: 'Database design and SQL optimization',
  keywords: ['database', 'sql', 'query', 'schema', 'index'],
}

// Avoid: Vague or overlapping specializations
{
  id: 'general-expert',
  specialization: 'Does everything',
  keywords: ['help', 'task', 'work'],
}
```

### 2. Keyword Selection

**Choose specific, discriminative keywords:**
```typescript
// Good: Specific keywords that clearly identify the domain
keywords: ['react', 'component', 'jsx', 'hooks', 'useState']

// Avoid: Generic keywords that match too broadly
keywords: ['help', 'code', 'fix', 'make']
```

### 3. Priority Assignment

**Use priority to handle overlapping domains:**
```typescript
specialists: [
  {
    id: 'react-expert',
    specialization: 'React development',
    keywords: ['react'],
    priority: 10, // Higher priority for React-specific tasks
  },
  {
    id: 'javascript-expert',
    specialization: 'JavaScript development',
    keywords: ['javascript', 'react'], // Also knows React
    priority: 5, // Lower priority, more general
  },
]
```

### 4. Error Handling

**Always check for errors and handle gracefully:**
```typescript
const result = await swarm.execute(task);

if (!result.success) {
  console.error('Swarm execution failed:', result.error);

  // Check individual specialist results
  result.specialistResults.forEach(sr => {
    if (!sr.success) {
      console.error(`Specialist ${sr.specialistId} failed:`, sr.error);
    }
  });

  // Implement fallback logic
  return handleFailure(result);
}
```

### 5. Performance Optimization

**Use parallel execution for independent tasks:**
```typescript
// Tasks that can be processed independently
const swarm = createAgentSwarm({
  ...config,
  parallelExecution: true,
  maxConcurrent: 5, // Balance between speed and resource usage
});

// Tasks that require sequential processing
const swarm = createAgentSwarm({
  ...config,
  parallelExecution: false, // Ensure order and dependencies
});
```

### 6. Monitoring and Debugging

**Use execution traces for debugging:**
```typescript
const result = await swarm.execute(task);

// Analyze combined trace
console.log('Total events:', result.combinedTrace.events.length);
console.log('Total steps:', result.combinedTrace.stats.totalSteps);
console.log('LLM calls:', result.combinedTrace.stats.totalLLMCalls);
console.log('Tool calls:', result.combinedTrace.stats.totalToolCalls);

// Analyze per-specialist performance
result.specialistResults.forEach(sr => {
  console.log(`${sr.specialistId}:`, {
    duration: sr.metadata.durationMs,
    steps: sr.trace.stats.totalSteps,
    llmCalls: sr.trace.stats.totalLLMCalls,
  });
});
```

### 7. Resource Management

**Set appropriate timeouts:**
```typescript
const swarm = createAgentSwarm({
  ...config,
  specialistTimeoutMs: 30000, // 30 seconds per specialist
});

// For individual agent execution
const result = await swarm.execute(task, {
  maxSteps: 10, // Limit execution steps
});
```

### 8. Testing

**Test specialists individually before swarm integration:**
```typescript
// Test specialist in isolation
const specialist = createAgent({...});
const executor = new AgentExecutor(specialist);
const result = await executor.execute('Test task');

// Verify specialist behavior
expect(result.success).toBe(true);
expect(result.response).toContain('expected output');

// Then integrate into swarm
const swarm = createAgentSwarm({
  ...config,
  specialists: [{ id: 'test', agent: specialist, ... }],
});
```

## Use Cases

### 1. Software Development Assistant

```typescript
const devSwarm = createAgentSwarm({
  id: 'dev-assistant',
  name: 'Development Assistant',
  supervisor,
  specialists: [
    { id: 'architect', agent: architectAgent, specialization: 'System design' },
    { id: 'coder', agent: coderAgent, specialization: 'Implementation' },
    { id: 'tester', agent: testerAgent, specialization: 'Testing' },
    { id: 'reviewer', agent: reviewerAgent, specialization: 'Code review' },
  ],
  parallelExecution: true,
});
```

### 2. Research Assistant

```typescript
const researchSwarm = createAgentSwarm({
  id: 'research-assistant',
  name: 'Research Assistant',
  supervisor,
  specialists: [
    { id: 'searcher', agent: searchAgent, specialization: 'Information retrieval' },
    { id: 'analyzer', agent: analyzerAgent, specialization: 'Data analysis' },
    { id: 'summarizer', agent: summarizerAgent, specialization: 'Summarization' },
    { id: 'validator', agent: validatorAgent, specialization: 'Fact checking' },
  ],
});
```

### 3. Content Creation

```typescript
const contentSwarm = createAgentSwarm({
  id: 'content-creator',
  name: 'Content Creation Swarm',
  supervisor,
  specialists: [
    { id: 'writer', agent: writerAgent, specialization: 'Writing' },
    { id: 'editor', agent: editorAgent, specialization: 'Editing' },
    { id: 'seo', agent: seoAgent, specialization: 'SEO optimization' },
    { id: 'formatter', agent: formatterAgent, specialization: 'Formatting' },
  ],
});
```

## Limitations and Considerations

1. **Cost**: Multiple LLM calls can increase costs significantly
2. **Latency**: Sequential execution may be slow for complex tasks
3. **Coordination Overhead**: Supervisor adds latency for routing and synthesis
4. **Error Propagation**: One specialist failure doesn't fail entire swarm
5. **Context Limits**: Each specialist has independent context (no shared memory by default)

## Future Enhancements

- Shared memory across specialists
- Learning from past executions
- Dynamic specialist creation
- Multi-level swarm hierarchies
- Streaming responses from specialists
- Specialist result caching

## Troubleshooting

### Specialists Not Being Invoked

Check keyword matching and ensure task contains relevant keywords:
```typescript
const specialists = swarm.getSpecialists();
specialists.forEach(s => {
  console.log(`${s.id}: ${s.keywords?.join(', ')}`);
});
```

### Poor Routing Decisions

Implement custom router or adjust priorities:
```typescript
swarm.on('swarm:routing', ({ decision }) => {
  console.log('Routing decision:', decision);
  // Verify decisions make sense
});
```

### Long Execution Times

Enable parallel execution or increase max concurrent:
```typescript
const swarm = createAgentSwarm({
  ...config,
  parallelExecution: true,
  maxConcurrent: 10,
});
```

### Inconsistent Results

Review specialist system prompts and ensure they're properly specialized:
```typescript
result.specialistResults.forEach(sr => {
  console.log(`${sr.specialization}:`, sr.response);
});
```

## License

Part of the AIKIT Agent Orchestration System.
