import { Page, Locator, expect } from '@playwright/test';

/**
 * Agent Page Object
 *
 * Encapsulates interactions with agent applications
 * Supports: Research Assistant, Code Reviewer, Support Agent, Data Analyst
 */
export class AgentPage {
  readonly page: Page;
  readonly taskInput: Locator;
  readonly startButton: Locator;
  readonly stopButton: Locator;
  readonly statusIndicator: Locator;
  readonly progressBar: Locator;
  readonly stepsList: Locator;
  readonly resultsSection: Locator;
  readonly exportButton: Locator;
  readonly clearButton: Locator;
  readonly errorMessage: Locator;
  readonly toolExecutions: Locator;
  readonly citations: Locator;

  constructor(page: Page) {
    this.page = page;

    // Task input
    this.taskInput = page.locator(
      '[data-testid="task-input"], textarea[placeholder*="task" i], textarea[placeholder*="query" i]'
    );
    this.startButton = page.locator(
      '[data-testid="start-button"], button:has-text("Start"), button:has-text("Execute")'
    );
    this.stopButton = page.locator(
      '[data-testid="stop-button"], button:has-text("Stop"), button:has-text("Cancel")'
    );

    // Status and progress
    this.statusIndicator = page.locator('[data-testid="status"], .status');
    this.progressBar = page.locator('[data-testid="progress"], .progress-bar, progress');
    this.stepsList = page.locator('[data-testid="steps"], .steps-list, .execution-steps');

    // Results
    this.resultsSection = page.locator('[data-testid="results"], .results, .output');
    this.toolExecutions = page.locator('[data-testid="tool-execution"], .tool-execution');
    this.citations = page.locator('[data-testid="citation"], .citation');

    // Actions
    this.exportButton = page.locator('[data-testid="export"], button:has-text("Export")');
    this.clearButton = page.locator('[data-testid="clear"], button:has-text("Clear")');
    this.errorMessage = page.locator('[data-testid="error"], .error-message, [role="alert"]');
  }

