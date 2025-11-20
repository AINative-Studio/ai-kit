/**
 * Content Swarm Tests
 */

import { describe, it, expect } from 'vitest';
import { contentSwarm } from '../src/agents/content-swarm';
import type { ContentRequest } from '../src/agents/content-swarm';

describe('ContentCreationSwarm', () => {
  describe('create', () => {
    it('should create blog post', async () => {
      const request: ContentRequest = {
        topic: 'AI in Healthcare',
        contentType: 'blog',
        tone: 'professional',
        length: 'medium',
        seoOptimize: true,
      };

      const result = await contentSwarm.create(request);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output.content).toBeDefined();
    });

    it('should optimize for SEO', async () => {
      const request: ContentRequest = {
        topic: 'Machine Learning',
        contentType: 'article',
        tone: 'technical',
        length: 'long',
        seoOptimize: true,
      };

      const result = await contentSwarm.create(request);

      expect(result.success).toBe(true);
      expect(result.output.seo).toBeDefined();
      expect(result.output.seo.keywords).toBeInstanceOf(Array);
      expect(result.output.seo.seoScore).toBeGreaterThan(0);
    });

    it('should create social media posts', async () => {
      const request: ContentRequest = {
        topic: 'Cloud Computing',
        contentType: 'blog',
        tone: 'casual',
        length: 'short',
      };

      const result = await contentSwarm.create(request);

      expect(result.success).toBe(true);
      expect(result.output.socialPosts).toBeInstanceOf(Array);
      expect(result.output.socialPosts.length).toBeGreaterThan(0);
    });

    it('should suggest images', async () => {
      const request: ContentRequest = {
        topic: 'Data Science',
        contentType: 'blog',
        tone: 'professional',
        length: 'medium',
        includeImages: true,
      };

      const result = await contentSwarm.create(request);

      expect(result.success).toBe(true);
      expect(result.output.images).toBeInstanceOf(Array);
    });

    it('should track versions', async () => {
      const request: ContentRequest = {
        topic: 'Cybersecurity',
        contentType: 'article',
        tone: 'professional',
        length: 'medium',
      };

      const result = await contentSwarm.create(request);

      expect(result.success).toBe(true);
      expect(result.output.versions).toBeInstanceOf(Array);
      expect(result.output.versions.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle different tones', async () => {
      const request: ContentRequest = {
        topic: 'Web Development',
        contentType: 'blog',
        tone: 'casual',
        length: 'short',
      };

      const result = await contentSwarm.create(request);

      expect(result.success).toBe(true);
      expect(result.output.metadata.tone).toBe('casual');
    });

    it('should adapt to content length', async () => {
      const request: ContentRequest = {
        topic: 'Software Engineering',
        contentType: 'article',
        tone: 'technical',
        length: 'long',
      };

      const result = await contentSwarm.create(request);

      expect(result.success).toBe(true);
      expect(result.output.metadata.wordCount).toBeGreaterThan(500);
    });
  });
});
