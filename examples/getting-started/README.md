# AI Kit Getting Started Examples

This directory contains complete, runnable examples demonstrating AI Kit's core features and capabilities.

## Examples Overview

### 1. Basic Chat
**Path:** `basic-chat/`
**Difficulty:** Beginner
**Time:** 5 minutes

A minimal chat interface showing the fundamentals of AI Kit:
- Using `useAIStream` hook
- Displaying streaming responses
- Basic error handling

**Key Files:**
- `src/App.tsx` - Main chat component
- `README.md` - Setup instructions

**What You'll Learn:**
- How to set up a basic AI chat
- Streaming message handling
- Usage tracking

---

### 2. Tool Usage
**Path:** `tool-usage/`
**Difficulty:** Intermediate
**Time:** 10 minutes

Demonstrates creating and using custom tools with agents:
- Defining tool schemas
- Implementing tool logic
- Agent orchestration

**Key Files:**
- `index.ts` - Agent with weather and calculator tools
- `README.md` - Tool creation guide

**What You'll Learn:**
- How to create custom tools
- Tool parameter validation
- Multi-step agent reasoning

---

### 3. Agent Example
**Path:** `agent-example/`
**Difficulty:** Advanced
**Time:** 15 minutes

Shows advanced agent patterns:
- Multiple specialized agents
- Agent swarm coordination
- Streaming execution

**Key Files:**
- `index.ts` - Multi-agent system
- `README.md` - Architecture explanation

**What You'll Learn:**
- Agent specialization
- Swarm coordination
- Streaming agent responses

---

### 4. Next.js Starter
**Path:** `nextjs-starter/`
**Difficulty:** Beginner
**Time:** 5 minutes

Complete Next.js 14 application with AI Kit:
- App Router integration
- API routes with streaming
- Production-ready setup

**Key Files:**
- `app/page.tsx` - Chat interface
- `app/api/chat/route.ts` - Streaming API
- `README.md` - Deployment guide

**What You'll Learn:**
- Next.js integration
- Server-side streaming
- Deployment to Vercel

---

### 5. React Starter
**Path:** `react-starter/`
**Difficulty:** Beginner
**Time:** 5 minutes

React + Vite template with AI Kit:
- Modern React setup
- Express backend
- Development workflow

**Key Files:**
- `src/App.tsx` - Chat component
- `server/index.ts` - Express server
- `README.md` - Setup guide

**What You'll Learn:**
- React integration
- Backend setup
- Development best practices

---

## Quick Start

Choose an example and follow its README:

```bash
# Example: Basic Chat
cd basic-chat
npm install
npm run dev
```

## Prerequisites

All examples require:
- Node.js 18+
- npm or yarn
- An Anthropic API key

Get your API key at: https://console.anthropic.com/

## Running Examples

### 1. Clone the repository
```bash
git clone https://github.com/AINative-Studio/ai-kit.git
cd ai-kit/examples/getting-started
```

### 2. Choose an example
```bash
cd basic-chat  # or tool-usage, agent-example, etc.
```

### 3. Install dependencies
```bash
npm install
```

### 4. Set up environment
```bash
cp .env.example .env
# Edit .env and add your API keys
```

### 5. Run the example
```bash
npm run dev  # or npm start
```

## Environment Variables

All examples use these environment variables:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
OPENAI_API_KEY=sk-...
LOG_LEVEL=info
```

## Example Progression

We recommend exploring the examples in this order:

1. **Basic Chat** - Learn the fundamentals
2. **Next.js Starter** or **React Starter** - Framework integration
3. **Tool Usage** - Add custom capabilities
4. **Agent Example** - Advanced orchestration

## Common Issues

### Port already in use
```bash
# Change port in package.json or .env
PORT=3001 npm run dev
```

### API key not found
```bash
# Make sure .env file exists and is in the correct directory
cat .env
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

After completing these examples:

1. Read the [Getting Started Guide](../../docs/guides/getting-started.md)
2. Follow the [First Chatbot Tutorial](../../docs/guides/first-chatbot.md)
3. Learn about [Custom Tools](../../docs/guides/custom-tools.md)
4. Prepare for [Production Deployment](../../docs/guides/production-deployment.md)

## Contributing

Found an issue or want to add an example?

1. Open an issue describing the problem or suggestion
2. Submit a pull request with your changes
3. Follow our [Contributing Guidelines](../../CONTRIBUTING.md)

## Support

- Documentation: https://docs.ainative.studio
- Discord: https://discord.com/invite/paipalooza
- Email: support@ainative.studio
- GitHub Issues: https://github.com/AINative-Studio/ai-kit/issues

## License

MIT © AINative Studio
