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
      packageJson.dependencies['@ainative/ai-kit-zerodb'] = 'latest';
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
      // incremental will be added conditionally below
      isolatedModules: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*', '*.ts'],
    exclude: ['node_modules', 'dist'],
  };

  // Library templates need different settings for tsup compatibility
  if (template.framework !== 'library') {
    // Add incremental for faster builds in non-library projects
    // Library templates skip this to avoid conflicts with tsup DTS generation
    tsConfig.compilerOptions['incremental'] = true;
  }
  if (template.framework === 'nextjs') {
    tsConfig.compilerOptions['jsx'] = 'preserve';
    tsConfig.compilerOptions['plugins'] = [{ name: 'next' }];
    tsConfig.include.push('.next/types/**/*.ts');
  }
  if (template.framework === 'vue') {
    tsConfig.compilerOptions['jsx'] = 'preserve';
    tsConfig.compilerOptions['jsxImportSource'] = 'vue';
    tsConfig.compilerOptions['lib'] = ['ES2022', 'DOM', 'DOM.Iterable'];
    tsConfig.include = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'];
  }
  if (template.framework === 'svelte') {
    tsConfig.compilerOptions['lib'] = ['ES2022', 'DOM', 'DOM.Iterable'];
    tsConfig.compilerOptions['moduleResolution'] = 'bundler';
    tsConfig.compilerOptions['allowImportingTsExtensions'] = true;
    tsConfig.compilerOptions['verbatimModuleSyntax'] = true;
    tsConfig.extends = '@tsconfig/svelte/tsconfig.json';
    tsConfig.include = ['src/**/*.ts', 'src/**/*.svelte'];
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
    case 'library':
      await generateLibraryFiles(options);
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

  // Generate index.html
  const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  await writeFile(join(options.projectPath, 'index.html'), indexHtmlContent);

  // Generate vite.config.ts
  const viteConfigContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
  await writeFile(join(options.projectPath, 'vite.config.ts'), viteConfigContent);

  // Generate index.css
  const indexCssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
  await writeFile(join(srcDir, 'index.css'), indexCssContent);

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

  // Generate index.html
  const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
  await writeFile(join(options.projectPath, 'index.html'), indexHtmlContent);

  // Generate vite.config.ts
  const viteConfigContent = `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
`;
  await writeFile(join(options.projectPath, 'vite.config.ts'), viteConfigContent);

  // Generate src/style.css
  const styleCssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
`;
  await writeFile(join(srcDir, 'style.css'), styleCssContent);

  // Generate src/App.vue with AI chat example
  const appContent = `<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto p-8 max-w-4xl">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome to ${options.projectName}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        AI-powered chat application built with Vue 3 and Claude
      </p>

      <ChatComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatComponent from './components/ChatComponent.vue';
</script>
`;
  await writeFile(join(srcDir, 'App.vue'), appContent);

  // Create components directory
  const componentsDir = join(srcDir, 'components');
  await mkdir(componentsDir, { recursive: true });

  // Generate ChatComponent.vue with AI integration
  const chatComponentContent = `<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
      AI Chat
    </h2>

    <!-- Messages Display -->
    <div class="space-y-4 mb-4 h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700 rounded">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="[
          'p-3 rounded-lg',
          message.role === 'user'
            ? 'bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]'
            : 'bg-gray-200 dark:bg-gray-600 mr-auto max-w-[80%]',
        ]"
      >
        <p class="text-sm font-semibold mb-1 text-gray-900 dark:text-white">
          {{ message.role === 'user' ? 'You' : 'Claude' }}
        </p>
        <p class="text-gray-800 dark:text-gray-200">{{ message.content }}</p>
      </div>

      <div v-if="loading" class="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
        <div class="animate-pulse">Claude is thinking...</div>
      </div>
    </div>

    <!-- Input Form -->
    <form @submit.prevent="sendMessage" class="flex gap-2">
      <input
        v-model="inputMessage"
        type="text"
        placeholder="Ask Claude anything..."
        :disabled="loading"
        class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
               focus:outline-none focus:ring-2 focus:ring-blue-500
               dark:bg-gray-700 dark:text-white disabled:opacity-50"
      />
      <button
        type="submit"
        :disabled="loading || !inputMessage.trim()"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
               focus:outline-none focus:ring-2 focus:ring-blue-500
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Sending...' : 'Send' }}
      </button>
    </form>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
      {{ error }}
    </div>

    <!-- Info Message -->
    <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
      <p>💡 To enable AI responses, set your <code class="px-1 bg-gray-200 dark:bg-gray-700 rounded">VITE_ANTHROPIC_API_KEY</code> in <code class="px-1 bg-gray-200 dark:bg-gray-700 rounded">.env</code></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const loading = ref(false);
