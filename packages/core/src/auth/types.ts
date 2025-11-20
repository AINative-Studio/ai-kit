/**
 * Authentication types for AINative Auth integration
 */

/**
 * Supported authentication methods
 */
export enum AuthMethod {
  /** API Key authentication */
  API_KEY = 'API_KEY',
  /** OAuth 2.0 authentication */
  OAUTH = 'OAUTH',
  /** JSON Web Token authentication */
  JWT = 'JWT',
}

/**
 * Authentication status
 */
export enum AuthStatus {
  /** Not authenticated */
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  /** Authentication in progress */
  AUTHENTICATING = 'AUTHENTICATING',
  /** Successfully authenticated */
  AUTHENTICATED = 'AUTHENTICATED',
  /** Authentication failed */
  FAILED = 'FAILED',
  /** Token expired, needs refresh */
  EXPIRED = 'EXPIRED',
  /** Token refreshing in progress */
  REFRESHING = 'REFRESHING',
}

/**
 * Base credentials interface
 */
export interface BaseCredentials {
  /** Authentication method */
  method: AuthMethod;
  /** Tenant ID for multi-tenant support */
  tenantId?: string;
}

/**
 * API Key credentials
 */
export interface APIKeyCredentials extends BaseCredentials {
  method: AuthMethod.API_KEY;
  /** API key value */
  apiKey: string;
}

/**
 * OAuth credentials
 */
export interface OAuthCredentials extends BaseCredentials {
  method: AuthMethod.OAUTH;
  /** Client ID */
  clientId: string;
  /** Client secret */
  clientSecret: string;
  /** OAuth scopes */
  scopes?: string[];
  /** Redirect URI for OAuth flow */
  redirectUri?: string;
}

/**
 * JWT credentials
 */
export interface JWTCredentials extends BaseCredentials {
  method: AuthMethod.JWT;
  /** JWT token */
  token: string;
  /** Refresh token (optional) */
  refreshToken?: string;
}

/**
 * Union type for all credential types
 */
export type AuthCredentials = APIKeyCredentials | OAuthCredentials | JWTCredentials;

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** AINative API base URL */
  baseUrl?: string;
  /** Authentication endpoint */
  authEndpoint?: string;
  /** Token refresh endpoint */
  refreshEndpoint?: string;
  /** Token validation endpoint */
  validateEndpoint?: string;
  /** Logout endpoint */
  logoutEndpoint?: string;
  /** Automatic token refresh (default: true) */
  autoRefresh?: boolean;
  /** Token refresh buffer in seconds (refresh before expiration) */
  refreshBuffer?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts for failed requests */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable request/response logging */
  enableLogging?: boolean;
  /** Custom headers to include in all requests */
  customHeaders?: Record<string, string>;
  /** Storage strategy for tokens */
  storageStrategy?: StorageStrategy;
}

/**
 * Storage strategy for tokens
 */
export enum StorageStrategy {
  /** Store in memory only (lost on restart) */
  MEMORY = 'MEMORY',
  /** Store in local storage (browser) */
  LOCAL_STORAGE = 'LOCAL_STORAGE',
  /** Store in session storage (browser) */
  SESSION_STORAGE = 'SESSION_STORAGE',
  /** Custom storage implementation */
  CUSTOM = 'CUSTOM',
}

/**
 * Authentication session data
 */
export interface AuthSession {
  /** Current authentication status */
  status: AuthStatus;
  /** Access token */
  accessToken?: string;
  /** Refresh token */
  refreshToken?: string;
  /** Token type (usually "Bearer") */
  tokenType?: string;
  /** Token expiration timestamp (Unix time in seconds) */
  expiresAt?: number;
  /** Token issued at timestamp (Unix time in seconds) */
  issuedAt?: number;
  /** Scopes granted */
  scopes?: string[];
  /** User information */
  user?: UserInfo;
  /** Tenant ID */
  tenantId?: string;
  /** Session metadata */
  metadata?: Record<string, any>;
}

/**
 * User information from authentication
 */
export interface UserInfo {
  /** User ID */
  id: string;
  /** Email address */
  email?: string;
  /** Full name */
  name?: string;
  /** Username */
  username?: string;
  /** User roles */
  roles?: string[];
  /** User permissions */
  permissions?: string[];
  /** Additional user metadata */
  metadata?: Record<string, any>;
}

