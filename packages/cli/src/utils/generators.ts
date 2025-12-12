import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ProjectConfig {
  framework: string;
  typescript: boolean;
  testRunner?: string;
}

/**
 * Generate a React/Vue/Svelte component
 */
export async function generateComponent(
  targetPath: string,
  name: string,
  config: ProjectConfig
): Promise<void> {
  await mkdir(targetPath, { recursive: true });

  const componentName = toPascalCase(name);
  const fileName = `${componentName}.${config.typescript ? 'tsx' : 'jsx'}`;

  let content = '';

  switch (config.framework) {
    case 'react':
    case 'nextjs':
      content = `interface ${componentName}Props {
  // Add your props here
}

export function ${componentName}({ }: ${componentName}Props) {
  return (
    <div>
      <h2>${componentName}</h2>
      {/* Add your component content */}
    </div>
  );
}
`;
      break;

    case 'vue':
      content = `<template>
  <div>
    <h2>${componentName}</h2>
    <!-- Add your component content -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Add your props here
}

defineProps<Props>();
</script>

<style scoped>
/* Add your styles */
</style>
`;
      break;

    case 'svelte':
      content = `<script lang="ts">
  // Add your props and logic here
</script>

<div>
  <h2>${componentName}</h2>
  <!-- Add your component content -->
</div>

<style>
  /* Add your styles */
</style>
`;
      break;
  }

  await writeFile(join(targetPath, fileName), content);

  // Generate test file
  await generateTest(
    join(targetPath, '__tests__'),
    componentName,
    config,
    'component'
  );
}

/**
 * Generate an AI agent
 */
export async function generateAgent(
  targetPath: string,
  name: string,
  config: ProjectConfig
): Promise<void> {
  await mkdir(targetPath, { recursive: true });

  const agentName = toPascalCase(name);
  const fileName = `${agentName}.${config.typescript ? 'ts' : 'js'}`;

  const content = `import { Agent } from '@ainative/ai-kit-core';
import type { Message, Tool } from '@ainative/ai-kit-core';

export class ${agentName} extends Agent {
  constructor() {
    super({
      name: '${agentName}',
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: \`You are a helpful AI assistant.\`,
      temperature: 1.0,
    });
  }

  /**
   * Define tools available to this agent
   */
  getTools(): Tool[] {
    return [
      // Add your tools here
    ];
  }

  /**
   * Process messages and generate responses
   */
  async processMessage(message: Message): Promise<string> {
    const response = await this.sendMessage(message.content);
    return response;
  }

  /**
   * Custom logic for this agent
   */
  async execute(input: string): Promise<string> {
    // Add your custom logic here
    return await this.processMessage({ role: 'user', content: input });
  }
}
`;

  await writeFile(join(targetPath, fileName), content);

  // Generate test file
  await generateTest(
    join(targetPath, '__tests__'),
    agentName,
    config,
    'agent'
  );
}

/**
 * Generate a tool
 */
export async function generateTool(
  targetPath: string,
  name: string,
  config: ProjectConfig
): Promise<void> {
  await mkdir(targetPath, { recursive: true });

  const toolName = toCamelCase(name);
  const fileName = `${toolName}.${config.typescript ? 'ts' : 'js'}`;

  const content = `import type { Tool } from '@ainative/ai-kit-core';

export const ${toolName}: Tool = {
  name: '${toolName}',
  description: 'Description of what this tool does',
  input_schema: {
    type: 'object',
    properties: {
      // Define your input parameters
      input: {
        type: 'string',
        description: 'Input parameter',
      },
    },
    required: ['input'],
  },
  execute: async (params) => {
    // Implement your tool logic here
    const { input } = params;

    // Process the input and return results
    return {
      success: true,
      result: \`Processed: \${input}\`,
    };
  },
};
`;

  await writeFile(join(targetPath, fileName), content);

  // Generate test file
  await generateTest(
    join(targetPath, '__tests__'),
    toolName,
    config,
    'tool'
  );
}

/**
 * Generate an API route
 */
export async function generateRoute(
  targetPath: string,
  name: string,
  config: ProjectConfig
): Promise<void> {
  await mkdir(targetPath, { recursive: true });

  const routeName = name.toLowerCase();

  let content = '';
  let fileName = '';

  if (config.framework === 'nextjs') {
    fileName = `${routeName}/route.ts`;
    content = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Implement your GET logic here
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Implement your POST logic here
    return NextResponse.json({ message: 'Success', data: body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`;
  } else if (config.framework === 'express') {
    fileName = `${routeName}.ts`;
    content = `import { Router, Request, Response } from 'express';

const router = Router();

router.get('/${routeName}', async (req: Request, res: Response) => {
  try {
    // Implement your GET logic here
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/${routeName}', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // Implement your POST logic here
    res.json({ message: 'Success', data: body });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
`;
  }

  await writeFile(join(targetPath, fileName), content);
}

/**
 * Generate a test file
 */
export async function generateTest(
  targetPath: string,
  name: string,
  config: ProjectConfig,
  type: 'component' | 'agent' | 'tool' | 'route' = 'component'
): Promise<void> {
  if (!existsSync(targetPath)) {
    await mkdir(targetPath, { recursive: true });
  }

  const fileName = `${name}.test.${config.typescript ? 'ts' : 'js'}`;

  let content = '';

  switch (type) {
    case 'component':
      content = `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${name} } from '../${name}';

describe('${name}', () => {
  it('renders successfully', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    // Add your interaction tests
  });
});
`;
      break;

    case 'agent':
      content = `import { describe, it, expect, beforeEach } from 'vitest';
import { ${name} } from '../${name}';

describe('${name}', () => {
  let agent: ${name};

  beforeEach(() => {
    agent = new ${name}();
  });

  it('initializes correctly', () => {
    expect(agent).toBeDefined();
    expect(agent.name).toBe('${name}');
  });

  it('processes messages', async () => {
    const response = await agent.execute('test message');
    expect(response).toBeDefined();
  });

  it('uses tools correctly', () => {
    const tools = agent.getTools();
    expect(tools).toBeDefined();
  });
});
`;
      break;

    case 'tool':
      content = `import { describe, it, expect } from 'vitest';
import { ${name} } from '../${name}';

describe('${name}', () => {
  it('has correct structure', () => {
    expect(${name}.name).toBe('${name}');
    expect(${name}.description).toBeDefined();
    expect(${name}.input_schema).toBeDefined();
    expect(${name}.execute).toBeInstanceOf(Function);
  });

  it('executes successfully', async () => {
    const result = await ${name}.execute({ input: 'test' });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('handles errors gracefully', async () => {
    // Add error handling tests
  });
});
`;
      break;

    case 'route':
      content = `import { describe, it, expect } from 'vitest';
import { GET, POST } from '../${name}/route';

describe('${name} route', () => {
  it('handles GET requests', async () => {
    const request = new Request('http://localhost:3000/api/${name}');
    const response = await GET(request as any);
    expect(response.status).toBe(200);
  });

  it('handles POST requests', async () => {
    const request = new Request('http://localhost:3000/api/${name}', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(200);
  });
});
`;
      break;
  }

  await writeFile(join(targetPath, fileName), content);
}

// Helper functions
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
