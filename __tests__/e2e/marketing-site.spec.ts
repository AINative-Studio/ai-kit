import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the marketing site HTML file
const MARKETING_SITE_PATH = join(__dirname, '../../website/index.html');
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
    await expect(description).toContainText('streaming, agents, safety, and observability');

    // Verify key statistics
    const stats = page.locator('.stats');
    await expect(stats).toBeVisible();

    const stat1 = page.locator('.stat').filter({ hasText: '2,000+' });
    await expect(stat1).toBeVisible();
    await expect(stat1).toContainText('Tests Passing');

    const stat2 = page.locator('.stat').filter({ hasText: '15+' });
    await expect(stat2).toBeVisible();
    await expect(stat2).toContainText('Packages');

    const stat3 = page.locator('.stat').filter({ hasText: '100%' });
    await expect(stat3).toBeVisible();
    await expect(stat3).toContainText('TypeScript');
  });

  test('AC2: Code examples are displayed', async ({ page }) => {
    // Navigate to examples section
    const examplesSection = page.locator('#examples');
    await expect(examplesSection).toBeVisible();

    // Check "Before" code block (without AI Kit)
    const beforeBlock = page.locator('.code-block').filter({ hasText: 'Without AI Kit' });
    await expect(beforeBlock).toBeVisible();
    await expect(beforeBlock.locator('.code-badge')).toContainText('100+ lines');

    // Verify before code contains boilerplate
    const beforeCode = beforeBlock.locator('.code-content');
    await expect(beforeCode).toContainText('useState');
    await expect(beforeCode).toContainText('getReader');
    await expect(beforeCode).toContainText('TextDecoder');

    // Check "After" code block (with AI Kit)
    const afterBlock = page.locator('.code-block').filter({ hasText: 'With AI Kit' });
    await expect(afterBlock).toBeVisible();
    await expect(afterBlock.locator('.code-badge')).toContainText('4 lines');

    // Verify after code is concise
    const afterCode = afterBlock.locator('.code-content');
    await expect(afterCode).toContainText('useAIChat');
    await expect(afterCode).toContainText('@ainative/ai-kit');

    // Check additional examples
    const agentExample = page.locator('.feature-card').filter({ hasText: 'Agent Orchestration' });
    await expect(agentExample).toBeVisible();
    await expect(agentExample).toContainText('AgentExecutor');
    await expect(agentExample).toContainText('claude-sonnet-4');

    const safetyExample = page.locator('.feature-card').filter({ hasText: 'Safety & Security' });
    await expect(safetyExample).toBeVisible();
    await expect(safetyExample).toContainText('PromptInjectionDetector');
    await expect(safetyExample).toContainText('PIIDetector');

    const observabilityExample = page.locator('.feature-card').filter({ hasText: 'Observability Built-in' });
    await expect(observabilityExample).toBeVisible();
    await expect(observabilityExample).toContainText('QueryTracker');
  });

  test('AC3: Links to documentation, GitHub, and Discord are present', async ({ page }) => {
    // Check navigation links
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // GitHub link in navigation
    const githubNavLink = page.locator('.nav-links a[href*="github.com"]');
    await expect(githubNavLink).toHaveAttribute('href', 'https://github.com/AINative-Studio/ai-kit');
    await expect(githubNavLink).toHaveAttribute('target', '_blank');

    // Discord link in navigation
    const discordNavLink = page.locator('.nav-links a[href*="discord.gg"]');
    await expect(discordNavLink).toHaveAttribute('href', 'https://discord.gg/ainative');
    await expect(discordNavLink).toHaveAttribute('target', '_blank');

    // Check footer links
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const githubFooterLink = footer.locator('a[href*="github.com"]').first();
    await expect(githubFooterLink).toBeVisible();

    const discordFooterLink = footer.locator('a[href*="discord.gg"]');
    await expect(discordFooterLink).toBeVisible();

    // Documentation links
    const docsLinks = footer.locator('a').filter({ hasText: /Documentation|API Reference|Examples/ });
    await expect(docsLinks.first()).toBeVisible();
  });

  test('AC4: "Get Started" CTA is prominent and functional', async ({ page }) => {
    // Check primary CTA in navigation
    const navCTA = page.locator('.nav-links .btn-primary');
    await expect(navCTA).toBeVisible();
    await expect(navCTA).toContainText('Get Started');
    await expect(navCTA).toHaveAttribute('href', '#docs');

    // Check hero CTAs
    const heroGetStarted = page.locator('.hero-cta a.btn-primary');
    await expect(heroGetStarted).toBeVisible();
    await expect(heroGetStarted).toContainText('Get Started');

    const heroGitHub = page.locator('.hero-cta a.btn-secondary');
    await expect(heroGitHub).toBeVisible();
    await expect(heroGitHub).toContainText('View on GitHub');

    // Check "Ready to Build?" CTA section
    const ctaSection = page.locator('.cta-section');
    await expect(ctaSection).toBeVisible();
    await expect(ctaSection.locator('h2')).toContainText('Ready to Build?');

    const ctaButton = ctaSection.locator('a.btn-white');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toContainText('Get Started');

    // Click CTA and verify it navigates to docs section
    await navCTA.click();
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
    await expect(metaKeywords).toHaveAttribute('content', /AI.*LLM.*React.*SDK/);

    // Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /AI Kit.*Stripe for LLM Applications/);

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content', /Framework-agnostic SDK/);

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute('content', 'website');
  });

  test('has proper semantic HTML structure', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Main sections
    const sections = page.locator('section');
    await expect(sections).toHaveCount(5); // hero, examples, features, cta, docs

    // Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Headings hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    const h2s = page.locator('h2');
    await expect(h2s.first()).toBeVisible();

    const h3s = page.locator('h3');
    await expect(h3s.first()).toBeVisible();
  });
});

