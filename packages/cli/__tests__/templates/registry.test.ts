import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../../src/templates/registry';

describe('template registry', () => {
  it('should have at least 10 templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it('should have unique template IDs', () => {
    const ids = TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  describe('template structure', () => {
    TEMPLATES.forEach((template) => {
      describe(template.id, () => {
        it('should have required fields', () => {
          expect(template.id).toBeDefined();
          expect(template.name).toBeDefined();
          expect(template.description).toBeDefined();
          expect(template.framework).toBeDefined();
          expect(template.dependencies).toBeDefined();
          expect(template.devDependencies).toBeDefined();
          expect(template.scripts).toBeDefined();
        });

        it('should have valid tags', () => {
          expect(Array.isArray(template.tags)).toBe(true);
          expect(template.tags.length).toBeGreaterThan(0);
        });

        it('should have valid features', () => {
          expect(Array.isArray(template.features)).toBe(true);
          expect(template.features.length).toBeGreaterThan(0);
        });

        it('should have required env vars', () => {
          expect(Array.isArray(template.requiredEnvVars)).toBe(true);
        });

        it('should have @aikit/core dependency', () => {
          expect(template.dependencies['@aikit/core']).toBeDefined();
        });

        it('should have TypeScript devDependency', () => {
          expect(template.devDependencies['typescript']).toBeDefined();
        });

        it('should have dev script', () => {
          expect(template.scripts.dev).toBeDefined();
        });

        it('should have build script', () => {
          expect(template.scripts.build).toBeDefined();
        });
      });
    });
  });

  describe('specific templates', () => {
    it('should include nextjs-chat template', () => {
      const template = TEMPLATES.find((t) => t.id === 'nextjs-chat');
      expect(template).toBeDefined();
      expect(template?.framework).toBe('nextjs');
    });

    it('should include react-dashboard template', () => {
      const template = TEMPLATES.find((t) => t.id === 'react-dashboard');
      expect(template).toBeDefined();
      expect(template?.framework).toBe('vite');
    });

    it('should include express-api template', () => {
      const template = TEMPLATES.find((t) => t.id === 'express-api');
      expect(template).toBeDefined();
      expect(template?.framework).toBe('express');
    });

    it('should include agent-system template', () => {
      const template = TEMPLATES.find((t) => t.id === 'agent-system');
      expect(template).toBeDefined();
    });

    it('should include multi-agent-swarm template', () => {
      const template = TEMPLATES.find((t) => t.id === 'multi-agent-swarm');
      expect(template).toBeDefined();
    });

    it('should include tool-integration template', () => {
      const template = TEMPLATES.find((t) => t.id === 'tool-integration');
      expect(template).toBeDefined();
    });

    it('should include fullstack-app template', () => {
      const template = TEMPLATES.find((t) => t.id === 'fullstack-app');
      expect(template).toBeDefined();
    });

    it('should include minimal-starter template', () => {
      const template = TEMPLATES.find((t) => t.id === 'minimal-starter');
      expect(template).toBeDefined();
    });

    it('should include typescript-library template', () => {
      const template = TEMPLATES.find((t) => t.id === 'typescript-library');
      expect(template).toBeDefined();
    });

    it('should include monorepo-setup template', () => {
      const template = TEMPLATES.find((t) => t.id === 'monorepo-setup');
      expect(template).toBeDefined();
    });

    it('should include vue-app template', () => {
      const template = TEMPLATES.find((t) => t.id === 'vue-app');
      expect(template).toBeDefined();
      expect(template?.framework).toBe('vue');
    });

    it('should include svelte-app template', () => {
      const template = TEMPLATES.find((t) => t.id === 'svelte-app');
      expect(template).toBeDefined();
      expect(template?.framework).toBe('svelte');
    });
  });
});
