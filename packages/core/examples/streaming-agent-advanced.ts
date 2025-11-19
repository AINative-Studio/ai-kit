/**
 * Advanced Streaming Agent Example
 *
 * This example demonstrates advanced features including:
 * - Multiple tools
 * - Real-time UI updates
 * - Event filtering and processing
 * - Error handling
 */

import { z } from 'zod';
import {
  Agent,
  streamAgentExecution,
  ToolDefinition,
  AgentConfig,
  AgentExecutionEvent,
  ThoughtEvent,
  ToolCallEvent,
  ToolResultEvent,
  FinalAnswerEvent,
} from '../src/agents';

// Weather tool
const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Gets current weather information for a city',
  parameters: z.object({
    city: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  }),
  execute: async ({ city, units }) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock weather data
    const temp = units === 'celsius' ? 22 : 72;
    return {
      city,
      temperature: temp,
      units,
      condition: 'Partly cloudy',
      humidity: 65,
      windSpeed: 12,
    };
  },
};

// Search tool
const searchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Searches the web for information',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().default(5).describe('Number of results'),
  }),
  execute: async ({ query, limit }) => {
    // Simulate search
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      query,
      results: Array.from({ length: limit }, (_, i) => ({
        title: `Search result ${i + 1} for "${query}"`,
        url: `https://example.com/result-${i + 1}`,
        snippet: `This is a snippet about ${query}...`,
      })),
    };
  },
};

// Calculator tool
const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: 'Performs mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Mathematical expression to evaluate'),
  }),
  execute: async ({ expression }) => {
    // Simple evaluation (in production, use a proper math parser)
    try {
      // Note: eval is dangerous in production - use a proper math library
      const result = Function(`'use strict'; return (${expression})`)();
      return { expression, result };
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  },
};

// Configure the agent with multiple tools
const agentConfig: AgentConfig = {
  id: 'research-agent',
  name: 'Research Agent',
  description: 'An intelligent research assistant',
  systemPrompt: `You are a helpful research assistant that can:
- Search the web for information
- Get weather information
- Perform calculations

Always be thorough and explain your reasoning.
Use tools when appropriate to provide accurate information.`,
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
  },
  tools: [weatherTool, searchTool, calculatorTool],
  maxSteps: 15,
};

/**
 * Event aggregator for building a UI-friendly state
 */
class EventAggregator {
  private thoughts: string[] = [];
  private toolCalls: Array<{ name: string; params: any; result?: any; error?: string }> =
    [];
  private currentStep: number = 0;

  handleEvent(event: AgentExecutionEvent) {
    switch (event.type) {
      case 'step':
        this.currentStep = event.step;
        break;

      case 'thought':
        this.thoughts.push(event.content);
        break;

      case 'tool_call':
        this.toolCalls.push({
          name: event.toolCall.name,
          params: event.toolCall.parameters,
        });
        break;

      case 'tool_result':
        const lastCall = this.toolCalls[this.toolCalls.length - 1];
        if (lastCall) {
          if (event.result.error) {
            lastCall.error = event.result.error.message;
          } else {
            lastCall.result = event.result.result;
          }
        }
        break;
    }
  }

  getState() {
    return {
      step: this.currentStep,
      thoughts: this.thoughts,
      toolCalls: this.toolCalls,
    };
  }

  display() {
    const state = this.getState();
    console.log('\n📈 Current State:');
    console.log(`  Step: ${state.step}`);
    console.log(`  Thoughts collected: ${state.thoughts.length}`);
    console.log(`  Tools called: ${state.toolCalls.length}`);

    if (state.toolCalls.length > 0) {
      console.log('\n  Recent tool calls:');
      state.toolCalls.slice(-3).forEach((call, i) => {
        console.log(`    ${i + 1}. ${call.name}: ${JSON.stringify(call.params)}`);
        if (call.result) {
          console.log(`       ✓ Result: ${JSON.stringify(call.result).slice(0, 100)}...`);
        }
        if (call.error) {
          console.log(`       ✗ Error: ${call.error}`);
        }
      });
    }
  }
}

/**
 * Advanced usage with event filtering and processing
 */
async function main() {
  console.log('🚀 Advanced Streaming Agent Example\n');

  const agent = new Agent(agentConfig);
  const aggregator = new EventAggregator();

  const userInput =
    'What is the weather like in San Francisco? Also, search for recent news about AI, and calculate what 15% of 250 is.';

  console.log(`User: ${userInput}\n`);
  console.log('─'.repeat(80));

  try {
    // Use the factory function for streaming
    const streamGenerator = streamAgentExecution(agent, userInput, {
      maxSteps: 15,
    });

    let eventCount = 0;
    const startTime = Date.now();

    for await (const event of streamGenerator) {
      eventCount++;

      // Update aggregator
      aggregator.handleEvent(event);

      // Display event
      displayEvent(event);

      // Display aggregated state every 3 events
      if (eventCount % 3 === 0) {
        aggregator.display();
      }
    }

    const duration = Date.now() - startTime;

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✅ Completed in ${duration}ms (${eventCount} events)\n`);

    // Final state
    console.log('📊 Final State:');
    const finalState = aggregator.getState();
    console.log(`  Total thoughts: ${finalState.thoughts.length}`);
    console.log(`  Total tool calls: ${finalState.toolCalls.length}`);
    console.log('\n  Tools used:');
    const toolUsage = finalState.toolCalls.reduce((acc, call) => {
      acc[call.name] = (acc[call.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(toolUsage).forEach(([name, count]) => {
      console.log(`    - ${name}: ${count}x`);
    });
  } catch (error) {
    console.error('\n❌ Execution failed:', error);
  }
}

/**
 * Display individual events with nice formatting
 */
function displayEvent(event: AgentExecutionEvent) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString();

  switch (event.type) {
    case 'step':
      console.log(`\n[${timestamp}] 📍 Step ${event.step}`);
      break;

    case 'thought':
      console.log(`[${timestamp}] 💭 ${(event as ThoughtEvent).content}`);
      break;

    case 'tool_call': {
      const toolEvent = event as ToolCallEvent;
      console.log(
        `[${timestamp}] 🔧 Calling ${toolEvent.toolCall.name}(${JSON.stringify(toolEvent.toolCall.parameters)})`
      );
      break;
    }

    case 'tool_result': {
      const resultEvent = event as ToolResultEvent;
      if (resultEvent.result.error) {
        console.log(
          `[${timestamp}] ❌ ${resultEvent.result.toolName} error: ${resultEvent.result.error.message}`
        );
      } else {
        const resultStr = JSON.stringify(resultEvent.result.result);
        const preview =
          resultStr.length > 100 ? resultStr.slice(0, 100) + '...' : resultStr;
        console.log(`[${timestamp}] ✅ ${resultEvent.result.toolName} → ${preview}`);
      }
      break;
    }

    case 'final_answer': {
      const answerEvent = event as FinalAnswerEvent;
      console.log(`\n[${timestamp}] 🎯 FINAL ANSWER:`);
      console.log(`${answerEvent.answer}\n`);
      break;
    }

    case 'error':
      console.log(`[${timestamp}] ⚠️  ${event.error}`);
      break;
  }
}

// Export for testing
export { main, EventAggregator };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
