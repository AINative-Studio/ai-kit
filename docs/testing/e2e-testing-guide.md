# AI Kit E2E Testing Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Philosophy & Approach](#philosophy--approach)
3. [Setup & Installation](#setup--installation)
4. [Test Architecture](#test-architecture)
5. [Writing E2E Tests](#writing-e2e-tests)
6. [Page Object Model](#page-object-model)
7. [Running Tests](#running-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Debugging Failed Tests](#debugging-failed-tests)
10. [Visual Regression Testing](#visual-regression-testing)
11. [Performance Testing](#performance-testing)
12. [Best Practices](#best-practices)

---

## Introduction

AI Kit's end-to-end (E2E) testing suite uses [Playwright](https://playwright.dev) to verify complete user workflows across all example applications. This comprehensive testing approach ensures that our chat applications, agent systems, dashboards, CLI tools, and deployment workflows function correctly from the user's perspective.

### Test Coverage

Our E2E test suite includes **175+ tests** covering:

- **Chat Applications** (40+ tests): Next.js Chatbot, React Tools Chat, Vue Assistant
- **Agent Applications** (45+ tests): Research Assistant, Code Reviewer, Support Agent
- **Dashboard Applications** (35+ tests): Usage Analytics, Agent Monitor, Admin Panel
- **CLI Tools** (25+ tests): Project creation, Prompt testing, Template scaffolding
- **Workflows** (30+ tests): Complete deployment pipelines, Integration tests

### Key Features

- **Multi-browser testing**: Chromium, Firefox, WebKit (Safari)
- **Mobile responsive testing**: iPhone, iPad, Android devices
- **Visual regression testing**: Screenshot comparison
- **Performance assertions**: Page load, TTI, streaming response times
- **Accessibility testing**: WCAG 2.1 AA compliance
- **CI/CD integration**: Automated testing on every PR

---

## Philosophy & Approach

### Testing Philosophy

1. **User-Centric**: Test from the user's perspective, not internal implementation
2. **Realistic Scenarios**: Use real-world workflows and data
3. **Comprehensive Coverage**: Test happy paths, edge cases, and error scenarios
4. **Fast & Reliable**: Tests should be deterministic and run quickly
5. **Maintainable**: Use Page Object Model and DRY principles

### Testing Pyramid

```
        E2E Tests (175+)
       /              \
      /    Integration  \
     /      Tests        \
    /   (Package-level)   \
   /________________________\
         Unit Tests
      (Component-level)
```

E2E tests sit at the top of our testing pyramid, providing confidence that all components work together correctly in production-like environments.

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- pnpm 8+
- AI Kit repository cloned

### Installation

```bash
# Install dependencies (includes Playwright)
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Verify installation
pnpm exec playwright --version
```

### Environment Configuration

Create a `.env.test` file in the project root:

```env
# Required
NODE_ENV=test

# Recommended (for testing with real APIs)
OPENAI_API_KEY=your-test-key
ANTHROPIC_API_KEY=your-test-key

# Optional
BASE_URL=http://localhost:3000
DEBUG=false
```

⚠️ **Security Note**: Never commit API keys to version control. Use `.env.test` which is gitignored.

---

## Test Architecture

### Directory Structure

```
__tests__/e2e/
├── playwright.config.ts       # Playwright configuration
├── setup/
│   ├── global-setup.ts        # Pre-test setup (auth, database)
│   ├── global-teardown.ts     # Post-test cleanup
│   └── test-servers.ts        # Dev server management
├── fixtures/
│   ├── auth.ts                # Authentication fixtures
│   ├── users.ts               # Test user data
│   └── test-data.ts           # Reusable test data
├── page-objects/
│   ├── chat-page.ts           # Chat UI interactions
│   ├── agent-page.ts          # Agent UI interactions
│   └── dashboard-page.ts      # Dashboard UI interactions
├── chat-apps/
│   ├── nextjs-chatbot.spec.ts
│   ├── react-tools-chat.spec.ts
│   └── vue-assistant.spec.ts
├── agent-apps/
│   ├── research-assistant.spec.ts
│   ├── code-reviewer.spec.ts
│   └── support-agent.spec.ts
├── dashboard-apps/
│   ├── usage-analytics.spec.ts
│   ├── agent-monitor.spec.ts
│   └── admin-panel.spec.ts
├── cli/
│   ├── project-creation.spec.ts
│   └── prompt-testing.spec.ts
└── workflows/
    ├── complete-chatbot.spec.ts
    ├── agent-deployment.spec.ts
    └── monitoring-setup.spec.ts
```

### Configuration

`playwright.config.ts` defines:

- **Test directory**: `__tests__/e2e/`
- **Timeout**: 60 seconds per test
- **Retries**: 2 on CI, 1 locally
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile devices**: iPhone 13, Pixel 5, iPad Pro
- **Screenshots**: On failure
- **Videos**: On retry
- **Traces**: On first retry

---

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { ChatPage } from '../page-objects/chat-page';

test.describe('Chat Application', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3000);
  });

  test('should send message and receive response', async () => {
    await chatPage.sendMessage('Hello');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });
});
```

### Test Organization

**Group related tests** using `test.describe`:

```typescript
test.describe('Feature Group', () => {
  test.describe('Sub-feature A', () => {
    test('should do X', async () => { /* ... */ });
    test('should do Y', async () => { /* ... */ });
  });

  test.describe('Sub-feature B', () => {
    test('should do Z', async () => { /* ... */ });
  });
});
```

### Using Fixtures

```typescript
import { test } from '../fixtures/auth';

test('admin-only feature', async ({ adminPage }) => {
  await adminPage.goto('/admin');
  // Test admin functionality
});

test('regular user feature', async ({ userPage }) => {
  await userPage.goto('/dashboard');
  // Test user functionality
});
```

### Assertions

```typescript
// Visibility
await expect(page.locator('#element')).toBeVisible();
await expect(page.locator('#element')).toBeHidden();

// Text content
await expect(page.locator('#message')).toContainText('Success');
await expect(page.locator('#count')).toHaveText('5');

// Attributes
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('input')).toHaveAttribute('type', 'email');

// Values
expect(await page.locator('#count').textContent()).toBe('10');
expect(array.length).toBeGreaterThan(0);
```

---

## Page Object Model

### Why Page Objects?

The Page Object Model (POM) encapsulates UI interactions, making tests:

- **More maintainable**: UI changes require updates in one place
- **More readable**: Tests read like user actions
- **More reusable**: Page objects shared across tests
- **Easier to debug**: Locators defined in one place

### Creating a Page Object

```typescript
import { Page, Locator } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageInput = page.locator('[data-testid="message-input"]');
    this.sendButton = page.locator('[data-testid="send-button"]');
    this.messages = page.locator('[data-testid="message"]');
  }

  async goto(port: number = 3000) {
    await this.page.goto(`http://localhost:${port}`);
    await this.page.waitForLoadState('networkidle');
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async getLastMessage(): Promise<string> {
    const lastMessage = this.messages.last();
    return await lastMessage.textContent() || '';
  }
}
```

### Using Page Objects

```typescript
test('send message', async ({ page }) => {
  const chatPage = new ChatPage(page);
  await chatPage.goto(3000);
  await chatPage.sendMessage('Hello');

  const response = await chatPage.getLastMessage();
  expect(response).toBeTruthy();
});
```

### Page Object Best Practices

1. **Return page objects** from navigation methods:
   ```typescript
   async clickLogin(): Promise<DashboardPage> {
     await this.loginButton.click();
     return new DashboardPage(this.page);
   }
   ```

2. **Encapsulate waits**:
   ```typescript
   async waitForResponse() {
     await this.typingIndicator.waitFor({ state: 'hidden' });
   }
   ```

3. **Provide helper methods**:
   ```typescript
   async messageContains(text: string): Promise<boolean> {
     const message = await this.getLastMessage();
     return message.toLowerCase().includes(text.toLowerCase());
   }
   ```

---

## Running Tests

### Local Development

```bash
# Run all E2E tests
pnpm exec playwright test

# Run specific test file
pnpm exec playwright test __tests__/e2e/chat-apps/nextjs-chatbot.spec.ts

# Run tests in specific browser
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit

# Run tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run tests in debug mode
pnpm exec playwright test --debug

# Run tests with UI mode (interactive)
pnpm exec playwright test --ui
```

### Filter Tests

```bash
# Run tests matching pattern
pnpm exec playwright test --grep "chat"

# Exclude tests matching pattern
pnpm exec playwright test --grep-invert "slow"

# Run specific test by line number
pnpm exec playwright test file.spec.ts:42
```

### Parallel Execution

```bash
# Run tests in parallel (default)
pnpm exec playwright test

# Run tests serially
pnpm exec playwright test --workers=1

# Run with specific worker count
pnpm exec playwright test --workers=4
```

### Test Reports

```bash
# Generate HTML report
pnpm exec playwright test --reporter=html

# Open report
pnpm exec playwright show-report

# Generate JSON report
pnpm exec playwright test --reporter=json

# Multiple reporters
pnpm exec playwright test --reporter=html,json,junit
```

---

## CI/CD Integration

### GitHub Actions

Our E2E tests run automatically on:

- **Push to main/develop**: Full test suite
- **Pull requests**: Full test suite with visual regression
- **Daily schedule**: Full test suite at 2 AM UTC
- **Manual trigger**: Via workflow_dispatch

### Workflow Structure

```yaml
jobs:
  e2e-chat-apps:
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1, 2]

  e2e-agent-apps:
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1, 2]

  e2e-dashboard-apps:
    strategy:
      matrix:
        browser: [chromium, firefox]

  e2e-cli:
    strategy:
      matrix:
        os: [ubuntu, macos, windows]

  e2e-workflows:
    runs-on: ubuntu-latest
