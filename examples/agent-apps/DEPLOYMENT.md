# Deployment Guide

Comprehensive guide for deploying AI Kit agent applications to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Vercel Deployment](#vercel-deployment)
4. [Railway Deployment](#railway-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Performance Optimization](#performance-optimization)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- Node.js 18+ and pnpm 8+
- API keys (Anthropic, GitHub, ZeroDB, etc.)
- Domain name (optional but recommended)
- SSL certificate (for custom domains)

### Recommended
- Docker Desktop (for Docker deployments)
- Vercel/Railway CLI (for platform deployments)
- PostgreSQL database (for production data)
- Redis cache (for session storage)

---

## Docker Deployment

### Single Application

**1. Create Dockerfile** (example for research-assistant):

```dockerfile
# research-assistant/Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "server.js"]
```

**2. Build and run:**

```bash
# Build
docker build -t research-assistant .

# Run
docker run -d \
  --name research-assistant \
  -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_key \
  research-assistant
```

### Multiple Applications (Docker Compose)

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  # Research Assistant
  research-assistant:
    build: ./research-assistant
    ports:
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - agent-network

  # Code Reviewer
  code-reviewer:
    build: ./code-reviewer
    ports:
      - "3002:3002"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - agent-network

  # Support Agent
  support-agent:
    build: ./support-agent
    ports:
      - "3003:3003"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ZERODB_API_KEY=${ZERODB_API_KEY}
      - ZERODB_PROJECT_ID=${ZERODB_PROJECT_ID}
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - agent-network

  # Data Analyst
  data-analyst:
    build: ./data-analyst
    ports:
      - "3004:3004"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - agent-network

  # Content Swarm
  content-swarm:
    build: ./content-swarm
    ports:
      - "3005:3005"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - agent-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=agent_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=agent_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - agent-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - agent-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - research-assistant
      - code-reviewer
      - support-agent
      - data-analyst
      - content-swarm
    restart: unless-stopped
    networks:
      - agent-network

networks:
  agent-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

**Deploy:**

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## Vercel Deployment

### Single Application

**1. Install Vercel CLI:**

```bash
npm install -g vercel
```

**2. Login and deploy:**

```bash
cd research-assistant
vercel login
vercel --prod
```

**3. Configure environment variables in Vercel dashboard:**

```
ANTHROPIC_API_KEY=your_key
NODE_ENV=production
```

### Monorepo Deployment

**vercel.json:**

```json
{
  "builds": [
    {
      "src": "research-assistant/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "code-reviewer/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/research/(.*)",
      "dest": "research-assistant/$1"
    },
    {
      "src": "/code-review/(.*)",
      "dest": "code-reviewer/$1"
    }
  ]
}
```

---

## Railway Deployment

### CLI Deployment

**1. Install Railway CLI:**

```bash
npm install -g @railway/cli
```

**2. Login and initialize:**

```bash
railway login
cd research-assistant
railway init
```

**3. Add environment variables:**

```bash
railway variables set ANTHROPIC_API_KEY=your_key
railway variables set NODE_ENV=production
```

**4. Deploy:**

```bash
railway up
```

### Dashboard Deployment

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose repository and branch
5. Configure environment variables
6. Click "Deploy"

---

## AWS Deployment

### ECS (Elastic Container Service)

**1. Push Docker image to ECR:**

```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t research-assistant .
docker tag research-assistant:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/research-assistant:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/research-assistant:latest
```

**2. Create ECS task definition:**

```json
{
  "family": "research-assistant",
  "containerDefinitions": [
    {
      "name": "research-assistant",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/research-assistant:latest",
      "memory": 512,
      "cpu": 256,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:..."
        }
      ]
    }
  ]
}
```

**3. Create ECS service:**

```bash
aws ecs create-service \
  --cluster agent-cluster \
  --service-name research-assistant \
  --task-definition research-assistant \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={...}"
```

---

## Environment Configuration

### Production Environment Variables

```env
# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# AI Services
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# External Services
GITHUB_TOKEN=your_github_token
ZERODB_API_KEY=your_zerodb_key
ZERODB_PROJECT_ID=your_project_id
SEARCH_API_URL=your_search_api

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
ALLOWED_ORIGINS=https://yourdomain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_key
```

### Secrets Management

**AWS Secrets Manager:**

```bash
# Store secret
aws secretsmanager create-secret \
  --name anthropic-api-key \
  --secret-string "your_key"

# Retrieve in application
const apiKey = await secretsManager.getSecretValue({
  SecretId: 'anthropic-api-key'
});
```

**HashiCorp Vault:**

```typescript
import { Vault } from 'node-vault';

const vault = Vault({
  endpoint: 'https://vault.example.com',
  token: process.env.VAULT_TOKEN,
});

const secret = await vault.read('secret/data/anthropic-api-key');
const apiKey = secret.data.data.key;
```

---

## Monitoring & Logging

### Application Monitoring

**Sentry Integration:**

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**DataDog APM:**

```typescript
// datadog.config.ts
import tracer from 'dd-trace';

tracer.init({
  service: 'research-assistant',
  env: process.env.NODE_ENV,
  logInjection: true,
});
```

### Logging

**Structured Logging:**

```typescript
import { createLogger } from '@examples/shared';

const logger = createLogger('production');

logger.info('Request received', {
  method: 'POST',
  path: '/api/research',
  userId: 'user123',
});
```

### Health Checks

```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    anthropic: await checkAnthropicAPI(),
  };

  const healthy = Object.values(checks).every(Boolean);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
}
```

---

## Performance Optimization

### Caching Strategy

```typescript
// Redis caching
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

async function getCached(key: string) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  return null;
}

async function setCache(key: string, value: any, ttl = 3600) {
  await redis.setEx(key, ttl, JSON.stringify(value));
}
```

### Rate Limiting

```typescript
// Rate limiter middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);
```

### CDN Configuration

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.example.com'],
    loader: 'cloudinary',
  },
  assetPrefix: process.env.CDN_URL,
};
```

---

## Security

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://app:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Security Headers

```typescript
// middleware.ts
export function middleware(request: Request) {
  const headers = new Headers(request.headers);

  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Strict-Transport-Security', 'max-age=31536000');

  return NextResponse.next({ headers });
}
```

---

## Troubleshooting

### Common Issues

**Memory Leaks:**
```bash
# Monitor memory usage
docker stats

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

**Connection Timeouts:**
```typescript
// Increase timeout
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000), // 30 seconds
});
```

**Database Connection Pool:**
```typescript
// Configure pool size
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] API keys secured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring enabled
- [ ] Error tracking setup
- [ ] Backup strategy in place

### Post-Deployment
- [ ] Health checks passing
- [ ] Logs streaming correctly
- [ ] Metrics being collected
- [ ] Alerts configured
- [ ] Performance acceptable
- [ ] Security scan completed
- [ ] Load testing done
- [ ] Documentation updated

---

**For support, contact: support@ainative.studio**
