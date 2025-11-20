# Agent Example

Demonstrates advanced agent patterns including multi-agent coordination and streaming execution.

## Features

- Multiple specialized agents
- Agent swarm coordination
- Streaming execution
- Tool composition

## Setup

```bash
npm install
export ANTHROPIC_API_KEY=your-key
npm run start
```

## Agent Patterns Demonstrated

### 1. Single-Purpose Agents
Each agent has a specific role:
- **Researcher** - Gathers information using web search
- **Analyst** - Analyzes data and provides insights
- **Writer** - Creates clear, engaging content

### 2. Agent Swarm
The swarm automatically:
- Routes tasks to appropriate agents
- Coordinates multi-step workflows
- Synthesizes results from multiple agents

### 3. Streaming Execution
Watch agents work in real-time:
- See reasoning steps as they happen
- Monitor tool calls
- Track progress

## Use Cases

This pattern is ideal for:
- Research and analysis workflows
- Content creation pipelines
- Complex decision-making tasks
- Multi-step problem solving

## Extending

Add more agents:
```typescript
const codeAgent = new AgentExecutor({
  name: 'Coder',
  systemPrompt: 'You write clean, efficient code',
  tools: [codeAnalysisTool, testGeneratorTool],
})

swarm.addAgent(codeAgent)
```
