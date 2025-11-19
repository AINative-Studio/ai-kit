/**
 * Basic Streaming Agent Example
 *
 * This example demonstrates the basic usage of StreamingAgentExecutor
 * with real-time event streaming.
 */

import { z } from 'zod';
import {
  Agent,
  StreamingAgentExecutor,
  ToolDefinition,
  AgentConfig,
  AgentExecutionEvent,
} from '../src/agents';

// Define a simple calculator tool
const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations (add, subtract, multiply, divide)',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  execute: async ({ operation, a, b }) => {
    let result: number;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) throw new Error('Cannot divide by zero');
        result = a / b;
        break;
    }
    return { result, operation, a, b };
  },
};

// Configure the agent
const agentConfig: AgentConfig = {
  id: 'calculator-agent',
  name: 'Calculator Agent',
  description: 'An agent that can perform calculations',
  systemPrompt: `You are a helpful calculator assistant.
When asked to perform calculations, use the calculator tool.
Always explain your steps clearly.`,
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
  },
  tools: [calculatorTool],
  maxSteps: 10,
};

// Main execution
async function main() {
  console.log('🤖 Starting Streaming Agent Example\n');

  // Create the agent
  const agent = new Agent(agentConfig);

  // Create streaming executor
  const executor = new StreamingAgentExecutor(agent);

  // User input
  const userInput = 'What is 45 multiplied by 12, and then add 17 to the result?';
  console.log(`User: ${userInput}\n`);

  console.log('Agent execution (streaming):');
  console.log('─'.repeat(60));

  try {
    // Stream the execution and handle events in real-time
    for await (const event of executor.stream(userInput)) {
      handleEvent(event);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Execution completed successfully\n');

    // Get final state and trace
    const finalState = executor.getState();
    const trace = executor.getTrace();

    console.log('📊 Execution Summary:');
    console.log(`  - Steps taken: ${trace.stats.totalSteps}`);
    console.log(`  - LLM calls: ${trace.stats.totalLLMCalls}`);
    console.log(`  - Tool calls: ${trace.stats.totalToolCalls}`);
    console.log(`  - Successful tools: ${trace.stats.successfulToolCalls}`);
    console.log(`  - Failed tools: ${trace.stats.failedToolCalls}`);
    console.log(`  - Duration: ${trace.durationMs}ms`);
    console.log(`\n💬 Final Answer: ${finalState.finalResponse}`);
  } catch (error) {
    console.error('\n❌ Execution failed:', error);
  }
}

/**
 * Handle streaming events and display them nicely
 */
function handleEvent(event: AgentExecutionEvent) {
  switch (event.type) {
    case 'step':
      console.log(`\n[Step ${event.step}]`);
      break;

    case 'thought':
      console.log(`💭 Thought: ${event.content}`);
      break;

    case 'tool_call':
      console.log(
        `🔧 Tool Call: ${event.toolCall.name}(${JSON.stringify(event.toolCall.parameters)})`
      );
      break;

    case 'tool_result':
      if (event.result.error) {
        console.log(`❌ Tool Error: ${event.result.error.message}`);
      } else {
        console.log(`✓ Tool Result: ${JSON.stringify(event.result.result)}`);
      }
      break;

    case 'final_answer':
      console.log(`\n🎯 Final Answer: ${event.answer}`);
      break;

    case 'error':
      console.log(`❌ Error: ${event.error}`);
      break;
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
