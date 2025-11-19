import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComponentRegistry } from '../../src/registry/ComponentRegistry'
import { ComponentType } from 'react'

// Mock components for testing
const MockComponent1 = ({ text }: { text: string }) => <div>{text}</div>
const MockComponent2 = ({ value }: { value: number }) => <div>{value}</div>
const MockComponent3 = ({ data }: { data: any }) => <div>{JSON.stringify(data)}</div>
const FallbackComponent = () => <div>Fallback</div>

// Mock tool results
interface WeatherResult {
  temperature: number
  condition: string
  location: string
}

interface SearchResult {
  query: string
  results: string[]
  count: number
}

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry

  beforeEach(() => {
    registry = new ComponentRegistry()
  })

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const config = registry.getConfig()
      expect(config.strictMode).toBe(false)
      expect(config.enableCaching).toBe(true)
      expect(config.cacheSize).toBe(100)
      expect(config.fallbackComponent).toBe(null)
    })

    it('should initialize with custom config', () => {
      const customRegistry = new ComponentRegistry({
        strictMode: true,
        enableCaching: false,
        cacheSize: 50,
        fallbackComponent: FallbackComponent,
      })

      const config = customRegistry.getConfig()
      expect(config.strictMode).toBe(true)
      expect(config.enableCaching).toBe(false)
      expect(config.cacheSize).toBe(50)
      expect(config.fallbackComponent).toBe(FallbackComponent)
    })

    it('should start with empty registry', () => {
      const stats = registry.getStats()
      expect(stats.totalComponents).toBe(0)
      expect(stats.totalTools).toBe(0)
      expect(stats.registeredTools).toEqual([])
    })
  })

  describe('register', () => {
    it('should register a component with tool name', () => {
      const mapProps = (result: WeatherResult) => ({
        text: `${result.temperature}°F - ${result.condition}`,
      })

      registry.register('weather', MockComponent1, mapProps)

      expect(registry.has('weather')).toBe(true)
      const stats = registry.getStats()
      expect(stats.totalComponents).toBe(1)
      expect(stats.totalTools).toBe(1)
    })

    it('should register multiple components with different tool names', () => {
      registry.register('tool1', MockComponent1, (r) => ({ text: r }))
      registry.register('tool2', MockComponent2, (r) => ({ value: r }))
      registry.register('tool3', MockComponent3, (r) => ({ data: r }))

      const stats = registry.getStats()
      expect(stats.totalComponents).toBe(3)
      expect(stats.totalTools).toBe(3)
      expect(stats.registeredTools).toEqual(['tool1', 'tool2', 'tool3'])
    })

    it('should register multiple variants for the same tool', () => {
      registry.register('weather', MockComponent1, (r) => ({ text: r }))
      registry.register(
        'weather',
        MockComponent2,
        (r) => ({ value: r }),
        { variant: 'compact' }
      )
      registry.register(
        'weather',
        MockComponent3,
        (r) => ({ data: r }),
        { variant: 'detailed' }
      )

      const stats = registry.getStats()
      expect(stats.totalComponents).toBe(3)
      expect(stats.totalTools).toBe(1)

      const variants = registry.getVariants('weather')
      expect(variants).toContain('default')
      expect(variants).toContain('compact')
      expect(variants).toContain('detailed')
    })

    it('should throw error for empty tool name', () => {
      expect(() => {
        registry.register('', MockComponent1, (r) => ({ text: r }))
      }).toThrow('Tool name must be a non-empty string')
    })

    it('should throw error for missing component', () => {
      expect(() => {
        registry.register('test', null as any, (r) => ({ text: r }))
      }).toThrow('Component is required')
    })

    it('should throw error for invalid mapProps', () => {
      expect(() => {
        registry.register('test', MockComponent1, 'not a function' as any)
      }).toThrow('mapProps must be a function')
    })

    it('should throw error when registering duplicate without override', () => {
      registry.register('weather', MockComponent1, (r) => ({ text: r }))

      expect(() => {
        registry.register('weather', MockComponent2, (r) => ({ value: r }))
      }).toThrow('Component already registered for tool "weather"')
    })

    it('should allow override when specified', () => {
      registry.register('weather', MockComponent1, (r) => ({ text: 'old' }))
      registry.register(
        'weather',
        MockComponent2,
        (r) => ({ value: 42 }),
        { override: true }
      )

      const component = registry.getComponent('weather')
      expect(component).toBe(MockComponent2)
    })

    it('should support validation function', () => {
      const validate = vi.fn((props) => props.text.length > 0)

      registry.register('test', MockComponent1, (r) => ({ text: r }), { validate })

      const result = registry.lookup('test')
      expect(result.validate).toBe(validate)
    })
  })

  describe('registerMapping', () => {
    it('should register using a mapping object', () => {
      const mapping = {
        component: MockComponent1,
        mapProps: (result: WeatherResult) => ({
          text: `${result.temperature}°F`,
        }),
      }

      registry.registerMapping('weather', mapping)
      expect(registry.has('weather')).toBe(true)
    })

    it('should register mapping with variant', () => {
      const mapping = {
        component: MockComponent1,
        mapProps: (r: any) => ({ text: r }),
        variant: 'custom',
      }

      registry.registerMapping('test', mapping)
      expect(registry.has('test', 'custom')).toBe(true)
    })

    it('should register mapping with validation', () => {
      const validate = (props: any) => props.text !== ''

      const mapping = {
        component: MockComponent1,
        mapProps: (r: any) => ({ text: r }),
        validate,
      }

      registry.registerMapping('test', mapping)
      const result = registry.lookup('test')
      expect(result.validate).toBe(validate)
    })
  })

  describe('lookup', () => {
    beforeEach(() => {
      registry.register('weather', MockComponent1, (result: WeatherResult) => ({
        text: `${result.temperature}°F - ${result.condition}`,
      }))
    })

    it('should lookup registered component', () => {
      const result = registry.lookup('weather')

      expect(result.found).toBe(true)
      expect(result.component).toBe(MockComponent1)
      expect(typeof result.mapProps).toBe('function')
    })

    it('should return correct props from mapProps function', () => {
      const result = registry.lookup<WeatherResult, { text: string }>('weather')
      const toolResult: WeatherResult = {
        temperature: 72,
        condition: 'Sunny',
        location: 'San Francisco',
      }

      const props = result.mapProps!(toolResult)
      expect(props.text).toBe('72°F - Sunny')
    })

    it('should lookup specific variant', () => {
      registry.register(
        'weather',
        MockComponent2,
        (r) => ({ value: r }),
        { variant: 'compact' }
      )

      const result = registry.lookup('weather', { variant: 'compact' })
      expect(result.found).toBe(true)
      expect(result.component).toBe(MockComponent2)
    })

    it('should fallback to first variant if specified variant not found', () => {
      const result = registry.lookup('weather', { variant: 'nonexistent' })
      expect(result.found).toBe(true)
      expect(result.component).toBe(MockComponent1)
    })

    it('should return not found for unregistered tool', () => {
      const result = registry.lookup('unknown')

      expect(result.found).toBe(false)
      expect(result.component).toBe(null)
      expect(result.mapProps).toBe(null)
    })

    it('should use fallback component when configured', () => {
      const registryWithFallback = new ComponentRegistry({
        fallbackComponent: FallbackComponent,
      })

      const result = registryWithFallback.lookup('unknown')
      expect(result.found).toBe(false)
      expect(result.component).toBe(FallbackComponent)
    })

    it('should throw error in strict mode for missing component', () => {
      const strictRegistry = new ComponentRegistry({ strictMode: true })

      expect(() => {
        strictRegistry.lookup('unknown')
      }).toThrow('Component not found for tool: unknown')
    })

    it('should throw error when throwOnMissing is true', () => {
      expect(() => {
        registry.lookup('unknown', { throwOnMissing: true })
      }).toThrow('Component not found for tool: unknown')
    })
  })

  describe('getComponent', () => {
    it('should return component for registered tool', () => {
      registry.register('test', MockComponent1, (r) => ({ text: r }))

      const component = registry.getComponent('test')
      expect(component).toBe(MockComponent1)
    })

    it('should return null for unregistered tool', () => {
      const component = registry.getComponent('unknown')
      expect(component).toBe(null)
    })
  })

  describe('getMapper', () => {
    it('should return mapper function for registered tool', () => {
      const mapProps = (r: any) => ({ text: r })
      registry.register('test', MockComponent1, mapProps)

      const mapper = registry.getMapper('test')
      expect(mapper).toBe(mapProps)
    })

    it('should return null for unregistered tool', () => {
      const mapper = registry.getMapper('unknown')
      expect(mapper).toBe(null)
    })
  })

  describe('has', () => {
    beforeEach(() => {
      registry.register('weather', MockComponent1, (r) => ({ text: r }))
      registry.register(
        'weather',
        MockComponent2,
        (r) => ({ value: r }),
        { variant: 'compact' }
      )
    })

    it('should return true for registered tool', () => {
      expect(registry.has('weather')).toBe(true)
    })

    it('should return true for registered variant', () => {
      expect(registry.has('weather', 'compact')).toBe(true)
    })

    it('should return false for unregistered tool', () => {
      expect(registry.has('unknown')).toBe(false)
    })

    it('should return false for unregistered variant', () => {
      expect(registry.has('weather', 'nonexistent')).toBe(false)
    })
  })

  describe('unregister', () => {
    beforeEach(() => {
      registry.register('test', MockComponent1, (r) => ({ text: r }))
    })

    it('should unregister a component', () => {
      expect(registry.has('test')).toBe(true)
      const result = registry.unregister('test')

      expect(result).toBe(true)
      expect(registry.has('test')).toBe(false)
    })

    it('should unregister specific variant', () => {
      registry.register(
        'test',
        MockComponent2,
        (r) => ({ value: r }),
        { variant: 'compact' }
      )

      const result = registry.unregister('test', 'compact')
      expect(result).toBe(true)
      expect(registry.has('test', 'compact')).toBe(false)
      expect(registry.has('test', 'default')).toBe(true)
    })

    it('should return false for unregistered tool', () => {
      const result = registry.unregister('unknown')
      expect(result).toBe(false)
    })

    it('should invalidate cache on unregister', () => {
      registry.lookup('test') // Cache the lookup
      registry.unregister('test')

      const result = registry.lookup('test')
      expect(result.found).toBe(false)
    })
  })

  describe('getToolNames', () => {
    it('should return empty array for empty registry', () => {
      expect(registry.getToolNames()).toEqual([])
    })

    it('should return all registered tool names', () => {
      registry.register('tool1', MockComponent1, (r) => ({ text: r }))
      registry.register('tool2', MockComponent2, (r) => ({ value: r }))
      registry.register('tool3', MockComponent3, (r) => ({ data: r }))

      const toolNames = registry.getToolNames()
      expect(toolNames).toContain('tool1')
      expect(toolNames).toContain('tool2')
      expect(toolNames).toContain('tool3')
      expect(toolNames.length).toBe(3)
    })
  })

  describe('getVariants', () => {
    it('should return empty array for unregistered tool', () => {
      expect(registry.getVariants('unknown')).toEqual([])
    })

    it('should return all variants for a tool', () => {
      registry.register('weather', MockComponent1, (r) => ({ text: r }))
      registry.register(
        'weather',
        MockComponent2,
        (r) => ({ value: r }),
        { variant: 'compact' }
      )
      registry.register(
        'weather',
        MockComponent3,
        (r) => ({ data: r }),
        { variant: 'detailed' }
      )

      const variants = registry.getVariants('weather')
      expect(variants).toContain('default')
      expect(variants).toContain('compact')
      expect(variants).toContain('detailed')
      expect(variants.length).toBe(3)
    })
  })

  describe('clear', () => {
    it('should clear all registrations', () => {
      registry.register('tool1', MockComponent1, (r) => ({ text: r }))
      registry.register('tool2', MockComponent2, (r) => ({ value: r }))

      registry.clear()

      const stats = registry.getStats()
      expect(stats.totalComponents).toBe(0)
      expect(stats.totalTools).toBe(0)
      expect(registry.has('tool1')).toBe(false)
      expect(registry.has('tool2')).toBe(false)
    })

    it('should clear cache and reset stats', () => {
      registry.register('test', MockComponent1, (r) => ({ text: r }))
      registry.lookup('test') // Cache the lookup

      registry.clear()

      const stats = registry.getStats()
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
    })
  })

  describe('caching', () => {
    it('should cache lookup results', () => {
      registry.register('test', MockComponent1, (r) => ({ text: r }))

      registry.lookup('test') // First lookup (cache miss)
      registry.lookup('test') // Second lookup (cache hit)

      const stats = registry.getStats()
      expect(stats.cacheHits).toBe(1)
      expect(stats.cacheMisses).toBe(1)
    })

    it('should not cache when caching is disabled', () => {
      const noCacheRegistry = new ComponentRegistry({ enableCaching: false })
      noCacheRegistry.register('test', MockComponent1, (r) => ({ text: r }))

      noCacheRegistry.lookup('test')
      noCacheRegistry.lookup('test')

      const stats = noCacheRegistry.getStats()
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
    })

    it('should invalidate cache when component is re-registered', () => {
      registry.register('test', MockComponent1, (r) => ({ text: 'v1' }))
      const result1 = registry.lookup('test')

      registry.register('test', MockComponent2, (r) => ({ value: 42 }), { override: true })
      const result2 = registry.lookup('test')

      expect(result1.component).toBe(MockComponent1)
      expect(result2.component).toBe(MockComponent2)
    })

    it('should evict LRU entry when cache is full', () => {
      const smallCacheRegistry = new ComponentRegistry({ cacheSize: 2 })

      smallCacheRegistry.register('tool1', MockComponent1, (r) => ({ text: r }))
      smallCacheRegistry.register('tool2', MockComponent2, (r) => ({ value: r }))
      smallCacheRegistry.register('tool3', MockComponent3, (r) => ({ data: r }))

      smallCacheRegistry.lookup('tool1')
      smallCacheRegistry.lookup('tool2')
      smallCacheRegistry.lookup('tool3') // Should evict tool1

      const stats = smallCacheRegistry.getStats()
      expect(stats.cacheMisses).toBe(3)
    })

    it('should clear cache', () => {
      registry.register('test', MockComponent1, (r) => ({ text: r }))
      registry.lookup('test')

      registry.clearCache()

      const stats = registry.getStats()
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      registry.register('tool1', MockComponent1, (r) => ({ text: r }))
      registry.register('tool2', MockComponent2, (r) => ({ value: r }))
      registry.register(
        'tool2',
        MockComponent3,
        (r) => ({ data: r }),
        { variant: 'alt' }
      )

      registry.lookup('tool1') // Cache miss
      registry.lookup('tool1') // Cache hit

      const stats = registry.getStats()
      expect(stats.totalComponents).toBe(3)
      expect(stats.totalTools).toBe(2)
      expect(stats.cacheHits).toBe(1)
      expect(stats.cacheMisses).toBe(1)
      expect(stats.registeredTools).toContain('tool1')
      expect(stats.registeredTools).toContain('tool2')
    })
  })

  describe('updateConfig', () => {
    it('should update configuration', () => {
      registry.updateConfig({ strictMode: true, cacheSize: 50 })

      const config = registry.getConfig()
      expect(config.strictMode).toBe(true)
      expect(config.cacheSize).toBe(50)
    })

    it('should clear cache when caching is disabled', () => {
      registry.register('test', MockComponent1, (r) => ({ text: r }))
      registry.lookup('test') // Create cache entry

      registry.updateConfig({ enableCaching: false })

      const stats = registry.getStats()
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
    })
  })

  describe('TypeScript type safety', () => {
    it('should maintain type safety with generics', () => {
      interface WeatherProps {
        temp: number
        desc: string
      }

      const WeatherComponent: ComponentType<WeatherProps> = ({ temp, desc }) => (
        <div>{`${temp}°F - ${desc}`}</div>
      )

      const mapProps = (result: WeatherResult): WeatherProps => ({
        temp: result.temperature,
        desc: result.condition,
      })

      registry.register<WeatherResult, WeatherProps>(
        'weather',
        WeatherComponent,
        mapProps
      )

      const result = registry.lookup<WeatherResult, WeatherProps>('weather')
      const toolResult: WeatherResult = {
        temperature: 75,
        condition: 'Cloudy',
        location: 'NYC',
      }

      if (result.found && result.mapProps) {
        const props = result.mapProps(toolResult)
        expect(props.temp).toBe(75)
        expect(props.desc).toBe('Cloudy')
      }
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete workflow: register, lookup, unregister', () => {
      // Register
      registry.register('search', MockComponent1, (result: SearchResult) => ({
        text: `Found ${result.count} results for "${result.query}"`,
      }))

      // Lookup
      let lookup = registry.lookup<SearchResult, { text: string }>('search')
      expect(lookup.found).toBe(true)

      // Use mapper
      const toolResult: SearchResult = {
        query: 'AI Kit',
        results: ['result1', 'result2'],
        count: 2,
      }
      const props = lookup.mapProps!(toolResult)
      expect(props.text).toBe('Found 2 results for "AI Kit"')

      // Unregister
      registry.unregister('search')
      lookup = registry.lookup('search')
      expect(lookup.found).toBe(false)
    })

    it('should support multiple tools with variants', () => {
      // Register weather variants
      registry.register('weather', MockComponent1, (r: WeatherResult) => ({
        text: `${r.temperature}°F`,
      }))
      registry.register(
        'weather',
        MockComponent2,
        (r: WeatherResult) => ({ value: r.temperature }),
        { variant: 'temp-only' }
      )

      // Register search
      registry.register('search', MockComponent3, (r: SearchResult) => ({
        data: r.results,
      }))

      // Verify stats
      const stats = registry.getStats()
      expect(stats.totalComponents).toBe(3)
      expect(stats.totalTools).toBe(2)

      // Verify lookups
      expect(registry.has('weather')).toBe(true)
      expect(registry.has('weather', 'temp-only')).toBe(true)
      expect(registry.has('search')).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle invalid tool name types gracefully', () => {
      expect(() => {
        registry.register(null as any, MockComponent1, (r) => ({ text: r }))
      }).toThrow('Tool name must be a non-empty string')

      expect(() => {
        registry.register(123 as any, MockComponent1, (r) => ({ text: r }))
      }).toThrow('Tool name must be a non-empty string')
    })

    it('should handle missing component gracefully', () => {
      expect(() => {
        registry.register('test', undefined as any, (r) => ({ text: r }))
      }).toThrow('Component is required')
    })

    it('should handle invalid mapProps gracefully', () => {
      expect(() => {
        registry.register('test', MockComponent1, null as any)
      }).toThrow('mapProps must be a function')

      expect(() => {
        registry.register('test', MockComponent1, {} as any)
      }).toThrow('mapProps must be a function')
    })
  })
})
