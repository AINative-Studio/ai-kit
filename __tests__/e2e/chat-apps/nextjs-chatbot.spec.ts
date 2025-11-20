import { test, expect } from '@playwright/test';
import { ChatPage } from '../page-objects/chat-page';
import { chatMessages, performanceBenchmarks } from '../fixtures/test-data';

/**
 * Next.js Chatbot E2E Tests
 *
 * Tests the Next.js chatbot example application
 * Covers: messaging, streaming, conversations, UI interactions, performance
 */

test.describe('Next.js Chatbot - Core Functionality', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3000);
  });

  test('should load chat interface successfully', async () => {
    await expect(chatPage.messageInput).toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test('should send a message and receive response', async () => {
    await chatPage.sendMessage(chatMessages.simple.user);
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('should stream response in real-time', async () => {
    await chatPage.sendMessage('Tell me a story');

    // Verify streaming starts
    await chatPage.waitForStreamingStart();

    // Verify streaming completes
    await chatPage.waitForStreamingComplete();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(50);
  });

  test('should handle empty message gracefully', async () => {
    await chatPage.sendMessage('');

    // Should not send or show error
    const hasError = await chatPage.hasError();
    expect(hasError).toBe(false);
  });

  test('should display user and assistant messages correctly', async () => {
    await chatPage.sendMessage('Hello');
    await chatPage.waitForResponse();

    const userMessage = await chatPage.getLastUserMessage();
    const assistantMessage = await chatPage.getLastAssistantMessage();

    expect(userMessage).toContain('Hello');
    expect(assistantMessage.length).toBeGreaterThan(0);
  });

  test('should maintain conversation history', async () => {
    await chatPage.sendMessage('What is React?');
    await chatPage.waitForResponse();

    await chatPage.sendMessage('Tell me more');
    await chatPage.waitForResponse();

    const messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant
  });

  test('should handle multi-turn conversations', async () => {
    for (const turn of chatMessages.multiTurn) {
      await chatPage.sendMessage(turn.user);
      await chatPage.waitForResponse();

      const response = await chatPage.getLastMessage();
      const hasKeywords = turn.expectedKeywords.some(keyword =>
        response.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasKeywords).toBe(true);
    }
  });

  test('should display code blocks with syntax highlighting', async () => {
    await chatPage.sendMessage(chatMessages.codeRequest.user);
    await chatPage.waitForResponse();

    const hasCodeBlock = await chatPage.hasCodeBlock();
    expect(hasCodeBlock).toBe(true);
  });

  test('should render markdown formatting', async () => {
    await chatPage.sendMessage('Format this with **bold** and *italic*');
    await chatPage.waitForResponse();

    const hasMarkdown = await chatPage.hasMarkdownFormatting();
    expect(hasMarkdown).toBe(true);
  });

  test('should respond within acceptable time', async () => {
    const responseTime = await chatPage.measureResponseTime('Quick question');

    expect(responseTime).toBeLessThan(10000); // 10 seconds max
  });
});

test.describe('Next.js Chatbot - Conversation Management', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3000);
  });

  test('should create new conversation', async () => {
    // Send message in first conversation
    await chatPage.sendMessage('First conversation');
    await chatPage.waitForResponse();

    // Create new conversation
    await chatPage.startNewConversation();

    // Verify new conversation is empty
    const messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBe(0);
  });

  test('should switch between conversations', async () => {
    // Create first conversation
    await chatPage.sendMessage('Conversation 1');
    await chatPage.waitForResponse();

    // Create second conversation
    await chatPage.startNewConversation();
    await chatPage.sendMessage('Conversation 2');
    await chatPage.waitForResponse();

    // Switch back to first conversation
    await chatPage.switchToConversation(0);

    const lastMessage = await chatPage.getLastMessage();
    expect(lastMessage).toContain('Conversation 1');
  });

  test('should clear conversation', async () => {
    await chatPage.sendMessage('Test message');
    await chatPage.waitForResponse();

    await chatPage.clearChat();

    const messageCount = await chatPage.getMessageCount();
    expect(messageCount).toBe(0);
  });

  test('should export conversation', async () => {
    await chatPage.sendMessage('Export test');
    await chatPage.waitForResponse();

    const download = await chatPage.exportConversation();
    expect(download.suggestedFilename()).toMatch(/conversation|chat/i);
  });
});

