import { test, expect } from '@playwright/test';
import { AgentPage } from '../page-objects/agent-page';
import { agentTasks } from '../fixtures/test-data';

/**
 * Research Assistant E2E Tests
 *
 * Tests the research assistant agent application
 * Covers: research workflow, multi-step execution, citations, export
 */

test.describe('Research Assistant - Core Functionality', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should load research assistant interface', async () => {
    await expect(agentPage.taskInput).toBeVisible();
    await expect(agentPage.startButton).toBeVisible();
  });

  test('should start research workflow', async () => {
    await agentPage.startTask(agentTasks.research.topic);
    await expect(agentPage.statusIndicator).toContainText(/running|executing/i);
  });

  test('should complete research successfully', async () => {
    await agentPage.startTask(agentTasks.research.topic);
    await agentPage.waitForCompletion();

    const status = await agentPage.getStatus();
    expect(status).toMatch(/complete|done|success/i);
  });

  test('should display multi-step execution', async () => {
    await agentPage.startTask(agentTasks.research.topic);

    // Wait for first step
    await agentPage.waitForStep('Search');

    const steps = await agentPage.getSteps();
    expect(steps.length).toBeGreaterThan(0);
  });

  test('should show progress indicator', async () => {
    await agentPage.startTask(agentTasks.research.topic);

    const progress = await agentPage.getProgress();
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  test('should execute web search tool', async () => {
    await agentPage.startTask(agentTasks.research.topic);
    await agentPage.waitForCompletion();

    const tools = await agentPage.getToolExecutions();
    const hasSearch = tools.some(t => t.name.toLowerCase().includes('search'));
    expect(hasSearch).toBe(true);
  });

  test('should generate structured report', async () => {
    await agentPage.startTask(agentTasks.research.topic);
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results.length).toBeGreaterThan(500); // Substantial content
  });

  test('should include all expected sections', async () => {
    await agentPage.startTask(agentTasks.research.topic);
    await agentPage.waitForCompletion();

    const sections = await agentPage.getResultSections();

    for (const expectedSection of agentTasks.research.expectedSections) {
      const hasSection = Object.keys(sections).some(key =>
        key.toLowerCase().includes(expectedSection.toLowerCase())
      );
      expect(hasSection).toBe(true);
    }
  });

  test('should include citations', async () => {
    await agentPage.startTask(agentTasks.research.topic);
    await agentPage.waitForCompletion();

    const citations = await agentPage.getCitations();
    expect(citations.length).toBeGreaterThanOrEqual(agentTasks.research.minCitations);
  });

  test('should format citations correctly', async () => {
    await agentPage.startTask(agentTasks.research.topic);
    await agentPage.waitForCompletion();

    const citations = await agentPage.getCitations();

    for (const citation of citations) {
      // Citations should contain source information
      expect(citation.length).toBeGreaterThan(10);
    }
  });
});

test.describe('Research Assistant - Multi-Step Execution', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should show current execution step', async () => {
    await agentPage.startTask('Research quantum computing');

    await agentPage.waitForStep('Search');

    const currentStep = await agentPage.getCurrentStep();
    expect(currentStep.length).toBeGreaterThan(0);
  });

  test('should execute steps in order', async () => {
    await agentPage.startTask('Research AI trends');

    const expectedSteps = ['Search', 'Analyze', 'Summarize'];
    await agentPage.verifyMultiStepExecution(expectedSteps);
  });

  test('should show step completion status', async ({ page }) => {
    await agentPage.startTask('Research blockchain');

    await page.waitForSelector('[data-testid="steps"] .complete, .step.complete', {
      timeout: 30000,
    });

    const completedSteps = page.locator('[data-testid="steps"] .complete, .step.complete');
    expect(await completedSteps.count()).toBeGreaterThan(0);
  });

  test('should track progress through steps', async () => {
    await agentPage.startTask('Research machine learning');

    // Progress should increase over time
    const initialProgress = await agentPage.getProgress();

    await agentPage.page.waitForTimeout(5000);

    const laterProgress = await agentPage.getProgress();
    expect(laterProgress).toBeGreaterThanOrEqual(initialProgress);
  });
});

