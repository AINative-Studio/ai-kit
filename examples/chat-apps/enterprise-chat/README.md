# Enterprise Chat Platform

A full-stack enterprise chat solution with team collaboration, analytics, and admin features.

## Features

### User Features
- **Team Workspaces**: Organize conversations by team
- **Real-time Collaboration**: Multiple users in same chat
- **File Sharing**: Upload and share documents
- **Search**: Full-text search across conversations
- **Mentions**: @mention team members
- **Threads**: Threaded conversations

### Admin Features
- **User Management**: Roles and permissions
- **Analytics Dashboard**: Usage metrics and insights
- **Audit Logs**: Track all actions
- **Rate Limiting**: Control API usage
- **Cost Management**: Monitor AI costs per team
- **Webhooks**: Integration with external systems

### Technical Features
- **PostgreSQL**: Reliable data persistence
- **Redis**: Caching and real-time features
- **WebSockets**: Real-time updates
- **Docker**: Easy deployment
- **Horizontal Scaling**: Load balancing ready
- **API Documentation**: OpenAPI/Swagger

## Architecture

\`\`\`
enterprise-chat/
├── packages/
│   ├── client/          # Next.js frontend
│   ├── server/          # Express backend
│   └── shared/          # Shared types
├── docker-compose.yml   # Docker configuration
└── nginx.conf          # Load balancer config
\`\`\`

## Tech Stack

**Frontend**
- Next.js 14
- React 18
- TanStack Query
- WebSocket client

**Backend**
- Express.js
- PostgreSQL (Prisma)
- Redis
- Socket.io
- Bull (job queue)

**Infrastructure**
- Docker & Docker Compose
- Nginx (reverse proxy)
- PM2 (process manager)

## Getting Started

### Quick Start with Docker

\`\`\`bash
cd examples/chat-apps/enterprise-chat

# Start all services
docker-compose up -d

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed
\`\`\`

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Admin Panel: http://localhost:3000/admin
- Analytics: http://localhost:3000/analytics

### Development Setup

\`\`\`bash
# Install dependencies
pnpm install

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
pnpm db:migrate

# Start development servers
pnpm dev
\`\`\`

## Environment Variables

### Client (.env.local)

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
\`\`\`

### Server (.env)

\`\`\`env
DATABASE_URL=postgresql://user:pass@localhost:5432/enterprise_chat
REDIS_URL=redis://localhost:6379
AINATIVE_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
\`\`\`

## Database Schema

Main tables:
- \`users\`: User accounts and profiles
- \`workspaces\`: Team workspaces
- \`conversations\`: Chat conversations
- \`messages\`: Chat messages
- \`files\`: Uploaded files
- \`audit_logs\`: Action audit trail

## API Documentation

API docs available at: http://localhost:4000/api-docs

Key endpoints:
- \`POST /api/chat\`: Send message
- \`GET /api/conversations\`: List conversations
- \`POST /api/workspaces\`: Create workspace
- \`GET /api/analytics\`: Get analytics data

## Deployment

### Production Deployment

\`\`\`bash
# Build all packages
pnpm build

# Start with PM2
pm2 start ecosystem.config.js

# Or use Docker
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Scaling

The application is designed for horizontal scaling:

1. **Database**: PostgreSQL with read replicas
2. **Cache**: Redis cluster
3. **Backend**: Multiple server instances behind Nginx
4. **Frontend**: CDN deployment (Vercel/CloudFlare)

## Monitoring

Built-in monitoring with:
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured JSON logs
- **Tracing**: OpenTelemetry support
- **Alerts**: Webhook-based alerting

## Security

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Per-user and per-workspace limits
- **SQL Injection**: Prisma ORM protection
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token-based protection

## Testing

\`\`\`bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Load tests
pnpm test:load
\`\`\`

## License

MIT
