# AINative Authentication Integration

Complete guide to integrating AINative's authentication system into your AI applications using the AI Kit framework.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication Methods](#authentication-methods)
  - [API Key Authentication](#api-key-authentication)
  - [OAuth 2.0 Authentication](#oauth-20-authentication)
  - [JWT Authentication](#jwt-authentication)
- [Configuration](#configuration)
- [Token Management](#token-management)
  - [Automatic Token Refresh](#automatic-token-refresh)
  - [Manual Token Refresh](#manual-token-refresh)
  - [Token Validation](#token-validation)
- [Session Management](#session-management)
- [Error Handling](#error-handling)
- [Event System](#event-system)
- [Storage Strategies](#storage-strategies)
- [Multi-Tenant Support](#multi-tenant-support)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The AINative Authentication Provider is a robust, production-ready authentication client that seamlessly integrates with AINative's authentication system. It provides:

- **Multiple Authentication Methods**: Support for API keys, OAuth 2.0, and JWT
- **Automatic Token Management**: Intelligent token refresh before expiration
- **Session Validation**: Server-side and client-side session validation
- **Event-Driven Architecture**: React to authentication state changes
- **Multi-Tenant Support**: Built-in support for multi-tenant applications
- **Storage Flexibility**: Multiple storage strategies for different environments
- **Error Recovery**: Automatic retry logic with exponential backoff
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

The auth module is included in the AI Kit core package:

```bash
npm install @ainative/ai-kit-core
```

Or using yarn:

```bash
yarn add @ainative/ai-kit-core
```

Or using pnpm:

```bash
pnpm add @ainative/ai-kit-core
```

## Quick Start

### Basic Setup

```typescript
import { AINativeAuthProvider, AuthMethod } from '@ainative/ai-kit-core/auth';

// Create an auth provider instance
const authProvider = new AINativeAuthProvider({
  baseUrl: 'https://api.ainative.studio',
  autoRefresh: true,
  enableLogging: true, // Enable for development
});

// Authenticate with an API key
const session = await authProvider.authenticate({
  method: AuthMethod.API_KEY,
  apiKey: 'your-api-key-here',
});

console.log('Authenticated!', session.user);

// Use the auth headers in your API calls
const headers = authProvider.getAuthHeaders();
fetch('https://api.ainative.studio/v1/models', { headers });
```

### Using with React

```typescript
import { useState, useEffect } from 'react';
import { AINativeAuthProvider, AuthEventType } from '@ainative/ai-kit-core/auth';

function App() {
  const [authProvider] = useState(() => new AINativeAuthProvider());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Listen for authentication events
    const handleAuthSuccess = () => setIsAuthenticated(true);
    const handleLogout = () => setIsAuthenticated(false);

    authProvider.addEventListener(AuthEventType.AUTH_SUCCESS, handleAuthSuccess);
    authProvider.addEventListener(AuthEventType.LOGOUT_COMPLETED, handleLogout);

    return () => {
      authProvider.removeEventListener(AuthEventType.AUTH_SUCCESS, handleAuthSuccess);
      authProvider.removeEventListener(AuthEventType.LOGOUT_COMPLETED, handleLogout);
    };
  }, [authProvider]);

  const login = async () => {
    await authProvider.authenticate({
      method: AuthMethod.API_KEY,
      apiKey: process.env.REACT_APP_API_KEY!,
    });
  };

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={() => authProvider.logout()}>Logout</button>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}
```

## Authentication Methods

### API Key Authentication

The simplest authentication method, ideal for server-to-server communication and development.

```typescript
import { AINativeAuthProvider, AuthMethod } from '@ainative/ai-kit-core/auth';

const authProvider = new AINativeAuthProvider();

// Authenticate with API key
const session = await authProvider.authenticate({
  method: AuthMethod.API_KEY,
  apiKey: 'your-api-key-here',
  tenantId: 'optional-tenant-id', // For multi-tenant applications
});

console.log('Access Token:', session.accessToken);
console.log('Expires At:', new Date(session.expiresAt! * 1000));
```

**Use Cases:**
- Server-side applications
- CLI tools
- Testing and development
- Service-to-service communication

**Security Notes:**
- Never expose API keys in client-side code
- Store API keys in environment variables
- Rotate keys regularly
- Use different keys for different environments

### OAuth 2.0 Authentication

Enterprise-grade authentication using the OAuth 2.0 client credentials flow.

```typescript
import { AINativeAuthProvider, AuthMethod } from '@ainative/ai-kit-core/auth';

const authProvider = new AINativeAuthProvider();

// Authenticate with OAuth
const session = await authProvider.authenticate({
  method: AuthMethod.OAUTH,
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  scopes: ['read', 'write', 'admin'], // Optional scopes
  redirectUri: 'https://your-app.com/callback', // Optional
  tenantId: 'your-tenant-id', // Optional
});

console.log('Granted Scopes:', session.scopes);
```

**Use Cases:**
- Enterprise applications
- Third-party integrations
- Applications requiring fine-grained permissions
- Multi-user applications

**Features:**
- Scope-based permissions
- Refresh token rotation
- Client credential management
- Redirect URI validation

### JWT Authentication

Use existing JWT tokens to authenticate with AINative services.

```typescript
import { AINativeAuthProvider, AuthMethod } from '@ainative/ai-kit-core/auth';

const authProvider = new AINativeAuthProvider();

// Authenticate with JWT
const session = await authProvider.authenticate({
  method: AuthMethod.JWT,
  token: 'your-jwt-token',
  refreshToken: 'your-refresh-token', // Optional
  tenantId: 'your-tenant-id', // Optional
});

console.log('User Info:', session.user);
```

**Use Cases:**
- Single Sign-On (SSO) integration
- Existing authentication systems
- Token-based architectures
- Microservices communication

**Features:**
- Support for external identity providers
- Token claim validation
- Automatic token refresh
- Custom token formats

## Configuration

### Configuration Options

```typescript
import {
  AINativeAuthProvider,
  StorageStrategy
} from '@ainative/ai-kit-core/auth';

const authProvider = new AINativeAuthProvider({
  // API Configuration
  baseUrl: 'https://api.ainative.studio',
  authEndpoint: '/v1/auth/authenticate',
  refreshEndpoint: '/v1/auth/refresh',
  validateEndpoint: '/v1/auth/validate',
  logoutEndpoint: '/v1/auth/logout',

  // Token Management
  autoRefresh: true, // Automatically refresh tokens before expiration
  refreshBuffer: 300, // Refresh 5 minutes before expiration

  // Network Configuration
  timeout: 30000, // Request timeout in milliseconds
  maxRetries: 3, // Maximum retry attempts for failed requests
  retryDelay: 1000, // Base retry delay in milliseconds

  // Storage
  storageStrategy: StorageStrategy.MEMORY, // or LOCAL_STORAGE, SESSION_STORAGE, CUSTOM

  // Debugging
  enableLogging: process.env.NODE_ENV === 'development',

  // Custom Headers
  customHeaders: {
    'X-App-Version': '1.0.0',
    'X-Client-Type': 'web',
  },
});
```

### Environment-Specific Configuration

```typescript
// Development Configuration
const devConfig = {
  baseUrl: 'https://dev-api.ainative.studio',
  enableLogging: true,
  timeout: 60000, // Longer timeout for debugging
};

// Production Configuration
const prodConfig = {
  baseUrl: 'https://api.ainative.studio',
  enableLogging: false,
  maxRetries: 5,
  retryDelay: 2000,
};

const authProvider = new AINativeAuthProvider(
  process.env.NODE_ENV === 'production' ? prodConfig : devConfig
);
```

### Updating Configuration

```typescript
const authProvider = new AINativeAuthProvider();

// Update configuration after initialization
authProvider.updateConfig({
  autoRefresh: false,
  timeout: 45000,
  customHeaders: {
    'X-Request-ID': generateRequestId(),
  },
});
```

## Token Management

### Automatic Token Refresh

The auth provider automatically refreshes tokens before they expire when `autoRefresh` is enabled.

```typescript
const authProvider = new AINativeAuthProvider({
  autoRefresh: true,
  refreshBuffer: 300, // Refresh 5 minutes before expiration
});

// Authenticate
await authProvider.authenticate({
  method: AuthMethod.API_KEY,
  apiKey: 'your-api-key',
});

// Token will automatically refresh 5 minutes before expiration
// You can listen for refresh events
authProvider.addEventListener(AuthEventType.REFRESH_SUCCESS, (event) => {
  console.log('Token refreshed successfully');
  console.log('New expires at:', event.session?.expiresAt);
});

authProvider.addEventListener(AuthEventType.REFRESH_FAILED, (event) => {
  console.error('Token refresh failed:', event.error);
  // Handle refresh failure (e.g., re-authenticate)
});
```

### Manual Token Refresh

You can manually trigger token refresh when needed.

```typescript
const authProvider = new AINativeAuthProvider();

// Authenticate first
await authProvider.authenticate({
  method: AuthMethod.API_KEY,
  apiKey: 'your-api-key',
});

// Manually refresh token
try {
  const session = await authProvider.refreshToken({
    force: true, // Force refresh even if token is still valid
    retry: true, // Retry on failure
    maxRetries: 3, // Override default max retries
  });

  console.log('Token refreshed:', session.accessToken);
} catch (error) {
  console.error('Failed to refresh token:', error);
}
```

### Token Validation

Validate the current session both locally and with the server.

```typescript
const authProvider = new AINativeAuthProvider();

// Local validation (fast, no network request)
const session = authProvider.getSession();
const now = Math.floor(Date.now() / 1000);
const isValid = session.expiresAt && session.expiresAt > now;

// Server-side validation (authoritative)
const validationResult = await authProvider.validateSession();

if (validationResult.valid) {
  console.log('Session is valid');
  console.log('Expires in:', validationResult.expiresIn, 'seconds');

  if (validationResult.needsRefresh) {
    console.log('Token should be refreshed soon');
    await authProvider.refreshToken();
  }
} else {
  console.log('Session is invalid:', validationResult.error);
  // Re-authenticate
  await authProvider.authenticate({
    method: AuthMethod.API_KEY,
    apiKey: 'your-api-key',
  });
}
```

## Session Management

### Getting Current Session

```typescript
const authProvider = new AINativeAuthProvider();

// Check if authenticated
if (authProvider.isAuthenticated()) {
  const session = authProvider.getSession();

  console.log('User:', session.user);
  console.log('Access Token:', session.accessToken);
  console.log('Expires At:', new Date(session.expiresAt! * 1000));
  console.log('Scopes:', session.scopes);
  console.log('Tenant ID:', session.tenantId);
}
```

### Logout

```typescript
const authProvider = new AINativeAuthProvider();

// Logout (clears local session and notifies server)
await authProvider.logout();

console.log('Logged out:', !authProvider.isAuthenticated());
```

### Getting Authentication Headers

Use authentication headers in your API requests.

```typescript
const authProvider = new AINativeAuthProvider();

// Authenticate first
await authProvider.authenticate({
  method: AuthMethod.API_KEY,
  apiKey: 'your-api-key',
});

// Get headers for API calls
const headers = authProvider.getAuthHeaders();
console.log(headers);
// {
//   'Content-Type': 'application/json',
//   'Authorization': 'Bearer eyJhbGc...',
//   // ... custom headers
// }

// Use with fetch
const response = await fetch('https://api.ainative.studio/v1/models', {
  headers: authProvider.getAuthHeaders(),
});

// Use with axios
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://api.ainative.studio',
});

axiosInstance.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    ...authProvider.getAuthHeaders(),
  };
  return config;
});
```

## Error Handling

### Error Types

The auth provider uses typed errors for better error handling.

```typescript
import {
  AuthError,
  AuthErrorType
} from '@ainative/ai-kit-core/auth';

try {
  await authProvider.authenticate({
    method: AuthMethod.API_KEY,
    apiKey: 'invalid-key',
  });
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        console.error('Invalid API key');
        break;

      case AuthErrorType.UNAUTHORIZED:
        console.error('Not authorized');
        break;

      case AuthErrorType.FORBIDDEN:
        console.error('Access forbidden');
        break;

      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        console.error('Rate limit exceeded, retry after:', error.details?.retryAfter);
        break;

      case AuthErrorType.NETWORK_ERROR:
        console.error('Network error:', error.message);
        // Retry logic
        break;

      case AuthErrorType.SERVER_ERROR:
        console.error('Server error:', error.message);
        break;

      case AuthErrorType.TOKEN_EXPIRED:
        console.error('Token expired, refreshing...');
        await authProvider.refreshToken();
        break;

      default:
        console.error('Unknown error:', error.message);
    }

    // Access additional error information
    console.log('Status Code:', error.statusCode);
    console.log('Original Error:', error.originalError);
    console.log('Error Details:', error.details);
  }
}
```

### Retry Logic

The auth provider includes automatic retry logic for network errors.

```typescript
const authProvider = new AINativeAuthProvider({
  maxRetries: 3, // Retry up to 3 times
  retryDelay: 1000, // Start with 1 second delay
  // Delay increases with each retry: 1s, 2s, 3s
});

// Errors that are NOT retried:
// - Invalid credentials (401)
// - Forbidden (403)
// - Rate limit exceeded (429)
// - Server errors (500+)

// Errors that ARE retried:
// - Network errors
// - Timeouts
// - Connection errors
```

## Event System

### Available Events

```typescript
import {
  AINativeAuthProvider,
  AuthEventType
} from '@ainative/ai-kit-core/auth';

const authProvider = new AINativeAuthProvider();

// Authentication Events
authProvider.addEventListener(AuthEventType.AUTH_STARTED, (event) => {
  console.log('Authentication started');
});

authProvider.addEventListener(AuthEventType.AUTH_SUCCESS, (event) => {
  console.log('Authentication successful');
  console.log('Session:', event.session);
});

authProvider.addEventListener(AuthEventType.AUTH_FAILED, (event) => {
  console.error('Authentication failed');
  console.error('Error:', event.error);
});

// Token Refresh Events
authProvider.addEventListener(AuthEventType.REFRESH_STARTED, (event) => {
  console.log('Token refresh started');
});

authProvider.addEventListener(AuthEventType.REFRESH_SUCCESS, (event) => {
  console.log('Token refresh successful');
  console.log('New session:', event.session);
});

authProvider.addEventListener(AuthEventType.REFRESH_FAILED, (event) => {
  console.error('Token refresh failed');
  console.error('Error:', event.error);
});

// Session Events
authProvider.addEventListener(AuthEventType.SESSION_VALIDATED, (event) => {
  console.log('Session validated');
});

authProvider.addEventListener(AuthEventType.SESSION_EXPIRED, (event) => {
  console.log('Session expired');
  // Prompt user to re-authenticate
});

// Logout Events
authProvider.addEventListener(AuthEventType.LOGOUT_STARTED, (event) => {
  console.log('Logout started');
});

authProvider.addEventListener(AuthEventType.LOGOUT_COMPLETED, (event) => {
  console.log('Logout completed');
});
```

### Event Listener Management

```typescript
const authProvider = new AINativeAuthProvider();

// Add event listener
const handleAuthSuccess = (event) => {
  console.log('Authenticated!');
};

authProvider.addEventListener(
  AuthEventType.AUTH_SUCCESS,
  handleAuthSuccess
);

// Remove event listener
authProvider.removeEventListener(
  AuthEventType.AUTH_SUCCESS,
  handleAuthSuccess
);

// Multiple listeners for same event
authProvider.addEventListener(AuthEventType.AUTH_SUCCESS, listener1);
authProvider.addEventListener(AuthEventType.AUTH_SUCCESS, listener2);
authProvider.addEventListener(AuthEventType.AUTH_SUCCESS, listener3);
```

## Storage Strategies

### Memory Storage (Default)

Tokens are stored in memory and lost on page refresh.

```typescript
import {
  AINativeAuthProvider,
  StorageStrategy
} from '@ainative/ai-kit-core/auth';

const authProvider = new AINativeAuthProvider({
  storageStrategy: StorageStrategy.MEMORY,
});

// Best for: Server-side applications, short-lived sessions
```

### Local Storage

Tokens persist across page refreshes and browser sessions.

```typescript
const authProvider = new AINativeAuthProvider({
  storageStrategy: StorageStrategy.LOCAL_STORAGE,
});

// Best for: Single-page applications, "remember me" functionality
// Note: Only available in browser environments
```

### Session Storage

Tokens persist across page refreshes but not browser sessions.

```typescript
const authProvider = new AINativeAuthProvider({
  storageStrategy: StorageStrategy.SESSION_STORAGE,
});

// Best for: Browser applications without "remember me"
// Note: Only available in browser environments
```

### Custom Storage

Implement your own storage adapter.

```typescript
import {
  AINativeAuthProvider,
  StorageStrategy,
  type StorageAdapter
} from '@ainative/ai-kit-core/auth';

// Create custom storage adapter
class RedisStorageAdapter implements StorageAdapter {
  constructor(private redisClient: any) {}

  async getItem(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async clear(): Promise<void> {
    await this.redisClient.flushdb();
  }
}

// Use custom storage
const redisClient = createRedisClient();
const storageAdapter = new RedisStorageAdapter(redisClient);

const authProvider = new AINativeAuthProvider(
  { storageStrategy: StorageStrategy.CUSTOM },
  storageAdapter
);
```

## Multi-Tenant Support

### Tenant-Specific Authentication

```typescript
const authProvider = new AINativeAuthProvider();

// Authenticate for a specific tenant
const session = await authProvider.authenticate({
  method: AuthMethod.API_KEY,
  apiKey: 'your-api-key',
  tenantId: 'tenant-123', // Specify tenant
});

console.log('Tenant ID:', session.tenantId);

// All subsequent requests will include the tenant context
const headers = authProvider.getAuthHeaders();
```

### Multi-Tenant Application Example

```typescript
class TenantAuthManager {
  private providers = new Map<string, AINativeAuthProvider>();

  async authenticateTenant(tenantId: string, apiKey: string) {
    let provider = this.providers.get(tenantId);

    if (!provider) {
      provider = new AINativeAuthProvider();
      this.providers.set(tenantId, provider);
    }

    await provider.authenticate({
      method: AuthMethod.API_KEY,
      apiKey,
      tenantId,
    });

    return provider;
  }

  getProvider(tenantId: string): AINativeAuthProvider | undefined {
    return this.providers.get(tenantId);
  }

  async logoutTenant(tenantId: string) {
    const provider = this.providers.get(tenantId);
    if (provider) {
      await provider.logout();
      this.providers.delete(tenantId);
    }
  }
}

// Usage
const manager = new TenantAuthManager();

// Authenticate multiple tenants
await manager.authenticateTenant('tenant-1', 'key-1');
await manager.authenticateTenant('tenant-2', 'key-2');

// Use tenant-specific provider
const tenant1Provider = manager.getProvider('tenant-1');
if (tenant1Provider) {
  const headers = tenant1Provider.getAuthHeaders();
  // Make API calls with tenant-1 context
}
```

## Security Considerations

### Best Practices

1. **Never Expose Credentials in Client Code**
   ```typescript
   // ❌ Bad: Hardcoded credentials
   const session = await authProvider.authenticate({
     method: AuthMethod.API_KEY,
     apiKey: 'hardcoded-key-123',
   });

   // ✅ Good: Use environment variables
   const session = await authProvider.authenticate({
     method: AuthMethod.API_KEY,
     apiKey: process.env.AINATIVE_API_KEY!,
   });
   ```

2. **Use HTTPS in Production**
   ```typescript
   const authProvider = new AINativeAuthProvider({
     baseUrl: process.env.NODE_ENV === 'production'
       ? 'https://api.ainative.studio'
       : 'http://localhost:3000',
   });
   ```

3. **Handle Token Expiration**
   ```typescript
   authProvider.addEventListener(AuthEventType.SESSION_EXPIRED, async () => {
     // Clear user data
     clearUserData();

     // Redirect to login
     window.location.href = '/login';
   });
   ```

4. **Implement Refresh Token Rotation**
   ```typescript
   // The auth provider automatically uses new refresh tokens
   authProvider.addEventListener(AuthEventType.REFRESH_SUCCESS, (event) => {
     console.log('New refresh token:', event.session?.refreshToken);
   });
   ```

5. **Rate Limit Handling**
   ```typescript
   try {
     await authProvider.authenticate({
       method: AuthMethod.API_KEY,
       apiKey: apiKey,
     });
   } catch (error) {
     if (error instanceof AuthError &&
         error.type === AuthErrorType.RATE_LIMIT_EXCEEDED) {
       const retryAfter = error.details?.retryAfter || 60;
       console.log(`Rate limited. Retry after ${retryAfter} seconds`);

       // Wait and retry
       await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
       return authProvider.authenticate({
         method: AuthMethod.API_KEY,
         apiKey: apiKey,
       });
     }
     throw error;
   }
   ```

6. **Secure Storage Selection**
   ```typescript
   // For sensitive applications, use session storage
   const authProvider = new AINativeAuthProvider({
     storageStrategy: StorageStrategy.SESSION_STORAGE,
   });

   // Or implement secure custom storage with encryption
   class EncryptedStorageAdapter implements StorageAdapter {
     async setItem(key: string, value: string): Promise<void> {
       const encrypted = encrypt(value);
       await secureStorage.set(key, encrypted);
     }

     async getItem(key: string): Promise<string | null> {
       const encrypted = await secureStorage.get(key);
       return encrypted ? decrypt(encrypted) : null;
     }

     // ... other methods
   }
   ```

## Best Practices

### 1. Centralized Auth Management

```typescript
// auth-service.ts
import { AINativeAuthProvider } from '@ainative/ai-kit-core/auth';

class AuthService {
  private static instance: AINativeAuthProvider;

  static getInstance(): AINativeAuthProvider {
    if (!AuthService.instance) {
      AuthService.instance = new AINativeAuthProvider({
        baseUrl: process.env.AINATIVE_API_URL,
        autoRefresh: true,
        enableLogging: process.env.NODE_ENV === 'development',
      });
    }
    return AuthService.instance;
  }
}

export const authProvider = AuthService.getInstance();
```

### 2. Request Interceptors

```typescript
import axios from 'axios';
import { authProvider } from './auth-service';

const api = axios.create({
  baseURL: process.env.AINATIVE_API_URL,
});

// Add auth headers to all requests
api.interceptors.request.use(
  (config) => {
    const headers = authProvider.getAuthHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authProvider.refreshToken();
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        // Refresh failed, logout user
        await authProvider.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. React Hook for Auth

```typescript
import { useState, useEffect } from 'react';
import { authProvider } from './auth-service';
import { AuthEventType, type AuthSession } from '@ainative/ai-kit-core/auth';

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize session
    const currentSession = authProvider.getSession();
    setSession(currentSession);
    setIsLoading(false);

    // Listen for auth events
    const handleAuthSuccess = (event: any) => {
      setSession(event.session);
    };

    const handleLogout = () => {
      setSession(null);
    };

    authProvider.addEventListener(AuthEventType.AUTH_SUCCESS, handleAuthSuccess);
    authProvider.addEventListener(AuthEventType.LOGOUT_COMPLETED, handleLogout);
    authProvider.addEventListener(AuthEventType.REFRESH_SUCCESS, handleAuthSuccess);

    return () => {
      authProvider.removeEventListener(AuthEventType.AUTH_SUCCESS, handleAuthSuccess);
      authProvider.removeEventListener(AuthEventType.LOGOUT_COMPLETED, handleLogout);
      authProvider.removeEventListener(AuthEventType.REFRESH_SUCCESS, handleAuthSuccess);
    };
  }, []);

  return {
    session,
    isAuthenticated: authProvider.isAuthenticated(),
    isLoading,
    login: authProvider.authenticate.bind(authProvider),
    logout: authProvider.logout.bind(authProvider),
    refreshToken: authProvider.refreshToken.bind(authProvider),
  };
}
```

### 4. Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AINativeAuthProvider, AuthMethod } from '@ainative/ai-kit-core/auth';

describe('Authentication', () => {
  let authProvider: AINativeAuthProvider;

  beforeEach(() => {
    authProvider = new AINativeAuthProvider({
      baseUrl: 'https://test-api.ainative.studio',
    });
  });

  it('should authenticate with API key', async () => {
    const session = await authProvider.authenticate({
      method: AuthMethod.API_KEY,
      apiKey: 'test-key',
    });

    expect(session.status).toBe('AUTHENTICATED');
    expect(session.accessToken).toBeDefined();
  });
});
```

## Advanced Usage

### Concurrent Authentication

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent authentications

const tenants = ['tenant-1', 'tenant-2', 'tenant-3', ...];

const sessions = await Promise.all(
  tenants.map(tenantId =>
    limit(async () => {
      const provider = new AINativeAuthProvider();
      return await provider.authenticate({
        method: AuthMethod.API_KEY,
        apiKey: process.env[`API_KEY_${tenantId}`]!,
        tenantId,
      });
    })
  )
);
```

### Health Monitoring

```typescript
class AuthHealthMonitor {
  private authProvider: AINativeAuthProvider;
  private metrics = {
    totalAuths: 0,
    successfulAuths: 0,
    failedAuths: 0,
    totalRefreshes: 0,
    failedRefreshes: 0,
  };

  constructor(authProvider: AINativeAuthProvider) {
    this.authProvider = authProvider;
    this.setupListeners();
  }

  private setupListeners() {
    this.authProvider.addEventListener(AuthEventType.AUTH_SUCCESS, () => {
      this.metrics.totalAuths++;
      this.metrics.successfulAuths++;
    });

    this.authProvider.addEventListener(AuthEventType.AUTH_FAILED, () => {
      this.metrics.totalAuths++;
      this.metrics.failedAuths++;
    });

    this.authProvider.addEventListener(AuthEventType.REFRESH_SUCCESS, () => {
      this.metrics.totalRefreshes++;
    });

    this.authProvider.addEventListener(AuthEventType.REFRESH_FAILED, () => {
      this.metrics.totalRefreshes++;
      this.metrics.failedRefreshes++;
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      authSuccessRate: this.metrics.totalAuths > 0
        ? (this.metrics.successfulAuths / this.metrics.totalAuths) * 100
        : 0,
      refreshFailureRate: this.metrics.totalRefreshes > 0
        ? (this.metrics.failedRefreshes / this.metrics.totalRefreshes) * 100
        : 0,
    };
  }
}
```

## API Reference

### AINativeAuthProvider Class

#### Constructor

```typescript
constructor(config?: AuthConfig, storageAdapter?: StorageAdapter)
```

#### Methods

##### authenticate(credentials: AuthCredentials): Promise<AuthSession>
Authenticate with AINative using provided credentials.

##### refreshToken(options?: TokenRefreshOptions): Promise<AuthSession>
Refresh the current authentication token.

##### validateSession(): Promise<TokenValidationResult>
Validate the current session.

##### logout(): Promise<void>
Logout and clear the current session.

##### getAuthHeaders(): Record<string, string>
Get authentication headers for API calls.

##### getSession(): AuthSession
Get the current authentication session.

##### isAuthenticated(): boolean
Check if currently authenticated.

##### getConfig(): AuthConfig
Get the current configuration.

##### updateConfig(config: Partial<AuthConfig>): void
Update the configuration.

##### addEventListener(eventType: AuthEventType, listener: AuthEventListener): void
Add an event listener.

##### removeEventListener(eventType: AuthEventType, listener: AuthEventListener): void
Remove an event listener.

## Troubleshooting

### Common Issues

#### 1. Token Refresh Fails

**Problem**: Token refresh fails repeatedly

**Solution**:
```typescript
// Check if refresh token is available
const session = authProvider.getSession();
if (!session.refreshToken) {
  console.error('No refresh token available, re-authenticate');
  await authProvider.authenticate({ /* credentials */ });
}

// Ensure auto-refresh is enabled
authProvider.updateConfig({ autoRefresh: true });

// Listen for refresh failures
authProvider.addEventListener(AuthEventType.REFRESH_FAILED, async (event) => {
  console.error('Refresh failed:', event.error);
  // Re-authenticate
  await authProvider.authenticate({ /* credentials */ });
});
```

#### 2. Network Timeouts

**Problem**: Requests timing out

**Solution**:
```typescript
// Increase timeout
authProvider.updateConfig({
  timeout: 60000, // 60 seconds
  maxRetries: 5,
  retryDelay: 2000,
});
```

#### 3. CORS Issues

**Problem**: CORS errors in browser

**Solution**:
```typescript
// Ensure proper CORS configuration on the server
// Add custom headers if needed
authProvider.updateConfig({
  customHeaders: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});
```

#### 4. Storage Not Persisting

**Problem**: Session lost on refresh

**Solution**:
```typescript
// Use persistent storage
const authProvider = new AINativeAuthProvider({
  storageStrategy: StorageStrategy.LOCAL_STORAGE,
});

// Verify storage is working
console.log('Storage strategy:', authProvider.getConfig().storageStrategy);
```

## Support

For additional support:
- Documentation: https://docs.ainative.studio
- GitHub Issues: https://github.com/AINative-Studio/ai-kit/issues
- Discord Community: https://discord.com/invite/paipalooza
- Email: support@ainative.studio

## License

MIT License - see LICENSE file for details
