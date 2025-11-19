/**
 * React hook for accessing the component registry
 * Provides type-safe component lookup and prop mapping
 */

import { useCallback, useMemo } from 'react'
import { ComponentRegistry, globalRegistry } from './ComponentRegistry'
import {
  LookupOptions,
  LookupResult,
  RegisterOptions,
  ComponentMapping,
  PropMapper,
  RegistryStats,
} from './types'
import { ComponentType } from 'react'

export interface UseComponentRegistryOptions {
  /**
   * Optional custom registry instance
   * If not provided, uses the global registry
   */
  registry?: ComponentRegistry
}

export interface UseComponentRegistryResult {
  /**
   * Lookup a component by tool name
   */
  lookup: <TToolResult = any, TProps = any>(
    toolName: string,
    options?: LookupOptions
  ) => LookupResult<TToolResult, TProps>

  /**
   * Get a component by tool name (convenience method)
   */
  getComponent: <TProps = any>(
    toolName: string,
    options?: LookupOptions
  ) => ComponentType<TProps> | null

  /**
   * Get a prop mapper by tool name (convenience method)
   */
  getMapper: <TToolResult = any, TProps = any>(
    toolName: string,
    options?: LookupOptions
  ) => PropMapper<TToolResult, TProps> | null

  /**
   * Check if a component is registered
   */
  has: (toolName: string, variant?: string) => boolean

  /**
   * Register a new component
   */
  register: <TToolResult = any, TProps = any>(
    toolName: string,
    component: ComponentType<TProps>,
    mapProps: PropMapper<TToolResult, TProps>,
    options?: RegisterOptions
  ) => void

  /**
   * Register a component mapping object
   */
  registerMapping: <TToolResult = any, TProps = any>(
    toolName: string,
    mapping: ComponentMapping<TToolResult, TProps>,
    options?: RegisterOptions
  ) => void

  /**
   * Unregister a component
   */
  unregister: (toolName: string, variant?: string) => boolean

  /**
   * Get all registered tool names
   */
  getToolNames: () => string[]

  /**
   * Get all variants for a tool
   */
  getVariants: (toolName: string) => string[]

  /**
   * Get registry statistics
   */
  getStats: () => RegistryStats

  /**
   * Clear the cache
   */
  clearCache: () => void

  /**
   * The registry instance being used
   */
  registry: ComponentRegistry
}

/**
 * Hook for accessing the component registry
 * Provides methods for registering and looking up components
 *
 * @example
 * ```tsx
 * const { register, lookup, getComponent } = useComponentRegistry()
 *
 * // Register a component
 * register('weather', WeatherCard, (data) => ({
 *   temperature: data.temp,
 *   condition: data.condition
 * }))
 *
 * // Lookup a component
 * const { component: Component, mapProps } = lookup('weather')
 * const props = mapProps(toolResult)
 * return <Component {...props} />
 *
 * // Or use the convenience method
 * const Component = getComponent('weather')
 * ```
 */
export function useComponentRegistry(
  options: UseComponentRegistryOptions = {}
): UseComponentRegistryResult {
  const registry = options.registry ?? globalRegistry

  // Wrap registry methods with useCallback to ensure stable references
  const lookup = useCallback(
    <TToolResult = any, TProps = any>(
      toolName: string,
      lookupOptions?: LookupOptions
    ): LookupResult<TToolResult, TProps> => {
      return registry.lookup<TToolResult, TProps>(toolName, lookupOptions)
    },
    [registry]
  )

  const getComponent = useCallback(
    <TProps = any>(
      toolName: string,
      lookupOptions?: LookupOptions
    ): ComponentType<TProps> | null => {
      return registry.getComponent<TProps>(toolName, lookupOptions)
    },
    [registry]
  )

  const getMapper = useCallback(
    <TToolResult = any, TProps = any>(
      toolName: string,
      lookupOptions?: LookupOptions
    ): PropMapper<TToolResult, TProps> | null => {
      return registry.getMapper<TToolResult, TProps>(toolName, lookupOptions)
    },
    [registry]
  )

  const has = useCallback(
    (toolName: string, variant?: string): boolean => {
      return registry.has(toolName, variant)
    },
    [registry]
  )

  const register = useCallback(
    <TToolResult = any, TProps = any>(
      toolName: string,
      component: ComponentType<TProps>,
      mapProps: PropMapper<TToolResult, TProps>,
      registerOptions?: RegisterOptions
    ): void => {
      registry.register<TToolResult, TProps>(
        toolName,
        component,
        mapProps,
        registerOptions
      )
    },
    [registry]
  )

  const registerMapping = useCallback(
    <TToolResult = any, TProps = any>(
      toolName: string,
      mapping: ComponentMapping<TToolResult, TProps>,
      registerOptions?: RegisterOptions
    ): void => {
      registry.registerMapping<TToolResult, TProps>(
        toolName,
        mapping,
        registerOptions
      )
    },
    [registry]
  )

  const unregister = useCallback(
    (toolName: string, variant?: string): boolean => {
      return registry.unregister(toolName, variant)
    },
    [registry]
  )

  const getToolNames = useCallback((): string[] => {
    return registry.getToolNames()
  }, [registry])

  const getVariants = useCallback(
    (toolName: string): string[] => {
      return registry.getVariants(toolName)
    },
    [registry]
  )

  const getStats = useCallback((): RegistryStats => {
    return registry.getStats()
  }, [registry])

  const clearCache = useCallback((): void => {
    registry.clearCache()
  }, [registry])

  // Return memoized result to prevent unnecessary re-renders
  return useMemo(
    () => ({
      lookup,
      getComponent,
      getMapper,
      has,
      register,
      registerMapping,
      unregister,
      getToolNames,
      getVariants,
      getStats,
      clearCache,
      registry,
    }),
    [
      lookup,
      getComponent,
      getMapper,
      has,
      register,
      registerMapping,
      unregister,
      getToolNames,
      getVariants,
      getStats,
      clearCache,
      registry,
    ]
  )
}
