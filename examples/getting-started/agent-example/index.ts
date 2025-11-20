import { AgentExecutor, AgentSwarm, Tool } from '@ainative/ai-kit/core'

// Research tool
const researchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', default: 5 },
    },
    required: ['query'],
  },
  execute: async ({ query, limit = 5 }) => {
    // Simulated search results
    return {
      results: [
        { title: 'Result 1', snippet: 'Information about ' + query },
        { title: 'Result 2', snippet: 'More details on ' + query },
      ].slice(0, limit),
    }
  },
}

// Analysis tool
const analysisTool: Tool = {
  name: 'analyze_data',
  description: 'Analyze data and provide insights',
  parameters: {
    type: 'object',
    properties: {
      data: { type: 'string', description: 'Data to analyze' },
    },
    required: ['data'],
  },
  execute: async ({ data }) => {
    return {
      summary: `Analysis of: ${data}`,
      insights: ['Insight 1', 'Insight 2'],
      confidence: 0.85,
    }
  },
}

// Create specialized agents
const researchAgent = new AgentExecutor({
  name: 'Researcher',
  systemPrompt: 'You are an expert researcher who gathers and synthesizes information.',
  model: 'claude-sonnet-4',
  tools: [researchTool],
})

const analystAgent = new AgentExecutor({
  name: 'Analyst',
  systemPrompt: 'You are a data analyst who provides insights and recommendations.',
  model: 'claude-sonnet-4',
  tools: [analysisTool],
})

const writerAgent = new AgentExecutor({
  name: 'Writer',
  systemPrompt: 'You are a skilled writer who creates clear, engaging content.',
  model: 'claude-sonnet-4',
  tools: [],
})

// Create agent swarm
const swarm = new AgentSwarm([researchAgent, analystAgent, writerAgent])

async function main() {
  console.log('Agent Example - Multi-Agent Coordination\n')

  // Example 1: Single agent
  console.log('=== Example 1: Research Agent ===')
  const result1 = await researchAgent.run('Find information about quantum computing')
  console.log('Answer:', result1.answer)
  console.log('Steps:', result1.steps.length)
  console.log()

  // Example 2: Different agent
  console.log('=== Example 2: Analyst Agent ===')
  const result2 = await analystAgent.run('Analyze the trend: AI adoption is growing')
  console.log('Answer:', result2.answer)
  console.log()

  // Example 3: Agent swarm coordination
  console.log('=== Example 3: Agent Swarm ===')
  const result3 = await swarm.delegate(
    'Research quantum computing, analyze the findings, and write a summary'
  )
  console.log('Answer:', result3.answer)
  console.log('Agents used:', result3.agentsInvolved)
  console.log()

  // Example 4: Streaming execution
  console.log('=== Example 4: Streaming Execution ===')
  for await (const step of researchAgent.stream('What are the latest developments in AI?')) {
    console.log(`[${step.type}]`, step.content?.substring(0, 50))
  }
}

main()
