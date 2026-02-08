# Production Deployment Guide for AI Kit Applications

This comprehensive guide covers everything you need to deploy AI Kit applications to production safely, securely, and at scale.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Performance Optimization](#performance-optimization)
3. [Security Considerations](#security-considerations)
4. [Monitoring and Observability](#monitoring-and-observability)
5. [Deployment Platforms](#deployment-platforms)
6. [Scaling Strategies](#scaling-strategies)
7. [Disaster Recovery](#disaster-recovery)
8. [Cost Optimization](#cost-optimization)

---

## Pre-Deployment Checklist

### Environment Configuration

- [ ] All environment variables configured for production
- [ ] API keys stored securely (use secrets management)
- [ ] Database connection strings configured
- [ ] Redis/cache connection configured
- [ ] CORS settings reviewed and restricted
- [ ] Rate limiting enabled
- [ ] Logging level set appropriately (info or warn)
- [ ] Error tracking configured (Sentry, etc.)

```bash
# .env.production

# LLM Providers
ANTHROPIC_API_KEY=sk-ant-***
OPENAI_API_KEY=sk-***

# Database
DATABASE_URL=postgresql://***

# Redis
REDIS_URL=redis://***

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Security
SESSION_SECRET=***
JWT_SECRET=***
CORS_ORIGIN=https://yourdomain.com

# Monitoring
SENTRY_DSN=***
```

### Code Quality

- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] ESLint/Prettier checks pass
- [ ] No console.log statements in production code
- [ ] Dependencies updated to latest stable versions
- [ ] No security vulnerabilities (run `npm audit`)
- [ ] Bundle size optimized
- [ ] Tree shaking configured

```bash
# Run checks
npm run type-check
npm run lint
npm run test
npm audit
```

### Security

- [ ] Authentication implemented
- [ ] Authorization checks in place
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] DDoS protection in place
- [ ] HTTPS enforced
- [ ] Security headers configured

### Performance

- [ ] Database queries optimized
- [ ] Indexes created
- [ ] Caching strategy implemented
- [ ] CDN configured for static assets
- [ ] Image optimization in place
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Response compression enabled

### Monitoring

- [ ] Application monitoring configured
- [ ] Error tracking set up
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up
- [ ] Alerting configured
- [ ] Dashboard created

---

## Performance Optimization

### 1. Response Caching

Implement caching to reduce LLM API calls:

```typescript
// lib/cache.ts
import Redis from 'ioredis'
import { createHash } from 'crypto'

const redis = new Redis(process.env.REDIS_URL)

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Check cache
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  // Fetch and cache
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}

export function cacheKey(params: Record<string, any>): string {
  return createHash('sha256')
    .update(JSON.stringify(params))
    .digest('hex')
}
```

Usage in API route:

```typescript
// app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { messages } = await request.json()

  const key = cacheKey({ messages })

  return getCached(
    `chat:${key}`,
    async () => {
      // Make LLM call
      const response = await anthropic.messages.create({...})
      return response
    },
    600 // 10 minutes
  )
}
```

### 2. Database Optimization

```typescript
// Optimize queries with indexes
await db.schema.table('conversations', (table) => {
  table.index('user_id')
  table.index('created_at')
  table.index(['user_id', 'created_at'])
})

// Use connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Batch operations
const users = await db.batchInsert('users', userData, 100)
```

### 3. Code Splitting

```typescript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 10,
          },
        },
      }
    }
    return config
  },
}
```

### 4. CDN Configuration

```typescript
// next.config.js
module.exports = {
  assetPrefix: process.env.CDN_URL || '',
  images: {
    domains: ['cdn.yourdomain.com'],
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/yourcloud/',
  },
}
```

### 5. Response Compression

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Enable compression
  response.headers.set('Content-Encoding', 'gzip')

  return response
}
```

---

## Security Considerations

### 1. API Key Protection

Never expose API keys to the client:

```typescript
// WRONG - Exposes API key to client
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY, // ❌
})

// CORRECT - API calls only from server
// app/api/chat/route.ts (server-side only)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // ✅
})
```

### 2. Input Validation

```typescript
import { z } from 'zod'

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })),
  conversationId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = chatRequestSchema.parse(body)

    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
  }
}
```

### 3. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
})

// Usage in API route
export async function POST(request: NextRequest) {
  const ip = request.ip ?? 'anonymous'
  const { success, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Continue with request
}
```

