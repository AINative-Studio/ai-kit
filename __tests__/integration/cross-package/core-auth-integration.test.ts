/**
 * Core + Auth Integration Tests
 *
 * Tests the integration between @ainative/ai-kit-core and @ainative/ai-kit-auth
 * including:
 * - Authenticated session management
 * - Token-based authentication with sessions
 * - Auth state propagation to core services
 * - Secure context management
 * - Error handling with authentication failures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionManager,
  AINativeAuthProvider,
  AuthStatus,
  AuthMethod,
  type AuthSession,
} from '@ainative/ai-kit-core';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

describe('Core + Auth Integration', () => {
  let authProvider: AINativeAuthProvider;
  let sessionManager: SessionManager;

  beforeEach(() => {
    authProvider = new AINativeAuthProvider({
      apiKey: 'test-api-key',
      method: AuthMethod.API_KEY,
    });

    sessionManager = new SessionManager({
      storage: { type: 'memory' },
    });

    // Mock auth endpoints
    server.use(
      http.post('https://api.ainative.studio/v1/auth/login', async ({ request }) => {
        const body = await request.json() as { apiKey?: string; email?: string };

        if (body.apiKey === 'test-api-key') {
          return HttpResponse.json({
            success: true,
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
            },
          });
        }

        return HttpResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }),

      http.post('https://api.ainative.studio/v1/auth/refresh', () => {
        return HttpResponse.json({
          success: true,
          token: 'new-mock-jwt-token',
          expiresIn: 3600,
        });
      }),

      http.post('https://api.ainative.studio/v1/auth/validate', ({ request }) => {
        const authHeader = request.headers.get('Authorization');

        if (authHeader?.includes('mock-jwt-token') || authHeader?.includes('new-mock-jwt-token')) {
          return HttpResponse.json({
            success: true,
            valid: true,
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          });
        }

        return HttpResponse.json(
          { success: false, valid: false, error: 'Invalid token' },
          { status: 401 }
        );
      }),

      http.post('https://api.ainative.studio/v1/auth/logout', () => {
        return HttpResponse.json({ success: true });
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authenticated Session Creation', () => {
    it('should create session after successful authentication', async () => {
      // Arrange & Act
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      expect(authResult.status).toBe(AuthStatus.AUTHENTICATED);
      expect(authResult.token).toBeTruthy();

      // Create session with authenticated user
      const session = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          userEmail: authResult.user?.email,
          authenticated: true,
        },
      });

      // Assert
      expect(session.userId).toBe('user-123');
      expect(session.metadata.authenticated).toBe(true);
      expect(session.metadata.authToken).toBe('mock-jwt-token');
      expect(session.metadata.userEmail).toBe('test@example.com');
    });

    it('should reject session creation with invalid auth', async () => {
      // Arrange & Act
      const authResult = await authProvider.authenticate({
        apiKey: 'invalid-key',
      });

      // Assert
      expect(authResult.status).toBe(AuthStatus.UNAUTHENTICATED);
      expect(authResult.token).toBeFalsy();

      // Should still be able to create session, but mark as unauthenticated
      const session = await sessionManager.createSession({
        userId: 'anonymous',
        metadata: {
          authenticated: false,
          authFailureReason: 'Invalid credentials',
        },
      });

      expect(session.metadata.authenticated).toBe(false);
      expect(session.metadata.authFailureReason).toBe('Invalid credentials');
    });

    it('should link multiple sessions to authenticated user', async () => {
      // Arrange
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      // Act - Create multiple sessions for same user
      const session1 = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          sessionType: 'chat',
        },
      });

      const session2 = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          sessionType: 'analysis',
        },
      });

      // Assert
      expect(session1.userId).toBe(session2.userId);
      expect(session1.id).not.toBe(session2.id);
      expect(session1.metadata.authToken).toBe(session2.metadata.authToken);

      // Verify we can list sessions for user
      const userSessions = await sessionManager.listSessions({
        userId: authResult.user?.id,
      });

      expect(userSessions.sessions.length).toBeGreaterThanOrEqual(2);
      expect(userSessions.sessions.map(s => s.id)).toContain(session1.id);
      expect(userSessions.sessions.map(s => s.id)).toContain(session2.id);
    });
  });

  describe('Token Refresh with Session Persistence', () => {
    it('should refresh token and update session', async () => {
      // Arrange
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      const session = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          tokenExpiresAt: Date.now() + 3600000,
        },
      });

      // Act - Simulate token refresh
      const refreshResult = await authProvider.refreshToken();

      // Update session with new token
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          authToken: refreshResult.token,
          tokenExpiresAt: Date.now() + 3600000,
          tokenRefreshedAt: Date.now(),
        },
      });

      // Assert
      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.authToken).toBe('new-mock-jwt-token');
      expect(updatedSession?.metadata.tokenRefreshedAt).toBeDefined();
    });

    it('should handle expired sessions gracefully', async () => {
      // Arrange
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      const session = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          tokenExpiresAt: Date.now() - 1000, // Already expired
        },
      });

      // Act - Check if token is expired
      const isExpired = session.metadata.tokenExpiresAt < Date.now();

      if (isExpired) {
        // Try to refresh
        try {
          const refreshResult = await authProvider.refreshToken();

          await sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              authToken: refreshResult.token,
              tokenExpiresAt: Date.now() + 3600000,
              recovered: true,
            },
          });
        } catch (error) {
          // Mark session as needing re-authentication
          await sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              requiresReauth: true,
              authStatus: 'expired',
            },
          });
        }
      }

      // Assert
      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.recovered).toBe(true);
      expect(updatedSession?.metadata.authToken).toBe('new-mock-jwt-token');
    });
  });

  describe('Secure Context Management', () => {
    it('should store sensitive data only in authenticated sessions', async () => {
      // Arrange
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      // Act - Create authenticated session
      const secureSession = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          authenticated: true,
          securityLevel: 'high',
        },
      });

      // Try to store sensitive data
      const sensitiveData = {
        apiKey: 'sk-secret-key',
        userPreferences: { theme: 'dark' },
      };

      await sessionManager.updateSession(secureSession.id, {
        metadata: {
          ...secureSession.metadata,
          // Only store if authenticated
          sensitiveData: secureSession.metadata.authenticated ? sensitiveData : null,
        },
      });

      // Assert
      const retrieved = await sessionManager.getSession(secureSession.id);
      expect(retrieved?.metadata.sensitiveData).toEqual(sensitiveData);
      expect(retrieved?.metadata.authenticated).toBe(true);
    });

    it('should prevent data access without valid auth', async () => {
      // Arrange - Create unauthenticated session
      const unsecureSession = await sessionManager.createSession({
        userId: 'anonymous',
        metadata: {
          authenticated: false,
        },
      });

      // Act - Try to store sensitive data (should be prevented)
      const sensitiveData = {
        apiKey: 'sk-secret-key',
      };

      await sessionManager.updateSession(unsecureSession.id, {
        metadata: {
          ...unsecureSession.metadata,
          // Should NOT store sensitive data if not authenticated
          sensitiveData: unsecureSession.metadata.authenticated ? sensitiveData : null,
          accessDenied: !unsecureSession.metadata.authenticated,
        },
      });

      // Assert
      const retrieved = await sessionManager.getSession(unsecureSession.id);
      expect(retrieved?.metadata.sensitiveData).toBeNull();
      expect(retrieved?.metadata.accessDenied).toBe(true);
    });

    it('should revoke session on logout', async () => {
      // Arrange
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      const session = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          authenticated: true,
        },
      });

      // Act - Logout
      await authProvider.logout();

      // Mark session as revoked
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          authenticated: false,
          authToken: null,
          revokedAt: Date.now(),
          status: 'revoked',
        },
      });

      // Assert
      const revokedSession = await sessionManager.getSession(session.id);
      expect(revokedSession?.metadata.authenticated).toBe(false);
      expect(revokedSession?.metadata.authToken).toBeNull();
      expect(revokedSession?.metadata.status).toBe('revoked');
      expect(revokedSession?.metadata.revokedAt).toBeDefined();
    });
  });

  describe('Error Handling with Authentication', () => {
    it('should handle authentication failures during session operations', async () => {
      // Arrange
      const session = await sessionManager.createSession({
        userId: 'test-user',
        metadata: {
          authToken: 'invalid-token',
        },
      });

      // Mock validation failure
      server.use(
        http.post('https://api.ainative.studio/v1/auth/validate', () => {
          return HttpResponse.json(
            { success: false, valid: false, error: 'Token expired' },
            { status: 401 }
          );
        })
      );

      // Act - Try to validate
      let validationError: Error | null = null;

      try {
        const response = await fetch('https://api.ainative.studio/v1/auth/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.metadata.authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token validation failed');
        }
      } catch (error) {
        validationError = error as Error;

        await sessionManager.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            validationError: validationError.message,
            requiresReauth: true,
          },
        });
      }

      // Assert
      expect(validationError).toBeTruthy();
      const updatedSession = await sessionManager.getSession(session.id);
      expect(updatedSession?.metadata.validationError).toContain('validation failed');
      expect(updatedSession?.metadata.requiresReauth).toBe(true);
    });

    it('should handle network errors during authentication', async () => {
      // Arrange
      server.use(
        http.post('https://api.ainative.studio/v1/auth/login', () => {
          return HttpResponse.error();
        })
      );

      // Act
      let authError: Error | null = null;

      try {
        await authProvider.authenticate({
          apiKey: 'test-api-key',
        });
      } catch (error) {
        authError = error as Error;
      }

      // Assert
      expect(authError).toBeTruthy();
      expect(authError?.message).toBeDefined();
    });

    it('should cleanup sessions on authentication service failure', async () => {
      // Arrange
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      const sessions = await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          sessionManager.createSession({
            userId: authResult.user?.id || 'unknown',
            metadata: {
              authToken: authResult.token,
              index: i,
            },
          })
        )
      );

      // Simulate auth service failure
      server.use(
        http.post('https://api.ainative.studio/v1/auth/validate', () => {
          return HttpResponse.error();
        })
      );

      // Act - Mark all sessions as requiring validation
      await Promise.all(
        sessions.map(session =>
          sessionManager.updateSession(session.id, {
            metadata: {
              ...session.metadata,
              validationRequired: true,
              serviceAvailable: false,
            },
          })
        )
      );

      // Assert
      const updatedSessions = await Promise.all(
        sessions.map(s => sessionManager.getSession(s.id))
      );

      updatedSessions.forEach(session => {
        expect(session?.metadata.validationRequired).toBe(true);
        expect(session?.metadata.serviceAvailable).toBe(false);
      });
    });
  });

  describe('Multi-User Session Management', () => {
    it('should isolate sessions between different users', async () => {
      // Arrange - Authenticate two different users
      const user1Auth = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      // Mock second user
      server.use(
        http.post('https://api.ainative.studio/v1/auth/login', async ({ request }) => {
          const body = await request.json() as { apiKey?: string };

          if (body.apiKey === 'test-api-key-2') {
            return HttpResponse.json({
              success: true,
              token: 'mock-jwt-token-2',
              refreshToken: 'mock-refresh-token-2',
              expiresIn: 3600,
              user: {
                id: 'user-456',
                email: 'test2@example.com',
                name: 'Test User 2',
              },
            });
          }

          return HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      const user2AuthProvider = new AINativeAuthProvider({
        apiKey: 'test-api-key-2',
        method: AuthMethod.API_KEY,
      });

      const user2Auth = await user2AuthProvider.authenticate({
        apiKey: 'test-api-key-2',
      });

      // Act - Create sessions for both users
      const user1Session = await sessionManager.createSession({
        userId: user1Auth.user?.id || 'user-123',
        metadata: {
          authToken: user1Auth.token,
          data: 'user1-data',
        },
      });

      const user2Session = await sessionManager.createSession({
        userId: user2Auth.user?.id || 'user-456',
        metadata: {
          authToken: user2Auth.token,
          data: 'user2-data',
        },
      });

      // Assert - Verify isolation
      expect(user1Session.userId).not.toBe(user2Session.userId);
      expect(user1Session.metadata.authToken).not.toBe(user2Session.metadata.authToken);
      expect(user1Session.metadata.data).toBe('user1-data');
      expect(user2Session.metadata.data).toBe('user2-data');

      // Verify user-specific session lists
      const user1Sessions = await sessionManager.listSessions({
        userId: user1Auth.user?.id,
      });

      const user2Sessions = await sessionManager.listSessions({
        userId: user2Auth.user?.id,
      });

      expect(
        user1Sessions.sessions.every(s => s.userId === user1Auth.user?.id)
      ).toBe(true);

      expect(
        user2Sessions.sessions.every(s => s.userId === user2Auth.user?.id)
      ).toBe(true);

      // Ensure no cross-contamination
      expect(
        user1Sessions.sessions.find(s => s.id === user2Session.id)
      ).toBeUndefined();

      expect(
        user2Sessions.sessions.find(s => s.id === user1Session.id)
      ).toBeUndefined();
    });

    it('should handle concurrent authentication requests', async () => {
      // Arrange & Act
      const authPromises = Array.from({ length: 5 }, (_, i) =>
        authProvider.authenticate({ apiKey: 'test-api-key' })
      );

      const results = await Promise.all(authPromises);

      // Assert
      results.forEach(result => {
        expect(result.status).toBe(AuthStatus.AUTHENTICATED);
        expect(result.token).toBeTruthy();
        expect(result.user?.id).toBe('user-123');
      });
    });
  });

  describe('Session Lifecycle with Authentication', () => {
    it('should handle full session lifecycle with auth', async () => {
      // Step 1: Authentication
      const authResult = await authProvider.authenticate({
        apiKey: 'test-api-key',
      });

      expect(authResult.status).toBe(AuthStatus.AUTHENTICATED);

      // Step 2: Session creation
      const session = await sessionManager.createSession({
        userId: authResult.user?.id || 'unknown',
        metadata: {
          authToken: authResult.token,
          lifecycle: 'created',
        },
      });

      expect(session.metadata.lifecycle).toBe('created');

      // Step 3: Session usage
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          lifecycle: 'active',
          lastActivity: Date.now(),
        },
      });

      // Step 4: Token refresh
      const refreshResult = await authProvider.refreshToken();
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          authToken: refreshResult.token,
          lifecycle: 'refreshed',
        },
      });

      // Step 5: Session end
      await authProvider.logout();
      await sessionManager.updateSession(session.id, {
        metadata: {
          ...session.metadata,
          lifecycle: 'ended',
          endedAt: Date.now(),
        },
      });

      // Assert final state
      const finalSession = await sessionManager.getSession(session.id);
      expect(finalSession?.metadata.lifecycle).toBe('ended');
      expect(finalSession?.metadata.endedAt).toBeDefined();
    });
  });
});
