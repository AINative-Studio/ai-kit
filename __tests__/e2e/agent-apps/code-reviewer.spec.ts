import { test, expect } from '@playwright/test';
import { AgentPage } from '../page-objects/agent-page';
import { agentTasks } from '../fixtures/test-data';

/**
 * Code Reviewer Agent E2E Tests
 *
 * Tests the code review agent application
 * Covers: code analysis, security checks, style suggestions, performance recommendations
 */

test.describe('Code Reviewer - Core Functionality', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should load code reviewer interface', async () => {
    await expect(agentPage.taskInput).toBeVisible();
    await expect(agentPage.startButton).toBeVisible();
  });

  test('should accept code for review', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await expect(agentPage.statusIndicator).toBeVisible();
  });

  test('should complete code review', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const status = await agentPage.getStatus();
    expect(status).toMatch(/complete|done/i);
  });

  test('should identify code issues', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();

    for (const issue of agentTasks.codeReview.expectedIssues) {
      expect(results.toLowerCase()).toContain(issue.toLowerCase());
    }
  });

  test('should categorize issues by severity', async ({ page }) => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const severities = page.locator('[data-severity], .severity');
    expect(await severities.count()).toBeGreaterThan(0);
  });

  test('should provide fix suggestions', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/suggest|recommend|should|could/i);
  });

  test('should analyze code security', async () => {
    const insecureCode = `
      const password = "hardcoded123";
      eval(userInput);
    `;

    await agentPage.startTask(insecureCode);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/security|vulnerability|risk/i);
  });

  test('should check code style', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/style|format|convention/i);
  });

  test('should suggest performance improvements', async () => {
    const inefficientCode = `
      for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items.length; j++) {
          // O(n²) operation
        }
      }
    `;

    await agentPage.startTask(inefficientCode);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/performance|efficient|optimize/i);
  });

  test('should detect code smells', async () => {
    const smellCode = `
      function doEverything(a, b, c, d, e, f, g) {
        // Long parameter list
        // Long function
        // Multiple responsibilities
      }
    `;

    await agentPage.startTask(smellCode);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results.length).toBeGreaterThan(100);
  });
});

test.describe('Code Reviewer - Review Categories', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should show security vulnerabilities section', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const sections = await agentPage.getResultSections();
    const hasSecuritySection = Object.keys(sections).some(key =>
      key.toLowerCase().includes('security')
    );
    expect(hasSecuritySection).toBe(true);
  });

  test('should show style suggestions section', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const sections = await agentPage.getResultSections();
    const hasStyleSection = Object.keys(sections).some(key =>
      key.toLowerCase().includes('style')
    );
    expect(hasStyleSection).toBe(true);
  });

  test('should show performance recommendations', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    await agentPage.resultsContain('performance');
  });

  test('should provide best practices', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results).toMatch(/best practice|recommend|should/i);
  });
});

test.describe('Code Reviewer - Export & Reports', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should export review as JSON', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('json');
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should export review as PDF', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('pdf');
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should include code snippets in export', async () => {
    await agentPage.startTask(agentTasks.codeReview.code);
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('json');
    expect(download).toBeTruthy();
  });
});

test.describe('Code Reviewer - Multiple Languages', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should review JavaScript code', async () => {
    const jsCode = `function test() { var x = 1; }`;
    await agentPage.startTask(jsCode);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results.length).toBeGreaterThan(0);
  });

  test('should review Python code', async () => {
    const pyCode = `def test():\n    x = 1`;
    await agentPage.startTask(pyCode);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results.length).toBeGreaterThan(0);
  });

  test('should review TypeScript code', async () => {
    const tsCode = `function test(): void { const x: number = 1; }`;
    await agentPage.startTask(tsCode);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results.length).toBeGreaterThan(0);
  });
});
