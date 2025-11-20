/**
 * Comprehensive test suite for UsageDashboard component
 * Tests cover: rendering, filtering, charts, export, responsive behavior, accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { UsageDashboard } from '../../src/components/UsageDashboard';
import type { UsageRecord, ExportFormat, UsageFilter } from '@ainative/ai-kit-core/src/tracking/types';

// Mock URL.createObjectURL and URL.revokeObjectURL for jsdom
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLAnchorElement.click
HTMLAnchorElement.prototype.click = vi.fn();

// Mock usage records for testing
const createMockRecord = (overrides: Partial<UsageRecord> = {}): UsageRecord => ({
  id: `record-${Math.random()}`,
  timestamp: new Date('2024-01-15T10:00:00Z'),
  userId: 'user-1',
  conversationId: 'conv-1',
  provider: 'openai',
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
  durationMs: 1000,
  success: true,
  cost: {
    promptCost: 0.003,
    completionCost: 0.003,
    totalCost: 0.006,
    currency: 'USD',
  },
  ...overrides,
});

const mockRecords: UsageRecord[] = [
  createMockRecord({
    timestamp: new Date('2024-01-15T10:00:00Z'),
    model: 'gpt-4',
    provider: 'openai',
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
    durationMs: 1000,
    success: true,
    cost: {
      promptCost: 0.003,
      completionCost: 0.003,
      totalCost: 0.006,
      currency: 'USD',
    },
  }),
  createMockRecord({
    timestamp: new Date('2024-01-15T11:00:00Z'),
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    promptTokens: 200,
    completionTokens: 100,
    totalTokens: 300,
    durationMs: 800,
    success: true,
    cost: {
      promptCost: 0.0002,
      completionCost: 0.0002,
      totalCost: 0.0004,
      currency: 'USD',
    },
  }),
  createMockRecord({
    timestamp: new Date('2024-01-16T10:00:00Z'),
    model: 'claude-3-opus',
    provider: 'anthropic',
    promptTokens: 150,
    completionTokens: 75,
    totalTokens: 225,
    durationMs: 1200,
    success: true,
    cost: {
      promptCost: 0.0045,
      completionCost: 0.0045,
      totalCost: 0.009,
      currency: 'USD',
    },
  }),
  createMockRecord({
    timestamp: new Date('2024-01-16T12:00:00Z'),
    model: 'gpt-4',
    provider: 'openai',
    promptTokens: 50,
    completionTokens: 25,
    totalTokens: 75,
    durationMs: 500,
    success: false,
    error: 'API Error',
    cost: {
      promptCost: 0,
      completionCost: 0,
      totalCost: 0,
      currency: 'USD',
    },
  }),
  createMockRecord({
    timestamp: new Date('2024-01-17T10:00:00Z'),
    model: 'gpt-4-turbo',
    provider: 'openai',
    promptTokens: 300,
    completionTokens: 150,
    totalTokens: 450,
    durationMs: 1500,
    success: true,
    cost: {
      promptCost: 0.003,
      completionCost: 0.003,
      totalCost: 0.006,
      currency: 'USD',
    },
  }),
];

describe('UsageDashboard Component', () => {
  describe('Basic Rendering', () => {
    it('should render the dashboard with default props', () => {
      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(<UsageDashboard records={mockRecords} testId="custom-dashboard" />);

      expect(screen.getByTestId('custom-dashboard')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<UsageDashboard records={mockRecords} className="custom-class" />);

      const dashboard = screen.getByTestId('usage-dashboard');
      expect(dashboard).toHaveClass('custom-class');
    });

    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      render(<UsageDashboard records={mockRecords} style={customStyle} />);

      const dashboard = screen.getByTestId('usage-dashboard');
      expect(dashboard).toHaveAttribute('style', expect.stringContaining('background-color'));
    });

    it('should render in dark theme', () => {
      render(<UsageDashboard records={mockRecords} theme="dark" />);

      const dashboard = screen.getByTestId('usage-dashboard');
      expect(dashboard).toHaveClass('usage-dashboard-dark');
    });

    it('should render in light theme by default', () => {
      render(<UsageDashboard records={mockRecords} />);

      const dashboard = screen.getByTestId('usage-dashboard');
      expect(dashboard).toHaveClass('usage-dashboard-light');
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      render(<UsageDashboard records={[]} loading />);

      expect(screen.getByTestId('usage-dashboard-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading usage data...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(<UsageDashboard records={[]} error="Failed to load data" />);

      expect(screen.getByTestId('usage-dashboard-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should have role="alert" for error state', () => {
      render(<UsageDashboard records={[]} error="Error message" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display total requests metric', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      expect(screen.getByTestId('usage-dashboard-metric-requests')).toBeInTheDocument();
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // 5 total records
    });

    it('should display total cost metric', () => {
      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard-metric-cost')).toBeInTheDocument();
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
    });

    it('should display total tokens metric', () => {
      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard-metric-tokens')).toBeInTheDocument();
      expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    });

    it('should display average duration metric', () => {
      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard-metric-duration')).toBeInTheDocument();
      expect(screen.getByText('Avg Duration')).toBeInTheDocument();
    });

    it('should hide metrics when showRequestMetrics is false', () => {
      render(<UsageDashboard records={mockRecords} showRequestMetrics={false} />);

      expect(screen.queryByTestId('usage-dashboard-metrics')).not.toBeInTheDocument();
    });

    it('should calculate metrics correctly', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      // Total requests: 5
      expect(screen.getByText('5')).toBeInTheDocument();

      // Successful requests: 4
      expect(screen.getByText('4 successful')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should render filter controls when enableFiltering is true', () => {
      render(<UsageDashboard records={mockRecords} enableFiltering />);

      expect(screen.getByTestId('usage-dashboard-filters')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-date-range-select')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-model-select')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-provider-select')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-status-select')).toBeInTheDocument();
    });

    it('should hide filters when enableFiltering is false', () => {
      render(<UsageDashboard records={mockRecords} enableFiltering={false} />);

      expect(screen.queryByTestId('usage-dashboard-filters')).not.toBeInTheDocument();
    });

    it('should filter by date range', async () => {
      const onFilterChange = vi.fn();
      render(<UsageDashboard records={mockRecords} onFilterChange={onFilterChange} />);

      const dateRangeSelect = screen.getByTestId('usage-dashboard-date-range-select');
      fireEvent.change(dateRangeSelect, { target: { value: 'today' } });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalled();
      });
    });

    it('should filter by model', async () => {
      const onFilterChange = vi.fn();
      render(<UsageDashboard records={mockRecords} onFilterChange={onFilterChange} />);

      const modelSelect = screen.getByTestId('usage-dashboard-model-select');
      fireEvent.change(modelSelect, { target: { value: 'gpt-4' } });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ model: 'gpt-4' })
        );
      });
    });

    it('should filter by provider', async () => {
      const onFilterChange = vi.fn();
      render(<UsageDashboard records={mockRecords} onFilterChange={onFilterChange} />);

      const providerSelect = screen.getByTestId('usage-dashboard-provider-select');
      fireEvent.change(providerSelect, { target: { value: 'openai' } });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ provider: 'openai' })
        );
      });
    });

    it('should filter by success status', async () => {
      const onFilterChange = vi.fn();
      render(<UsageDashboard records={mockRecords} onFilterChange={onFilterChange} />);

      const statusSelect = screen.getByTestId('usage-dashboard-status-select');
      fireEvent.change(statusSelect, { target: { value: 'success' } });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ success: true })
        );
      });
    });

    it('should populate model filter with unique models', () => {
      render(<UsageDashboard records={mockRecords} />);

      const modelSelect = screen.getByTestId('usage-dashboard-model-select') as HTMLSelectElement;
      const options = Array.from(modelSelect.options).map(opt => opt.value);

      expect(options).toContain('gpt-4');
      expect(options).toContain('gpt-3.5-turbo');
      expect(options).toContain('claude-3-opus');
      expect(options).toContain('gpt-4-turbo');
    });

    it('should have default date range preset', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="month" />);

      const dateRangeSelect = screen.getByTestId('usage-dashboard-date-range-select') as HTMLSelectElement;
      expect(dateRangeSelect.value).toBe('month');
    });
  });

  describe('Charts', () => {
    it('should render charts when enableCharts is true', () => {
      render(<UsageDashboard records={mockRecords} enableCharts defaultDateRange="all" />);

      expect(screen.getByTestId('usage-dashboard-cost-chart')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-requests-chart')).toBeInTheDocument();
    });

    it('should hide charts when enableCharts is false', () => {
      render(<UsageDashboard records={mockRecords} enableCharts={false} />);

      expect(screen.queryByTestId('usage-dashboard-cost-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('usage-dashboard-requests-chart')).not.toBeInTheDocument();
    });

    it('should render cost over time chart', () => {
      render(<UsageDashboard records={mockRecords} showCostBreakdown defaultDateRange="all" />);

      expect(screen.getByText('Cost Over Time')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-cost-line-chart')).toBeInTheDocument();
    });

    it('should hide cost chart when showCostBreakdown is false', () => {
      render(<UsageDashboard records={mockRecords} showCostBreakdown={false} />);

      expect(screen.queryByText('Cost Over Time')).not.toBeInTheDocument();
    });

    it('should render requests by model chart', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      expect(screen.getByText('Requests by Model')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-requests-bar-chart')).toBeInTheDocument();
    });

    it('should render token usage chart', () => {
      render(<UsageDashboard records={mockRecords} showTokenUsage defaultDateRange="all" />);

      expect(screen.getByText('Token Usage by Model')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-tokens-bar-chart')).toBeInTheDocument();
    });

    it('should hide token chart when showTokenUsage is false', () => {
      render(<UsageDashboard records={mockRecords} showTokenUsage={false} />);

      expect(screen.queryByText('Token Usage by Model')).not.toBeInTheDocument();
    });

    it('should render bar chart with data', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      const barChart = screen.getByTestId('usage-dashboard-requests-bar-chart');
      expect(barChart).toBeInTheDocument();

      // Should have bars for each model
      const bars = screen.getAllByTestId(/requests-bar-chart-bar-/);
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', () => {
      render(<UsageDashboard records={[]} enableCharts />);

      // Should not crash, charts just won't be visible
      expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should render export controls when enableExport is true', () => {
      const onExport = vi.fn();
      render(<UsageDashboard records={mockRecords} enableExport onExport={onExport} />);

      expect(screen.getByTestId('usage-dashboard-export-format-select')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-export-button')).toBeInTheDocument();
    });

    it('should hide export controls when enableExport is false', () => {
      render(<UsageDashboard records={mockRecords} enableExport={false} />);

      expect(screen.queryByTestId('usage-dashboard-export-button')).not.toBeInTheDocument();
    });

    it('should allow selecting export format', () => {
      const onExport = vi.fn();
      render(<UsageDashboard records={mockRecords} onExport={onExport} />);

      const formatSelect = screen.getByTestId('usage-dashboard-export-format-select') as HTMLSelectElement;
      fireEvent.change(formatSelect, { target: { value: 'csv' } });

      expect(formatSelect.value).toBe('csv');
    });

    it('should call onExport when export button is clicked', async () => {
      const onExport = vi.fn().mockResolvedValue('{"data": "test"}');
      render(<UsageDashboard records={mockRecords} onExport={onExport} />);

      const exportButton = screen.getByTestId('usage-dashboard-export-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(onExport).toHaveBeenCalled();
      });
    });

    it('should show exporting state during export', async () => {
      const onExport = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
      );
      render(<UsageDashboard records={mockRecords} onExport={onExport} />);

      const exportButton = screen.getByTestId('usage-dashboard-export-button');
      fireEvent.click(exportButton);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();
      });
    });

    it('should disable export button during export', async () => {
      const onExport = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('data'), 100))
      );
      render(<UsageDashboard records={mockRecords} onExport={onExport} />);

      const exportButton = screen.getByTestId('usage-dashboard-export-button') as HTMLButtonElement;
      fireEvent.click(exportButton);

      expect(exportButton).toBeDisabled();

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should handle export errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onExport = vi.fn().mockRejectedValue(new Error('Export failed'));
      render(<UsageDashboard records={mockRecords} onExport={onExport} />);

      const exportButton = screen.getByTestId('usage-dashboard-export-button');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Refresh Functionality', () => {
    it('should render refresh button when onRefresh is provided', () => {
      const onRefresh = vi.fn();
      render(<UsageDashboard records={mockRecords} onRefresh={onRefresh} />);

      expect(screen.getByTestId('usage-dashboard-refresh-button')).toBeInTheDocument();
    });

    it('should call onRefresh when refresh button is clicked', () => {
      const onRefresh = vi.fn();
      render(<UsageDashboard records={mockRecords} onRefresh={onRefresh} />);

      const refreshButton = screen.getByTestId('usage-dashboard-refresh-button');
      fireEvent.click(refreshButton);

      expect(onRefresh).toHaveBeenCalled();
    });

    it('should not render refresh button when onRefresh is not provided', () => {
      render(<UsageDashboard records={mockRecords} />);

      expect(screen.queryByTestId('usage-dashboard-refresh-button')).not.toBeInTheDocument();
    });
  });

  describe('Aggregated Data', () => {
    it('should use provided aggregated data', () => {
      const customAggregated = {
        totalRequests: 100,
        successfulRequests: 90,
        failedRequests: 10,
        totalPromptTokens: 10000,
        totalCompletionTokens: 5000,
        totalTokens: 15000,
        totalCost: 1.5,
        avgCostPerRequest: 0.015,
        avgDurationMs: 1200,
        byProvider: {
          openai: { provider: 'openai' as const, totalRequests: 100, successfulRequests: 90, failedRequests: 10, totalTokens: 15000, totalCost: 1.5 },
          anthropic: { provider: 'anthropic' as const, totalRequests: 0, successfulRequests: 0, failedRequests: 0, totalTokens: 0, totalCost: 0 },
          unknown: { provider: 'unknown' as const, totalRequests: 0, successfulRequests: 0, failedRequests: 0, totalTokens: 0, totalCost: 0 },
        },
        byModel: {},
      };

      render(<UsageDashboard records={mockRecords} aggregatedData={customAggregated} defaultDateRange="all" />);

      expect(screen.getByText('100')).toBeInTheDocument(); // Total requests
    });

    it('should calculate aggregated data when not provided', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      // Should calculate from records
      expect(screen.getByText('5')).toBeInTheDocument(); // 5 records
    });
  });

  describe('Responsive Behavior', () => {
    it('should render on mobile viewports', () => {
      // Set viewport to mobile size
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
    });

    it('should render on tablet viewports', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;

      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
    });

    it('should render on desktop viewports', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Calculations', () => {
    it('should calculate success rate correctly', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      // 4 successful out of 5 total
      expect(screen.getByText('4 successful')).toBeInTheDocument();
    });

    it('should calculate total cost correctly', () => {
      render(<UsageDashboard records={mockRecords} />);

      // Should show formatted currency
      const costMetric = screen.getByTestId('usage-dashboard-metric-cost');
      expect(costMetric).toBeInTheDocument();
    });

    it('should calculate total tokens correctly', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      // Total: 150 + 300 + 225 + 75 + 450 = 1200
      expect(screen.getByText('1,200')).toBeInTheDocument();
    });

    it('should handle zero records gracefully', () => {
      render(<UsageDashboard records={[]} defaultDateRange="all" />);

      const requestsMetric = screen.getByTestId('usage-dashboard-metric-requests');
      expect(requestsMetric).toHaveTextContent('0');
    });
  });

  describe('Integration Tests', () => {
    it('should render complete dashboard with all features', () => {
      const onExport = vi.fn();
      const onRefresh = vi.fn();
      const onFilterChange = vi.fn();

      render(
        <UsageDashboard
          records={mockRecords}
          onExport={onExport}
          onRefresh={onRefresh}
          onFilterChange={onFilterChange}
          enableFiltering
          enableExport
          enableCharts
          showCostBreakdown
          showTokenUsage
          showRequestMetrics
          theme="light"
          defaultDateRange="all"
        />
      );

      // Header
      expect(screen.getByText('Usage Analytics')).toBeInTheDocument();

      // Filters
      expect(screen.getByTestId('usage-dashboard-filters')).toBeInTheDocument();

      // Metrics
      expect(screen.getByTestId('usage-dashboard-metrics')).toBeInTheDocument();

      // Charts
      expect(screen.getByText('Cost Over Time')).toBeInTheDocument();
      expect(screen.getByText('Requests by Model')).toBeInTheDocument();
      expect(screen.getByText('Token Usage by Model')).toBeInTheDocument();

      // Actions
      expect(screen.getByTestId('usage-dashboard-refresh-button')).toBeInTheDocument();
      expect(screen.getByTestId('usage-dashboard-export-button')).toBeInTheDocument();
    });

    it('should filter data and update charts', async () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      // Initial state - all records
      expect(screen.getByText('5')).toBeInTheDocument();

      // Filter by model
      const modelSelect = screen.getByTestId('usage-dashboard-model-select');
      fireEvent.change(modelSelect, { target: { value: 'gpt-4' } });

      // Should show filtered count (2 gpt-4 records)
      await waitFor(() => {
        const metric = screen.getByTestId('usage-dashboard-metric-requests');
        expect(metric).toHaveTextContent('2');
      }, { timeout: 3000 });
    });

    it('should work with minimal configuration', () => {
      render(<UsageDashboard records={mockRecords} />);

      expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
    });
  });

  describe('Chart Components', () => {
    it('should render bar chart with correct data', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      const barChart = screen.getByTestId('usage-dashboard-requests-bar-chart');
      expect(barChart).toBeInTheDocument();
    });

    it('should render line chart with correct data', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      const lineChart = screen.getByTestId('usage-dashboard-cost-line-chart');
      expect(lineChart).toBeInTheDocument();
    });

    it('should show values on bar charts', () => {
      render(<UsageDashboard records={mockRecords} defaultDateRange="all" />);

      // Bar charts should show values
      const barChart = screen.getByTestId('usage-dashboard-requests-bar-chart');
      expect(barChart).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle records with missing optional fields', () => {
      const incompleteRecords: UsageRecord[] = [
        createMockRecord({
          userId: undefined,
          conversationId: undefined,
        }),
      ];

      render(<UsageDashboard records={incompleteRecords} defaultDateRange="all" />);

      expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const largeRecords: UsageRecord[] = [
        createMockRecord({
          promptTokens: 1000000,
          completionTokens: 500000,
          totalTokens: 1500000,
        }),
      ];

      render(<UsageDashboard records={largeRecords} defaultDateRange="all" />);

      // Should format large numbers with commas - check in metric card
      const tokensMetric = screen.getByTestId('usage-dashboard-metric-tokens');
      expect(tokensMetric).toHaveTextContent('1,500,000');
    });

    it('should handle very small costs', () => {
      const smallCostRecords: UsageRecord[] = [
        createMockRecord({
          cost: {
            promptCost: 0.0001,
            completionCost: 0.0001,
            totalCost: 0.0002,
            currency: 'USD',
          },
        }),
      ];

      render(<UsageDashboard records={smallCostRecords} defaultDateRange="all" />);

      expect(screen.getByTestId('usage-dashboard-metric-cost')).toBeInTheDocument();
    });
  });
});
