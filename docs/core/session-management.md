# Session Management

Comprehensive session management utilities for AI applications with multiple storage backends, flexible expiration strategies, and security features.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [Storage Backends](#storage-backends)
6. [Expiration Strategies](#expiration-strategies)
7. [Security Features](#security-features)
8. [API Reference](#api-reference)
9. [Advanced Usage](#advanced-usage)
10. [Best Practices](#best-practices)
11. [Performance Optimization](#performance-optimization)
12. [Troubleshooting](#troubleshooting)

## Overview

The Session Management module provides a robust, production-ready solution for managing user sessions in AI applications. It supports multiple storage backends (in-memory, Redis, ZeroDB), flexible expiration strategies, data encryption, and concurrent session handling.

### Key Features

- **Multiple Storage Backends**: In-memory, Redis, and ZeroDB support
- **Flexible Expiration**: Fixed, sliding, and hybrid expiration strategies
- **Security**: Built-in data encryption and session locking
- **Scalability**: Horizontal scaling with Redis and ZeroDB
- **Performance**: Optimized LRU caching and automatic cleanup
- **Event System**: Subscribe to session lifecycle events
- **TypeScript**: Full type safety and IntelliSense support

## Installation

The session management module is part of the `@ainative/ai-kit-core` package:

```bash
npm install @ainative/ai-kit-core
```

For Redis support:

```bash
npm install ioredis
```

## Quick Start

### Basic Usage (In-Memory)

```typescript
import { SessionManager } from '@ainative/ai-kit-core/session'

// Create session manager with in-memory storage
const sessionManager = new SessionManager({
  type: 'memory',
  ttl: 3600, // 1 hour
  maxSessions: 10000
})

// Create a session
const session = await sessionManager.create('user-123', {
  username: 'john_doe',
  preferences: { theme: 'dark' }
})

console.log('Session ID:', session.sessionId)

// Retrieve a session
const retrieved = await sessionManager.get(session.sessionId)

// Update session data
await sessionManager.update(session.sessionId, {
  lastActivity: new Date().toISOString()
}, { merge: true })

// Refresh session expiration
await sessionManager.refresh(session.sessionId)

// Delete session
await sessionManager.delete(session.sessionId)

// Cleanup
await sessionManager.close()
```

### Redis Backend

```typescript
import { SessionManager } from '@ainative/ai-kit-core/session'

const sessionManager = new SessionManager({
  type: 'redis',
  host: 'localhost',
  port: 6379,
  password: 'your-password',
  ttl: 7200,
  keyPrefix: 'app:session:'
})

// Use the same API as in-memory
const session = await sessionManager.create('user-123', {
  role: 'admin'
})
```

### ZeroDB Backend

```typescript
import { SessionManager } from '@ainative/ai-kit-core/session'

const sessionManager = new SessionManager({
  type: 'zerodb',
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  tableName: 'user_sessions',
  ttl: 3600
})

const session = await sessionManager.create('user-123', {
  authenticated: true
})
```

## Core Concepts

### Session Object

A session contains the following properties:

```typescript
interface Session {
  sessionId: string           // Unique identifier
  userId: string             // Associated user ID
  data: Record<string, any>  // Custom session data
  createdAt: number          // Creation timestamp
  lastAccessedAt: number     // Last access timestamp
  expiresAt: number          // Expiration timestamp
  isExpired: boolean         // Expiration status
  ipAddress?: string         // Client IP (optional)
  userAgent?: string         // User agent (optional)
  metadata?: Record<string, any> // Custom metadata
}
```

### Session Lifecycle

1. **Creation**: Session is created with user ID and data
2. **Active**: Session can be retrieved, updated, and refreshed
3. **Accessed**: Last accessed timestamp updates on retrieval
4. **Expired**: Session expires based on TTL and strategy
5. **Cleaned Up**: Expired sessions are removed from storage

### Configuration Options

```typescript
interface SessionConfig {
  type: 'memory' | 'redis' | 'zerodb'
  ttl?: number                      // Default TTL in seconds (default: 3600)
  expirationStrategy?: ExpirationStrategy
  namespace?: string                // Key namespace
  encryptData?: boolean             // Enable encryption
  encryptionKey?: string            // Encryption key
  maxSessionsPerUser?: number       // Limit per user (0 = unlimited)
  enableLocking?: boolean           // Enable session locking
  lockTimeout?: number              // Lock timeout in ms
  cleanupInterval?: number          // Auto-cleanup interval
  autoCleanup?: boolean             // Enable auto-cleanup
}
```

## Storage Backends

### In-Memory Store

Best for development, testing, and single-server deployments.

**Features:**
- Fastest performance
- LRU eviction when max capacity reached
- No external dependencies
- Not persistent across restarts

**Configuration:**

```typescript
const config = {
  type: 'memory',
  maxSessions: 10000,  // Maximum sessions to store
  ttl: 3600
}
```

**Use Cases:**
- Development and testing
- Single-server applications
- Short-lived sessions
- Temporary data storage

### Redis Store

Best for production, distributed systems, and persistent sessions.

**Features:**
- Persistent storage
- Distributed session support
- Automatic key expiration
- Pub/Sub support
- High availability

**Configuration:**

```typescript
const config = {
  type: 'redis',
  url: 'redis://localhost:6379', // Connection URL
  // OR individual options:
  host: 'localhost',
  port: 6379,
  password: 'your-password',
  db: 0,
  keyPrefix: 'session:',
  ttl: 7200
}
```

**Use Cases:**
- Production deployments
- Multi-server applications
- Session sharing across services
- Long-lived sessions

### ZeroDB Store

Best for encrypted, compliant storage with built-in security.

**Features:**
- End-to-end encryption
- Compliance-ready (GDPR, HIPAA)
- Vector search capabilities
- Event streaming
- No infrastructure management

**Configuration:**

```typescript
const config = {
  type: 'zerodb',
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  tableName: 'sessions',
  ttl: 3600
}
```

**Use Cases:**
- Healthcare applications
- Financial services
- PII/sensitive data storage
- Compliance requirements

## Expiration Strategies

### Fixed Expiration

Session expires at a fixed time after creation, regardless of activity.

```typescript
const config = {
  type: 'memory',
  ttl: 3600,
  expirationStrategy: ExpirationStrategy.FIXED
}
```

**Behavior:**
- Session created at T0
- Session expires at T0 + TTL
- Activity does not extend expiration

**Use Cases:**
- Time-limited access tokens
- Temporary permissions
- Timed quizzes or exams

### Sliding Expiration

Session expiration extends with each access, maintaining active sessions.

```typescript
const config = {
  type: 'memory',
  ttl: 1800,
  expirationStrategy: ExpirationStrategy.SLIDING
}
```

**Behavior:**
- Session created at T0, expires at T0 + TTL
- Access at T1, expires at T1 + TTL
- Each access extends expiration

**Use Cases:**
- Web application sessions
- Active user sessions
- Shopping carts
- Long-running tasks

### Hybrid Expiration

Combines fixed maximum lifetime with sliding window.

```typescript
const config = {
  type: 'memory',
  ttl: 1800,
  expirationStrategy: ExpirationStrategy.HYBRID
}
```

**Behavior:**
- Session has absolute maximum lifetime
- Activity extends expiration up to maximum
- Balances security and user experience

**Use Cases:**
- Banking applications
- Admin panels
- Secure workflows

## Security Features

### Data Encryption

Encrypt session data at rest using AES-256-CBC encryption.

```typescript
const config = {
  type: 'memory',
  encryptData: true,
  encryptionKey: 'your-32-character-encryption-key!'
}

const sessionManager = new SessionManager(config)

// Data is automatically encrypted when stored
const session = await sessionManager.create('user-123', {
  creditCard: '4111-1111-1111-1111',
  ssn: '123-45-6789'
})

// Data is automatically decrypted when retrieved
const retrieved = await sessionManager.get(session.sessionId)
console.log(retrieved.data.creditCard) // Decrypted
```

**Security Considerations:**
- Store encryption key in environment variables
- Rotate keys periodically
- Use different keys per environment
- Never commit keys to version control

### Session Locking

Prevent race conditions with concurrent session access.

```typescript
const config = {
  type: 'redis',
  enableLocking: true,
  lockTimeout: 5000, // 5 seconds
  host: 'localhost',
  port: 6379
}

const sessionManager = new SessionManager(config)

// Updates are automatically locked
await sessionManager.update(sessionId, { counter: 1 })
```

**How It Works:**
1. Acquire lock before update
2. Perform update operation
3. Release lock after completion
4. Timeout if lock held too long

### IP Address and User Agent Tracking

Track session origin for security monitoring.

```typescript
const session = await sessionManager.create('user-123', {}, {
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
})

// Later, validate session origin
const retrieved = await sessionManager.get(sessionId)
if (retrieved.ipAddress !== currentIp) {
  console.warn('IP address mismatch detected')
  await sessionManager.delete(sessionId)
}
```

### Max Sessions Per User

Prevent session proliferation and abuse.

```typescript
const config = {
  type: 'memory',
  maxSessionsPerUser: 5 // Maximum 5 concurrent sessions
}

// Oldest session automatically deleted when limit exceeded
for (let i = 0; i < 10; i++) {
  await sessionManager.create('user-123', { device: `device-${i}` })
}

const sessions = await sessionManager.getUserSessions('user-123')
console.log(sessions.length) // 5 (oldest deleted)
```

## API Reference

### SessionManager

#### Constructor

```typescript
constructor(config: SessionConfig)
```

Creates a new session manager instance.

#### create()

```typescript
async create(
  userId: string,
  data?: Record<string, any>,
  options?: CreateSessionOptions
): Promise<Session>
```

Create a new session for a user.

**Parameters:**
- `userId`: User identifier
- `data`: Custom session data (optional)
- `options`: Creation options (optional)
  - `ttl`: Custom TTL in seconds
  - `ipAddress`: Client IP address
  - `userAgent`: User agent string
  - `metadata`: Custom metadata

**Returns:** Created session object

**Example:**

```typescript
const session = await sessionManager.create('user-123',
  { role: 'admin', permissions: ['read', 'write'] },
  {
    ttl: 7200,
    ipAddress: '192.168.1.1',
    metadata: { device: 'mobile' }
  }
)
```

#### get()

```typescript
async get(sessionId: string): Promise<Session | null>
```

Retrieve a session by ID. Returns null if not found or expired.

**Parameters:**
- `sessionId`: Session identifier

**Returns:** Session object or null

**Example:**

```typescript
const session = await sessionManager.get('sess-abc123')
if (session && !session.isExpired) {
  console.log('Session is valid')
}
```

#### update()

```typescript
async update(
  sessionId: string,
  data: Record<string, any>,
  options?: UpdateSessionOptions
): Promise<Session | null>
```

Update session data.

**Parameters:**
- `sessionId`: Session identifier
- `data`: New session data
- `options`: Update options (optional)
  - `merge`: Merge with existing data (default: false)
  - `updateLastAccessed`: Update timestamp (default: true)

**Returns:** Updated session or null

**Example:**

```typescript
// Replace data
await sessionManager.update('sess-abc123', { counter: 5 })

// Merge data
await sessionManager.update('sess-abc123',
  { newField: 'value' },
  { merge: true }
)
```

#### delete()

```typescript
async delete(sessionId: string): Promise<boolean>
```

Delete a session.

**Parameters:**
- `sessionId`: Session identifier

**Returns:** True if deleted, false if not found

**Example:**

```typescript
const deleted = await sessionManager.delete('sess-abc123')
if (deleted) {
  console.log('Session deleted')
}
```

#### refresh()

```typescript
async refresh(
  sessionId: string,
  options?: RefreshSessionOptions
): Promise<Session | null>
```

Extend session expiration.

**Parameters:**
- `sessionId`: Session identifier
- `options`: Refresh options (optional)
  - `ttl`: Custom TTL in seconds

**Returns:** Refreshed session or null

**Example:**

```typescript
// Extend with default TTL
await sessionManager.refresh('sess-abc123')

// Extend with custom TTL
await sessionManager.refresh('sess-abc123', { ttl: 7200 })
```

#### getUserSessions()

```typescript
async getUserSessions(userId: string): Promise<Session[]>
```

Get all active sessions for a user.

**Parameters:**
- `userId`: User identifier

**Returns:** Array of sessions

**Example:**

```typescript
const sessions = await sessionManager.getUserSessions('user-123')
console.log(`User has ${sessions.length} active sessions`)

// Display all devices
sessions.forEach(session => {
  console.log(`Device: ${session.metadata?.device}`)
})
```

#### deleteUserSessions()

```typescript
async deleteUserSessions(userId: string): Promise<number>
```

Delete all sessions for a user.

**Parameters:**
- `userId`: User identifier

**Returns:** Number of deleted sessions

**Example:**

```typescript
// Logout user from all devices
const count = await sessionManager.deleteUserSessions('user-123')
console.log(`Deleted ${count} sessions`)
```

#### list()

```typescript
async list(options?: ListSessionsOptions): Promise<Session[]>
```

List sessions with pagination.

**Parameters:**
- `options`: List options (optional)
  - `limit`: Maximum results (default: 100)
  - `offset`: Pagination offset (default: 0)
  - `includeExpired`: Include expired sessions (default: false)

**Returns:** Array of sessions

**Example:**

```typescript
// Get first 50 sessions
const sessions = await sessionManager.list({ limit: 50 })

// Get next 50 sessions
const nextSessions = await sessionManager.list({
  limit: 50,
  offset: 50
})

// Include expired sessions
const allSessions = await sessionManager.list({
  includeExpired: true
})
```

#### validate()

```typescript
async validate(sessionId: string): Promise<boolean>
```

Check if a session is valid and active.

**Parameters:**
- `sessionId`: Session identifier

**Returns:** True if valid, false otherwise

**Example:**

```typescript
const isValid = await sessionManager.validate('sess-abc123')
if (isValid) {
  // Proceed with request
} else {
  // Redirect to login
}
```

#### cleanup()

```typescript
async cleanup(): Promise<number>
```

Manually trigger expired session cleanup.

**Returns:** Number of cleaned sessions

**Example:**

```typescript
const cleaned = await sessionManager.cleanup()
console.log(`Cleaned ${cleaned} expired sessions`)
```

#### getStats()

```typescript
async getStats(): Promise<SessionStats>
```

Get session statistics.

**Returns:** Statistics object

**Example:**

```typescript
const stats = await sessionManager.getStats()
console.log(`Total: ${stats.totalSessions}`)
console.log(`Active: ${stats.activeSessions}`)
console.log(`Expired: ${stats.expiredSessions}`)
console.log(`Average duration: ${stats.averageDuration}ms`)

// Sessions by user
Object.entries(stats.sessionsByUser || {}).forEach(([userId, count]) => {
  console.log(`${userId}: ${count} sessions`)
})
```

#### on()

```typescript
on(event: SessionEvent, listener: SessionEventListener): void
```

Subscribe to session events.

**Parameters:**
- `event`: Event type
- `listener`: Event handler function

**Events:**
- `SessionEvent.CREATED`: Session created
- `SessionEvent.UPDATED`: Session updated
- `SessionEvent.REFRESHED`: Session refreshed
- `SessionEvent.DELETED`: Session deleted
- `SessionEvent.EXPIRED`: Session expired
- `SessionEvent.LOCKED`: Session locked
- `SessionEvent.UNLOCKED`: Session unlocked

**Example:**

```typescript
sessionManager.on(SessionEvent.CREATED, (payload) => {
  console.log('Session created:', payload.sessionId)
  console.log('User:', payload.userId)
  console.log('Timestamp:', payload.timestamp)
})

sessionManager.on(SessionEvent.EXPIRED, (payload) => {
  console.log('Session expired:', payload.sessionId)
  // Send notification to user
})
```

#### off()

```typescript
off(event: SessionEvent, listener: SessionEventListener): void
```

Unsubscribe from session events.

#### close()

```typescript
async close(): Promise<void>
```

Close session manager and cleanup resources.

**Example:**

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  await sessionManager.close()
  process.exit(0)
})
```

## Advanced Usage

### Custom Session Store

Implement your own storage backend:

```typescript
import { SessionStore, SessionData, SessionStats } from '@ainative/ai-kit-core/session'

class CustomSessionStore implements SessionStore {
  async get(sessionId: string): Promise<SessionData | null> {
    // Your implementation
  }

  async set(sessionId: string, data: SessionData): Promise<void> {
    // Your implementation
  }

  // Implement other required methods...
}
```

### Event-Driven Architecture

Build event-driven session management:

```typescript
import { SessionManager, SessionEvent } from '@ainative/ai-kit-core/session'

const sessionManager = new SessionManager({ type: 'redis' })

// Audit logging
sessionManager.on(SessionEvent.CREATED, async (payload) => {
  await auditLog.write({
    action: 'session_created',
    userId: payload.userId,
    sessionId: payload.sessionId,
    timestamp: payload.timestamp
  })
})

// Real-time notifications
sessionManager.on(SessionEvent.EXPIRED, async (payload) => {
  await notifications.send(payload.userId, {
    type: 'session_expired',
    message: 'Your session has expired. Please log in again.'
  })
})

// Security monitoring
sessionManager.on(SessionEvent.CREATED, async (payload) => {
  const sessions = await sessionManager.getUserSessions(payload.userId)

  if (sessions.length > 10) {
    await securityAlerts.trigger({
      type: 'suspicious_activity',
      userId: payload.userId,
      reason: 'Too many concurrent sessions'
    })
  }
})
```

### Session Migration

Migrate sessions between storage backends:

```typescript
// Source: In-memory
const sourceManager = new SessionManager({
  type: 'memory'
})

// Destination: Redis
const destManager = new SessionManager({
  type: 'redis',
  host: 'localhost',
  port: 6379
})

// Migrate sessions
const sessions = await sourceManager.list({ includeExpired: false })

for (const session of sessions) {
  await destManager.create(
    session.userId,
    session.data,
    {
      ttl: Math.ceil((session.expiresAt - Date.now()) / 1000),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      metadata: session.metadata
    }
  )
}

console.log(`Migrated ${sessions.length} sessions`)
```

### Session Analytics

Track session metrics and patterns:

```typescript
class SessionAnalytics {
  private manager: SessionManager

  constructor(manager: SessionManager) {
    this.manager = manager
    this.setupTracking()
  }

  private setupTracking() {
    this.manager.on(SessionEvent.CREATED, this.trackCreation.bind(this))
    this.manager.on(SessionEvent.EXPIRED, this.trackExpiration.bind(this))
  }

  private async trackCreation(payload: SessionEventPayload) {
    // Track session creation metrics
    await metrics.increment('session.created', {
      userId: payload.userId
    })
  }

  private async trackExpiration(payload: SessionEventPayload) {
    // Track session duration
    const session = await this.manager.get(payload.sessionId)
    if (session) {
      const duration = session.lastAccessedAt - session.createdAt
      await metrics.timing('session.duration', duration)
    }
  }

  async getReport(): Promise<SessionReport> {
    const stats = await this.manager.getStats()

    return {
      totalSessions: stats.totalSessions,
      activeSessions: stats.activeSessions,
      averageDuration: stats.averageDuration,
      topUsers: Object.entries(stats.sessionsByUser || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    }
  }
}
```

## Best Practices

### 1. Choose the Right Backend

- **Development**: Use in-memory for speed and simplicity
- **Production (Single Server)**: Use Redis for persistence
- **Production (Distributed)**: Use Redis with replication
- **Compliance/Security**: Use ZeroDB for encryption

### 2. Set Appropriate TTL

```typescript
// Short-lived: API tokens, OTPs
const shortConfig = { type: 'memory', ttl: 300 } // 5 minutes

// Medium: User sessions
const mediumConfig = { type: 'redis', ttl: 3600 } // 1 hour

// Long-lived: Remember me tokens
const longConfig = { type: 'redis', ttl: 2592000 } // 30 days
```

### 3. Implement Session Rotation

```typescript
async function rotateSession(oldSessionId: string): Promise<Session> {
  // Get old session
  const oldSession = await sessionManager.get(oldSessionId)
  if (!oldSession) {
    throw new Error('Session not found')
  }

  // Create new session with same data
  const newSession = await sessionManager.create(
    oldSession.userId,
    oldSession.data,
    {
      ttl: Math.ceil((oldSession.expiresAt - Date.now()) / 1000),
      ipAddress: oldSession.ipAddress,
      userAgent: oldSession.userAgent
    }
  )

  // Delete old session
  await sessionManager.delete(oldSessionId)

  return newSession
}
```

### 4. Handle Session Errors

```typescript
async function safeGetSession(sessionId: string): Promise<Session | null> {
  try {
    return await sessionManager.get(sessionId)
  } catch (error) {
    console.error('Failed to get session:', error)

    // Log error to monitoring service
    await errorTracking.captureException(error, {
      context: 'session_retrieval',
      sessionId
    })

    return null
  }
}
```

### 5. Implement Graceful Shutdown

```typescript
class Application {
  private sessionManager: SessionManager

  async shutdown() {
    console.log('Shutting down...')

    // Stop accepting new sessions
    this.acceptingSessions = false

    // Wait for pending operations
    await this.waitForPendingOps()

    // Close session manager
    await this.sessionManager.close()

    console.log('Shutdown complete')
  }
}
```

## Performance Optimization

### 1. Batch Operations

```typescript
// Instead of individual gets
const sessions = await Promise.all(
  sessionIds.map(id => sessionManager.get(id))
)

// For Redis: Use pipeline
// For in-memory: Already optimized
```

### 2. Connection Pooling (Redis)

```typescript
const config = {
  type: 'redis',
  host: 'localhost',
  port: 6379,
  // Connection pool settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true
}
```

### 3. Optimize Cleanup

```typescript
// Reduce cleanup frequency for large datasets
const config = {
  type: 'memory',
  autoCleanup: true,
  cleanupInterval: 600000 // 10 minutes instead of 5
}
```

### 4. Use Appropriate Expiration Strategy

```typescript
// Fixed: Best performance (no updates on access)
// Sliding: Moderate performance (updates on access)
// Hybrid: Lower performance (complex logic)
```

## Troubleshooting

### Sessions Not Persisting

**Problem**: Sessions disappear after server restart

**Solution**: Use Redis or ZeroDB instead of in-memory

```typescript
// Change from
const config = { type: 'memory' }

// To
const config = {
  type: 'redis',
  host: 'localhost',
  port: 6379
}
```

### Memory Leaks

**Problem**: Memory usage grows over time

**Solutions**:

1. Enable auto-cleanup:
```typescript
const config = {
  type: 'memory',
  autoCleanup: true,
  cleanupInterval: 300000
}
```

2. Set max sessions:
```typescript
const config = {
  type: 'memory',
  maxSessions: 10000
}
```

3. Manually cleanup:
```typescript
setInterval(async () => {
  await sessionManager.cleanup()
}, 300000)
```

### Race Conditions

**Problem**: Concurrent updates causing data loss

**Solution**: Enable session locking

```typescript
const config = {
  type: 'redis',
  enableLocking: true,
  lockTimeout: 5000
}
```

### Encryption Errors

**Problem**: "encryptionKey is required" error

**Solution**: Provide encryption key

```typescript
const config = {
  type: 'memory',
  encryptData: true,
  encryptionKey: process.env.SESSION_ENCRYPTION_KEY
}
```

### Redis Connection Issues

**Problem**: Cannot connect to Redis

**Solutions**:

1. Check connection settings:
```typescript
const config = {
  type: 'redis',
  host: 'localhost', // Correct host
  port: 6379,        // Correct port
  password: 'your-password' // If auth enabled
}
```

2. Handle connection errors:
```typescript
sessionManager.on(SessionEvent.ERROR, (error) => {
  console.error('Redis error:', error)
  // Implement fallback or retry logic
})
```

### Performance Issues

**Problem**: Slow session operations

**Solutions**:

1. Use appropriate backend:
   - In-memory: Fastest
   - Redis: Fast with persistence
   - ZeroDB: Slowest (network calls)

2. Reduce data size:
```typescript
// Instead of storing large objects
await sessionManager.create(userId, { largeArray: [...] })

// Store references
await sessionManager.create(userId, { dataId: 'ref-123' })
```

3. Use connection pooling (Redis)
4. Optimize cleanup intervals
5. Implement caching layer

---

## Examples

### E-commerce Session

```typescript
const sessionManager = new SessionManager({
  type: 'redis',
  host: 'localhost',
  port: 6379,
  ttl: 1800, // 30 minutes
  expirationStrategy: ExpirationStrategy.SLIDING
})

// Create shopping cart session
const session = await sessionManager.create('user-123', {
  cart: [],
  currency: 'USD',
  shippingAddress: null
})

// Add item to cart
const updated = await sessionManager.update(
  session.sessionId,
  {
    cart: [
      { productId: 'p-001', quantity: 1, price: 29.99 }
    ]
  },
  { merge: true }
)

// Complete checkout - extend session
await sessionManager.refresh(session.sessionId, { ttl: 3600 })

// Clear cart after order
await sessionManager.delete(session.sessionId)
```

### Multi-Device Management

```typescript
// Login from desktop
const desktopSession = await sessionManager.create('user-123', {
  role: 'user'
}, {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  metadata: { device: 'desktop', location: 'New York' }
})

// Login from mobile
const mobileSession = await sessionManager.create('user-123', {
  role: 'user'
}, {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
  metadata: { device: 'mobile', location: 'New York' }
})

// List all user devices
const sessions = await sessionManager.getUserSessions('user-123')
sessions.forEach(s => {
  console.log(`Device: ${s.metadata?.device}`)
  console.log(`Last active: ${new Date(s.lastAccessedAt)}`)
})

// Logout from all devices
await sessionManager.deleteUserSessions('user-123')
```

### Secure Admin Session

```typescript
const sessionManager = new SessionManager({
  type: 'redis',
  host: 'localhost',
  port: 6379,
  ttl: 900, // 15 minutes
  expirationStrategy: ExpirationStrategy.FIXED,
  encryptData: true,
  encryptionKey: process.env.ADMIN_SESSION_KEY,
  maxSessionsPerUser: 1 // One admin session at a time
})

// Create admin session
const adminSession = await sessionManager.create('admin-001', {
  role: 'admin',
  permissions: ['read', 'write', 'delete'],
  accessLevel: 5
}, {
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
})

// Validate on each request
async function validateAdminRequest(req) {
  const session = await sessionManager.get(req.sessionId)

  if (!session) {
    throw new Error('Session expired')
  }

  if (session.ipAddress !== req.ip) {
    await sessionManager.delete(session.sessionId)
    throw new Error('IP address mismatch')
  }

  return session
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-01-19
**License**: MIT
