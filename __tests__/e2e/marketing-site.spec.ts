import { test, expect } from '@playwright/test';
import * as path from 'path';

// Get the marketing site path - resolve from project root
const MARKETING_SITE_PATH = path.resolve(__dirname, '../../website/index.html');
const MARKETING_SITE_URL = `file://${MARKETING_SITE_PATH}`;

test.describe('Marketing Site - Acceptance Criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);
  });

  test('AC1: Landing page displays value proposition', async ({ page }) => {
    // Check hero section exists
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();

    // Verify main headline
    const headline = page.locator('h1');
    await expect(headline).toContainText('Build AI Apps');
    await expect(headline).toContainText('Without the Boilerplate');

    // Verify badge
    const badge = page.locator('.hero-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('The Stripe for LLM Applications');

    // Verify description
    const description = page.locator('.hero-description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('Framework-agnostic SDK');

    // Verify key statistics
    const stats = page.locator('.stats');
    await expect(stats).toBeVisible();

    const stat1 = page.locator('.stat').filter({ hasText: '2,000+' });
    await expect(stat1).toBeVisible();
    await expect(stat1).toContainText('Tests Passing');
  });

  test('AC2: Code examples are displayed', async ({ page }) => {
    // Navigate to examples section
    const examplesSection = page.locator('#examples');
    await expect(examplesSection).toBeVisible();

    // Check "Before" code block (without AI Kit)
    const beforeBlock = page.locator('.code-block').filter({ hasText: 'Without AI Kit' });
    await expect(beforeBlock).toBeVisible();

    // Check "After" code block (with AI Kit)
    const afterBlock = page.locator('.code-block').filter({ hasText: 'With AI Kit' });
    await expect(afterBlock).toBeVisible();

    // Verify code content
    const afterCode = afterBlock.locator('.code-content');
    await expect(afterCode).toContainText('useAIChat');
  });

  test('AC3: Links to documentation, GitHub, and Discord are present', async ({ page }) => {
    // Check navigation links
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // GitHub link in navigation
    const githubNavLink = page.locator('.nav-links a[href*="github.com"]');
    await expect(githubNavLink).toHaveAttribute('href', 'https://github.com/AINative-Studio/ai-kit');

    // Discord link in navigation
    const discordNavLink = page.locator('.nav-links a[href*="discord.gg"]');
    await expect(discordNavLink).toHaveAttribute('href', 'https://discord.com/invite/paipalooza');

    // Check footer links
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const githubFooterLink = footer.locator('a[href*="github.com"]').first();
    await expect(githubFooterLink).toBeVisible();
  });

  test('AC4: "Get Started" CTA is prominent and functional', async ({ page }) => {
    // Check hero CTAs (visible on all devices)
    const heroGetStarted = page.locator('.hero-cta a.btn-primary');
    await expect(heroGetStarted).toBeVisible();
    await expect(heroGetStarted).toContainText('Get Started');

    // Check "Ready to Build?" CTA section
    const ctaSection = page.locator('.cta-section');
    await expect(ctaSection).toBeVisible();
    await expect(ctaSection.locator('h2')).toContainText('Ready to Build');

    // Click hero CTA and verify it navigates to docs section
    await heroGetStarted.click();
    await page.waitForTimeout(500); // Wait for smooth scroll
    await expect(page.locator('#docs')).toBeInViewport();
  });
});

test.describe('Marketing Site - SEO & Meta Tags', () => {
  test('has correct meta tags', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Title
    await expect(page).toHaveTitle(/AI Kit.*Stripe for LLM Applications/i);

    // Meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /AI Kit.*Framework-agnostic SDK/);

    // Meta keywords
    const metaKeywords = page.locator('meta[name="keywords"]');
    await expect(metaKeywords).toHaveAttribute('content', /AI.*LLM/);
  });

  test('has proper semantic HTML structure', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Main sections
    const sections = page.locator('section');
    await expect(sections.first()).toBeVisible();

    // Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Single h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });
});

test.describe('Marketing Site - Responsive Design', () => {
  test('displays correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(MARKETING_SITE_URL);

    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    // Code comparison should be side by side
    const codeComparison = page.locator('.code-comparison');
    await expect(codeComparison).toBeVisible();
  });

  test('displays correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(MARKETING_SITE_URL);

    const mobileMenuBtn = page.locator('.mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();

    // Hero should be visible
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
  });

  test('displays correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(MARKETING_SITE_URL);

    // Navigation should be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Content should be readable
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
  });
});

test.describe('Marketing Site - Features', () => {
  test('displays all key features', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();

    // Check for feature cards
    const featureCards = featuresSection.locator('.feature-card');
    await expect(featureCards).toHaveCount(6);

    // Verify key features
    await expect(featuresSection).toContainText('Streaming Primitives');
    await expect(featuresSection).toContainText('Agent Orchestration');
    await expect(featuresSection).toContainText('Security First');
  });

  test('feature cards have proper structure', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Get the first feature card from the main features section
    const featuresSection = page.locator('#features');
    const firstCard = featuresSection.locator('.feature-card').first();
    await expect(firstCard).toBeVisible();

    // Each card should have icon, title, and description
    await expect(firstCard.locator('.feature-icon')).toBeVisible();
    await expect(firstCard.locator('.feature-title')).toBeVisible();
    await expect(firstCard.locator('.feature-description')).toBeVisible();
  });
});

test.describe('Marketing Site - Installation', () => {
  test('displays installation instructions', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const docsSection = page.locator('#docs');
    await expect(docsSection).toBeVisible();

    // Check installation code block
    const installBlock = docsSection.locator('.code-block');
    await expect(installBlock).toBeVisible();
    await expect(installBlock).toContainText('npm install @ainative/ai-kit');
    await expect(installBlock).toContainText('npx @ainative/ai-kit-cli create');
  });
});

test.describe('Marketing Site - Footer', () => {
  test('displays all footer sections', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check footer sections exist
    const sections = footer.locator('.footer-section');
    await expect(sections).toHaveCount(4);

    // Verify content
    await expect(footer).toContainText('AI Kit');
    await expect(footer).toContainText('Product');
    await expect(footer).toContainText('Resources');
    await expect(footer).toContainText('Community');

    // Copyright
    await expect(footer).toContainText('MIT License');
    await expect(footer).toContainText('AINative Studio');
  });
});

test.describe('Marketing Site - Navigation', () => {
  test('smooth scrolling works for anchor links', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Click on Features link
    const featuresLink = page.locator('.nav-links a[href="#features"]');
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await page.waitForTimeout(500); // Wait for smooth scroll
      await expect(page.locator('#features')).toBeInViewport();
    }
  });

  test('navigation is sticky', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(200);

    // Nav should still be visible
    await expect(nav).toBeVisible();
  });
});

test.describe('Marketing Site - Accessibility', () => {
  test('mobile menu has aria-label', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const mobileMenuBtn = page.locator('.mobile-menu-btn');
    await expect(mobileMenuBtn).toHaveAttribute('aria-label', 'Toggle menu');
  });

  test('external links open in new tab with proper rel', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // GitHub link should have target="_blank" and rel="noopener"
    const githubLink = page.locator('.nav-links a[href*="github.com"]');
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener');
  });
});

test.describe('Marketing Site - Performance', () => {
  test('fonts are preconnected', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Check for preconnect links
    const preconnectGoogle = page.locator('link[rel="preconnect"][href*="googleapis.com"]');
    await expect(preconnectGoogle).toHaveCount(1);
  });

  test('page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(MARKETING_SITE_URL);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });
});
