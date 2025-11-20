/**
 * Design Constraint Templates
 *
 * Pre-built constraint templates for common design systems and frameworks
 */

import { DesignConstraints } from './DesignConstraints';
import {
  ConstraintSetConfig,
  ConstraintPriority,
  LayoutSystem,
  ColorFormat,
  WCAGLevel,
  ConstraintTemplate,
} from './types';

/**
 * Material Design 3 constraint template
 */
export function createMaterialDesignTemplate(): DesignConstraints {
  const config: ConstraintSetConfig = {
    name: 'Material Design 3',
    description: 'Google Material Design 3 design system constraints',
    constraints: [],
  };

  const constraints = new DesignConstraints(config);

  // Layout constraints
  constraints.defineLayoutConstraint(
    'material-layout',
    {
      system: [LayoutSystem.GRID, LayoutSystem.FLEXBOX],
      gridColumns: 12,
      gridGap: '16px',
      maxWidth: '1200px',
    },
    {
      name: 'Material Layout',
      description: 'Material Design 3 layout system with 12-column grid',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Color constraints
  constraints.defineColorConstraint(
    'material-color',
    {
      palette: {
        primary: ['#6750A4', '#7F67BE', '#9A82DB', '#B69DF8'],
        secondary: ['#625B71', '#7A7289', '#958DA5', '#B0A7C0'],
        accent: ['#7D5260', '#986977', '#B58392', '#D29DAC'],
        neutral: ['#1C1B1F', '#49454F', '#79747E', '#CAC4D0', '#E6E1E5', '#F4EFF4', '#FFFBFE'],
        semantic: {
          success: ['#006E1C', '#4C8400', '#6D9900'],
          warning: ['#7D5700', '#9F6A00', '#C47F00'],
          error: ['#BA1A1A', '#DE3730', '#FF5449'],
          info: ['#0061A4', '#0078C9', '#5491F5'],
        },
      },
      formats: [ColorFormat.HEX, ColorFormat.RGB],
      minContrast: 4.5,
      colorHarmony: ['analogous', 'complementary'],
    },
    {
      name: 'Material Color System',
      description: 'Material Design 3 color palette with dynamic color',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Typography constraints
  constraints.defineTypographyConstraint(
    'material-typography',
    {
      fontFamilies: {
        heading: ['Roboto', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
        monospace: ['Roboto Mono', 'monospace'],
      },
      scale: {
        baseSize: 16,
        ratio: 1.25,
        sizes: {
          xs: 11,
          sm: 12,
          base: 14,
          lg: 16,
          xl: 22,
          '2xl': 28,
          '3xl': 36,
          '4xl': 45,
        },
      },
      weights: [400, 500, 700],
      lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
      },
      maxLevels: 6,
    },
    {
      name: 'Material Typography',
      description: 'Material Design 3 type scale',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Component constraints
  constraints.defineComponentConstraint(
    'material-components',
    {
      sizes: {
        sm: { height: '32px', padding: '8px 16px' },
        md: { height: '40px', padding: '10px 24px' },
        lg: { height: '56px', padding: '16px 32px' },
      },
      variants: ['filled', 'outlined', 'text', 'elevated', 'tonal'],
      maxNestingLevel: 5,
    },
    {
      name: 'Material Components',
      description: 'Material Design 3 component system',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Spacing constraints
  constraints.defineSpacingConstraint(
    'material-spacing',
    {
      system: {
        base: 8,
        scale: [4, 8, 12, 16, 24, 32, 40, 48, 56, 64],
      },
      consistent: true,
    },
    {
      name: 'Material Spacing',
      description: '8px base spacing system',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Accessibility constraints
  constraints.defineAccessibilityConstraint(
    'material-a11y',
    {
      wcagLevel: WCAGLevel.AA,
      minContrast: 4.5,
      requireAltText: true,
      requireAriaLabels: true,
      keyboardNavigable: true,
      focusVisible: true,
      minTouchTarget: 48,
    },
    {
      name: 'Material Accessibility',
      description: 'WCAG AA compliance requirements',
      priority: ConstraintPriority.CRITICAL,
    }
  );

  return constraints;
}

/**
 * iOS Human Interface Guidelines template
 */
export function createiOSTemplate(): DesignConstraints {
  const config: ConstraintSetConfig = {
    name: 'iOS Human Interface Guidelines',
    description: 'Apple iOS design system constraints',
    constraints: [],
  };

  const constraints = new DesignConstraints(config);

  // Layout constraints
  constraints.defineLayoutConstraint(
    'ios-layout',
    {
      system: [LayoutSystem.STACK, LayoutSystem.GRID],
      maxWidth: '428px',
      minWidth: '320px',
    },
    {
      name: 'iOS Layout',
      description: 'iOS adaptive layout system',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Color constraints
  constraints.defineColorConstraint(
    'ios-color',
    {
      palette: {
        primary: ['#007AFF', '#0A84FF', '#5E5CE6'],
        secondary: ['#5856D6', '#AF52DE', '#BF5AF2'],
        accent: ['#FF9500', '#FF9F0A', '#FFD60A'],
        neutral: ['#000000', '#1C1C1E', '#2C2C2E', '#3A3A3C', '#48484A', '#636366', '#8E8E93', '#AEAEB2', '#C7C7CC', '#D1D1D6', '#E5E5EA', '#F2F2F7', '#FFFFFF'],
        semantic: {
          success: ['#34C759', '#32D74B', '#30DB5B'],
          warning: ['#FF9500', '#FF9F0A', '#FFD60A'],
          error: ['#FF3B30', '#FF453A', '#FF6961'],
          info: ['#007AFF', '#0A84FF', '#64D2FF'],
        },
      },
      formats: [ColorFormat.HEX, ColorFormat.RGB],
      minContrast: 4.5,
    },
    {
      name: 'iOS Color System',
      description: 'iOS system colors with dark mode support',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Typography constraints
  constraints.defineTypographyConstraint(
    'ios-typography',
    {
      fontFamilies: {
        heading: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        monospace: ['SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      scale: {
        baseSize: 17,
        ratio: 1.17,
        sizes: {
          xs: 11,
          sm: 13,
          base: 17,
          lg: 20,
          xl: 28,
          '2xl': 34,
          '3xl': 48,
        },
      },
      weights: [400, 600, 700],
      lineHeights: {
        tight: 1.2,
        normal: 1.4,
        relaxed: 1.6,
      },
    },
    {
      name: 'iOS Typography',
      description: 'San Francisco font system',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Component constraints
  constraints.defineComponentConstraint(
    'ios-components',
    {
      sizes: {
        sm: { height: '36px', padding: '8px 12px' },
        md: { height: '44px', padding: '10px 16px' },
        lg: { height: '50px', padding: '12px 20px' },
      },
      variants: ['filled', 'plain', 'gray', 'tinted'],
      maxNestingLevel: 4,
    },
    {
      name: 'iOS Components',
      description: 'iOS UIKit components',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Spacing constraints
  constraints.defineSpacingConstraint(
    'ios-spacing',
    {
      system: {
        base: 8,
        scale: [4, 8, 16, 20, 24, 32],
      },
      consistent: true,
    },
    {
      name: 'iOS Spacing',
      description: '8px base spacing system',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Accessibility constraints
  constraints.defineAccessibilityConstraint(
    'ios-a11y',
    {
      wcagLevel: WCAGLevel.AA,
      minContrast: 4.5,
      requireAltText: true,
      requireAriaLabels: true,
      keyboardNavigable: true,
      focusVisible: true,
      minTouchTarget: 44,
    },
    {
      name: 'iOS Accessibility',
      description: 'iOS accessibility requirements',
      priority: ConstraintPriority.CRITICAL,
    }
  );

  return constraints;
}

/**
 * Tailwind CSS template
 */
export function createTailwindTemplate(): DesignConstraints {
  const config: ConstraintSetConfig = {
    name: 'Tailwind CSS',
    description: 'Tailwind CSS utility-first design system',
    constraints: [],
  };

  const constraints = new DesignConstraints(config);

  // Layout constraints
  constraints.defineLayoutConstraint(
    'tailwind-layout',
    {
      system: [LayoutSystem.GRID, LayoutSystem.FLEXBOX],
      gridColumns: 12,
      gridGap: '1rem',
    },
    {
      name: 'Tailwind Layout',
      description: 'Tailwind responsive grid system',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Color constraints
  constraints.defineColorConstraint(
    'tailwind-color',
    {
      palette: {
        primary: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'],
        secondary: ['#6B7280', '#4B5563', '#374151', '#1F2937', '#111827'],
        accent: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
        neutral: ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#000000'],
      },
      formats: [ColorFormat.HEX, ColorFormat.RGB, ColorFormat.RGBA],
    },
    {
      name: 'Tailwind Colors',
      description: 'Tailwind default color palette',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Typography constraints
  constraints.defineTypographyConstraint(
    'tailwind-typography',
    {
      fontFamilies: {
        body: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        monospace: ['ui-monospace', 'monospace'],
      },
      scale: {
        baseSize: 16,
        ratio: 1.25,
        sizes: {
          xs: 12,
          sm: 14,
          base: 16,
          lg: 18,
          xl: 20,
          '2xl': 24,
          '3xl': 30,
          '4xl': 36,
        },
      },
      weights: [400, 500, 600, 700, 800, 900],
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
      },
    },
    {
      name: 'Tailwind Typography',
      description: 'Tailwind type scale',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Spacing constraints
  constraints.defineSpacingConstraint(
    'tailwind-spacing',
    {
      system: {
        base: 4,
        scale: [1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64],
      },
      consistent: true,
    },
    {
      name: 'Tailwind Spacing',
      description: '4px base spacing scale',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  return constraints;
}

/**
 * Bootstrap template
 */
export function createBootstrapTemplate(): DesignConstraints {
  const config: ConstraintSetConfig = {
    name: 'Bootstrap 5',
    description: 'Bootstrap 5 responsive design system',
    constraints: [],
  };

  const constraints = new DesignConstraints(config);

  // Layout constraints
  constraints.defineLayoutConstraint(
    'bootstrap-layout',
    {
      system: [LayoutSystem.GRID, LayoutSystem.FLEXBOX],
      gridColumns: 12,
      gridGap: '1.5rem',
      maxWidth: '1320px',
    },
    {
      name: 'Bootstrap Layout',
      description: 'Bootstrap 12-column responsive grid',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Color constraints
  constraints.defineColorConstraint(
    'bootstrap-color',
    {
      palette: {
        primary: ['#0D6EFD'],
        secondary: ['#6C757D'],
        accent: ['#0DCAF0'],
        semantic: {
          success: ['#198754'],
          warning: ['#FFC107'],
          error: ['#DC3545'],
          info: ['#0DCAF0'],
        },
      },
      formats: [ColorFormat.HEX],
    },
    {
      name: 'Bootstrap Colors',
      description: 'Bootstrap theme colors',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Typography constraints
  constraints.defineTypographyConstraint(
    'bootstrap-typography',
    {
      fontFamilies: {
        body: ['system-ui', '-apple-system', 'sans-serif'],
        heading: ['system-ui', '-apple-system', 'sans-serif'],
        monospace: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      scale: {
        baseSize: 16,
        ratio: 1.25,
      },
      weights: [400, 700],
    },
    {
      name: 'Bootstrap Typography',
      description: 'Bootstrap type system',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Spacing constraints
  constraints.defineSpacingConstraint(
    'bootstrap-spacing',
    {
      system: {
        base: 16,
        scale: [4, 8, 16, 24, 48],
      },
    },
    {
      name: 'Bootstrap Spacing',
      description: '16px base spacing utilities',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  return constraints;
}

/**
 * Minimal/Clean template
 */
export function createMinimalTemplate(): DesignConstraints {
  const config: ConstraintSetConfig = {
    name: 'Minimal Design',
    description: 'Clean, minimal design constraints',
    constraints: [],
  };

  const constraints = new DesignConstraints(config);

  // Layout constraints
  constraints.defineLayoutConstraint(
    'minimal-layout',
    {
      system: [LayoutSystem.FLEXBOX, LayoutSystem.GRID],
      maxWidth: '1000px',
    },
    {
      name: 'Minimal Layout',
      description: 'Simple, centered layout',
      priority: ConstraintPriority.MEDIUM,
    }
  );

  // Color constraints - monochromatic
  constraints.defineColorConstraint(
    'minimal-color',
    {
      palette: {
        primary: ['#000000'],
        neutral: ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121', '#000000'],
      },
      maxColors: 3,
      colorHarmony: ['monochromatic'],
    },
    {
      name: 'Minimal Colors',
      description: 'Monochromatic grayscale palette',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Typography constraints
  constraints.defineTypographyConstraint(
    'minimal-typography',
    {
      fontFamilies: {
        body: ['Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
      scale: {
        baseSize: 18,
        ratio: 1.414,
      },
      weights: [400, 700],
      maxLevels: 3,
    },
    {
      name: 'Minimal Typography',
      description: 'Simple type hierarchy',
      priority: ConstraintPriority.HIGH,
    }
  );

  // Spacing constraints
  constraints.defineSpacingConstraint(
    'minimal-spacing',
    {
      system: {
        base: 8,
        scale: [8, 16, 32, 64],
      },
      consistent: true,
    },
    {
      name: 'Minimal Spacing',
      description: 'Generous white space',
      priority: ConstraintPriority.HIGH,
    }
  );

  return constraints;
}

/**
 * Template registry
 */
export const TEMPLATE_REGISTRY: Record<string, () => DesignConstraints> = {
  'material': createMaterialDesignTemplate,
  'ios': createiOSTemplate,
  'tailwind': createTailwindTemplate,
  'bootstrap': createBootstrapTemplate,
  'minimal': createMinimalTemplate,
};

/**
 * Get available template names
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Create constraints from template
 */
export function createFromTemplate(templateName: string): DesignConstraints | null {
  const factory = TEMPLATE_REGISTRY[templateName];
  return factory ? factory() : null;
}

/**
 * Export template metadata
 */
export function getTemplateMetadata(): ConstraintTemplate[] {
  return [
    {
      id: 'material',
      name: 'Material Design 3',
      description: 'Google Material Design 3 design system',
      category: 'Design System',
      version: '3.0',
      author: 'Google',
      constraints: createMaterialDesignTemplate().getAllConstraints(),
    },
    {
      id: 'ios',
      name: 'iOS Human Interface Guidelines',
      description: 'Apple iOS design system',
      category: 'Design System',
      version: 'iOS 17',
      author: 'Apple',
      constraints: createiOSTemplate().getAllConstraints(),
    },
    {
      id: 'tailwind',
      name: 'Tailwind CSS',
      description: 'Utility-first CSS framework',
      category: 'CSS Framework',
      version: '3.0',
      constraints: createTailwindTemplate().getAllConstraints(),
    },
    {
      id: 'bootstrap',
      name: 'Bootstrap 5',
      description: 'Popular responsive framework',
      category: 'CSS Framework',
      version: '5.0',
      constraints: createBootstrapTemplate().getAllConstraints(),
    },
    {
      id: 'minimal',
      name: 'Minimal Design',
      description: 'Clean and minimal aesthetic',
      category: 'Style',
      version: '1.0',
      constraints: createMinimalTemplate().getAllConstraints(),
    },
  ];
}
