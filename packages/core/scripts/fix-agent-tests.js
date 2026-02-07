const fs = require('fs');

const filePath = '__tests__/performance/agent-execution.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace imports
content = content.replace(
  "import { Tool, ToolCall } from '../../src/types'",
  "import { ToolDefinition, ToolCall } from '../../src/agents/types'"
);

// Add zod import
content = content.replace(
  "import { describe, it, expect, beforeEach, vi } from 'vitest'",
  "import { describe, it, expect, beforeEach, vi } from 'vitest'\nimport { z } from 'zod'"
);

// Fix Tool declarations
content = content.replace(/let calculatorTool: Tool/g, 'let calculatorTool: ToolDefinition');
content = content.replace(/let searchTool: Tool/g, 'let searchTool: ToolDefinition');
content = content.replace(/const noopTool: Tool = {/g, 'const noopTool: ToolDefinition = {');
content = content.replace(/const fastTool: Tool = {/g, 'const fastTool: ToolDefinition = {');
content = content.replace(/const errorTool: Tool = {/g, 'const errorTool: ToolDefinition = {');

// Fix tool parameters from JSON schema to Zod
content = content.replace(
  /parameters: {\s*type: 'object',\s*properties: {\s*expression: {\s*type: 'string',\s*description: 'Mathematical expression to evaluate'\s*}\s*},\s*required: \['expression'\]\s*}/g,
  "parameters: z.object({\n        expression: z.string().describe('Mathematical expression to evaluate')\n      })"
);

content = content.replace(
  /parameters: {\s*type: 'object',\s*properties: {\s*query: {\s*type: 'string',\s*description: 'Search query'\s*}\s*},\s*required: \['query'\]\s*}/g,
  "parameters: z.object({\n        query: z.string().describe('Search query')\n      })"
);

content = content.replace(
  /parameters: {\s*type: 'object',\s*properties: {}\s*}/g,
  'parameters: z.object({})'
);

// Fix Agent configs - add description and remove apiKey
content = content.replace(
  /new Agent\({(\s*)id: 'test-agent',(\s*)name: 'Test Agent',(\s*)systemPrompt:/g,
  "new Agent({$1id: 'test-agent',$2name: 'Test Agent',$2description: 'Test agent for performance testing',$3systemPrompt:"
);

content = content.replace(
  /new Agent\({(\s*)id: 'test-agent',(\s*)name: 'Math Agent',(\s*)systemPrompt:/g,
  "new Agent({$1id: 'test-agent',$2name: 'Math Agent',$2description: 'Math agent for performance testing',$3systemPrompt:"
);

content = content.replace(/,\s*apiKey: 'test-key'/g, '');

fs.writeFileSync(filePath, content);
console.log('Fixed agent-execution.test.ts');
