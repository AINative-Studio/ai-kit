# Agent Example Applications

Production-ready example applications demonstrating advanced agent capabilities and multi-agent systems using the AI Kit framework.

## Applications

### 1. Research Assistant Agent
**Location**: `research-assistant/`
**Port**: 3001

Multi-step research workflow with web search integration, citation generation, and export to multiple formats.

**Features:**
- Automated research process (web search → analysis → synthesis → citations)
- Export to PDF, DOCX, Markdown, HTML
- Real-time execution monitoring
- Citation generation (APA, MLA, Chicago)
- Next.js 14 frontend with TailwindCSS

**Quick Start:**
```bash
cd research-assistant
npm install
npm run dev
# Open http://localhost:3001
```

**Use Cases:**
- Academic research
- Content research for writing
- Competitive analysis
- Market research

---

### 2. Code Review Agent
**Location**: `code-reviewer/`
**Port**: 3002

Automated code review with GitHub integration, security scanning, and best practice checks.

**Features:**
- Security vulnerability detection
- Code style and linting
- Performance analysis
- Test coverage assessment
- PR comment generation
- CLI + Web interface

**Quick Start:**
```bash
cd code-reviewer
npm install

# CLI usage
npm run cli review --repo .

# Web interface
npm run dev
# Open http://localhost:3002
```

**Use Cases:**
- Pull request reviews
- Security audits
- Code quality checks
- CI/CD integration

---

### 3. Customer Support Agent
**Location**: `support-agent/`
**Port**: 3003

Multi-agent support system with intelligent routing, sentiment analysis, and knowledge base integration.

**Features:**
- Router agent + 4 specialist agents (technical, billing, account, general)
- Sentiment analysis
- Priority classification
- ZeroDB knowledge base
- Escalation logic
- Analytics dashboard

**Quick Start:**
```bash
cd support-agent
npm install
npm run dev
# Open http://localhost:3003
```

**Use Cases:**
- Customer support automation
- Ticket classification
- Knowledge base search
- Support analytics

---

### 4. Data Analysis Agent
**Location**: `data-analyst/`
**Port**: 3004

CSV/Excel file analysis with SQL query generation and interactive visualizations.

**Features:**
- CSV/Excel/JSON file support
- Natural language to SQL
- Statistical analysis
- Interactive charts (bar, line, pie, scatter, histogram)
- Jupyter notebook integration
- Report generation

**Quick Start:**
```bash
cd data-analyst
npm install
npm run dev
# Open http://localhost:3004
```

**Use Cases:**
- Business intelligence
- Data exploration
- Report automation
- Analytics dashboards

---

### 5. Content Creation Agent Swarm
**Location**: `content-swarm/`
**Port**: 3005

Multi-agent collaboration for creating blog posts, articles, and social media content.

**Features:**
- 6 specialized agents (researcher, writer, editor, SEO, social media, image)
- SEO optimization
- Social media post generation
- Image prompt generation
- Version control
- Editorial workflow

**Quick Start:**
```bash
cd content-swarm
npm install
npm run dev
# Open http://localhost:3005
```

**Use Cases:**
- Blog post creation
- Social media content
- SEO-optimized articles
- Content marketing

---

## Architecture

### Shared Infrastructure
**Location**: `shared/`

Common utilities used across all applications:
- **Logger**: Structured logging with levels
- **State Manager**: Agent execution state tracking
- **Metrics Collector**: Token usage, costs, performance
- **Error Handler**: Retry logic and error recovery
- **Type Definitions**: Shared interfaces

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Recharts / Chart.js

**Backend:**
- Node.js / TypeScript
- Express (where needed)
- AI Kit Core (agent orchestration)

**Infrastructure:**
- Vitest (testing)
- TypeScript (type safety)
- Zod (validation)
- pnpm (package management)

## Testing

All applications include comprehensive test suites (125+ tests total).

### Run All Tests
```bash
# From agent-apps directory
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    cd "$dir"
    npm test
    cd ..
  fi
done
```