test.describe('Marketing Site - Responsive Design', () => {
  test('displays correctly on desktop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Desktop test runs on chromium only');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(MARKETING_SITE_URL);

    // Navigation should be horizontal
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    // Code comparison should be side-by-side
    const codeComparison = page.locator('.code-comparison');
    await expect(codeComparison).toBeVisible();

    // Hero content should be centered
    const heroContent = page.locator('.hero-content');
    await expect(heroContent).toBeVisible();

    // Features grid should have multiple columns
    const featuresGrid = page.locator('.features-grid');
    await expect(featuresGrid).toBeVisible();
  });

  test('displays correctly on tablet', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Tablet test runs on chromium only');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(MARKETING_SITE_URL);

    // Navigation should still be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Hero should be readable
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();

    // Content should adapt
    const sections = page.locator('section');
    await expect(sections.first()).toBeVisible();
  });

  test('displays correctly on mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Mobile test runs on chromium only');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(MARKETING_SITE_URL);

    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('.mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();

    // Hero content should stack vertically
    const heroCTA = page.locator('.hero-cta');
    await expect(heroCTA).toBeVisible();

    // Code blocks should stack
    const codeBlocks = page.locator('.code-block');
    await expect(codeBlocks.first()).toBeVisible();

    // Features should stack
    const features = page.locator('.feature-card');
    await expect(features.first()).toBeVisible();

    // Buttons should be full width on mobile
    const buttons = page.locator('.btn').first();
    await expect(buttons).toBeVisible();
  });
});

test.describe('Marketing Site - Features Section', () => {
  test('displays all key features', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();

    // Check for all feature cards
    const featureCards = featuresSection.locator('.feature-card');
    await expect(featureCards).toHaveCount(6);

    // Verify each feature
    const features = [
      'Streaming Primitives',
      'Agent Orchestration',
      'Framework Agnostic',
      'Security First',
      'Cost & Observability',
      'Testing Utilities',
    ];

    for (const feature of features) {
      const card = featureCards.filter({ hasText: feature });
      await expect(card).toBeVisible();

      // Each card should have an icon, title, and description
      await expect(card.locator('.feature-icon')).toBeVisible();
      await expect(card.locator('.feature-title')).toContainText(feature);
      await expect(card.locator('.feature-description')).toBeVisible();
    }
  });

  test('feature cards have hover effects', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const firstCard = page.locator('.feature-card').first();
    await expect(firstCard).toBeVisible();

    // Hover over card
    await firstCard.hover();

    // Card should still be visible after hover
    await expect(firstCard).toBeVisible();
  });
});

test.describe('Marketing Site - Installation Section', () => {
  test('displays installation instructions', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const docsSection = page.locator('#docs');
    await expect(docsSection).toBeVisible();

    // Check installation code block
    const installBlock = docsSection.locator('.code-block');
    await expect(installBlock).toBeVisible();
    await expect(installBlock).toContainText('npm install @ainative/ai-kit');

    // Check CLI commands
    await expect(installBlock).toContainText('npx @ainative/ai-kit-cli create');

    // Check templates
    await expect(installBlock).toContainText('--template react-chat');
    await expect(installBlock).toContainText('--template nextjs-ai');
    await expect(installBlock).toContainText('--template agent-system');
  });
});

