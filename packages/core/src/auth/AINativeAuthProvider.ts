/**
 * AINative Authentication Provider
 * Provides seamless authentication integration with AINative's auth system
 */

import {
  AuthError,
  AuthErrorType,
  AuthMethod,
  AuthStatus,
  AuthEventType,
  StorageStrategy,
} from './types';
import type {
  AuthCredentials,
  AuthConfig,
  AuthSession,
  TokenRefreshOptions,
  TokenValidationResult,
  AuthEventListener,
  AuthEvent,
  StorageAdapter,
  AuthResponse,
  RefreshResponse,
  ValidationResponse,
  APIKeyCredentials,
  OAuthCredentials,
  JWTCredentials,
} from './types';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Omit<AuthConfig, 'customHeaders'>> = {
  baseUrl: 'https://api.ainative.studio',
  authEndpoint: '/v1/auth/authenticate',
  refreshEndpoint: '/v1/auth/refresh',
  validateEndpoint: '/v1/auth/validate',
  logoutEndpoint: '/v1/auth/logout',
  autoRefresh: true,
  refreshBuffer: 300, // 5 minutes
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  enableLogging: false,
  storageStrategy: StorageStrategy.MEMORY,
};

/**
 * AINative Authentication Provider
 * Handles authentication, token management, and session validation
 */
export class AINativeAuthProvider {
  private config: Required<AuthConfig>;
  private session: AuthSession;
  private eventListeners: Map<AuthEventType, Set<AuthEventListener>>;
  private refreshTimer?: NodeJS.Timeout;
  private refreshPromise?: Promise<void>;
  private storageAdapter?: StorageAdapter;
  private customHeaders: Record<string, string>;

  /**
   * Create a new AINativeAuthProvider instance
   * @param config - Authentication configuration
   * @param storageAdapter - Custom storage adapter (required if using CUSTOM storage strategy)
   */
  constructor(config: AuthConfig = {}, storageAdapter?: StorageAdapter) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.customHeaders = config.customHeaders || {};
    this.session = { status: AuthStatus.UNAUTHENTICATED };
    this.eventListeners = new Map();
    this.storageAdapter = storageAdapter;

    if (this.config.storageStrategy === StorageStrategy.CUSTOM && !storageAdapter) {
      throw new AuthError(
        'Storage adapter is required when using CUSTOM storage strategy',
        AuthErrorType.CONFIG_ERROR
      );
    }