### 4. CSRF Protection

```typescript
// middleware.ts
import { csrf } from 'next-csrf'

const { csrfProtection } = csrf({
  secret: process.env.CSRF_SECRET,
})

export function middleware(request: NextRequest) {
  return csrfProtection(request)
}
```

### 5. Security Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

### 6. Content Security Policy

```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.anthropic.com;
  frame-ancestors 'none';
`

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ]
  },
}
```

---

## Monitoring and Observability

### 1. Error Tracking with Sentry

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization
    }
    return event
  },
})

// Usage
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'chat' },
    extra: { userId, conversationId },
  })
}
```

### 2. Application Metrics

```typescript
// lib/metrics.ts
import { Counter, Histogram, Registry } from 'prom-client'

const register = new Registry()

export const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
})

export const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  registers: [register],
})

export const llmCallDuration = new Histogram({
  name: 'llm_call_duration_seconds',
  help: 'LLM API call duration',
  labelNames: ['model', 'provider'],
  registers: [register],
})

export const llmTokensUsed = new Counter({
  name: 'llm_tokens_total',
  help: 'Total LLM tokens used',
  labelNames: ['model', 'type'],
  registers: [register],
})

// Usage in API route
export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    const result = await handleChat(request)

    requestCounter.inc({
      method: 'POST',
      route: '/api/chat',
      status: 200,
    })

    requestDuration.observe(
      { method: 'POST', route: '/api/chat' },
      (Date.now() - start) / 1000
    )

    return result
  } catch (error) {
    requestCounter.inc({
      method: 'POST',
      route: '/api/chat',
      status: 500,
    })
    throw error
  }
}
```

### 3. Structured Logging

```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}

// Usage
logger.info('Chat request received', {
  userId,
  conversationId,
  messageCount: messages.length,
})

logger.error('LLM API error', {
  error: error.message,
  stack: error.stack,
  provider: 'anthropic',
})
```

### 4. Uptime Monitoring