test.describe('Marketing Site - Footer', () => {
  test('displays all footer sections', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check footer sections
    const sections = footer.locator('.footer-section');
    await expect(sections).toHaveCount(4); // AI Kit, Product, Resources, Community

    // AI Kit section
    await expect(sections.filter({ hasText: 'AI Kit' })).toBeVisible();
    await expect(footer).toContainText('The Stripe for LLM Applications');

    // Product section
    await expect(sections.filter({ hasText: 'Product' })).toBeVisible();

    // Resources section
    await expect(sections.filter({ hasText: 'Resources' })).toBeVisible();

    // Community section
    await expect(sections.filter({ hasText: 'Community' })).toBeVisible();

    // Copyright
    const copyright = footer.locator('.footer-bottom');
    await expect(copyright).toBeVisible();
    await expect(copyright).toContainText('MIT License');
    await expect(copyright).toContainText('AINative Studio');
  });
});

test.describe('Marketing Site - Navigation', () => {
  test('navigation is sticky and always visible', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));

    // Nav should still be visible
    await expect(nav).toBeVisible();
  });

  test('smooth scrolling works for anchor links', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Click on Features link
    await page.locator('.nav-links a[href="#features"]').click();

    // Features section should be in viewport
    await expect(page.locator('#features')).toBeInViewport();

    // Click on Examples link
    await page.locator('.nav-links a[href="#examples"]').click();

    // Examples section should be in viewport
    await expect(page.locator('#examples')).toBeInViewport();
  });

  test('external links open in new tab', async ({ page, context }) => {
    await page.goto(MARKETING_SITE_URL);

    // GitHub link should have target="_blank"
    const githubLink = page.locator('.nav-links a[href*="github.com"]');
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener');

    // Discord link should have target="_blank"
    const discordLink = page.locator('.nav-links a[href*="discord.gg"]');
    await expect(discordLink).toHaveAttribute('target', '_blank');
    await expect(discordLink).toHaveAttribute('rel', 'noopener');
  });
});

test.describe('Marketing Site - Styling & UX', () => {
  test('uses consistent color scheme', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Check CSS variables are defined
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        bgPrimary: styles.getPropertyValue('--bg-primary'),
        textPrimary: styles.getPropertyValue('--text-primary'),
        accentPrimary: styles.getPropertyValue('--accent-primary'),
      };
    });

    expect(rootStyles.bgPrimary).toBeTruthy();
    expect(rootStyles.textPrimary).toBeTruthy();
    expect(rootStyles.accentPrimary).toBeTruthy();
  });

  test('code blocks have syntax highlighting', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const codeContent = page.locator('.code-content').first();
    await expect(codeContent).toBeVisible();

    // Check for syntax highlighting classes
    const keywords = codeContent.locator('.keyword');
    await expect(keywords.first()).toBeVisible();

    const functions = codeContent.locator('.function');
    await expect(functions.first()).toBeVisible();

    const strings = codeContent.locator('.string');
    await expect(strings.first()).toBeVisible();
  });

  test('gradient text is visible', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const gradientText = page.locator('.gradient-text');
    await expect(gradientText).toBeVisible();
    await expect(gradientText).toContainText('Without the Boilerplate');
  });

  test('animations are applied', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    const heroContent = page.locator('.hero-content');
    await expect(heroContent).toHaveClass(/fade-in-up/);
  });
});

test.describe('Marketing Site - Accessibility', () => {
  test('has proper ARIA labels', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Mobile menu button should have aria-label
    const mobileMenuBtn = page.locator('.mobile-menu-btn');
    await expect(mobileMenuBtn).toHaveAttribute('aria-label', 'Toggle menu');
  });

  test('all images have alt text or are decorative', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();

    // All images should either have alt text or be marked as decorative
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const hasAlt = await img.getAttribute('alt');
      const hasRole = await img.getAttribute('role');

      // Either has alt text or is marked decorative
      expect(hasAlt !== null || hasRole === 'presentation').toBeTruthy();
    }
  });

  test('links have sufficient contrast', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Navigation links should be visible
    const navLinks = page.locator('.nav-links a');
    await expect(navLinks.first()).toBeVisible();

    // Footer links should be visible
    const footerLinks = page.locator('.footer-links a');
    await expect(footerLinks.first()).toBeVisible();
  });

  test('focus states are visible', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Tab to first link
    await page.keyboard.press('Tab');

    // Should have focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Marketing Site - Performance', () => {
  test('fonts are preconnected', async ({ page }) => {
    await page.goto(MARKETING_SITE_URL);

    // Check for preconnect links
    const preconnectGoogle = page.locator('link[rel="preconnect"][href*="googleapis.com"]');
    await expect(preconnectGoogle).toBeAttached();

    const preconnectGstatic = page.locator('link[rel="preconnect"][href*="gstatic.com"]');
    await expect(preconnectGstatic).toBeAttached();
  });

  test('page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(MARKETING_SITE_URL);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    expect(consoleErrors.length).toBe(0);
  });

  test('page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(MARKETING_SITE_URL);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
