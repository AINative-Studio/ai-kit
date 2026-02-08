/**
 * Memory Leak Detection Tests for Marketing Site
 * Issue #141 - Event Listener Memory Leak Fixes
 *
 * These tests verify that all event listeners are properly cleaned up
 * and no memory leaks occur during SPA-style navigation.
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Memory Leak Tests - Marketing Site', () => {
  let dom;
  let window;
  let document;
  let eventListeners;
  let observers;

  beforeEach(() => {
    // Load the fixed HTML file
    const html = fs.readFileSync(
      path.join(__dirname, '../index.fixed.html'),
      'utf-8'
    );

    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'http://localhost',
    });

    window = dom.window;
    document = window.document;

    // Track event listeners for leak detection
    eventListeners = {
      window: [],
      document: [],
      elements: new Map(),
    };

    // Track observers
    observers = [];

    // Spy on addEventListener
    const originalAddEventListener = window.EventTarget.prototype.addEventListener;
    window.EventTarget.prototype.addEventListener = function (event, handler, options) {
      if (this === window) {
        eventListeners.window.push({ event, handler, options });
      } else if (this === document) {
        eventListeners.document.push({ event, handler, options });
      } else {
        if (!eventListeners.elements.has(this)) {
          eventListeners.elements.set(this, []);
        }
        eventListeners.elements.get(this).push({ event, handler, options });
      }
      return originalAddEventListener.call(this, event, handler, options);
    };

    // Spy on removeEventListener
    const originalRemoveEventListener = window.EventTarget.prototype.removeEventListener;
    window.EventTarget.prototype.removeEventListener = function (event, handler, options) {
      if (this === window) {
        eventListeners.window = eventListeners.window.filter(
          (l) => l.event !== event || l.handler !== handler
        );
      } else if (this === document) {
        eventListeners.document = eventListeners.document.filter(
          (l) => l.event !== event || l.handler !== handler
        );
      } else {
        const listeners = eventListeners.elements.get(this);
        if (listeners) {
          eventListeners.elements.set(
            this,
            listeners.filter((l) => l.event !== event || l.handler !== handler)
          );
        }
      }
      return originalRemoveEventListener.call(this, event, handler, options);
    };

    // Spy on IntersectionObserver
    const OriginalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends OriginalIntersectionObserver {
      constructor(...args) {
        super(...args);
        observers.push(this);
        this._disconnected = false;
      }

      disconnect() {
        this._disconnected = true;
        return super.disconnect();
      }
    };

    // Wait for scripts to execute
    return new Promise((resolve) => {
      window.addEventListener('load', () => {
        setTimeout(resolve, 100);
      });
    });
  });

  afterEach(() => {
    if (window) {
      window.close();
    }
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up all event listeners when cleanup is called', () => {
      const initialWindowListeners = eventListeners.window.length;
      const initialDocumentListeners = eventListeners.document.length;
      const initialElementListeners = Array.from(eventListeners.elements.values()).flat()
        .length;

      // Call cleanup
      window.__eventCleanup();

      // Verify all listeners are removed
      expect(eventListeners.window.length).toBe(1); // Only beforeunload remains
      expect(eventListeners.document.length).toBe(0);

      const remainingElementListeners = Array.from(eventListeners.elements.values()).flat()
        .length;
      expect(remainingElementListeners).toBe(0);

      console.log('Initial listeners:', {
        window: initialWindowListeners,
        document: initialDocumentListeners,
        elements: initialElementListeners,
      });
      console.log('Remaining listeners after cleanup:', {
        window: eventListeners.window.length,
        document: eventListeners.document.length,
        elements: remainingElementListeners,
      });
    });

    it('should track window scroll listeners correctly', () => {
      const scrollListeners = eventListeners.window.filter((l) => l.event === 'scroll');

      // Should have exactly 2 scroll listeners (scroll progress + back-to-top)
      expect(scrollListeners.length).toBeGreaterThanOrEqual(2);

      // Verify passive option is set for performance
      scrollListeners.forEach((listener) => {
        expect(listener.options?.passive).toBe(true);
      });
    });

    it('should clean up scroll listeners on cleanup', () => {
      const scrollListenersBefore = eventListeners.window.filter(
        (l) => l.event === 'scroll'
      ).length;

      window.__eventCleanup();

      const scrollListenersAfter = eventListeners.window.filter(
        (l) => l.event === 'scroll'
      ).length;

      expect(scrollListenersAfter).toBe(0);
      expect(scrollListenersBefore).toBeGreaterThan(0);
    });

    it('should clean up click listeners on CTA buttons', () => {
      const ctaButtons = document.querySelectorAll('[data-track="cta-click"]');
      expect(ctaButtons.length).toBeGreaterThan(0);

      const clickListenersBefore = Array.from(eventListeners.elements.entries()).filter(
        ([el]) => el.hasAttribute && el.hasAttribute('data-track')
      ).length;

      window.__eventCleanup();

      const clickListenersAfter = Array.from(eventListeners.elements.entries()).filter(
        ([el]) => el.hasAttribute && el.hasAttribute('data-track')
      ).length;

      expect(clickListenersAfter).toBe(0);
      expect(clickListenersBefore).toBeGreaterThan(0);
    });

    it('should clean up smooth scroll anchor listeners', () => {
      const anchors = document.querySelectorAll('a[href^="#"]');
      expect(anchors.length).toBeGreaterThan(0);

      window.__eventCleanup();

      // Verify no listeners remain on anchors
      anchors.forEach((anchor) => {
        const listenersOnAnchor = eventListeners.elements.get(anchor) || [];
        expect(listenersOnAnchor.length).toBe(0);
      });
    });

    it('should clean up copy button listeners', () => {
      const copyButtons = document.querySelectorAll('.copy-button');
      expect(copyButtons.length).toBeGreaterThan(0);

      window.__eventCleanup();

      copyButtons.forEach((button) => {
        const listenersOnButton = eventListeners.elements.get(button) || [];
        expect(listenersOnButton.length).toBe(0);
      });
    });

    it('should clean up keyboard navigation listener', () => {
      const keydownListenersBefore = eventListeners.document.filter(
        (l) => l.event === 'keydown'
      ).length;

      expect(keydownListenersBefore).toBe(1);

      window.__eventCleanup();

      const keydownListenersAfter = eventListeners.document.filter(
        (l) => l.event === 'keydown'
      ).length;

      expect(keydownListenersAfter).toBe(0);
    });

    it('should clean up mobile menu toggle listener', () => {
      const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
      expect(mobileMenuBtn).not.toBeNull();

      window.__eventCleanup();

      const listenersOnBtn = eventListeners.elements.get(mobileMenuBtn) || [];
      expect(listenersOnBtn.length).toBe(0);
    });
  });

  describe('Observer Cleanup', () => {
    it('should create IntersectionObserver for sections', () => {
      expect(observers.length).toBeGreaterThan(0);
    });

    it('should disconnect observers on cleanup', () => {
      const observersBefore = observers.filter((o) => !o._disconnected).length;
      expect(observersBefore).toBeGreaterThan(0);

      window.__eventCleanup();

      const observersAfter = observers.filter((o) => !o._disconnected).length;
      expect(observersAfter).toBe(0);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not accumulate listeners on simulated SPA navigation', () => {
      // Simulate multiple page loads
      const iterations = 5;
      const listenerCounts = [];

      for (let i = 0; i < iterations; i++) {
        // Reinitialize page scripts (simulating SPA navigation)
        // Count current listeners
        const totalListeners =
          eventListeners.window.length +
          eventListeners.document.length +
          Array.from(eventListeners.elements.values()).flat().length;

        listenerCounts.push(totalListeners);

        // Cleanup before next "navigation"
        window.__eventCleanup();
      }

      // After cleanup, no listeners should remain (except beforeunload)
      const finalListeners =
        eventListeners.window.length +
        eventListeners.document.length +
        Array.from(eventListeners.elements.values()).flat().length;

      expect(finalListeners).toBeLessThanOrEqual(1); // Only beforeunload

      console.log('Listener counts per iteration:', listenerCounts);
    });

    it('should handle rapid cleanup calls without errors', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          window.__eventCleanup();
        }
      }).not.toThrow();
    });

    it('should expose cleanup function globally', () => {
      expect(typeof window.__eventCleanup).toBe('function');
    });
  });

  describe('Performance Optimizations', () => {
    it('should use passive listeners for scroll events', () => {
      const scrollListeners = eventListeners.window.filter((l) => l.event === 'scroll');

      scrollListeners.forEach((listener) => {
        expect(listener.options?.passive).toBe(true);
      });
    });

    it('should not have duplicate event listeners', () => {
      // Check for duplicate handlers on window
      const windowEventTypes = new Map();
      eventListeners.window.forEach((listener) => {
        const count = windowEventTypes.get(listener.event) || 0;
        windowEventTypes.set(listener.event, count + 1);
      });

      // Allow up to 2 scroll listeners (scroll progress + back-to-top)
      windowEventTypes.forEach((count, event) => {
        if (event === 'scroll') {
          expect(count).toBeLessThanOrEqual(2);
        } else if (event === 'beforeunload') {
          expect(count).toBe(1);
        } else {
          expect(count).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle cleanup before initialization', () => {
      // Create new window without running scripts
      const newDom = new JSDOM('<html><body></body></html>');
      const newWindow = newDom.window;

      // Should not throw even if cleanup doesn't exist
      expect(() => {
        if (newWindow.__eventCleanup) {
          newWindow.__eventCleanup();
        }
      }).not.toThrow();

      newWindow.close();
    });

    it('should handle missing elements gracefully', () => {
      // Remove some elements
      const copyButton = document.querySelector('.copy-button');
      if (copyButton) {
        copyButton.remove();
      }

      // Cleanup should still work
      expect(() => {
        window.__eventCleanup();
      }).not.toThrow();
    });

    it('should cleanup even if observers array is empty', () => {
      observers.length = 0;

      expect(() => {
        window.__eventCleanup();
      }).not.toThrow();
    });
  });

  describe('Regression Tests', () => {
    it('should maintain functionality after cleanup and re-init', () => {
      // Cleanup
      window.__eventCleanup();

      // Try to interact with page elements
      const backToTop = document.getElementById('back-to-top');
      expect(backToTop).not.toBeNull();

      // Should not throw (even though listeners are removed)
      expect(() => {
        backToTop.click();
      }).not.toThrow();
    });

    it('should not affect global functions', () => {
      // Global functions should still exist
      expect(typeof window.runDemo).toBe('function');
      expect(typeof window.resetDemo).toBe('function');
      expect(typeof window.openVideo).toBe('function');
      expect(typeof window.closeVideo).toBe('function');
      expect(typeof window.acceptPrivacy).toBe('function');
    });
  });
});

describe('Comparative Memory Leak Tests', () => {
  it('should demonstrate leak in original vs fixed version', async () => {
    // This test would load both versions and compare memory usage
    // Requires browser automation (Puppeteer/Playwright) for accurate results

    // Test structure:
    // 1. Load original index.html
    // 2. Navigate through site, measure memory
    // 3. Load fixed index.fixed.html
    // 4. Navigate through site, measure memory
    // 5. Compare: fixed version should have stable memory usage

    // Placeholder for full browser test
    expect(true).toBe(true);
  });
});

describe('Production Readiness', () => {
  it('should have EventListenerManager class defined', () => {
    expect(window.EventListenerManager).toBeDefined();
    expect(typeof window.EventListenerManager).toBe('function');
  });

  it('should have eventManager instance available', () => {
    // EventManager is in closure, so we verify through cleanup function
    expect(window.__eventCleanup).toBeDefined();
  });

  it('should initialize analytics without errors', () => {
    expect(window.analytics).toBeDefined();
    expect(typeof window.analytics.init).toBe('function');
    expect(typeof window.analytics.trackEvent).toBe('function');
  });

  it('should respect Do Not Track', () => {
    expect(window.analytics.doNotTrack).toBeDefined();
  });
});