const error = ref('');

async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value) return;

  const userMessage = inputMessage.value;
  messages.value.push({ role: 'user', content: userMessage });
  inputMessage.value = '';
  loading.value = true;
  error.value = '';

  try {
    // TODO: Replace with actual AI Kit integration
    // Example using @ainative/ai-kit-core:
    // import { createAIProvider } from '@ainative/ai-kit-core';
    // const provider = createAIProvider('anthropic', {
    //   apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    // });
    // const response = await provider.generate({
    //   messages: messages.value,
    // });

    // Simulated response for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      throw new Error('Please set VITE_ANTHROPIC_API_KEY in your .env file');
    }

    // Mock response - replace with actual AI Kit call
    messages.value.push({
      role: 'assistant',
      content: 'This is a placeholder response. To enable real AI responses, integrate @ainative/ai-kit-core with your Anthropic API key.',
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to get response';
    console.error('Error sending message:', err);
  } finally {
    loading.value = false;
  }
}
</script>
`;
  await writeFile(join(componentsDir, 'ChatComponent.vue'), chatComponentContent);

  // Generate main.ts
  const mainContent = `import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

createApp(App).mount('#app');
`;
  await writeFile(join(srcDir, 'main.ts'), mainContent);
}


async function generateSvelteFiles(options: GenerateProjectOptions): Promise<void> {
  const srcDir = join(options.projectPath, 'src');
  await mkdir(srcDir, { recursive: true });

  // Create lib directory for components
  const libDir = join(srcDir, 'lib');
  await mkdir(libDir, { recursive: true });

  // Generate index.html
  const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
  await writeFile(join(options.projectPath, 'index.html'), indexHtmlContent);

  // Generate vite.config.ts
  const viteConfigContent = `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
  },
});
`;
  await writeFile(join(options.projectPath, 'vite.config.ts'), viteConfigContent);

  // Generate svelte.config.js
  const svelteConfigContent = `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
};
`;
  await writeFile(join(options.projectPath, 'svelte.config.js'), svelteConfigContent);

  // Generate src/app.css
  const appCssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#app {
  width: 100%;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}
`;
  await writeFile(join(srcDir, 'app.css'), appCssContent);

  // Generate src/App.svelte with AI chat integration
  const appSvelteContent = `<script lang="ts">
  import ChatComponent from './lib/ChatComponent.svelte';
</script>

<main class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome to ${options.projectName}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        AI-powered chat application built with Svelte and Claude
      </p>
    </div>

    <ChatComponent />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
`;
  await writeFile(join(srcDir, 'App.svelte'), appSvelteContent);

  // Generate src/lib/ChatComponent.svelte with full AI integration
  const chatComponentContent = `<script lang="ts">
  import Anthropic from '@anthropic-ai/sdk';

  interface Message {
    role: 'user' | 'assistant';
    content: string;
  }

  let messages: Message[] = [];
  let inputMessage = '';
  let loading = false;
  let error = '';

  const client = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true, // Only for development - use backend proxy in production
  });

  async function sendMessage() {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    inputMessage = '';
    error = '';

    messages = [...messages, { role: 'user', content: userMessage }];
    loading = true;

    try {
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        throw new Error('Please set VITE_ANTHROPIC_API_KEY in your .env file');
      }

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const assistantMessage =
        response.content[0].type === 'text'
          ? response.content[0].text
          : 'Received non-text response';

      messages = [...messages, { role: 'assistant', content: assistantMessage }];
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to get response';
      console.error('Error sending message:', err);
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
  <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
    AI Chat
  </h2>

  <!-- Messages Display -->
  <div class="space-y-4 mb-4 h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700 rounded">
    {#each messages as message}
      <div
        class="p-3 rounded-lg {message.role === 'user'
          ? 'bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]'
          : 'bg-gray-200 dark:bg-gray-600 mr-auto max-w-[80%]'}"
      >
        <p class="text-sm font-semibold mb-1 text-gray-900 dark:text-white">
          {message.role === 'user' ? 'You' : 'Claude'}
        </p>
        <p class="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    {/each}

    {#if loading}
      <div class="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
        <div class="animate-pulse">Claude is thinking...</div>
      </div>
    {/if}
  </div>

  <!-- Input Form -->
  <div class="flex gap-2">
    <input
      type="text"
      bind:value={inputMessage}
      on:keypress={handleKeyPress}
      placeholder="Ask Claude anything..."
      disabled={loading}
      class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-blue-500
             dark:bg-gray-700 dark:text-white disabled:opacity-50"
    />
    <button
      type="button"
      on:click={sendMessage}
      disabled={loading || !inputMessage.trim()}
      class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
             focus:outline-none focus:ring-2 focus:ring-blue-500
             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Sending...' : 'Send'}
    </button>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
      {error}
    </div>
  {/if}

  <!-- Info Message -->
  <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
    <p>
      💡 To enable AI responses, set your <code
        class="px-1 bg-gray-200 dark:bg-gray-700 rounded">VITE_ANTHROPIC_API_KEY</code
      >
      in <code class="px-1 bg-gray-200 dark:bg-gray-700 rounded">.env</code>
    </p>
    <p class="mt-2 text-xs text-gray-500 dark:text-gray-500">
      ⚠️ Note: API key is exposed in browser. Use a backend proxy for production.
    </p>
  </div>
</div>
`;
  await writeFile(join(libDir, 'ChatComponent.svelte'), chatComponentContent);

  // Generate src/main.ts
  const mainTsContent = `import './app.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
`;
  await writeFile(join(srcDir, 'main.ts'), mainTsContent);

  // Generate src/vite-env.d.ts
  const viteEnvContent = `/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`;
  await writeFile(join(srcDir, 'vite-env.d.ts'), viteEnvContent);
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

