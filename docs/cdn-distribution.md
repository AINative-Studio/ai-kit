# CDN Distribution Guide

This document describes the CDN distribution strategy for AI Kit packages and provides usage examples.

## Overview

AI Kit packages are configured for distribution via CDN providers (unpkg and jsdelivr) for quick prototyping and experimentation. However, due to Node.js-specific dependencies in the core package, we recommend using a JavaScript bundler for production applications.

**Refs #65**: CDN bundles implementation

## Package Configuration

All AI Kit packages are configured with CDN-specific fields in `package.json`:

```json
{
  "unpkg": "./dist/ai-kit-core.umd.min.js",
  "jsdelivr": "./dist/ai-kit-core.umd.min.js"
}
```

This ensures that when users access the package via CDN URLs, they automatically get the minified UMD bundle.

## CDN URLs

### unpkg

[unpkg](https://unpkg.com/) is a fast, global CDN for npm packages.

**Core Package:**
```html
<script src="https://unpkg.com/@ainative/ai-kit-core@latest/dist/ai-kit-core.umd.min.js"></script>
```

**React Package:**
```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@ainative/ai-kit@latest/dist/ai-kit-react.umd.min.js"></script>
```

**Vue Package:**
```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/@ainative/ai-kit-vue@latest/dist/ai-kit-vue.umd.min.js"></script>
```

**Svelte Package:**
```html
<script src="https://unpkg.com/@ainative/ai-kit-svelte@latest/dist/ai-kit-svelte.umd.min.js"></script>
```

### jsdelivr

[jsdelivr](https://www.jsdelivr.com/) is another popular CDN for npm packages with additional features.

**Core Package:**
```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/ai-kit-core.umd.min.js"></script>
```

**React Package:**
```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit@latest/dist/ai-kit-react.umd.min.js"></script>
```

**Versioned URLs:**
```html
<!-- Specific version -->
<script src="https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/ai-kit-core.umd.min.js"></script>

<!-- Semver range -->
<script src="https://unpkg.com/@ainative/ai-kit-core@^0.1.0/dist/ai-kit-core.umd.min.js"></script>
```

## Global API

When loaded via script tags, packages expose global objects:

### Core Package (`AIKitCore`)

```javascript
// Streaming
const stream = new AIKitCore.AIStream({
  apiKey: 'your-api-key',
  model: 'gpt-4'
});

// Agents
const agent = new AIKitCore.Agent({
  name: 'Assistant',
  systemPrompt: 'You are a helpful assistant',
  tools: []
});

const executor = new AIKitCore.AgentExecutor();

// Store
const store = new AIKitCore.MemoryStore();
```

### React Package (`AIKitReact`)

```javascript
// Hooks
const { messages, isLoading, send } = AIKitReact.useAIStream({ ... });
const { execute, result } = AIKitReact.useAgent({ ... });
const { conversation, append } = AIKitReact.useConversation({ ... });
```

### Vue Package (`AIKitVue`)

```javascript
// Composables
const { messages, isLoading, send } = AIKitVue.useAIStream({ ... });
const { execute, result } = AIKitVue.useAgent({ ... });
```

### Svelte Package (`AIKitSvelte`)

```javascript
// Stores
const streamStore = AIKitSvelte.createAIStream({ ... });
const agentStore = AIKitSvelte.createAgent({ ... });
```

## Browser Compatibility

### Target Browsers

UMD bundles are compiled to ES2015 (ES6) and support:

- Chrome/Edge: 51+
- Firefox: 54+
- Safari: 10+
- Node.js: 18+

### Polyfills

For older browsers, you may need polyfills for:

- Promise
- fetch
- EventSource (for Server-Sent Events)

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=Promise,fetch,EventSource"></script>
```

## Bundle Sizes

Approximate bundle sizes (minified):

| Package | Size | Gzipped |
|---------|------|---------|
| @ainative/ai-kit-core | ~150KB | ~45KB |
| @ainative/ai-kit (React) | ~80KB | ~25KB |
| @ainative/ai-kit-vue | ~60KB | ~20KB |
| @ainative/ai-kit-svelte | ~60KB | ~20KB |

## Current Limitations

### Node.js Dependencies

The core package currently includes dependencies that rely on Node.js built-ins:

- `events` (EventEmitter)
- `crypto` (session encryption)
- `stream` (Redis store)

These dependencies make the package less suitable for direct browser usage via UMD bundles.

### Recommended Approach

For production applications, we **strongly recommend** using a JavaScript bundler:

**Vite (Recommended):**
```bash
npm create vite@latest my-ai-app -- --template react
cd my-ai-app
npm install @ainative/ai-kit
```

**Next.js:**
```bash
npx create-next-app@latest my-ai-app
cd my-ai-app
npm install @ainative/ai-kit
```

**SvelteKit:**
```bash
npm create svelte@latest my-ai-app
cd my-ai-app
npm install @ainative/ai-kit-svelte
```

**Nuxt:**
```bash
npx nuxi@latest init my-ai-app
cd my-ai-app
npm install @ainative/ai-kit-vue
```

### Benefits of Bundlers

1. **Tree-shaking**: Only include code you actually use
2. **Code splitting**: Load code on demand
3. **Dependency optimization**: Better handling of Node.js dependencies
4. **TypeScript support**: Full type safety
5. **Hot module replacement**: Faster development
6. **Smaller bundle sizes**: Optimized production builds

## Security Considerations

### API Keys

Never expose API keys in client-side code:

```html
<!-- ❌ DON'T DO THIS -->
<script>
  const stream = new AIKitCore.AIStream({
    apiKey: 'sk-...' // Exposed to all users!
  });
</script>
```

Instead, use server-side endpoints:

```html
<!-- ✅ DO THIS -->
<script>
  const stream = new AIKitCore.AIStream({
    endpoint: '/api/stream' // Server handles API key
  });
</script>
```

### Content Security Policy

When using CDN bundles, update your CSP headers:

```
Content-Security-Policy: script-src 'self' https://unpkg.com https://cdn.jsdelivr.net
```

## Testing

Tests for CDN bundles are located in:

- `/Users/aideveloper/ai-kit/packages/core/__tests__/cdn/umd-bundle.test.ts`
- `/Users/aideveloper/ai-kit/packages/react/__tests__/cdn/umd-bundle.test.ts`
- `/Users/aideveloper/ai-kit/packages/vue/__tests__/cdn/umd-bundle.test.ts`
- `/Users/aideveloper/ai-kit/packages/svelte/__tests__/cdn/umd-bundle.test.ts`
- `/Users/aideveloper/ai-kit/e2e/cdn-bundles.spec.ts`

Run tests:

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## Examples

See `/Users/aideveloper/ai-kit/examples/cdn/` for working examples.

## Future Work

To improve CDN bundle support, future releases may include:

1. **Browser-specific entry point**: Separate build that excludes Node.js dependencies
2. **EventEmitter polyfill**: Browser-compatible EventEmitter implementation
3. **WebCrypto adapter**: Replace Node.js `crypto` with Web Crypto API
4. **Smaller bundle sizes**: Further optimization and code splitting
5. **ES modules via CDN**: Support for `import` from CDN

## Contributing

If you'd like to help improve CDN bundle support, see:

- Issue #65: CDN bundles
- `CONTRIBUTING.md`

## Links

- [unpkg.com](https://unpkg.com/)
- [jsdelivr.com](https://www.jsdelivr.com/)
- [npm Package](https://www.npmjs.com/package/@ainative/ai-kit-core)
- [GitHub Repository](https://github.com/AINative-Studio/ai-kit)
