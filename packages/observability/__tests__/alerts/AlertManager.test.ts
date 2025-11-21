/**
 * Comprehensive tests for AlertManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertManager } from '../../src/alerts/AlertManager';
import {
  AlertSeverity,
  AlertChannel,
  ThresholdType,
  ThresholdPeriod,
  AlertConfig,
  Threshold,
  UsageMetrics,
  Alert,
} from '../../src/alerts/types';

describe('AlertManager', () => {
  let alertManager: AlertManager;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCallback = vi.fn();
    const config: AlertConfig = {
      thresholds: [
        {
          id: 'daily-cost',
          type: ThresholdType.COST,
          period: ThresholdPeriod.DAILY,
          value: 100,
          warningLevel: 0.75,
          criticalLevel: 1.5,
        },
        {
          id: 'token-usage',
          type: ThresholdType.TOKEN_USAGE,
          period: ThresholdPeriod.HOURLY,
          value: 10000,
        },
      ],
      channels: [
        {
          type: AlertChannel.CALLBACK,
          callback: mockCallback,
        },
        {
          type: AlertChannel.CONSOLE,
        },
      ],
      deduplication: {
        enabled: true,
        windowMs: 60000, // 1 minute
      },
      rateLimit: {
        maxAlerts: 10,
        periodMs: 60000, // 1 minute
      },
      sendRecoveryNotifications: true,
    };

    alertManager = new AlertManager(config);
  });

  describe('Threshold Detection', () => {
    it('should not trigger alert when below warning level', async () => {
      const metrics: UsageMetrics = {
        cost: 50, // 50% of threshold
        tokens: 5000,
        timestamp: new Date(),
      };

      const alerts = await alertManager.checkThresholds(metrics);
      expect(alerts).toHaveLength(0);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should trigger INFO alert at warning level (75%)', async () => {
      const metrics: UsageMetrics = {
        cost: 75, // 75% of threshold
        tokens: 5000,
        timestamp: new Date(),
      };

      const alerts = await alertManager.checkThresholds(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe(AlertSeverity.INFO);
      expect(alerts[0].percentageOfThreshold).toBe(75);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should trigger WARNING alert when threshold exceeded', async () => {
      const metrics: UsageMetrics = {
        cost: 110, // 110% of threshold
        tokens: 5000,
        timestamp: new Date(),
      };

      const alerts = await alertManager.checkThresholds(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe(AlertSeverity.WARNING);
      expect(alerts[0].percentageOfThreshold).toBeCloseTo(110, 1);
      expect(alerts[0].currentValue).toBe(110);
    });

    it('should trigger CRITICAL alert at critical level (150%)', async () => {
      const metrics: UsageMetrics = {
        cost: 150, // 150% of threshold
        tokens: 5000,
        timestamp: new Date(),
      };

      const alerts = await alertManager.checkThresholds(metrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe(AlertSeverity.CRITICAL);
      expect(alerts[0].percentageOfThreshold).toBe(150);
    });

    it('should check multiple thresholds', async () => {
      const metrics: UsageMetrics = {
        cost: 80, // INFO level
        tokens: 11000, // WARNING level (110%)
        timestamp: new Date(),
      };

      const alerts = await alertManager.checkThresholds(metrics);
      expect(alerts).toHaveLength(2);
      expect(alerts.some((a) => a.threshold.id === 'daily-cost')).toBe(true);
      expect(alerts.some((a) => a.threshold.id === 'token-usage')).toBe(true);
    });
  });

  describe('Alert Severity Levels', () => {
    it('should include correct severity in alert message', async () => {
      const testCases = [
        { cost: 75, expectedSeverity: AlertSeverity.INFO },
        { cost: 110, expectedSeverity: AlertSeverity.WARNING },
        { cost: 160, expectedSeverity: AlertSeverity.CRITICAL },
      ];

      for (const testCase of testCases) {
        const metrics: UsageMetrics = { cost: testCase.cost, timestamp: new Date() };
        const alerts = await alertManager.checkThresholds(metrics);
        expect(alerts[0].severity).toBe(testCase.expectedSeverity);
        expect(alerts[0].message).toContain(testCase.expectedSeverity.toUpperCase());
      }
    });
  });

  describe('Recovery Notifications', () => {
    it('should send RECOVERY alert when value returns to normal', async () => {
      // First, trigger an alert
      const highMetrics: UsageMetrics = { cost: 110, timestamp: new Date() };
      await alertManager.checkThresholds(highMetrics);

      // Then, return to normal
      const normalMetrics: UsageMetrics = { cost: 50, timestamp: new Date() };
      const alerts = await alertManager.checkThresholds(normalMetrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe(AlertSeverity.RECOVERY);
      expect(alerts[0].message).toContain('RECOVERY');
    });

    it('should not send recovery if sendRecoveryNotifications is false', async () => {
      const noRecoveryConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
        sendRecoveryNotifications: false,
      };

      const manager = new AlertManager(noRecoveryConfig);

      // Trigger alert
      await manager.checkThresholds({ cost: 110, timestamp: new Date() });

      // Return to normal
      mockCallback.mockClear();
      const alerts = await manager.checkThresholds({ cost: 50, timestamp: new Date() });

      expect(alerts).toHaveLength(0);
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Alert Deduplication', () => {
    it('should deduplicate alerts within deduplication window', async () => {
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // First alert should go through
      const alerts1 = await alertManager.checkThresholds(metrics);
      expect(alerts1).toHaveLength(1);

      // Second alert within window should be deduplicated
      const alerts2 = await alertManager.checkThresholds(metrics);
      expect(alerts2).toHaveLength(0);
    });

    it('should allow alerts after deduplication window expires', async () => {
      const shortWindowConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
        deduplication: {
          enabled: true,
          windowMs: 100, // 100ms
        },
      };

      const manager = new AlertManager(shortWindowConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // First alert
      await manager.checkThresholds(metrics);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second alert should go through
      mockCallback.mockClear();
      await manager.checkThresholds(metrics);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not deduplicate when disabled', async () => {
      const noDedupConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
        deduplication: {
          enabled: false,
          windowMs: 60000,
        },
      };

      const manager = new AlertManager(noDedupConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      await manager.checkThresholds(metrics);
      await manager.checkThresholds(metrics);

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit alerts when limit exceeded', async () => {
      const rateLimitConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
        rateLimit: {
          maxAlerts: 3,
          periodMs: 60000,
        },
        deduplication: {
          enabled: false,
          windowMs: 0,
        },
      };

      const manager = new AlertManager(rateLimitConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // Send 5 alerts, only first 3 should go through
      for (let i = 0; i < 5; i++) {
        await manager.checkThresholds(metrics);
      }

      expect(mockCallback).toHaveBeenCalledTimes(3);
    });

    it('should reset rate limit after period', async () => {
      const rateLimitConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
        rateLimit: {
          maxAlerts: 2,
          periodMs: 100, // 100ms
        },
        deduplication: {
          enabled: false,
          windowMs: 0,
        },
      };

      const manager = new AlertManager(rateLimitConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // First 2 alerts
      await manager.checkThresholds(metrics);
      await manager.checkThresholds(metrics);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      // Wait for rate limit to reset
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Next alert should go through
      mockCallback.mockClear();
      await manager.checkThresholds(metrics);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alert Channels', () => {
    it('should send alerts to callback channel', async () => {
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };
      await alertManager.checkThresholds(metrics);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      const alert = mockCallback.mock.calls[0][0] as Alert;
      expect(alert.severity).toBe(AlertSeverity.WARNING);
      expect(alert.currentValue).toBe(110);
    });

    it('should send alerts to console channel', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      await alertManager.checkThresholds(metrics);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should send alerts to webhook channel', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      const webhookConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [
          {
            type: AlertChannel.WEBHOOK,
            webhook: {
              url: 'https://example.com/webhook',
              method: 'POST',
              headers: { 'X-API-Key': 'test-key' },
            },
          },
        ],
      };

      const manager = new AlertManager(webhookConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      await manager.checkThresholds(metrics);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key',
          }),
        })
      );
    });

    it('should retry webhook on failure', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true });

      global.fetch = fetchMock;

      const webhookConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [
          {
            type: AlertChannel.WEBHOOK,
            webhook: {
              url: 'https://example.com/webhook',
              retries: 3,
            },
          },
        ],
      };

      const manager = new AlertManager(webhookConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      await manager.checkThresholds(metrics);

      expect(fetchMock).toHaveBeenCalledTimes(2); // Initial attempt + 1 retry
    });

    it('should send alerts to custom channel', async () => {
      const customHandler = vi.fn();

      const customConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [
          {
            type: AlertChannel.CUSTOM,
            customHandler,
          },
        ],
      };

      const manager = new AlertManager(customConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      await manager.checkThresholds(metrics);

      expect(customHandler).toHaveBeenCalledTimes(1);
      expect(customHandler.mock.calls[0][0]).toMatchObject({
        severity: AlertSeverity.WARNING,
        currentValue: 110,
      });
    });

    it('should skip disabled channels', async () => {
      const disabledCallback = vi.fn();

      const config: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [
          {
            type: AlertChannel.CALLBACK,
            callback: disabledCallback,
            enabled: false,
          },
          {
            type: AlertChannel.CALLBACK,
            callback: mockCallback,
            enabled: true,
          },
        ],
      };

      const manager = new AlertManager(config);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      await manager.checkThresholds(metrics);

      expect(disabledCallback).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Threshold Management', () => {
    it('should add new threshold', () => {
      const newThreshold: Threshold = {
        id: 'new-threshold',
        type: ThresholdType.REQUEST_COUNT,
        period: ThresholdPeriod.HOURLY,
        value: 1000,
      };

      alertManager.addThreshold(newThreshold);

      const thresholds = alertManager.getThresholds();
      expect(thresholds).toHaveLength(3);
      expect(thresholds.some((t) => t.id === 'new-threshold')).toBe(true);
    });

    it('should remove threshold', () => {
      alertManager.removeThreshold('daily-cost');

      const thresholds = alertManager.getThresholds();
      expect(thresholds).toHaveLength(1);
      expect(thresholds.some((t) => t.id === 'daily-cost')).toBe(false);
    });

    it('should update threshold', () => {
      const updatedThreshold: Threshold = {
        id: 'daily-cost',
        type: ThresholdType.COST,
        period: ThresholdPeriod.DAILY,
        value: 200, // Changed from 100
        warningLevel: 0.8,
      };

      alertManager.updateThreshold(updatedThreshold);

      const thresholds = alertManager.getThresholds();
      const threshold = thresholds.find((t) => t.id === 'daily-cost');
      expect(threshold?.value).toBe(200);
      expect(threshold?.warningLevel).toBe(0.8);
    });

    it('should not add disabled thresholds', () => {
      const disabledThreshold: Threshold = {
        id: 'disabled',
        type: ThresholdType.COST,
        period: ThresholdPeriod.DAILY,
        value: 100,
        enabled: false,
      };

      alertManager.addThreshold(disabledThreshold);

      const thresholds = alertManager.getThresholds();
      expect(thresholds.some((t) => t.id === 'disabled')).toBe(false);
    });
  });

  describe('Alert History', () => {
    it('should record alert history', async () => {
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };
      await alertManager.checkThresholds(metrics);

      const history = alertManager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].alert.severity).toBe(AlertSeverity.WARNING);
      expect(history[0].channels).toContain(AlertChannel.CALLBACK);
      expect(history[0].success).toBe(true);
    });

    it('should limit history results', async () => {
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // Disable deduplication for this test
      alertManager.updateConfig({
        deduplication: { enabled: false, windowMs: 0 },
      });

      // Generate 5 alerts
      for (let i = 0; i < 5; i++) {
        await alertManager.checkThresholds(metrics);
      }

      const limitedHistory = alertManager.getHistory(3);
      expect(limitedHistory).toHaveLength(3);
    });

    it('should clear history', async () => {
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };
      await alertManager.checkThresholds(metrics);

      expect(alertManager.getHistory()).toHaveLength(1);

      alertManager.clearHistory();

      expect(alertManager.getHistory()).toHaveLength(0);
    });
  });

  describe('State Management', () => {
    it('should reset threshold states', async () => {
      // Trigger an alert
      const highMetrics: UsageMetrics = { cost: 110, timestamp: new Date() };
      await alertManager.checkThresholds(highMetrics);

      // Reset states
      alertManager.resetStates();

      // Check with normal metrics - should not send recovery since state was reset
      const normalMetrics: UsageMetrics = { cost: 50, timestamp: new Date() };
      const alerts = await alertManager.checkThresholds(normalMetrics);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('Multiple Threshold Types', () => {
    it('should handle different threshold types', async () => {
      const multiTypeConfig: AlertConfig = {
        thresholds: [
          {
            id: 'cost-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
          {
            id: 'token-threshold',
            type: ThresholdType.TOKEN_USAGE,
            period: ThresholdPeriod.HOURLY,
            value: 10000,
          },
          {
            id: 'request-threshold',
            type: ThresholdType.REQUEST_COUNT,
            period: ThresholdPeriod.MINUTE,
            value: 100,
          },
          {
            id: 'rate-threshold',
            type: ThresholdType.RATE,
            period: ThresholdPeriod.MINUTE,
            value: 60,
          },
          {
            id: 'budget-threshold',
            type: ThresholdType.BUDGET_PERCENTAGE,
            period: ThresholdPeriod.MONTHLY,
            value: 90,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
      };

      const manager = new AlertManager(multiTypeConfig);
      const metrics: UsageMetrics = {
        cost: 110,
        tokens: 11000,
        requests: 110,
        rate: 65,
        budgetPercentage: 95,
        timestamp: new Date(),
      };

      const alerts = await manager.checkThresholds(metrics);

      expect(alerts).toHaveLength(5);
      expect(alerts.some((a) => a.threshold.type === ThresholdType.COST)).toBe(true);
      expect(alerts.some((a) => a.threshold.type === ThresholdType.TOKEN_USAGE)).toBe(true);
      expect(alerts.some((a) => a.threshold.type === ThresholdType.REQUEST_COUNT)).toBe(true);
      expect(alerts.some((a) => a.threshold.type === ThresholdType.RATE)).toBe(true);
      expect(alerts.some((a) => a.threshold.type === ThresholdType.BUDGET_PERCENTAGE)).toBe(true);
    });
  });

  describe('Alert Message Formatting', () => {
    it('should include all relevant information in alert message', async () => {
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };
      const alerts = await alertManager.checkThresholds(metrics);

      const alert = alerts[0];
      expect(alert.message).toContain('WARNING');
      expect(alert.message).toContain('cost');
      expect(alert.message).toContain('daily');
      expect(alert.message).toContain('110');
      expect(alert.message).toContain('100');
    });

    it('should format recovery message correctly', async () => {
      // Trigger alert
      await alertManager.checkThresholds({ cost: 110, timestamp: new Date() });

      // Recovery
      const alerts = await alertManager.checkThresholds({ cost: 50, timestamp: new Date() });

      expect(alerts[0].message).toContain('RECOVERY');
      expect(alerts[0].message).toContain('returned to normal');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing metrics gracefully', async () => {
      const metrics: UsageMetrics = {
        // cost is missing
        tokens: 5000,
        timestamp: new Date(),
      };

      const alerts = await alertManager.checkThresholds(metrics);
      // Should only check token-usage threshold, not daily-cost
      expect(alerts.length).toBeLessThanOrEqual(1);
    });

    it('should handle zero threshold value', async () => {
      const zeroConfig: AlertConfig = {
        thresholds: [
          {
            id: 'zero-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 0,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
      };

      const manager = new AlertManager(zeroConfig);
      const metrics: UsageMetrics = { cost: 1, timestamp: new Date() };

      const alerts = await manager.checkThresholds(metrics);
      // Any value > 0 should trigger alert for zero threshold
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should handle async callback errors gracefully', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Callback error'));

      const errorConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [{ type: AlertChannel.CALLBACK, callback: errorCallback }],
      };

      const manager = new AlertManager(errorConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // Should not throw
      await expect(manager.checkThresholds(metrics)).resolves.toBeDefined();

      const history = manager.getHistory();
      expect(history[0].success).toBe(false);
      expect(history[0].error).toBe('Callback error');
    });

    it('should handle empty thresholds array', () => {
      const emptyConfig: AlertConfig = {
        thresholds: [],
        channels: [{ type: AlertChannel.CALLBACK, callback: mockCallback }],
      };

      const manager = new AlertManager(emptyConfig);
      expect(manager.getThresholds()).toHaveLength(0);
    });

    it('should handle empty channels array', async () => {
      const noChannelsConfig: AlertConfig = {
        thresholds: [
          {
            id: 'test-threshold',
            type: ThresholdType.COST,
            period: ThresholdPeriod.DAILY,
            value: 100,
          },
        ],
        channels: [],
      };

      const manager = new AlertManager(noChannelsConfig);
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // Should not throw
      await expect(manager.checkThresholds(metrics)).resolves.toBeDefined();
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration dynamically', async () => {
      const metrics: UsageMetrics = { cost: 110, timestamp: new Date() };

      // Initial check
      await alertManager.checkThresholds(metrics);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Update config to disable recovery notifications
      mockCallback.mockClear();
      alertManager.updateConfig({
        sendRecoveryNotifications: false,
      });

      // Recovery should not be sent
      await alertManager.checkThresholds({ cost: 50, timestamp: new Date() });
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
