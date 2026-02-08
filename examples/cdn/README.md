# AI Kit CDN Examples

This directory contains examples demonstrating how to use AI Kit directly from CDN without any build tools.

## Examples

### 1. Vanilla JavaScript (`vanilla.html`)
Basic usage of AI Kit with plain JavaScript.

```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
```

### 2. React (`react.html`)
Using AI Kit with React from CDN.

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit@latest/dist/cdn/react.min.js"></script>
```

### 3. Vue 3 (`vue.html`)
Using AI Kit with Vue 3 from CDN.

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-vue@latest/dist/cdn/vue.min.js"></script>
```

## Running the Examples

### Option 1: Using Python
```bash
cd examples/cdn
python3 -m http.server 8000
```

Then open http://localhost:8000/vanilla.html in your browser.

### Option 2: Using Node.js
```bash
npx serve examples/cdn
```

### Option 3: Using VS Code Live Server
1. Open the example file in VS Code
2. Right-click and select "Open with Live Server"

## CDN Providers

AI Kit bundles are available from multiple CDN providers:

### jsDelivr (Recommended)
```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>

<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"></script>

<!-- With SRI integrity hash -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

### unpkg
```html
<script src="https://unpkg.com/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
```

## Available Bundles

### Core Package (`@ainative/ai-kit-core`)
- `core.js` - Full core bundle (non-minified)
- `core.min.js` - Minified core bundle (~40KB gzipped)
- `streaming.js` - Streaming utilities only
- `streaming.min.js` - Minified streaming
- `agents.js` - Agent system only
- `agents.min.js` - Minified agents
- `context.js` - Context management only
- `context.min.js` - Minified context

All bundles include source maps (`.js.map`).

### React Package (`@ainative/ai-kit`)
- `react.js` - React hooks and components (non-minified)
- `react.min.js` - Minified React bundle

Requires: React 18+, ReactDOM, AIKitCore

### Vue Package (`@ainative/ai-kit-vue`)
- `vue.js` - Vue 3 composables (non-minified)
- `vue.min.js` - Minified Vue bundle

Requires: Vue 3+, AIKitCore

## Subresource Integrity (SRI)

For production use, always include integrity hashes to ensure bundle integrity:

```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"
        integrity="sha384-HASH_HERE"
        crossorigin="anonymous"></script>
```

Integrity hashes are available in `dist/cdn/integrity.json` for each package.

## Global Variables

When loaded from CDN, AI Kit exposes the following global variables:

- `AIKitCore` - Core functionality
- `AIKitStreaming` - Streaming utilities (when loaded separately)
- `AIKitAgents` - Agent system (when loaded separately)
- `AIKitContext` - Context management (when loaded separately)
- `AIKitReact` - React hooks and components
- `AIKitVue` - Vue 3 composables

## Browser Support

AI Kit CDN bundles support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern browsers with ES2020 support

## Performance Tips

1. **Use minified bundles** in production (`.min.js`)
2. **Load from CDN** for better caching
3. **Use specific versions** instead of `@latest` in production
4. **Include SRI hashes** for security
5. **Load only what you need** - use separate bundles for streaming, agents, etc.

## Example Usage

### Vanilla JavaScript
```javascript
// AI Kit is available globally as AIKitCore
const stream = new AIKitCore.AIStream({
  apiKey: 'your-api-key',
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

### React
```javascript
// Use React hooks from AIKitReact
const { useAIStream } = AIKitReact;

function ChatComponent() {
  const { stream, isStreaming } = useAIStream({
    apiKey: 'your-api-key',
    model: 'gpt-3.5-turbo'
  });

  return (
    <div>
      {isStreaming && <p>Streaming...</p>}
    </div>
  );
}
```

### Vue 3
```javascript
// Use Vue composables from AIKitVue
const { useAIStream } = AIKitVue;

export default {
  setup() {
    const { stream, isStreaming } = useAIStream({
      apiKey: 'your-api-key',
      model: 'gpt-3.5-turbo'
    });

    return { stream, isStreaming };
  }
}
```

## Building Custom Bundles

If you need a custom bundle configuration:

1. Clone the AI Kit repository
2. Modify `tsup.cdn.config.ts` in the package you want to customize
3. Run `pnpm build:cdn` to build custom bundles
4. Use the generated bundles in `dist/cdn/`

## Support

For issues or questions:
- GitHub Issues: https://github.com/AINative-Studio/ai-kit/issues
- Documentation: https://ainative.studio/ai-kit
- Discord: https://discord.com/invite/paipalooza
