/**
 * ComponentRegistry - Type-safe registry for mapping tool results to UI components
 * Enables dynamic component lookup and rendering based on tool names
 */

import { ComponentType } from 'react'
import {
  ComponentMapping,
  PropMapper,
  RegistryConfig,
  RegisterOptions,
  LookupOptions,
  LookupResult,
  RegistryStats,
} from './types'

/**
 * Internal storage structure for registered components
 */
interface RegistryEntry<TToolResult = any, TProps = any> {
  mapping: ComponentMapping<TToolResult, TProps>
  toolName: string
  variant: string
  registeredAt: number
}

/**
 * Cache entry for component lookups
 */
interface CacheEntry<TToolResult = any, TProps = any> {
  result: LookupResult<TToolResult, TProps>
  accessedAt: number
  hits: number
}

/**
 * ComponentRegistry class for managing component mappings
 * Provides type-safe registration and lookup of components by tool name
 */
export class ComponentRegistry {
  private registry: Map<string, RegistryEntry[]> = new Map()
  private cache: Map<string, CacheEntry> = new Map()
  private config: Required<RegistryConfig>
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
  }

  constructor(config: RegistryConfig = {}) {
    this.config = {
      strictMode: config.strictMode ?? false,
      fallbackComponent: config.fallbackComponent ?? null,
      enableCaching: config.enableCaching ?? true,
      cacheSize: config.cacheSize ?? 100,
    }
  }

  /**
   * Register a component with a tool name
   * @template TToolResult - The type of the tool result data
   * @template TProps - The type of component props
   */
  register<TToolResult = any, TProps = any>(
    toolName: string,
    component: ComponentType<TProps>,
    mapProps: PropMapper<TToolResult, TProps>,
    options: RegisterOptions = {}
  ): void {
    if (!toolName || typeof toolName !== 'string') {
      throw new Error('Tool name must be a non-empty string')
    }

    if (!component) {
      throw new Error('Component is required')
    }

    if (typeof mapProps !== 'function') {
      throw new Error('mapProps must be a function')
    }

    const variant = options.variant ?? 'default'
    const entry: RegistryEntry<TToolResult, TProps> = {
      mapping: {
        component,
        mapProps,
        variant: options.variant,
        validate: options.validate,
      },
      toolName,
      variant,
      registeredAt: Date.now(),
    }

    // Check for existing registration
    const existing = this.registry.get(toolName) ?? []
    const existingVariantIndex = existing.findIndex((e) => e.variant === variant)

    if (existingVariantIndex !== -1 && !options.override) {
      throw new Error(
        `Component already registered for tool "${toolName}" with variant "${variant}". Use override: true to replace.`
      )
    }

    // Update or add new entry
    if (existingVariantIndex !== -1) {
      existing[existingVariantIndex] = entry
    } else {
      existing.push(entry)
    }

    this.registry.set(toolName, existing)

    // Invalidate cache for this tool
    this.invalidateCache(toolName)
  }

  /**
   * Register a component mapping object
   * @template TToolResult - The type of the tool result data
   * @template TProps - The type of component props
   */
  registerMapping<TToolResult = any, TProps = any>(
    toolName: string,
    mapping: ComponentMapping<TToolResult, TProps>,
    options: RegisterOptions = {}
  ): void {
    this.register(
      toolName,
      mapping.component,
      mapping.mapProps,
      {
        variant: mapping.variant ?? options.variant,
        validate: mapping.validate ?? options.validate,
        override: options.override,
      }
    )
  }

  /**
   * Lookup a component by tool name
   * @template TToolResult - The type of the tool result data
   * @template TProps - The type of component props
   */
  lookup<TToolResult = any, TProps = any>(
    toolName: string,
    options: LookupOptions = {}
  ): LookupResult<TToolResult, TProps> {
    const variant = options.variant ?? 'default'
    const cacheKey = `${toolName}:${variant}`

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        this.stats.cacheHits++
        cached.accessedAt = Date.now()
        cached.hits++
        return cached.result as LookupResult<TToolResult, TProps>
      }
      this.stats.cacheMisses++
    }

    // Perform lookup
    const entries = this.registry.get(toolName)
    let result: LookupResult<TToolResult, TProps>

    if (!entries || entries.length === 0) {
      result = this.createNotFoundResult(toolName, options)
    } else {
      const entry = entries.find((e) => e.variant === variant) ?? entries[0]
      result = {
        component: entry.mapping.component as ComponentType<TProps>,
        mapProps: entry.mapping.mapProps as PropMapper<TToolResult, TProps>,
        found: true,
        validate: entry.mapping.validate as ((props: TProps) => boolean) | undefined,
      }
    }

    // Cache the result
    if (this.config.enableCaching) {
      this.addToCache(cacheKey, result)
    }

    return result
  }

  /**
   * Get a component by tool name (convenience method)
   */
  getComponent<TProps = any>(
    toolName: string,
    options: LookupOptions = {}
  ): ComponentType<TProps> | null {
    const result = this.lookup<any, TProps>(toolName, options)
    return result.component
  }

  /**
   * Get a prop mapper by tool name (convenience method)
   */
  getMapper<TToolResult = any, TProps = any>(
    toolName: string,
    options: LookupOptions = {}
  ): PropMapper<TToolResult, TProps> | null {
    const result = this.lookup<TToolResult, TProps>(toolName, options)
    return result.mapProps
  }

  /**
   * Check if a component is registered for a tool
   */
  has(toolName: string, variant?: string): boolean {
    const entries = this.registry.get(toolName)
    if (!entries || entries.length === 0) return false
    if (!variant) return true
    return entries.some((e) => e.variant === variant)
  }

  /**
   * Unregister a component
   */
  unregister(toolName: string, variant?: string): boolean {
    const entries = this.registry.get(toolName)
    if (!entries || entries.length === 0) return false

    if (variant) {
      const filtered = entries.filter((e) => e.variant !== variant)
      if (filtered.length === entries.length) return false

      if (filtered.length === 0) {
        this.registry.delete(toolName)
      } else {
        this.registry.set(toolName, filtered)
      }
    } else {
      this.registry.delete(toolName)
    }

    this.invalidateCache(toolName)
    return true
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Get all variants for a tool
   */
  getVariants(toolName: string): string[] {
    const entries = this.registry.get(toolName)
    if (!entries) return []
    return entries.map((e) => e.variant)
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registry.clear()
    this.cache.clear()
    this.stats.cacheHits = 0
    this.stats.cacheMisses = 0
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    let totalComponents = 0
    this.registry.forEach((entries) => {
      totalComponents += entries.length
    })

    return {
      totalComponents,
      totalTools: this.registry.size,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      registeredTools: this.getToolNames(),
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
    this.stats.cacheHits = 0
    this.stats.cacheMisses = 0
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<RegistryConfig>> {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RegistryConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    }

    // Clear cache if caching was disabled
    if (config.enableCaching === false) {
      this.clearCache()
    }
  }

  // Private helper methods

  private createNotFoundResult<TToolResult, TProps>(
    toolName: string,
    options: LookupOptions
  ): LookupResult<TToolResult, TProps> {
    if (this.config.strictMode || options.throwOnMissing) {
      throw new Error(`Component not found for tool: ${toolName}`)
    }

    return {
      component: this.config.fallbackComponent as ComponentType<TProps> | null,
      mapProps: null,
      found: false,
    }
  }

  private invalidateCache(toolName: string): void {
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${toolName}:`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  private addToCache<TToolResult, TProps>(
    key: string,
    result: LookupResult<TToolResult, TProps>
  ): void {
    // Implement LRU cache eviction if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      result,
      accessedAt: Date.now(),
      hits: 0,
    })
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    this.cache.forEach((entry, key) => {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// Export a singleton instance for convenience
export const globalRegistry = new ComponentRegistry()
