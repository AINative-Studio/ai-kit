# CDN Usage Guide

AI Kit packages are available via CDN for direct browser usage without a build step. This guide covers how to use AI Kit packages through CDN services like unpkg and jsdelivr.

## Table of Contents

- [Quick Start](#quick-start)
- [Available Packages](#available-packages)
- [CDN Services](#cdn-services)
- [Global Variables](#global-variables)
- [Usage Examples](#usage-examples)
- [Version Pinning](#version-pinning)
- [Bundle Sizes](#bundle-sizes)
- [Browser Support](#browser-support)
- [Security Considerations](#security-considerations)

## Quick Start

Include AI Kit Core directly in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Kit CDN Example</title>
</head>
<body>
  <!-- Load AI Kit Core from CDN -->
  <script src="https://unpkg.com/@ainative/ai-kit-core@latest/dist/cdn/ai-kit-core.global.js"></script>

  <script>
    // Access via global variable
    const { createAgent } = AINativeCore;

    // Use AI Kit functionality
    const agent = createAgent({
      model: 'gpt-4',
      // ... configuration
    });
  </script>
</body>
</html>
```

## Available Packages

### Core Package

**Package:** `@ainative/ai-kit-core`
**Global Variable:** `AINativeCore`
**CDN Path:** `dist/cdn/ai-kit-core.global.js`

Core functionality including streaming, agents, state management, and LLM primitives.

### React Package

**Package:** `@ainative/ai-kit` (React)
**Global Variable:** `AINativeReact`
**CDN Path:** `dist/cdn/ai-kit-react.global.js`

React hooks and components for AI-powered applications.

**Dependencies:** Requires React and ReactDOM to be loaded first.

### Vue Package

**Package:** `@ainative/ai-kit-vue`
**Global Variable:** `AINativeVue`
**CDN Path:** `dist/cdn/ai-kit-vue.global.js`

Vue 3 composables for AI-powered applications.

**Dependencies:** Requires Vue 3 to be loaded first.

### Svelte Package

**Package:** `@ainative/ai-kit-svelte`
**Global Variable:** `AINativeSvelte`
**CDN Path:** `dist/cdn/ai-kit-svelte.global.js`

Svelte stores and actions for AI-powered applications.

**Dependencies:** Requires Svelte to be loaded first.

## CDN Services

AI Kit packages are available through multiple CDN providers:

### unpkg

```html
<!-- Latest version -->
<script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>

<!-- Specific version -->
<script src="https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/cdn/ai-kit-core.global.js"></script>

<!-- With sourcemap -->
<script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>
```

### jsdelivr

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>

<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/ai-kit-core.global.js"></script>

<!-- Minified (already minified by default) -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>
```

## Global Variables

Each package exposes a global variable on the `window` object:

| Package | Global Variable | Access Example |
|---------|----------------|----------------|
| `@ainative/ai-kit-core` | `AINativeCore` | `window.AINativeCore` |
| `@ainative/ai-kit` (React) | `AINativeReact` | `window.AINativeReact` |
| `@ainative/ai-kit-vue` | `AINativeVue` | `window.AINativeVue` |
| `@ainative/ai-kit-svelte` | `AINativeSvelte` | `window.AINativeSvelte` |

## Usage Examples

### Core Package Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Kit Core - CDN Example</title>
</head>
<body>
  <div id="output"></div>

  <script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>
  <script>
    const { createStream } = AINativeCore;

    async function streamExample() {
      const stream = createStream({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: 'Hello, AI!' }
        ]
      });

      const output = document.getElementById('output');

      for await (const chunk of stream) {
        output.textContent += chunk.content;
      }
    }

    streamExample();
  </script>
</body>
</html>
```

### React Package Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Kit React - CDN Example</title>
</head>
<body>
  <div id="root"></div>

  <!-- Load React dependencies first -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Load AI Kit Core -->
  <script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>

  <!-- Load AI Kit React -->
  <script src="https://unpkg.com/@ainative/ai-kit/dist/cdn/ai-kit-react.global.js"></script>

  <script>
    const { useChat } = AINativeReact;
    const { createElement } = React;
    const { render } = ReactDOM;

    function ChatComponent() {
      const { messages, sendMessage, isLoading } = useChat({
        model: 'gpt-4'
      });

      return createElement('div', null,
        messages.map((msg, i) =>
          createElement('div', { key: i }, msg.content)
        ),
        createElement('button', {
          onClick: () => sendMessage('Hello!'),
          disabled: isLoading
        }, 'Send')
      );
    }

    render(
      createElement(ChatComponent),
      document.getElementById('root')
    );
  </script>
</body>
</html>
```

### Vue Package Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Kit Vue - CDN Example</title>
</head>
<body>
  <div id="app">
    <div v-for="msg in messages" :key="msg.id">{{ msg.content }}</div>
    <button @click="send" :disabled="loading">Send Message</button>
  </div>

  <!-- Load Vue 3 -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>

  <!-- Load AI Kit Core -->
  <script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>

  <!-- Load AI Kit Vue -->
  <script src="https://unpkg.com/@ainative/ai-kit-vue/dist/cdn/ai-kit-vue.global.js"></script>

  <script>
    const { createApp } = Vue;
    const { useChat } = AINativeVue;

    createApp({
      setup() {
        const { messages, sendMessage, isLoading: loading } = useChat({
          model: 'gpt-4'
        });

        const send = () => sendMessage('Hello from Vue!');

        return { messages, send, loading };
      }
    }).mount('#app');
  </script>
</body>
</html>
```

## Version Pinning

For production use, always pin to a specific version:

```html
<!-- Good: Pinned version -->
<script src="https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/cdn/ai-kit-core.global.js"></script>

<!-- Avoid: Latest version (unpredictable) -->
<script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>
```

### Semantic Versioning

You can also pin to major or minor versions:

```html
<!-- Pin to major version 0.x.x -->
<script src="https://unpkg.com/@ainative/ai-kit-core@^0/dist/cdn/ai-kit-core.global.js"></script>

<!-- Pin to minor version 0.1.x -->
<script src="https://unpkg.com/@ainative/ai-kit-core@~0.1/dist/cdn/ai-kit-core.global.js"></script>
```

## Bundle Sizes

All bundles are optimized for CDN delivery with minification and tree-shaking:

| Package | Uncompressed | Gzipped | Brotli |
|---------|-------------|---------|--------|
| `@ainative/ai-kit-core` | ~300 KB | <100 KB | <90 KB |
| `@ainative/ai-kit` (React) | ~150 KB | <50 KB | <45 KB |
| `@ainative/ai-kit-vue` | ~100 KB | <35 KB | <30 KB |
| `@ainative/ai-kit-svelte` | ~100 KB | <35 KB | <30 KB |

**Note:** Sizes include all bundled dependencies but exclude peer dependencies (React, Vue, Svelte, etc.).

### Performance Recommendations

1. **Use HTTP/2 or HTTP/3** for parallel loading
2. **Enable Brotli compression** when available (better than gzip)
3. **Cache bundles** with appropriate cache headers
4. **Load async** when possible using `async` or `defer` attributes
5. **Consider bundle splitting** for large applications

## Browser Support

CDN bundles support:

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- iOS Safari: Last 2 versions

**Minimum Requirements:**
- ES2020 features
- Async/await support
- Fetch API
- Promises

For older browsers, use a polyfill service like Polyfill.io:

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=es2020"></script>
```

## Security Considerations

### Subresource Integrity (SRI)

For production use, always use SRI hashes to ensure bundle integrity:

```html
<script
  src="https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/cdn/ai-kit-core.global.js"
  integrity="sha384-..."
  crossorigin="anonymous">
</script>
```

Generate SRI hashes using:

```bash
# Using openssl
curl -s https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/cdn/ai-kit-core.global.js | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A

# Using Node.js
npx sri-gen https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/cdn/ai-kit-core.global.js
```

### Content Security Policy (CSP)

If using CSP, add CDN domains to your policy:

```html
<meta http-equiv="Content-Security-Policy"
  content="script-src 'self' https://unpkg.com https://cdn.jsdelivr.net;">
```

### API Keys

**Never expose API keys in client-side code.** Always use a backend proxy:

```javascript
// Bad: API key exposed
const agent = createAgent({
  apiKey: 'sk-...' // DON'T DO THIS
});

// Good: Use backend proxy
const agent = createAgent({
  baseURL: '/api/ai-proxy' // Proxy handles authentication
});
```

## Loading Strategies

### Blocking Load (Default)

```html
<script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>
```

### Async Load (Recommended)

```html
<script
  async
  src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"
  onload="initAIKit()">
</script>
```

### Deferred Load

```html
<script
  defer
  src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js">
</script>
```

### Module Import (Modern Browsers)

```html
<script type="module">
  import('https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js')
    .then(() => {
      const { createAgent } = AINativeCore;
      // Use the library
    });
</script>
```

## Troubleshooting

### Bundle Not Loading

1. Check browser console for errors
2. Verify URL is correct and accessible
3. Check for CORS issues
4. Ensure dependencies are loaded in correct order

### Global Variable Undefined

```javascript
// Wait for script to load
window.addEventListener('load', () => {
  if (typeof AINativeCore !== 'undefined') {
    // Safe to use
    const { createAgent } = AINativeCore;
  }
});
```

### Version Conflicts

When using multiple packages, ensure compatible versions:

```html
<!-- Use same version across packages -->
<script src="https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/cdn/ai-kit-core.global.js"></script>
<script src="https://unpkg.com/@ainative/ai-kit@0.1.4/dist/cdn/ai-kit-react.global.js"></script>
```

## Migration from NPM

If migrating from NPM to CDN:

**Before (NPM):**
```javascript
import { createAgent } from '@ainative/ai-kit-core';
```

**After (CDN):**
```html
<script src="https://unpkg.com/@ainative/ai-kit-core/dist/cdn/ai-kit-core.global.js"></script>
<script>
  const { createAgent } = AINativeCore;
</script>
```

## Additional Resources

- [API Documentation](../api/README.md)
- [Examples Repository](https://github.com/AINative-Studio/ai-kit-examples)
- [CDN Provider Documentation](https://unpkg.com/)
- [Bundle Analysis Tool](https://bundlephobia.com/)

## Support

For issues or questions:
- [GitHub Issues](https://github.com/AINative-Studio/ai-kit/issues)
- [Discord Community](https://discord.com/invite/paipalooza)
- [Documentation](https://ainative.studio/ai-kit)
