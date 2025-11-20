#!/usr/bin/env node

/**
 * API Documentation Generator
 *
 * This script generates comprehensive API reference documentation for all AI Kit packages.
 * It combines TypeDoc auto-generation with custom markdown enhancements and cross-references.
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PackageInfo {
  name: string;
  path: string;
  description: string;
  mainExports: string[];
}

const PACKAGES: PackageInfo[] = [
  {
    name: 'core',
    path: 'packages/core',
    description: 'Framework-agnostic core for AI Kit - streaming, agents, state management',
    mainExports: [
      'streaming',
      'agents',
      'security',
      'memory',
      'context',
      'summarization',
      'auth',
      'session',
      'zerodb',
      'tracking',
      'instrumentation',
      'rlhf',
      'search',
      'store',
      'monitoring',
      'alerts',
      'reporting'
    ]
  },
  {
    name: 'react',
    path: 'packages/react',
    description: 'React hooks and components for AI Kit',
    mainExports: ['hooks', 'components', 'registry']
  },
  {
    name: 'tools',
    path: 'packages/tools',
    description: 'Built-in tools for AI agents',
    mainExports: ['calculator', 'web-search', 'code-interpreter', 'zerodb-tool', 'zerodb-query']
  },
  {
    name: 'nextjs',
    path: 'packages/nextjs',
    description: 'Next.js integration for AI Kit',
    mainExports: ['route-helpers', 'middleware', 'streaming']
  },
  {
    name: 'testing',
    path: 'packages/testing',
    description: 'Testing utilities for AI Kit',
    mainExports: ['mocks', 'fixtures', 'helpers', 'matchers']
  }
];

const DOCS_DIR = 'docs/api';

/**
 * Generate API documentation using TypeDoc
 */
async function generateTypeDoc(): Promise<void> {
  console.log('📚 Generating TypeDoc documentation...');

  try {
    execSync('pnpm exec typedoc', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ TypeDoc generation complete');
  } catch (error) {
    console.error('❌ TypeDoc generation failed:', error);
    throw error;
  }
}

/**
 * Create package overview documentation
 */
async function createPackageOverview(pkg: PackageInfo): Promise<void> {
  const packageJsonPath = path.join(pkg.path, 'package.json');
  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf-8')
  );

  const overview = `# ${packageJson.name}

${pkg.description}

## Installation

\`\`\`bash
npm install ${packageJson.name}
# or
pnpm add ${packageJson.name}
# or
yarn add ${packageJson.name}
\`\`\`

## Version

Current version: **${packageJson.version}**

## Modules

${pkg.mainExports.map(exp => `- [\`${exp}\`](./${pkg.name}/${exp}.md)`).join('\n')}

## Quick Start

\`\`\`typescript
import { ... } from '${packageJson.name}';

// See individual module documentation for usage examples
\`\`\`

## Dependencies

${Object.entries(packageJson.dependencies || {})
  .map(([name, version]) => `- ${name}: \`${version}\``)
  .join('\n')}

## License

${packageJson.license}

## Links

