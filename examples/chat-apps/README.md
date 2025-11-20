# AI Kit Chat Applications

Production-ready example chat applications demonstrating different use cases, frameworks, and implementation patterns for the AI Kit framework.

## Overview

This directory contains 5 complete chat applications, each showcasing different capabilities:

1. **Next.js AI Chatbot** - Production-ready with authentication and cost tracking
2. **React Tools Chat** - Integrated tools (calculator, weather, web search)
3. **Vue Chat Assistant** - Multi-agent support with voice input
4. **Svelte Minimalist Chat** - Clean, accessible, high-performance
5. **Enterprise Chat** - Full-stack with team collaboration and analytics

## Quick Comparison

| Application | Framework | Key Features | Complexity | Use Case |
|-------------|-----------|--------------|------------|----------|
| **Next.js Chatbot** | Next.js 14 | Auth, SSR, Streaming, Cost tracking | ⭐⭐⭐ | Production SaaS |
| **React Tools Chat** | React + Vite | Tools integration, Export, Markdown | ⭐⭐ | Tool-enhanced chat |
| **Vue Assistant** | Nuxt 3 | Multi-agent, Voice input, SSR | ⭐⭐⭐ | Voice-enabled assistant |
| **Svelte Minimal** | SvelteKit | Minimal UI, Keyboard shortcuts | ⭐ | Simple, fast chat |
| **Enterprise Chat** | Next.js + Express | Teams, Analytics, Admin panel | ⭐⭐⭐⭐ | Enterprise platform |

## Features by Application

### 1. Next.js AI Chatbot

**Perfect for:** SaaS products, authenticated chat applications

**Features:**
- NextAuth.js authentication (GitHub, credentials)
- Server-side streaming with SSE
- Message persistence with database
- Multiple conversation management
- Real-time cost tracking per message
- Dark mode with system preference
- Mobile-first responsive design
- WCAG 2.1 AA compliant

**Tech Stack:** Next.js 14, NextAuth, Zustand, Tailwind CSS

[View Documentation →](./nextjs-chatbot/README.md)

### 2. React Tools Chat

**Perfect for:** Assistant applications, productivity tools

**Features:**
- **Calculator Tool**: Mathematical operations
- **Weather Tool**: Real-time weather data
- **Web Search Tool**: Internet search results
- Real-time tool execution display
- Markdown rendering with code highlighting
- Export conversations as markdown
- Local storage persistence
- Tool status indicators

**Tech Stack:** React 18, Vite, Zustand, Tailwind CSS

[View Documentation →](./react-tools-chat/README.md)

### 3. Vue Chat Assistant

**Perfect for:** Multi-purpose assistants, voice-enabled apps

**Features:**
- Multiple AI agents (General, Technical, Creative)
- Voice input with speech recognition
- Typing indicators
- Message reactions (emoji)
- Theme customization
- SSR with Nuxt 3
- Agent switching mid-conversation
- Vue 3 Composition API

**Tech Stack:** Nuxt 3, Vue 3, Pinia, @vueuse

[View Documentation →](./vue-assistant/README.md)

### 4. Svelte Minimalist Chat

**Perfect for:** Fast, simple chat interfaces

**Features:**
- Ultra-lightweight (< 50KB bundle)
- Full keyboard navigation
- Accessibility-first design
- Streaming responses
- Clean, minimal UI
- No external UI frameworks
- WCAG 2.1 AAA compliant
- Sub-second load times

**Tech Stack:** SvelteKit, Vanilla CSS

[View Documentation →](./svelte-minimal/README.md)

### 5. Enterprise Chat Platform

**Perfect for:** Team collaboration, enterprise deployments

**Features:**
- **User Management**: Roles, permissions, teams
- **Workspaces**: Team-based organization
- **Real-time Collaboration**: Multiple users per chat
- **Analytics Dashboard**: Usage metrics, costs
- **Admin Panel**: User management, audit logs
- **File Sharing**: Document uploads
- **PostgreSQL**: Persistent storage
- **Redis**: Caching and real-time features
- **Docker Compose**: Easy deployment
- **API Documentation**: OpenAPI/Swagger

**Tech Stack:** Next.js, Express, PostgreSQL, Redis, Docker