```

### Sharding

Tests are sharded for faster execution:

```bash
# Shard 1 of 2
pnpm exec playwright test --shard=1/2

# Shard 2 of 2
pnpm exec playwright test --shard=2/2
```

### Secrets Configuration

Configure these secrets in GitHub repository settings:

- `OPENAI_API_KEY`: For testing AI features
- `ANTHROPIC_API_KEY`: For testing Claude integration
- `PERCY_TOKEN`: For visual regression (optional)

---

## Debugging Failed Tests

### Playwright Inspector

```bash
# Debug mode (step through test)
pnpm exec playwright test --debug

# Debug specific test
pnpm exec playwright test file.spec.ts:42 --debug
```

### Screenshots & Videos

Screenshots and videos are automatically captured on failure:

```
test-results/
├── screenshots/
│   └── test-failure-chromium-20241120.png
└── videos/
    └── test-failure-chromium-20241120.webm
```

### Trace Viewer

View execution traces for failed tests:

```bash
# Open trace viewer
pnpm exec playwright show-trace test-results/trace.zip
```

Traces include:

- DOM snapshots at each step
- Network requests/responses
- Console logs
- Screenshots
- Source code

### Common Issues

**Issue: Test times out**
```typescript
// Increase timeout
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ...
});
```

**Issue: Element not found**
```typescript
// Wait for element
await page.waitForSelector('[data-testid="element"]');

