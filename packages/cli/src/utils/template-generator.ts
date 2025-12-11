import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { findTemplate, getAllTemplateIdentifiers } from '../templates/registry.js';
import { createGitignore } from './git.js';
import Handlebars from 'handlebars';

export interface GenerateProjectOptions {
  projectPath: string;
  projectName: string;
  template: string;
  typescript: boolean;
  features: string[];
}

/**
 * Generate a project from a template
 */
export async function generateProject(
  options: GenerateProjectOptions
): Promise<void> {
  const template = findTemplate(options.template);

  if (!template) {
    const available = getAllTemplateIdentifiers().join(', ');
    throw new Error(
      `Template not found: ${options.template}\nAvailable templates: ${available}`
    );
  }

  // Create project directory
  await mkdir(options.projectPath, { recursive: true });

  // Generate package.json
  await generatePackageJson(options, template);

  // Generate tsconfig.json or jsconfig.json
  if (options.typescript) {
    await generateTsConfig(options, template);
  }

  // Generate .env.example
  await generateEnvExample(options, template);

  // Generate .gitignore
  createGitignore(options.projectPath, template.framework);

  // Generate README
  await generateReadme(options, template);

  // Generate source files based on template
  await generateSourceFiles(options, template);

  // Generate config files
  await generateConfigFiles(options, template);
}

