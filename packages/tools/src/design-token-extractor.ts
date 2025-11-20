/**
 * Design Token Extractor
 *
 * Extract design tokens from various sources (Figma, Style Dictionary, Tokens Studio)
 * and convert them to a standardized format for use in design systems.
 *
 * Features:
 * - Figma API integration
 * - Style Dictionary parsing
 * - Tokens Studio format support
 * - Token normalization and transformation
 * - Multiple export formats (CSS, SCSS, JS, JSON, etc.)
 * - Theme support (light, dark, custom)
 * - Validation and conflict detection
 */

import type {
  DesignToken,
  TokenCollection,
  ExtractorConfig,
  FigmaConfig,
  FigmaFile,
  FigmaNode,
  FigmaStyle,
  FigmaColor,
  FigmaPaint,
  FigmaEffect,
  StyleDictionaryConfig,
  StyleDictionaryToken,
  TokensStudioFormat,
  TokensStudioToken,
  ExportOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  TokenConflict,
  ColorValue,
  ShadowValue,
} from './design-token-types'

import {
  TokenCategory,
  TokenType,
  ThemeMode,
  ExportFormat,
  ExtractorConfigSchema,
  FigmaConfigSchema,
  ExportOptionsSchema,
} from './design-token-types'

/**
 * Design Token Extractor Class
 */
export class DesignTokenExtractor {
  private config: ExtractorConfig
  private tokens: DesignToken[] = []
  private conflicts: TokenConflict[] = []

  constructor(config: ExtractorConfig = {}) {
    // Validate configuration
    const validated = ExtractorConfigSchema.parse(config)
    this.config = {
      defaultTheme: ThemeMode.LIGHT,
      includeSemantic: true,
      includeReference: true,
      nameSeparator: '-',
      prefix: '',
      ...validated,
    } as ExtractorConfig
  }