    this.log('AINativeAuthProvider initialized');
  }

  /**
   * Authenticate with AINative
   * @param credentials - Authentication credentials
   * @returns Promise resolving to authentication session
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthSession> {
    this.log('Authentication started', { method: credentials.method });
    this.updateStatus(AuthStatus.AUTHENTICATING);
    this.emitEvent(AuthEventType.AUTH_STARTED, { credentials: { method: credentials.method } });

    try {
      const response = await this.makeAuthRequest(credentials);
      const session = this.createSessionFromResponse(response, credentials.tenantId);

      this.session = session;
      await this.saveSession(session);

      this.updateStatus(AuthStatus.AUTHENTICATED);
      this.emitEvent(AuthEventType.AUTH_SUCCESS, { session });

      // Set up auto-refresh if enabled
      if (this.config.autoRefresh && session.expiresAt) {
        this.scheduleTokenRefresh(session.expiresAt);
      }

      this.log('Authentication successful');
      return session;
    } catch (error) {
      const authError = this.normalizeError(error);
      this.updateStatus(AuthStatus.FAILED);
      this.emitEvent(AuthEventType.AUTH_FAILED, { error: authError });
      this.log('Authentication failed', { error: authError.message });
      throw authError;
    }
  }

  /**
   * Refresh the current authentication token
   * @param options - Token refresh options
   * @returns Promise resolving to updated session
   */
  async refreshToken(options: TokenRefreshOptions = {}): Promise<AuthSession> {
    // If refresh is already in progress, return the existing promise
    if (this.refreshPromise) {
      this.log('Token refresh already in progress, waiting...');
      await this.refreshPromise;
      return this.session;
    }

    const {
      force = false,
      retry = true,
      maxRetries = this.config.maxRetries,
    } = options;

    // Check if refresh is needed
    if (!force && this.session.status === AuthStatus.AUTHENTICATED) {
      const validation = this.validateTokenLocally();
      if (validation.valid && !validation.needsRefresh) {
        this.log('Token is still valid, no refresh needed');
        return this.session;
      }
    }

    this.log('Token refresh started');
    this.updateStatus(AuthStatus.REFRESHING);
    this.emitEvent(AuthEventType.REFRESH_STARTED);

    this.refreshPromise = this.performTokenRefresh(maxRetries, retry);

    try {
      await this.refreshPromise;
      this.emitEvent(AuthEventType.REFRESH_SUCCESS, { session: this.session });
      this.log('Token refresh successful');
      return this.session;
    } catch (error) {
      const authError = this.normalizeError(error);
      this.updateStatus(AuthStatus.EXPIRED);
      this.emitEvent(AuthEventType.REFRESH_FAILED, { error: authError });
      this.log('Token refresh failed', { error: authError.message });
      throw authError;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  /**
   * Validate the current session
   * @returns Promise resolving to validation result
   */
  async validateSession(): Promise<TokenValidationResult> {
    this.log('Session validation started');

    // First check locally
    const localValidation = this.validateTokenLocally();
    if (!localValidation.valid) {
      this.log('Session invalid (local check)');
      return localValidation;
    }

    // Perform server-side validation
    try {
      const url = `${this.config.baseUrl}${this.config.validateEndpoint}`;
      const response = await this.fetchWithRetry<ValidationResponse>(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result: TokenValidationResult = {
        valid: response.valid,
        expiresAt: response.expires_at,
        expiresIn: response.expires_at
          ? Math.max(0, response.expires_at - Math.floor(Date.now() / 1000))
          : undefined,
        expired: !response.valid,
        needsRefresh: response.expires_at
          ? response.expires_at - Math.floor(Date.now() / 1000) < this.config.refreshBuffer
          : false,
        claims: response.user as any,
      };

      this.emitEvent(AuthEventType.SESSION_VALIDATED, { validation: result });
      this.log('Session validation completed', { valid: result.valid });

      if (!result.valid) {
        this.updateStatus(AuthStatus.EXPIRED);
        this.emitEvent(AuthEventType.SESSION_EXPIRED);
      }

      return result;
    } catch (error) {
      const authError = this.normalizeError(error);
      this.log('Session validation failed', { error: authError.message });

      return {
        valid: false,
        expired: true,
        needsRefresh: true,
        error: authError.message,
      };
    }
  }

  /**
   * Logout and clear the current session
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    this.log('Logout started');
    this.emitEvent(AuthEventType.LOGOUT_STARTED);

    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    // Call logout endpoint if authenticated
    if (this.session.status === AuthStatus.AUTHENTICATED && this.session.accessToken) {
      try {
        const url = `${this.config.baseUrl}${this.config.logoutEndpoint}`;
        await this.fetchWithRetry(url, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
        this.log('Server logout successful');
      } catch (error) {
        // Log error but don't throw - we still want to clear local session
        this.log('Server logout failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Clear session
    this.session = { status: AuthStatus.UNAUTHENTICATED };
    await this.clearSession();

    this.emitEvent(AuthEventType.LOGOUT_COMPLETED);
    this.log('Logout completed');
  }

  /**
   * Get authentication headers for API calls
   * @returns Headers object with authentication
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.customHeaders,
    };

    if (this.session.accessToken) {
      const tokenType = this.session.tokenType || 'Bearer';
      headers['Authorization'] = `${tokenType} ${this.session.accessToken}`;
    }

    return headers;
  }

  /**
   * Get the current authentication session
   * @returns Current session
   */
  getSession(): AuthSession {
    return { ...this.session };
  }

  /**
   * Check if currently authenticated
   * @returns True if authenticated
   */
  isAuthenticated(): boolean {
    return this.session.status === AuthStatus.AUTHENTICATED && !!this.session.accessToken;
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): AuthConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.customHeaders) {
      this.customHeaders = { ...this.customHeaders, ...config.customHeaders };
    }
    this.log('Configuration updated');
  }

  /**
   * Add event listener
   * @param eventType - Event type to listen for
   * @param listener - Event listener callback
   */
  addEventListener(eventType: AuthEventType, listener: AuthEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * Remove event listener
   * @param eventType - Event type
   * @param listener - Event listener callback
   */
  removeEventListener(eventType: AuthEventType, listener: AuthEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Make authentication request based on credential type
   * @private
   */
  private async makeAuthRequest(credentials: AuthCredentials): Promise<AuthResponse> {
    const url = `${this.config.baseUrl}${this.config.authEndpoint}`;

    let body: Record<string, any>;

    switch (credentials.method) {
      case AuthMethod.API_KEY:
        body = {
          grant_type: 'api_key',
          api_key: (credentials as APIKeyCredentials).apiKey,
          tenant_id: credentials.tenantId,
        };
        break;

      case AuthMethod.OAUTH:
        const oauthCreds = credentials as OAuthCredentials;
        body = {
          grant_type: 'client_credentials',
          client_id: oauthCreds.clientId,
          client_secret: oauthCreds.clientSecret,
          scope: oauthCreds.scopes?.join(' '),
          redirect_uri: oauthCreds.redirectUri,
          tenant_id: credentials.tenantId,
        };
        break;

      case AuthMethod.JWT:
        const jwtCreds = credentials as JWTCredentials;
        body = {
          grant_type: 'jwt_bearer',
          assertion: jwtCreds.token,
          refresh_token: jwtCreds.refreshToken,
          tenant_id: credentials.tenantId,
        };
        break;

      default:
        throw new AuthError(
          `Unsupported authentication method: ${(credentials as any).method}`,
          AuthErrorType.CONFIG_ERROR
        );
    }

    return this.fetchWithRetry<AuthResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Perform token refresh
   * @private
   */
  private async performTokenRefresh(maxRetries: number, retry: boolean): Promise<void> {
    if (!this.session.refreshToken) {
      throw new AuthError(
        'No refresh token available',
        AuthErrorType.INVALID_TOKEN
      );
    }

    const url = `${this.config.baseUrl}${this.config.refreshEndpoint}`;
    const response = await this.fetchWithRetry<RefreshResponse>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.customHeaders,
        },
        body: JSON.stringify({
          refresh_token: this.session.refreshToken,
          tenant_id: this.session.tenantId,
        }),
      },
      retry ? maxRetries : 1
    );

    // Update session with new tokens
    const now = Math.floor(Date.now() / 1000);
    this.session = {
      ...this.session,
      status: AuthStatus.AUTHENTICATED,
      accessToken: response.access_token,
      refreshToken: response.refresh_token || this.session.refreshToken,
      tokenType: response.token_type,
      expiresAt: now + response.expires_in,
      issuedAt: now,
    };

    await this.saveSession(this.session);

    // Schedule next refresh
    if (this.config.autoRefresh && this.session.expiresAt) {
      this.scheduleTokenRefresh(this.session.expiresAt);
    }
  }

  /**
   * Create session from authentication response
   * @private
   */
  private createSessionFromResponse(response: AuthResponse, tenantId?: string): AuthSession {
    const now = Math.floor(Date.now() / 1000);

    return {
      status: AuthStatus.AUTHENTICATED,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type,
      expiresAt: now + response.expires_in,
      issuedAt: now,
      scopes: response.scope?.split(' '),
      user: response.user,
      tenantId,
      metadata: {},
    };
  }

  /**
   * Validate token locally without server call
   * @private
   */
  private validateTokenLocally(): TokenValidationResult {
    if (!this.session.accessToken || !this.session.expiresAt) {
      return {
        valid: false,
        expired: true,
        needsRefresh: true,
        error: 'No active session',
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.session.expiresAt - now;
    const expired = expiresIn <= 0;
    const needsRefresh = expiresIn < this.config.refreshBuffer;

    return {
      valid: !expired,
      expiresAt: this.session.expiresAt,
      expiresIn: Math.max(0, expiresIn),
      expired,
      needsRefresh,
    };
  }

  /**
   * Schedule automatic token refresh
   * @private
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilRefresh = (expiresAt - now - this.config.refreshBuffer) * 1000;

    if (timeUntilRefresh > 0) {
      this.log(`Token refresh scheduled in ${timeUntilRefresh}ms`);
      this.refreshTimer = setTimeout(() => {
        this.refreshToken({ force: true, retry: true }).catch((error) => {
          this.log('Auto-refresh failed', { error: error.message });
        });
      }, timeUntilRefresh);
    }
  }

  /**
   * Make HTTP request with retry logic
   * @private
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw await this.createErrorFromResponse(response);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (
          error instanceof AuthError &&
          (error.type === AuthErrorType.INVALID_CREDENTIALS ||
            error.type === AuthErrorType.UNAUTHORIZED ||
            error.type === AuthErrorType.FORBIDDEN ||
            error.type === AuthErrorType.RATE_LIMIT_EXCEEDED ||
            error.type === AuthErrorType.SERVER_ERROR)
        ) {
          throw error;
        }

        // Retry on network errors
        if (attempt < maxRetries) {
          this.log(`Request failed, retrying (${attempt + 1}/${maxRetries})`, {
            error: lastError.message,
          });
          await this.sleep(this.config.retryDelay * (attempt + 1));
          continue;
        }
      }
    }

    throw new AuthError(
      `Request failed after ${maxRetries} retries: ${lastError?.message}`,
      AuthErrorType.NETWORK_ERROR,
      undefined,
      lastError
    );
  }

  /**
   * Create AuthError from HTTP response
   * @private
   */
  private async createErrorFromResponse(response: Response): Promise<AuthError> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorType = AuthErrorType.UNKNOWN;
    let details: Record<string, any> = {};

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      details = errorData;
    } catch {
      // Response body is not JSON
    }

    // Map HTTP status codes to error types
    switch (response.status) {
      case 401:
        errorType = AuthErrorType.UNAUTHORIZED;
        break;
      case 403:
        errorType = AuthErrorType.FORBIDDEN;
        break;
      case 429:
        errorType = AuthErrorType.RATE_LIMIT_EXCEEDED;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = AuthErrorType.SERVER_ERROR;
        break;
    }

    return new AuthError(errorMessage, errorType, response.status, undefined, details);
  }

  /**
   * Normalize error to AuthError
   * @private
   */
  private normalizeError(error: unknown): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    if (error instanceof Error) {
      return new AuthError(
        error.message,
        AuthErrorType.UNKNOWN,
        undefined,
        error
      );
    }

    return new AuthError(
      String(error),
      AuthErrorType.UNKNOWN
    );
  }

  /**
   * Update session status
   * @private
   */
  private updateStatus(status: AuthStatus): void {
    this.session.status = status;
  }

  /**
   * Emit event to listeners
   * @private
   */
  private emitEvent(eventType: AuthEventType, data?: Record<string, any>): void {
    const event: AuthEvent = {
      type: eventType,
      timestamp: new Date(),
      session: { ...this.session },
      ...data,
    };

    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          this.log('Error in event listener', { error: error instanceof Error ? error.message : 'Unknown' });
        }
      });
    }
  }

  /**
   * Save session to storage
   * @private
   */
  private async saveSession(session: AuthSession): Promise<void> {
    try {
      const sessionData = JSON.stringify(session);

      switch (this.config.storageStrategy) {
        case StorageStrategy.MEMORY:
          // Already in memory
          break;

        case StorageStrategy.LOCAL_STORAGE:
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ainative_auth_session', sessionData);
          }
          break;

        case StorageStrategy.SESSION_STORAGE:
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('ainative_auth_session', sessionData);
          }
          break;

        case StorageStrategy.CUSTOM:
          if (this.storageAdapter) {
            await this.storageAdapter.setItem('ainative_auth_session', sessionData);
          }
          break;
      }
    } catch (error) {
      this.log('Failed to save session', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  /**
   * Clear session from storage
   * @private
   */
  private async clearSession(): Promise<void> {
    try {
      switch (this.config.storageStrategy) {
        case StorageStrategy.MEMORY:
          // Already cleared
          break;

        case StorageStrategy.LOCAL_STORAGE:
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('ainative_auth_session');
          }
          break;

        case StorageStrategy.SESSION_STORAGE:
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('ainative_auth_session');
          }
          break;

        case StorageStrategy.CUSTOM:
          if (this.storageAdapter) {
            await this.storageAdapter.removeItem('ainative_auth_session');
          }
          break;
      }
    } catch (error) {
      this.log('Failed to clear session', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  /**
   * Log message if logging is enabled
   * @private
   */
  private log(message: string, data?: Record<string, any>): void {
    if (this.config.enableLogging) {
      console.log(`[AINativeAuth] ${message}`, data || '');
    }
  }

  /**
   * Sleep for specified milliseconds
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
