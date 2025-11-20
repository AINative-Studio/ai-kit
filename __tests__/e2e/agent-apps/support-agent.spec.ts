import { test, expect } from '@playwright/test';
import { AgentPage } from '../page-objects/agent-page';
import { agentTasks } from '../fixtures/test-data';

/**
 * Support Agent E2E Tests
 *
 * Tests the customer support agent application
 * Covers: ticket routing, sentiment analysis, escalation, multi-agent collaboration
 */

test.describe('Support Agent - Ticket Handling', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should load support agent interface', async () => {
    await expect(agentPage.taskInput).toBeVisible();
  });

  test('should submit support ticket', async () => {
    const ticket = `Subject: ${agentTasks.support.ticket.subject}\nDescription: ${agentTasks.support.ticket.description}`;
    await agentPage.startTask(ticket);

    await expect(agentPage.statusIndicator).toBeVisible();
  });

  test('should route ticket to specialist', async () => {
    await agentPage.startTask('Cannot login to my account');
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/route|specialist|authentication/i);
  });

  test('should analyze ticket sentiment', async () => {
    await agentPage.startTask('Very frustrated with the service!');
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/sentiment|emotion|frustrated/i);
  });

  test('should prioritize high-priority tickets', async ({ page }) => {
    await agentPage.startTask('URGENT: System is down');
    await agentPage.waitForCompletion();

    const priority = page.locator('[data-testid="priority"]');
    if (await priority.isVisible()) {
      expect(await priority.textContent()).toMatch(/high|urgent/i);
    }
  });

  test('should handle escalation', async () => {
    await agentPage.startTask('Issue not resolved, need manager');
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/escalate|manager|senior/i);
  });
});

test.describe('Support Agent - Multi-Agent Collaboration', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should collaborate with multiple agents', async () => {
    await agentPage.startTask('Technical billing issue');
    await agentPage.waitForCompletion();

    const steps = await agentPage.getSteps();
    expect(steps.length).toBeGreaterThan(1);
  });

  test('should hand off between agents', async () => {
    await agentPage.startTask('Need technical and billing help');
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results.length).toBeGreaterThan(100);
  });
});

test.describe('Support Agent - Resolution Tracking', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should track resolution status', async ({ page }) => {
    await agentPage.startTask('Simple question');
    await agentPage.waitForCompletion();

    const status = await agentPage.getStatus();
    expect(status).toMatch(/complete|resolved|done/i);
  });

  test('should provide resolution summary', async () => {
    await agentPage.startTask('How do I reset password?');
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/reset|password|steps|instructions/i);
  });

  test('should export ticket report', async () => {
    await agentPage.startTask('Test ticket');
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('json');
    expect(download.suggestedFilename()).toBeTruthy();
  });
});

test.describe('Support Agent - Performance', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should handle tickets efficiently', async () => {
    const startTime = Date.now();
    await agentPage.startTask('Quick question');
    await agentPage.waitForCompletion();
    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(30000);
  });

  test('should process multiple tickets', async () => {
    const tickets = [
      'Ticket 1: Login issue',
      'Ticket 2: Billing question',
      'Ticket 3: Feature request',
    ];

    for (const ticket of tickets) {
      await agentPage.startTask(ticket);
      await agentPage.waitForCompletion();
      await agentPage.clearResults();
    }
  });
});
