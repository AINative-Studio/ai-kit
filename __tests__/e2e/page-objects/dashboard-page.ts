import { Page, Locator, expect } from '@playwright/test';

/**
 * Dashboard Page Object
 *
 * Encapsulates interactions with dashboard applications
 * Supports: Usage Analytics, Agent Monitor, Admin Panel
 */
export class DashboardPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly dateRangeSelector: Locator;
  readonly refreshButton: Locator;
  readonly exportButton: Locator;
  readonly metricsCards: Locator;
  readonly charts: Locator;
  readonly dataTable: Locator;
  readonly filterPanel: Locator;
  readonly searchInput: Locator;
  readonly themeToggle: Locator;
  readonly alertsButton: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Auth
    this.loginButton = page.locator('[data-testid="login"], button:has-text("Login")');
    this.logoutButton = page.locator('[data-testid="logout"], button:has-text("Logout")');

    // Controls
    this.dateRangeSelector = page.locator('[data-testid="date-range"], select[name="dateRange"]');
    this.refreshButton = page.locator('[data-testid="refresh"], button:has-text("Refresh")');
    this.exportButton = page.locator('[data-testid="export"], button:has-text("Export")');
    this.searchInput = page.locator('[data-testid="search"], input[placeholder*="Search" i]');

    // UI Elements
    this.themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme" i]');
    this.alertsButton = page.locator('[data-testid="alerts"], button:has-text("Alerts")');
    this.settingsButton = page.locator('[data-testid="settings"], button:has-text("Settings")');

    // Data Display
    this.metricsCards = page.locator('[data-testid="metric-card"], .metric-card');
    this.charts = page.locator('[data-testid="chart"], .chart, canvas');
    this.dataTable = page.locator('[data-testid="data-table"], table');
    this.filterPanel = page.locator('[data-testid="filters"], .filter-panel');
  }

  /**
   * Navigate to dashboard
   */
  async goto(port: number = 3002) {
    await this.page.goto(`http://localhost:${port}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login to dashboard
   */
  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"], input[type="email"]', email);
    await this.page.fill('[data-testid="password"], input[type="password"]', password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Logout from dashboard
   */
  async logout() {
    await this.logoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select date range
   */
  async selectDateRange(range: '24h' | '7d' | '30d' | '90d') {
    await this.dateRangeSelector.selectOption(range);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Refresh dashboard
   */
  async refresh() {
    await this.refreshButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get metric value
   */
  async getMetricValue(name: string): Promise<string> {
    const metric = this.page.locator(
      `[data-testid="metric-card"]:has-text("${name}"), .metric-card:has-text("${name}")`
    );
    const value = metric.locator('.metric-value, [data-testid="metric-value"]');
    return (await value.textContent()) || '';
  }

  /**
   * Get all metrics
   */
  async getAllMetrics(): Promise<Record<string, string>> {
    const metrics: Record<string, string> = {};
    const cards = this.metricsCards;
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const label = await card.locator('.metric-label, [data-testid="metric-label"]').textContent();
      const value = await card.locator('.metric-value, [data-testid="metric-value"]').textContent();

      if (label && value) {
        metrics[label.trim()] = value.trim();
      }
    }

    return metrics;
  }

  /**
   * Check if chart is visible
   */
  async isChartVisible(index: number = 0): Promise<boolean> {
    const chart = this.charts.nth(index);
    return await chart.isVisible();
  }

  /**
   * Get chart count
   */
  async getChartCount(): Promise<number> {
    return await this.charts.count();
  }

  /**
   * Export data
   */
  async exportData(format: 'csv' | 'pdf' | 'json' = 'csv') {
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
   * Search in dashboard
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    await this.themeToggle.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if dark mode is active
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator('html');
    const className = (await html.getAttribute('class')) || '';
    const dataTheme = (await html.getAttribute('data-theme')) || '';

    return className.includes('dark') || dataTheme === 'dark';
  }

  /**
   * Apply filter
   */
  async applyFilter(filterName: string, value: string) {
    const filter = this.filterPanel.locator(`[data-filter="${filterName}"]`);
    await filter.selectOption(value);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    const clearButton = this.filterPanel.locator('button:has-text("Clear")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Get table data
   */
  async getTableData(): Promise<Array<Record<string, string>>> {
    const data: Array<Record<string, string>> = [];
    const headers = await this.dataTable.locator('thead th').allTextContents();
    const rows = this.dataTable.locator('tbody tr');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = await row.locator('td').allTextContents();
      const rowData: Record<string, string> = {};

      headers.forEach((header, index) => {
        rowData[header.trim()] = cells[index]?.trim() || '';
      });

      data.push(rowData);
    }

    return data;
  }

  /**
   * Get table row count
   */
  async getTableRowCount(): Promise<number> {
    return await this.dataTable.locator('tbody tr').count();
  }

  /**
   * Sort table by column
   */
  async sortTableByColumn(columnName: string) {
    const header = this.dataTable.locator(`thead th:has-text("${columnName}")`);
    await header.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open alerts
   */
  async openAlerts() {
    await this.alertsButton.click();
    await this.page.waitForSelector('[data-testid="alerts-panel"], .alerts-panel');
  }

  /**
   * Get alert count
   */
  async getAlertCount(): Promise<number> {
    const badge = this.alertsButton.locator('.badge, [data-testid="alert-count"]');
    if (await badge.isVisible()) {
      const text = await badge.textContent();
      return parseInt(text || '0', 10);
    }
    return 0;
  }

  /**
   * Open settings
   */
  async openSettings() {
    await this.settingsButton.click();
    await this.page.waitForSelector('[data-testid="settings-panel"], .settings-panel');
  }

  /**
   * Check real-time updates
   */
  async verifyRealTimeUpdates(metricName: string, timeout: number = 10000) {
    const initialValue = await this.getMetricValue(metricName);

    // Wait for value to change
    await this.page.waitForFunction(
      async ({ name, initial }) => {
        const metric = document.querySelector(
          `[data-testid="metric-card"]:has-text("${name}") .metric-value`
        );
        return metric?.textContent !== initial;
      },
      { name: metricName, initial: initialValue },
      { timeout }
    );

    const newValue = await this.getMetricValue(metricName);
    expect(newValue).not.toBe(initialValue);
  }

  /**
   * Verify chart renders
   */
  async verifyChartRenders(index: number = 0) {
    const chart = this.charts.nth(index);
    await expect(chart).toBeVisible();

    // Check if canvas has content (for canvas-based charts)
    if (await chart.evaluate(el => el.tagName === 'CANVAS')) {
      const hasContent = await chart.evaluate((canvas: any) => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.some((pixel: number) => pixel !== 0);
      });
      expect(hasContent).toBeTruthy();
    }
  }

  /**
   * Measure page load time
   */
  async measurePageLoadTime(): Promise<number> {
    const navigationTiming = await this.page.evaluate(() => {
      const perfData = window.performance.timing;
      return perfData.loadEventEnd - perfData.navigationStart;
    });

    return navigationTiming;
  }

  /**
   * Take dashboard screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Verify responsive layout
   */
  async verifyResponsiveLayout() {
    const viewport = this.page.viewportSize();

    if (viewport && viewport.width < 768) {
      // Mobile: metrics should stack vertically
      const metrics = this.metricsCards;
      const count = await metrics.count();

      for (let i = 0; i < count - 1; i++) {
        const box1 = await metrics.nth(i).boundingBox();
        const box2 = await metrics.nth(i + 1).boundingBox();

        if (box1 && box2) {
          // Y positions should differ (vertical stacking)
          expect(box2.y).toBeGreaterThan(box1.y);
        }
      }
    }
  }
}
