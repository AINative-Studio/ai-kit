# AI Kit Dashboard Applications

Three production-ready dashboard applications showcasing AI Kit's monitoring, analytics, and management capabilities.

## Overview

This collection includes three comprehensive dashboards:

1. **Usage Analytics Dashboard** - Real-time monitoring and analytics
2. **Agent Monitoring Dashboard** - Agent execution and performance tracking
3. **Admin Control Panel** - User and system management

## Quick Start

```bash
# Navigate to any dashboard
cd usage-analytics  # or agent-monitor, or admin-panel

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Dashboards

### 1. Usage Analytics Dashboard

**Technology**: Next.js 14, TypeScript, Tailwind CSS

**Features**:
- Real-time usage metrics with auto-refresh
- Token consumption tracking
- Cost analysis by AI model
- Model comparison analytics
- Interactive charts (Recharts)
- Dark mode support
- Mobile responsive
- Export reports (PDF, CSV)

**Key Components**:
- Overview metrics cards
- Usage trends line chart
- Cost breakdown bar chart
- Model comparison table
- Date range filtering
- WebSocket real-time updates

**Routes**:
- `/` - Overview dashboard
- `/analytics` - Detailed analytics
- `/costs` - Cost tracking
- `/activity` - User activity
- `/reports` - Report generation
- `/alerts` - Alert configuration

**Test Coverage**: 35+ tests

### 2. Agent Monitoring Dashboard

**Technology**: React 18, Vite, TypeScript, Tailwind CSS

**Features**:
- Live agent execution monitoring
- Performance metrics tracking
- Tool usage statistics
- Error tracking and debugging
- Execution logs viewer
- Agent comparison view
- Historical performance data
- Real-time updates

**Key Components**:
- Agent status cards
- Execution timeline chart
- Tool usage bar chart
- Metrics overview
- Log filtering and search
- Performance analytics

**Routes**:
- `/` - Dashboard overview
- `/agents` - Live agents list
- `/agent/:id` - Agent details
- `/logs` - Execution logs
- `/performance` - Performance analytics
- `/monitoring` - System monitoring

**Test Coverage**: 35+ tests

### 3. Admin Control Panel

**Technology**: Next.js 14, TypeScript, Tailwind CSS

**Features**:
- User management (CRUD operations)
- API key generation and management
- Rate limit configuration
- Security policy settings
- System health monitoring
- Audit logs with filtering
- Billing and subscriptions
- Role-based access control

**Key Components**:
- User data table
- API key manager
- Security settings panel
- System health dashboard
- Audit log viewer
- Billing interface

**Routes**:
- `/` - Admin dashboard
- `/users` - User management
- `/api-keys` - API key management
- `/security` - Security settings
- `/audit` - Audit logs
- `/billing` - Billing management
- `/settings` - System settings

**Test Coverage**: 30+ tests

## Architecture

### Technology Stack

**Frontend Frameworks**:
- Next.js 14 (Usage Analytics, Admin Panel)
- React 18 + Vite (Agent Monitor)
- TypeScript (all dashboards)
- Tailwind CSS (all dashboards)

**Data Management**:
- TanStack Query (React Query) - Server state
- Zustand - Client state
- WebSocket - Real-time updates

**UI Components**:
- Recharts - Data visualization
- Lucide React - Icons
- Custom component library

**Testing**:
- Vitest - Test runner
- Testing Library - Component testing
- jsdom - DOM simulation

### Design Patterns

**Component Architecture**:
- Atomic design principles
- Composition over inheritance
- Single responsibility
- Reusable UI components

**State Management**:
- Server state with React Query
- Local state with Zustand
- Optimistic updates
- Cache invalidation

**Performance Optimization**:
- Code splitting
- Lazy loading
- Memoization
- Request deduplication
- Image optimization

## API Integration

All dashboards are designed to integrate with AI Kit's REST API and WebSocket endpoints.

### REST API Endpoints

```typescript
// Usage Analytics
GET /api/metrics/overview
GET /api/metrics/usage
GET /api/metrics/costs
GET /api/metrics/models

// Agent Monitor
GET /api/agents
GET /api/agents/:id
GET /api/executions
GET /api/tools/usage

