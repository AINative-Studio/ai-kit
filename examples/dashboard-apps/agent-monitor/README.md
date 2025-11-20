# Agent Monitoring Dashboard

Production-ready dashboard for monitoring AI agent execution, performance, and debugging built with React 18, TypeScript, and Vite.

## Features

### Real-time Agent Monitoring
- Live execution tracking with WebSocket support
- Agent status indicators
- Performance metrics per agent
- Execution timeline visualization

### Performance Analytics
- Success/failure rate tracking
- Average execution time
- Tool usage statistics
- Historical performance data
- Optimization suggestions

### Error Tracking & Debugging
- Comprehensive error logs
- Stack trace viewer
- Error pattern analysis
- Alert configuration

### Execution Logs
- Searchable log viewer
- Filtering by agent, status, time
- Export capabilities
- Real-time log streaming

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: Zustand + TanStack Query
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test
```

## Project Structure

```
agent-monitor/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components
│   │   ├── dashboard/       # Dashboard widgets
│   │   └── ui/              # Reusable components
│   ├── pages/               # Route pages
│   ├── hooks/               # Custom hooks
│   ├── store/               # State management
│   ├── types/               # TypeScript types
│   ├── utils/               # Helper functions
│   └── __tests__/           # Test files
└── public/                  # Static assets
```

## Key Features

### Agent Cards
Display real-time agent status with:
- Current execution state
- Success rate
- Average execution time
- Total executions
- Error count

### Execution Timeline
Line chart showing:
- Executions over time
- Peak usage periods
- Trend analysis

### Tool Usage
Bar chart displaying:
- Most frequently used tools
- Tool performance metrics
- Usage patterns

## API Integration

Expected API endpoints:

```typescript
// GET /api/agents
interface Agent {
  id: string
  name: string
  status: 'running' | 'idle' | 'error' | 'stopped'
  lastExecution: Date
  successRate: number
  avgExecutionTime: number
  totalExecutions: number
  errorCount: number
}

// GET /api/executions
interface AgentExecution {
  id: string
  agentId: string
  status: 'success' | 'failure' | 'running'
  startTime: Date
  endTime?: Date
  duration?: number
  toolsCalled: string[]
  errorMessage?: string
}

// GET /api/tools/usage
interface ToolUsage {
  name: string
  callCount: number
  avgDuration: number
  successRate: number
  lastUsed: Date
}
```

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test -- --watch
```

Test coverage: 35+ tests

## Deployment

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
CMD ["pnpm", "preview"]
```

## License

MIT License