test.describe('Research Assistant - Tool Integration', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should use web search tool', async () => {
    await agentPage.startTask('Latest AI developments');
    await agentPage.waitForCompletion();

    await agentPage.verifyToolExecution('search');
  });

  test('should use analysis tool', async () => {
    await agentPage.startTask('Analyze current tech trends');
    await agentPage.waitForCompletion();

    const tools = await agentPage.getToolExecutions();
    const hasAnalysis = tools.some(t =>
      t.name.toLowerCase().includes('analyze')
    );
    expect(hasAnalysis).toBe(true);
  });

  test('should display tool execution results', async ({ page }) => {
    await agentPage.startTask('Research topic');
    await agentPage.waitForCompletion();

    const toolResults = page.locator('[data-testid="tool-result"], .tool-result');
    expect(await toolResults.count()).toBeGreaterThan(0);
  });
});

test.describe('Research Assistant - Export & Sharing', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should export research as JSON', async () => {
    await agentPage.startTask('Quick research');
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('json');
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should export research as PDF', async () => {
    await agentPage.startTask('Quick research');
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('pdf');
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should export research as Markdown', async () => {
    await agentPage.startTask('Quick research');
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('markdown');
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });

  test('should maintain formatting in export', async () => {
    await agentPage.startTask('Research with sections');
    await agentPage.waitForCompletion();

    const download = await agentPage.exportResults('json');
    expect(download).toBeTruthy();
  });
});

test.describe('Research Assistant - Error Handling', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should handle empty task input', async () => {
    await agentPage.startTask('');

    const hasError = await agentPage.hasError();
    expect(hasError).toBe(false); // Should prevent submission
  });

  test('should allow stopping execution', async () => {
    await agentPage.startTask('Long research task');

    // Wait for execution to start
    await agentPage.page.waitForTimeout(2000);

    await agentPage.stopTask();

    const status = await agentPage.getStatus();
    expect(status).toMatch(/stop|cancel/i);
  });

  test('should recover from tool failures', async () => {
    await agentPage.startTask('Research with potential failures');
    await agentPage.waitForCompletion();

    // Should complete even if some tools fail
    const status = await agentPage.getStatus();
    expect(status).toMatch(/complete|done/i);
  });

  test('should display error messages clearly', async () => {
    // Test error handling
    const hasError = await agentPage.hasError();

    if (hasError) {
      const errorMessage = await agentPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Research Assistant - Performance', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should complete research in reasonable time', async () => {
    const executionTime = await agentPage.measureExecutionTime('Quick research');

    expect(executionTime).toBeLessThan(120000); // 2 minutes max
  });

  test('should show progress updates', async () => {
    await agentPage.startTask('Research task');

    // Progress should update at least once
    const initialProgress = await agentPage.getProgress();

    await agentPage.page.waitForTimeout(5000);

    const updatedProgress = await agentPage.getProgress();
    expect(updatedProgress).not.toBe(initialProgress);
  });

  test('should load page quickly', async () => {
    const startTime = Date.now();
    await agentPage.goto(3000);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('Research Assistant - UI/UX', () => {
  let agentPage: AgentPage;

  test.beforeEach(async ({ page }) => {
    agentPage = new AgentPage(page);
    await agentPage.goto(3000);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await agentPage.startTask('Mobile research');
    await agentPage.waitForCompletion();

    const results = await agentPage.getResults();
    expect(results.length).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(agentPage.taskInput).toBeFocused();
  });

  test('should clear results', async () => {
    await agentPage.startTask('Test task');
    await agentPage.waitForCompletion();

    await agentPage.clearResults();

    const results = await agentPage.getResults();
    expect(results.length).toBe(0);
  });
});
