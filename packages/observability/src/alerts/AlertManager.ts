/**
 * AlertManager - Monitors usage and triggers alerts when thresholds are exceeded
 */

import {
  Alert,
  AlertCallback,
  AlertChannel,
  AlertConfig,
  AlertHistoryEntry,
  AlertSeverity,
  ChannelConfig,
  EmailConfig,
  Threshold,
  ThresholdPeriod,
  ThresholdType,
  UsageMetrics,
  WebhookConfig,
} from './types';

/**
 * Internal state for threshold monitoring
 */
interface ThresholdState {
  threshold: Threshold;
  lastAlertTime?: Date;
  lastSeverity?: AlertSeverity;
  isInAlertState: boolean;
}

/**
 * Rate limiter state
 */
interface RateLimiterState {
  alertCount: number;
  windowStart: Date;
}

/**
 * AlertManager handles cost threshold monitoring and alerting
 */
export class AlertManager {
  private config: AlertConfig;
  private thresholdStates: Map<string, ThresholdState>;
  private alertHistory: AlertHistoryEntry[];
  private rateLimiterState: RateLimiterState;
  private deduplicationCache: Map<string, Date>;

  constructor(config: AlertConfig) {
    this.config = config;
    this.thresholdStates = new Map();
    this.alertHistory = [];
    this.rateLimiterState = {
      alertCount: 0,
      windowStart: new Date(),
    };
    this.deduplicationCache = new Map();

    // Initialize threshold states
    for (const threshold of config.thresholds) {
      if (threshold.enabled !== false) {
        this.thresholdStates.set(threshold.id, {
          threshold,
          isInAlertState: false,
        });
      }
    }
  }