[View Documentation →](./enterprise-chat/README.md)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- AINative API key ([Get one here](https://ainative.ai))
- Docker (optional, for enterprise chat)

### Quick Start

Choose an application and run:

\`\`\`bash
# Navigate to the app
cd <app-directory>

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
pnpm dev
\`\`\`

### Installation by Application

#### Next.js Chatbot
\`\`\`bash
cd nextjs-chatbot
pnpm install
cp .env.example .env.local
pnpm dev
# Open http://localhost:3000
\`\`\`

#### React Tools Chat
\`\`\`bash
cd react-tools-chat
pnpm install
cp .env.example .env.local
pnpm dev
# Open http://localhost:5173
\`\`\`

#### Vue Assistant
\`\`\`bash
cd vue-assistant
pnpm install
cp .env.example .env.local
pnpm dev
# Open http://localhost:3000
\`\`\`

#### Svelte Minimal
\`\`\`bash
cd svelte-minimal
pnpm install
cp .env.example .env.local
pnpm dev
# Open http://localhost:5173
\`\`\`

#### Enterprise Chat
\`\`\`bash
cd enterprise-chat
docker-compose up -d  # Start services
pnpm install
pnpm db:migrate       # Run migrations
pnpm dev             # Start dev servers
# Open http://localhost:3000
\`\`\`

## Testing

Each application includes comprehensive tests:

### Run All Tests

\`\`\`bash
# From examples/chat-apps/
pnpm test

# Or test individual apps
cd nextjs-chatbot && pnpm test
cd react-tools-chat && pnpm test
\`\`\`

### Test Coverage

Minimum test coverage per application:
- **Next.js Chatbot**: 25+ tests
- **React Tools Chat**: 20+ tests
- **Vue Assistant**: 20+ tests
- **Svelte Minimal**: 15+ tests
- **Enterprise Chat**: 30+ tests

**Total: 110+ tests across all applications**

### Test Categories

1. **Component Tests**: UI component behavior
2. **Integration Tests**: Feature workflows
3. **E2E Tests**: Complete user journeys
4. **API Tests**: Backend endpoints (Enterprise)
5. **Tool Tests**: Tool execution (React Tools)

## Deployment Guides

### Vercel (Next.js, Svelte)

\`\`\`bash
vercel
\`\`\`

### Netlify (React, Vue)

\`\`\`bash
netlify deploy --prod
\`\`\`

### Docker (All Applications)

Each app includes a \`Dockerfile\`:

\`\`\`bash
docker build -t my-chat-app .
docker run -p 3000:3000 my-chat-app
\`\`\`

### Railway (Enterprise Chat)

\`\`\`bash
railway up
\`\`\`

See individual app READMEs for detailed deployment instructions.

## Architecture Patterns

### Client-Side Architecture

All applications follow these patterns:

1. **State Management**
   - Next.js: Zustand with persistence
   - React: Zustand
   - Vue: Pinia
   - Svelte: Svelte stores

2. **API Communication**
   - SSE for streaming responses
   - REST for CRUD operations
   - WebSockets for real-time (Enterprise)

3. **UI Patterns**
   - Component composition
   - Responsive design
   - Accessibility-first
   - Dark mode support

### Server-Side Architecture (Where Applicable)

1. **Next.js App Router**: Server components and actions
2. **Express Backend**: RESTful API (Enterprise)
3. **Database**: PostgreSQL with Prisma (Enterprise)
4. **Caching**: Redis for performance (Enterprise)

## Environment Variables

Common variables across apps:

| Variable | Description | Required |
|----------|-------------|----------|
| \`AINATIVE_API_KEY\` | Your AI Kit API key | Yes |
| \`NEXT_PUBLIC_APP_URL\` | Application URL | Yes (Next.js) |
| \`DATABASE_URL\` | PostgreSQL connection | Yes (Enterprise) |
| \`REDIS_URL\` | Redis connection | Yes (Enterprise) |

See individual app \`.env.example\` files for complete lists.

## Performance Benchmarks

| Application | Bundle Size | FCP | TTI | Lighthouse |
|-------------|-------------|-----|-----|------------|
| Next.js Chatbot | ~120KB | 0.9s | 1.8s | 95+ |
| React Tools Chat | ~180KB | 1.0s | 2.0s | 94+ |
| Vue Assistant | ~100KB | 0.8s | 1.6s | 96+ |
| Svelte Minimal | ~45KB | 0.6s | 1.2s | 100 |
| Enterprise Chat (Client) | ~150KB | 1.1s | 2.2s | 93+ |

*Measured on desktop with 4G throttling*

## Browser Support

All applications support:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

All applications meet or exceed:
- WCAG 2.1 AA compliance (AAA for Svelte Minimal)
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast requirements
- Reduced motion support

## Common Issues

### API Key Not Working

Ensure your API key is properly set:
\`\`\`bash
AINATIVE_API_KEY=ak_your_key_here
\`\`\`

### Port Already in Use

Change the port in package.json scripts:
\`\`\`bash
next dev -p 3001
# or
vite --port 5174
\`\`\`

### Database Connection Issues (Enterprise)

Ensure PostgreSQL is running:
\`\`\`bash
docker-compose up -d postgres
\`\`\`

## Contributing

We welcome contributions! See our [Contributing Guide](../../CONTRIBUTING.md).

### Adding a New Example

1. Create directory in \`examples/chat-apps/\`
2. Follow established patterns
3. Include comprehensive tests
4. Add README with setup instructions
5. Update this README

## Code Quality

All applications include:
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vitest**: Fast unit testing
- **Playwright**: E2E testing

## CI/CD

Each application includes:
- GitHub Actions workflow
- Automated testing
- Type checking
- Linting
- Build verification

Example workflow: \`.github/workflows/test.yml\`

## License

MIT - See [LICENSE](../../LICENSE)

## Support

- **Documentation**: [https://docs.ainative.ai](https://docs.ainative.ai)
- **Discord**: [Join our community](https://discord.gg/ainative)
- **Issues**: [GitHub Issues](https://github.com/ainative/ai-kit/issues)
- **Twitter**: [@ainativeai](https://twitter.com/ainativeai)

## Acknowledgments

Built with love by the AINative team. Powered by AI Kit.

## What to Build Next?

These examples cover common use cases, but you can extend them:

- **Mobile Apps**: React Native or Flutter integrations
- **Desktop Apps**: Electron or Tauri wrappers
- **Browser Extensions**: Chrome/Firefox extensions
- **Slack/Discord Bots**: Messaging platform integrations
- **Voice-Only**: Alexa/Google Assistant skills
- **Embedded Chat**: Widget for websites

Check our [cookbook](https://docs.ainative.ai/cookbook) for more ideas!

---

**Ready to build?** Choose an application above and start developing! 🚀
