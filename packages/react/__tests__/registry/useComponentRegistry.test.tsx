import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useComponentRegistry } from '../../src/registry/useComponentRegistry'
import { ComponentRegistry } from '../../src/registry/ComponentRegistry'

// Mock components
const MockComponent1 = ({ text }: { text: string }) => <div>{text}</div>
const MockComponent2 = ({ value }: { value: number }) => <div>{value}</div>
const MockComponent3 = ({ data }: { data: any }) => <div>{JSON.stringify(data)}</div>

interface WeatherResult {
  temperature: number
  condition: string
}

describe('useComponentRegistry', () => {
  describe('with global registry', () => {
    let registry: ComponentRegistry

    beforeEach(() => {
      // Get the global registry and clear it
      const { result } = renderHook(() => useComponentRegistry())
      registry = result.current.registry
      registry.clear()
    })

    it('should return registry methods', () => {
      const { result } = renderHook(() => useComponentRegistry())

      expect(typeof result.current.lookup).toBe('function')
      expect(typeof result.current.getComponent).toBe('function')
      expect(typeof result.current.getMapper).toBe('function')
      expect(typeof result.current.has).toBe('function')
      expect(typeof result.current.register).toBe('function')
      expect(typeof result.current.registerMapping).toBe('function')
      expect(typeof result.current.unregister).toBe('function')
      expect(typeof result.current.getToolNames).toBe('function')
      expect(typeof result.current.getVariants).toBe('function')
      expect(typeof result.current.getStats).toBe('function')
      expect(typeof result.current.clearCache).toBe('function')
      expect(result.current.registry).toBeInstanceOf(ComponentRegistry)
    })

    it('should register a component', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register(
          'weather',
          MockComponent1,
          (r: WeatherResult) => ({ text: `${r.temperature}°F` })
        )
      })

      expect(result.current.has('weather')).toBe(true)
    })

    it('should lookup a registered component', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register(
          'weather',
          MockComponent1,
          (r: WeatherResult) => ({ text: `${r.temperature}°F` })
        )
      })

      const lookup = result.current.lookup('weather')
      expect(lookup.found).toBe(true)
      expect(lookup.component).toBe(MockComponent1)
    })

    it('should get component by tool name', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register(
          'test',
          MockComponent2,
          (r: any) => ({ value: r })
        )
      })

      const component = result.current.getComponent('test')
      expect(component).toBe(MockComponent2)
    })

    it('should get mapper by tool name', () => {
      const { result } = renderHook(() => useComponentRegistry())
      const mapProps = (r: WeatherResult) => ({ text: `${r.temperature}°F` })

      act(() => {
        result.current.register('weather', MockComponent1, mapProps)
      })

      const mapper = result.current.getMapper('weather')
      expect(mapper).toBe(mapProps)
    })

    it('should register with variants', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register(
          'weather',
          MockComponent1,
          (r: any) => ({ text: r })
        )
        result.current.register(
          'weather',
          MockComponent2,
          (r: any) => ({ value: r }),
          { variant: 'compact' }
        )
      })

      expect(result.current.has('weather', 'default')).toBe(true)
      expect(result.current.has('weather', 'compact')).toBe(true)

      const variants = result.current.getVariants('weather')
      expect(variants).toContain('default')
      expect(variants).toContain('compact')
    })

    it('should register using mapping object', () => {
      const { result } = renderHook(() => useComponentRegistry())

      const mapping = {
        component: MockComponent3,
        mapProps: (r: any) => ({ data: r }),
      }

      act(() => {
        result.current.registerMapping('test', mapping)
      })

      expect(result.current.has('test')).toBe(true)
      const component = result.current.getComponent('test')
      expect(component).toBe(MockComponent3)
    })

    it('should unregister a component', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register(
          'test',
          MockComponent1,
          (r: any) => ({ text: r })
        )
      })

      expect(result.current.has('test')).toBe(true)

      act(() => {
        result.current.unregister('test')
      })

      expect(result.current.has('test')).toBe(false)
    })

    it('should get all tool names', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register('tool1', MockComponent1, (r: any) => ({ text: r }))
        result.current.register('tool2', MockComponent2, (r: any) => ({ value: r }))
        result.current.register('tool3', MockComponent3, (r: any) => ({ data: r }))
      })

      const toolNames = result.current.getToolNames()
      expect(toolNames).toContain('tool1')
      expect(toolNames).toContain('tool2')
      expect(toolNames).toContain('tool3')
    })

    it('should get registry stats', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register('tool1', MockComponent1, (r: any) => ({ text: r }))
        result.current.register('tool2', MockComponent2, (r: any) => ({ value: r }))
      })

      const stats = result.current.getStats()
      expect(stats.totalComponents).toBe(2)
      expect(stats.totalTools).toBe(2)
    })

    it('should clear cache', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register('test', MockComponent1, (r: any) => ({ text: r }))
      })

      // Create cache entry
      result.current.lookup('test')

      act(() => {
        result.current.clearCache()
      })

      const stats = result.current.getStats()
      expect(stats.cacheHits).toBe(0)
      expect(stats.cacheMisses).toBe(0)
    })

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useComponentRegistry())

      const initialLookup = result.current.lookup
      const initialRegister = result.current.register
      const initialGetComponent = result.current.getComponent

      rerender()

      expect(result.current.lookup).toBe(initialLookup)
      expect(result.current.register).toBe(initialRegister)
      expect(result.current.getComponent).toBe(initialGetComponent)
    })
  })

  describe('with custom registry', () => {
    it('should use custom registry instance', () => {
      const customRegistry = new ComponentRegistry({
        strictMode: true,
        enableCaching: false,
      })

      const { result } = renderHook(() =>
        useComponentRegistry({ registry: customRegistry })
      )

      expect(result.current.registry).toBe(customRegistry)

      const config = result.current.registry.getConfig()
      expect(config.strictMode).toBe(true)
      expect(config.enableCaching).toBe(false)
    })

    it('should isolate custom registry from global registry', () => {
      const customRegistry = new ComponentRegistry()

      const { result: globalResult } = renderHook(() => useComponentRegistry())
      const { result: customResult } = renderHook(() =>
        useComponentRegistry({ registry: customRegistry })
      )

      // Clear both registries
      act(() => {
        globalResult.current.registry.clear()
        customResult.current.registry.clear()
      })

      // Register in global registry
      act(() => {
        globalResult.current.register(
          'global-tool',
          MockComponent1,
          (r: any) => ({ text: r })
        )
      })

      // Register in custom registry
      act(() => {
        customResult.current.register(
          'custom-tool',
          MockComponent2,
          (r: any) => ({ value: r })
        )
      })

      // Verify isolation
      expect(globalResult.current.has('global-tool')).toBe(true)
      expect(globalResult.current.has('custom-tool')).toBe(false)

      expect(customResult.current.has('custom-tool')).toBe(true)
      expect(customResult.current.has('global-tool')).toBe(false)
    })
  })

  describe('integration with lookup options', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useComponentRegistry())
      result.current.registry.clear()
    })

    it('should lookup with variant option', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register('tool', MockComponent1, (r: any) => ({ text: r }))
        result.current.register(
          'tool',
          MockComponent2,
          (r: any) => ({ value: r }),
          { variant: 'alt' }
        )
      })

      const defaultLookup = result.current.lookup('tool')
      const altLookup = result.current.lookup('tool', { variant: 'alt' })

      expect(defaultLookup.component).toBe(MockComponent1)
      expect(altLookup.component).toBe(MockComponent2)
    })

    it('should handle throwOnMissing option', () => {
      const { result } = renderHook(() => useComponentRegistry())

      expect(() => {
        result.current.lookup('nonexistent', { throwOnMissing: true })
      }).toThrow('Component not found for tool: nonexistent')
    })
  })

  describe('integration with register options', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useComponentRegistry())
      result.current.registry.clear()
    })

    it('should register with validation', () => {
      const { result } = renderHook(() => useComponentRegistry())
      const validate = vi.fn((props) => props.text.length > 0)

      act(() => {
        result.current.register(
          'test',
          MockComponent1,
          (r: any) => ({ text: r }),
          { validate }
        )
      })

      const lookup = result.current.lookup('test')
      expect(lookup.validate).toBe(validate)
    })

    it('should register with override', () => {
      const { result } = renderHook(() => useComponentRegistry())

      act(() => {
        result.current.register('test', MockComponent1, (r: any) => ({ text: r }))
      })

      act(() => {
        result.current.register(
          'test',
          MockComponent2,
          (r: any) => ({ value: r }),
          { override: true }
        )
      })

      const component = result.current.getComponent('test')
      expect(component).toBe(MockComponent2)
    })
  })

  describe('type safety', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useComponentRegistry())
      result.current.registry.clear()
    })

    it('should maintain type safety with generics', () => {
      const { result } = renderHook(() => useComponentRegistry())

      interface Props {
        temp: number
        desc: string
      }

      act(() => {
        result.current.register<WeatherResult, Props>(
          'weather',
          MockComponent1 as any,
          (r: WeatherResult): Props => ({
            temp: r.temperature,
            desc: r.condition,
          })
        )
      })

      const lookup = result.current.lookup<WeatherResult, Props>('weather')
      const toolResult: WeatherResult = { temperature: 70, condition: 'Sunny' }

      if (lookup.found && lookup.mapProps) {
        const props = lookup.mapProps(toolResult)
        expect(props.temp).toBe(70)
        expect(props.desc).toBe('Sunny')
      }
    })
  })

  describe('complete workflow scenarios', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useComponentRegistry())
      result.current.registry.clear()
    })

    it('should handle complete registration and usage flow', () => {
      const { result } = renderHook(() => useComponentRegistry())

      // Register component
      act(() => {
        result.current.register(
          'weather',
          MockComponent1,
          (r: WeatherResult) => ({
            text: `${r.temperature}°F - ${r.condition}`,
          })
        )
      })

      // Verify registration
      expect(result.current.has('weather')).toBe(true)

      // Lookup and use
      const lookup = result.current.lookup<WeatherResult, { text: string }>('weather')
      expect(lookup.found).toBe(true)

      const toolResult: WeatherResult = {
        temperature: 72,
        condition: 'Cloudy',
      }

      const props = lookup.mapProps!(toolResult)
      expect(props.text).toBe('72°F - Cloudy')

      // Get stats
      const stats = result.current.getStats()
      expect(stats.totalComponents).toBe(1)
      expect(stats.totalTools).toBe(1)

      // Unregister
      act(() => {
        result.current.unregister('weather')
      })

      expect(result.current.has('weather')).toBe(false)
    })

    it('should handle multiple components with variants', () => {
      const { result } = renderHook(() => useComponentRegistry())

      // Register multiple variants
      act(() => {
        result.current.register('display', MockComponent1, (r: any) => ({ text: r }))
        result.current.register(
          'display',
          MockComponent2,
          (r: any) => ({ value: r }),
          { variant: 'compact' }
        )
        result.current.register(
          'display',
          MockComponent3,
          (r: any) => ({ data: r }),
          { variant: 'detailed' }
        )
      })

      // Verify all variants exist
      const variants = result.current.getVariants('display')
      expect(variants).toHaveLength(3)

      // Test each variant
      const defaultComp = result.current.getComponent('display')
      const compactComp = result.current.getComponent('display', { variant: 'compact' })
      const detailedComp = result.current.getComponent('display', {
        variant: 'detailed',
      })

      expect(defaultComp).toBe(MockComponent1)
      expect(compactComp).toBe(MockComponent2)
      expect(detailedComp).toBe(MockComponent3)

      // Unregister specific variant
      act(() => {
        result.current.unregister('display', 'compact')
      })

      expect(result.current.has('display', 'compact')).toBe(false)
      expect(result.current.has('display', 'default')).toBe(true)
      expect(result.current.has('display', 'detailed')).toBe(true)
    })
  })
})
