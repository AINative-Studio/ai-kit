# Design Token Extraction

> Extract and normalize design tokens from Figma, Style Dictionary, and Tokens Studio for AI-powered design tools.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Design Token Concepts](#design-token-concepts)
- [Figma Integration](#figma-integration)
- [Style Dictionary Support](#style-dictionary-support)
- [Tokens Studio Support](#tokens-studio-support)
- [Token Normalization](#token-normalization)
- [Export Formats](#export-formats)
- [Validation](#validation)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Design Token Extractor is a powerful tool for extracting, normalizing, and exporting design tokens from various design systems and tools. It provides a unified interface for working with design tokens regardless of their source format.

### Key Features

- **Multi-Source Support**: Extract tokens from Figma, Style Dictionary, and Tokens Studio
- **Standardized Format**: Convert all tokens to a consistent, W3C-compliant format
- **Multiple Export Formats**: Export to CSS, SCSS, LESS, JavaScript, TypeScript, JSON, and more
- **Theme Support**: Handle light, dark, and custom theme variations
- **Validation**: Detect conflicts, circular references, and invalid values
- **Transformation**: Apply custom transformations and normalization rules
- **Type Safety**: Full TypeScript support with comprehensive type definitions

### Supported Token Types

- **Colors**: Hex, RGB, RGBA, HSL, HSLA formats
- **Typography**: Font families, sizes, weights, line heights, letter spacing
- **Spacing**: Padding, margin, gap values
- **Sizing**: Width, height, min/max dimensions
- **Border**: Radius, width values
- **Effects**: Shadows, blur effects
- **Opacity**: Transparency values
- **Layout**: Z-index, breakpoints
- **Animation**: Duration, timing functions, transitions
- **Gradients**: Linear, radial, conic gradients

## Installation

```bash
# Using pnpm (recommended)
pnpm add @ainative/ai-kit-tools

# Using npm
npm install @ainative/ai-kit-tools

# Using yarn
yarn add @ainative/ai-kit-tools
```

## Quick Start

### Basic Usage

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

// Create an extractor instance
const extractor = new DesignTokenExtractor({
  nameSeparator: '-',
  prefix: 'ds-',
})

// Extract tokens from Figma
const collection = await extractor.extractFromFigma(
  'figma-file-key',
  'figma-access-token'
)

// Normalize tokens
const normalized = extractor.normalizeTokens()

// Export to CSS
const css = extractor.exportTokens('css', {
  includeComments: true,
  cssPrefix: '--',
})

console.log(css)
```

### Factory Function

```typescript
import { createDesignTokenExtractor } from '@ainative/ai-kit-tools'

const extractor = createDesignTokenExtractor({
  defaultTheme: 'light',
  includeSemantic: true,
})
```

## Design Token Concepts

### What are Design Tokens?

Design tokens are the visual design atoms of a design system—specifically, they are named entities that store visual design attributes. They're used in place of hard-coded values to ensure consistency and enable systematic theming.

### Token Structure

Every design token in this system follows the W3C Design Tokens Community Group format:

```typescript
interface DesignToken {
  name: string              // Unique identifier (e.g., "color-primary")
  value: any                // The actual value (e.g., "#3366FF")
  type: TokenType           // Token type (e.g., "color")
  category: TokenCategory   // Token category (e.g., "color")
  description?: string      // Human-readable description
  reference?: string        // Reference to another token
  theme?: ThemeMode        // Theme variant (light/dark/custom)
  semantic?: boolean        // Is this a semantic token?
  source?: string          // Origin (figma/styleDictionary/tokensStudio)
  metadata?: object        // Additional metadata
}
```

### Token Categories

Tokens are organized into categories:

- `color` - Color values
- `typography` - Text styles
- `spacing` - Spacing values
- `sizing` - Size dimensions
- `borderRadius` - Corner radius values
- `borderWidth` - Border thickness
- `shadow` - Shadow effects
- `opacity` - Transparency values
- `zIndex` - Stacking order
- `breakpoint` - Responsive breakpoints
- `duration` - Animation duration
- `timingFunction` - Animation timing
- `gradient` - Gradient definitions

### Semantic vs Reference Tokens

**Reference Tokens** (Foundation):
```json
{
  "color-blue-500": {
    "value": "#3366FF",
    "type": "color"
  }
}
```

**Semantic Tokens** (Purpose-driven):
```json
{
  "color-primary": {
    "value": "{color-blue-500}",
    "type": "color",
    "semantic": true
  }
}
```

## Figma Integration

### Setting Up Figma Access

1. **Get Your Figma Access Token**:
   - Go to Figma → Account Settings → Personal Access Tokens
   - Click "Generate new token"
   - Copy the token (store it securely)

2. **Get Your File Key**:
   - Open your Figma file
   - Copy the file key from the URL: `https://figma.com/file/{FILE_KEY}/...`

### Extracting from Figma

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const extractor = new DesignTokenExtractor({
  figma: {
    fileKey: 'your-file-key',
    accessToken: 'your-access-token',
    extractStyles: true,
    extractComponents: false,
  }
})

// Extract all tokens from the file
const collection = await extractor.extractFromFigma()

console.log(`Extracted ${collection.tokens.length} tokens`)
console.log(`File: ${collection.name}`)
console.log(`Version: ${collection.version}`)
```

### Figma Extraction Options

```typescript
interface FigmaConfig {
  fileKey: string           // Required: Figma file key
  accessToken: string       // Required: Your Figma access token
  apiVersion?: string       // API version (default: v1)
  nodeIds?: string[]       // Extract specific nodes only
  extractStyles?: boolean   // Extract color/text/effect styles
  extractComponents?: boolean // Extract component tokens
  rateLimit?: {
    maxRequests: number
    perMilliseconds: number
  }
}
```

### What Gets Extracted from Figma

1. **Color Styles**: All published color styles
2. **Text Styles**: Typography styles with font properties
3. **Effect Styles**: Shadow and blur effects
4. **Node Properties**: Colors, effects from specific nodes
5. **Component Properties**: Properties from components (if enabled)

### Figma Token Mapping

| Figma Element | Token Type | Category |
|--------------|------------|----------|
| Fill Color | color | color |
| Text Style | typography | typography |
| Font Family | fontFamily | typography |
| Font Size | fontSize | typography |
| Font Weight | fontWeight | typography |
| Line Height | lineHeight | typography |
| Letter Spacing | letterSpacing | typography |
| Drop Shadow | shadow | shadow |
| Layer Blur | blur | blur |
| Corner Radius | borderRadius | borderRadius |
| Stroke Weight | borderWidth | borderWidth |

### Example: Figma Color Extraction

```typescript
// Your Figma file has these styles:
// - Color/Brand/Primary (#3366FF)
// - Color/Brand/Secondary (#FF6633)
// - Color/Neutral/Gray (#999999)

const extractor = new DesignTokenExtractor()
const collection = await extractor.extractFromFigma(
  'file-key',
  'access-token'
)

// Results in tokens:
// {
//   name: "color-brand-primary",
//   value: { hex: "#3366FF", rgb: { r: 51, g: 102, b: 255 } },
//   type: "color",
//   category: "color",
//   source: "figma"
// }
```

### Handling Figma Rate Limits

```typescript
const extractor = new DesignTokenExtractor({
  figma: {
    fileKey: 'your-file-key',
    accessToken: 'your-token',
    rateLimit: {
      maxRequests: 100,
      perMilliseconds: 60000, // 100 requests per minute
    }
  }
})
```

## Style Dictionary Support

### What is Style Dictionary?

Style Dictionary is a build system that lets you define design tokens once and generate them for multiple platforms.

### Extracting from Style Dictionary

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const styleDictionaryConfig = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
      }],
    },
  },
  tokens: {
    color: {
      primary: {
        value: '#3366FF',
        type: 'color',
        comment: 'Primary brand color',
      },
      secondary: {
        value: '#FF6633',
        type: 'color',
      },
    },
    spacing: {
      small: { value: '8px', type: 'dimension' },
      medium: { value: '16px', type: 'dimension' },
      large: { value: '24px', type: 'dimension' },
    },
  },
}

const extractor = new DesignTokenExtractor()
const collection = await extractor.extractFromStyleDictionary(
  styleDictionaryConfig
)
```

### Style Dictionary Token Format

```json
{
  "color": {
    "brand": {
      "primary": {
        "value": "#3366FF",
        "type": "color",
        "comment": "Primary brand color"
      }
    }
  },
  "spacing": {
    "unit": {
      "value": "8px",
      "type": "dimension"
    }
  }
}
```

### Nested Token Groups

The extractor automatically handles nested token groups:

```typescript
// Style Dictionary tokens
{
  "color": {
    "brand": {
      "primary": {
        "500": { value: "#3366FF" },
        "600": { value: "#2952CC" },
        "700": { value: "#1F3D99" }
      }
    }
  }
}

// Extracted as:
// - color-brand-primary-500
// - color-brand-primary-600
// - color-brand-primary-700
```

## CSS Extraction

### Extracting from CSS Files

Extract design tokens directly from CSS files, including custom properties and computed styles.

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const css = `
  :root {
    --color-primary: #3366FF;
    --color-secondary: #FF6633;
    --spacing-small: 8px;
    --spacing-medium: 16px;
    --font-family-main: 'Inter', sans-serif;
    --font-size-body: 16px;
    --radius-default: 4px;
    --shadow-default: 0px 4px 10px rgba(0,0,0,0.25);
  }

  .button {
    color: #FFFFFF;
    background-color: #3366FF;
    padding: 8px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`

const extractor = new DesignTokenExtractor()
const collection = extractor.extractFromCSS(css)

console.log(`Extracted ${collection.tokens.length} tokens from CSS`)
```

### What Gets Extracted from CSS

The extractor automatically detects and extracts:

1. **CSS Custom Properties** (`--variable-name`)
2. **Color Values**: `color`, `background-color`, `border-color`, `fill`, `stroke`
3. **Spacing**: `padding`, `margin`, `gap`
4. **Typography**: `font-family`, `font-size`, `font-weight`, `line-height`
5. **Border Radius**: `border-radius`
6. **Shadows**: `box-shadow`, `text-shadow`
7. **Opacity**: `opacity`

### Supported Color Formats

- Hex: `#3366FF`
- RGB: `rgb(51, 102, 255)`
- RGBA: `rgba(51, 102, 255, 0.5)`
- HSL: `hsl(220, 100%, 60%)`
- HSLA: `hsla(220, 100%, 60%, 0.5)`
- Named colors: `blue`, `red`, `transparent`

### Example: Complete CSS Extraction

```typescript
import { readFileSync } from 'fs'
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

// Read CSS file
const css = readFileSync('./styles/design-system.css', 'utf-8')

// Extract tokens
const extractor = new DesignTokenExtractor()
const collection = extractor.extractFromCSS(css)

// Get specific token types
const colors = extractor.getTokensByCategory('color')
const spacing = extractor.getTokensByCategory('spacing')
const typography = extractor.getTokensByCategory('typography')

console.log(`Colors: ${colors.length}`)
console.log(`Spacing: ${spacing.length}`)
console.log(`Typography: ${typography.length}`)

// Export to different format
const tailwind = extractor.exportTokens('tailwind')
```

## Website Extraction

### Extracting from Live Websites

Extract design tokens from any website by analyzing its DOM and computed styles.

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const extractor = new DesignTokenExtractor()

// Extract from a website
const collection = await extractor.extractFromWebsite(
  'https://example.com'
)

console.log(`Extracted ${collection.tokens.length} tokens`)
console.log('Source:', collection.metadata?.url)
```

### How It Works

The website extractor:

1. Fetches the HTML content
2. Extracts inline `<style>` tags
3. Parses CSS and extracts tokens
4. Identifies design patterns
5. Returns standardized tokens

### Use Cases

- **Competitive Analysis**: Extract design systems from competitor websites
- **Migration**: Import existing website styles to design system
- **Auditing**: Analyze design token usage across sites
- **Documentation**: Generate design system docs from live sites

### Example: Extract and Compare

```typescript
const extractor = new DesignTokenExtractor()

// Extract from multiple sites
const site1 = await extractor.extractFromWebsite('https://site1.com')
const site2 = await extractor.extractFromWebsite('https://site2.com')

// Compare color palettes
const colors1 = site1.tokens.filter(t => t.category === 'color')
const colors2 = site2.tokens.filter(t => t.category === 'color')

console.log(`Site 1 uses ${colors1.length} colors`)
console.log(`Site 2 uses ${colors2.length} colors`)
```

### Limitations

- Cannot access styles from external stylesheets (CORS)
- Does not compute styles from JavaScript
- Best for inline styles and `<style>` tags
- Use browser DevTools for complete style extraction

## Image Extraction (AI-Powered)

### Extracting from Screenshots and Design Files

Use AI vision models to extract design tokens from images, screenshots, and design mockups.

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const extractor = new DesignTokenExtractor()

// Extract from image
const collection = await extractor.extractFromImage(
  'https://example.com/design-mockup.png'
)

// Or from local file
const local = await extractor.extractFromImage(
  './designs/homepage-screenshot.jpg'
)

console.log(`Extracted ${collection.tokens.length} tokens from image`)
```

### What Can Be Extracted

The AI vision analysis can detect:

- **Colors**: Dominant colors, color palettes, accent colors
- **Typography**: Font styles, sizes, hierarchies
- **Spacing**: Consistent spacing patterns
- **Layout**: Grid systems, component sizes
- **Shadows**: Shadow styles and depths
- **Corner Radius**: Rounded corners on elements

### Use Cases

- **Design Handoff**: Convert mockups to tokens
- **Brand Analysis**: Extract colors from logos and screenshots
- **Competitive Research**: Analyze competitor designs
- **Accessibility Audit**: Check color contrast from screenshots

### Example: Extract from Multiple Images

```typescript
const extractor = new DesignTokenExtractor()

const images = [
  './designs/homepage.png',
  './designs/product-page.png',
  './designs/checkout.png',
]

for (const image of images) {
  const collection = await extractor.extractFromImage(image)
  console.log(`${image}: ${collection.tokens.length} tokens`)
}
```

### Supported Image Formats

- PNG
- JPEG/JPG
- WebP
- SVG (as image)
- GIF

## AI-Powered Features

### Automatic Token Naming

Let AI generate semantic, meaningful names for your design tokens.

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const extractor = new DesignTokenExtractor()

// Extract tokens (may have generic names)
const collection = await extractor.extractFromImage('./design.png')

// Generate better names using AI
const namedTokens = extractor.generateTokenNames(collection.tokens)

// Results:
// Before: "token-1", "token-2", "token-3"
// After:  "color-ocean-blue", "spacing-comfortable", "font-size-heading"
```

### Name Generation Features

The AI naming system:

- Analyzes token values and context
- Generates semantic, descriptive names
- Follows naming conventions (kebab-case, camelCase, etc.)
- Considers token relationships
- Preserves good existing names
- Marks AI-generated names in metadata

### Example: Name Generation Pipeline

```typescript
// Extract unnamed tokens
const tokens = await extractor.extractFromWebsite('https://example.com')

// Let AI suggest better names
const named = extractor.generateTokenNames(tokens)

// Review AI suggestions
named.forEach(token => {
  if (token.metadata?.aiGenerated) {
    console.log(`Original: ${token.metadata.originalName}`)
    console.log(`Suggested: ${token.name}`)
  }
})

// Export with new names
const css = extractor.exportTokens('css')
```

### Theme Generation from Colors

Generate complete design system themes from a few base colors.

```typescript
import { DesignTokenExtractor, ThemeMode } from '@ainative/ai-kit-tools'

const extractor = new DesignTokenExtractor()

// Define your brand colors
const brandColors = [
  '#3366FF', // Primary blue
  '#FF6633', // Secondary orange
  '#33CC66', // Success green
]

// Generate light theme
const lightTheme = extractor.generateTheme(brandColors, ThemeMode.LIGHT)

// Generate dark theme
const darkTheme = extractor.generateTheme(brandColors, ThemeMode.DARK)

console.log(`Light theme: ${lightTheme.length} tokens`)
console.log(`Dark theme: ${darkTheme.length} tokens`)
```

### What Gets Generated

From base colors, the theme generator creates:

1. **Color Shades**: 9 shades per color (100-900)
2. **Semantic Colors**: Primary, secondary, success, danger, warning, info
3. **Surface Colors**: Background, foreground, surface colors
4. **Text Colors**: Body, heading, muted, disabled
5. **Border Colors**: Default, subtle, strong
6. **State Colors**: Hover, active, focus, disabled

### Example: Complete Theme Generation

```typescript
const extractor = new DesignTokenExtractor()

// Generate from brand color
const theme = extractor.generateTheme(['#3366FF'])

// Organize by category
const colors = theme.filter(t => t.category === 'color')
const semantic = colors.filter(t => t.semantic === true)
const shades = colors.filter(t => !t.semantic)

console.log('Generated tokens:')
console.log(`  - ${shades.length} color shades`)
console.log(`  - ${semantic.length} semantic colors`)

// Export to Tailwind config
extractor['tokens'] = theme
const tailwindConfig = extractor.exportTokens('tailwind')
```

### Multi-Theme Generation

```typescript
// Generate multiple theme modes
const baseColors = ['#3366FF', '#FF6633']

const themes = {
  light: extractor.generateTheme(baseColors, ThemeMode.LIGHT),
  dark: extractor.generateTheme(baseColors, ThemeMode.DARK),
  highContrast: extractor.generateTheme(baseColors, ThemeMode.HIGH_CONTRAST),
}

// Export each theme separately
for (const [mode, tokens] of Object.entries(themes)) {
  extractor['tokens'] = tokens
  const css = extractor.exportTokens('css', {
    cssPrefix: `--${mode}-`,
  })
  console.log(`${mode} theme CSS generated`)
}
```

## Tokens Studio Support

### What is Tokens Studio?

Tokens Studio (formerly Figma Tokens) is a Figma plugin that allows you to manage design tokens directly in Figma with a JSON-based format.

### Extracting from Tokens Studio

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const tokensStudioData = {
  "global": {
    "color": {
      "primary": {
        "value": "#3366FF",
        "type": "color",
        "description": "Primary brand color"
      },
      "secondary": {
        "value": "{color.primary}",
        "type": "color"
      }
    }
  },
  "light": {
    "color": {
      "background": {
        "value": "#FFFFFF",
        "type": "color"
      },
      "text": {
        "value": "#000000",
        "type": "color"
      }
    }
  },
  "dark": {
    "color": {
      "background": {
        "value": "#000000",
        "type": "color"
      },
      "text": {
        "value": "#FFFFFF",
        "type": "color"
      }
    }
  }
}

const extractor = new DesignTokenExtractor()
const collection = extractor.extractFromTokensStudio(tokensStudioData)

// Access theme-specific tokens
const lightTokens = collection.themes?.light
const darkTokens = collection.themes?.dark
```

### Token References

Tokens Studio supports references using curly brace syntax:

```json
{
  "color": {
    "blue": {
      "500": {
        "value": "#3366FF",
        "type": "color"
      }
    },
    "primary": {
      "value": "{color.blue.500}",
      "type": "color"
    }
  }
}
```

The extractor automatically resolves these references during normalization.

### Theme Sets

Tokens Studio organizes tokens into sets, which can represent themes:

```typescript
const collection = extractor.extractFromTokensStudio(tokensData)

// Check available themes
console.log(Object.keys(collection.themes))
// Output: ['light', 'dark']

// Get light theme tokens
const lightTheme = extractor.getTokensByTheme('light')
```

## Token Normalization

Normalization standardizes tokens into a consistent format, resolves references, and applies transformations.

### Basic Normalization

```typescript
const extractor = new DesignTokenExtractor({
  nameSeparator: '-',
  prefix: 'design-',
})

// After extracting tokens
const normalized = extractor.normalizeTokens()
```

### Name Transformations

```typescript
// Kebab case (default)
const extractor = new DesignTokenExtractor({
  transforms: {
    nameCase: 'kebabCase',
  }
})
// Result: "color-primary-500"

// Camel case
const extractor = new DesignTokenExtractor({
  transforms: {
    nameCase: 'camelCase',
  }
})
// Result: "colorPrimary500"

// Snake case
const extractor = new DesignTokenExtractor({
  transforms: {
    nameCase: 'snakeCase',
  }
})
// Result: "color_primary_500"

// Pascal case
const extractor = new DesignTokenExtractor({
  transforms: {
    nameCase: 'pascalCase',
  }
})
// Result: "ColorPrimary500"
```

### Value Transformations

#### Color Format Transformation

```typescript
const extractor = new DesignTokenExtractor({
  transforms: {
    colorFormat: 'hex', // 'hex' | 'rgb' | 'hsl' | 'all'
  }
})
```

#### Dimension Unit Transformation

```typescript
// Convert all dimensions to rem
const extractor = new DesignTokenExtractor({
  transforms: {
    dimensionUnit: 'rem',
    baseFontSize: 16,
  }
})

// Input: 24px
// Output: 1.5rem
```

### Reference Resolution

```typescript
const tokens = [
  {
    name: 'color-blue-500',
    value: '#3366FF',
    type: 'color',
    category: 'color',
  },
  {
    name: 'color-primary',
    value: undefined,
    reference: 'color-blue-500',
    type: 'color',
    category: 'color',
  },
]

const normalized = extractor.normalizeTokens(tokens)

// color-primary now has value '#3366FF'
// and metadata.resolvedFrom = 'color-blue-500'
```

### Custom Transformations

```typescript
const extractor = new DesignTokenExtractor({
  transforms: {
    custom: {
      // Convert all colors to uppercase
      uppercaseColors: (value) => {
        if (typeof value === 'string' && value.startsWith('#')) {
          return value.toUpperCase()
        }
        return value
      },

      // Add unit to unitless values
      addUnit: (value) => {
        if (typeof value === 'number') {
          return `${value}px`
        }
        return value
      },
    }
  }
})
```

## Export Formats

The extractor supports multiple export formats for different use cases.

### CSS Variables

```typescript
const css = extractor.exportTokens('css', {
  cssPrefix: '--',
  includeComments: true,
})
```

**Output:**

```css
:root {
  /* Primary brand color */
  --color-primary: #3366FF;
  --spacing-medium: 16px;
  --shadow-default: 0px 4px 10px 0px #00000040;
}
```

### SCSS Variables

```typescript
const scss = extractor.exportTokens('scss', {
  includeComments: true,
})
```

**Output:**

```scss
// Primary brand color
$color-primary: #3366FF;
$spacing-medium: 16px;
$shadow-default: 0px 4px 10px 0px #00000040;
```

### LESS Variables

```typescript
const less = extractor.exportTokens('less')
```

**Output:**

```less
@color-primary: #3366FF;
@spacing-medium: 16px;
@shadow-default: 0px 4px 10px 0px #00000040;
```

### JavaScript/TypeScript

```typescript
// JavaScript
const js = extractor.exportTokens('js')
```

**Output:**

```javascript
export default {
  "color-primary": "#3366FF",
  "spacing-medium": "16px",
  "shadow-default": "0px 4px 10px 0px #00000040"
};
```

```typescript
// TypeScript
const ts = extractor.exportTokens('ts')
```

**Output:**

```typescript
export const tokens = {
  "color-primary": "#3366FF",
  "spacing-medium": "16px",
  "shadow-default": "0px 4px 10px 0px #00000040"
} as const;

export type TokenName = keyof typeof tokens;
```

### JSON

```typescript
const json = extractor.exportTokens('json', {
  pretty: true,
  indent: 2,
})
```

**Output:**

```json
{
  "color": {
    "primary": {
      "value": "#3366FF",
      "type": "color"
    }
  },
  "spacing": {
    "medium": {
      "value": "16px",
      "type": "spacing"
    }
  }
}
```

### Tailwind Config

```typescript
const tailwind = extractor.exportTokens('tailwind')
```

**Output:**

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        "primary": "#3366FF"
      },
      spacing: {
        "medium": "16px"
      },
      boxShadow: {
        "default": "0px 4px 10px 0px #00000040"
      }
    }
  }
};
```

### Export Options

```typescript
interface ExportOptions {
  format: ExportFormat
  outputPath?: string          // Write to file
  includeComments?: boolean    // Include descriptions
  pretty?: boolean             // Pretty print
  indent?: number              // Indentation size
  cssPrefix?: string           // CSS variable prefix
  includeMetadata?: boolean    // Include metadata
  theme?: ThemeMode | 'all'   // Theme filter
}
```

## Validation

The validation system helps ensure token quality and consistency.

### Basic Validation

```typescript
const extractor = new DesignTokenExtractor({
  validation: {
    validateColors: true,
    validateReferences: true,
    detectCircular: true,
    detectConflicts: true,
  }
})

const result = extractor.validateTokens()

if (!result.valid) {
  console.error('Validation errors:', result.errors)
  console.warn('Validation warnings:', result.warnings)
}
```

### Validation Results

```typescript
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  token: string
  message: string
  severity: 'error' | 'warning'
}

interface ValidationWarning {
  token: string
  message: string
  suggestion?: string
}
```

### Color Validation

Ensures color values are valid:

```typescript
// Valid colors
{ value: "#3366FF" }              // ✓
{ value: { hex: "#3366FF" } }     // ✓
{ value: { rgb: { r: 51, g: 102, b: 255 } } }  // ✓

// Invalid colors
{ value: null }                   // ✗
{ value: "invalid" }              // ✗
{ value: {} }                     // ✗
```

### Reference Validation

Checks that all token references exist:

```typescript
// Valid reference
{
  name: "color-primary",
  reference: "color-blue-500"  // Must exist
}

// Invalid reference
{
  name: "color-primary",
  reference: "color-nonexistent"  // Error: Reference not found
}
```

### Circular Reference Detection

Detects infinite reference loops:

```typescript
// Circular reference detected
{
  name: "color-a",
  reference: "color-b"
}
{
  name: "color-b",
  reference: "color-a"  // Error: Circular reference
}
```

### Conflict Detection

Finds duplicate token names:

```typescript
// Conflict detected
{
  name: "color-primary",
  value: "#3366FF"
}
{
  name: "color-primary",
  value: "#FF6633"  // Warning: Duplicate name
}

// Access conflicts
const conflicts = extractor.getConflicts()
console.log(conflicts)
// [{
//   name: "color-primary",
//   tokens: [...],
//   reason: "Multiple tokens with name 'color-primary'"
// }]
```

### Custom Validation Rules

```typescript
const extractor = new DesignTokenExtractor({
  validation: {
    customRules: [
      {
        name: 'Color Naming Convention',
        category: 'color',
        validate: (token) => {
          // Colors must start with 'color-'
          if (!token.name.startsWith('color-')) {
            return 'Color tokens must start with "color-"'
          }
          return true
        }
      },
      {
        name: 'Spacing Multiples',
        category: 'spacing',
        validate: (token) => {
          // Spacing must be multiples of 4
          const value = parseInt(token.value)
          if (value % 4 !== 0) {
            return 'Spacing values must be multiples of 4'
          }
          return true
        }
      }
    ]
  }
})
```

## Advanced Features

### Theme Handling

```typescript
// Extract with theme support
const collection = extractor.extractFromTokensStudio(tokensStudioData)

// Get all light theme tokens
const lightTokens = extractor.getTokensByTheme('light')

// Get all dark theme tokens
const darkTokens = extractor.getTokensByTheme('dark')

// Export specific theme
const lightCSS = extractor.exportTokens('css', {
  theme: 'light',
})

// Export all themes
const allCSS = extractor.exportTokens('css', {
  theme: 'all',
})
```

### Token Categorization

```typescript
// Get tokens by category
const colors = extractor.getTokensByCategory('color')
const spacing = extractor.getTokensByCategory('spacing')
const typography = extractor.getTokensByCategory('typography')

// Filter and export
const colorCSS = extractor.exportTokens('css', {
  theme: 'light',
})
```

### Token Groups

Create hierarchical token groups:

```typescript
const collection: TokenCollection = {
  name: 'Design System',
  tokens: allTokens,
  groups: [
    {
      name: 'Brand Colors',
      description: 'Core brand color palette',
      tokens: brandColorTokens,
    },
    {
      name: 'Spacing Scale',
      description: 'Spacing system based on 8px grid',
      tokens: spacingTokens,
      subGroups: [
        {
          name: 'Padding',
          tokens: paddingTokens,
        },
        {
          name: 'Margin',
          tokens: marginTokens,
        },
      ],
    },
  ],
}
```

### Platform-Specific Values

```typescript
const token: DesignToken = {
  name: 'font-family-primary',
  value: 'Inter, sans-serif',
  type: 'fontFamily',
  category: 'typography',
  platforms: {
    web: 'Inter, -apple-system, sans-serif',
    ios: 'SF Pro Text',
    android: 'Roboto',
  }
}
```

## API Reference

### DesignTokenExtractor Class

#### Constructor

```typescript
constructor(config?: ExtractorConfig)
```

#### Methods

##### extractFromFigma()

```typescript
async extractFromFigma(
  fileKey?: string,
  accessToken?: string
): Promise<TokenCollection>
```

Extracts design tokens from a Figma file.

##### extractFromStyleDictionary()

```typescript
async extractFromStyleDictionary(
  config: StyleDictionaryConfig | string
): Promise<TokenCollection>
```

Extracts tokens from Style Dictionary configuration.

##### extractFromTokensStudio()

```typescript
extractFromTokensStudio(
  json: TokensStudioFormat | string
): TokenCollection
```

Extracts tokens from Tokens Studio format.

##### extractFromCSS()

```typescript
extractFromCSS(css: string): TokenCollection
```

Extracts tokens from CSS string, including custom properties and computed styles.

##### extractFromWebsite()

```typescript
async extractFromWebsite(url: string): Promise<TokenCollection>
```

Extracts tokens from a website by analyzing its DOM and inline styles.

##### extractFromImage()

```typescript
async extractFromImage(imageUrl: string): Promise<TokenCollection>
```

Extracts tokens from images using AI vision analysis (placeholder for AI integration).

##### generateTokenNames()

```typescript
generateTokenNames(tokens: DesignToken[]): DesignToken[]
```

Generates semantic, AI-powered names for design tokens.

##### generateTheme()

```typescript
generateTheme(
  baseColors: string[],
  mode?: ThemeMode
): DesignToken[]
```

Generates a complete design system theme from base colors, including color shades and semantic tokens.

##### normalizeTokens()

```typescript
normalizeTokens(tokens?: DesignToken[]): DesignToken[]
```

Normalizes tokens to standardized format.

##### exportTokens()

```typescript
exportTokens(
  format: ExportFormat,
  options?: Partial<ExportOptions>
): string
```

Exports tokens to specified format.

##### validateTokens()

```typescript
validateTokens(tokens?: DesignToken[]): ValidationResult
```

Validates tokens and returns validation results.

##### getTokens()

```typescript
getTokens(): DesignToken[]
```

Returns all extracted tokens.

##### getTokensByCategory()

```typescript
getTokensByCategory(category: TokenCategory): DesignToken[]
```

Returns tokens filtered by category.

##### getTokensByTheme()

```typescript
getTokensByTheme(theme: ThemeMode): DesignToken[]
```

Returns tokens filtered by theme.

##### getConflicts()

```typescript
getConflicts(): TokenConflict[]
```

Returns detected token conflicts.

## Examples

### Example 1: Complete Figma Workflow

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

async function extractFromFigma() {
  const extractor = new DesignTokenExtractor({
    figma: {
      fileKey: process.env.FIGMA_FILE_KEY!,
      accessToken: process.env.FIGMA_TOKEN!,
      extractStyles: true,
    },
    nameSeparator: '-',
    prefix: 'ds-',
    validation: {
      validateColors: true,
      detectConflicts: true,
    },
  })

  // Extract tokens
  const collection = await extractor.extractFromFigma()
  console.log(`Extracted ${collection.tokens.length} tokens`)

  // Normalize
  const normalized = extractor.normalizeTokens()

  // Validate
  const validation = extractor.validateTokens()
  if (!validation.valid) {
    console.error('Validation errors:', validation.errors)
  }

  // Export to multiple formats
  const css = extractor.exportTokens('css', { cssPrefix: '--ds-' })
  const scss = extractor.exportTokens('scss')
  const ts = extractor.exportTokens('ts')

  return { css, scss, ts }
}
```

### Example 2: Multi-Theme System

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const tokensStudioData = {
  global: {
    color: {
      blue: { 500: { value: '#3366FF', type: 'color' } },
    },
    spacing: {
      unit: { value: '8px', type: 'spacing' },
    },
  },
  light: {
    color: {
      background: { value: '#FFFFFF', type: 'color' },
      text: { value: '#000000', type: 'color' },
    },
  },
  dark: {
    color: {
      background: { value: '#000000', type: 'color' },
      text: { value: '#FFFFFF', type: 'color' },
    },
  },
}

const extractor = new DesignTokenExtractor()
const collection = extractor.extractFromTokensStudio(tokensStudioData)

// Export light theme
const lightCSS = extractor.exportTokens('css', {
  theme: 'light',
  cssPrefix: '--',
})

// Export dark theme
const darkCSS = extractor.exportTokens('css', {
  theme: 'dark',
  cssPrefix: '--',
})

console.log('Light theme:', lightCSS)
console.log('Dark theme:', darkCSS)
```

### Example 3: Custom Transformations

```typescript
const extractor = new DesignTokenExtractor({
  transforms: {
    nameCase: 'camelCase',
    dimensionUnit: 'rem',
    baseFontSize: 16,
    custom: {
      // Ensure all colors are uppercase
      uppercaseHex: (value) => {
        if (value?.hex) {
          return { ...value, hex: value.hex.toUpperCase() }
        }
        return value
      },

      // Round spacing to nearest 4px
      roundSpacing: (value) => {
        if (typeof value === 'number') {
          return Math.round(value / 4) * 4
        }
        return value
      },
    },
  },
})
```

### Example 4: Validation Pipeline

```typescript
import { DesignTokenExtractor } from '@ainative/ai-kit-tools'

const extractor = new DesignTokenExtractor({
  validation: {
    validateColors: true,
    validateReferences: true,
    detectCircular: true,
    detectConflicts: true,
    customRules: [
      {
        name: 'Naming Convention',
        validate: (token) => {
          // All tokens must use kebab-case
          if (!/^[a-z0-9-]+$/.test(token.name)) {
            return 'Token names must use kebab-case'
          }
          return true
        },
      },
      {
        name: 'Color Accessibility',
        category: 'color',
        validate: (token) => {
          // Ensure minimum contrast
          // (simplified example)
          return true
        },
      },
    ],
  },
})

// Run validation
const result = extractor.validateTokens()

// Report results
if (!result.valid) {
  console.error('❌ Validation failed')
  result.errors.forEach(error => {
    console.error(`  - ${error.token}: ${error.message}`)
  })
}

if (result.warnings.length > 0) {
  console.warn('⚠️  Warnings')
  result.warnings.forEach(warning => {
    console.warn(`  - ${warning.token}: ${warning.message}`)
    if (warning.suggestion) {
      console.warn(`    Suggestion: ${warning.suggestion}`)
    }
  })
}

if (result.valid && result.warnings.length === 0) {
  console.log('✅ All tokens valid')
}
```

## Best Practices

### 1. Token Naming

Use consistent, descriptive names:

```typescript
// Good
color-brand-primary-500
spacing-layout-medium
typography-heading-h1

// Avoid
blue
space2
h1
```

### 2. Semantic Layers

Create semantic tokens that reference foundation tokens:

```typescript
// Foundation (reference tokens)
color-blue-500: #3366FF
color-red-500: #FF6633

// Semantic tokens
color-primary: {color-blue-500}
color-danger: {color-red-500}
```

### 3. Theme Organization

Organize themes consistently:

```typescript
{
  "global": {
    // Foundation tokens shared across themes
  },
  "light": {
    // Light theme overrides
  },
  "dark": {
    // Dark theme overrides
  }
}
```

### 4. Validation First

Always validate before exporting:

```typescript
const validation = extractor.validateTokens()
if (validation.valid) {
  const output = extractor.exportTokens('css')
}
```

### 5. Version Control

Include metadata for tracking:

```typescript
const collection: TokenCollection = {
  name: 'Design System',
  version: '1.0.0',
  tokens: [...],
  metadata: {
    generatedAt: new Date().toISOString(),
    source: 'figma',
    author: 'Design Team',
  },
}
```

## Troubleshooting

### Figma API Issues

**Problem**: `401 Unauthorized` error

**Solution**: Verify your Figma access token is valid and has correct permissions.

**Problem**: Rate limiting errors

**Solution**: Configure rate limiting:

```typescript
const extractor = new DesignTokenExtractor({
  figma: {
    fileKey: 'your-key',
    accessToken: 'your-token',
    rateLimit: {
      maxRequests: 50,
      perMilliseconds: 60000,
    },
  },
})
```

### Token Reference Issues

**Problem**: References not resolving

**Solution**: Ensure referenced tokens are extracted before normalization:

```typescript
// Extract all tokens first
const collection = await extractor.extractFromFigma()

// Then normalize (which resolves references)
const normalized = extractor.normalizeTokens()
```

### Export Format Issues

**Problem**: Shadow values not formatting correctly

**Solution**: Ensure shadow tokens have all required properties:

```typescript
{
  name: 'shadow-default',
  value: {
    x: 0,
    y: 4,
    blur: 10,
    spread: 0,
    color: '#00000040'
  },
  type: 'shadow',
  category: 'shadow'
}
```

### Validation Issues

**Problem**: Too many false positives

**Solution**: Adjust validation configuration:

```typescript
const extractor = new DesignTokenExtractor({
  validation: {
    validateColors: true,
    validateReferences: true,
    detectCircular: true,
    detectConflicts: false, // Disable if you have intentional duplicates
  },
})
```

---

## Additional Resources

- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Figma API Documentation](https://www.figma.com/developers/api)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [Tokens Studio Plugin](https://tokens.studio/)

## Support

For issues and questions:
- GitHub Issues: [ai-kit/issues](https://github.com/AINative-Studio/ai-kit/issues)
- Documentation: [ai-kit/docs](https://github.com/AINative-Studio/ai-kit/tree/main/docs)

---

**Version**: 1.0.0
**Last Updated**: 2024-01-19
**Maintainer**: AINative Studio
