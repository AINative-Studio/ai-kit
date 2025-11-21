# @ainative/ai-kit-cli

Official CLI tool for the AI Kit framework - scaffold projects, add features, and manage your AI-powered applications with Claude.

[![npm version](https://badge.fury.io/js/@ainative%2Fai-kit-cli.svg)](https://www.npmjs.com/package/@ainative/ai-kit-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **Quick scaffolding** - Create production-ready AI projects in seconds
- 📦 **12+ Templates** - Choose from Next.js, React, Vue, Svelte, Express, and more
- 🎨 **Interactive prompts** - Intuitive CLI experience with smart defaults
- 🔧 **Feature generation** - Add components, agents, tools, and routes on-demand
- ⚡ **Dev server** - Start development with automatic environment validation
- 🏗️ **Build & Deploy** - Production builds and multi-platform deployment
- 🔄 **Upgrade system** - Keep dependencies up-to-date with automated upgrades
- 🧪 **Testing support** - Built-in test runner integration
- 🐳 **Docker support** - Generate Dockerfiles and container configurations
- 📖 **Rich documentation** - Generated README and inline comments

## Installation

### Global Installation (Recommended)

```bash
npm install -g @ainative/ai-kit-cli

# Or with pnpm
pnpm add -g @ainative/ai-kit-cli

# Or with yarn
yarn global add @ainative/ai-kit-cli
```

### One-time Usage (npx)

```bash
npx @ainative/ai-kit-cli create my-app
```

### Migration from Old Package Name

If you previously installed `@aikit/cli`, please uninstall it first:

```bash
npm uninstall -g @aikit/cli
npm install -g @ainative/ai-kit-cli
```

## Quick Start

Create a new AI Kit project:

```bash
aikit create my-ai-app
```

This will prompt you to:
1. Choose a template (Next.js, React, Express, etc.)
2. Select features to include
3. Choose TypeScript or JavaScript
4. Select package manager (pnpm, npm, yarn)
5. Initialize git repository
6. Install dependencies

## Commands

### `aikit create`

Create a new AI Kit project from a template.

**Usage:**

```bash
aikit create [project-name] [options]
```

**Options:**

- `-t, --template <template>` - Template to use (see Templates section)
- `--typescript` - Use TypeScript (default: true)
- `--no-typescript` - Use JavaScript instead
- `-p, --package-manager <pm>` - Package manager (npm, yarn, pnpm)
- `--git` - Initialize git repository (default: true)
- `--no-git` - Skip git initialization
- `--install` - Install dependencies (default: true)
- `--no-install` - Skip dependency installation
- `-y, --yes` - Skip prompts and use defaults

**Examples:**

```bash
# Interactive mode
aikit create my-app

# With specific template
aikit create my-app --template nextjs-chat

# With all options
aikit create my-app \
  --template express-api \
  --typescript \
  --package-manager pnpm \
  --git \
  --install

# Skip prompts
aikit create my-app --yes

# JavaScript instead of TypeScript
aikit create my-app --no-typescript
```

### `aikit add`

Add features to an existing AI Kit project.

**Usage:**

```bash
aikit add [feature] [options]
```

**Features:**

- `component` - React/Vue/Svelte component
- `agent` - AI agent with tools and prompts
- `tool` - Custom tool for agents
- `route` - API route/endpoint
- `test` - Test file

**Options:**

- `-t, --type <type>` - Type of feature to add
- `-n, --name <name>` - Name of the feature
- `-p, --path <path>` - Path where to create the feature

**Examples:**

```bash
# Interactive mode
aikit add

# Add a component
aikit add component --name UserProfile

# Add an agent
aikit add agent --name DataAnalyzer --path agents

# Add a tool
aikit add tool --name WebSearchTool

# Add an API route
aikit add route --name users --path api

# Add a test file
aikit add test --name utils
```

### `aikit test`

Run tests for your AI Kit project.

**Usage:**

```bash
aikit test [path] [options]
```

**Options:**

- `-w, --watch` - Run tests in watch mode
- `-c, --coverage` - Generate coverage report
- `--ui` - Open Vitest UI
- `-f, --filter <pattern>` - Filter tests by pattern
- `-r, --reporter <reporter>` - Test reporter (default, verbose, json)

**Examples:**

```bash
# Run all tests
aikit test

# Run specific test file
aikit test src/components/Button.test.ts

# Watch mode
aikit test --watch

# With coverage
aikit test --coverage

# Open UI
aikit test --ui

# Filter tests
aikit test --filter "user profile"
```

### `aikit dev`

Start development server.

**Usage:**

```bash
aikit dev [options]
```

**Options:**

- `-p, --port <port>` - Port to run on (default: 3000)
- `-H, --host <host>` - Host to run on (default: localhost)
- `--https` - Use HTTPS
- `--open` - Open browser automatically

**Examples:**

```bash
# Start dev server
aikit dev

# Custom port
aikit dev --port 4000

# Custom host
aikit dev --host 0.0.0.0

# With HTTPS
aikit dev --https

# Open browser
aikit dev --open
```

### `aikit build`

Build your AI Kit project for production.

**Usage:**

```bash
aikit build [options]
```

**Options:**

- `--production` - Build for production (default: true)
- `--analyze` - Analyze bundle size
- `--sourcemap` - Generate source maps
- `--no-typecheck` - Skip type checking

**Examples:**

```bash
# Production build
aikit build

# With bundle analysis
aikit build --analyze

# With source maps
aikit build --sourcemap

# Skip type checking
aikit build --no-typecheck
```

### `aikit deploy`

Deploy your AI Kit project.

**Usage:**

```bash
aikit deploy [options]
```

**Options:**

- `-p, --platform <platform>` - Deployment platform (vercel, railway, docker, netlify)
- `--prod` - Deploy to production
- `--env <environment>` - Environment to deploy to

**Supported Platforms:**

- **Vercel** - Recommended for Next.js applications
- **Railway** - Full-stack applications with database
- **Docker** - Containerized deployments
- **Netlify** - Static sites and serverless functions

**Examples:**

```bash
# Interactive platform selection
aikit deploy

# Deploy to Vercel
aikit deploy --platform vercel --prod

# Deploy to Railway
aikit deploy --platform railway --env production

# Build Docker image
aikit deploy --platform docker

# Deploy to Netlify
aikit deploy --platform netlify
```

### `aikit upgrade`

Upgrade AI Kit dependencies to the latest version.

**Usage:**

```bash
aikit upgrade [options]
```

**Options:**

- `--latest` - Upgrade to latest versions (including breaking changes)
- `--check` - Check for available updates without upgrading
- `-i, --interactive` - Choose which packages to upgrade

**Examples:**

```bash
# Upgrade to compatible versions
aikit upgrade

# Check for updates
aikit upgrade --check

# Upgrade to latest (including breaking changes)
aikit upgrade --latest

# Interactive mode
aikit upgrade --interactive
```

### `aikit prompt` ⭐ NEW

Test, compare, and optimize AI prompts with real-time feedback and analytics.

**Sub-commands:**

- `aikit prompt test` - Test a single prompt
- `aikit prompt compare` - Compare multiple prompts side-by-side
- `aikit prompt optimize` - AI-powered prompt optimization
- `aikit prompt batch` - Test prompts in batch mode
- `aikit prompt history` - View and analyze test history

---

#### `aikit prompt test`

Test a single prompt with real-time streaming feedback.

**Usage:**

```bash
aikit prompt test <config> [options]
```

**Options:**

- `-p, --prompt <id>` - Specific prompt ID to test
- `-i, --input <text>` - Input text for the prompt
- `-m, --model <name>` - Model to use (gpt-4, claude-3-sonnet, etc.)
- `--stream` - Enable streaming output (default: true)
- `--test-cases` - Run all test cases from config
- `--save` - Save results to history

**Examples:**

```bash
# Test prompt with interactive input
aikit prompt test prompts/customer-support.yaml

# Test specific prompt variant
aikit prompt test prompts/support.yaml --prompt v2-enhanced

# Test with CLI input
aikit prompt test prompts/support.yaml --input "How do I reset my password?"

# Test with different model
aikit prompt test prompts/support.yaml --model claude-3-opus

# Run all test cases from config
aikit prompt test prompts/support.yaml --test-cases

# Save results to history
aikit prompt test prompts/support.yaml --save
```

**Output:**

```
🧪 Testing Prompt

Config: prompts/customer-support.yaml

✔ Prompt tested successfully (1250ms)

📊 Metrics:
──────────────────────────────────────────────────
Tokens: 342
Cost: $0.0034
Latency: 1250ms
──────────────────────────────────────────────────

📝 Output:

I'd be happy to help you reset your password...
```

---

#### `aikit prompt compare`

Compare 2-4 prompts side-by-side to find the best performer.

**Usage:**

```bash
aikit prompt compare <config1> <config2> [...configs] [options]
```

**Options:**

- `-i, --input <text>` - Input text to test all prompts
- `-m, --model <name>` - Model to use for all prompts
- `-t, --test-cases <file>` - File with test cases (one per line)
- `-o, --output <file>` - Export comparison results
- `-f, --format <type>` - Output format (json, csv, markdown)
- `--save` - Save results to history

**Examples:**

```bash
# Compare two prompt versions
aikit prompt compare \
  prompts/support-v1.yaml \
  prompts/support-v2.yaml

# Compare with specific input
aikit prompt compare \
  prompts/support-v1.yaml \
  prompts/support-v2.yaml \
  --input "I need a refund"

# Compare with test cases file
aikit prompt compare \
  prompts/v1.yaml \
  prompts/v2.yaml \
  prompts/v3.yaml \
  --test-cases test-inputs.txt

# Export results
aikit prompt compare \
  prompts/v1.yaml \
  prompts/v2.yaml \
  --output comparison.json \
  --format json
```

**Output:**

```
🔍 Comparing 2 prompts

Testing: Customer Support v1
✔ Prompt tested successfully (1150ms)

Testing: Customer Support v2
✔ Prompt tested successfully (980ms)

📊 Comparison Results

════════════════════════════════════════════════════════════════════════════════
Metric               v1-basic         v2-enhanced
────────────────────────────────────────────────────────────────────────────────
Tokens              342              298 (-12.9%)
Cost                $0.0034          $0.0030 (-11.8%)
Latency             1150ms           980ms (-14.8%)
════════════════════════════════════════════════════════════════════════════════

🏆 Overall Winner: v2-enhanced
```

---

#### `aikit prompt optimize`

AI-powered prompt analysis and optimization with actionable suggestions.

**Usage:**

```bash
aikit prompt optimize <config> [options]
```

**Options:**

- `--auto-test` - Automatically test optimization
- `-o, --output <file>` - Save optimized prompt to file
- `--save` - Save results to history

**Examples:**

```bash
# Analyze and optimize
aikit prompt optimize prompts/draft.yaml

# With automatic testing
aikit prompt optimize prompts/draft.yaml --auto-test

# Save optimized version
aikit prompt optimize prompts/draft.yaml --output prompts/optimized.yaml

# Save to history
aikit prompt optimize prompts/draft.yaml --save
```

**Output:**

```
🔧 Analyzing prompt for optimization...

Found 5 optimization suggestions:

1. [HIGH] structure: Add explicit task definition
   Impact: Clarifies expected output

2. [MEDIUM] structure: Add clear role definition
   Impact: Improves response consistency and quality

3. [MEDIUM] structure: Specify output format
   Impact: Ensures consistent output formatting

4. [MEDIUM] best_practice: Add examples for clarity
   Impact: Improves output quality through few-shot learning

5. [LOW] clarity: Replace ambiguous word: "things"
   Impact: Increases precision

✨ Optimized Prompt:

You are an expert customer support specialist with 10+ years of experience.

Your task is to provide helpful, empathetic responses to customer inquiries.

Guidelines:
- Be professional and friendly
- Acknowledge concerns
- Provide actionable solutions
- Offer further assistance

Customer inquiry:
{{input}}

✅ Optimization Results:

Token Reduction: 45 tokens (11.5%)
Cost Reduction: $0.0005
Clarity Improvement: +18.3 points
```

---

#### `aikit prompt batch`

Test prompts against multiple inputs with parallel execution.

**Usage:**

```bash
aikit prompt batch <config> [options]
```

**Options:**

- `--input <file>` - CSV file with test inputs (required)
- `--column <name>` - Column name for inputs (default: 'input')
- `-p, --prompt <id>` - Specific prompt ID to test
- `-c, --concurrency <number>` - Parallel requests (default: 3)
- `-o, --output <file>` - Export results to file
- `-f, --format <type>` - Output format (json, csv)
- `--save` - Save results to history

**CSV Format:**

```csv
input,category,priority
"How do I reset my password?",account,high
"I need a refund",billing,high
"App keeps crashing",technical,critical
```

**Examples:**

```bash
# Run batch test
aikit prompt batch \
  prompts/support.yaml \
  --input test-inputs.csv

# With specific prompt variant
aikit prompt batch \
  prompts/support.yaml \
  --prompt v2-enhanced \
  --input inputs.csv

# Higher concurrency
aikit prompt batch \
  prompts/support.yaml \
  --input inputs.csv \
  --concurrency 5

# Export results
aikit prompt batch \
  prompts/support.yaml \
  --input inputs.csv \
  --output results.csv \
  --format csv
```

**Output:**

```
🔄 Running batch test with 8 inputs...

✔ Completed 8/8 tests in 4.2s

📊 Batch Test Results

════════════════════════════════════════════════════════
Total Tests:     8
Successful:      8
Duration:        4.2s
────────────────────────────────────────────────────────
Avg Tokens:      315
Avg Cost:        $0.0032
Avg Latency:     525ms
────────────────────────────────────────────────────────
Total Cost:      $0.0256
════════════════════════════════════════════════════════
```

---

#### `aikit prompt history`

View, analyze, and manage prompt test history.

**Commands:**

- `aikit prompt history list` - List test history
- `aikit prompt history show <id>` - Show detailed entry
- `aikit prompt history analytics <name>` - Show analytics for prompt
- `aikit prompt history export` - Export history
- `aikit prompt history clear` - Clear all history

**Examples:**

```bash
# List recent tests
aikit prompt history list

# Filter by prompt name
aikit prompt history list --filter "customer-support"

# Filter by test type
aikit prompt history list --type compare

# Show last 20 entries
aikit prompt history list --last 20

# Show detailed entry
aikit prompt history show abc-123-def

# View analytics
aikit prompt history analytics "customer-support"

# Export history
aikit prompt history export --output history.json --format json

# Clear history
aikit prompt history clear
```

**List Output:**

```
📜 History (10 entries)

════════════════════════════════════════════════════════════════════════════════
Customer Support v1.0
[single] ID: abc-123-def
Time: 2024-01-15 10:30:45
Tags: #production #test
Tokens: 342 | Cost: $0.0034 | Latency: 1250ms
────────────────────────────────────────────────────────────────────────────────
Customer Support v2.0
[compare] ID: def-456-ghi
Time: 2024-01-15 09:15:22
Compared: 2 prompts | Winner: v2-enhanced
────────────────────────────────────────────────────────────────────────────────
...
```

**Analytics Output:**

```
📊 Analytics for "Customer Support"

════════════════════════════════════════════════════
Total Tests:     45
Total Cost:      $0.1534
Avg Tokens:      318
Avg Latency:     612ms
────────────────────────────────────────────────────

Test Types:
  single     : 30 (66.7%)
  compare    : 10 (22.2%)
  batch      : 3 (6.7%)
  optimize   : 2 (4.4%)
────────────────────────────────────────────────────

Recent Activity:
  2024-01-15  ███ 3
  2024-01-14  █████ 5
  2024-01-13  ██ 2
  2024-01-12  ████ 4
  2024-01-11  ██ 2
════════════════════════════════════════════════════
```

## Prompt Testing Configuration

### Prompt Config File Format

Create a YAML configuration file for your prompts:

```yaml
name: Customer Support Response
version: 1.0
description: AI-powered customer support response generator

prompts:
  - id: v1-basic
    content: |
      You are a helpful customer support agent.

      Respond to the following customer inquiry:

      {{input}}
    parameters:
      temperature: 0.7
      max_tokens: 500

  - id: v2-enhanced
    content: |
      You are an expert customer support specialist.

      Your task is to provide helpful, empathetic responses.

      Guidelines:
      - Be professional and friendly
      - Acknowledge the customer's concern
      - Provide clear solutions

      Customer inquiry:
      {{input}}
    parameters:
      temperature: 0.7
      max_tokens: 500
      top_p: 0.9

test_cases:
  - input: "How do I reset my password?"
    expected_topics: ["password", "reset", "security"]
    expected_keywords: ["email", "link", "account"]

  - input: "I need a refund for my last order"
    expected_topics: ["refund", "billing"]

defaults:
  model: gpt-4
  temperature: 0.7
  max_tokens: 500
```

### Configuration Options

**Root Level:**

- `name` (required) - Prompt configuration name
- `version` (required) - Version string
- `description` (optional) - Configuration description
- `prompts` (required) - Array of prompt variants
- `test_cases` (optional) - Test cases for validation
- `models` (optional) - Model configurations
- `defaults` (optional) - Default parameters

**Prompt Variant:**

- `id` (required) - Unique identifier for the prompt
- `content` (required) - Prompt template with `{{input}}` placeholder
- `parameters` (optional) - Model parameters
- `metadata` (optional) - Additional metadata

**Parameters:**

- `temperature` - Creativity (0.0-2.0, default: 0.7)
- `max_tokens` - Maximum output length
- `top_p` - Nucleus sampling (0.0-1.0)
- `frequency_penalty` - Reduce repetition (-2.0 to 2.0)
- `presence_penalty` - Encourage new topics (-2.0 to 2.0)
- `stop` - Stop sequences (array of strings)

**Test Cases:**

- `input` (required) - Test input text
- `expected_topics` (optional) - Expected topic keywords
- `expected_keywords` (optional) - Expected output keywords
- `expected_format` (optional) - Expected output format
- `metadata` (optional) - Additional metadata

### Prompt Engineering Best Practices

**1. Clear Role Definition**

✅ Good:
```yaml
content: |
  You are an expert customer support specialist with 10+ years of experience.

  {{input}}
```

❌ Bad:
```yaml
content: |
  Help the customer.

  {{input}}
```

**2. Explicit Task Description**

✅ Good:
```yaml
content: |
  Your task is to provide step-by-step solutions to technical problems.

  Requirements:
  - List all steps clearly
  - Use numbered lists
  - Include troubleshooting tips

  {{input}}
```

❌ Bad:
```yaml
content: |
  Answer this question: {{input}}
```

**3. Output Format Specification**

✅ Good:
```yaml
content: |
  Provide your response in the following format:

  1. Summary: [One sentence overview]
  2. Details: [Detailed explanation]
  3. Next Steps: [Action items]

  {{input}}
```

**4. Few-Shot Examples**

✅ Good:
```yaml
content: |
  Classify customer inquiries into categories.

  Example 1:
  Input: "My order hasn't arrived"
  Category: Shipping

  Example 2:
  Input: "I can't log in"
  Category: Account

  Now classify: {{input}}
```

**5. Constraints and Guidelines**

✅ Good:
```yaml
content: |
  Guidelines:
  - Keep responses under 200 words
  - Use friendly, professional tone
  - Avoid technical jargon
  - Always offer to help further

  Constraints:
  - Do not make promises about refunds
  - Do not provide pricing without verification

  {{input}}
```

### Environment Variables

Set your API keys before using prompt testing:

```bash
# Required for OpenAI models
export OPENAI_API_KEY=sk-...

# Required for Anthropic/Claude models
export ANTHROPIC_API_KEY=sk-ant-...

# Required for Google models
export GOOGLE_API_KEY=...
```

### Supported Models

**OpenAI:**
- `gpt-4` - Most capable, best for complex tasks
- `gpt-4-turbo` - Faster, cheaper than GPT-4
- `gpt-3.5-turbo` - Fast and affordable

**Anthropic:**
- `claude-3-opus` - Most capable Claude model
- `claude-3-sonnet` - Balanced performance and cost
- `claude-3-haiku` - Fastest and most affordable

**Google:**
- `gemini-pro` - Google's most capable model

### Cost Management

**Token Estimation:**

Approximate token counts:
- 1 token ≈ 4 characters of English text
- 100 tokens ≈ 75 words
- 1,000 tokens ≈ 750 words

**Cost Optimization Tips:**

1. **Use cheaper models for simple tasks**
   ```bash
   aikit prompt test prompts/simple.yaml --model gpt-3.5-turbo
   ```

2. **Set max_tokens appropriately**
   ```yaml
   parameters:
     max_tokens: 150  # Don't over-allocate
   ```

3. **Optimize prompts to reduce tokens**
   ```bash
   aikit prompt optimize prompts/verbose.yaml
   ```

4. **Batch test with controlled concurrency**
   ```bash
   aikit prompt batch prompts/test.yaml --input data.csv --concurrency 3
   ```

### Integration with CI/CD

**GitHub Actions Example:**

```yaml
name: Prompt Testing

on:
  pull_request:
    paths:
      - 'prompts/**'

jobs:
  test-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install AI Kit CLI
        run: npm install -g @ainative/ai-kit-cli

      - name: Test Prompts
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          aikit prompt test prompts/support.yaml --test-cases

      - name: Run Batch Tests
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          aikit prompt batch prompts/support.yaml \
            --input test-inputs.csv \
            --output results.csv

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: results.csv
```

### Troubleshooting

**API Key Issues:**

```bash
# Verify key is set
echo $OPENAI_API_KEY

# Test with minimal prompt
aikit prompt test prompts/simple.yaml --input "Hello"
```

**Rate Limiting:**

Reduce concurrency if you hit rate limits:

```bash
aikit prompt batch prompts/test.yaml \
  --input data.csv \
  --concurrency 1  # Slower but avoids rate limits
```

**YAML Parsing Errors:**

Validate your YAML syntax:

```bash
# Use yamllint or online validators
yamllint prompts/config.yaml
```

**Token Limit Exceeded:**

Reduce max_tokens or simplify your prompt:

```yaml
parameters:
  max_tokens: 500  # Reduce from 1000
```

## Templates

AI Kit CLI provides 12+ production-ready templates:

### Web Applications

#### Next.js Chat App (`nextjs-chat`)

Full-featured chat application with Claude AI integration.

**Features:**
- Next.js 14 App Router
- Server Components
- Streaming responses
- Chat history
- Tailwind CSS

**Optional Features:**
- Authentication (NextAuth)
- Database (Prisma)
- Vector Search

**Use Case:** Chat interfaces, conversational AI, customer support

```bash
aikit create my-chat --template nextjs-chat
```

#### React Dashboard (`react-dashboard`)

Analytics dashboard with AI-powered insights.

**Features:**
- Vite + React 18
- Recharts for visualizations
- AI-powered data analysis
- Responsive design

**Optional Features:**
- Dark mode
- Real-time updates

**Use Case:** Analytics, data visualization, business intelligence

```bash
aikit create my-dashboard --template react-dashboard
```

#### Vue.js App (`vue-app`)

Vue 3 application with Composition API.

**Features:**
- Vue 3 Composition API
- Vite
- Pinia state management
- TypeScript

**Use Case:** Modern Vue applications with AI features

```bash
aikit create my-vue-app --template vue-app
```

#### Svelte App (`svelte-app`)

SvelteKit application with server-side rendering.

**Features:**
- SvelteKit
- Svelte 5
- TypeScript
- SSR support

**Use Case:** Fast, reactive applications

```bash
aikit create my-svelte-app --template svelte-app
```

### Backend & API

#### Express API (`express-api`)

RESTful API with AI endpoints.

**Features:**
- Express.js
- Rate limiting
- CORS & Helmet
- Error handling
- TypeScript

**Optional Features:**
- JWT Authentication
- OpenAPI/Swagger
- Database (PostgreSQL + Prisma)

**Use Case:** REST APIs, microservices, backend services

```bash
aikit create my-api --template express-api
```

### AI-Specific

#### Agent System (`agent-system`)

Advanced agent system with tools and memory.

**Features:**
- Multi-agent architecture
- Tool integration
- Memory management
- Prompt chaining

**Optional Features:**
- Vector memory
- Web search (Brave)
- Code execution

**Use Case:** Autonomous agents, task automation, complex workflows

```bash
aikit create my-agent --template agent-system
```

#### Multi-Agent Swarm (`multi-agent-swarm`)

Collaborative multi-agent system.

**Features:**
- Agent coordination
- Task delegation
- Shared context
- Inter-agent communication

**Use Case:** Complex problem-solving, distributed systems

```bash
aikit create my-swarm --template multi-agent-swarm
```

#### Tool Integration Example (`tool-integration`)

Examples of integrating external tools with AI.

**Features:**
- Custom tool examples
- API integrations
- File operations
- Web scraping

**Use Case:** Learning tool development, custom integrations

```bash
aikit create tool-example --template tool-integration
```

### Full-Stack

#### Full-Stack App (`fullstack-app`)

Complete full-stack application with everything included.

**Features:**
- Next.js 14
- Prisma ORM
- NextAuth.js
- tRPC
- Tailwind CSS

**Optional Features:**
- Stripe payment processing
- Email (Resend)

**Use Case:** SaaS applications, production apps

```bash
aikit create my-saas --template fullstack-app
```

### Starter & Library

#### Minimal Starter (`minimal-starter`)

Minimal setup to get started quickly.

**Features:**
- Simple Node.js setup
- TypeScript
- Basic Claude integration

**Use Case:** Quick experiments, learning

```bash
aikit create quick-start --template minimal-starter
```

#### TypeScript Library (`typescript-library`)

Library template for creating AI Kit extensions.

**Features:**
- TypeScript
- ESM/CJS dual export
- Vitest
- TSDoc
- Changesets

**Use Case:** Creating AI Kit packages, libraries

```bash
aikit create my-library --template typescript-library
```

#### Monorepo Setup (`monorepo-setup`)

Turborepo monorepo with multiple packages.

**Features:**
- Turborepo
- pnpm workspaces
- Shared configs
- Multiple apps

**Use Case:** Large projects, multiple apps/packages

```bash
aikit create my-monorepo --template monorepo-setup
```

## Configuration

Projects created with AI Kit CLI include an `aikit.config.ts` file for configuration:

```typescript
import { defineConfig } from '@aikit/core';

export default defineConfig({
  // Framework: nextjs, react, vue, svelte, express, node
  framework: 'nextjs',

  // Use TypeScript
  typescript: true,

  // Enabled features
  features: ['auth', 'database'],

  // Required environment variables
  requiredEnvVars: ['ANTHROPIC_API_KEY', 'DATABASE_URL'],

  // Test runner: vitest, jest
  testRunner: 'vitest',

  // Development port
  devPort: 3000,

  // Build output directory
  distDir: 'dist',

  // Entry point (for Node.js apps)
  entry: 'src/index.ts',

  // Docker image name
  dockerImage: 'my-app',
});
```

## Environment Variables

All AI Kit projects require at minimum:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from: https://console.anthropic.com

Additional variables depend on your template and features:

```bash
# Database (if using Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Authentication (if using NextAuth)
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Project Structure

Typical AI Kit project structure:

```
my-app/
├── src/
│   ├── agents/          # AI agents
│   ├── tools/           # Custom tools
│   ├── components/      # UI components
│   ├── lib/             # Utilities
│   └── index.ts         # Entry point
├── __tests__/           # Test files
├── .env.example         # Environment template
├── .gitignore
├── aikit.config.ts      # AI Kit configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Development Workflow

### 1. Create Project

```bash
aikit create my-app
cd my-app
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Development

```bash
aikit dev
```

### 4. Add Features

```bash
# Add an agent
aikit add agent --name DataAnalyzer

# Add a component
aikit add component --name ChatInterface

# Add a tool
aikit add tool --name SearchTool
```

### 5. Test

```bash
aikit test
```

### 6. Build

```bash
aikit build
```

### 7. Deploy

```bash
aikit deploy
```

## Testing

AI Kit CLI integrates with Vitest and Jest for testing.

### Running Tests

```bash
# All tests
aikit test

# Watch mode
aikit test --watch

# Coverage
aikit test --coverage

# Specific file
aikit test src/agents/MyAgent.test.ts
```

### Writing Tests

Agent test example:

```typescript
import { describe, it, expect } from 'vitest';
import { MyAgent } from '../MyAgent';

describe('MyAgent', () => {
  it('processes messages correctly', async () => {
    const agent = new MyAgent();
    const response = await agent.execute('Hello');
    expect(response).toBeDefined();
  });
});
```

## Deployment

### Vercel

Best for Next.js applications:

```bash
aikit deploy --platform vercel --prod
```

### Railway

For full-stack apps with database:

```bash
aikit deploy --platform railway
```

### Docker

For containerized deployments:

```bash
aikit deploy --platform docker
```

This generates a production-ready Dockerfile and builds the image.

### Netlify

For static sites:

```bash
aikit deploy --platform netlify --prod
```

## Troubleshooting

### Port Already in Use

```bash
aikit dev --port 4000
```

### Missing Environment Variables

Check your `.env` file has all required variables:

```bash
cat .env.example
```

### Type Errors After Upgrade

Run type checking:

```bash
tsc --noEmit
```

### Build Failures

Clean and rebuild:

```bash
rm -rf node_modules dist .next
pnpm install
aikit build
```

### Git Not Initialized

Initialize manually:

```bash
git init
git add .
git commit -m "Initial commit"
```

## Plugin Development

Extend AI Kit CLI with custom plugins:

```typescript
// aikit-plugin-custom.ts
import { Plugin } from '@ainative/ai-kit-cli';

export const customPlugin: Plugin = {
  name: 'custom',
  version: '1.0.0',

  commands: [
    {
      name: 'custom',
      description: 'Custom command',
      action: async () => {
        console.log('Custom command executed');
      },
    },
  ],

  hooks: {
    beforeCreate: async (options) => {
      // Modify options
      return options;
    },
    afterCreate: async (projectPath) => {
      // Post-creation tasks
    },
  },
};
```

Register plugin in `aikit.config.ts`:

```typescript
import { defineConfig } from '@aikit/core';
import { customPlugin } from './aikit-plugin-custom';

export default defineConfig({
  plugins: [customPlugin],
});
```

## Best Practices

### Project Organization

- Keep agents in `agents/` directory
- Store tools in `tools/` directory
- Use clear, descriptive names
- Write comprehensive tests
- Document complex logic

### Environment Management

- Never commit `.env` files
- Use `.env.example` as template
- Validate env vars at startup
- Use different `.env` files per environment

### Development

- Use TypeScript for better DX
- Enable strict mode
- Write tests for agents and tools
- Use ESLint and Prettier
- Keep dependencies updated

### Production

- Build and test before deploying
- Use environment-specific configs
- Enable error tracking
- Monitor API usage
- Set up logging

## FAQ

### Can I use JavaScript instead of TypeScript?

Yes, use the `--no-typescript` flag:

```bash
aikit create my-app --no-typescript
```

### Which template should I choose?

- **Chat/conversation**: `nextjs-chat`
- **Dashboard/analytics**: `react-dashboard`
- **REST API**: `express-api`
- **Agents/automation**: `agent-system`
- **Full app**: `fullstack-app`
- **Quick start**: `minimal-starter`

### How do I update dependencies?

```bash
aikit upgrade
```

### Can I use with existing projects?

The `add` command works in existing AI Kit projects:

```bash
cd existing-project
aikit add component --name NewComponent
```

### How do I customize templates?

Fork the template and modify, or use the minimal starter and build up.

### Is Windows supported?

Yes, AI Kit CLI works on Windows, macOS, and Linux.

## Resources

- **Documentation**: https://ai-kit.dev/docs
- **GitHub**: https://github.com/ai-native/ai-kit
- **Discord**: https://discord.gg/ai-kit
- **Examples**: https://github.com/ai-native/ai-kit/tree/main/examples
- **Blog**: https://ai-kit.dev/blog

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md).

### Development Setup

```bash
git clone https://github.com/ai-native/ai-kit
cd ai-kit/packages/cli
pnpm install
pnpm dev
```

### Running Tests

```bash
pnpm test
pnpm test:coverage
```

### Building

```bash
pnpm build
```

## License

MIT © [AI Native](https://ai-native.dev)

## Support

- **Issues**: https://github.com/ai-native/ai-kit/issues
- **Discussions**: https://github.com/ai-native/ai-kit/discussions
- **Discord**: https://discord.gg/ai-kit
- **Email**: support@ai-native.dev

## Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Ora](https://github.com/sindresorhus/ora) - Elegant spinners
- [Listr2](https://github.com/listr2/listr2) - Task lists

Special thanks to all [contributors](https://github.com/ai-native/ai-kit/graphs/contributors)!

---

**Made with ❤️ by the AI Native team**
