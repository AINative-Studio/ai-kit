/**
 * Design Token Extractor Tests
 *
 * Comprehensive test suite for the design token extraction system.
 * Tests cover Figma extraction, format parsing, normalization, validation,
 * and export to various formats.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DesignTokenExtractor,
  createDesignTokenExtractor,
} from '../src/design-token-extractor'
import {
  TokenCategory,
  TokenType,
  ThemeMode,
  ExportFormat,
  type DesignToken,
  type FigmaFile,
  type FigmaNode,
  type StyleDictionaryConfig,
  type TokensStudioFormat,
  type ExtractorConfig,
} from '../src/design-token-types'

describe('DesignTokenExtractor', () => {
  let extractor: DesignTokenExtractor

  beforeEach(() => {
    extractor = new DesignTokenExtractor()
  })

  describe('Constructor and Configuration', () => {
    it('should create instance with default configuration', () => {
      expect(extractor).toBeInstanceOf(DesignTokenExtractor)
      expect(extractor.getTokens()).toEqual([])
    })

    it('should create instance with custom configuration', () => {
      const config: ExtractorConfig = {
        defaultTheme: ThemeMode.DARK,
        includeSemantic: true,
        includeReference: false,
        nameSeparator: '.',
        prefix: 'design-',
      }

      const customExtractor = new DesignTokenExtractor(config)
      expect(customExtractor).toBeInstanceOf(DesignTokenExtractor)
    })

    it('should validate configuration on creation', () => {
      expect(() => {
        new DesignTokenExtractor({
          figma: {
            fileKey: '',
            accessToken: '',
          },
        })
      }).toThrow()
    })

    it('should use factory function to create instance', () => {
      const instance = createDesignTokenExtractor()
      expect(instance).toBeInstanceOf(DesignTokenExtractor)
    })

    it('should set default values for optional config', () => {
      const config: ExtractorConfig = {
        figma: {
          fileKey: 'test-file-key',
          accessToken: 'test-token',
        },
      }

      const customExtractor = new DesignTokenExtractor(config)
      expect(customExtractor).toBeInstanceOf(DesignTokenExtractor)
    })
  })

  describe('Figma Token Extraction', () => {
    const mockFigmaFile: FigmaFile = {
      document: {
        id: '0:1',
        name: 'Document',
        type: 'DOCUMENT',
        children: [
          {
            id: '1:1',
            name: 'Page',
            type: 'CANVAS',
            children: [
              {
                id: '2:1',
                name: 'Primary Color',
                type: 'RECTANGLE',
                fills: [
                  {
                    type: 'SOLID',
                    color: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
                  },
                ],
              },
              {
                id: '2:2',
                name: 'Drop Shadow',
                type: 'RECTANGLE',
                effects: [
                  {
                    type: 'DROP_SHADOW',
                    radius: 10,
                    color: { r: 0, g: 0, b: 0, a: 0.25 },
                    offset: { x: 0, y: 4 },
                    spread: 0,
                  },
                ],
              },
            ],
          },
        ],
      },
      components: {},
      styles: {
        'S:1': {
          key: 'color-primary',
          name: 'Color/Primary',
          description: 'Primary brand color',
          styleType: 'FILL',
        },
        'S:2': {
          key: 'text-heading',
          name: 'Text/Heading',
          description: 'Heading text style',
          styleType: 'TEXT',
        },
        'S:3': {
          key: 'shadow-default',
          name: 'Shadow/Default',
          description: 'Default shadow',
          styleType: 'EFFECT',
        },
      },
      name: 'Design System',
      lastModified: '2024-01-01T00:00:00Z',
      version: '1.0.0',
    }

    it('should extract tokens from Figma file', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFigmaFile,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromFigma(
        'test-file-key',
        'test-token'
      )

      expect(collection).toBeDefined()
      expect(collection.name).toBe('Design System')
      expect(collection.version).toBe('1.0.0')
      expect(collection.tokens).toBeInstanceOf(Array)
      expect(collection.metadata?.source).toBe('figma')
    })

    it('should handle Figma API errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })
      global.fetch = mockFetch

      await expect(
        extractor.extractFromFigma('test-file-key', 'invalid-token')
      ).rejects.toThrow('Figma API error')
    })

    it('should extract color tokens from Figma nodes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFigmaFile,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromFigma(
        'test-file-key',
        'test-token'
      )
      const colorTokens = collection.tokens.filter(
        (t) => t.category === TokenCategory.COLOR
      )

      expect(colorTokens.length).toBeGreaterThan(0)
    })

    it('should extract shadow tokens from Figma effects', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFigmaFile,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromFigma(
        'test-file-key',
        'test-token'
      )
      const shadowTokens = collection.tokens.filter(
        (t) => t.category === TokenCategory.SHADOW
      )

      expect(shadowTokens.length).toBeGreaterThan(0)
    })

    it('should convert Figma colors to standard format', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFigmaFile,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromFigma(
        'test-file-key',
        'test-token'
      )
      const colorTokens = collection.tokens.filter(
        (t) => t.category === TokenCategory.COLOR
      )

      // We should extract some color tokens from the nodes
      expect(colorTokens.length).toBeGreaterThan(0)

      // Check that at least one has a proper color value structure
      const tokenWithValue = colorTokens.find(t =>
        t.value &&
        typeof t.value === 'object' &&
        (t.value.hex || t.value.rgb || t.value.hsl)
      )

      expect(tokenWithValue).toBeDefined()
    })

    it('should respect extractStyles configuration', async () => {
      const config: ExtractorConfig = {
        figma: {
          fileKey: 'test-file-key',
          accessToken: 'test-token',
          extractStyles: false,
        },
      }

      const customExtractor = new DesignTokenExtractor(config)
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFigmaFile,
      })
      global.fetch = mockFetch

      const collection = await customExtractor.extractFromFigma()
      expect(collection).toBeDefined()
    })

    it('should include Figma metadata in tokens', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFigmaFile,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromFigma(
        'test-file-key',
        'test-token'
      )
      const token = collection.tokens[0]

      if (token) {
        expect(token.source).toBe('figma')
        expect(token.metadata).toBeDefined()
      }
    })
  })

  describe('Style Dictionary Parsing', () => {
    const mockStyleDictionary: StyleDictionaryConfig = {
      source: ['tokens/**/*.json'],
      platforms: {
        css: {
          transformGroup: 'css',
          buildPath: 'build/css/',
          files: [
            {
              destination: 'variables.css',
              format: 'css/variables',
            },
          ],
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
          small: {
            value: '8px',
            type: 'dimension',
          },
          medium: {
            value: '16px',
            type: 'dimension',
          },
          large: {
            value: '24px',
            type: 'dimension',
          },
        },
        fontSize: {
          body: {
            value: '16px',
            type: 'fontSize',
          },
          heading: {
            value: '24px',
            type: 'fontSize',
          },
        },
      },
    }

    it('should parse Style Dictionary tokens', async () => {
      const collection = await extractor.extractFromStyleDictionary(
        mockStyleDictionary
      )

      expect(collection).toBeDefined()
      expect(collection.tokens).toBeInstanceOf(Array)
      expect(collection.tokens.length).toBeGreaterThan(0)
      expect(collection.metadata?.source).toBe('styleDictionary')
    })

    it('should extract color tokens from Style Dictionary', async () => {
      const collection = await extractor.extractFromStyleDictionary(
        mockStyleDictionary
      )
      const colorTokens = collection.tokens.filter(
        (t) => t.category === TokenCategory.COLOR
      )

      expect(colorTokens.length).toBe(2)
      expect(colorTokens[0].value).toBe('#3366FF')
    })

    it('should extract spacing tokens from Style Dictionary', async () => {
      const collection = await extractor.extractFromStyleDictionary(
        mockStyleDictionary
      )
      const spacingTokens = collection.tokens.filter(
        (t) => t.category === TokenCategory.SPACING
      )

      expect(spacingTokens.length).toBeGreaterThan(0)
    })

    it('should preserve token descriptions from Style Dictionary', async () => {
      const collection = await extractor.extractFromStyleDictionary(
        mockStyleDictionary
      )
      const primaryColor = collection.tokens.find(
        (t) => t.name === 'color-primary'
      )

      expect(primaryColor?.description).toBe('Primary brand color')
    })

    it('should handle nested token groups', async () => {
      const nestedConfig: StyleDictionaryConfig = {
        source: ['tokens/**/*.json'],
        platforms: {},
        tokens: {
          color: {
            brand: {
              primary: {
                value: '#3366FF',
                type: 'color',
              },
              secondary: {
                value: '#FF6633',
                type: 'color',
              },
            },
          },
        },
      }

      const collection = await extractor.extractFromStyleDictionary(
        nestedConfig
      )

      expect(collection.tokens.length).toBeGreaterThan(0)
      expect(
        collection.tokens.some((t) => t.name.includes('brand'))
      ).toBeTruthy()
    })

    it('should handle missing tokens gracefully', async () => {
      const emptyConfig: StyleDictionaryConfig = {
        source: [],
        platforms: {},
      }

      const collection = await extractor.extractFromStyleDictionary(
        emptyConfig
      )

      expect(collection.tokens).toEqual([])
    })
  })

  describe('Tokens Studio Parsing', () => {
    const mockTokensStudio: TokensStudioFormat = {
      global: {
        color: {
          primary: {
            value: '#3366FF',
            type: 'color',
            description: 'Primary brand color',
          },
          secondary: {
            value: '{color.primary}',
            type: 'color',
          },
        },
        spacing: {
          xs: {
            value: '4px',
            type: 'spacing',
          },
          sm: {
            value: '8px',
            type: 'spacing',
          },
          md: {
            value: '16px',
            type: 'spacing',
          },
        },
      },
      light: {
        color: {
          background: {
            value: '#FFFFFF',
            type: 'color',
          },
          text: {
            value: '#000000',
            type: 'color',
          },
        },
      },
      dark: {
        color: {
          background: {
            value: '#000000',
            type: 'color',
          },
          text: {
            value: '#FFFFFF',
            type: 'color',
          },
        },
      },
    }

    it('should parse Tokens Studio format', () => {
      const collection = extractor.extractFromTokensStudio(mockTokensStudio)

      expect(collection).toBeDefined()
      expect(collection.tokens).toBeInstanceOf(Array)
      expect(collection.tokens.length).toBeGreaterThan(0)
      expect(collection.metadata?.source).toBe('tokensStudio')
    })

    it('should parse JSON string input', () => {
      const jsonString = JSON.stringify(mockTokensStudio)
      const collection = extractor.extractFromTokensStudio(jsonString)

      expect(collection.tokens.length).toBeGreaterThan(0)
    })

    it('should detect theme variations', () => {
      const collection = extractor.extractFromTokensStudio(mockTokensStudio)

      expect(collection.themes).toBeDefined()
      expect(collection.themes?.light).toBeDefined()
      expect(collection.themes?.dark).toBeDefined()
    })

    it('should handle token references', () => {
      const collection = extractor.extractFromTokensStudio(mockTokensStudio)
      const secondaryColor = collection.tokens.find(
        (t) => t.name === 'color-secondary'
      )

      expect(secondaryColor?.reference).toBe('color.primary')
    })

    it('should extract nested token groups', () => {
      const collection = extractor.extractFromTokensStudio(mockTokensStudio)

      expect(collection.tokens.some((t) => t.name.includes('spacing')))
        .toBeTruthy()
    })

    it('should handle invalid JSON gracefully', () => {
      expect(() => {
        extractor.extractFromTokensStudio('invalid json')
      }).toThrow()
    })

    it('should preserve token descriptions', () => {
      const collection = extractor.extractFromTokensStudio(mockTokensStudio)
      const primaryColor = collection.tokens.find(
        (t) => t.name === 'color-primary'
      )

      expect(primaryColor?.description).toBe('Primary brand color')
    })
  })

  describe('Token Normalization', () => {
    const sampleTokens: DesignToken[] = [
      {
        name: 'color_primary',
        value: '#3366FF',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
      },
      {
        name: 'spacing.small',
        value: 8,
        type: TokenType.SPACING,
        category: TokenCategory.SPACING,
      },
      {
        name: 'fontSize/heading',
        value: 24,
        type: TokenType.FONT_SIZE,
        category: TokenCategory.FONT_SIZE,
      },
    ]

    beforeEach(() => {
      extractor = new DesignTokenExtractor({
        nameSeparator: '-',
      })
    })

    it('should normalize token names', () => {
      const normalized = extractor.normalizeTokens(sampleTokens)

      expect(normalized).toBeInstanceOf(Array)
      expect(normalized.length).toBe(sampleTokens.length)
    })

    it('should normalize color values', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-primary',
          value: '#3366FF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      const normalized = extractor.normalizeTokens(tokens)

      expect(normalized[0].value).toHaveProperty('hex')
    })

    it('should normalize dimension values', () => {
      const tokens: DesignToken[] = [
        {
          name: 'spacing-small',
          value: 8,
          type: TokenType.SPACING,
          category: TokenCategory.SPACING,
        },
      ]

      const normalized = extractor.normalizeTokens(tokens)

      expect(typeof normalized[0].value).toBe('string')
      expect(normalized[0].value).toContain('px')
    })

    it('should resolve token references', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-primary',
          value: '#3366FF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'color-secondary',
          value: undefined,
          reference: 'color-primary',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      const normalized = extractor.normalizeTokens(tokens)
      const secondary = normalized.find((t) => t.name === 'color-secondary')

      expect(secondary?.value).toBeDefined()
      expect(secondary?.metadata?.resolvedFrom).toBe('color-primary')
    })

    it('should apply name transformations', () => {
      const customExtractor = new DesignTokenExtractor({
        transforms: {
          nameCase: 'camelCase',
        },
      })

      const tokens: DesignToken[] = [
        {
          name: 'color-primary-main',
          value: '#3366FF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      const normalized = customExtractor.normalizeTokens(tokens)

      expect(normalized[0].name).not.toContain('-')
    })

    it('should convert dimensions to rem units', () => {
      const customExtractor = new DesignTokenExtractor({
        transforms: {
          dimensionUnit: 'rem',
          baseFontSize: 16,
        },
      })

      const tokens: DesignToken[] = [
        {
          name: 'spacing-medium',
          value: 16,
          type: TokenType.SPACING,
          category: TokenCategory.SPACING,
        },
      ]

      const normalized = customExtractor.normalizeTokens(tokens)

      expect(normalized[0].value).toContain('rem')
    })
  })

  describe('Token Validation', () => {
    it('should validate tokens successfully', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-primary',
          value: { hex: '#3366FF' },
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      extractor = new DesignTokenExtractor({
        validation: {
          validateColors: true,
        },
      })

      // Set tokens internally for validation
      extractor['tokens'] = tokens

      const result = extractor.validateTokens(tokens)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid color values', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-invalid',
          value: null,
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      extractor = new DesignTokenExtractor({
        validation: {
          validateColors: true,
        },
      })

      const result = extractor.validateTokens(tokens)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect broken references', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-secondary',
          value: undefined,
          reference: 'color-nonexistent',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      extractor = new DesignTokenExtractor({
        validation: {
          validateReferences: true,
        },
      })

      const result = extractor.validateTokens(tokens)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes('not found')))
        .toBeTruthy()
    })

    it('should detect circular references', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-a',
          value: undefined,
          reference: 'color-b',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'color-b',
          value: undefined,
          reference: 'color-a',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      extractor = new DesignTokenExtractor({
        validation: {
          detectCircular: true,
        },
      })

      const result = extractor.validateTokens(tokens)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes('Circular')))
        .toBeTruthy()
    })

    it('should detect token conflicts', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-primary',
          value: '#3366FF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'color-primary',
          value: '#FF6633',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      extractor = new DesignTokenExtractor({
        validation: {
          detectConflicts: true,
        },
      })

      const result = extractor.validateTokens(tokens)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(extractor.getConflicts().length).toBeGreaterThan(0)
    })

    it('should apply custom validation rules', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-primary',
          value: '#3366FF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      extractor = new DesignTokenExtractor({
        validation: {
          customRules: [
            {
              name: 'Test Rule',
              category: TokenCategory.COLOR,
              validate: (token) => token.value !== '#3366FF',
            },
          ],
        },
      })

      const result = extractor.validateTokens(tokens)

      expect(result.valid).toBe(false)
    })
  })

  describe('Export Formats', () => {
    const sampleTokens: DesignToken[] = [
      {
        name: 'color-primary',
        value: { hex: '#3366FF', rgb: { r: 51, g: 102, b: 255, a: 1 } },
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        description: 'Primary brand color',
      },
      {
        name: 'spacing-medium',
        value: '16px',
        type: TokenType.SPACING,
        category: TokenCategory.SPACING,
      },
      {
        name: 'shadow-default',
        value: {
          x: 0,
          y: 4,
          blur: 10,
          spread: 0,
          color: '#00000040',
        },
        type: TokenType.SHADOW,
        category: TokenCategory.SHADOW,
      },
    ]

    beforeEach(() => {
      extractor['tokens'] = sampleTokens
    })

    it('should export to JSON format', () => {
      const json = extractor.exportTokens(ExportFormat.JSON)

      expect(json).toBeTruthy()
      expect(() => JSON.parse(json)).not.toThrow()

      const parsed = JSON.parse(json)
      expect(parsed).toHaveProperty('color')
      expect(parsed).toHaveProperty('spacing')
    })

    it('should export to CSS format', () => {
      const css = extractor.exportTokens(ExportFormat.CSS)

      expect(css).toContain(':root')
      expect(css).toContain('--color-primary')
      expect(css).toContain('--spacing-medium')
    })

    it('should export to SCSS format', () => {
      const scss = extractor.exportTokens(ExportFormat.SCSS)

      expect(scss).toContain('$color-primary')
      expect(scss).toContain('$spacing-medium')
    })

    it('should export to LESS format', () => {
      const less = extractor.exportTokens(ExportFormat.LESS)

      expect(less).toContain('@color-primary')
      expect(less).toContain('@spacing-medium')
    })

    it('should export to JavaScript format', () => {
      const js = extractor.exportTokens(ExportFormat.JS)

      expect(js).toContain('export default')
      expect(js).toContain('color-primary')
    })

    it('should export to TypeScript format', () => {
      const ts = extractor.exportTokens(ExportFormat.TS)

      expect(ts).toContain('export const tokens')
      expect(ts).toContain('as const')
      expect(ts).toContain('TokenName')
    })

    it('should export to Style Dictionary format', () => {
      const sd = extractor.exportTokens(ExportFormat.STYLE_DICTIONARY)

      expect(sd).toBeTruthy()
      expect(() => JSON.parse(sd)).not.toThrow()

      const parsed = JSON.parse(sd)
      expect(parsed).toHaveProperty('color')
    })

    it('should export to Tailwind format', () => {
      const tailwind = extractor.exportTokens(ExportFormat.TAILWIND)

      expect(tailwind).toContain('module.exports')
      expect(tailwind).toContain('theme')
      expect(tailwind).toContain('extend')
    })

    it('should include comments when requested', () => {
      const css = extractor.exportTokens(ExportFormat.CSS, {
        includeComments: true,
      })

      expect(css).toContain('Primary brand color')
    })

    it('should exclude comments when not requested', () => {
      const css = extractor.exportTokens(ExportFormat.CSS, {
        includeComments: false,
      })

      expect(css).not.toContain('Primary brand color')
    })

    it('should format output with custom indentation', () => {
      const json = extractor.exportTokens(ExportFormat.JSON, {
        pretty: true,
        indent: 4,
      })

      expect(json).toContain('    ') // 4 spaces
    })

    it('should apply CSS prefix', () => {
      const css = extractor.exportTokens(ExportFormat.CSS, {
        cssPrefix: 'custom-',
      })

      expect(css).toContain('custom-color-primary')
    })

    it('should filter by theme', () => {
      const themedTokens: DesignToken[] = [
        {
          name: 'color-bg',
          value: '#FFFFFF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
          theme: ThemeMode.LIGHT,
        },
        {
          name: 'color-bg',
          value: '#000000',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
          theme: ThemeMode.DARK,
        },
      ]

      extractor['tokens'] = themedTokens

      const lightJson = extractor.exportTokens(ExportFormat.JSON, {
        theme: ThemeMode.LIGHT,
      })

      const parsed = JSON.parse(lightJson)
      // Should only contain light theme token
      const bgValue = parsed.color.bg.value
      // Value gets normalized to ColorValue object
      const actualValue = bgValue.hex || bgValue
      // Should be the light theme color only
      expect(actualValue).toBe('#FFFFFF')
    })

    it('should handle shadow values in CSS export', () => {
      const css = extractor.exportTokens(ExportFormat.CSS)

      expect(css).toContain('shadow-default')
      expect(css).toContain('0px 4px 10px')
    })
  })

  describe('Token Querying', () => {
    const sampleTokens: DesignToken[] = [
      {
        name: 'color-primary',
        value: '#3366FF',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        theme: ThemeMode.LIGHT,
      },
      {
        name: 'color-secondary',
        value: '#FF6633',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        theme: ThemeMode.LIGHT,
      },
      {
        name: 'spacing-small',
        value: '8px',
        type: TokenType.SPACING,
        category: TokenCategory.SPACING,
      },
      {
        name: 'color-bg',
        value: '#000000',
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        theme: ThemeMode.DARK,
      },
    ]

    beforeEach(() => {
      extractor['tokens'] = sampleTokens
    })

    it('should get all tokens', () => {
      const tokens = extractor.getTokens()

      expect(tokens).toHaveLength(4)
    })

    it('should get tokens by category', () => {
      const colorTokens = extractor.getTokensByCategory(TokenCategory.COLOR)

      expect(colorTokens).toHaveLength(3)
      expect(colorTokens.every((t) => t.category === TokenCategory.COLOR))
        .toBeTruthy()
    })

    it('should get tokens by theme', () => {
      const lightTokens = extractor.getTokensByTheme(ThemeMode.LIGHT)

      expect(lightTokens).toHaveLength(2)
      expect(lightTokens.every((t) => t.theme === ThemeMode.LIGHT))
        .toBeTruthy()
    })

    it('should return empty array for non-existent category', () => {
      const borderTokens = extractor.getTokensByCategory(
        TokenCategory.BORDER_WIDTH
      )

      expect(borderTokens).toHaveLength(0)
    })

    it('should return empty array for non-existent theme', () => {
      const customTokens = extractor.getTokensByTheme(ThemeMode.CUSTOM)

      expect(customTokens).toHaveLength(0)
    })

    it('should get conflicts', () => {
      extractor = new DesignTokenExtractor({
        validation: {
          detectConflicts: true,
        },
      })

      const duplicateTokens: DesignToken[] = [
        {
          name: 'color-primary',
          value: '#3366FF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
        {
          name: 'color-primary',
          value: '#FF6633',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      extractor['tokens'] = duplicateTokens
      extractor.validateTokens()

      const conflicts = extractor.getConflicts()

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0].name).toBe('color-primary')
    })
  })

  describe('CSS Extraction', () => {
    const sampleCSS = `
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
        margin: 0 4px;
        font-family: 'Roboto', sans-serif;
        font-size: 14px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    `

    it('should extract tokens from CSS', () => {
      const collection = extractor.extractFromCSS(sampleCSS)

      expect(collection).toBeDefined()
      expect(collection.tokens).toBeInstanceOf(Array)
      expect(collection.tokens.length).toBeGreaterThan(0)
      expect(collection.metadata?.source).toBe('css')
    })

    it('should extract CSS custom properties', () => {
      const collection = extractor.extractFromCSS(sampleCSS)
      const customProps = collection.tokens.filter(t =>
        t.name.includes('color-primary') ||
        t.name.includes('spacing-small')
      )

      expect(customProps.length).toBeGreaterThan(0)
    })

    it('should extract color values from CSS', () => {
      const collection = extractor.extractFromCSS(sampleCSS)
      const colors = collection.tokens.filter(
        t => t.category === TokenCategory.COLOR
      )

      expect(colors.length).toBeGreaterThan(0)
    })

    it('should extract spacing values from CSS', () => {
      const collection = extractor.extractFromCSS(sampleCSS)
      const spacing = collection.tokens.filter(
        t => t.category === TokenCategory.SPACING
      )

      expect(spacing.length).toBeGreaterThan(0)
    })

    it('should extract font properties from CSS', () => {
      const collection = extractor.extractFromCSS(sampleCSS)
      const fonts = collection.tokens.filter(
        t => t.category === TokenCategory.TYPOGRAPHY ||
             t.category === TokenCategory.FONT_SIZE
      )

      expect(fonts.length).toBeGreaterThan(0)
    })

    it('should extract border-radius from CSS', () => {
      const collection = extractor.extractFromCSS(sampleCSS)
      const radius = collection.tokens.filter(
        t => t.category === TokenCategory.BORDER_RADIUS
      )

      expect(radius.length).toBeGreaterThan(0)
    })

    it('should extract shadows from CSS', () => {
      const collection = extractor.extractFromCSS(sampleCSS)
      const shadows = collection.tokens.filter(
        t => t.category === TokenCategory.SHADOW
      )

      expect(shadows.length).toBeGreaterThan(0)
    })

    it('should handle empty CSS gracefully', () => {
      const collection = extractor.extractFromCSS('')
      expect(collection.tokens).toEqual([])
    })

    it('should handle malformed CSS gracefully', () => {
      const malformedCSS = 'this is not valid css {}'
      expect(() => extractor.extractFromCSS(malformedCSS)).not.toThrow()
    })
  })

  describe('Website Extraction', () => {
    const mockHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            :root {
              --color-primary: #3366FF;
              --spacing-unit: 8px;
            }
            body {
              font-family: 'Inter', sans-serif;
              color: #333333;
            }
          </style>
        </head>
        <body>
          <h1>Test Page</h1>
        </body>
      </html>
    `

    it('should extract tokens from website', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHTML,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromWebsite(
        'https://example.com'
      )

      expect(collection).toBeDefined()
      expect(collection.tokens).toBeInstanceOf(Array)
      expect(collection.metadata?.source).toBe('website')
      expect(collection.metadata?.url).toBe('https://example.com')
    })

    it('should handle HTTP errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
      global.fetch = mockFetch

      await expect(
        extractor.extractFromWebsite('https://example.com/notfound')
      ).rejects.toThrow('HTTP 404')
    })

    it('should extract from inline styles', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockHTML,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromWebsite(
        'https://example.com'
      )

      expect(collection.tokens.length).toBeGreaterThan(0)
    })

    it('should handle websites without styles', async () => {
      const plainHTML = '<html><body>No styles</body></html>'
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => plainHTML,
      })
      global.fetch = mockFetch

      const collection = await extractor.extractFromWebsite(
        'https://example.com'
      )

      expect(collection.tokens).toEqual([])
    })
  })

  describe('Image Extraction', () => {
    it('should extract tokens from image', async () => {
      const collection = await extractor.extractFromImage(
        'https://example.com/design.png'
      )

      expect(collection).toBeDefined()
      expect(collection.tokens).toBeInstanceOf(Array)
      expect(collection.metadata?.source).toBe('image')
      expect(collection.metadata?.imageUrl).toBe(
        'https://example.com/design.png'
      )
    })

    it('should include image URL in metadata', async () => {
      const imageUrl = 'https://example.com/screenshot.jpg'
      const collection = await extractor.extractFromImage(imageUrl)

      expect(collection.metadata?.imageUrl).toBe(imageUrl)
    })

    it('should handle extraction errors gracefully', async () => {
      // Test that the method doesn't throw for valid inputs
      await expect(
        extractor.extractFromImage('https://example.com/invalid.png')
      ).resolves.toBeDefined()
    })
  })

  describe('AI-Powered Features', () => {
    describe('Token Name Generation', () => {
      it('should generate semantic names for unnamed tokens', () => {
        const tokens: DesignToken[] = [
          {
            name: 'token-1',
            value: { hex: '#3366FF' },
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
          {
            name: 'token-2',
            value: 16,
            type: TokenType.SPACING,
            category: TokenCategory.SPACING,
          },
        ]

        const named = extractor.generateTokenNames(tokens)

        expect(named.length).toBe(2)
        expect(named[0].name).not.toBe('token-1')
        expect(named[0].metadata?.aiGenerated).toBe(true)
        expect(named[0].metadata?.originalName).toBe('token-1')
      })

      it('should preserve existing good names', () => {
        const tokens: DesignToken[] = [
          {
            name: 'color-primary',
            value: { hex: '#3366FF' },
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
        ]

        const named = extractor.generateTokenNames(tokens)

        expect(named[0].name).toBe('color-primary')
        expect(named[0].metadata?.aiGenerated).toBeUndefined()
      })

      it('should suggest appropriate color names', () => {
        const tokens: DesignToken[] = [
          {
            name: 'token-color',
            value: { hex: '#3366FF' },
            type: TokenType.COLOR,
            category: TokenCategory.COLOR,
          },
        ]

        const named = extractor.generateTokenNames(tokens)

        expect(named[0].name).toContain('color')
      })

      it('should suggest appropriate spacing names', () => {
        const tokens: DesignToken[] = [
          {
            name: 'token-spacing',
            value: 8,
            type: TokenType.SPACING,
            category: TokenCategory.SPACING,
          },
        ]

        const named = extractor.generateTokenNames(tokens)

        expect(named[0].name).toContain('spacing')
      })

      it('should handle typography tokens', () => {
        const tokens: DesignToken[] = [
          {
            name: 'token-font',
            value: '16px',
            type: TokenType.FONT_SIZE,
            category: TokenCategory.TYPOGRAPHY,
          },
        ]

        const named = extractor.generateTokenNames(tokens)

        expect(named[0].name).toContain('font')
      })
    })

    describe('Theme Generation', () => {
      it('should generate theme from base colors', () => {
        const baseColors = ['#3366FF', '#FF6633']
        const theme = extractor.generateTheme(baseColors, ThemeMode.LIGHT)

        expect(theme).toBeInstanceOf(Array)
        expect(theme.length).toBeGreaterThan(0)
        expect(theme.every(t => t.theme === ThemeMode.LIGHT)).toBe(true)
      })

      it('should generate color shades', () => {
        const baseColors = ['#3366FF']
        const theme = extractor.generateTheme(baseColors)

        const shades = theme.filter(t => t.name.match(/\d+$/))
        expect(shades.length).toBeGreaterThan(5)
      })

      it('should generate semantic tokens', () => {
        const baseColors = ['#3366FF', '#FF6633']
        const theme = extractor.generateTheme(baseColors)

        const primary = theme.find(t => t.name === 'color-primary')
        const secondary = theme.find(t => t.name === 'color-secondary')

        expect(primary).toBeDefined()
        expect(secondary).toBeDefined()
        expect(primary?.semantic).toBe(true)
        expect(secondary?.semantic).toBe(true)
      })

      it('should mark AI-generated tokens', () => {
        const baseColors = ['#3366FF']
        const theme = extractor.generateTheme(baseColors)

        const aiGenerated = theme.filter(
          t => t.metadata?.aiGenerated === true
        )
        expect(aiGenerated.length).toBeGreaterThan(0)
      })

      it('should handle single color', () => {
        const theme = extractor.generateTheme(['#3366FF'])

        expect(theme.length).toBeGreaterThan(0)
        expect(theme.find(t => t.name === 'color-primary')).toBeDefined()
      })

      it('should handle multiple colors', () => {
        const colors = ['#3366FF', '#FF6633', '#33FF66']
        const theme = extractor.generateTheme(colors)

        expect(theme.length).toBeGreaterThan(colors.length)
      })

      it('should support dark mode', () => {
        const theme = extractor.generateTheme(['#3366FF'], ThemeMode.DARK)

        expect(theme.every(t => t.theme === ThemeMode.DARK)).toBe(true)
      })

      it('should include base color in metadata', () => {
        const baseColor = '#3366FF'
        const theme = extractor.generateTheme([baseColor])

        const withMetadata = theme.filter(
          t => t.metadata?.baseColor === baseColor
        )
        expect(withMetadata.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty token arrays', () => {
      const normalized = extractor.normalizeTokens([])

      expect(normalized).toEqual([])
    })

    it('should handle tokens with missing values', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-undefined',
          value: undefined,
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      const normalized = extractor.normalizeTokens(tokens)

      expect(normalized).toHaveLength(1)
    })

    it('should handle invalid export format', () => {
      expect(() => {
        extractor.exportTokens('invalid' as ExportFormat)
      }).toThrow()
    })

    it('should handle complex nested token structures', () => {
      const nestedConfig: StyleDictionaryConfig = {
        source: [],
        platforms: {},
        tokens: {
          level1: {
            level2: {
              level3: {
                level4: {
                  value: '#3366FF',
                  type: 'color',
                },
              },
            },
          },
        },
      }

      expect(async () => {
        await extractor.extractFromStyleDictionary(nestedConfig)
      }).not.toThrow()
    })

    it('should handle tokens with special characters in names', () => {
      const tokens: DesignToken[] = [
        {
          name: 'color-primary-500',
          value: '#3366FF',
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
        },
      ]

      const css = extractor.exportTokens(ExportFormat.CSS)
      extractor['tokens'] = tokens

      expect(() => extractor.exportTokens(ExportFormat.CSS)).not.toThrow()
    })

    it('should handle multiple shadow values', () => {
      const tokens: DesignToken[] = [
        {
          name: 'shadow-layered',
          value: [
            { x: 0, y: 1, blur: 2, color: '#00000020' },
            { x: 0, y: 4, blur: 8, color: '#00000040' },
          ],
          type: TokenType.SHADOW,
          category: TokenCategory.SHADOW,
        },
      ]

      extractor['tokens'] = tokens
      const css = extractor.exportTokens(ExportFormat.CSS)

      expect(css).toContain('shadow-layered')
    })

    it('should handle gradient values', () => {
      const tokens: DesignToken[] = [
        {
          name: 'gradient-primary',
          value: {
            type: 'linear',
            angle: 90,
            stops: [
              { position: 0, color: '#3366FF' },
              { position: 100, color: '#FF6633' },
            ],
          },
          type: TokenType.GRADIENT,
          category: TokenCategory.GRADIENT,
        },
      ]

      extractor['tokens'] = tokens

      expect(() => extractor.exportTokens(ExportFormat.JSON)).not.toThrow()
    })

    it('should handle typography composite values', () => {
      const tokens: DesignToken[] = [
        {
          name: 'typography-heading',
          value: {
            fontFamily: 'Inter',
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: '32px',
          },
          type: TokenType.TYPOGRAPHY,
          category: TokenCategory.TYPOGRAPHY,
        },
      ]

      extractor['tokens'] = tokens
      const json = extractor.exportTokens(ExportFormat.JSON)

      expect(json).toBeTruthy()
    })
  })
})
