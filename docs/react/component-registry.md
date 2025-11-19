# Component Registry

The Component Registry provides a type-safe way to map tool results to UI components in your React application. It enables dynamic component lookup and rendering based on tool names, making it easy to build extensible AI-powered interfaces.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [TypeScript Best Practices](#typescript-best-practices)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)

## Overview

The Component Registry solves the problem of dynamically selecting and rendering components based on AI tool outputs. Instead of writing complex switch statements or if-else chains, you register components with tool names and let the registry handle the mapping.

### Key Features

- **Type-Safe**: Full TypeScript support with generics
- **Dynamic Lookup**: Runtime component resolution by tool name
- **Variants**: Support for multiple component variants per tool
- **Caching**: Built-in LRU cache for performance
- **Validation**: Optional prop validation
- **Flexible**: Use global registry or create custom instances

## Installation

The Component Registry is included in the `@ainative/ai-kit` package:

```bash
npm install @ainative/ai-kit
# or
pnpm add @ainative/ai-kit
# or
yarn add @ainative/ai-kit
```

## Quick Start

### Basic Usage

```tsx
import { useComponentRegistry } from '@ainative/ai-kit'

// Define your component
const WeatherCard = ({ temperature, condition }: {
  temperature: number
  condition: string
}) => (
  <div className="weather-card">
    <h3>{temperature}°F</h3>
    <p>{condition}</p>
  </div>
)

function App() {
  const { register, lookup } = useComponentRegistry()

  // Register component with tool name
  register(
    'weather',
    WeatherCard,
    (toolResult) => ({
      temperature: toolResult.temp,
      condition: toolResult.condition
    })
  )

  // Later, lookup and render
  const { component: Component, mapProps } = lookup('weather')
  const toolResult = { temp: 72, condition: 'Sunny' }
  const props = mapProps(toolResult)

  return <Component {...props} />
}
```

### Using the Global Registry

```tsx
import { globalRegistry } from '@ainative/ai-kit'

// Register components at app initialization
globalRegistry.register(
  'weather',
  WeatherCard,
  (result) => ({ temperature: result.temp, condition: result.condition })
)

globalRegistry.register(
  'search',
  SearchResults,
  (result) => ({ results: result.items, query: result.query })
)

// Use anywhere in your app
function ToolRenderer({ toolName, toolResult }: Props) {
  const { component: Component, mapProps } = globalRegistry.lookup(toolName)

  if (!Component) {
    return <div>No component found for {toolName}</div>
  }

  const props = mapProps(toolResult)
  return <Component {...props} />
}
```

## API Reference

### `useComponentRegistry(options?)`

React hook for accessing the component registry.

#### Parameters

- `options.registry?`: Optional custom registry instance

#### Returns

An object with the following methods:

- `register()`: Register a component
- `registerMapping()`: Register using a mapping object
- `lookup()`: Lookup a component by tool name
- `getComponent()`: Get component only
- `getMapper()`: Get prop mapper only
- `has()`: Check if component is registered
- `unregister()`: Remove a registration
- `getToolNames()`: Get all registered tool names
- `getVariants()`: Get all variants for a tool
- `getStats()`: Get registry statistics
- `clearCache()`: Clear lookup cache
- `registry`: The registry instance

### `ComponentRegistry`

Class for managing component registrations.

#### Constructor

```ts
new ComponentRegistry(config?: RegistryConfig)
```

**Config Options:**

- `strictMode?: boolean` - Throw errors for missing components (default: false)
- `fallbackComponent?: ComponentType` - Default component for missing lookups
- `enableCaching?: boolean` - Enable lookup caching (default: true)
- `cacheSize?: number` - Maximum cache entries (default: 100)

#### Methods

##### `register<TToolResult, TProps>()`

```ts
register(
  toolName: string,
  component: ComponentType<TProps>,
  mapProps: PropMapper<TToolResult, TProps>,
  options?: RegisterOptions
): void
```

Register a component with a tool name.

**Parameters:**

- `toolName`: Unique identifier for the tool
- `component`: React component to render
- `mapProps`: Function to map tool results to component props
- `options.variant?`: Variant name for multiple components per tool
- `options.validate?`: Optional prop validation function
- `options.override?`: Allow overriding existing registration

**Example:**

```ts
registry.register(
  'weather',
  WeatherCard,
  (result) => ({
    temperature: result.temp,
    condition: result.condition
  }),
  { variant: 'compact' }
)
```

##### `lookup<TToolResult, TProps>()`

```ts
lookup(
  toolName: string,
  options?: LookupOptions
): LookupResult<TToolResult, TProps>
```

Lookup a component by tool name.

**Parameters:**

- `toolName`: Tool identifier
- `options.variant?`: Specific variant to retrieve
- `options.throwOnMissing?`: Throw error if not found

**Returns:**

```ts
{
  component: ComponentType<TProps> | null
  mapProps: PropMapper<TToolResult, TProps> | null
  found: boolean
  validate?: (props: TProps) => boolean
}
```

##### Other Methods

- `getComponent(toolName, options?)`: Get component only
- `getMapper(toolName, options?)`: Get mapper only
- `has(toolName, variant?)`: Check if registered
- `unregister(toolName, variant?)`: Remove registration
- `getToolNames()`: List all tool names
- `getVariants(toolName)`: List variants for a tool
- `clear()`: Clear all registrations
- `getStats()`: Get registry statistics
- `clearCache()`: Clear lookup cache
- `updateConfig(config)`: Update configuration

### Type Definitions

#### `PropMapper<TToolResult, TProps>`

```ts
type PropMapper<TToolResult, TProps> = (toolResult: TToolResult) => TProps
```

Function that transforms tool results into component props.

#### `ComponentMapping<TToolResult, TProps>`

```ts
interface ComponentMapping<TToolResult, TProps> {
  component: ComponentType<TProps>
  mapProps: PropMapper<TToolResult, TProps>
  variant?: string
  validate?: (props: TProps) => boolean
}
```

Complete component mapping configuration.

## TypeScript Best Practices

### 1. Define Type-Safe Interfaces

```ts
// Define tool result interface
interface WeatherToolResult {
  temperature: number
  condition: string
  humidity: number
  location: string
}

// Define component props interface
interface WeatherCardProps {
  temp: number
  desc: string
  place: string
}

// Type-safe registration
registry.register<WeatherToolResult, WeatherCardProps>(
  'weather',
  WeatherCard,
  (result) => ({
    temp: result.temperature,
    desc: result.condition,
    place: result.location
  })
)
```

### 2. Type-Safe Lookup

```ts
const { component, mapProps, found } = registry.lookup<
  WeatherToolResult,
  WeatherCardProps
>('weather')

if (found && component && mapProps) {
  const toolResult: WeatherToolResult = {
    temperature: 72,
    condition: 'Sunny',
    humidity: 45,
    location: 'San Francisco'
  }

  const props = mapProps(toolResult)
  // props is correctly typed as WeatherCardProps
}
```

### 3. Generic Component Renderer

```tsx
interface ToolRendererProps<T = any> {
  toolName: string
  toolResult: T
  variant?: string
}

function ToolRenderer<T>({ toolName, toolResult, variant }: ToolRendererProps<T>) {
  const { lookup } = useComponentRegistry()
  const { component: Component, mapProps, found } = lookup(toolName, { variant })

  if (!found || !Component || !mapProps) {
    return <div>Unknown tool: {toolName}</div>
  }

  const props = mapProps(toolResult)
  return <Component {...props} />
}
```

## Advanced Usage

### Component Variants

Register multiple UI variants for the same tool:

```tsx
// Default variant
registry.register(
  'weather',
  WeatherCardDetailed,
  (r) => ({ temperature: r.temp, condition: r.condition, humidity: r.humidity })
)

// Compact variant
registry.register(
  'weather',
  WeatherCardCompact,
  (r) => ({ temp: r.temp }),
  { variant: 'compact' }
)

// Icon variant
registry.register(
  'weather',
  WeatherIcon,
  (r) => ({ icon: getWeatherIcon(r.condition) }),
  { variant: 'icon' }
)

// Use specific variant
const { component } = registry.lookup('weather', { variant: 'compact' })
```

### Prop Validation

Add validation to ensure component props are correct:

```tsx
registry.register(
  'weather',
  WeatherCard,
  (result) => ({
    temperature: result.temp,
    condition: result.condition
  }),
  {
    validate: (props) => {
      return (
        typeof props.temperature === 'number' &&
        props.temperature >= -100 &&
        props.temperature <= 150 &&
        props.condition.length > 0
      )
    }
  }
)

// Use validation
const { component, mapProps, validate } = registry.lookup('weather')
const props = mapProps(toolResult)

if (validate && !validate(props)) {
  console.error('Invalid props for weather component')
}
```

### Custom Registry Instances

Create isolated registries for different contexts:

```tsx
// Create registries for different environments
const devRegistry = new ComponentRegistry({
  strictMode: true,
  enableCaching: false
})

const prodRegistry = new ComponentRegistry({
  strictMode: false,
  enableCaching: true,
  cacheSize: 200
})

// Use in components
function DevToolPanel() {
  const { register, lookup } = useComponentRegistry({
    registry: devRegistry
  })
  // ...
}
```

### Registry Statistics

Monitor registry usage:

```tsx
const stats = registry.getStats()

console.log(`Total components: ${stats.totalComponents}`)
console.log(`Total tools: ${stats.totalTools}`)
console.log(`Cache hits: ${stats.cacheHits}`)
console.log(`Cache misses: ${stats.cacheMisses}`)
console.log(`Registered tools: ${stats.registeredTools.join(', ')}`)
```

### Dynamic Registration

Register components based on runtime configuration:

```tsx
interface ToolConfig {
  name: string
  component: ComponentType<any>
  mapper: PropMapper<any, any>
}

const toolConfigs: ToolConfig[] = [
  { name: 'weather', component: WeatherCard, mapper: mapWeather },
  { name: 'search', component: SearchResults, mapper: mapSearch },
  { name: 'calculator', component: Calculator, mapper: mapCalculator }
]

function initializeRegistry(registry: ComponentRegistry, configs: ToolConfig[]) {
  configs.forEach(({ name, component, mapper }) => {
    registry.register(name, component, mapper)
  })
}

initializeRegistry(globalRegistry, toolConfigs)
```

## Examples

### Example 1: AI Chat with Tool Results

```tsx
import { useComponentRegistry } from '@ainative/ai-kit'

interface ToolResult {
  toolName: string
  data: any
}

function ChatMessage({ message }: { message: { role: string, toolResults?: ToolResult[] } }) {
  const { lookup } = useComponentRegistry()

  return (
    <div className="message">
      {message.toolResults?.map((result, idx) => {
        const { component: Component, mapProps, found } = lookup(result.toolName)

        if (!found || !Component || !mapProps) {
          return <div key={idx}>Unsupported tool: {result.toolName}</div>
        }

        const props = mapProps(result.data)
        return <Component key={idx} {...props} />
      })}
    </div>
  )
}
```

### Example 2: Plugin System

```tsx
interface Plugin {
  name: string
  component: ComponentType<any>
  mapProps: PropMapper<any, any>
}

function PluginManager({ plugins }: { plugins: Plugin[] }) {
  const { register, getToolNames } = useComponentRegistry()

  useEffect(() => {
    plugins.forEach(plugin => {
      register(plugin.name, plugin.component, plugin.mapProps)
    })
  }, [plugins])

  const registeredPlugins = getToolNames()

  return (
    <div>
      <h3>Registered Plugins:</h3>
      <ul>
        {registeredPlugins.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Example 3: Conditional Rendering with Variants

```tsx
function AdaptiveToolRenderer({
  toolName,
  toolResult,
  screenSize
}: {
  toolName: string
  toolResult: any
  screenSize: 'mobile' | 'tablet' | 'desktop'
}) {
  const { lookup } = useComponentRegistry()

  // Select variant based on screen size
  const variant = screenSize === 'mobile' ? 'compact' :
                  screenSize === 'tablet' ? 'medium' : 'detailed'

  const { component: Component, mapProps } = lookup(toolName, { variant })

  if (!Component || !mapProps) {
    // Fallback to default variant
    const fallback = lookup(toolName)
    if (!fallback.component) return null

    const props = fallback.mapProps!(toolResult)
    return <fallback.component {...props} />
  }

  const props = mapProps(toolResult)
  return <Component {...props} />
}
```

### Example 4: Testing with Custom Registry

```tsx
import { describe, it, expect } from 'vitest'
import { ComponentRegistry } from '@ainative/ai-kit'

describe('Tool Renderer', () => {
  it('should render weather component', () => {
    const testRegistry = new ComponentRegistry()

    testRegistry.register(
      'weather',
      ({ temp }: { temp: number }) => <div>{temp}°F</div>,
      (result: any) => ({ temp: result.temperature })
    )

    const { component: Component, mapProps } = testRegistry.lookup('weather')
    const props = mapProps({ temperature: 72 })

    // Render and assert
    expect(Component).toBeDefined()
    expect(props.temp).toBe(72)
  })
})
```

## Best Practices

1. **Register Early**: Register components during app initialization or in a provider
2. **Use TypeScript**: Leverage type safety with generics for tool results and props
3. **Validate Props**: Add validation for critical components
4. **Handle Missing Components**: Always check `found` or provide a fallback
5. **Cache Wisely**: Enable caching in production, disable in development/testing
6. **Namespace Tool Names**: Use consistent naming like `weather:forecast`, `weather:current`
7. **Document Mappings**: Comment your prop mappers to explain transformations
8. **Test Variants**: Ensure all variants are registered and render correctly
9. **Monitor Statistics**: Use `getStats()` to track registry usage
10. **Clean Up**: Unregister components when plugins/features are disabled

## Performance Tips

- Enable caching in production (enabled by default)
- Adjust cache size based on your tool count
- Use variants instead of separate tool names when possible
- Validate props only when necessary (validation is optional)
- Clear cache when hot-reloading in development

## Troubleshooting

### Component Not Found

```tsx
// Problem: Component returns null
const { component } = registry.lookup('weather')
// component is null

// Solution 1: Check if registered
if (!registry.has('weather')) {
  console.error('Weather component not registered')
}

// Solution 2: Use fallback
const { component = DefaultComponent } = registry.lookup('weather')

// Solution 3: Enable strict mode to catch errors early
const registry = new ComponentRegistry({ strictMode: true })
```

### Type Mismatches

```tsx
// Problem: Props don't match component
interface WeatherProps {
  temperature: number  // Component expects this
}

const mapper = (result: any) => ({
  temp: result.value  // But we're providing 'temp'
})

// Solution: Match prop names exactly
const mapper = (result: any) => ({
  temperature: result.value  // Now it matches
})
```

### Cache Issues

```tsx
// Problem: Updates not reflecting
registry.register('weather', WeatherCard, mapper)
registry.register('weather', UpdatedWeatherCard, mapper, { override: true })
// Old component still returned

// Solution: Cache is automatically invalidated on register
// If issues persist, manually clear:
registry.clearCache()
```

## Related Documentation

- [AI Stream Hook](/docs/react/ai-stream.md)
- [TypeScript Guide](/docs/typescript.md)
- [Testing Guide](/docs/testing.md)

## Support

For issues, questions, or contributions, visit our [GitHub repository](https://github.com/AINative-Studio/ai-kit).