### Run Individual App Tests
```bash
cd research-assistant
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

## Deployment

### Docker

Each application includes a Dockerfile:

```bash
# Build image
cd research-assistant
docker build -t research-assistant .

# Run container
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_key \
  research-assistant
```

### Docker Compose

Deploy all applications together:

```yaml
# docker-compose.yml
version: '3.8'
services:
  research-assistant:
    build: ./research-assistant
    ports:
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

  code-reviewer:
    build: ./code-reviewer
    ports:
      - "3002:3002"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GITHUB_TOKEN=${GITHUB_TOKEN}

  # ... other services
```

```bash
docker-compose up -d
```

### Vercel

Each Next.js application can be deployed to Vercel:

```bash
cd research-assistant
vercel deploy --prod
```

### Railway

Deploy with Railway CLI:

```bash
cd research-assistant
railway init
railway up
```

## Configuration

### Environment Variables

Create `.env.local` in each application directory:

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_key

# Optional (app-specific)
GITHUB_TOKEN=your_github_token          # code-reviewer
ZERODB_API_KEY=your_zerodb_key          # support-agent
ZERODB_PROJECT_ID=your_project_id       # support-agent
SEARCH_API_URL=your_search_api          # research-assistant
```

### Configuration Files

Each app includes:
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `next.config.js`: Next.js configuration (if applicable)
- `.env.example`: Example environment variables
- `README.md`: App-specific documentation

## Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- TypeScript 5+

### Setup
```bash
# Install dependencies for all apps
cd agent-apps
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    cd "$dir"
    pnpm install
    cd ..
  fi
done
```

### Development Mode
```bash
# Run specific app
cd research-assistant
npm run dev

# Run all apps (different terminals)
cd research-assistant && npm run dev &
cd code-reviewer && npm run dev &
cd support-agent && npm run dev &
cd data-analyst && npm run dev &
cd content-swarm && npm run dev &
```

## Production Checklist

- [ ] Environment variables configured
- [ ] API keys secured
- [ ] Database connections tested
- [ ] Error logging enabled
- [ ] Monitoring setup
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] SSL certificates installed
- [ ] Backup strategy implemented
- [ ] Load testing completed

## Performance

### Optimization Tips

1. **Caching**: Enable response caching for repeated queries
2. **Rate Limiting**: Prevent API abuse
3. **Connection Pooling**: Optimize database connections
4. **CDN**: Use CDN for static assets
5. **Compression**: Enable gzip/brotli
6. **Monitoring**: Track metrics and errors

### Monitoring

Recommended tools:
- **Application**: Vercel Analytics, Sentry
- **Infrastructure**: DataDog, New Relic
- **Logs**: LogTail, Papertrail
- **Uptime**: UptimeRobot, Pingdom

## Security

### Best Practices

1. **API Keys**: Store in environment variables, never commit
2. **Input Validation**: Use Zod schemas for all inputs
3. **Rate Limiting**: Implement per-user/IP limits
4. **CORS**: Configure allowed origins
5. **Authentication**: Implement JWT or session auth
6. **SQL Injection**: Use parameterized queries
7. **XSS Protection**: Sanitize user inputs
8. **HTTPS**: Always use SSL in production

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check port usage
lsof -i :3001

# Kill process
kill -9 <PID>
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
npm run type-check
```

**Test failures:**
```bash
npm test -- --reporter=verbose
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Document public APIs
- Update README for significant changes
- Run tests before committing

## License

MIT - See main AI Kit LICENSE file

## Support

- **Documentation**: See individual app READMEs
- **Issues**: GitHub Issues
- **Email**: support@ainative.studio
- **Discord**: Join our community

## Credits

Built with:
- [AI Kit](../packages/core) - Agent orchestration
- [Next.js](https://nextjs.org) - React framework
- [Claude](https://anthropic.com) - LLM API
- [Vercel](https://vercel.com) - Deployment platform

---

**Built with ❤️ by AINative Studio**
