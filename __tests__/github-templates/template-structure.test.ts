import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('GitHub Templates Structure', () => {
  const rootDir = join(__dirname, '../..');
  const templatesDir = join(rootDir, '.github/ISSUE_TEMPLATE');
  const prTemplateDir = join(rootDir, '.github');
  const docsDir = join(rootDir, 'docs/contributing');

  describe('Directory Structure', () => {
    it('should have .github directory', () => {
      expect(existsSync(join(rootDir, '.github'))).toBe(true);
    });

    it('should have .github/ISSUE_TEMPLATE directory', () => {
      expect(existsSync(templatesDir)).toBe(true);
    });

    it('should have docs/contributing directory', () => {
      expect(existsSync(docsDir)).toBe(true);
    });
  });

  describe('Required Files', () => {
    it('should have bug_report.yml', () => {
      const path = join(templatesDir, 'bug_report.yml');
      expect(existsSync(path)).toBe(true);
    });

    it('should have feature_request.yml', () => {
      const path = join(templatesDir, 'feature_request.yml');
      expect(existsSync(path)).toBe(true);
    });

    it('should have config.yml', () => {
      const path = join(templatesDir, 'config.yml');
      expect(existsSync(path)).toBe(true);
    });

    it('should have pull_request_template.md', () => {
      const path = join(prTemplateDir, 'pull_request_template.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have CONTRIBUTING.md', () => {
      const path = join(docsDir, 'CONTRIBUTING.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have LICENSE file', () => {
      const path = join(rootDir, 'LICENSE');
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('Pull Request Template', () => {
    const prTemplatePath = join(prTemplateDir, 'pull_request_template.md');
    let prTemplateContent: string;

    it('should be readable', () => {
      expect(() => {
        prTemplateContent = readFileSync(prTemplatePath, 'utf-8');
      }).not.toThrow();
    });

    it('should contain Summary section', () => {
      expect(prTemplateContent).toContain('## Summary');
    });

    it('should contain Type of Change section', () => {
      expect(prTemplateContent).toContain('## Type of Change');
    });

    it('should contain Related Issues section', () => {
      expect(prTemplateContent).toContain('## Related Issues');
    });

    it('should contain Testing section', () => {
      expect(prTemplateContent).toContain('## Testing');
    });

    it('should contain Checklist section', () => {
      expect(prTemplateContent).toContain('## Checklist');
    });

    it('should have checkboxes for different change types', () => {
      expect(prTemplateContent).toMatch(/\[ \] Bug fix/);
      expect(prTemplateContent).toMatch(/\[ \] New feature/);
      expect(prTemplateContent).toMatch(/\[ \] Breaking change/);
    });

    it('should have test coverage checkboxes', () => {
      expect(prTemplateContent).toMatch(/\[ \] Unit tests/);
      expect(prTemplateContent).toMatch(/\[ \] Integration tests/);
      expect(prTemplateContent).toMatch(/\[ \] E2E tests/);
    });

    it('should reference CONTRIBUTING.md', () => {
      expect(prTemplateContent).toContain('CONTRIBUTING.md');
    });

    it('should have AINative attribution', () => {
      expect(prTemplateContent).toContain('AINative');
    });

    it('should prompt for issue closure', () => {
      expect(prTemplateContent).toMatch(/Closes #/);
    });

    it('should have comprehensive checklist items', () => {
      expect(prTemplateContent).toMatch(/\[ \] I have read/);
      expect(prTemplateContent).toMatch(/\[ \].*code follows.*style/i);
      expect(prTemplateContent).toMatch(/\[ \].*self-review/i);
      expect(prTemplateContent).toMatch(/\[ \].*tests/i);
    });
  });

  describe('CONTRIBUTING.md', () => {
    const contributingPath = join(docsDir, 'CONTRIBUTING.md');
    let contributingContent: string;

    it('should be readable', () => {
      expect(() => {
        contributingContent = readFileSync(contributingPath, 'utf-8');
      }).not.toThrow();
    });

    it('should have main heading', () => {
      expect(contributingContent).toMatch(/^# Contributing to AI Kit/m);
    });

    it('should have Getting Started section', () => {
      expect(contributingContent).toContain('## Getting Started');
    });

    it('should have Development Setup section', () => {
      expect(contributingContent).toContain('## Development Setup');
    });

    it('should have Testing Guidelines section', () => {
      expect(contributingContent).toContain('## Testing Guidelines');
    });

    it('should have Submitting Changes section', () => {
      expect(contributingContent).toContain('## Submitting Changes');
    });

    it('should mention Node.js version requirement', () => {
      expect(contributingContent).toMatch(/Node\.js.*18/);
    });

    it('should mention pnpm', () => {
      expect(contributingContent).toContain('pnpm');
    });

    it('should have code examples', () => {
      expect(contributingContent).toContain('```');
    });

    it('should explain commit message format', () => {
      expect(contributingContent).toMatch(/commit.*message/i);
      expect(contributingContent).toMatch(/feat|fix|docs/);
    });

    it('should mention test coverage requirement', () => {
      expect(contributingContent).toMatch(/80%|coverage/i);
    });

    it('should have AINative attribution', () => {
      expect(contributingContent).toContain('AINative');
    });

    it('should mention MIT License', () => {
      expect(contributingContent).toContain('MIT');
    });

    it('should have community links', () => {
      expect(contributingContent).toMatch(/Discord|Discussions|GitHub/i);
    });
  });

  describe('LICENSE', () => {
    const licensePath = join(rootDir, 'LICENSE');
    let licenseContent: string;

    it('should be readable', () => {
      expect(() => {
        licenseContent = readFileSync(licensePath, 'utf-8');
      }).not.toThrow();
    });

    it('should be MIT License', () => {
      expect(licenseContent).toContain('MIT License');
    });

    it('should have AINative Studio copyright', () => {
      expect(licenseContent).toContain('AINative Studio');
    });

    it('should have current year', () => {
      const currentYear = new Date().getFullYear();
      expect(licenseContent).toMatch(new RegExp(`202[4-6].*${currentYear}`));
    });

    it('should contain standard MIT License text', () => {
      expect(licenseContent).toContain('Permission is hereby granted');
      expect(licenseContent).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
      expect(licenseContent).toContain('WITHOUT WARRANTY OF ANY KIND');
    });
  });

  describe('Template Content Quality', () => {
    it('bug report should have comprehensive fields', () => {
      const content = readFileSync(
        join(templatesDir, 'bug_report.yml'),
        'utf-8'
      );
      expect(content).toContain('description');
      expect(content).toContain('reproduction');
      expect(content).toContain('expected');
      expect(content).toContain('actual');
      expect(content).toContain('package');
      expect(content).toContain('version');
      expect(content).toContain('environment');
    });

    it('feature request should have comprehensive fields', () => {
      const content = readFileSync(
        join(templatesDir, 'feature_request.yml'),
        'utf-8'
      );
      expect(content).toContain('problem');
      expect(content).toContain('solution');
      expect(content).toContain('use-case');
      expect(content).toContain('feature-type');
      expect(content).toContain('priority');
    });

    it('templates should have validation rules', () => {
      const bugReport = readFileSync(
        join(templatesDir, 'bug_report.yml'),
        'utf-8'
      );
      const featureRequest = readFileSync(
        join(templatesDir, 'feature_request.yml'),
        'utf-8'
      );

      expect(bugReport).toContain('required: true');
      expect(featureRequest).toContain('required: true');
    });

    it('templates should have helper text', () => {
      const bugReport = readFileSync(
        join(templatesDir, 'bug_report.yml'),
        'utf-8'
      );
      const featureRequest = readFileSync(
        join(templatesDir, 'feature_request.yml'),
        'utf-8'
      );

      expect(bugReport).toContain('placeholder');
      expect(featureRequest).toContain('placeholder');
    });
  });
});
