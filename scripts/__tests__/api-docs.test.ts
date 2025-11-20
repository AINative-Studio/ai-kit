/**
 * API Documentation Validation Tests
 *
 * Ensures all API documentation is complete, consistent, and valid.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

const DOCS_DIR = path.join(process.cwd(), 'docs/api');
const PACKAGES = ['core', 'react', 'tools', 'nextjs', 'testing'];

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

describe('API Documentation Validation', () => {
  let allMarkdownFiles: string[] = [];

  beforeAll(async () => {
    allMarkdownFiles = await glob('**/*.md', { cwd: DOCS_DIR });
  });

  describe('Documentation Structure', () => {
    it('should have README for each package', async () => {
      for (const pkg of PACKAGES) {
        const readmePath = path.join(DOCS_DIR, pkg, 'README.md');
        const exists = await fileExists(readmePath);
        expect(exists, `Missing README.md for ${pkg} package`).toBe(true);
      }
    });

    it('should have main API index', async () => {
      const indexPath = path.join(DOCS_DIR, 'README.md');
      const exists = await fileExists(indexPath);
      expect(exists, 'Missing main API index README.md').toBe(true);
    });

    it('should have at least 2000 lines of documentation', async () => {
      let totalLines = 0;

      for (const file of allMarkdownFiles) {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        totalLines += content.split('\n').length;
      }

      expect(totalLines).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('Content Validation', () => {
    it('should have proper headings structure', async () => {
      const results = await validateHeadings();
      const filesWithErrors = results.filter(r => r.errors.length > 0);

      if (filesWithErrors.length > 0) {
        console.log('Files with heading errors:');
        filesWithErrors.forEach(r => {
          console.log(`\n${r.file}:`);
          r.errors.forEach(e => console.log(`  - ${e}`));
        });
      }

      expect(filesWithErrors.length).toBe(0);
    });

    it('should have code examples in main docs', async () => {
      const mainDocs = [
        'core/README.md',
        'core/streaming.md',
        'core/agents.md',
        'core/security.md',
        'react/README.md',
        'react/hooks.md',
        'tools/README.md'
      ];

      for (const doc of mainDocs) {
        const filePath = path.join(DOCS_DIR, doc);
        const content = await fs.readFile(filePath, 'utf-8');

        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        expect(
          codeBlocks.length,
          `${doc} should have code examples`
        ).toBeGreaterThan(0);
      }
    });

    it('should have TypeScript code blocks', async () => {
      for (const file of allMarkdownFiles) {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Skip files that are just indexes
        if (content.length < 500) continue;

        const tsCodeBlocks = content.match(/```typescript[\s\S]*?```/g) || [];
        expect(
          tsCodeBlocks.length,
          `${file} should have TypeScript examples`
        ).toBeGreaterThan(0);
      }
    });

    it('should not have broken internal links', async () => {
      const results = await validateInternalLinks();
      const filesWithErrors = results.filter(r => r.errors.length > 0);

      if (filesWithErrors.length > 0) {
        console.log('Files with broken links:');
        filesWithErrors.forEach(r => {
          console.log(`\n${r.file}:`);
          r.errors.forEach(e => console.log(`  - ${e}`));
        });
      }

      expect(filesWithErrors.length).toBe(0);
    });

    it('should have consistent formatting', async () => {
      const results = await validateFormatting();
      const filesWithErrors = results.filter(r => r.errors.length > 0);

      if (filesWithErrors.length > 0) {
        console.log('Files with formatting errors:');
        filesWithErrors.forEach(r => {
          console.log(`\n${r.file}:`);
          r.errors.forEach(e => console.log(`  - ${e}`));
        });
      }

      expect(filesWithErrors.length).toBe(0);
    });
  });

  describe('API Coverage', () => {
    it('should document all core modules', async () => {
      const requiredModules = [
        'streaming',
        'agents',
        'security',
        'memory',
        'context',
        'tracking'
      ];

      const coreReadme = await fs.readFile(
        path.join(DOCS_DIR, 'core/README.md'),
        'utf-8'
      );

      for (const module of requiredModules) {
        expect(
          coreReadme.toLowerCase(),
          `core/README.md should reference ${module}`
        ).toContain(module.toLowerCase());
      }
    });

    it('should document React hooks', async () => {
      const reactHooksPath = path.join(DOCS_DIR, 'react/hooks.md');
      const exists = await fileExists(reactHooksPath);
      expect(exists, 'Missing React hooks documentation').toBe(true);

      if (exists) {
        const content = await fs.readFile(reactHooksPath, 'utf-8');
        expect(content).toContain('useAIStream');
        expect(content).toContain('useConversation');
      }
    });

    it('should document all tools', async () => {
      const toolsReadme = await fs.readFile(
        path.join(DOCS_DIR, 'tools/README.md'),
        'utf-8'
      );

      const requiredTools = [
        'Calculator',
        'WebSearch',
        'CodeInterpreter',
        'ZeroDBTool'
      ];

      for (const tool of requiredTools) {
        expect(
          toolsReadme,
          `tools/README.md should document ${tool}`
        ).toContain(tool);
      }
    });
  });

  describe('Examples Validation', () => {
    it('should have complete examples', async () => {
      for (const file of allMarkdownFiles) {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Extract code blocks
        const codeBlocks = content.match(/```typescript[\s\S]*?```/g) || [];

        for (const block of codeBlocks) {
          // Check for common issues
          if (block.includes('import')) {
            // Should have proper imports
            expect(block).toMatch(/from ['"]@ainative\/ai-kit/);
          }

          // Should not have placeholder values
          expect(block).not.toContain('YOUR_API_KEY');
          expect(block).not.toContain('TODO');
          expect(block).not.toContain('FIXME');
        }
      }
    });

    it('should have working TypeScript syntax', async () => {
      const errors: string[] = [];

      for (const file of allMarkdownFiles) {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');

        const codeBlocks = content.match(/```typescript[\s\S]*?```/g) || [];

        for (let i = 0; i < codeBlocks.length; i++) {
          const block = codeBlocks[i];
          const code = block.replace(/```typescript\n/, '').replace(/```$/, '');

          // Basic syntax validation
          const issues = validateTypeScriptSyntax(code);
          if (issues.length > 0) {
            errors.push(`${file} - Code block ${i + 1}: ${issues.join(', ')}`);
          }
        }
      }

      if (errors.length > 0) {
        console.log('TypeScript syntax issues:');
        errors.forEach(e => console.log(`  - ${e}`));
      }

      expect(errors.length).toBe(0);
    });
  });

  describe('Search Index', () => {
    it('should generate search index', async () => {
      const searchIndexPath = path.join(DOCS_DIR, 'search-index.json');
      const exists = await fileExists(searchIndexPath);

      // Search index is generated by the script
      if (exists) {
        const content = await fs.readFile(searchIndexPath, 'utf-8');
        const index = JSON.parse(content);

        expect(Array.isArray(index)).toBe(true);
        expect(index.length).toBeGreaterThan(0);

        // Validate index structure
        for (const entry of index) {
          expect(entry).toHaveProperty('title');
          expect(entry).toHaveProperty('path');
          expect(entry).toHaveProperty('type');
          expect(entry).toHaveProperty('package');
        }
      }
    });
  });
});

// Helper Functions

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateHeadings(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const file of allMarkdownFiles) {
    const filePath = path.join(DOCS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const errors: string[] = [];

    const lines = content.split('\n');
    let hasH1 = false;
    let previousLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2];

        if (level === 1) {
          if (hasH1) {
            errors.push(`Line ${i + 1}: Multiple H1 headings`);
          }
          hasH1 = true;
        }

        if (!hasH1 && level > 1) {
          errors.push(`Line ${i + 1}: No H1 heading before H${level}`);
        }

        if (level > previousLevel + 1) {
          errors.push(`Line ${i + 1}: Heading level skipped (${previousLevel} to ${level})`);
        }

        previousLevel = level;
      }
    }

    if (!hasH1) {
      errors.push('No H1 heading found');
    }

    results.push({ file, errors, warnings: [] });
  }

  return results;
}

async function validateInternalLinks(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const file of allMarkdownFiles) {
    const filePath = path.join(DOCS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const errors: string[] = [];

    // Find all markdown links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, url] = match;

      // Check internal links (relative paths)
      if (!url.startsWith('http') && !url.startsWith('#')) {
        const targetPath = path.join(path.dirname(filePath), url);

        if (!(await fileExists(targetPath))) {
          errors.push(`Broken link: ${url} (text: "${text}")`);
        }
      }
    }

    results.push({ file, errors, warnings: [] });
  }

  return results;
}

async function validateFormatting(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const file of allMarkdownFiles) {
    const filePath = path.join(DOCS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const errors: string[] = [];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for trailing whitespace
      if (line.endsWith(' ') && !line.endsWith('  ')) {
        errors.push(`Line ${i + 1}: Trailing whitespace`);
      }

      // Check for tab characters
      if (line.includes('\t')) {
        errors.push(`Line ${i + 1}: Contains tab character`);
      }
    }

    results.push({ file, errors, warnings: [] });
  }

  return results;
}

function validateTypeScriptSyntax(code: string): string[] {
  const issues: string[] = [];

  // Check for unmatched braces
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push('Unmatched braces');
  }

  // Check for unmatched parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push('Unmatched parentheses');
  }

  // Check for unmatched brackets
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push('Unmatched brackets');
  }

  return issues;
}
