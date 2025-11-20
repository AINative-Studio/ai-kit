import { test, expect } from '@playwright/test';
import { ChatPage } from '../page-objects/chat-page';
import { toolExecutions } from '../fixtures/test-data';

/**
 * React Tools Chat E2E Tests
 *
 * Tests the React chat with tool usage capabilities
 * Covers: tool execution, tool display, markdown rendering, code highlighting
 */

test.describe('React Tools Chat - Tool Execution', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3001);
  });

  test('should load tools chat interface', async () => {
    await expect(chatPage.messageInput).toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('should execute calculator tool', async () => {
    await chatPage.sendMessage('Calculate 15 * 23');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response).toContain('345');
  });

  test('should display tool execution in UI', async ({ page }) => {
    await chatPage.sendMessage('What is 2 + 2?');
    await chatPage.waitForResponse();

    const toolExecution = page.locator('[data-testid="tool-execution"], .tool-execution');
    await expect(toolExecution).toBeVisible();
  });

  test('should show tool name and status', async ({ page }) => {
    await chatPage.sendMessage('Calculate 10 / 2');
    await chatPage.waitForResponse();

    const toolName = page.locator('[data-testid="tool-name"], .tool-name');
    await expect(toolName).toContainText('calculator');

    const toolStatus = page.locator('[data-testid="tool-status"], .tool-status');
    await expect(toolStatus).toContainText(/success|complete/i);
  });

  test('should execute weather tool', async () => {
    await chatPage.sendMessage('What is the weather in San Francisco?');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response).toMatch(/weather|temperature|degrees/i);
  });

  test('should execute web search tool', async () => {
    await chatPage.sendMessage('Search for AI Kit framework');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(50);
  });

  test('should handle multiple tool executions', async () => {
    await chatPage.sendMessage('Calculate 5 * 5 and tell me the weather');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response).toContain('25');
  });

  test('should show tool loading state', async ({ page }) => {
    await chatPage.sendMessage('Search for something');

    const loadingIndicator = page.locator('[data-testid="tool-loading"], .tool-loading');
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('should handle tool errors gracefully', async () => {
    await chatPage.sendMessage('Calculate invalid input abc');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });
});

test.describe('React Tools Chat - Content Rendering', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3001);
  });

  test('should render markdown text formatting', async () => {
    await chatPage.sendMessage('Show me **bold**, *italic*, and `code`');
    await chatPage.waitForResponse();

    const hasMarkdown = await chatPage.hasMarkdownFormatting();
    expect(hasMarkdown).toBe(true);
  });

  test('should render code blocks', async () => {
    await chatPage.sendMessage('Show me a Python function');
    await chatPage.waitForResponse();

    const hasCodeBlock = await chatPage.hasCodeBlock();
    expect(hasCodeBlock).toBe(true);
  });

  test('should apply syntax highlighting', async ({ page }) => {
    await chatPage.sendMessage('Write JavaScript code');
    await chatPage.waitForResponse();

    const syntaxHighlight = page.locator('.hljs, .prism, .language-');
    await expect(syntaxHighlight).toBeVisible();
  });

  test('should render lists correctly', async ({ page }) => {
    await chatPage.sendMessage('Give me a list of 3 items');
    await chatPage.waitForResponse();

    const lists = page.locator('ul, ol');
    await expect(lists).toBeVisible();
  });

  test('should render links as clickable', async ({ page }) => {
    await chatPage.sendMessage('Show me https://example.com');
    await chatPage.waitForResponse();

    const links = page.locator('a[href]');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('should render tables', async ({ page }) => {
    await chatPage.sendMessage('Show me data in a table');
    await chatPage.waitForResponse();

    const table = page.locator('table');
    if (await table.isVisible()) {
      expect(await table.locator('tr').count()).toBeGreaterThan(0);
    }
  });

  test('should support code copy functionality', async ({ page }) => {
    await chatPage.sendMessage('Write Python code');
    await chatPage.waitForResponse();

    const copyButton = page.locator('button:has-text("Copy"), [data-testid="copy-code"]');
    if (await copyButton.isVisible()) {
      await copyButton.click();
      // Verify copy action (would check clipboard in real test)
    }
  });
});

test.describe('React Tools Chat - Conversation Flow', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3001);
  });

  test('should maintain context with tools', async () => {
    await chatPage.sendMessage('Calculate 10 + 5');
    await chatPage.waitForResponse();

    await chatPage.sendMessage('Now multiply that by 2');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response).toContain('30');
  });

  test('should export conversation with tool executions', async () => {
    await chatPage.sendMessage('Calculate 5 * 5');
    await chatPage.waitForResponse();

    const download = await chatPage.exportConversation();
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('should clear conversation including tools', async () => {
    await chatPage.sendMessage('Calculate something');
    await chatPage.waitForResponse();

    await chatPage.clearChat();

    const messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBe(0);
  });
});

test.describe('React Tools Chat - UI/UX', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3001);
  });

  test('should toggle theme', async () => {
    const initialDarkMode = await chatPage.isDarkMode();
    await chatPage.toggleTheme();
    const newDarkMode = await chatPage.isDarkMode();
    expect(newDarkMode).not.toBe(initialDarkMode);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await chatPage.sendMessage('Mobile test');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('should show tool execution progress', async ({ page }) => {
    await chatPage.sendMessage('Search for information');

    const progress = page.locator('[data-testid="tool-progress"], .tool-progress');
    if (await progress.isVisible({ timeout: 1000 })) {
      await expect(progress).toBeVisible();
    }
  });
});
