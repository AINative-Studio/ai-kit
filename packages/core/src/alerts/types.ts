/**
 * Alert types and interfaces for cost threshold monitoring
 */

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  /** Informational - approaching threshold (e.g., 75%) */
  INFO = 'info',
  /** Warning - threshold exceeded */
  WARNING = 'warning',
  /** Critical - well over threshold (e.g., 150%) */
  CRITICAL = 'critical',
  /** Recovery - back below threshold */
  RECOVERY = 'recovery',
}

/**
 * Types of thresholds that can be monitored
 */
export enum ThresholdType {
  /** Cost threshold (absolute dollar amounts) */
  COST = 'cost',
  /** Usage threshold (token counts) */
  TOKEN_USAGE = 'token_usage',
  /** Request count threshold */
  REQUEST_COUNT = 'request_count',
  /** Rate threshold (requests per minute/hour) */
  RATE = 'rate',
  /** Budget threshold (percentage of budget consumed) */
  BUDGET_PERCENTAGE = 'budget_percentage',
}

/**
 * Time period for threshold monitoring
 */
export enum ThresholdPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  HOURLY = 'hourly',
  MINUTE = 'minute',
}

/**
 * Alert channel types
 */
export enum AlertChannel {
  /** Callback function */
  CALLBACK = 'callback',
  /** Console logging */
  CONSOLE = 'console',
  /** HTTP webhook */
  WEBHOOK = 'webhook',
  /** Email notification */
  EMAIL = 'email',
  /** Custom channel */
  CUSTOM = 'custom',
}

/**
 * Threshold configuration
 */
export interface Threshold {
  /** Unique identifier for this threshold */
  id: string;
  /** Type of threshold */
  type: ThresholdType;
  /** Time period for monitoring */
  period: ThresholdPeriod;
  /** Threshold value */
  value: number;
  /** Warning level (percentage of threshold, e.g., 0.75 for 75%) */
  warningLevel?: number;
  /** Critical level (percentage of threshold, e.g., 1.5 for 150%) */
  criticalLevel?: number;
  /** Whether this threshold is enabled */
  enabled?: boolean;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Alert data
 */
export interface Alert {
  /** Unique alert identifier */
  id: string;
  /** Alert severity */
  severity: AlertSeverity;
  /** Threshold that triggered this alert */
  threshold: Threshold;
  /** Current value that triggered the alert */
  currentValue: number;
  /** Percentage of threshold consumed */
  percentageOfThreshold: number;
  /** Alert message */
  message: string;
  /** Timestamp when alert was triggered */
  timestamp: Date;
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Alert callback function type
 */
export type AlertCallback = (alert: Alert) => void | Promise<void>;

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  /** HTTP method (default: POST) */
  method?: 'POST' | 'PUT' | 'PATCH';
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry attempts on failure */
  retries?: number;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  /** Recipient email addresses */
  to: string[];
  /** Sender email address */
  from: string;
  /** Email subject template */
  subject?: string;
  /** SMTP configuration or API key */
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
  /** API-based email service config */
  apiKey?: string;
  /** Service provider (e.g., 'sendgrid', 'mailgun') */
  provider?: string;
}

/**
 * Channel-specific configuration
 */
export interface ChannelConfig {
  /** Channel type */
  type: AlertChannel;
  /** Whether this channel is enabled */
  enabled?: boolean;
  /** Callback function (for CALLBACK channel) */
  callback?: AlertCallback;
  /** Webhook configuration (for WEBHOOK channel) */
  webhook?: WebhookConfig;
  /** Email configuration (for EMAIL channel) */
  email?: EmailConfig;
  /** Custom channel handler */
  customHandler?: (alert: Alert) => void | Promise<void>;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Thresholds to monitor */
  thresholds: Threshold[];
  /** Alert channels */
  channels: ChannelConfig[];
  /** Rate limiting config */
  rateLimit?: {
    /** Maximum alerts per period */
    maxAlerts: number;
    /** Period in milliseconds */
    periodMs: number;
  };
  /** Deduplication config */
  deduplication?: {
    /** Enable alert deduplication */
    enabled: boolean;
    /** Deduplication window in milliseconds */
    windowMs: number;
  };
  /** Whether to send recovery notifications */
  sendRecoveryNotifications?: boolean;
}

/**
 * Usage metrics for threshold checking
 */
export interface UsageMetrics {
  /** Total cost */
  cost?: number;
  /** Token usage */
  tokens?: number;
  /** Request count */
  requests?: number;
  /** Rate (requests per unit time) */
  rate?: number;
  /** Budget consumed (percentage) */
  budgetPercentage?: number;
  /** Time period these metrics cover */
  period?: ThresholdPeriod;
  /** Timestamp of metrics */
  timestamp?: Date;
}

/**
 * Alert history entry
 */
export interface AlertHistoryEntry {
  /** Alert data */
  alert: Alert;
  /** Channels the alert was sent to */
  channels: AlertChannel[];
  /** Whether delivery was successful */
  success: boolean;
  /** Error message if delivery failed */
  error?: string;
}
