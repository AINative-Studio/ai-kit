/**
 * Design Constraints Module
 *
 * Comprehensive system for defining and enforcing design constraints
 * in AI-generated designs through prompt engineering.
 */

export { DesignConstraints } from './DesignConstraints';

export * from './types';

export {
  createMaterialDesignTemplate,
  createiOSTemplate,
  createTailwindTemplate,
  createBootstrapTemplate,
  createMinimalTemplate,
  createFromTemplate,
  getAvailableTemplates,
  getTemplateMetadata,
  TEMPLATE_REGISTRY,
} from './templates';
