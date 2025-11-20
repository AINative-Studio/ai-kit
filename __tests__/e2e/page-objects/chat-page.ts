import { Page, Locator, expect } from '@playwright/test';

/**
 * Chat Page Object
 *
 * Encapsulates interactions with chat applications
 * Supports: Next.js Chatbot, React Chat, Vue Assistant, Svelte Chat
 */
export class ChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messages: Locator;
  readonly conversationList: Locator;
  readonly newConversationButton: Locator;
  readonly themeToggle: Locator;
  readonly exportButton: Locator;
  readonly clearButton: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly typingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Input elements
    this.messageInput = page.locator('[data-testid="message-input"], textarea[placeholder*="message" i]');
    this.sendButton = page.locator('[data-testid="send-button"], button[type="submit"]');

    // Message display
    this.messages = page.locator('[data-testid="message"], .message, [role="log"] > div');
    this.typingIndicator = page.locator('[data-testid="typing-indicator"], .typing-indicator');
    this.loadingIndicator = page.locator('[data-testid="loading"], .loading');

    // Conversation management
    this.conversationList = page.locator('[data-testid="conversation-list"], .conversation-list');
    this.newConversationButton = page.locator('[data-testid="new-conversation"], button:has-text("New")');
    this.clearButton = page.locator('[data-testid="clear-chat"], button:has-text("Clear")');

    // UI controls
    this.themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme" i]');
    this.exportButton = page.locator('[data-testid="export"], button:has-text("Export")');
    this.errorMessage = page.locator('[data-testid="error"], .error-message, [role="alert"]');
  }

  /**
   * Navigate to chat page
   */
  async goto(port: number = 3000) {
    await this.page.goto(`http://localhost:${port}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Send a message
   */
  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  /**
   * Wait for response to complete
   */
  async waitForResponse(timeout: number = 30000) {
    // Wait for typing indicator to appear (streaming started)
    try {
      await this.typingIndicator.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Typing indicator may not appear for fast responses
    }

    // Wait for typing indicator to disappear (streaming completed)
    await this.typingIndicator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Get last message content
   */
  async getLastMessage(): Promise<string> {
    const lastMessage = this.messages.last();
    await lastMessage.waitFor({ state: 'visible' });
    return await lastMessage.textContent() || '';
  }

  /**
   * Get all messages
   */
  async getAllMessages(): Promise<string[]> {
    await this.messages.first().waitFor({ state: 'visible' });
    const messages = await this.messages.allTextContents();
    return messages.filter(m => m.trim().length > 0);
  }

  /**
   * Get message count
   */
  async getMessageCount(): Promise<number> {
    return await this.messages.count();
  }

  /**
   * Get last user message
   */
  async getLastUserMessage(): Promise<string> {
    const userMessage = this.page.locator('[data-testid="user-message"], .user-message').last();
    return await userMessage.textContent() || '';
  }

  /**
   * Get last assistant message
   */
  async getLastAssistantMessage(): Promise<string> {
    const assistantMessage = this.page.locator('[data-testid="assistant-message"], .assistant-message').last();
    return await assistantMessage.textContent() || '';
  }

  /**
   * Start new conversation
   */
  async startNewConversation() {
    await this.newConversationButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to conversation
   */
  async switchToConversation(index: number) {
    const conversations = this.conversationList.locator('> *');
    await conversations.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear chat
   */
  async clearChat() {
    await this.clearButton.click();

    // Handle confirmation dialog if present
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    await this.themeToggle.click();
    // Wait for theme transition
    await this.page.waitForTimeout(500);
  }

  /**
   * Export conversation
   */
  async exportConversation() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return await downloadPromise;
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.errorMessage.textContent() || '';
    }
    return '';
  }

  /**
   * Check if message contains text
   */
  async messageContains(text: string): Promise<boolean> {
    const lastMessage = await this.getLastMessage();
    return lastMessage.toLowerCase().includes(text.toLowerCase());
  }

  /**
   * Check if message contains any of the keywords
   */
  async messageContainsAny(keywords: string[]): Promise<boolean> {
    const lastMessage = (await this.getLastMessage()).toLowerCase();
    return keywords.some(keyword => lastMessage.includes(keyword.toLowerCase()));
  }

  /**
   * Wait for streaming to start
   */
  async waitForStreamingStart() {
    await this.typingIndicator.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for streaming to complete
   */
  async waitForStreamingComplete() {
    await this.typingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Check if chat is in dark mode
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator('html');
    const className = await html.getAttribute('class') || '';
    const dataTheme = await html.getAttribute('data-theme') || '';

    return className.includes('dark') || dataTheme === 'dark';
  }

  /**
   * Check if mobile responsive
   */
  async isMobileLayout(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 768 : false;
  }

  /**
   * Take screenshot of chat
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Measure response time
   */
  async measureResponseTime(message: string): Promise<number> {
    const startTime = Date.now();
    await this.sendMessage(message);
    await this.waitForResponse();
    return Date.now() - startTime;
  }

  /**
   * Check message formatting
   */
  async hasCodeBlock(): Promise<boolean> {
    const codeBlock = this.page.locator('pre code, .code-block');
    return await codeBlock.isVisible();
  }

  /**
   * Check if message has markdown formatting
   */
  async hasMarkdownFormatting(): Promise<boolean> {
    const formatted = this.page.locator('strong, em, code, ul, ol, h1, h2, h3');
    return (await formatted.count()) > 0;
  }

  /**
   * Verify accessibility
   */
  async verifyAccessibility() {
    // Check for ARIA labels
    await expect(this.messageInput).toHaveAttribute('aria-label', /.+/);
    await expect(this.sendButton).toHaveAttribute('aria-label', /.+/);

    // Check keyboard navigation
    await this.messageInput.focus();
    await expect(this.messageInput).toBeFocused();
  }
}
