import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

describe('GitHub Template YAML Validation', () => {
  const templatesDir = join(__dirname, '../../.github/ISSUE_TEMPLATE');

  describe('bug_report.yml', () => {
    const bugReportPath = join(templatesDir, 'bug_report.yml');
    let bugReportContent: string;
    let bugReportData: any;

    it('should exist', () => {
      expect(() => {
        bugReportContent = readFileSync(bugReportPath, 'utf-8');
      }).not.toThrow();
    });

    it('should be valid YAML', () => {
      expect(() => {
        bugReportData = yaml.parse(bugReportContent);
      }).not.toThrow();
    });

    it('should have required top-level fields', () => {
      expect(bugReportData).toHaveProperty('name');
      expect(bugReportData).toHaveProperty('description');
      expect(bugReportData).toHaveProperty('title');
      expect(bugReportData).toHaveProperty('labels');
      expect(bugReportData).toHaveProperty('body');
    });

    it('should have valid name field', () => {
      expect(bugReportData.name).toBe('Bug Report');
      expect(typeof bugReportData.name).toBe('string');
      expect(bugReportData.name.length).toBeGreaterThan(0);
    });

    it('should have valid description field', () => {
      expect(typeof bugReportData.description).toBe('string');
      expect(bugReportData.description.length).toBeGreaterThan(0);
    });

    it('should have valid title prefix', () => {
      expect(bugReportData.title).toContain('[Bug]');
    });

    it('should have labels array', () => {
      expect(Array.isArray(bugReportData.labels)).toBe(true);
      expect(bugReportData.labels.length).toBeGreaterThan(0);
      expect(bugReportData.labels).toContain('bug');
    });

    it('should have body array with fields', () => {
      expect(Array.isArray(bugReportData.body)).toBe(true);
      expect(bugReportData.body.length).toBeGreaterThan(0);
    });

    it('should have description textarea field', () => {
      const descriptionField = bugReportData.body.find(
        (field: any) => field.id === 'description'
      );
      expect(descriptionField).toBeDefined();
      expect(descriptionField.type).toBe('textarea');
      expect(descriptionField.attributes.label).toBe('Bug Description');
      expect(descriptionField.validations.required).toBe(true);
    });

    it('should have reproduction steps field', () => {
      const reproField = bugReportData.body.find(
        (field: any) => field.id === 'reproduction'
      );
      expect(reproField).toBeDefined();
      expect(reproField.type).toBe('textarea');
      expect(reproField.validations.required).toBe(true);
    });

    it('should have package dropdown field', () => {
      const packageField = bugReportData.body.find(
        (field: any) => field.id === 'package'
      );
      expect(packageField).toBeDefined();
      expect(packageField.type).toBe('dropdown');
      expect(Array.isArray(packageField.attributes.options)).toBe(true);
      expect(packageField.attributes.options.length).toBeGreaterThan(0);
    });

    it('should include all AI Kit packages in dropdown', () => {
      const packageField = bugReportData.body.find(
        (field: any) => field.id === 'package'
      );
      const options = packageField.attributes.options;
      expect(options).toContain('@ainative/ai-kit-core');
      expect(options).toContain('@ainative/ai-kit-react');
      expect(options).toContain('@ainative/ai-kit-nextjs');
    });

    it('should have environment dropdown with multiple selection', () => {
      const envField = bugReportData.body.find(
        (field: any) => field.id === 'environment'
      );
      expect(envField).toBeDefined();
      expect(envField.type).toBe('dropdown');
      expect(envField.attributes.multiple).toBe(true);
    });

    it('should have checklist field', () => {
      const checklistField = bugReportData.body.find(
        (field: any) => field.id === 'terms'
      );
      expect(checklistField).toBeDefined();
      expect(checklistField.type).toBe('checkboxes');
      expect(Array.isArray(checklistField.attributes.options)).toBe(true);
    });

    it('should have required checklist items', () => {
      const checklistField = bugReportData.body.find(
        (field: any) => field.id === 'terms'
      );
      const requiredOptions = checklistField.attributes.options.filter(
        (opt: any) => opt.required
      );
      expect(requiredOptions.length).toBeGreaterThan(0);
    });
  });

  describe('feature_request.yml', () => {
    const featureRequestPath = join(templatesDir, 'feature_request.yml');
    let featureRequestContent: string;
    let featureRequestData: any;

    it('should exist', () => {
      expect(() => {
        featureRequestContent = readFileSync(featureRequestPath, 'utf-8');
      }).not.toThrow();
    });

    it('should be valid YAML', () => {
      expect(() => {
        featureRequestData = yaml.parse(featureRequestContent);
      }).not.toThrow();
    });

    it('should have required top-level fields', () => {
      expect(featureRequestData).toHaveProperty('name');
      expect(featureRequestData).toHaveProperty('description');
      expect(featureRequestData).toHaveProperty('title');
      expect(featureRequestData).toHaveProperty('labels');
      expect(featureRequestData).toHaveProperty('body');
    });

    it('should have valid name field', () => {
      expect(featureRequestData.name).toBe('Feature Request');
      expect(typeof featureRequestData.name).toBe('string');
    });

    it('should have valid title prefix', () => {
      expect(featureRequestData.title).toContain('[Feature]');
    });

    it('should have enhancement label', () => {
      expect(featureRequestData.labels).toContain('enhancement');
    });

    it('should have problem statement field', () => {
      const problemField = featureRequestData.body.find(
        (field: any) => field.id === 'problem'
      );
      expect(problemField).toBeDefined();
      expect(problemField.type).toBe('textarea');
      expect(problemField.validations.required).toBe(true);
    });

    it('should have proposed solution field', () => {
      const solutionField = featureRequestData.body.find(
        (field: any) => field.id === 'solution'
      );
      expect(solutionField).toBeDefined();
      expect(solutionField.type).toBe('textarea');
      expect(solutionField.validations.required).toBe(true);
    });

    it('should have use case field', () => {
      const useCaseField = featureRequestData.body.find(
        (field: any) => field.id === 'use-case'
      );
      expect(useCaseField).toBeDefined();
      expect(useCaseField.validations.required).toBe(true);
    });

    it('should have feature type dropdown', () => {
      const typeField = featureRequestData.body.find(
        (field: any) => field.id === 'feature-type'
      );
      expect(typeField).toBeDefined();
      expect(typeField.type).toBe('dropdown');
      expect(Array.isArray(typeField.attributes.options)).toBe(true);
    });

    it('should have priority dropdown', () => {
      const priorityField = featureRequestData.body.find(
        (field: any) => field.id === 'priority'
      );
      expect(priorityField).toBeDefined();
      expect(priorityField.type).toBe('dropdown');
    });
  });

  describe('config.yml', () => {
    const configPath = join(templatesDir, 'config.yml');
    let configContent: string;
    let configData: any;

    it('should exist', () => {
      expect(() => {
        configContent = readFileSync(configPath, 'utf-8');
      }).not.toThrow();
    });

    it('should be valid YAML', () => {
      expect(() => {
        configData = yaml.parse(configContent);
      }).not.toThrow();
    });

    it('should have blank_issues_enabled field', () => {
      expect(configData).toHaveProperty('blank_issues_enabled');
      expect(typeof configData.blank_issues_enabled).toBe('boolean');
    });

    it('should have contact_links array', () => {
      expect(configData).toHaveProperty('contact_links');
      expect(Array.isArray(configData.contact_links)).toBe(true);
    });

    it('should have valid contact links', () => {
      configData.contact_links.forEach((link: any) => {
        expect(link).toHaveProperty('name');
        expect(link).toHaveProperty('url');
        expect(link).toHaveProperty('about');
        expect(typeof link.name).toBe('string');
        expect(typeof link.url).toBe('string');
        expect(typeof link.about).toBe('string');
        expect(link.url).toMatch(/^https?:\/\//);
      });
    });

    it('should include documentation link', () => {
      const docsLink = configData.contact_links.find(
        (link: any) => link.name === 'Documentation'
      );
      expect(docsLink).toBeDefined();
    });

    it('should include community links', () => {
      const hasDiscussions = configData.contact_links.some(
        (link: any) => link.name === 'Discussions'
      );
      const hasDiscord = configData.contact_links.some(
        (link: any) => link.name.includes('Discord')
      );
      expect(hasDiscussions || hasDiscord).toBe(true);
    });
  });
});
