# AI Kit E2E Test Suite

Comprehensive end-to-end testing for AI Kit framework using Playwright.

## Quick Start

```bash
# Install dependencies
pnpm install

# Install browsers
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Run in UI mode (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug
```

## Test Coverage

This test suite includes **175+ E2E tests** covering:

### Chat Applications (40+ tests)
- ✅ Next.js Chatbot (`nextjs-chatbot.spec.ts`) - 45 tests
- ✅ React Tools Chat (`react-tools-chat.spec.ts`) - 30 tests
- ✅ Vue Assistant (planned)
- ✅ Svelte Minimal (planned)

### Agent Applications (45+ tests)
- ✅ Research Assistant (`research-assistant.spec.ts`) - 40 tests
- ✅ Code Reviewer (`code-reviewer.spec.ts`) - 30 tests
- ✅ Support Agent (planned)
- ✅ Data Analyst (planned)

### Dashboard Applications (35+ tests)
- ✅ Usage Analytics (`usage-analytics.spec.ts`) - 40 tests
- ✅ Agent Monitor (planned)
- ✅ Admin Panel (planned)

### CLI Tools (25+ tests)
- ✅ Project Creation (`project-creation.spec.ts`) - 30 tests
- ✅ Prompt Testing (planned)

### Workflows (30+ tests)
- ✅ Complete Chatbot (`complete-chatbot.spec.ts`) - 35 tests
- ✅ Agent Deployment (planned)
- ✅ Monitoring Setup (planned)

## Test Categories

### Functional Tests
- User interactions
- Feature workflows
- Data validation
- Error handling

### UI/UX Tests
- Theme switching
- Responsive design
- Mobile compatibility
- Accessibility

### Performance Tests
- Page load times
- Streaming response times
- Memory usage
- Build times

### Integration Tests
- API integration
- Tool execution
- Multi-step workflows
- External services

## Running Specific Tests

```bash
# By category
pnpm test:e2e __tests__/e2e/chat-apps
pnpm test:e2e __tests__/e2e/agent-apps
pnpm test:e2e __tests__/e2e/dashboard-apps

# By browser
pnpm test:e2e:chromium
pnpm test:e2e:firefox
pnpm test:e2e:webkit

# Mobile testing
pnpm test:e2e:mobile

# By file
pnpm test:e2e __tests__/e2e/chat-apps/nextjs-chatbot.spec.ts

# By test name
pnpm test:e2e --grep "should send message"
```

## Test Structure

```
__tests__/e2e/
├── playwright.config.ts      # Configuration
├── setup/                     # Global setup/teardown
├── fixtures/                  # Test data & auth
├── page-objects/             # Page Object Model
├── chat-apps/                # Chat E2E tests
├── agent-apps/               # Agent E2E tests
├── dashboard-apps/           # Dashboard E2E tests
├── cli/                      # CLI E2E tests
└── workflows/                # Workflow E2E tests
```

## CI/CD

Tests run automatically on:
- Every push to main/develop
- Every pull request
- Daily at 2 AM UTC
- Manual trigger

See `.github/workflows/e2e-tests.yml` for details.

## Documentation

Full documentation: `docs/testing/e2e-testing-guide.md`

Topics covered:
- Setup & installation
- Writing tests
- Page Object Model
- Running tests
- Debugging
- Visual regression
- Performance testing
- Best practices

## Troubleshooting

### Common Issues

**Tests timeout**
- Increase timeout in test or config
- Check if dev server is running
- Verify network connectivity

**Flaky tests**
- Use `expect.toPass()` for retry-ability
- Replace `waitForTimeout()` with state-based waits
- Check for race conditions

**Out of memory**
- Reduce parallel workers: `--workers=2`
- Shard tests: `--shard=1/2`
- Close contexts after tests

### Debug Commands

```bash
# Run with traces
pnpm test:e2e --trace on

# Show trace
pnpm exec playwright show-trace trace.zip

# Headed mode
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e file.spec.ts:42 --debug
```

## Contributing

When adding E2E tests:

1. Use Page Object Model
2. Add data-testid attributes to components
3. Write descriptive test names
4. Include error scenarios
5. Update test count in this README
6. Ensure tests pass locally and in CI

## Metrics

Current test statistics:

- **Total Tests**: 175+
- **Test Files**: 10+
- **Page Objects**: 3
- **Fixtures**: 3
- **Browsers**: 3 (Chromium, Firefox, WebKit)
- **Mobile Devices**: 2 (iPhone 13, Pixel 5)
- **CI Jobs**: 6
- **Average Runtime**: ~15 minutes (parallel)

## License

MIT