  /**
   * Navigate to agent page
   */
  async goto(port: number = 3000) {
    await this.page.goto(`http://localhost:${port}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Start agent task
   */
  async startTask(task: string) {
    await this.taskInput.fill(task);
    await this.startButton.click();
  }

  /**
   * Stop agent execution
   */
  async stopTask() {
    await this.stopButton.click();
  }

  /**
   * Wait for task completion
   */
  async waitForCompletion(timeout: number = 120000) {
    await this.page.waitForSelector(
      '[data-testid="status"]:has-text("Complete"), .status:has-text("Complete"), .status:has-text("Done")',
      { timeout }
    );
  }

  /**
   * Get current status
   */
  async getStatus(): Promise<string> {
    return (await this.statusIndicator.textContent()) || '';
  }

  /**
   * Check if agent is running
   */
  async isRunning(): Promise<boolean> {
    const status = await this.getStatus();
    return status.toLowerCase().includes('running') ||
           status.toLowerCase().includes('executing');
  }

  /**
   * Get progress percentage
   */
  async getProgress(): Promise<number> {
    const progressValue = await this.progressBar.getAttribute('value');
    if (progressValue) {
      return parseInt(progressValue, 10);
    }

    const progressText = await this.progressBar.textContent();
    const match = progressText?.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get execution steps
   */
  async getSteps(): Promise<string[]> {
    const steps = this.stepsList.locator('> *');
    const count = await steps.count();
    const stepTexts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await steps.nth(i).textContent();
      if (text) stepTexts.push(text.trim());
    }

    return stepTexts;
  }

  /**
   * Get current step
   */
  async getCurrentStep(): Promise<string> {
    const currentStep = this.stepsList.locator('.active, [data-active="true"]');
    return (await currentStep.textContent()) || '';
  }

  /**
   * Get results
   */
  async getResults(): Promise<string> {
    await this.resultsSection.waitFor({ state: 'visible' });
    return (await this.resultsSection.textContent()) || '';
  }

  /**
   * Get tool executions
   */
  async getToolExecutions(): Promise<Array<{ name: string; status: string }>> {
    const tools = this.toolExecutions;
    const count = await tools.count();
    const executions: Array<{ name: string; status: string }> = [];

    for (let i = 0; i < count; i++) {
      const tool = tools.nth(i);
      const name = await tool.locator('.tool-name').textContent() || '';
      const status = await tool.locator('.tool-status').textContent() || '';
      executions.push({ name: name.trim(), status: status.trim() });
    }

    return executions;
  }

  /**
   * Get citations
   */
  async getCitations(): Promise<string[]> {
    const count = await this.citations.count();
    const citationTexts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.citations.nth(i).textContent();
      if (text) citationTexts.push(text.trim());
    }

    return citationTexts;
  }

  /**
   * Export results
   */
  async exportResults(format: 'json' | 'pdf' | 'markdown' = 'json') {
    const downloadPromise = this.page.waitForEvent('download');

    // Select format if dropdown exists
    const formatSelector = this.page.locator('[data-testid="export-format"]');
    if (await formatSelector.isVisible()) {
      await formatSelector.selectOption(format);
    }

    await this.exportButton.click();
    return await downloadPromise;
  }

  /**
   * Clear results
   */
  async clearResults() {
    await this.clearButton.click();

    // Handle confirmation if present
    const confirmButton = this.page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  /**
   * Check if error occurred
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return (await this.errorMessage.textContent()) || '';
    }
    return '';
  }

  /**
   * Wait for specific step
   */
  async waitForStep(stepName: string, timeout: number = 30000) {
    await this.page.waitForSelector(
      `[data-testid="steps"] :has-text("${stepName}")`,
      { timeout }
    );
  }

  /**
   * Measure execution time
   */
  async measureExecutionTime(task: string): Promise<number> {
    const startTime = Date.now();
    await this.startTask(task);
    await this.waitForCompletion();
    return Date.now() - startTime;
  }

  /**
   * Check if results contain text
   */
  async resultsContain(text: string): Promise<boolean> {
    const results = await this.getResults();
    return results.toLowerCase().includes(text.toLowerCase());
  }

  /**
   * Check if results contain all keywords
   */
  async resultsContainAll(keywords: string[]): Promise<boolean> {
    const results = (await this.getResults()).toLowerCase();
    return keywords.every(keyword => results.includes(keyword.toLowerCase()));
  }

  /**
   * Get result sections
   */
  async getResultSections(): Promise<Record<string, string>> {
    const sections: Record<string, string> = {};
    const headings = this.resultsSection.locator('h1, h2, h3');
    const count = await headings.count();

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const title = (await heading.textContent())?.trim() || '';

      // Get content until next heading
      const content = await this.page.evaluate(
        (el) => {
          let text = '';
          let sibling = el.nextElementSibling;

          while (sibling && !['H1', 'H2', 'H3'].includes(sibling.tagName)) {
            text += sibling.textContent + '\n';
            sibling = sibling.nextElementSibling;
          }

          return text.trim();
        },
        await heading.elementHandle()
      );

      sections[title] = content;
    }

    return sections;
  }

  /**
   * Verify multi-step execution
   */
  async verifyMultiStepExecution(expectedSteps: string[]) {
    for (const step of expectedSteps) {
      await this.waitForStep(step);
    }

    const actualSteps = await this.getSteps();
    expect(actualSteps.length).toBeGreaterThanOrEqual(expectedSteps.length);
  }

  /**
   * Verify tool execution
   */
  async verifyToolExecution(toolName: string) {
    const executions = await this.getToolExecutions();
    const tool = executions.find(t => t.name.includes(toolName));

    expect(tool).toBeDefined();
    expect(tool?.status).toContain('success');
  }

  /**
   * Take screenshot of agent execution
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