  /**
   * Check usage metrics against all thresholds
   */
  async checkThresholds(metrics: UsageMetrics): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const [id, state] of this.thresholdStates.entries()) {
      const threshold = state.threshold;

      // Get the relevant metric value
      const currentValue = this.getMetricValue(metrics, threshold);
      if (currentValue === undefined) {
        continue;
      }

      // Check if threshold is exceeded
      const severity = this.calculateSeverity(currentValue, threshold);

      if (severity) {
        // Threshold exceeded
        const alert = this.createAlert(threshold, currentValue, severity);

        // Check deduplication
        if (this.shouldSkipDueToDuplication(alert)) {
          continue;
        }

        // Check rate limiting
        if (this.isRateLimited()) {
          continue;
        }

        triggeredAlerts.push(alert);
        await this.sendAlert(alert);

        // Update state
        state.lastAlertTime = new Date();
        state.lastSeverity = severity;
        state.isInAlertState = true;
      } else if (state.isInAlertState && this.config.sendRecoveryNotifications !== false) {
        // Recovery - was in alert state, now back to normal
        const recoveryAlert = this.createAlert(
          threshold,
          currentValue,
          AlertSeverity.RECOVERY
        );

        triggeredAlerts.push(recoveryAlert);
        await this.sendAlert(recoveryAlert);

        // Update state
        state.lastAlertTime = new Date();
        state.lastSeverity = AlertSeverity.RECOVERY;
        state.isInAlertState = false;
      }
    }

    return triggeredAlerts;
  }

  /**
   * Add a new threshold to monitor
   */
  addThreshold(threshold: Threshold): void {
    if (threshold.enabled !== false) {
      this.thresholdStates.set(threshold.id, {
        threshold,
        isInAlertState: false,
      });
    }
  }

  /**
   * Remove a threshold from monitoring
   */
  removeThreshold(thresholdId: string): void {
    this.thresholdStates.delete(thresholdId);
  }

  /**
   * Update an existing threshold
   */
  updateThreshold(threshold: Threshold): void {
    const state = this.thresholdStates.get(threshold.id);
    if (state) {
      state.threshold = threshold;
    }
  }

  /**
   * Get all configured thresholds
   */
  getThresholds(): Threshold[] {
    return Array.from(this.thresholdStates.values()).map((state) => state.threshold);
  }

  /**
   * Get alert history
   */
  getHistory(limit?: number): AlertHistoryEntry[] {
    if (limit) {
      return this.alertHistory.slice(-limit);
    }
    return [...this.alertHistory];
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.alertHistory = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset all threshold states
   */
  resetStates(): void {
    for (const state of this.thresholdStates.values()) {
      state.isInAlertState = false;
      state.lastAlertTime = undefined;
      state.lastSeverity = undefined;
    }
  }

  /**
   * Extract the relevant metric value for a threshold
   */
  private getMetricValue(metrics: UsageMetrics, threshold: Threshold): number | undefined {
    switch (threshold.type) {
      case ThresholdType.COST:
        return metrics.cost;
      case ThresholdType.TOKEN_USAGE:
        return metrics.tokens;
      case ThresholdType.REQUEST_COUNT:
        return metrics.requests;
      case ThresholdType.RATE:
        return metrics.rate;
      case ThresholdType.BUDGET_PERCENTAGE:
        return metrics.budgetPercentage;
      default:
        return undefined;
    }
  }

  /**
   * Calculate alert severity based on current value and threshold
   */
  private calculateSeverity(
    currentValue: number,
    threshold: Threshold
  ): AlertSeverity | null {
    const percentage = currentValue / threshold.value;

    // Critical level (default 150%)
    const criticalLevel = threshold.criticalLevel ?? 1.5;
    if (percentage >= criticalLevel) {
      return AlertSeverity.CRITICAL;
    }

    // Threshold exceeded (100%)
    if (percentage >= 1.0) {
      return AlertSeverity.WARNING;
    }

    // Warning level (default 75%)
    const warningLevel = threshold.warningLevel ?? 0.75;
    if (percentage >= warningLevel) {
      return AlertSeverity.INFO;
    }

    return null;
  }

  /**
   * Create an alert object
   */
  private createAlert(
    threshold: Threshold,
    currentValue: number,
    severity: AlertSeverity
  ): Alert {
    const percentageOfThreshold = (currentValue / threshold.value) * 100;
    const message = this.generateAlertMessage(threshold, currentValue, severity);

    return {
      id: this.generateAlertId(),
      severity,
      threshold,
      currentValue,
      percentageOfThreshold,
      message,
      timestamp: new Date(),
    };
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(
    threshold: Threshold,
    currentValue: number,
    severity: AlertSeverity
  ): string {
    const percentage = ((currentValue / threshold.value) * 100).toFixed(1);

    if (severity === AlertSeverity.RECOVERY) {
      return `[RECOVERY] ${threshold.type} for ${threshold.period} has returned to normal. Current: ${currentValue}, Threshold: ${threshold.value}`;
    }

    return `[${severity.toUpperCase()}] ${threshold.type} threshold exceeded for ${threshold.period}. Current: ${currentValue} (${percentage}% of threshold ${threshold.value})`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if alert should be skipped due to deduplication
   */
  private shouldSkipDueToDuplication(alert: Alert): boolean {
    if (!this.config.deduplication?.enabled) {
      return false;
    }

    const key = `${alert.threshold.id}-${alert.severity}`;
    const lastAlert = this.deduplicationCache.get(key);

    if (lastAlert) {
      const timeSinceLastAlert = Date.now() - lastAlert.getTime();
      const windowMs = this.config.deduplication.windowMs;

      if (timeSinceLastAlert < windowMs) {
        return true; // Skip duplicate
      }
    }

    // Update cache
    this.deduplicationCache.set(key, new Date());
    return false;
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(): boolean {
    if (!this.config.rateLimit) {
      return false;
    }

    const now = new Date();
    const timeSinceWindowStart = now.getTime() - this.rateLimiterState.windowStart.getTime();

    // Reset window if period elapsed
    if (timeSinceWindowStart >= this.config.rateLimit.periodMs) {
      this.rateLimiterState.alertCount = 0;
      this.rateLimiterState.windowStart = now;
      return false;
    }

    // Check if limit exceeded
    if (this.rateLimiterState.alertCount >= this.config.rateLimit.maxAlerts) {
      return true;
    }

    // Increment counter
    this.rateLimiterState.alertCount++;
    return false;
  }

  /**
   * Send alert to all configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    const sentChannels: AlertChannel[] = [];
    let success = true;
    let error: string | undefined;

    for (const channelConfig of this.config.channels) {
      if (channelConfig.enabled === false) {
        continue;
      }

      try {
        await this.sendToChannel(alert, channelConfig);
        sentChannels.push(channelConfig.type);
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : String(err);
      }
    }

    // Record in history
    this.alertHistory.push({
      alert,
      channels: sentChannels,
      success,
      error,
    });
  }

  /**
   * Send alert to a specific channel
   */
  private async sendToChannel(alert: Alert, channelConfig: ChannelConfig): Promise<void> {
    switch (channelConfig.type) {
      case AlertChannel.CALLBACK:
        if (channelConfig.callback) {
          await channelConfig.callback(alert);
        }
        break;

      case AlertChannel.CONSOLE:
        this.sendToConsole(alert);
        break;

      case AlertChannel.WEBHOOK:
        if (channelConfig.webhook) {
          await this.sendToWebhook(alert, channelConfig.webhook);
        }
        break;

      case AlertChannel.EMAIL:
        if (channelConfig.email) {
          await this.sendToEmail(alert, channelConfig.email);
        }
        break;

      case AlertChannel.CUSTOM:
        if (channelConfig.customHandler) {
          await channelConfig.customHandler(alert);
        }
        break;
    }
  }

  /**
   * Send alert to console
   */
  private sendToConsole(alert: Alert): void {
    const logMethod = {
      [AlertSeverity.INFO]: 'info',
      [AlertSeverity.WARNING]: 'warn',
      [AlertSeverity.CRITICAL]: 'error',
      [AlertSeverity.RECOVERY]: 'info',
    }[alert.severity] as 'info' | 'warn' | 'error';

    console[logMethod](`[AlertManager] ${alert.message}`, {
      alertId: alert.id,
      threshold: alert.threshold.id,
      currentValue: alert.currentValue,
      percentage: alert.percentageOfThreshold,
    });
  }

  /**
   * Send alert to webhook
   */
  private async sendToWebhook(alert: Alert, config: WebhookConfig): Promise<void> {
    const maxRetries = config.retries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(config.url, {
          method: config.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify({
            alert: {
              id: alert.id,
              severity: alert.severity,
              message: alert.message,
              currentValue: alert.currentValue,
              threshold: alert.threshold,
              percentage: alert.percentageOfThreshold,
              timestamp: alert.timestamp.toISOString(),
            },
          }),
          signal: config.timeout ? AbortSignal.timeout(config.timeout) : undefined,
        });

        if (!response.ok) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }

        return; // Success
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Webhook failed after retries');
  }

  /**
   * Send alert to email
   * Note: This is a simplified implementation. In production, you'd use a proper email service.
   */
  private async sendToEmail(alert: Alert, config: EmailConfig): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, you would:
    // 1. Use nodemailer for SMTP
    // 2. Use SendGrid/Mailgun/etc API
    // 3. Format HTML email template

    const subject = config.subject || `Alert: ${alert.severity.toUpperCase()} - ${alert.threshold.type}`;
    const body = this.formatEmailBody(alert);

    // For now, just log that email would be sent
    console.info('[AlertManager] Email alert would be sent:', {
      to: config.to,
      from: config.from,
      subject,
      body,
    });

    // In production, implement actual email sending:
    // if (config.smtp) {
    //   await this.sendViaSMTP(config, subject, body);
    // } else if (config.apiKey) {
    //   await this.sendViaAPI(config, subject, body);
    // }
  }

  /**
   * Format email body
   */
  private formatEmailBody(alert: Alert): string {
    return `
Alert Notification
==================

Severity: ${alert.severity.toUpperCase()}
Threshold: ${alert.threshold.type} (${alert.threshold.period})
Current Value: ${alert.currentValue}
Threshold Value: ${alert.threshold.value}
Percentage: ${alert.percentageOfThreshold.toFixed(1)}%

Message: ${alert.message}

Timestamp: ${alert.timestamp.toISOString()}
Alert ID: ${alert.id}
`;
  }
}
