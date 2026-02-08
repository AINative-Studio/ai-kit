# AI Kit CDN Usage Guide

Complete guide for using AI Kit packages from CDN without build tools.

## Table of Contents

- [Quick Start](#quick-start)
- [Available Packages](#available-packages)
- [CDN Providers](#cdn-providers)
- [Bundle Variants](#bundle-variants)
- [Security (SRI)](#security-sri)
- [Framework Integration](#framework-integration)
- [Bundle Size Reference](#bundle-size-reference)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)

## Quick Start

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Kit Quick Start</title>
</head>
<body>
    <!-- Load AI Kit Core -->
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>

    <script>
        // AI Kit is now available as AIKitCore
        console.log('AI Kit loaded:', AIKitCore);

        // Example: Use streaming
        const stream = new AIKitCore.AIStream({
            apiKey: 'your-api-key',
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello!' }]
        });
    </script>
</body>
</html>
```

### React

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Kit + React</title>
</head>
<body>
    <div id="root"></div>

    <!-- Dependencies -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <!-- AI Kit -->
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit@latest/dist/cdn/react.min.js"></script>

    <!-- Your app -->
    <script type="module">
        const { useAIStream } = AIKitReact;
        // Your React components here
    </script>
</body>
</html>
```

### Vue 3

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Kit + Vue</title>
</head>
<body>
    <div id="app"></div>

    <!-- Dependencies -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>

    <!-- AI Kit -->
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-vue@latest/dist/cdn/vue.min.js"></script>

    <script>
        const { useAIStream } = AIKitVue;
        // Your Vue app here
    </script>
</body>
</html>
```

## Available Packages

### @ainative/ai-kit-core

Framework-agnostic core functionality for AI applications.

**Global Variable:** `AIKitCore`

**Bundles:**
- `core.min.js` - Complete core bundle (~40KB gzipped)
- `streaming.min.js` - Streaming utilities only (~8KB gzipped)
- `agents.min.js` - Agent system only (~20KB gzipped)
- `context.min.js` - Context management only (~12KB gzipped)

### @ainative/ai-kit (React)

React hooks and components for AI applications.

**Global Variable:** `AIKitReact`

**Bundles:**
- `react.min.js` - Complete React bundle (~35KB gzipped)

**Dependencies:** React 18+, ReactDOM, AIKitCore

### @ainative/ai-kit-vue

Vue 3 composables for AI applications.

**Global Variable:** `AIKitVue`

**Bundles:**
- `vue.min.js` - Complete Vue bundle (~20KB gzipped)

**Dependencies:** Vue 3+, AIKitCore

## CDN Providers

### jsDelivr (Recommended)

Fast, reliable CDN with great global coverage.

```html
<!-- Latest version (auto-updates to latest release) -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"></script>

<!-- Specific version with SRI -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

**Benefits:**
- Global CDN with edge caching
- Automatic minification
- HTTPS by default
- npm package integration
- Version aliasing (`@latest`, `@0.1.x`)

### unpkg

Alternative CDN provider.

```html
<script src="https://unpkg.com/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
```

## Bundle Variants

Each package provides multiple bundle variants:

### Development vs Production

```html
<!-- Development (non-minified, with comments) -->
<script src=".../core.js"></script>

<!-- Production (minified, optimized) -->
<script src=".../core.min.js"></script>
```

### Modular Bundles

Load only what you need:

```html
<!-- Option 1: Full core bundle -->
<script src=".../core.min.js"></script>

<!-- Option 2: Individual modules -->
<script src=".../streaming.min.js"></script>
<script src=".../agents.min.js"></script>
```

**Size Comparison:**
- Full core: ~40KB gzipped
- Streaming only: ~8KB gzipped
- Agents only: ~20KB gzipped
- Context only: ~12KB gzipped

### Source Maps

Source maps are available for debugging:

```html
<script src=".../core.min.js"></script>
<!-- Automatically loads core.min.js.map when DevTools are open -->
```

## Security (SRI)

Use Subresource Integrity (SRI) to ensure bundle integrity.

### What is SRI?

SRI allows browsers to verify that files fetched from CDNs haven't been tampered with.

### How to Use SRI

1. **Get the integrity hash** from `dist/cdn/integrity.json`:

```json
{
  "core.min.js": {
    "integrity": "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux...",
    "size": 41234,
    "gzipSize": 12456
  }
}
```

2. **Add to script tag**:

```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
        crossorigin="anonymous"></script>
```

### Generating SRI Hashes

```bash
# Build CDN bundles with integrity hashes
pnpm build:cdn

# Check integrity.json
cat packages/core/dist/cdn/integrity.json
```

### Online SRI Generator

If you need to generate hashes manually:
- https://www.srihash.org/
- Input the CDN URL
- Copy the generated hash

## Framework Integration

### React Integration

#### Full Example

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Kit React App</title>
</head>
<body>
    <div id="root"></div>

    <!-- React -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <!-- AI Kit -->
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit@latest/dist/cdn/react.min.js"></script>

    <!-- Babel for JSX (dev only) -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <script type="text/babel">
        const { useState } = React;
        const { useAIStream } = AIKitReact;

        function App() {
            const [messages, setMessages] = useState([]);

            const { stream, isStreaming, error } = useAIStream({
                apiKey: 'your-api-key',
                model: 'gpt-3.5-turbo'
            });

            return (
                <div>
                    <h1>AI Chat</h1>
                    {isStreaming && <p>Streaming...</p>}
                    {error && <p>Error: {error.message}</p>}
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
```

#### Available Hooks

```javascript
const {
    useAIStream,      // Streaming responses
    useAIAgent,       // Agent interactions
    useAIContext,     // Context management
    useAISession,     // Session handling
} = AIKitReact;
```

### Vue 3 Integration

#### Full Example

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Kit Vue App</title>
</head>
<body>
    <div id="app"></div>

    <!-- Vue -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>

    <!-- AI Kit -->
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-vue@latest/dist/cdn/vue.min.js"></script>

    <script>
        const { createApp, ref } = Vue;
        const { useAIStream } = AIKitVue;

        createApp({
            setup() {
                const messages = ref([]);

                const { stream, isStreaming, error } = useAIStream({
                    apiKey: 'your-api-key',
                    model: 'gpt-3.5-turbo'
                });

                return { messages, isStreaming, error };
            },
            template: `
                <div>
                    <h1>AI Chat</h1>
                    <p v-if="isStreaming">Streaming...</p>
                    <p v-if="error">Error: {{ error.message }}</p>
                </div>
            `
        }).mount('#app');
    </script>
</body>
</html>
```

#### Available Composables

```javascript
const {
    useAIStream,      // Streaming responses
    useAIAgent,       // Agent interactions
    useAIContext,     // Context management
    useAISession,     // Session handling
} = AIKitVue;
```

## Bundle Size Reference

### Core Package

| Bundle | Uncompressed | Gzipped | Features |
|--------|-------------|---------|----------|
| `core.min.js` | ~120KB | ~40KB | Full core functionality |
| `streaming.min.js` | ~25KB | ~8KB | Streaming only |
| `agents.min.js` | ~60KB | ~20KB | Agents only |
| `context.min.js` | ~35KB | ~12KB | Context management |

### React Package

| Bundle | Uncompressed | Gzipped | Features |
|--------|-------------|---------|----------|
| `react.min.js` | ~100KB | ~35KB | All React hooks/components |

Note: Does not include React/ReactDOM (~130KB gzipped combined)

### Vue Package

| Bundle | Uncompressed | Gzipped | Features |
|--------|-------------|---------|----------|
| `vue.min.js` | ~60KB | ~20KB | All Vue composables |

Note: Does not include Vue (~50KB gzipped)

## Advanced Usage

### Loading Multiple Bundles

```html
<!-- Load core modules separately -->
<script src=".../streaming.min.js"></script>
<script src=".../agents.min.js"></script>
<script src=".../context.min.js"></script>

<script>
    // All available as separate globals
    const stream = new AIKitStreaming.AIStream(...);
    const agent = new AIKitAgents.Agent(...);
    const context = new AIKitContext.ContextManager(...);
</script>
```

### Lazy Loading

```javascript
// Load AI Kit only when needed
async function loadAIKit() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js';
        script.onload = () => resolve(window.AIKitCore);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Use it
button.addEventListener('click', async () => {
    const AIKit = await loadAIKit();
    const stream = new AIKit.AIStream(...);
});
```

### Version Pinning

```html
<!-- Always use exact versions in production -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"></script>

<!-- Semver ranges (not recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1/dist/cdn/core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0/dist/cdn/core.min.js"></script>
```

### ES Module Alternative

For modern browsers, you can use ES modules:

```html
<script type="module">
    import AIKit from 'https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/index.mjs';

    // Tree-shakeable imports
    const stream = new AIKit.AIStream(...);
</script>
```

## Best Practices

### 1. Production Checklist

- [ ] Use minified bundles (`.min.js`)
- [ ] Pin exact versions (no `@latest`)
- [ ] Include SRI hashes
- [ ] Add `crossorigin="anonymous"`
- [ ] Use HTTPS URLs
- [ ] Load from edge CDN (jsDelivr recommended)
- [ ] Test with CDN fallback

### 2. Performance Optimization

```html
<!-- Preconnect to CDN -->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">

<!-- Preload critical bundles -->
<link rel="preload" as="script"
      href="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js">

<!-- Async/defer for non-critical bundles -->
<script defer src=".../core.min.js"></script>
```

### 3. CDN Fallback

```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"></script>
<script>
    // Fallback to unpkg if jsDelivr fails
    if (typeof AIKitCore === 'undefined') {
        document.write('<script src="https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"><\/script>');
    }
</script>
```

### 4. Bundle Size Monitoring

```javascript
// Monitor bundle load performance
window.addEventListener('load', () => {
    const resources = performance.getEntriesByType('resource');
    const aiKitResources = resources.filter(r => r.name.includes('ai-kit'));

    aiKitResources.forEach(r => {
        console.log(`${r.name}: ${(r.transferSize / 1024).toFixed(2)} KB`);
    });
});
```

### 5. Browser Compatibility

```html
<!-- Check for required features -->
<script>
    if (!window.Promise || !window.fetch || !window.Symbol) {
        alert('Your browser is not supported. Please upgrade to a modern browser.');
    }
</script>
```

### 6. Error Handling

```html
<script src=".../core.min.js"
        onerror="alert('Failed to load AI Kit. Please check your connection.')">
</script>
```

## Troubleshooting

### Bundle Not Loading

1. Check browser console for errors
2. Verify CDN URL is correct
3. Check network connectivity
4. Try alternative CDN (unpkg)
5. Verify SRI hash matches

### Global Variable Undefined

```javascript
// Wait for bundle to load
window.addEventListener('load', () => {
    if (typeof AIKitCore !== 'undefined') {
        console.log('AI Kit loaded successfully');
    } else {
        console.error('AI Kit failed to load');
    }
});
```

### Version Conflicts

```html
<!-- Check loaded version -->
<script>
    console.log('AI Kit version:', AIKitCore.VERSION);
</script>
```

### CORS Issues

```html
<!-- Always include crossorigin for SRI -->
<script src="..."
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

## Migration from npm to CDN

### Before (npm)

```javascript
import { AIStream } from '@ainative/ai-kit-core';

const stream = new AIStream({ ... });
```

### After (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>

<script>
    const stream = new AIKitCore.AIStream({ ... });
</script>
```

## Support

- Documentation: https://ainative.studio/ai-kit
- GitHub: https://github.com/AINative-Studio/ai-kit
- Issues: https://github.com/AINative-Studio/ai-kit/issues
- Discord: https://discord.gg/ainative

## Related Resources

- [API Documentation](https://ainative.studio/ai-kit/api)
- [Examples](../examples/cdn/)
- [Changelog](../CHANGELOG.md)
- [Contributing](../CONTRIBUTING.md)
