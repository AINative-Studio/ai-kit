# Tool Usage Example

Demonstrates how to create and use custom tools with AI Kit agents.

## Features

- Custom tool creation
- Agent orchestration
- Multi-step reasoning
- Tool execution tracking

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export ANTHROPIC_API_KEY=your-key-here
   ```

3. Run the example:
   ```bash
   npm run start
   ```

## What This Example Shows

### Tool Definition
Tools are defined with a schema that describes:
- Name and description (for the LLM to understand)
- Parameters (JSON Schema format)
- Execute function (implementation)

### Agent Execution
The agent:
1. Receives user input
2. Determines if tools are needed
3. Calls appropriate tools
4. Synthesizes results into an answer

### Execution Steps
Each agent run produces steps showing:
- Agent reasoning ("thoughts")
- Tool calls made
- Tool results
- Final answer

## Custom Tools

This example includes two tools:

1. **Weather Tool** - Returns weather data for a location
2. **Calculator Tool** - Performs mathematical calculations

## Extending This Example

Try adding your own tools:
- Database queries
- API calls
- File operations
- Web scraping
- Data processing
