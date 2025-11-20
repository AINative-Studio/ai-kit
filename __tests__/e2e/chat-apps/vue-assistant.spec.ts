import { test, expect } from '@playwright/test';
import { ChatPage } from '../page-objects/chat-page';

/**
 * Vue Assistant E2E Tests
 *
 * Tests the Vue.js assistant chat application
 * Covers: Vue-specific features, composition API, reactivity
 */

test.describe('Vue Assistant - Core Features', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3003);
  });

  test('should load Vue assistant', async () => {
    await expect(chatPage.messageInput).toBeVisible();
  });

  test('should send and receive messages', async () => {
    await chatPage.sendMessage('Hello Vue');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });

  test('should handle streaming responses', async () => {
    await chatPage.sendMessage('Tell me about Vue 3');
    await chatPage.waitForStreamingStart();
    await chatPage.waitForStreamingComplete();

    const response = await chatPage.getLastMessage();
    expect(response).toMatch(/vue|composition|reactivity/i);
  });

  test('should maintain reactive state', async () => {
    await chatPage.sendMessage('First message');
    await chatPage.waitForResponse();

    await chatPage.sendMessage('Second message');
    await chatPage.waitForResponse();

    const count = await chatPage.getMessageCount();
    expect(count).toBe(4);
  });

  test('should toggle dark mode', async () => {
    const initialDarkMode = await chatPage.isDarkMode();
    await chatPage.toggleTheme();
    const newDarkMode = await chatPage.isDarkMode();
    expect(newDarkMode).not.toBe(initialDarkMode);
  });
});

test.describe('Vue Assistant - Composition API', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3003);
  });

  test('should use composition API', async ({ page }) => {
    // Verify Vue 3 Composition API is being used
    const vueVersion = await page.evaluate(() => {
      return (window as any).__VUE__?.version || 'unknown';
    });

    expect(vueVersion).toMatch(/^3\./);
  });

  test('should have reactive refs', async () => {
    await chatPage.sendMessage('Test reactivity');
    await chatPage.waitForResponse();

    // Verify reactive updates
    const response = await chatPage.getLastMessage();
    expect(response).toBeTruthy();
  });
});

test.describe('Vue Assistant - Performance', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
  });

  test('should render efficiently', async () => {
    const startTime = Date.now();
    await chatPage.goto(3003);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle multiple messages efficiently', async () => {
    await chatPage.goto(3003);

    for (let i = 0; i < 5; i++) {
      await chatPage.sendMessage(`Message ${i}`);
      await chatPage.waitForResponse();
    }

    const count = await chatPage.getMessageCount();
    expect(count).toBeGreaterThanOrEqual(10);
  });
});

test.describe('Vue Assistant - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto(3003);
  });

  test('should work on mobile', async () => {
    await chatPage.sendMessage('Mobile test');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastMessage();
    expect(response.length).toBeGreaterThan(0);
  });
});
