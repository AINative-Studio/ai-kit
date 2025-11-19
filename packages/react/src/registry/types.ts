/**
 * Type definitions for the Component Registry
 * Enables type-safe mapping of tool results to UI components
 */

import { ComponentType } from 'react'

/**
 * Generic prop mapper function that transforms tool results into component props
 * @template TToolResult - The type of the tool result data
 * @template TProps - The type of component props
 */
export type PropMapper<TToolResult = any, TProps = any> = (
  toolResult: TToolResult
) => TProps

/**
 * Represents a registered component with its prop mapping function
 * @template TToolResult - The type of the tool result data
 * @template TProps - The type of component props
 */
export interface ComponentMapping<TToolResult = any, TProps = any> {
  /** The React component to render */
  component: ComponentType<TProps>
  /** Function to map tool results to component props */
  mapProps: PropMapper<TToolResult, TProps>
  /** Optional variant name for multiple components per tool */
  variant?: string
  /** Optional validation function for component props */
  validate?: (props: TProps) => boolean
}

/**
 * Configuration options for the component registry
 */
export interface RegistryConfig {
  /** Whether to throw errors for missing components (default: false) */
  strictMode?: boolean
  /** Optional default component to use when lookup fails */
  fallbackComponent?: ComponentType<any>
  /** Whether to cache component lookups (default: true) */
  enableCaching?: boolean
  /** Maximum number of cached lookups (default: 100) */
  cacheSize?: number
}

/**
 * Options for registering a component
 */
export interface RegisterOptions {
  /** Optional variant name for multiple components per tool */
  variant?: string
  /** Optional validation function for component props */
  validate?: (props: any) => boolean
  /** Whether to override existing registration (default: false) */
  override?: boolean
}

/**
 * Options for looking up a component
 */
export interface LookupOptions {
  /** Optional variant name to retrieve specific component variant */
  variant?: string
  /** Whether to throw error if component not found (default: false) */
  throwOnMissing?: boolean
}

/**
 * Result of a component lookup
 * @template TToolResult - The type of the tool result data
 * @template TProps - The type of component props
 */
export interface LookupResult<TToolResult = any, TProps = any> {
  /** The React component, or null if not found */
  component: ComponentType<TProps> | null
  /** The prop mapper function, or null if not found */
  mapProps: PropMapper<TToolResult, TProps> | null
  /** Whether the component was found */
  found: boolean
  /** Optional validation function */
  validate?: (props: TProps) => boolean
}

/**
 * Registry statistics for monitoring and debugging
 */
export interface RegistryStats {
  /** Total number of registered components */
  totalComponents: number
  /** Number of registered tool names */
  totalTools: number
  /** Number of cache hits (if caching enabled) */
  cacheHits: number
  /** Number of cache misses (if caching enabled) */
  cacheMisses: number
  /** List of all registered tool names */
  registeredTools: string[]
}
