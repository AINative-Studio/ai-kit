import { test as base } from '@playwright/test';
import path from 'path';

/**
 * Authentication fixtures for E2E tests
 *
 * Provides pre-authenticated contexts for different user roles:
 * - Admin users (full access)
 * - Regular users (standard access)
 * - Guest users (limited access)
 */

// Define user types
export type UserRole = 'admin' | 'user' | 'guest';

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  token?: string;
}

// Test users
export const testUsers: Record<UserRole, AuthUser> = {
  admin: {
    email: 'admin@aikit.test',
    name: 'Admin User',
    role: 'admin',
    token: 'test-admin-token',
  },
  user: {
    email: 'user@aikit.test',
    name: 'Test User',
    role: 'user',
    token: 'test-user-token',
  },
  guest: {
    email: 'guest@aikit.test',
    name: 'Guest User',
    role: 'guest',
  },
};

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<{
  authenticatedPage: any;
  adminPage: any;
  userPage: any;
  guestPage: any;
}>({
  /**
   * Generic authenticated page
   */
  authenticatedPage: async ({ browser }, use, testInfo) => {
    const role = (testInfo.project.name.includes('admin')
      ? 'admin'
      : 'user') as UserRole;
    const authFile = path.resolve(
      __dirname,
      '..',
      '.auth',
      `${role}.json`
    );

    const context = await browser.newContext({
      storageState: authFile,
    });

    const page = await context.newPage();

    await use(page);

    await context.close();
  },

  /**
   * Admin authenticated page
   */
  adminPage: async ({ browser }, use) => {
    const authFile = path.resolve(__dirname, '..', '.auth', 'admin.json');

    const context = await browser.newContext({
      storageState: authFile,
    });

    const page = await context.newPage();

    // Add custom admin helpers
    await page.addInitScript(() => {
      (window as any).__USER_ROLE__ = 'admin';
    });

    await use(page);

    await context.close();
  },

  /**
   * Regular user authenticated page
   */
  userPage: async ({ browser }, use) => {
    const authFile = path.resolve(__dirname, '..', '.auth', 'user.json');

    const context = await browser.newContext({
      storageState: authFile,
    });

    const page = await context.newPage();

    // Add custom user helpers
    await page.addInitScript(() => {
      (window as any).__USER_ROLE__ = 'user';
    });

    await use(page);

    await context.close();
  },

  /**
   * Guest (unauthenticated) page
   */
  guestPage: async ({ browser }, use) => {
    const authFile = path.resolve(__dirname, '..', '.auth', 'guest.json');

    const context = await browser.newContext({
      storageState: authFile,
    });

    const page = await context.newPage();

    // Add custom guest helpers
    await page.addInitScript(() => {
      (window as any).__USER_ROLE__ = 'guest';
    });

    await use(page);

    await context.close();
  },
});

export { expect } from '@playwright/test';