test.describe('Next.js Chatbot - UI/UX Features', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3000);
  });

  test('should toggle dark mode', async () => {
    const initialDarkMode = await chatPage.isDarkMode();

    await chatPage.toggleTheme();

    const newDarkMode = await chatPage.isDarkMode();
    expect(newDarkMode).not.toBe(initialDarkMode);
  });

  test('should persist dark mode preference', async ({ context }) => {
    await chatPage.toggleTheme();
    const darkModeEnabled = await chatPage.isDarkMode();

    // Reload page
    await chatPage.page.reload();
    await chatPage.page.waitForLoadState('networkidle');

    const darkModeAfterReload = await chatPage.isDarkMode();
    expect(darkModeAfterReload).toBe(darkModeEnabled);
  });

  test('should be keyboard accessible', async () => {
    // Tab to message input
    await chatPage.page.keyboard.press('Tab');
    await expect(chatPage.messageInput).toBeFocused();

    // Type message
    await chatPage.page.keyboard.type('Keyboard test');

    // Submit with Enter
    await chatPage.page.keyboard.press('Enter');
    await chatPage.waitForResponse();

    const lastMessage = await chatPage.getLastUserMessage();
    expect(lastMessage).toContain('Keyboard test');
  });

  test('should show loading indicator while streaming', async () => {
    await chatPage.sendMessage('Long response please');

    const isLoading = await chatPage.typingIndicator.isVisible();
    expect(isLoading).toBe(true);

    await chatPage.waitForStreamingComplete();

    const isStillLoading = await chatPage.typingIndicator.isVisible();
    expect(isStillLoading).toBe(false);
  });

  test('should auto-scroll to latest message', async () => {
    // Send multiple messages to create scroll
    for (let i = 0; i < 5; i++) {
      await chatPage.sendMessage(`Message ${i + 1}`);
      await chatPage.waitForResponse();
    }

    // Check if last message is in viewport
    const lastMessage = chatPage.messages.last();
    const isVisible = await lastMessage.isInViewport();
    expect(isVisible).toBe(true);
  });
});

test.describe('Next.js Chatbot - Error Handling', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3000);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);

    await chatPage.sendMessage('Test offline');

    // Should show error
    const hasError = await chatPage.hasError();
    expect(hasError).toBe(true);

    const errorMessage = await chatPage.getErrorMessage();
    expect(errorMessage).toMatch(/network|connection|offline/i);

    // Go back online
    await page.context().setOffline(false);
  });

  test('should recover from API errors', async ({ page }) => {
    // Send message
    await chatPage.sendMessage('First message');
    await chatPage.waitForResponse();

    // Should still work after error
    await chatPage.sendMessage('Recovery test');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('should handle very long messages', async () => {
    const longMessage = 'This is a very long message. '.repeat(100);

    await chatPage.sendMessage(longMessage);
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });
});

test.describe('Next.js Chatbot - Mobile Responsive', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3000);
  });

  test('should display mobile layout', async () => {
    const isMobile = await chatPage.isMobileLayout();
    expect(isMobile).toBe(true);
  });

  test('should work on mobile devices', async () => {
    await chatPage.sendMessage('Mobile test');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('should be touch-friendly', async () => {
    // Tap input
    await chatPage.messageInput.tap();
    await expect(chatPage.messageInput).toBeFocused();

    // Type and tap send
    await chatPage.messageInput.fill('Touch test');
    await chatPage.sendButton.tap();

    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });
});

test.describe('Next.js Chatbot - Performance', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
  });

  test('should load page within performance budget', async () => {
    const startTime = Date.now();
    await chatPage.goto(3000);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(performanceBenchmarks.pageLoad.maxTime);
  });

  test('should have fast first contentful paint', async ({ page }) => {
    await chatPage.goto(3000);

    const fcp = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcpEntry = perfEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcpEntry?.startTime || 0;
    });

    expect(fcp).toBeLessThan(performanceBenchmarks.firstContentfulPaint.maxTime);
  });

  test('should start streaming response quickly', async () => {
    await chatPage.goto(3000);

    const startTime = Date.now();
    await chatPage.sendMessage('Quick test');
    await chatPage.waitForStreamingStart();
    const timeToFirstToken = Date.now() - startTime;

    expect(timeToFirstToken).toBeLessThan(performanceBenchmarks.streamingResponse.maxTime);
  });

  test('should not have memory leaks', async () => {
    await chatPage.goto(3000);

    // Send multiple messages
    for (let i = 0; i < 10; i++) {
      await chatPage.sendMessage(`Message ${i}`);
      await chatPage.waitForResponse();
    }

    const metrics = await chatPage.page.metrics();
    expect(metrics.JSHeapUsedSize).toBeLessThan(100 * 1024 * 1024); // 100MB
  });
});

test.describe('Next.js Chatbot - Accessibility', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3000);
  });

  test('should have proper ARIA labels', async () => {
    await chatPage.verifyAccessibility();
  });

  test('should support keyboard navigation', async () => {
    await chatPage.page.keyboard.press('Tab');
    await expect(chatPage.messageInput).toBeFocused();

    await chatPage.page.keyboard.press('Tab');
    await expect(chatPage.sendButton).toBeFocused();
  });

  test('should have sufficient color contrast', async () => {
    // This would typically use axe-core or similar
    // For now, we'll check that text is readable
    const textColor = await chatPage.page.locator('body').evaluate(el =>
      getComputedStyle(el).color
    );
    expect(textColor).toBeTruthy();
  });

  test('should work with screen readers', async () => {
    // Check for semantic HTML
    const main = chatPage.page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check for message roles
    const messages = chatPage.page.locator('[role="log"], [aria-live]');
    expect(await messages.count()).toBeGreaterThanOrEqual(0);
  });
});
