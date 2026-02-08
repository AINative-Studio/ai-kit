# @ainative/ai-kit-core

Framework-agnostic core for AI Kit - streaming, agents, state management, and LLM primitives.

## Installation

### npm/pnpm/yarn

```bash
npm install @ainative/ai-kit-core
# or
pnpm add @ainative/ai-kit-core
# or
yarn add @ainative/ai-kit-core
```

### CDN (No Build Required)

Use AI Kit directly in the browser without any build tools:

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@0.1.4/dist/cdn/core.min.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>

<script>
  // AI Kit is now available as AIKitCore
  const stream = new AIKitCore.AIStream({
    apiKey: 'your-api-key',
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
  });
</script>
```

**Available CDN Bundles:**
- `core.min.js` - Complete core bundle (~40KB gzipped)
- `streaming.min.js` - Streaming utilities only (~8KB gzipped)
- `agents.min.js` - Agent system only (~20KB gzipped)
- `context.min.js` - Context management only (~12KB gzipped)

For detailed CDN usage, see [CDN Documentation](../../docs/CDN_USAGE.md).

## Quick Start

### npm/ES Modules

```javascript
import { AIStream } from '@ainative/ai-kit-core';

const stream = new AIStream({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Hello, AI!' }
  ]
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

### CDN/Browser

```html
<script src="https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest/dist/cdn/core.min.js"></script>
<script>
  const stream = new AIKitCore.AIStream({
    apiKey: 'your-api-key',
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello, AI!' }]
  });
</script>
```

## Documentation

For full documentation, visit [https://ainative.studio/ai-kit](https://ainative.studio/ai-kit)

- [CDN Usage Guide](../../docs/CDN_USAGE.md)
- [API Documentation](https://ainative.studio/ai-kit/api)
- [Examples](../../examples/cdn/)

## License

MIT © AINative Studio