// Or use auto-waiting
await expect(page.locator('[data-testid="element"]')).toBeVisible();
```

**Issue: Flaky test**
```typescript
// Use retry-ability
await expect(async () => {
  const value = await getValue();
  expect(value).toBe(expected);
}).toPass();

// Or increase retries
test('flaky test', async ({ page }) => {
  test.describe.configure({ retries: 3 });
  // ...
});
```

---

## Visual Regression Testing

### Taking Screenshots

```typescript
test('visual test', async ({ page }) => {
  await page.goto('/dashboard');

  // Full page screenshot
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
  });

  // Element screenshot
  await expect(page.locator('#chart')).toHaveScreenshot('chart.png');
});
```

### Updating Snapshots

```bash
# Update all snapshots
pnpm exec playwright test --update-snapshots

# Update specific test snapshots
pnpm exec playwright test file.spec.ts --update-snapshots
```

### Snapshot Configuration

```typescript
expect.configure({
  toHaveScreenshot: {
    maxDiffPixels: 100,      // Allow 100 pixels difference
    threshold: 0.2,           // 20% threshold
    animations: 'disabled',   // Disable animations
  },
});
```

### Percy Integration (Optional)

```typescript
import percySnapshot from '@percy/playwright';

test('percy visual test', async ({ page }) => {
  await page.goto('/dashboard');
  await percySnapshot(page, 'Dashboard Page');
});
```

---

## Performance Testing

### Page Load Performance

```typescript
test('page load performance', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/dashboard');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

### Web Vitals

```typescript
test('Core Web Vitals', async ({ page }) => {
  await page.goto('/');

  // First Contentful Paint
  const fcp = await page.evaluate(() => {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
    return fcpEntry?.startTime || 0;
  });

  expect(fcp).toBeLessThan(2000); // 2 seconds

  // Time to Interactive
  const tti = await page.evaluate(() => {
    return performance.timing.domInteractive -
           performance.timing.navigationStart;
  });

  expect(tti).toBeLessThan(5000); // 5 seconds
});
```

### Streaming Response Time

```typescript
test('streaming response time', async () => {
  const chatPage = new ChatPage(page);
  await chatPage.goto(3000);

  const startTime = Date.now();
  await chatPage.sendMessage('Hello');
  await chatPage.waitForStreamingStart();
  const timeToFirstToken = Date.now() - startTime;

  expect(timeToFirstToken).toBeLessThan(1000); // 1 second
});
```

### Memory Leaks

```typescript
test('no memory leaks', async ({ page }) => {
  await page.goto('/');

  // Perform actions
  for (let i = 0; i < 10; i++) {
    await chatPage.sendMessage(`Message ${i}`);
    await chatPage.waitForResponse();
  }

  // Check memory usage
  const metrics = await page.metrics();
  expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024); // 100MB
});
```

---

## Best Practices

### 1. Use Data Attributes for Selection

✅ **Good:**
```typescript
page.locator('[data-testid="message-input"]')
```

❌ **Bad:**
```typescript
page.locator('.css-class-xyz')
page.locator('div > div > input')
```

### 2. Wait for State, Not Timeout

✅ **Good:**
```typescript
await page.waitForSelector('[data-testid="message"]');
await expect(page.locator('#status')).toHaveText('Complete');
```

❌ **Bad:**
```typescript
await page.waitForTimeout(5000);
```

### 3. Test User Behavior, Not Implementation

✅ **Good:**
```typescript
test('user can send message', async () => {
  await chatPage.sendMessage('Hello');
  await chatPage.waitForResponse();
  expect(await chatPage.getLastMessage()).toBeTruthy();
});
```

❌ **Bad:**
```typescript
test('API returns 200', async () => {
  const response = await fetch('/api/chat');
  expect(response.status).toBe(200);
});
```

### 4. Use Page Object Model

✅ **Good:**
```typescript
const chatPage = new ChatPage(page);
await chatPage.sendMessage('Hello');
```

❌ **Bad:**
```typescript
await page.fill('[data-testid="input"]', 'Hello');
await page.click('[data-testid="send"]');
```

### 5. Keep Tests Independent

✅ **Good:**
```typescript
test.beforeEach(async () => {
  // Setup fresh state for each test
});

test('test 1', async () => {
  // Independent test
});

test('test 2', async () => {
  // Independent test
});
```

❌ **Bad:**
```typescript
test('test 1', async () => {
  // Creates data used by test 2
});

test('test 2', async () => {
  // Depends on test 1 running first
});
```

### 6. Use Descriptive Test Names

✅ **Good:**
```typescript
test('should display error message when API returns 500', async () => {
  // ...
});
```

❌ **Bad:**
```typescript
test('error test', async () => {
  // ...
});
```

### 7. Clean Up After Tests

```typescript
test.afterEach(async ({ context }) => {
  // Clear cookies
  await context.clearCookies();

  // Clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

### 8. Use Test Fixtures

```typescript
// Define fixture
export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'auth.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Use fixture
test('admin feature', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/admin');
  // ...
});
```

### 9. Handle Async Properly

✅ **Good:**
```typescript
await chatPage.sendMessage('Hello');
await chatPage.waitForResponse();
const response = await chatPage.getLastMessage();
```

❌ **Bad:**
```typescript
chatPage.sendMessage('Hello');
chatPage.waitForResponse();
const response = chatPage.getLastMessage();
```

### 10. Test Edge Cases

```typescript
test.describe('Edge Cases', () => {
  test('empty input', async () => { /* ... */ });
  test('very long input', async () => { /* ... */ });
  test('special characters', async () => { /* ... */ });
  test('network offline', async () => { /* ... */ });
  test('concurrent requests', async () => { /* ... */ });
});
```

---

## Troubleshooting

### Slow Tests

1. **Use parallel execution**: `--workers=auto`
2. **Shard tests**: `--shard=1/2`
3. **Skip unnecessary waits**: Use auto-waiting
4. **Optimize beforeEach**: Only setup what's needed

### Flaky Tests

1. **Increase timeouts**: For legitimately slow operations
2. **Use auto-retry**: `expect.toPass()`
3. **Wait for state**: Not arbitrary timeouts
4. **Check for race conditions**: Use proper synchronization

### Out of Memory

1. **Close contexts**: After each test
2. **Limit parallel workers**: `--workers=2`
3. **Shard tests**: Distribute across multiple jobs

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Contributing

When adding new E2E tests:

1. Follow the Page Object Model pattern
2. Add tests to the appropriate directory
3. Use descriptive test names
4. Include both happy path and error scenarios
5. Update this documentation if needed
6. Ensure tests pass in CI

---

**Last Updated**: November 2024
**Version**: 1.0.0
