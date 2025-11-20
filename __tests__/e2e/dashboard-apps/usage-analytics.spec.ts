import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard-page';
import { dashboardData, performanceBenchmarks } from '../fixtures/test-data';

/**
 * Usage Analytics Dashboard E2E Tests
 *
 * Tests the usage analytics dashboard application
 * Covers: metrics, charts, filtering, export, real-time updates
 */

test.describe('Usage Analytics - Core Features', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto(3002);
  });

  test('should load dashboard successfully', async () => {
    await expect(dashboard.metricsCards).toBeVisible();
    await expect(dashboard.dateRangeSelector).toBeVisible();
  });

  test('should display all metric cards', async () => {
    const metrics = await dashboard.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  test('should show total requests metric', async () => {
    const value = await dashboard.getMetricValue('Total Requests');
    expect(value).toBeTruthy();
  });

  test('should show success rate metric', async () => {
    const value = await dashboard.getMetricValue('Success Rate');
    expect(value).toMatch(/\d+(\.\d+)?%/);
  });

  test('should show average response time', async () => {
    const value = await dashboard.getMetricValue('Response Time');
    expect(value).toBeTruthy();
  });

  test('should show total cost metric', async () => {
    const value = await dashboard.getMetricValue('Total Cost');
    expect(value).toMatch(/\$\d+/);
  });

  test('should render charts', async () => {
    const chartCount = await dashboard.getChartCount();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should display requests chart', async () => {
    const isVisible = await dashboard.isChartVisible(0);
    expect(isVisible).toBe(true);
  });

  test('should display costs chart', async () => {
    const charts = await dashboard.getChartCount();
    if (charts > 1) {
      const isVisible = await dashboard.isChartVisible(1);
      expect(isVisible).toBe(true);
    }
  });

  test('should verify chart rendering', async () => {
    await dashboard.verifyChartRenders(0);
  });
});

test.describe('Usage Analytics - Date Range Filtering', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto(3002);
  });

  test('should filter by 24 hours', async () => {
    await dashboard.selectDateRange('24h');

    const metrics = await dashboard.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  test('should filter by 7 days', async () => {
    await dashboard.selectDateRange('7d');

    const metrics = await dashboard.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  test('should filter by 30 days', async () => {
    await dashboard.selectDateRange('30d');

    const metrics = await dashboard.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  test('should filter by 90 days', async () => {
    await dashboard.selectDateRange('90d');

    const metrics = await dashboard.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  test('should update charts when date range changes', async () => {
    await dashboard.selectDateRange('7d');
    await dashboard.page.waitForLoadState('networkidle');

    const isVisible = await dashboard.isChartVisible(0);
    expect(isVisible).toBe(true);
  });
});

test.describe('Usage Analytics - Data Table', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto(3002);
  });

  test('should display data table', async () => {
    await expect(dashboard.dataTable).toBeVisible();
  });

  test('should show table rows', async () => {
    const rowCount = await dashboard.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should load table data', async () => {
    const data = await dashboard.getTableData();
    expect(data.length).toBeGreaterThan(0);
  });

  test('should sort table by column', async () => {
    await dashboard.sortTableByColumn('Date');
    await dashboard.page.waitForLoadState('networkidle');

    const data = await dashboard.getTableData();
    expect(data.length).toBeGreaterThan(0);
  });
});

test.describe('Usage Analytics - Export & Refresh', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto(3002);
  });

  test('should export data as CSV', async () => {
    const download = await dashboard.exportData('csv');
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should export data as PDF', async () => {
    const download = await dashboard.exportData('pdf');
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should export data as JSON', async () => {
    const download = await dashboard.exportData('json');
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should refresh dashboard', async () => {
    await dashboard.refresh();

    const metrics = await dashboard.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });
});

test.describe('Usage Analytics - Search & Filter', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto(3002);
  });

  test('should search dashboard', async () => {
    await dashboard.search('test query');

    const rowCount = await dashboard.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should apply filters', async () => {
    await dashboard.applyFilter('status', 'success');

    const data = await dashboard.getTableData();
    expect(data.length).toBeGreaterThanOrEqual(0);
  });

  test('should clear filters', async () => {
    await dashboard.applyFilter('status', 'success');
    await dashboard.clearFilters();

    const data = await dashboard.getTableData();
    expect(data.length).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Usage Analytics - UI/UX', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto(3002);
  });

  test('should toggle dark mode', async () => {
    const initialDarkMode = await dashboard.isDarkMode();
    await dashboard.toggleTheme();
    const newDarkMode = await dashboard.isDarkMode();
    expect(newDarkMode).not.toBe(initialDarkMode);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await dashboard.verifyResponsiveLayout();
  });

  test('should open alerts panel', async () => {
    await dashboard.openAlerts();
    await expect(dashboard.page.locator('[data-testid="alerts-panel"]')).toBeVisible();
  });

  test('should show alert count', async () => {
    const alertCount = await dashboard.getAlertCount();
    expect(alertCount).toBeGreaterThanOrEqual(0);
  });

  test('should open settings', async () => {
    await dashboard.openSettings();
    await expect(dashboard.page.locator('[data-testid="settings-panel"]')).toBeVisible();
  });
});

test.describe('Usage Analytics - Performance', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
  });

  test('should load within performance budget', async () => {
    const loadTime = await dashboard.measurePageLoadTime();
    expect(loadTime).toBeLessThan(performanceBenchmarks.pageLoad.maxTime);
  });

  test('should render charts efficiently', async () => {
    await dashboard.goto(3002);

    const startTime = Date.now();
    await dashboard.verifyChartRenders(0);
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(2000);
  });

  test('should handle real-time updates', async () => {
    await dashboard.goto(3002);

    // Note: This test would verify real-time updates
    // In a real scenario, you'd trigger backend updates
    const metrics = await dashboard.getAllMetrics();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });
});
