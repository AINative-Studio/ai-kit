# AI Kit Examples

Complete, production-ready examples demonstrating AI Kit's capabilities across different frameworks, use cases, and complexity levels.

## Overview

This directory contains **30+ examples** organized into 6 categories:

| Category | Examples | Complexity | Description |
|----------|----------|------------|-------------|
| [Getting Started](#getting-started) | 5 | Beginner | Learn the basics in 5-15 minutes |
| [Chat Apps](#chat-applications) | 5 | Beginner-Advanced | Full-featured chat interfaces |
| [Agent Apps](#agent-applications) | 5 | Advanced | Multi-agent systems & workflows |
| [Dashboard Apps](#dashboard-applications) | 3 | Intermediate | Analytics & monitoring dashboards |
| [CDN Examples](#cdn-examples) | 3 | Beginner | No-build browser usage |
| [Demo App](#demo-app) | 1 | Intermediate | Interactive feature showcase |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Run an Example

```bash
# 1. Navigate to any example directory
cd examples/getting-started/basic-chat

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API key

# 4. Run the example
npm run dev
```

## Examples by Category

### Getting Started

Perfect for learning AI Kit fundamentals. Start here!

| Example | Time | Framework | Description |
|---------|------|-----------|-------------|
| [Basic Chat](./getting-started/basic-chat/) | 5 min | React + Vite | Minimal chat with streaming |
| [Tool Usage](./getting-started/tool-usage/) | 10 min | Node.js | Custom tools & agents |
| [Agent Example](./getting-started/agent-example/) | 15 min | Node.js | Multi-agent coordination |
| [Next.js Starter](./getting-started/nextjs-starter/) | 5 min | Next.js 14 | App Router integration |
| [React Starter](./getting-started/react-starter/) | 5 min | React + Express | Full-stack setup |

**Start with**: Basic Chat → Next.js/React Starter → Tool Usage → Agent Example

[View Getting Started README](./getting-started/README.md)

---

### Chat Applications

Production-ready chat interfaces showcasing different frameworks and features.

| Application | Framework | Port | Key Features |
|-------------|-----------|------|--------------|
| [Next.js Chatbot](./chat-apps/nextjs-chatbot/) | Next.js 14 | 3000 | Auth, SSR, Cost tracking |
| [React Tools Chat](./chat-apps/react-tools-chat/) | React + Vite | 5173 | Calculator, Weather, Search |
| [Vue Assistant](./chat-apps/vue-assistant/) | Nuxt 3 | 3000 | Multi-agent, Voice input |
| [Svelte Minimal](./chat-apps/svelte-minimal/) | SvelteKit | 5173 | Lightweight (45KB) |
| [Enterprise Chat](./chat-apps/enterprise-chat/) | Next.js + Express | 3000 | Teams, Analytics, Admin |

**110+ tests** • WCAG 2.1 AA Compliant • Mobile Responsive

[View Chat Apps README](./chat-apps/README.md)

---

### Agent Applications

Advanced agent systems demonstrating complex workflows and multi-agent coordination.

| Application | Port | Use Case | Agents |
|-------------|------|----------|--------|
| [Research Assistant](./agent-apps/research-assistant/) | 3001 | Academic research | 1 with tools |
| [Code Reviewer](./agent-apps/code-reviewer/) | 3002 | PR reviews | 1 with 4 tools |
| [Support Agent](./agent-apps/support-agent/) | 3003 | Customer support | Router + 4 specialists |
| [Data Analyst](./agent-apps/data-analyst/) | 3004 | Data analysis | 1 with SQL/viz tools |
| [Content Swarm](./agent-apps/content-swarm/) | 3005 | Content creation | 6 specialized agents |

**125+ tests** • Docker Ready • Production Patterns

[View Agent Apps README](./agent-apps/README.md)

---

### Dashboard Applications

Monitoring, analytics, and management dashboards for AI applications.

| Dashboard | Framework | Purpose | Features |
|-----------|-----------|---------|----------|
| [Usage Analytics](./dashboard-apps/usage-analytics/) | Next.js 14 | Metrics & costs | Real-time, Charts, Exports |
| [Agent Monitor](./dashboard-apps/agent-monitor/) | React + Vite | Agent tracking | Live execution, Logs |
| [Admin Panel](./dashboard-apps/admin-panel/) | Next.js 14 | User management | RBAC, API keys, Audit logs |

**100+ tests** • WebSocket Updates • Dark Mode

[View Dashboard Apps README](./dashboard-apps/README.md)

---

### CDN Examples

Use AI Kit directly in the browser without build tools.

| Example | Framework | Size | Description |
|---------|-----------|------|-------------|
| [Vanilla JS](./cdn/vanilla.html) | None | - | Pure JavaScript |
| [React](./cdn/react.html) | React | - | React from CDN |
| [Vue](./cdn/vue.html) | Vue 3 | - | Vue from CDN |

**No build tools** • Instant setup • Perfect for prototyping

[View CDN Examples README](./cdn/README.md)

---

### Demo App

Interactive demonstration of AI Kit features with live code examples.

[Demo App](./demo-app/) - React + Vite demo showcasing streaming, tools, and agents.

[View Demo App README](./demo-app/README.md)

---

## Examples by Framework

### Next.js
- [Next.js Starter](./getting-started/nextjs-starter/)
- [Next.js Chatbot](./chat-apps/nextjs-chatbot/)
- [Research Assistant](./agent-apps/research-assistant/)
- [Enterprise Chat](./chat-apps/enterprise-chat/)
- [Usage Analytics](./dashboard-apps/usage-analytics/)
- [Admin Panel](./dashboard-apps/admin-panel/)

### React
- [Basic Chat](./getting-started/basic-chat/)
- [React Starter](./getting-started/react-starter/)
- [React Tools Chat](./chat-apps/react-tools-chat/)
- [Agent Monitor](./dashboard-apps/agent-monitor/)
- [Demo App](./demo-app/)

### Vue
- [Vue Assistant](./chat-apps/vue-assistant/)
- [Vue CDN Example](./cdn/vue.html)

### Svelte
- [Svelte Minimal](./chat-apps/svelte-minimal/)

### Node.js / TypeScript
- [Tool Usage](./getting-started/tool-usage/)
- [Agent Example](./getting-started/agent-example/)
- [Code Reviewer](./agent-apps/code-reviewer/)
- [Data Analyst](./agent-apps/data-analyst/)
- [Support Agent](./agent-apps/support-agent/)
- [Content Swarm](./agent-apps/content-swarm/)

### Vanilla JS
- [Vanilla CDN Example](./cdn/vanilla.html)

## Examples by Use Case

### Learning & Getting Started
1. [Basic Chat](./getting-started/basic-chat/) - Learn fundamentals
2. [Next.js Starter](./getting-started/nextjs-starter/) - Framework integration
3. [Tool Usage](./getting-started/tool-usage/) - Custom tools
4. [Agent Example](./getting-started/agent-example/) - Multi-agent systems

### Building Chat Interfaces
- [Next.js Chatbot](./chat-apps/nextjs-chatbot/) - Production SaaS
- [React Tools Chat](./chat-apps/react-tools-chat/) - Tool integration
- [Vue Assistant](./chat-apps/vue-assistant/) - Voice-enabled
- [Svelte Minimal](./chat-apps/svelte-minimal/) - Ultra-lightweight
- [Enterprise Chat](./chat-apps/enterprise-chat/) - Team collaboration

### AI Agents & Automation
- [Research Assistant](./agent-apps/research-assistant/) - Research workflows
- [Code Reviewer](./agent-apps/code-reviewer/) - Automated code review
- [Support Agent](./agent-apps/support-agent/) - Customer support
- [Data Analyst](./agent-apps/data-analyst/) - Data analysis
- [Content Swarm](./agent-apps/content-swarm/) - Content generation

### Monitoring & Analytics
- [Usage Analytics](./dashboard-apps/usage-analytics/) - Usage metrics
- [Agent Monitor](./dashboard-apps/agent-monitor/) - Agent performance
- [Admin Panel](./dashboard-apps/admin-panel/) - System management

### Prototyping & Testing
- [CDN Examples](./cdn/) - No-build browser usage
- [Demo App](./demo-app/) - Feature showcase

## Installation Guide

### Global Installation

Install dependencies for all examples:

```bash
# From the examples directory
cd examples

# Install all agent apps
cd agent-apps
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    cd "$dir" && npm install && cd ..
  fi
done
cd ..

# Install all chat apps
cd chat-apps
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    cd "$dir" && npm install && cd ..
  fi
done
cd ..

# Install all dashboard apps
cd dashboard-apps
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    cd "$dir" && npm install && cd ..
  fi
done
```

### Individual Installation

Install dependencies for a specific example:

```bash
cd examples/chat-apps/nextjs-chatbot
npm install
```

## Environment Setup

### Required Environment Variables

All examples require an Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Example-Specific Variables

Some examples require additional environment variables:

**Enterprise Chat:**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=your-secret
```

**Code Reviewer:**
```bash
GITHUB_TOKEN=ghp_your-token
```

**Support Agent:**
```bash
ZERODB_API_KEY=your-key
ZERODB_PROJECT_ID=your-project
```

**Research Assistant:**
```bash
SEARCH_API_URL=your-search-api
```

See individual example `.env.example` files for complete details.

## Running Examples

### Development Mode

```bash
cd examples/[category]/[example-name]
npm run dev
```

Common ports:
- Next.js apps: 3000-3005
- Vite apps: 5173-5174
- Express servers: 3001-3010

### Production Build

```bash
npm run build
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Deployment

### Vercel (Next.js examples)

```bash
cd examples/chat-apps/nextjs-chatbot
vercel deploy --prod
```

### Netlify (Vite examples)

```bash
cd examples/dashboard-apps/agent-monitor
netlify deploy --prod
```

### Docker (Any example)

```bash
cd examples/agent-apps/research-assistant
docker build -t research-assistant .
docker run -p 3001:3001 research-assistant
```

### Railway

```bash
cd examples/chat-apps/enterprise-chat
railway init
railway up
```

## Testing Examples

### Test Coverage

Total: **335+ tests** across all examples

| Category | Tests | Coverage |
|----------|-------|----------|
| Getting Started | 20+ | Unit |
| Chat Apps | 110+ | Unit + Integration |
| Agent Apps | 125+ | Unit + Integration + E2E |
| Dashboard Apps | 100+ | Unit + Integration |

### Running All Tests

```bash
# From examples directory
find . -name "package.json" -type f -execdir npm test \;
```

## Common Issues

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port
PORT=3001 npm run dev
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API Key Not Working

```bash
# Check .env file exists
ls -la .env

# Check API key format
cat .env | grep ANTHROPIC_API_KEY
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next dist node_modules
npm install
npm run build
```

## Performance Benchmarks

### Bundle Sizes

| Example | Bundle Size | FCP | TTI | Lighthouse |
|---------|-------------|-----|-----|------------|
| Svelte Minimal | 45KB | 0.6s | 1.2s | 100 |
| Vue Assistant | 100KB | 0.8s | 1.6s | 96+ |
| Next.js Chatbot | 120KB | 0.9s | 1.8s | 95+ |
| React Tools Chat | 180KB | 1.0s | 2.0s | 94+ |

### Load Times

All examples achieve:
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1

## Browser Support

All examples support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

All examples meet or exceed:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast requirements
- Reduced motion support

## Technology Stack

### Frontend Frameworks
- Next.js 14 (App Router)
- React 18
- Vue 3 / Nuxt 3
- Svelte / SvelteKit

### State Management
- Zustand
- Pinia (Vue)
- React Query (TanStack Query)
- Svelte Stores

### Styling
- Tailwind CSS
- CSS Modules
- Vanilla CSS

### Testing
- Vitest
- Testing Library
- Playwright (E2E)

### Development Tools
- TypeScript
- ESLint
- Prettier
- pnpm / npm

## Contributing

We welcome contributions! To add a new example:

1. **Choose a Category**: getting-started, chat-apps, agent-apps, dashboard-apps
2. **Follow Patterns**: Match existing example structure
3. **Include Tests**: Minimum 80% coverage
4. **Write Documentation**: README.md with setup instructions
5. **Update This File**: Add your example to the lists above

See our [Contributing Guide](../CONTRIBUTING.md) for details.

## Support

- **Documentation**: [https://docs.ainative.ai](https://docs.ainative.ai)
- **Discord**: [Join our community](https://discord.com/invite/paipalooza)
- **GitHub Issues**: [Report bugs](https://github.com/ainative/ai-kit/issues)
- **Email**: support@ainative.studio

## License

MIT - See [LICENSE](../LICENSE)

## Next Steps

After exploring these examples:

1. Read the [Getting Started Guide](../docs/guides/getting-started.md)
2. Check the [API Reference](../docs/api/README.md)
3. Join our [Discord Community](https://discord.com/invite/paipalooza)
4. Build your own application!

## Changelog

### 2024-02-08
- Added comprehensive examples README
- Organized examples by category and use case
- Improved documentation across all examples

### 2024-02-07
- Added CDN examples for browser usage
- Enhanced agent applications with more tests
- Updated dashboard apps with real-time features

### 2024-01-15
- Initial examples release
- 30+ examples across 6 categories
- 335+ tests with high coverage

---

**Ready to start building?** Pick an example above and dive in!
