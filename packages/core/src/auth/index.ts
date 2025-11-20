/**
 * Authentication module for AI Kit
 * Provides AINative authentication integration
 */

export { AINativeAuthProvider } from './AINativeAuthProvider';
export {
  AuthError,
  AuthErrorType,
  AuthMethod,
  AuthStatus,
  StorageStrategy,
  AuthEventType,
} from './types';
export type {
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
  BaseCredentials,
  UserInfo,
} from './types';