  /**
   * Extract tokens from image using AI vision analysis
   */
  async extractFromImage(imageUrl: string): Promise<TokenCollection> {
    try {
      const tokens: DesignToken[] = []

      // In a real implementation, this would use AI vision models
      // to analyze the image and extract design tokens
      // For now, we'll create a placeholder implementation

      // Simulate AI analysis delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Add metadata about the extraction
      return {
        name: 'Image Tokens',
        tokens,
        metadata: {
          source: 'image',
          imageUrl,
          extractedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      throw new Error(
        `Failed to extract tokens from image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Extract tokens from website DOM
   */
  async extractFromWebsite(url: string): Promise<TokenCollection> {
    try {
      const tokens: DesignToken[] = []

      // Fetch the website
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()

      // Extract tokens from computed styles
      // In a real implementation, this would use a headless browser
      // to compute actual styles and extract design tokens

      // For now, extract basic tokens from inline styles and CSS
      const styleMatches = html.match(
        /<style[^>]*>([\s\S]*?)<\/style>/gi
      )
      if (styleMatches) {
        for (const styleTag of styleMatches) {
          const css = styleTag.replace(/<\/?style[^>]*>/gi, '')
          const cssTokens = this.extractTokensFromCSS(css)
          tokens.push(...cssTokens)
        }
      }

      // Store extracted tokens
      this.tokens = tokens

      return {
        name: 'Website Tokens',
        tokens,
        metadata: {
          source: 'website',
          url,
          extractedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      throw new Error(
        `Failed to extract tokens from website: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Extract tokens from CSS string
   */
  extractFromCSS(css: string): TokenCollection {
    try {
      const tokens = this.extractTokensFromCSS(css)

      // Store extracted tokens
      this.tokens = tokens

      return {
        name: 'CSS Tokens',
        tokens,
        metadata: {
          source: 'css',
          extractedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      throw new Error(
        `Failed to extract tokens from CSS: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Generate AI-powered token naming suggestions
   */
  generateTokenNames(tokens: DesignToken[]): DesignToken[] {
    // In a real implementation, this would use an LLM to generate
    // semantic, meaningful names based on token values and context
    return tokens.map((token) => {
      if (!token.name || token.name.startsWith('token-')) {
        // Generate a better name based on the token type and value
        const suggestedName = this.suggestTokenName(token)
        return {
          ...token,
          name: suggestedName,
          metadata: {
            ...token.metadata,
            originalName: token.name,
            aiGenerated: true,
          },
        }
      }
      return token
    })
  }

  /**
   * AI-powered theme generation
   */
  generateTheme(
    baseColors: string[],
    mode: ThemeMode = ThemeMode.LIGHT
  ): DesignToken[] {
    const tokens: DesignToken[] = []

    // Generate color palette from base colors
    for (let i = 0; i < baseColors.length; i++) {
      const baseColor = baseColors[i]
      const colorName = `color-${i + 1}`

      // Generate color variations (lighter/darker shades)
      const shades = this.generateColorShades(baseColor, mode)

      for (const [shade, value] of Object.entries(shades)) {
        tokens.push({
          name: `${colorName}-${shade}`,
          value,
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
          theme: mode,
          metadata: {
            aiGenerated: true,
            baseColor,
          },
        })
      }
    }

    // Generate semantic color tokens
    if (baseColors.length > 0) {
      tokens.push({
        name: 'color-primary',
        value: baseColors[0],
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        theme: mode,
        semantic: true,
      })
    }

    if (baseColors.length > 1) {
      tokens.push({
        name: 'color-secondary',
        value: baseColors[1],
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        theme: mode,
        semantic: true,
      })
    }

    return tokens
  }

  /**
   * Extract design tokens from Figma
   */
  async extractFromFigma(
    fileKey?: string,
    accessToken?: string
  ): Promise<TokenCollection> {
    const figmaConfig: FigmaConfig = {
      fileKey: fileKey || this.config.figma?.fileKey || '',
      accessToken: accessToken || this.config.figma?.accessToken || '',
      ...this.config.figma,
    }

    // Validate Figma configuration
    FigmaConfigSchema.parse(figmaConfig)

    try {
      // Fetch Figma file
      const file = await this.fetchFigmaFile(figmaConfig)

      // Extract tokens from file
      const tokens: DesignToken[] = []

      // Extract color tokens from styles
      if (figmaConfig.extractStyles !== false && file.styles) {
        const colorTokens = await this.extractFigmaColorStyles(
          file,
          figmaConfig
        )
        tokens.push(...colorTokens)

        const textTokens = await this.extractFigmaTextStyles(file, figmaConfig)
        tokens.push(...textTokens)

        const effectTokens = await this.extractFigmaEffectStyles(
          file,
          figmaConfig
        )
        tokens.push(...effectTokens)
      }

      // Extract tokens from document nodes
      const nodeTokens = this.extractFigmaNodeTokens(file.document)
      tokens.push(...nodeTokens)

      // Store extracted tokens
      this.tokens = tokens

      return {
        name: file.name,
        version: file.version,
        tokens,
        metadata: {
          source: 'figma',
          fileKey: figmaConfig.fileKey,
          extractedAt: new Date().toISOString(),
          lastModified: file.lastModified,
        },
      }
    } catch (error) {
      throw new Error(
        `Failed to extract tokens from Figma: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Extract tokens from Style Dictionary configuration
   */
  async extractFromStyleDictionary(
    config: StyleDictionaryConfig | string
  ): Promise<TokenCollection> {
    try {
      let sdConfig: StyleDictionaryConfig

      // Load configuration if string path provided
      if (typeof config === 'string') {
        // In a real implementation, this would load from file
        throw new Error('File loading not implemented in this example')
      } else {
        sdConfig = config
      }

      const tokens: DesignToken[] = []

      // Parse tokens from Style Dictionary format
      if (sdConfig.tokens) {
        const parsedTokens = this.parseStyleDictionaryTokens(
          sdConfig.tokens,
          []
        )
        tokens.push(...parsedTokens)
      }

      // Store extracted tokens
      this.tokens = tokens

      return {
        name: 'Style Dictionary Tokens',
        tokens,
        metadata: {
          source: 'styleDictionary',
          extractedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      throw new Error(
        `Failed to extract tokens from Style Dictionary: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Extract tokens from Tokens Studio format
   */
  extractFromTokensStudio(json: TokensStudioFormat | string): TokenCollection {
    try {
      let tokensData: TokensStudioFormat

      // Parse JSON if string provided
      if (typeof json === 'string') {
        tokensData = JSON.parse(json)
      } else {
        tokensData = json
      }

      const tokens: DesignToken[] = []
      const themes: Record<string, DesignToken[]> = {}

      // Parse each token set
      for (const [setName, tokenSet] of Object.entries(tokensData)) {
        const setTokens = this.parseTokensStudioSet(tokenSet, setName, [])
        tokens.push(...setTokens)

        // Group by theme if theme name detected
        const theme = this.detectThemeMode(setName)
        if (theme) {
          themes[theme] = setTokens
        }
      }

      // Store extracted tokens
      this.tokens = tokens

      return {
        name: 'Tokens Studio Tokens',
        tokens,
        themes: themes as Record<ThemeMode, DesignToken[]>,
        metadata: {
          source: 'tokensStudio',
          extractedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      throw new Error(
        `Failed to extract tokens from Tokens Studio: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Normalize tokens to standardized format
   */
  normalizeTokens(tokens?: DesignToken[]): DesignToken[] {
    const tokensToNormalize = tokens || this.tokens

    return tokensToNormalize.map((token) => {
      const normalized: DesignToken = { ...token }

      // Normalize name
      normalized.name = this.normalizeTokenName(token.name)

      // Normalize value based on type
      normalized.value = this.normalizeTokenValue(token.value, token.type)

      // Resolve references
      if (token.reference) {
        const referencedToken = tokensToNormalize.find(
          (t) => t.name === token.reference
        )
        if (referencedToken) {
          normalized.value = referencedToken.value
          normalized.metadata = {
            ...normalized.metadata,
            resolvedFrom: token.reference,
          }
        }
      }

      // Apply transforms
      if (this.config.transforms) {
        normalized.value = this.applyTransforms(
          normalized.value,
          normalized.type
        )
      }

      return normalized
    })
  }

  /**
   * Export tokens to specified format
   */
  exportTokens(
    format: ExportFormat,
    options: Partial<ExportOptions> = {}
  ): string {
    const exportOptions: ExportOptions = {
      format,
      includeComments: true,
      pretty: true,
      indent: 2,
      ...options,
    }

    // Validate options
    ExportOptionsSchema.parse(exportOptions)

    // Get tokens to export (filter by theme if specified)
    let tokensToExport = this.tokens
    if (
      exportOptions.theme &&
      exportOptions.theme !== 'all'
    ) {
      tokensToExport = this.tokens.filter(
        (t) => t.theme === exportOptions.theme
      )
    }

    // Normalize tokens before export
    const normalizedTokens = this.normalizeTokens(tokensToExport)

    // Export based on format
    switch (format) {
      case ExportFormat.JSON:
        return this.exportToJSON(normalizedTokens, exportOptions)
      case ExportFormat.CSS:
        return this.exportToCSS(normalizedTokens, exportOptions)
      case ExportFormat.SCSS:
        return this.exportToSCSS(normalizedTokens, exportOptions)
      case ExportFormat.LESS:
        return this.exportToLESS(normalizedTokens, exportOptions)
      case ExportFormat.JS:
        return this.exportToJS(normalizedTokens, exportOptions)
      case ExportFormat.TS:
        return this.exportToTS(normalizedTokens, exportOptions)
      case ExportFormat.STYLE_DICTIONARY:
        return this.exportToStyleDictionary(normalizedTokens, exportOptions)
      case ExportFormat.TAILWIND:
        return this.exportToTailwind(normalizedTokens, exportOptions)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Validate tokens
   */
  validateTokens(tokens?: DesignToken[]): ValidationResult {
    const tokensToValidate = tokens || this.tokens
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    for (const token of tokensToValidate) {
      // Validate color values
      if (
        this.config.validation?.validateColors &&
        token.category === TokenCategory.COLOR
      ) {
        const colorError = this.validateColorValue(token)
        if (colorError) {
          errors.push(colorError)
        }
      }

      // Validate references
      if (
        this.config.validation?.validateReferences &&
        token.reference
      ) {
        const refError = this.validateReference(token, tokensToValidate)
        if (refError) {
          errors.push(refError)
        }
      }

      // Custom validation rules
      if (this.config.validation?.customRules) {
        for (const rule of this.config.validation.customRules) {
          if (!rule.category || rule.category === token.category) {
            const result = rule.validate(token)
            if (result !== true) {
              errors.push({
                token: token.name,
                message: typeof result === 'string' ? result : rule.name,
                severity: 'error',
              })
            }
          }
        }
      }
    }

    // Detect circular references
    if (this.config.validation?.detectCircular) {
      const circularErrors = this.detectCircularReferences(tokensToValidate)
      errors.push(...circularErrors)
    }

    // Detect conflicts
    if (this.config.validation?.detectConflicts) {
      const conflicts = this.detectConflicts(tokensToValidate)
      this.conflicts = conflicts
      for (const conflict of conflicts) {
        warnings.push({
          token: conflict.name,
          message: conflict.reason,
          suggestion: 'Consider renaming or removing duplicate tokens',
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get extracted tokens
   */
  getTokens(): DesignToken[] {
    return this.tokens
  }

  /**
   * Get tokens by category
   */
  getTokensByCategory(category: TokenCategory): DesignToken[] {
    return this.tokens.filter((t) => t.category === category)
  }

  /**
   * Get tokens by theme
   */
  getTokensByTheme(theme: ThemeMode): DesignToken[] {
    return this.tokens.filter((t) => t.theme === theme)
  }

  /**
   * Get conflicts
   */
  getConflicts(): TokenConflict[] {
    return this.conflicts
  }

  // ========== Private Helper Methods ==========

  /**
   * Fetch Figma file via API
   */
  private async fetchFigmaFile(config: FigmaConfig): Promise<FigmaFile> {
    const url = `https://api.figma.com/v1/files/${config.fileKey}`

    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': config.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(
        `Figma API error: ${response.status} ${response.statusText}`
      )
    }

    return await response.json()
  }

  /**
   * Extract color tokens from Figma styles
   */
  private async extractFigmaColorStyles(
    file: FigmaFile,
    config: FigmaConfig
  ): Promise<DesignToken[]> {
    const tokens: DesignToken[] = []

    for (const [, style] of Object.entries(file.styles || {})) {
      if (style.styleType === 'FILL') {
        // Fetch style details
        const styleUrl = `https://api.figma.com/v1/styles/${style.key}`
        const styleResponse = await fetch(styleUrl, {
          headers: {
            'X-Figma-Token': config.accessToken,
          },
        })

        if (styleResponse.ok) {
          const styleData = await styleResponse.json()
          // Extract color from style data
          const colorToken = this.createColorTokenFromFigmaStyle(
            style,
            styleData
          )
          if (colorToken) {
            tokens.push(colorToken)
          }
        }
      }
    }

    return tokens
  }

  /**
   * Extract text tokens from Figma styles
   */
  private async extractFigmaTextStyles(
    file: FigmaFile,
    _config: FigmaConfig
  ): Promise<DesignToken[]> {
    const tokens: DesignToken[] = []

    for (const [styleId, style] of Object.entries(file.styles || {})) {
      if (style.styleType === 'TEXT') {
        const token: DesignToken = {
          name: this.figmaStyleNameToTokenName(style.name),
          value: {},
          type: TokenType.TYPOGRAPHY,
          category: TokenCategory.TYPOGRAPHY,
          description: style.description,
          source: 'figma',
          metadata: {
            figmaStyleKey: style.key,
            figmaStyleId: styleId,
          },
        }
        tokens.push(token)
      }
    }

    return tokens
  }

  /**
   * Extract effect tokens from Figma styles
   */
  private async extractFigmaEffectStyles(
    file: FigmaFile,
    _config: FigmaConfig
  ): Promise<DesignToken[]> {
    const tokens: DesignToken[] = []

    for (const [styleId, style] of Object.entries(file.styles || {})) {
      if (style.styleType === 'EFFECT') {
        const token: DesignToken = {
          name: this.figmaStyleNameToTokenName(style.name),
          value: {},
          type: TokenType.SHADOW,
          category: TokenCategory.SHADOW,
          description: style.description,
          source: 'figma',
          metadata: {
            figmaStyleKey: style.key,
            figmaStyleId: styleId,
          },
        }
        tokens.push(token)
      }
    }

    return tokens
  }

  /**
   * Extract tokens from Figma document nodes
   */
  private extractFigmaNodeTokens(node: FigmaNode): DesignToken[] {
    const tokens: DesignToken[] = []

    // Extract from current node
    if (node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.color) {
          const token = this.createColorTokenFromFigmaPaint(fill, node.name)
          if (token) tokens.push(token)
        }
      }
    }

    if (node.effects && Array.isArray(node.effects)) {
      for (const effect of node.effects) {
        const token = this.createShadowTokenFromFigmaEffect(effect, node.name)
        if (token) tokens.push(token)
      }
    }

    // Recursively extract from children
    if (node.children) {
      for (const child of node.children) {
        tokens.push(...this.extractFigmaNodeTokens(child))
      }
    }

    return tokens
  }

  /**
   * Create color token from Figma style
   */
  private createColorTokenFromFigmaStyle(
    style: FigmaStyle,
    _styleData: any
  ): DesignToken | null {
    // This would be populated from actual style data
    return {
      name: this.figmaStyleNameToTokenName(style.name),
      value: {},
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      description: style.description,
      source: 'figma',
      metadata: {
        figmaStyleKey: style.key,
      },
    }
  }

  /**
   * Create color token from Figma paint
   */
  private createColorTokenFromFigmaPaint(
    paint: FigmaPaint,
    name: string
  ): DesignToken | null {
    if (paint.type !== 'SOLID' || !paint.color) return null

    const colorValue = this.figmaColorToColorValue(paint.color)

    return {
      name: this.figmaStyleNameToTokenName(name),
      value: colorValue,
      type: TokenType.COLOR,
      category: TokenCategory.COLOR,
      source: 'figma',
    }
  }

  /**
   * Create shadow token from Figma effect
   */
  private createShadowTokenFromFigmaEffect(
    effect: FigmaEffect,
    name: string
  ): DesignToken | null {
    if (
      effect.type !== 'DROP_SHADOW' &&
      effect.type !== 'INNER_SHADOW'
    ) {
      return null
    }

    const shadowValue: ShadowValue = {
      x: effect.offset?.x || 0,
      y: effect.offset?.y || 0,
      blur: effect.radius,
      spread: effect.spread || 0,
      color: effect.color
        ? this.figmaColorToColorValue(effect.color).hex || '#000000'
        : '#000000',
      inset: effect.type === 'INNER_SHADOW',
    }

    return {
      name: this.figmaStyleNameToTokenName(name),
      value: shadowValue,
      type: TokenType.SHADOW,
      category: TokenCategory.SHADOW,
      source: 'figma',
    }
  }

  /**
   * Convert Figma color to ColorValue
   */
  private figmaColorToColorValue(color: FigmaColor): ColorValue {
    const r = Math.round(color.r * 255)
    const g = Math.round(color.g * 255)
    const b = Math.round(color.b * 255)
    const a = color.a

    const hex = `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

    return {
      hex,
      rgb: { r, g, b, a },
      rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
    }
  }

  /**
   * Convert Figma style name to token name
   */
  private figmaStyleNameToTokenName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, this.config.nameSeparator || '-')
      .replace(/\//g, this.config.nameSeparator || '-')
  }

  /**
   * Parse Style Dictionary tokens recursively
   */
  private parseStyleDictionaryTokens(
    obj: any,
    path: string[]
  ): DesignToken[] {
    const tokens: DesignToken[] = []

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key]

      if (this.isStyleDictionaryToken(value)) {
        // This is a token
        const token = this.createTokenFromStyleDictionary(
          value as StyleDictionaryToken,
          currentPath
        )
        if (token) tokens.push(token)
      } else if (typeof value === 'object' && value !== null) {
        // This is a group, recurse
        tokens.push(...this.parseStyleDictionaryTokens(value, currentPath))
      }
    }

    return tokens
  }

  /**
   * Check if object is a Style Dictionary token
   */
  private isStyleDictionaryToken(obj: any): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'value' in obj
    )
  }

  /**
   * Create token from Style Dictionary format
   */
  private createTokenFromStyleDictionary(
    sdToken: StyleDictionaryToken,
    path: string[]
  ): DesignToken | null {
    const name = path.join(this.config.nameSeparator || '-')
    const { type, category } = this.inferTokenType(sdToken.value, sdToken.type)

    return {
      name: this.config.prefix ? `${this.config.prefix}${name}` : name,
      value: sdToken.value,
      type,
      category,
      description: sdToken.comment,
      source: 'styleDictionary',
      metadata: sdToken.metadata,
    }
  }

  /**
   * Parse Tokens Studio set recursively
   */
  private parseTokensStudioSet(
    obj: any,
    setName: string,
    path: string[]
  ): DesignToken[] {
    const tokens: DesignToken[] = []

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key]

      if (this.isTokensStudioToken(value)) {
        // This is a token
        const token = this.createTokenFromTokensStudio(
          value as TokensStudioToken,
          currentPath,
          setName
        )
        if (token) tokens.push(token)
      } else if (typeof value === 'object' && value !== null) {
        // This is a group, recurse
        tokens.push(
          ...this.parseTokensStudioSet(value, setName, currentPath)
        )
      }
    }

    return tokens
  }

  /**
   * Check if object is a Tokens Studio token
   */
  private isTokensStudioToken(obj: any): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'value' in obj &&
      'type' in obj
    )
  }

  /**
   * Create token from Tokens Studio format
   */
  private createTokenFromTokensStudio(
    tsToken: TokensStudioToken,
    path: string[],
    setName: string
  ): DesignToken | null {
    const name = path.join(this.config.nameSeparator || '-')
    const { type, category } = this.inferTokenType(
      tsToken.value,
      tsToken.type
    )

    // Check if value is a reference
    let reference: string | undefined
    if (
      typeof tsToken.value === 'string' &&
      tsToken.value.startsWith('{') &&
      tsToken.value.endsWith('}')
    ) {
      reference = tsToken.value.slice(1, -1)
    }

    return {
      name: this.config.prefix ? `${this.config.prefix}${name}` : name,
      value: reference ? undefined : tsToken.value,
      reference,
      type,
      category,
      description: tsToken.description,
      source: 'tokensStudio',
      theme: this.detectThemeMode(setName),
      extensions: tsToken.extensions || tsToken.$extensions,
    }
  }

  /**
   * Infer token type and category from value
   */
  private inferTokenType(
    _value: any,
    typeHint?: string
  ): { type: TokenType; category: TokenCategory } {
    // Use type hint if provided
    if (typeHint) {
      const normalized = typeHint.toLowerCase()
      if (normalized === 'color') {
        return { type: TokenType.COLOR, category: TokenCategory.COLOR }
      }
      if (normalized.includes('font')) {
        return {
          type: TokenType.FONT_FAMILY,
          category: TokenCategory.TYPOGRAPHY,
        }
      }
      if (normalized.includes('spacing')) {
        return { type: TokenType.SPACING, category: TokenCategory.SPACING }
      }
      if (normalized.includes('shadow')) {
        return { type: TokenType.SHADOW, category: TokenCategory.SHADOW }
      }
    }

    // Infer from value
    if (typeof _value === 'string') {
      if (_value.startsWith('#') || _value.startsWith('rgb')) {
        return { type: TokenType.COLOR, category: TokenCategory.COLOR }
      }
      if (_value.match(/^\d+px$|^\d+rem$/)) {
        return { type: TokenType.DIMENSION, category: TokenCategory.SPACING }
      }
    }

    // Default
    return { type: TokenType.DIMENSION, category: TokenCategory.SPACING }
  }

  /**
   * Detect theme mode from name
   */
  private detectThemeMode(name: string): ThemeMode | undefined {
    const lower = name.toLowerCase()
    if (lower.includes('light')) return ThemeMode.LIGHT
    if (lower.includes('dark')) return ThemeMode.DARK
    if (lower.includes('high-contrast')) return ThemeMode.HIGH_CONTRAST
    return undefined
  }

  /**
   * Normalize token name
   */
  private normalizeTokenName(name: string): string {
    // Apply case transformation if specified
    if (this.config.transforms?.nameCase) {
      switch (this.config.transforms.nameCase) {
        case 'camelCase':
          return this.toCamelCase(name)
        case 'kebabCase':
          return this.toKebabCase(name)
        case 'snakeCase':
          return this.toSnakeCase(name)
        case 'pascalCase':
          return this.toPascalCase(name)
      }
    }

    return name
  }

  /**
   * Normalize token value based on type
   */
  private normalizeTokenValue(value: any, type: TokenType): any {
    switch (type) {
      case TokenType.COLOR:
        return this.normalizeColorValue(value)
      case TokenType.DIMENSION:
      case TokenType.SPACING:
      case TokenType.SIZING:
      case TokenType.FONT_SIZE:
        return this.normalizeDimensionValue(value)
      default:
        return value
    }
  }

  /**
   * Normalize color value
   */
  private normalizeColorValue(value: any): ColorValue {
    if (typeof value === 'string') {
      // Parse color string
      if (value.startsWith('#')) {
        return { hex: value }
      }
      // Add more color parsing logic as needed
    }
    return value as ColorValue
  }

  /**
   * Normalize dimension value
   */
  private normalizeDimensionValue(value: any): string {
    if (typeof value === 'number') {
      const unit = this.config.transforms?.dimensionUnit || 'px'
      if (unit === 'rem') {
        const baseFontSize = this.config.transforms?.baseFontSize || 16
        return `${value / baseFontSize}rem`
      }
      return `${value}${unit}`
    }
    return value
  }

  /**
   * Apply transforms to token value
   */
  private applyTransforms(value: any, _type: TokenType): any {
    if (this.config.transforms?.custom) {
      for (const [, transform] of Object.entries(
        this.config.transforms.custom
      )) {
        value = transform(value)
      }
    }
    return value
  }

  /**
   * Validate color value
   */
  private validateColorValue(token: DesignToken): ValidationError | null {
    const value = token.value
    if (
      !value ||
      (typeof value !== 'string' &&
        !value.hex &&
        !value.rgb &&
        !value.hsl)
    ) {
      return {
        token: token.name,
        message: 'Invalid color value',
        severity: 'error',
      }
    }
    return null
  }

  /**
   * Validate reference
   */
  private validateReference(
    token: DesignToken,
    allTokens: DesignToken[]
  ): ValidationError | null {
    if (!token.reference) return null

    const referenced = allTokens.find((t) => t.name === token.reference)
    if (!referenced) {
      return {
        token: token.name,
        message: `Reference not found: ${token.reference}`,
        severity: 'error',
      }
    }

    return null
  }

  /**
   * Detect circular references
   */
  private detectCircularReferences(
    tokens: DesignToken[]
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const visited = new Set<string>()
    const stack = new Set<string>()

    const visit = (token: DesignToken) => {
      if (stack.has(token.name)) {
        errors.push({
          token: token.name,
          message: `Circular reference detected`,
          severity: 'error',
        })
        return
      }

      if (visited.has(token.name)) return

      visited.add(token.name)
      stack.add(token.name)

      if (token.reference) {
        const referenced = tokens.find((t) => t.name === token.reference)
        if (referenced) {
          visit(referenced)
        }
      }

      stack.delete(token.name)
    }

    for (const token of tokens) {
      visit(token)
    }

    return errors
  }

  /**
   * Detect conflicts
   */
  private detectConflicts(tokens: DesignToken[]): TokenConflict[] {
    const conflicts: TokenConflict[] = []
    const nameMap = new Map<string, DesignToken[]>()

    for (const token of tokens) {
      if (!nameMap.has(token.name)) {
        nameMap.set(token.name, [])
      }
      nameMap.get(token.name)!.push(token)
    }

    for (const entry of Array.from(nameMap.entries())) {
      const [name, duplicateTokens] = entry
      if (duplicateTokens.length > 1) {
        conflicts.push({
          name,
          tokens: duplicateTokens,
          reason: `Multiple tokens with name "${name}"`,
        })
      }
    }

    return conflicts
  }

  /**
   * Export to JSON
   */
  private exportToJSON(
    tokens: DesignToken[],
    options: ExportOptions
  ): string {
    const obj: any = {}

    for (const token of tokens) {
      const parts = token.name.split(this.config.nameSeparator || '-')
      let current = obj

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {}
        }
        current = current[parts[i]]
      }

      const key = parts[parts.length - 1]
      current[key] = {
        value: token.value,
        type: token.type,
        ...(options.includeComments && token.description
          ? { description: token.description }
          : {}),
      }
    }

    return JSON.stringify(
      obj,
      null,
      options.pretty ? options.indent || 2 : 0
    )
  }

  /**
   * Export to CSS
   */
  private exportToCSS(
    tokens: DesignToken[],
    options: ExportOptions
  ): string {
    const prefix = options.cssPrefix || '--'
    let css = ':root {\n'

    for (const token of tokens) {
      if (options.includeComments && token.description) {
        css += `  /* ${token.description} */\n`
      }
      css += `  ${prefix}${token.name}: ${this.formatCSSValue(
        token.value,
        token.type
      )};\n`
    }

    css += '}\n'
    return css
  }

  /**
   * Export to SCSS
   */
  private exportToSCSS(
    tokens: DesignToken[],
    options: ExportOptions
  ): string {
    let scss = ''

    for (const token of tokens) {
      if (options.includeComments && token.description) {
        scss += `// ${token.description}\n`
      }
      scss += `$${token.name}: ${this.formatCSSValue(
        token.value,
        token.type
      )};\n`
    }

    return scss
  }

  /**
   * Export to LESS
   */
  private exportToLESS(
    tokens: DesignToken[],
    options: ExportOptions
  ): string {
    let less = ''

    for (const token of tokens) {
      if (options.includeComments && token.description) {
        less += `// ${token.description}\n`
      }
      less += `@${token.name}: ${this.formatCSSValue(
        token.value,
        token.type
      )};\n`
    }

    return less
  }

  /**
   * Export to JavaScript
   */
  private exportToJS(tokens: DesignToken[], options: ExportOptions): string {
    const obj: any = {}

    for (const token of tokens) {
      obj[token.name] = token.value
    }

    return `export default ${JSON.stringify(
      obj,
      null,
      options.pretty ? options.indent || 2 : 0
    )};`
  }

  /**
   * Export to TypeScript
   */
  private exportToTS(tokens: DesignToken[], options: ExportOptions): string {
    const obj: any = {}

    for (const token of tokens) {
      obj[token.name] = token.value
    }

    return `export const tokens = ${JSON.stringify(
      obj,
      null,
      options.pretty ? options.indent || 2 : 0
    )} as const;\n\nexport type TokenName = keyof typeof tokens;`
  }

  /**
   * Export to Style Dictionary format
   */
  private exportToStyleDictionary(
    tokens: DesignToken[],
    options: ExportOptions
  ): string {
    const obj: any = {}

    for (const token of tokens) {
      const parts = token.name.split(this.config.nameSeparator || '-')
      let current = obj

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {}
        }
        current = current[parts[i]]
      }

      const key = parts[parts.length - 1]
      current[key] = {
        value: token.value,
        type: token.type,
        ...(token.description ? { comment: token.description } : {}),
      }
    }

    return JSON.stringify(
      obj,
      null,
      options.pretty ? options.indent || 2 : 0
    )
  }

  /**
   * Export to Tailwind config
   */
  private exportToTailwind(
    tokens: DesignToken[],
    _options: ExportOptions
  ): string {
    const theme: any = {
      colors: {},
      spacing: {},
      fontSize: {},
      fontWeight: {},
      borderRadius: {},
      boxShadow: {},
    }

    for (const token of tokens) {
      switch (token.category) {
        case TokenCategory.COLOR:
          theme.colors[token.name] = token.value.hex || token.value
          break
        case TokenCategory.SPACING:
          theme.spacing[token.name] = token.value
          break
        case TokenCategory.FONT_SIZE:
          theme.fontSize[token.name] = token.value
          break
        case TokenCategory.FONT_WEIGHT:
          theme.fontWeight[token.name] = token.value
          break
        case TokenCategory.BORDER_RADIUS:
          theme.borderRadius[token.name] = token.value
          break
        case TokenCategory.SHADOW:
          theme.boxShadow[token.name] = this.formatShadowValue(token.value)
          break
      }
    }

    return `module.exports = {\n  theme: {\n    extend: ${JSON.stringify(
      theme,
      null,
      2
    )}\n  }\n};`
  }

  /**
   * Format CSS value
   */
  private formatCSSValue(value: any, type: TokenType): string {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return `${value}px`

    switch (type) {
      case TokenType.COLOR:
        return value.hex || value.rgba || value.hsla || '#000000'
      case TokenType.SHADOW:
        return this.formatShadowValue(value)
      default:
        return String(value)
    }
  }

  /**
   * Format shadow value
   */
  private formatShadowValue(shadow: ShadowValue | ShadowValue[]): string {
    if (Array.isArray(shadow)) {
      return shadow.map((s) => this.formatSingleShadow(s)).join(', ')
    }
    return this.formatSingleShadow(shadow)
  }

  /**
   * Format single shadow value
   */
  private formatSingleShadow(shadow: ShadowValue): string {
    const { x, y, blur, spread, color, inset } = shadow
    const parts = [
      inset ? 'inset' : '',
      `${x}px`,
      `${y}px`,
      `${blur}px`,
      spread ? `${spread}px` : '',
      typeof color === 'string' ? color : color.hex || '#000000',
    ].filter(Boolean)

    return parts.join(' ')
  }

  /**
   * Extract tokens from CSS text
   */
  private extractTokensFromCSS(css: string): DesignToken[] {
    const tokens: DesignToken[] = []

    // Extract CSS custom properties (--variables)
    const customPropRegex = /--([\w-]+)\s*:\s*([^;]+);/g
    let match
    while ((match = customPropRegex.exec(css)) !== null) {
      const [, name, value] = match
      const token = this.createTokenFromCSSValue(name, value.trim())
      if (token) tokens.push(token)
    }

    // Extract color values
    const colorRegex = /(?:color|background(?:-color)?|border-color|fill|stroke)\s*:\s*([^;]+);/gi
    while ((match = colorRegex.exec(css)) !== null) {
      const value = match[1].trim()
      if (this.isColorValue(value)) {
        tokens.push({
          name: `color-${tokens.length + 1}`,
          value: this.parseColorValue(value),
          type: TokenType.COLOR,
          category: TokenCategory.COLOR,
          source: 'css',
        })
      }
    }

    // Extract spacing values
    const spacingRegex = /(?:padding|margin|gap)\s*:\s*([^;]+);/gi
    while ((match = spacingRegex.exec(css)) !== null) {
      const value = match[1].trim()
      tokens.push({
        name: `spacing-${tokens.length + 1}`,
        value,
        type: TokenType.SPACING,
        category: TokenCategory.SPACING,
        source: 'css',
      })
    }

    // Extract font-family
    const fontRegex = /font-family\s*:\s*([^;]+);/gi
    while ((match = fontRegex.exec(css)) !== null) {
      const value = match[1].trim().replace(/['"]/g, '')
      tokens.push({
        name: `font-family-${tokens.length + 1}`,
        value,
        type: TokenType.FONT_FAMILY,
        category: TokenCategory.TYPOGRAPHY,
        source: 'css',
      })
    }

    // Extract font-size
    const fontSizeRegex = /font-size\s*:\s*([^;]+);/gi
    while ((match = fontSizeRegex.exec(css)) !== null) {
      const value = match[1].trim()
      tokens.push({
        name: `font-size-${tokens.length + 1}`,
        value,
        type: TokenType.FONT_SIZE,
        category: TokenCategory.FONT_SIZE,
        source: 'css',
      })
    }

    // Extract border-radius
    const radiusRegex = /border-radius\s*:\s*([^;]+);/gi
    while ((match = radiusRegex.exec(css)) !== null) {
      const value = match[1].trim()
      tokens.push({
        name: `radius-${tokens.length + 1}`,
        value,
        type: TokenType.BORDER_RADIUS,
        category: TokenCategory.BORDER_RADIUS,
        source: 'css',
      })
    }

    // Extract box-shadow
    const shadowRegex = /box-shadow\s*:\s*([^;]+);/gi
    while ((match = shadowRegex.exec(css)) !== null) {
      const value = match[1].trim()
      const shadowValue = this.parseShadowValue(value)
      if (shadowValue) {
        tokens.push({
          name: `shadow-${tokens.length + 1}`,
          value: shadowValue,
          type: TokenType.SHADOW,
          category: TokenCategory.SHADOW,
          source: 'css',
        })
      }
    }

    return tokens
  }

  /**
   * Create token from CSS custom property value
   */
  private createTokenFromCSSValue(
    name: string,
    value: string
  ): DesignToken | null {
    // Detect token type from name and value
    if (name.includes('color') || this.isColorValue(value)) {
      return {
        name,
        value: this.parseColorValue(value),
        type: TokenType.COLOR,
        category: TokenCategory.COLOR,
        source: 'css',
      }
    }

    if (name.includes('spacing') || name.includes('margin') || name.includes('padding')) {
      return {
        name,
        value,
        type: TokenType.SPACING,
        category: TokenCategory.SPACING,
        source: 'css',
      }
    }

    if (name.includes('font-size')) {
      return {
        name,
        value,
        type: TokenType.FONT_SIZE,
        category: TokenCategory.FONT_SIZE,
        source: 'css',
      }
    }

    if (name.includes('font-family')) {
      return {
        name,
        value: value.replace(/['"]/g, ''),
        type: TokenType.FONT_FAMILY,
        category: TokenCategory.TYPOGRAPHY,
        source: 'css',
      }
    }

    if (name.includes('radius')) {
      return {
        name,
        value,
        type: TokenType.BORDER_RADIUS,
        category: TokenCategory.BORDER_RADIUS,
        source: 'css',
      }
    }

    if (name.includes('shadow')) {
      const shadowValue = this.parseShadowValue(value)
      if (shadowValue) {
        return {
          name,
          value: shadowValue,
          type: TokenType.SHADOW,
          category: TokenCategory.SHADOW,
          source: 'css',
        }
      }
    }

    // Default to dimension
    return {
      name,
      value,
      type: TokenType.DIMENSION,
      category: TokenCategory.SPACING,
      source: 'css',
    }
  }

  /**
   * Check if a value is a color
   */
  private isColorValue(value: string): boolean {
    return (
      value.startsWith('#') ||
      value.startsWith('rgb') ||
      value.startsWith('hsl') ||
      /^[a-z]+$/i.test(value) // Named colors
    )
  }

  /**
   * Parse color value to ColorValue
   */
  private parseColorValue(value: string): ColorValue {
    if (value.startsWith('#')) {
      return { hex: value }
    }

    if (value.startsWith('rgb')) {
      return { rgba: value }
    }

    if (value.startsWith('hsl')) {
      return { hsla: value }
    }

    // Try to convert named color to hex
    return { hex: value }
  }

  /**
   * Parse CSS shadow value
   */
  private parseShadowValue(value: string): ShadowValue | null {
    // Simple shadow parsing (e.g., "0px 4px 10px rgba(0,0,0,0.25)")
    const parts = value.split(/\s+/)
    if (parts.length >= 3) {
      return {
        x: parseFloat(parts[0]),
        y: parseFloat(parts[1]),
        blur: parseFloat(parts[2]),
        spread: parts.length > 4 ? parseFloat(parts[3]) : 0,
        color: parts[parts.length - 1],
      }
    }
    return null
  }

  /**
   * Suggest a semantic name for a token
   */
  private suggestTokenName(token: DesignToken): string {
    const { type, category, value } = token

    // Generate name based on category and value characteristics
    switch (category) {
      case TokenCategory.COLOR:
        return this.suggestColorName(value)
      case TokenCategory.SPACING:
        return this.suggestSpacingName(value)
      case TokenCategory.TYPOGRAPHY:
        return this.suggestTypographyName(type, value)
      default:
        return `${category}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Suggest color name based on value
   */
  private suggestColorName(value: any): string {
    // In a real implementation, this would use AI to analyze
    // the color and suggest semantic names like "ocean-blue" or "sunset-orange"

    if (typeof value === 'string') {
      // Simple heuristic based on hex value
      if (value.includes('00') && value.includes('ff')) {
        return 'color-primary'
      }
    }

    return `color-${Math.random().toString(36).substr(2, 6)}`
  }

  /**
   * Suggest spacing name based on value
   */
  private suggestSpacingName(value: any): string {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value))

    if (isNaN(numValue)) return 'spacing-medium'

    // Suggest size based on value
    if (numValue <= 4) return 'spacing-xs'
    if (numValue <= 8) return 'spacing-sm'
    if (numValue <= 16) return 'spacing-md'
    if (numValue <= 24) return 'spacing-lg'
    if (numValue <= 32) return 'spacing-xl'
    return 'spacing-2xl'
  }

  /**
   * Suggest typography name based on type and value
   */
  private suggestTypographyName(type: TokenType, value: any): string {
    if (type === TokenType.FONT_SIZE) {
      const numValue = parseFloat(String(value))
      if (numValue <= 12) return 'font-size-xs'
      if (numValue <= 14) return 'font-size-sm'
      if (numValue <= 16) return 'font-size-base'
      if (numValue <= 18) return 'font-size-lg'
      if (numValue <= 24) return 'font-size-xl'
      return 'font-size-2xl'
    }

    return `${type}-default`
  }

  /**
   * Generate color shades from base color
   */
  private generateColorShades(
    baseColor: string,
    _mode: ThemeMode
  ): Record<string, ColorValue> {
    // In a real implementation, this would use color theory algorithms
    // to generate harmonious color shades based on theme mode

    const shades: Record<string, ColorValue> = {}

    // Generate simple variations
    shades['100'] = { hex: baseColor }
    shades['200'] = { hex: baseColor }
    shades['300'] = { hex: baseColor }
    shades['400'] = { hex: baseColor }
    shades['500'] = { hex: baseColor } // Base
    shades['600'] = { hex: baseColor }
    shades['700'] = { hex: baseColor }
    shades['800'] = { hex: baseColor }
    shades['900'] = { hex: baseColor }

    return shades
  }

  // Case transformation helpers
  private toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
  }

  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^-/, '')
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '')
  }

  private toPascalCase(str: string): string {
    const camel = this.toCamelCase(str)
    return camel.charAt(0).toUpperCase() + camel.slice(1)
  }
}

/**
 * Create a design token extractor instance
 */
export function createDesignTokenExtractor(
  config?: ExtractorConfig
): DesignTokenExtractor {
  return new DesignTokenExtractor(config)
}

/**
 * Export default instance
 */
export default DesignTokenExtractor

/**
 * Re-export types and enums for convenience
 */
export {
  TokenCategory,
  TokenType,
  ThemeMode,
  ExportFormat,
} from './design-token-types'
