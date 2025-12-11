export interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  framework: string;
  features: string[];
  aliases?: string[];
  optionalFeatures?: Array<{
    name: string;
    value: string;
    description: string;
  }>;
  requiredEnvVars: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  nextSteps?: Array<{
    command: string;
    description: string;
  }>;
}

export const TEMPLATES: Template[] = [
  {
    id: 'nextjs-chat',
    name: 'Next.js Chat App',
    description: 'Full-featured chat application with Claude AI',
    tags: ['nextjs', 'chat', 'ai', 'streaming'],
    framework: 'nextjs',
    aliases: ['next', 'nextjs'],
    features: [
      'App Router',
      'Server Components',
      'Streaming responses',
      'Chat history',
      'Tailwind CSS',
      'TypeScript',
    ],
    optionalFeatures: [
      { name: 'Authentication (NextAuth)', value: 'auth', description: 'User authentication' },
      { name: 'Database (Prisma)', value: 'database', description: 'Store chat history' },
      { name: 'Vector Search', value: 'vector', description: 'Semantic search' },
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit-nextjs': 'latest',
      '@anthropic-ai/sdk': '^0.17.0',
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/node': '^20.10.0',
      '@types/react': '^18.2.0',
      'typescript': '^5.3.0',
      'tailwindcss': '^3.4.0',
    },
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    nextSteps: [
      { command: 'pnpm dev', description: 'Start development server' },
      { command: 'aikit add agent', description: 'Add custom agents' },
    ],
  },
  {
    id: 'react-dashboard',
    name: 'React Dashboard',
    description: 'Analytics dashboard with AI insights',
    tags: ['react', 'dashboard', 'analytics', 'vite'],
    framework: 'vite',
    aliases: ['react', 'vite'],
    features: [
      'Vite',
      'React 18',
      'Recharts',
      'AI-powered insights',
      'Tailwind CSS',
      'TypeScript',
    ],
    optionalFeatures: [
      { name: 'Dark Mode', value: 'darkmode', description: 'Theme toggle' },
      { name: 'Real-time updates', value: 'realtime', description: 'WebSocket support' },
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit': 'latest',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'recharts': '^2.10.0',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.2.0',
      'vite': '^5.0.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
  },
  {
    id: 'express-api',
    name: 'Express API',
    description: 'RESTful API with AI endpoints',
    tags: ['express', 'api', 'backend', 'rest'],
    framework: 'express',
    aliases: ['express', 'api'],
    features: [
      'Express.js',
      'AI endpoints',
      'Rate limiting',
      'CORS',
      'Error handling',
      'TypeScript',
    ],
    optionalFeatures: [
      { name: 'Authentication', value: 'auth', description: 'JWT authentication' },
      { name: 'OpenAPI/Swagger', value: 'swagger', description: 'API documentation' },
      { name: 'Database', value: 'database', description: 'PostgreSQL with Prisma' },
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      'express': '^4.18.0',
      'cors': '^2.8.5',
      'helmet': '^7.1.0',
      'express-rate-limit': '^7.1.0',
    },
    devDependencies: {
      '@types/express': '^4.17.0',
      '@types/cors': '^2.8.0',
      'tsx': '^4.7.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsup src/index.ts',
      start: 'node dist/index.js',
    },
  },
  {
    id: 'agent-system',
    name: 'Agent System',
    description: 'Advanced agent system with tools and memory',
    tags: ['agent', 'tools', 'memory', 'advanced'],
    framework: 'node',
    features: [
      'Multi-agent architecture',
      'Tool integration',
      'Memory management',
      'Prompt chaining',
      'TypeScript',
    ],
    optionalFeatures: [
      { name: 'Vector Memory', value: 'vector', description: 'Vector-based memory' },
      { name: 'Web Search', value: 'search', description: 'Brave Search integration' },
      { name: 'Code Execution', value: 'code', description: 'Safe code execution' },
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit-tools': 'latest',
      '@anthropic-ai/sdk': '^0.17.0',
    },
    devDependencies: {
      'tsx': '^4.7.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsup src/index.ts',
      start: 'node dist/index.js',
    },
  },
  {
    id: 'multi-agent-swarm',
    name: 'Multi-Agent Swarm',
    description: 'Collaborative multi-agent system',
    tags: ['multi-agent', 'swarm', 'collaboration', 'advanced'],
    framework: 'node',
    features: [
      'Agent coordination',
      'Task delegation',
      'Shared context',
      'Agent communication',
      'TypeScript',
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit-tools': 'latest',
    },
    devDependencies: {
      'tsx': '^4.7.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsup src/index.ts',
      start: 'node dist/index.js',
    },
  },
  {
    id: 'tool-integration',
    name: 'Tool Integration Example',
    description: 'Examples of integrating external tools',
    tags: ['tools', 'integration', 'examples'],
    framework: 'node',
    features: [
      'Custom tools',
      'API integrations',
      'File operations',
      'Web scraping',
      'TypeScript',
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit-tools': 'latest',
      'cheerio': '^1.0.0-rc.12',
    },
    devDependencies: {
      'tsx': '^4.7.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsup src/index.ts',
      start: 'node dist/index.js',
    },
  },
  {
    id: 'fullstack-app',
    name: 'Full-Stack App',
    description: 'Complete full-stack application with AI',
    tags: ['fullstack', 'nextjs', 'database', 'auth'],
    framework: 'nextjs',
    features: [
      'Next.js 14',
      'Prisma ORM',
      'NextAuth.js',
      'tRPC',
      'Tailwind CSS',
      'TypeScript',
    ],
    optionalFeatures: [
      { name: 'Stripe Integration', value: 'stripe', description: 'Payment processing' },
      { name: 'Email (Resend)', value: 'email', description: 'Transactional emails' },
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY', 'DATABASE_URL'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit-nextjs': '^0.1.0',
      'next': '^14.0.0',
      'react': '^18.2.0',
      'next-auth': '^4.24.0',
      '@trpc/server': '^10.45.0',
      '@trpc/client': '^10.45.0',
      '@prisma/client': '^5.7.0',
    },
    devDependencies: {
      'prisma': '^5.7.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'next dev',
      build: 'prisma generate && next build',
      start: 'next start',
      'db:push': 'prisma db push',
    },
  },
  {
    id: 'minimal-starter',
    name: 'Minimal Starter',
    description: 'Minimal setup to get started quickly',
    tags: ['minimal', 'starter', 'simple'],
    framework: 'node',
    features: ['Simple setup', 'TypeScript', 'Basic examples'],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@anthropic-ai/sdk': '^0.17.0',
    },
    devDependencies: {
      'tsx': '^4.7.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsup src/index.ts',
      start: 'node dist/index.js',
    },
  },
  {
    id: 'typescript-library',
    name: 'TypeScript Library',
    description: 'Library template for creating AI Kit extensions',
    tags: ['library', 'package', 'typescript'],
    framework: 'library',
    features: [
      'TypeScript',
      'ESM/CJS dual export',
      'Vitest',
      'TSDoc',
      'Changeset',
    ],
    requiredEnvVars: [],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
    },
    devDependencies: {
      'tsup': '^8.0.0',
      'typescript': '^5.3.0',
      'vitest': '^1.1.0',
      '@changesets/cli': '^2.27.0',
    },
    scripts: {
      dev: 'tsup --watch',
      build: 'tsup',
      test: 'vitest',
    },
  },
  {
    id: 'monorepo-setup',
    name: 'Monorepo Setup',
    description: 'Turborepo monorepo with multiple packages',
    tags: ['monorepo', 'turborepo', 'workspace'],
    framework: 'monorepo',
    features: [
      'Turborepo',
      'pnpm workspaces',
      'Shared configs',
      'Multiple apps',
      'TypeScript',
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {},
    devDependencies: {
      'turbo': '^1.11.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'turbo dev',
      build: 'turbo build',
      test: 'turbo test',
    },
  },
  {
    id: 'vue-app',
    name: 'Vue.js App',
    description: 'Vue 3 application with Claude AI',
    tags: ['vue', 'vite', 'composition-api'],
    framework: 'vue',
    aliases: ['vue'],
    features: [
      'Vue 3',
      'Composition API',
      'Vite',
      'Pinia',
      'TypeScript',
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit-vue': 'latest',
      'vue': '^3.4.0',
      'pinia': '^2.1.0',
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.0.0',
      'vite': '^5.0.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
  },
  {
    id: 'svelte-app',
    name: 'Svelte App',
    description: 'SvelteKit application with AI features',
    tags: ['svelte', 'sveltekit', 'ssr'],
    framework: 'svelte',
    aliases: ['svelte', 'sveltekit'],
    features: [
      'SvelteKit',
      'Server-side rendering',
      'TypeScript',
      'Svelte 5',
    ],
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    dependencies: {
      '@ainative-studio/aikit-core': 'latest',
      '@ainative/ai-kit-svelte': 'latest',
      '@sveltejs/kit': '^2.0.0',
      'svelte': '^5.0.0',
    },
    devDependencies: {
      '@sveltejs/vite-plugin-svelte': '^3.0.0',
      'vite': '^5.0.0',
      'typescript': '^5.3.0',
    },
    scripts: {
      dev: 'vite dev',
      build: 'vite build',
      preview: 'vite preview',
    },
  },
];

/**
 * Find a template by ID or alias
 */
export function findTemplate(idOrAlias: string): Template | undefined {
  const search = idOrAlias.toLowerCase().trim();

  // Try exact ID match first
  const exactMatch = TEMPLATES.find((t) => t.id === search);
  if (exactMatch) return exactMatch;

  // Try alias match
  return TEMPLATES.find(
    (t) => t.aliases?.some((alias) => alias.toLowerCase() === search)
  );
}

/**
 * Get all available template IDs and aliases
 */
export function getAllTemplateIdentifiers(): string[] {
  const identifiers: string[] = [];
  TEMPLATES.forEach((t) => {
    identifiers.push(t.id);
    if (t.aliases) {
      identifiers.push(...t.aliases);
    }
  });
  return identifiers;
}