// Admin Panel
GET /api/admin/users
POST /api/admin/users
GET /api/admin/api-keys
POST /api/admin/api-keys
GET /api/admin/audit-logs
```

### WebSocket Events

```typescript
// Real-time updates
ws://api/events/metrics
ws://api/events/agents
ws://api/events/executions
```

## Testing

### Test Coverage Summary

| Dashboard | Component Tests | Integration Tests | Total |
|-----------|----------------|-------------------|-------|
| Usage Analytics | 25 | 10 | 35+ |
| Agent Monitor | 25 | 10 | 35+ |
| Admin Panel | 20 | 10 | 30+ |
| **Total** | **70** | **30** | **100+** |

### Running Tests

```bash
# Run all tests in all dashboards
pnpm test --recursive

# Run tests with coverage
pnpm test:coverage --recursive

# Run tests in specific dashboard
cd usage-analytics && pnpm test

# Watch mode
pnpm test -- --watch
```

### Test Types

**Component Tests**:
- Unit tests for individual components
- Props validation
- Event handling
- Rendering logic

**Integration Tests**:
- API integration
- State management
- Route navigation
- WebSocket connections

**Visual Tests**:
- Responsive design
- Dark mode
- Loading states
- Error states

## Deployment

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
cd usage-analytics && vercel --prod
cd admin-panel && vercel --prod
```

### Netlify (Recommended for Vite)

```bash
# Install Netlify CLI
pnpm i -g netlify-cli

# Deploy
cd agent-monitor && netlify deploy --prod
```

### Docker

Each dashboard includes a Dockerfile:

```bash
# Build image
docker build -t usage-analytics ./usage-analytics

# Run container
docker run -p 3000:3000 usage-analytics
```

### Docker Compose

```yaml
version: '3.8'
services:
  usage-analytics:
    build: ./usage-analytics
    ports:
      - "3001:3000"
  agent-monitor:
    build: ./agent-monitor
    ports:
      - "3002:3000"
  admin-panel:
    build: ./admin-panel
    ports:
      - "3003:3000"
```

## Environment Variables

### Usage Analytics

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://api.example.com
```

### Agent Monitor

```bash
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

### Admin Panel

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXTAUTH_SECRET=your_secret
DATABASE_URL=postgresql://...
```

## Performance

### Lighthouse Scores

All dashboards achieve:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Core Web Vitals

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

All dashboards are WCAG 2.1 AA compliant:
- Keyboard navigation
- Screen reader support
- Proper ARIA labels
- Color contrast ratios
- Focus indicators

## Security

### Best Practices Implemented

1. **Authentication**: JWT tokens, refresh rotation
2. **Authorization**: RBAC, permission checks
3. **Input Validation**: Zod schemas, sanitization
4. **XSS Protection**: Content Security Policy
5. **CSRF Protection**: Token validation
6. **Rate Limiting**: Request throttling
7. **Audit Logging**: All admin actions logged

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: https://docs.ai-kit.dev
- GitHub Issues: https://github.com/ainative/ai-kit/issues
- Discord: https://discord.gg/ai-kit
- Email: support@ai-kit.dev

## Screenshots

### Usage Analytics Dashboard
![Usage Analytics](https://via.placeholder.com/1200x600/3b82f6/ffffff?text=Usage+Analytics+Dashboard)

### Agent Monitoring Dashboard
![Agent Monitor](https://via.placeholder.com/1200x600/10b981/ffffff?text=Agent+Monitoring+Dashboard)

### Admin Control Panel
![Admin Panel](https://via.placeholder.com/1200x600/f59e0b/ffffff?text=Admin+Control+Panel)

## Roadmap

- [ ] Advanced filtering and search
- [ ] Custom dashboard builder
- [ ] Report scheduling
- [ ] Email notifications
- [ ] Mobile apps (iOS, Android)
- [ ] Embedded widgets
- [ ] White-label support
- [ ] Multi-tenant architecture

## Credits

Built with love by the AINative team.

Special thanks to:
- Next.js team for the amazing framework
- Vercel for deployment platform
- TanStack for React Query
- Tailwind Labs for Tailwind CSS
