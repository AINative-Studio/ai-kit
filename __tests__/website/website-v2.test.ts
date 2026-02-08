import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Marketing Site Enhanced - AIKIT-110', () => {
  const websitePath = join(__dirname, '../../website/index.html');
  let htmlContent: string;

  beforeAll(() => {
    if (!existsSync(websitePath)) {
      throw new Error('Marketing site not found at ' + websitePath);
    }
    htmlContent = readFileSync(websitePath, 'utf-8');
  });

  describe('All Base Tests (from #70)', () => {
    it('should exist and load', () => {
      expect(htmlContent).toBeTruthy();
      expect(htmlContent.length).toBeGreaterThan(1000);
    });
  });

  describe('Enhancement: Interactive Demos', () => {
    it('should have an interactive demos section', () => {
      expect(htmlContent).toContain('Interactive Demos');
    });

    it('should have a live streaming chat demo', () => {
      expect(htmlContent).toContain('Live Streaming Demo');
      expect(htmlContent).toContain('Try it yourself');
    });

    it('should have interactive code playground', () => {
      expect(htmlContent).toContain('demo-container');
      expect(htmlContent).toContain('interactive');
    });

    it('should have demo controls (play, reset)', () => {
      expect(htmlContent).toContain('demo-controls');
      expect(htmlContent).toMatch(/button.*demo/i);
    });

    it('should have agent workflow demo', () => {
      expect(htmlContent).toContain('Agent Demo');
      expect(htmlContent).toContain('workflow');
    });

    it('should have safety detection demo', () => {
      expect(htmlContent).toContain('Safety Demo');
      expect(htmlContent).toContain('prompt injection');
    });

    it('should have demo output areas', () => {
      expect(htmlContent).toContain('demo-output');
    });

    it('should have demo JavaScript functionality', () => {
      expect(htmlContent).toContain('function runDemo');
      expect(htmlContent).toContain('simulateStreaming');
    });
  });

  describe('Enhancement: Video Tutorials', () => {
    it('should have a video tutorials section', () => {
      expect(htmlContent).toContain('Video Tutorials');
      expect(htmlContent).toContain('Learn by watching');
    });

    it('should have embedded video placeholders', () => {
      expect(htmlContent).toContain('video-container');
    });

    it('should have video titles and descriptions', () => {
      expect(htmlContent).toContain('Quick Start Guide');
      expect(htmlContent).toContain('Building Your First AI Chat');
    });

    it('should have video duration indicators', () => {
      expect(htmlContent).toContain('video-duration');
    });

    it('should have video thumbnails', () => {
      expect(htmlContent).toContain('video-thumbnail');
    });

    it('should have at least 3 video tutorials', () => {
      const videoMatches = htmlContent.match(/video-card/g) || [];
      expect(videoMatches.length).toBeGreaterThanOrEqual(3);
    });

    it('should have lazy loading for videos', () => {
      expect(htmlContent).toContain('loading="lazy"');
    });

    it('should have video modal or overlay support', () => {
      expect(htmlContent).toContain('video-modal');
    });
  });

  describe('Enhancement: Performance Optimizations', () => {
    it('should have lazy loading images', () => {
      expect(htmlContent).toContain('loading="lazy"');
    });

    it('should have resource hints', () => {
      expect(htmlContent).toContain('rel="preconnect"');
      expect(htmlContent).toContain('rel="dns-prefetch"');
    });

    it('should have critical CSS inlined', () => {
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain(':root');
    });

    it('should defer non-critical JavaScript', () => {
      expect(htmlContent).toMatch(/defer|async/);
    });

    it('should have viewport meta tag for responsive', () => {
      expect(htmlContent).toContain('name="viewport"');
      expect(htmlContent).toContain('width=device-width');
    });

    it('should use CSS Grid and Flexbox for layout', () => {
      expect(htmlContent).toContain('display: grid');
      expect(htmlContent).toContain('display: flex');
    });

    it('should minimize reflows with transform/opacity', () => {
      expect(htmlContent).toContain('transform:');
      expect(htmlContent).toContain('opacity');
    });

    it('should have performance-optimized animations', () => {
      expect(htmlContent).toContain('will-change');
      expect(htmlContent).toContain('transform: translateY');
    });

    it('should implement Intersection Observer for lazy rendering', () => {
      expect(htmlContent).toContain('IntersectionObserver');
      expect(htmlContent).toContain('isIntersecting');
    });
  });

  describe('Enhancement: Analytics Integration', () => {
    it('should have analytics tracking code', () => {
      expect(htmlContent).toContain('analytics');
    });

    it('should track CTA clicks', () => {
      expect(htmlContent).toContain('trackEvent');
      expect(htmlContent).toContain('cta-click');
    });

    it('should track demo interactions', () => {
      expect(htmlContent).toContain('trackDemo');
    });

    it('should track video plays', () => {
      expect(htmlContent).toContain('trackVideo');
    });

    it('should be privacy-focused (no PII collection)', () => {
      expect(htmlContent).toMatch(/privacy|GDPR|consent/i);
    });

    it('should have event tracking functions', () => {
      expect(htmlContent).toContain('function track');
    });

    it('should track section visibility', () => {
      expect(htmlContent).toContain('trackVisibility');
    });

    it('should respect Do Not Track preference', () => {
      expect(htmlContent).toContain('doNotTrack');
    });
  });

  describe('Enhanced UX Features', () => {
    it('should have improved navigation with active states', () => {
      expect(htmlContent).toContain('nav-active');
    });

    it('should have scroll progress indicator', () => {
      expect(htmlContent).toContain('scroll-progress');
    });

    it('should have "Back to Top" button', () => {
      expect(htmlContent).toContain('back-to-top');
    });

    it('should have copy-to-clipboard for code examples', () => {
      expect(htmlContent).toContain('copy-button');
      expect(htmlContent).toContain('clipboard');
    });

    it('should have interactive feature cards', () => {
      expect(htmlContent).toContain('feature-card');
      expect(htmlContent).toContain('hover');
    });

    it('should have loading states for interactive elements', () => {
      expect(htmlContent).toContain('loading');
      expect(htmlContent).toContain('spinner');
    });
  });

  describe('Enhanced Accessibility', () => {
    it('should have ARIA labels for interactive elements', () => {
      expect(htmlContent).toContain('aria-label');
    });

    it('should have proper heading hierarchy', () => {
      expect(htmlContent).toContain('<h1');
      expect(htmlContent).toContain('<h2');
      expect(htmlContent).toContain('<h3');
    });

    it('should have focus-visible styles', () => {
      expect(htmlContent).toContain('focus-visible');
    });

    it('should have skip-to-content link', () => {
      expect(htmlContent).toContain('skip-to-content');
    });

    it('should have ARIA live regions for demos', () => {
      expect(htmlContent).toContain('aria-live');
    });

    it('should have keyboard navigation support', () => {
      expect(htmlContent).toContain('keydown');
      expect(htmlContent).toContain('Enter');
    });

    it('should have alt text for images', () => {
      expect(htmlContent).toMatch(/alt="[^"]+"/);
    });

    it('should have proper color contrast (WCAG AA)', () => {
      expect(htmlContent).toContain('--text-primary: #ffffff');
      expect(htmlContent).toContain('--bg-primary: #0a0a0a');
    });
  });

  describe('Enhanced SEO', () => {
    it('should have canonical URL', () => {
      expect(htmlContent).toContain('rel="canonical"');
    });

    it('should have Twitter Card meta tags', () => {
      expect(htmlContent).toContain('twitter:card');
    });

    it('should have structured data (JSON-LD)', () => {
      expect(htmlContent).toContain('application/ld+json');
      expect(htmlContent).toContain('SoftwareApplication');
    });

    it('should have Open Graph meta tags', () => {
      expect(htmlContent).toContain('og:title');
      expect(htmlContent).toContain('og:description');
      expect(htmlContent).toContain('og:image');
    });

    it('should have proper meta description length (50-160 chars)', () => {
      const metaMatch = htmlContent.match(/<meta name="description" content="([^"]+)"/);
      if (metaMatch) {
        expect(metaMatch[1].length).toBeGreaterThan(50);
        expect(metaMatch[1].length).toBeLessThan(160);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should have all sections properly linked', () => {
      expect(htmlContent).toContain('href="#features"');
      expect(htmlContent).toContain('href="#examples"');
      expect(htmlContent).toContain('href="#demos"');
      expect(htmlContent).toContain('href="#videos"');
      expect(htmlContent).toContain('href="#docs"');
    });

    it('should have consistent branding throughout', () => {
      const brandMatches = htmlContent.match(/AI Kit/g) || [];
      expect(brandMatches.length).toBeGreaterThan(5);
    });

    it('should have external links with proper security', () => {
      expect(htmlContent).toContain('rel="noopener"');
      expect(htmlContent).toContain('target="_blank"');
    });
  });

  describe('Performance Budget', () => {
    it('should have reasonable HTML size (< 150KB)', () => {
      const sizeInKB = Buffer.byteLength(htmlContent, 'utf-8') / 1024;
      expect(sizeInKB).toBeLessThan(150);
    });
  });

  describe('Error Handling', () => {
    it('should have error boundaries for demos', () => {
      expect(htmlContent).toContain('try {');
      expect(htmlContent).toContain('catch');
    });

    it('should show fallback content if demo fails', () => {
      expect(htmlContent).toContain('demo-error');
    });

    it('should handle video loading errors gracefully', () => {
      expect(htmlContent).toContain('onerror');
    });
  });
});
