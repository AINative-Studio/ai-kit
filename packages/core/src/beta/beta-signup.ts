import type {
  BetaSignupData,
  BetaSignupResult,
  BetaSignupStatus,
  BetaSignupListOptions,
  BetaSignupListResult,
} from './types';

export interface BetaSignupManagerOptions {
  rateLimitWindow?: number;
  maxRequestsPerEmail?: number;
  globalMaxRequests?: number;
}

export class BetaSignupManager {
  private signups: Map<string, BetaSignupResult>;
  private rateLimitMap: Map<string, number[]>;
  private globalRequests: number[];
  private readonly RATE_LIMIT_WINDOW: number;
  private readonly MAX_REQUESTS: number;
  private readonly GLOBAL_MAX_REQUESTS: number;

  constructor(options: BetaSignupManagerOptions = {}) {
    this.signups = new Map();
    this.rateLimitMap = new Map();
    this.globalRequests = [];
    this.RATE_LIMIT_WINDOW = options.rateLimitWindow ?? 60000; // 1 minute
    this.MAX_REQUESTS = options.maxRequestsPerEmail ?? 5;
    this.GLOBAL_MAX_REQUESTS = options.globalMaxRequests ?? 20;
  }

  async signup(data: BetaSignupData): Promise<BetaSignupResult> {
    // Validate email
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    // Check for duplicate
    if (this.signups.has(data.email)) {
      throw new Error('Email already registered');
    }

    // Rate limiting (both per-email and global)
    if (!this.checkRateLimit(data.email) || !this.checkGlobalRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    // Create signup
    const result: BetaSignupResult = {
      success: true,
      id: this.generateId(),
      email: data.email,
      name: data.name,
      approved: false,
      createdAt: new Date(),
      metadata: data.metadata,
    };

    this.signups.set(data.email, result);

    return result;
  }

  async getStatus(email: string): Promise<BetaSignupStatus> {
    const signup = this.signups.get(email);

    if (!signup) {
      return {
        exists: false,
      };
    }

    return {
      exists: true,
      approved: signup.approved,
      createdAt: signup.createdAt,
    };
  }

  async list(options: BetaSignupListOptions = {}): Promise<BetaSignupListResult> {
    const { limit = 100, offset = 0, approved } = options;

    let items = Array.from(this.signups.values());

    // Filter by approval status if specified
    if (approved !== undefined) {
      items = items.filter(item => item.approved === approved);
    }

    const total = items.length;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      limit,
      offset,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private checkRateLimit(email: string): boolean {
    const now = Date.now();
    const requests = this.rateLimitMap.get(email) || [];

    // Remove old requests outside the window
    const recentRequests = requests.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );

    if (recentRequests.length >= this.MAX_REQUESTS) {
      return false;
    }

    // Add new request
    recentRequests.push(now);
    this.rateLimitMap.set(email, recentRequests);

    return true;
  }

  private checkGlobalRateLimit(): boolean {
    const now = Date.now();

    // Remove old requests outside the window
    this.globalRequests = this.globalRequests.filter(
      time => now - time < this.RATE_LIMIT_WINDOW
    );

    if (this.globalRequests.length >= this.GLOBAL_MAX_REQUESTS) {
      return false;
    }

    // Add new request
    this.globalRequests.push(now);

    return true;
  }

  private generateId(): string {
    return `beta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