async function generatePackageJson(
  options: GenerateProjectOptions,
  template: any
): Promise<void> {
  const packageJson = {
    name: options.projectName,
    version: '0.1.0',
    private: true,
    description: `AI Kit project based on ${template.name}`,
    scripts: template.scripts,
    dependencies: template.dependencies,
    devDependencies: template.devDependencies,
    engines: {
      node: '>=18.0.0',
    },
  };

  // Add optional features
  for (const feature of options.features) {
    if (feature === 'auth') {
      packageJson.dependencies['next-auth'] = '^4.24.0';
    } else if (feature === 'database') {
      packageJson.dependencies['@prisma/client'] = '^5.7.0';
      packageJson.devDependencies['prisma'] = '^5.7.0';
    } else if (feature === 'vector') {
      packageJson.dependencies['@ainative-studio/aikit-zerodb'] = '^0.1.0';
    }
  }

  await writeFile(
    join(options.projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

async function generateTsConfig(
  options: GenerateProjectOptions,
  template: any
): Promise<void> {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowJs: true,
      checkJs: false,
      jsx: template.framework === 'react' || template.framework === 'nextjs' ? 'preserve' : undefined,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      incremental: true,
      isolatedModules: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*', '*.ts'],
    exclude: ['node_modules', 'dist'],
  };

  if (template.framework === 'nextjs') {
    tsConfig.compilerOptions['jsx'] = 'preserve';
    tsConfig.compilerOptions['plugins'] = [{ name: 'next' }];
    tsConfig.include.push('.next/types/**/*.ts');
  }

  await writeFile(
    join(options.projectPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
}

async function generateEnvExample(
  options: GenerateProjectOptions,
  template: any
): Promise<void> {
  const envVars = template.requiredEnvVars
    .map((varName: string) => {
      const descriptions: Record<string, string> = {
        ANTHROPIC_API_KEY: 'Your Anthropic API key from https://console.anthropic.com',
        DATABASE_URL: 'Database connection string',
        NEXTAUTH_SECRET: 'Secret for NextAuth.js - generate with: openssl rand -base64 32',
        NEXTAUTH_URL: 'Your application URL (http://localhost:3000 for development)',
      };

      return `# ${descriptions[varName] || varName}\n${varName}=`;
    })
    .join('\n\n');

  await writeFile(join(options.projectPath, '.env.example'), envVars);
}

async function generateReadme(
  options: GenerateProjectOptions,
  template: any
): Promise<void> {
  const readme = `# ${options.projectName}

${template.description}

## Features

${template.features.map((f: string) => `- ${f}`).join('\n')}

## Getting Started

### Prerequisites

- Node.js 18 or higher
- ${template.requiredEnvVars.includes('DATABASE_URL') ? 'PostgreSQL database' : ''}

### Installation

\`\`\`bash
pnpm install
\`\`\`

### Environment Variables

Copy \`.env.example\` to \`.env\` and fill in your values:

\`\`\`bash
cp .env.example .env
\`\`\`

Required environment variables:
${template.requiredEnvVars.map((v: string) => `- \`${v}\``).join('\n')}

### Development

\`\`\`bash
pnpm dev
\`\`\`

### Build

\`\`\`bash
pnpm build
\`\`\`

### Test

\`\`\`bash
pnpm test
\`\`\`

## Documentation

- [AI Kit Documentation](https://ai-kit.dev/docs)
- [Anthropic Claude API](https://docs.anthropic.com)

## License

MIT
`;

  await writeFile(join(options.projectPath, 'README.md'), readme);
}

async function generateSourceFiles(
  options: GenerateProjectOptions,
  template: any
): Promise<void> {
  const srcDir = join(options.projectPath, 'src');
  await mkdir(srcDir, { recursive: true });

  // Generate entry point based on framework
  switch (template.framework) {
    case 'nextjs':
      await generateNextjsFiles(options);
      break;
    case 'express':
      await generateExpressFiles(options);
      break;
    case 'vite':
    case 'react':
      await generateReactFiles(options);
      break;
    case 'vue':
      await generateVueFiles(options);
      break;
    case 'svelte':
      await generateSvelteFiles(options);
      break;
    default:
      await generateNodeFiles(options);
  }
}

async function generateNextjsFiles(options: GenerateProjectOptions): Promise<void> {
  const appDir = join(options.projectPath, 'app');
  await mkdir(appDir, { recursive: true });

  // app/page.tsx
  const pageContent = `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Welcome to ${options.projectName}</h1>
      <p className="mt-4 text-gray-600">
        Start building your AI-powered application with Claude.
      </p>
    </main>
  );
}
`;
  await writeFile(join(appDir, 'page.tsx'), pageContent);

  // app/layout.tsx
  const layoutContent = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${options.projectName}',
  description: 'Built with AI Kit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
  await writeFile(join(appDir, 'layout.tsx'), layoutContent);

  // app/globals.css
  const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  await writeFile(join(appDir, 'globals.css'), cssContent);
}

async function generateExpressFiles(options: GenerateProjectOptions): Promise<void> {
  const srcDir = join(options.projectPath, 'src');

  const indexContent = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${options.projectName}' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
  await writeFile(join(srcDir, 'index.ts'), indexContent);
}

async function generateReactFiles(options: GenerateProjectOptions): Promise<void> {
  const srcDir = join(options.projectPath, 'src');

  const appContent = `function App() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Welcome to ${options.projectName}</h1>
      <p className="mt-4 text-gray-600">
        Start building your AI-powered application with Claude.
      </p>
    </div>
  );
}

export default App;
`;
  await writeFile(join(srcDir, 'App.tsx'), appContent);

  const mainContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  await writeFile(join(srcDir, 'main.tsx'), mainContent);
}

async function generateVueFiles(options: GenerateProjectOptions): Promise<void> {
  const srcDir = join(options.projectPath, 'src');

  const appContent = `<template>
  <div class="min-h-screen p-8">
    <h1 class="text-4xl font-bold">Welcome to ${options.projectName}</h1>
    <p class="mt-4 text-gray-600">
      Start building your AI-powered application with Claude.
    </p>
  </div>
</template>

<script setup lang="ts">
// Your Vue logic here
</script>
`;
  await writeFile(join(srcDir, 'App.vue'), appContent);
}

async function generateSvelteFiles(options: GenerateProjectOptions): Promise<void> {
  const srcDir = join(options.projectPath, 'src');
  const routesDir = join(srcDir, 'routes');
  await mkdir(routesDir, { recursive: true });

  const pageContent = `<div class="min-h-screen p-8">
  <h1 class="text-4xl font-bold">Welcome to ${options.projectName}</h1>
  <p class="mt-4 text-gray-600">
    Start building your AI-powered application with Claude.
  </p>
</div>
`;
  await writeFile(join(routesDir, '+page.svelte'), pageContent);
}

async function generateNodeFiles(options: GenerateProjectOptions): Promise<void> {
  const srcDir = join(options.projectPath, 'src');

  const indexContent = `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
  console.log('Welcome to ${options.projectName}');

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: 'Hello, Claude!',
      },
    ],
  });

  console.log(message.content);
}

main();
`;
  await writeFile(join(srcDir, 'index.ts'), indexContent);
}

async function generateConfigFiles(
  options: GenerateProjectOptions,
  template: any
): Promise<void> {
  // Generate aikit.config.ts
  const configContent = `import { defineConfig } from '@ainative-studio/aikit-core';

export default defineConfig({
  framework: '${template.framework}',
  typescript: ${options.typescript},
  features: ${JSON.stringify(options.features)},
});
`;
  await writeFile(join(options.projectPath, 'aikit.config.ts'), configContent);

  // Generate Tailwind config for frameworks that use it
  if (['nextjs', 'react', 'vite', 'vue', 'svelte'].includes(template.framework)) {
    const tailwindContent = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,vue,svelte}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
    await writeFile(join(options.projectPath, 'tailwind.config.js'), tailwindContent);

    const postcssContent = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
    await writeFile(join(options.projectPath, 'postcss.config.js'), postcssContent);
  }
}
