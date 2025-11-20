# Admin Control Panel

Production-ready administrative control panel for AI Kit, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### User Management
- CRUD operations for user accounts
- Role-based access control (Admin, User, Viewer)
- User status management (Active, Inactive)
- Activity tracking and last login
- Bulk user operations

### API Key Management
- Generate new API keys
- View and reveal API keys
- Copy keys to clipboard
- Revoke API keys
- Usage tracking per key
- Key expiration management

### Security Settings
- Rate limit configuration
- IP whitelisting/blacklisting
- Access control policies
- Two-factor authentication settings
- Session management
- Password policies

### System Monitoring
- System health dashboard
- Resource usage metrics
- Uptime monitoring
- Error rate tracking
- Performance analytics
- Database connection status

### Audit Logs
- User activity logs
- API key usage logs
- Security event logs
- Configuration change history
- Filtering and search
- Export capabilities

### Billing & Subscriptions
- Subscription management
- Payment history
- Usage-based billing
- Invoice generation
- Payment method management
- Plan upgrades/downgrades

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Tables**: TanStack Table
- **State**: Zustand + TanStack Query
- **Validation**: Zod
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

# Start production server
pnpm start
```

## Project Structure

```
admin-panel/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Dashboard home
│   ├── users/               # User management pages
│   ├── api-keys/            # API key pages
│   ├── security/            # Security settings
│   └── audit/               # Audit logs
├── components/
│   ├── UserTable.tsx        # User data table
│   ├── APIKeyManager.tsx    # API key management
│   ├── SecuritySettings.tsx # Security config
│   └── AuditLog.tsx         # Audit trail
├── lib/
│   ├── auth.ts              # Authentication
│   ├── permissions.ts       # RBAC logic
│   └── utils.ts             # Utilities
└── __tests__/               # Test files
```

## Key Features

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

const permissions = {
  admin: ['read', 'write', 'delete', 'manage'],
  user: ['read', 'write'],
  viewer: ['read'],
}
```

### API Key Generation

```typescript
interface APIKey {
  id: string
  name: string
  key: string
  prefix: 'sk_live_' | 'sk_test_'
  created: Date
  expiresAt?: Date
  lastUsed?: Date
  requests: number
  rateLimit: number
}
```

### Rate Limiting

```typescript
interface RateLimitRule {
  id: string
  name: string
  requests: number
  window: 'second' | 'minute' | 'hour' | 'day'
  scope: 'global' | 'user' | 'ip'
  action: 'block' | 'throttle' | 'alert'
}
```

## Security Features

### Authentication
- JWT-based authentication
- Refresh token rotation
- Multi-factor authentication
- Session timeout configuration

### Authorization
- Role-based access control
- Permission-based actions
- Resource-level permissions
- API key scopes

### Audit Trail
- All user actions logged
- IP address tracking
- Timestamp recording
- Change history

## API Integration

```typescript
// GET /api/admin/users
interface User {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive'
  createdAt: Date
  lastLogin?: Date
}

// POST /api/admin/users
interface CreateUser {
  name: string
  email: string
  role: Role
  password: string
}

// GET /api/admin/api-keys
interface APIKey {
  id: string
  name: string
  key: string
  created: Date
  lastUsed?: Date
  requests: number
}

// POST /api/admin/api-keys
interface CreateAPIKey {
  name: string
  expiresAt?: Date
  scopes: string[]
}
```

## Testing

```bash
# Run tests
pnpm test

# Coverage report
pnpm test:coverage

# Watch mode
pnpm test -- --watch
```

Test coverage: 30+ tests across components

## Deployment

### Environment Variables

```bash
# .env.local
NEXTAUTH_SECRET=your_secret_here
DATABASE_URL=postgresql://...
API_URL=https://api.example.com
ADMIN_EMAIL=admin@example.com
```

### Deploy to Vercel

```bash
vercel --prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Security Best Practices

1. **API Keys**
   - Never commit API keys
   - Rotate keys regularly
   - Use key prefixes (sk_live_, sk_test_)
   - Implement key expiration

2. **Authentication**
   - Enforce strong passwords
   - Enable 2FA for admins
   - Implement account lockout
   - Use secure session storage

3. **Authorization**
   - Principle of least privilege
   - Regular permission audits
   - Separate test/production access
   - Document permission model

4. **Audit Logging**
   - Log all admin actions
   - Immutable log storage
   - Regular log review
   - Anomaly detection

## Performance

- Server-side rendering for initial load
- Static generation where possible
- Optimistic UI updates
- Request deduplication
- Cache-first strategy

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## License

MIT License

## Support

- Documentation: https://docs.ai-kit.dev
- Issues: https://github.com/ainative/ai-kit/issues
- Email: admin-support@ai-kit.dev