async function generateLibraryFiles(options: GenerateProjectOptions): Promise<void> {
  const srcDir = join(options.projectPath, 'src');

  // Generate a proper library entry point with AI Kit utilities
  const indexContent = `import { AIProvider } from '@ainative/ai-kit-core';

/**
 * Example utility function that uses AI Kit
 * This demonstrates how to build a library on top of AI Kit
 */
export async function generateText(
  provider: AIProvider,
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const response = await provider.generate({
    prompt,
    maxTokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.7,
  });

  return response.text;
}

/**
 * Example class-based approach for AI Kit library
 */
export class AIHelper {
  constructor(private provider: AIProvider) {}

  async summarize(text: string): Promise<string> {
    return generateText(
      this.provider,
      \`Please summarize the following text:\\n\\n\${text}\`
    );
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    return generateText(
      this.provider,
      \`Translate the following text to \${targetLanguage}:\\n\\n\${text}\`
    );
  }

  async analyze(text: string): Promise<string> {
    return generateText(
      this.provider,
      \`Analyze the sentiment and key points in the following text:\\n\\n\${text}\`
    );
  }
}

/**
 * Example types for your library
 */
export interface AILibraryConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

/**
 * Re-export commonly used types from AI Kit
 */
export type { AIProvider } from '@ainative/ai-kit-core';
`;

  await writeFile(join(srcDir, 'index.ts'), indexContent);
}

async function generateConfigFiles(
  options: GenerateProjectOptions,
  template: any
): Promise<void> {
  // Generate aikit.config.js (using .js instead of .ts for Node.js compatibility)
  const configContent = `// @ts-check
/** @type {import('@ainative/ai-kit-core').ProjectConfig} */
module.exports = {
  framework: '${template.framework}',
  typescript: ${options.typescript},
  features: ${JSON.stringify(options.features)},
};
`;
  await writeFile(join(options.projectPath, 'aikit.config.js'), configContent);

  // Generate tsup.config.ts for library templates
  if (template.framework === 'library') {
    const tsupContent = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
`;
    await writeFile(join(options.projectPath, 'tsup.config.ts'), tsupContent);
  }

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

    const postcssContent = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
    await writeFile(join(options.projectPath, 'postcss.config.js'), postcssContent);
  }
}