/**
 * Token refresh options
 */
export interface TokenRefreshOptions {
  /** Force refresh even if token not expired */
  force?: boolean;
  /** Retry on failure */
  retry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  /** Invalid credentials */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  /** Network error */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Token expired */
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  /** Invalid token */
  INVALID_TOKEN = 'INVALID_TOKEN',
  /** Unauthorized access */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Forbidden access */
  FORBIDDEN = 'FORBIDDEN',
  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  /** Server error */
  SERVER_ERROR = 'SERVER_ERROR',
  /** Configuration error */
  CONFIG_ERROR = 'CONFIG_ERROR',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Authentication error
 */
export class AuthError extends Error {
  /** Error type */
  type: AuthErrorType;
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Original error */
  originalError?: Error;
  /** Additional error details */
  details?: Record<string, any>;

  constructor(
    message: string,
    type: AuthErrorType = AuthErrorType.UNKNOWN,
    statusCode?: number,
    originalError?: Error,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Token expiration timestamp */
  expiresAt?: number;
  /** Time until expiration in seconds */
  expiresIn?: number;
  /** Whether token is expired */
  expired: boolean;
  /** Whether token needs refresh soon */
  needsRefresh: boolean;
  /** Token claims/payload */
  claims?: Record<string, any>;
  /** Validation error if invalid */
  error?: string;
}

/**
 * Authentication event types
 */
export enum AuthEventType {
  /** Authentication started */
  AUTH_STARTED = 'AUTH_STARTED',
  /** Authentication succeeded */
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  /** Authentication failed */
  AUTH_FAILED = 'AUTH_FAILED',
  /** Token refresh started */
  REFRESH_STARTED = 'REFRESH_STARTED',
  /** Token refresh succeeded */
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  /** Token refresh failed */
  REFRESH_FAILED = 'REFRESH_FAILED',
  /** Session validated */
  SESSION_VALIDATED = 'SESSION_VALIDATED',
  /** Session expired */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  /** Logout initiated */
  LOGOUT_STARTED = 'LOGOUT_STARTED',
  /** Logout completed */
  LOGOUT_COMPLETED = 'LOGOUT_COMPLETED',
}

/**
 * Authentication event
 */
export interface AuthEvent {
  /** Event type */
  type: AuthEventType;
  /** Event timestamp */
  timestamp: Date;
  /** Session at time of event */
  session?: AuthSession;
  /** Error if event represents a failure */
  error?: AuthError;
  /** Additional event data */
  data?: Record<string, any>;
}

/**
 * Authentication event listener
 */
export type AuthEventListener = (event: AuthEvent) => void;

/**
 * Storage adapter interface for custom token storage
 */
export interface StorageAdapter {
  /** Get item from storage */
  getItem(key: string): Promise<string | null>;
  /** Set item in storage */
  setItem(key: string, value: string): Promise<void>;
  /** Remove item from storage */
  removeItem(key: string): Promise<void>;
  /** Clear all items from storage */
  clear(): Promise<void>;
}

/**
 * API response for authentication
 */
export interface AuthResponse {
  /** Access token */
  access_token: string;
  /** Refresh token */
  refresh_token?: string;
  /** Token type */
  token_type: string;
  /** Expires in (seconds) */
  expires_in: number;
  /** Scopes granted */
  scope?: string;
  /** User information */
  user?: UserInfo;
  /** Additional response data */
  [key: string]: any;
}

/**
 * API response for token refresh
 */
export interface RefreshResponse {
  /** New access token */
  access_token: string;
  /** New refresh token (optional) */
  refresh_token?: string;
  /** Token type */
  token_type: string;
  /** Expires in (seconds) */
  expires_in: number;
  /** Additional response data */
  [key: string]: any;
}

/**
 * API response for session validation
 */
export interface ValidationResponse {
  /** Whether the session is valid */
  valid: boolean;
  /** Token expiration timestamp */
  expires_at?: number;
  /** User information */
  user?: UserInfo;
  /** Additional response data */
  [key: string]: any;
}