- [GitHub Repository](${packageJson.repository?.url || 'https://github.com/AINative-Studio/ai-kit'})
- [NPM Package](https://www.npmjs.com/package/${packageJson.name})
- [Changelog](../../CHANGELOG.md)

## See Also

${PACKAGES
  .filter(p => p.name !== pkg.name)
  .map(p => `- [${p.name}](./${p.name}/README.md)`)
  .join('\n')}
`;

  const outputPath = path.join(DOCS_DIR, pkg.name, 'README.md');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, overview);

  console.log(`📄 Created overview for ${pkg.name}`);
}

/**
 * Generate cross-reference index
 */
async function generateCrossReferenceIndex(): Promise<void> {
  const index = `# AI Kit API Reference

Complete API reference documentation for all AI Kit packages.

## Packages

${PACKAGES.map(pkg => `
### [@ainative/ai-kit-${pkg.name}](./${pkg.name}/README.md)

${pkg.description}

**Main Modules:**
${pkg.mainExports.map(exp => `- [\`${exp}\`](./${pkg.name}/${exp}.md)`).join('\n')}
`).join('\n')}

## Search Index

- [All Classes](./classes.md)
- [All Interfaces](./interfaces.md)
- [All Types](./types.md)
- [All Functions](./functions.md)

## Quick Links

### Core Functionality
- [AIStream](./core/streaming.md) - Streaming responses from LLMs
- [Agent](./core/agents.md) - AI agent creation and execution
- [UsageTracker](./core/tracking.md) - Usage tracking and cost monitoring

### React Integration
- [useAIStream](./react/hooks.md) - React hook for AI streaming
- [useConversation](./react/hooks.md) - Conversation management hook
- [ChatInterface](./react/components.md) - Pre-built chat UI

### Security & Safety
- [PIIDetector](./core/security.md) - PII detection and redaction
- [PromptInjectionDetector](./core/security.md) - Prompt injection prevention
- [ContentModerator](./core/security.md) - Content moderation

### Memory & Context
- [MemoryStore](./core/memory.md) - Long-term memory management
- [ContextManager](./core/context.md) - Context window management
- [ConversationSummarizer](./core/summarization.md) - Automatic summarization

### Tools
- [Calculator](./tools/calculator.md) - Mathematical computation tool
- [WebSearch](./tools/web-search.md) - Web search integration
- [ZeroDBTool](./tools/zerodb-tool.md) - Database operations

## TypeScript Support

All AI Kit packages are written in TypeScript and include complete type definitions.

\`\`\`typescript
import type {
  AIStreamConfig,
  AgentConfig,
  ToolDefinition
} from '@ainative/ai-kit-core';
\`\`\`

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to AI Kit.

## License

MIT - See [LICENSE](../../LICENSE) for details.
`;

  await fs.writeFile(path.join(DOCS_DIR, 'README.md'), index);
  console.log('📄 Created API reference index');
}

/**
 * Generate search index for documentation
 */
async function generateSearchIndex(): Promise<void> {
  console.log('🔍 Generating search index...');

  const searchIndex: Array<{
    title: string;
    path: string;
    type: 'class' | 'interface' | 'function' | 'type';
    package: string;
    description?: string;
  }> = [];

  // Recursively scan docs directory for markdown files
  async function scanDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const relativePath = path.relative(DOCS_DIR, fullPath);

        // Extract title from first heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          const packageMatch = relativePath.match(/^(\w+)\//);
          searchIndex.push({
            title: titleMatch[1],
            path: relativePath,
            type: detectType(titleMatch[1], content),
            package: packageMatch?.[1] || 'general',
            description: extractDescription(content)
          });
        }
      }
    }
  }

  await scanDirectory(DOCS_DIR);

  // Write search index
  await fs.writeFile(
    path.join(DOCS_DIR, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2)
  );

  console.log(`✅ Generated search index with ${searchIndex.length} entries`);
}

function detectType(title: string, content: string): 'class' | 'interface' | 'function' | 'type' {
  if (content.includes('class ')) return 'class';
  if (content.includes('interface ')) return 'interface';
  if (content.includes('function ')) return 'function';
  return 'type';
}

function extractDescription(content: string): string | undefined {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#')) {
      // Get first paragraph after heading
      const nextLine = lines[i + 2];
      if (nextLine && !nextLine.startsWith('#') && nextLine.trim()) {
        return nextLine.trim();
      }
    }
  }
  return undefined;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🚀 Starting API documentation generation...\n');

  // Step 1: Generate TypeDoc documentation
  await generateTypeDoc();

  // Step 2: Create package overviews
  console.log('\n📦 Creating package overviews...');
  for (const pkg of PACKAGES) {
    await createPackageOverview(pkg);
  }

  // Step 3: Generate cross-reference index
  console.log('\n🔗 Generating cross-reference index...');
  await generateCrossReferenceIndex();

  // Step 4: Generate search index
  await generateSearchIndex();

  console.log('\n✅ API documentation generation complete!');
  console.log(`📁 Documentation available at: ${DOCS_DIR}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Documentation generation failed:', error);
    process.exit(1);
  });
}

export { main as generateAPIDocs };
