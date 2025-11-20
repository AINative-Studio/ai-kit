import { AgentExecutor, Tool } from '@ainative/ai-kit/core'

// Define a weather tool
const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name (e.g., "Paris, France")',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius',
      },
    },
    required: ['location'],
  },
  execute: async ({ location, unit = 'celsius' }) => {
    // Simulate API call
    return {
      temperature: 22,
      condition: 'Sunny',
      humidity: 65,
      location,
      unit,
    }
  },
}

// Define a calculator tool
const calculatorTool: Tool = {
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Math expression (e.g., "2 + 2")',
      },
    },
    required: ['expression'],
  },
  execute: async ({ expression }) => {
    // Simple eval (use proper math parser in production!)
    try {
      const result = eval(expression)
      return { expression, result }
    } catch (error) {
      throw new Error('Invalid expression')
    }
  },
}

// Create agent with tools
const agent = new AgentExecutor({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant with access to weather and calculator tools.',
  model: 'claude-sonnet-4',
  tools: [weatherTool, calculatorTool],
  maxIterations: 5,
})

// Example usage
async function main() {
  console.log('Tool Usage Example\n')

  // Example 1: Weather query
  console.log('Example 1: Weather Query')
  const result1 = await agent.run('What is the weather in Tokyo?')
  console.log('Answer:', result1.answer)
  console.log('Steps:', result1.steps.length)
  console.log()

  // Example 2: Calculation
  console.log('Example 2: Calculation')
  const result2 = await agent.run('What is 15 * 23?')
  console.log('Answer:', result2.answer)
  console.log()

  // Example 3: Multiple tools
  console.log('Example 3: Multiple Tools')
  const result3 = await agent.run(
    'What is the weather in London and what is 100 divided by 4?'
  )
  console.log('Answer:', result3.answer)
  console.log('Tools used:', result3.steps.filter(s => s.type === 'tool_call').length)
}

main()