Set up external monitoring with services like:
- [Pingdom](https://www.pingdom.com/)
- [UptimeRobot](https://uptimerobot.com/)
- [Better Uptime](https://betteruptime.com/)

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    await db.raw('SELECT 1')

    // Check Redis
    await redis.ping()

    // Check LLM API (optional)
    // const apiStatus = await checkAnthropicAPI()

    return NextResponse.json({
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        database: 'ok',
        cache: 'ok',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

---

## Deployment Platforms

### Vercel

**Pros:** Easy deployment, automatic previews, built-in CDN
**Best for:** Next.js applications

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add ANTHROPIC_API_KEY production
vercel env add DATABASE_URL production
```

**vercel.json:**

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "DATABASE_URL": "@database-url"
  },
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Railway

**Pros:** Simple setup, good for full-stack apps, built-in database
**Best for:** Apps needing PostgreSQL/Redis

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up

# Add services
railway add postgresql
railway add redis
```

### AWS (EC2 + ECS)

**Pros:** Full control, scalability, enterprise-grade
**Best for:** Large-scale production apps

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### DigitalOcean App Platform

**Pros:** Simple, affordable, managed services
**Best for:** Small to medium apps

```yaml
# .do/app.yaml
name: ai-kit-app

services:
  - name: web
    source_dir: /
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: basic-xs

    envs:
      - key: NODE_ENV
        value: production
      - key: ANTHROPIC_API_KEY
        scope: RUN_TIME
        type: SECRET

databases:
  - name: postgres
    engine: PG
    version: "15"
  - name: redis
    engine: REDIS
    version: "7"
```

---

## Scaling Strategies

### Horizontal Scaling

```typescript
// Load balancer configuration (nginx)
upstream app_servers {
    least_conn;
    server app1:3000 weight=10 max_fails=3 fail_timeout=30s;
    server app2:3000 weight=10 max_fails=3 fail_timeout=30s;
    server app3:3000 weight=10 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Scaling

```typescript
// Read replicas for database
const writeDb = new Pool({
  connectionString: process.env.DATABASE_WRITE_URL,
})

const readDb = new Pool({
  connectionString: process.env.DATABASE_READ_URL,
})

// Use write for mutations
async function createConversation(data) {
  return writeDb.query('INSERT INTO conversations ...', data)
}

// Use read for queries
async function getConversations(userId) {
  return readDb.query('SELECT * FROM conversations WHERE user_id = $1', [userId])
}
```

### Caching Strategy

```typescript
// Multi-layer caching
class CacheService {
  private memory = new Map()
  private redis: Redis

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL)
  }

  async get(key: string) {
    // L1: Memory cache
    if (this.memory.has(key)) {
      return this.memory.get(key)
    }

    // L2: Redis cache
    const cached = await this.redis.get(key)
    if (cached) {
      const data = JSON.parse(cached)
      this.memory.set(key, data)
      return data
    }

    return null
  }

  async set(key: string, value: any, ttl: number = 3600) {
    // Set in both layers
    this.memory.set(key, value)
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }
}
```

### Queue-Based Processing

```typescript
// For long-running tasks
import Bull from 'bull'

const chatQueue = new Bull('chat', process.env.REDIS_URL)

// Add job
export async function queueChatRequest(params) {
  await chatQueue.add(params, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

// Process jobs
chatQueue.process(async (job) => {
  const { messages, userId } = job.data
  const result = await generateResponse(messages)
  await saveResult(userId, result)
  return result
})
```

---

## Disaster Recovery

### Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Retention: Keep 30 days
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

### Application Snapshots

```bash
# Vercel deployment rollback
vercel rollback

# Railway rollback
railway rollback

# Docker tag strategy
docker tag myapp:latest myapp:$(date +%Y%m%d)
docker push myapp:$(date +%Y%m%d)
```

### Incident Response Plan

1. **Detection:** Monitoring alerts trigger
2. **Assessment:** Determine severity and impact
3. **Response:** Execute recovery procedures
4. **Communication:** Notify stakeholders
5. **Resolution:** Fix issue and verify
6. **Post-mortem:** Document and improve

---

## Cost Optimization

### LLM Cost Management

```typescript
// Track and limit costs
class CostManager {
  async checkBudget(userId: string) {
    const usage = await this.getMonthlyUsage(userId)
    const limit = await this.getUserLimit(userId)

    if (usage.cost >= limit) {
      throw new Error('Monthly budget exceeded')
    }

    return {
      remaining: limit - usage.cost,
      percentage: (usage.cost / limit) * 100,
    }
  }

  async optimizeRequest(messages: Message[]) {
    // Remove redundant messages
    const optimized = this.deduplicateMessages(messages)

    // Truncate old messages if needed
    if (this.getTokenCount(optimized) > MAX_TOKENS) {
      return this.truncateMessages(optimized)
    }

    return optimized
  }
}
```

### Caching to Reduce Costs

```typescript
// Cache common queries
const CACHE_TTL = {
  staticContent: 86400,      // 24 hours
  userProfile: 3600,         // 1 hour
  chatResponse: 600,         // 10 minutes
  search: 300,               // 5 minutes
}

async function getChatResponse(messages) {
  const key = cacheKey(messages)

  return getCached(
    key,
    () => anthropic.messages.create({...}),
    CACHE_TTL.chatResponse
  )
}
```

---

## Production Deployment Checklist

### Before Launch

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Load testing completed
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] CDN configured
- [ ] Error tracking set up

### Launch Day

- [ ] Database migrated
- [ ] Environment variables set
- [ ] Deploy to production
- [ ] Verify all endpoints
- [ ] Test critical flows
- [ ] Monitor logs
- [ ] Check metrics
- [ ] Announce launch

### Post-Launch

- [ ] Monitor performance
- [ ] Track errors
- [ ] Analyze metrics
- [ ] Gather feedback
- [ ] Plan improvements
- [ ] Document issues
- [ ] Update runbooks

---

**Need help deploying?** Contact support@ainative.studio or join our [Discord community](https://discord.com/invite/paipalooza)

**Next guides:**
- [Getting Started](./getting-started.md)
- [Building Your First Chatbot](./first-chatbot.md)
- [Creating Custom Tools](./custom-tools.md)
