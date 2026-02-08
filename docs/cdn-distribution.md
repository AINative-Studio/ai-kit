# CDN Distribution Guide

> Issue #65: CDN bundles for AI Kit packages

## Overview

All AI Kit packages are automatically available via CDN through unpkg and jsDelivr. When published to npm, these services automatically make the packages accessible via CDN URLs.

## CDN URLs

### unpkg

```
https://unpkg.com/@ainative/ai-kit-core@latest
https://unpkg.com/@ainative/ai-kit@latest
https://unpkg.com/@ainative/ai-kit-vue@latest
https://unpkg.com/@ainative/ai-kit-svelte@latest
```

### jsDelivr

```
https://cdn.jsdelivr.net/npm/@ainative/ai-kit-core@latest
https://cdn.jsdelivr.net/npm/@ainative/ai-kit@latest
https://cdn.jsdelivr.net/npm/@ainative/ai-kit-vue@latest
https://cdn.jsdelivr.net/npm/@ainative/ai-kit-svelte@latest
```

## Usage

### ESM (Recommended)

Modern browsers support ES modules directly:

```html
<script type="module">
  import { AIStream } from 'https://unpkg.com/@ainative/ai-kit-core@latest/dist/index.mjs';

  const stream = new AIStream({
    endpoint: '/api/chat'
  });
</script>
```

### CommonJS

For Node.js environments:

```html
<script src="https://unpkg.com/@ainative/ai-kit-core@latest/dist/index.js"></script>
```

## Package Entry Points

Each package exposes multiple formats:

| Format | Entry Point | Use Case |
|--------|-------------|----------|
| ESM | `dist/index.mjs` | Modern browsers, bundlers |
| CJS | `dist/index.js` | Node.js, older bundlers |
| Types | `dist/index.d.ts` | TypeScript definitions |

## Framework-Specific Packages

### React

```html
<script type="module">
  import { useAIStream } from 'https://unpkg.com/@ainative/ai-kit@latest/dist/index.mjs';
</script>
```

### Vue

```html
<script type="module">
  import { useConversation } from 'https://unpkg.com/@ainative/ai-kit-vue@latest/dist/index.mjs';
</script>
```

### Svelte

```html
<script type="module">
  import { createConversationStore } from 'https://unpkg.com/@ainative/ai-kit-svelte@latest/dist/index.mjs';
</script>
```

## Version Pinning

Always pin to a specific version in production:

```html
<!-- Good: Pinned version -->
<script type="module">
  import { AIStream } from 'https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/index.mjs';
</script>

<!-- Bad: Latest tag (unpredictable updates) -->
<script type="module">
  import { AIStream } from 'https://unpkg.com/@ainative/ai-kit-core@latest/dist/index.mjs';
</script>
```

## Browser Compatibility

### Minimum Requirements

- ES2020 support
- Native ES modules (`<script type="module">`)
- Fetch API
- EventSource API (for SSE streaming)

### Supported Browsers

- Chrome/Edge 91+
- Firefox 89+
- Safari 15+
- Opera 77+

## Import Maps

Use import maps for cleaner imports:

```html
<script type="importmap">
{
  "imports": {
    "@ainative/ai-kit-core": "https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/index.mjs",
    "@ainative/ai-kit": "https://unpkg.com/@ainative/ai-kit@0.1.0/dist/index.mjs"
  }
}
</script>

<script type="module">
  import { AIStream } from '@ainative/ai-kit-core';
  import { useAIStream } from '@ainative/ai-kit';
</script>
```

## Production Recommendations

For production applications:

1. **Use a bundler** (Vite, Webpack, esbuild) for:
   - Tree-shaking
   - Code splitting
   - Optimized bundle sizes
   - Better caching

2. **Install via npm/pnpm**:
   ```bash
   pnpm add @ainative/ai-kit-core
   ```

3. **Pin exact versions** in package.json

CDN usage is best for:
- Quick prototypes
- Educational examples
- Code playgrounds
- MVPs

## Troubleshooting

### CORS Errors

If you encounter CORS errors, use a bundler or:
- Serve your HTML via a local server
- Use `https` URLs
- Configure CORS headers on your API

### Module Resolution

Ensure all dependencies use ESM:

```javascript
// Works: ESM imports
import { AIStream } from '@ainative/ai-kit-core';

// Doesn't work: CommonJS in browser
const { AIStream } = require('@ainative/ai-kit-core');
```

### TypeScript Support

CDN usage doesn't include TypeScript checking. For TypeScript:
1. Install packages via npm
2. Use a bundler with TypeScript support
3. Get full IDE autocomplete and type checking

## Security

### Content Security Policy (CSP)

Allow CDN domains:

```http
Content-Security-Policy: script-src 'self' https://unpkg.com https://cdn.jsdelivr.net;
```

### Subresource Integrity (SRI)

For enhanced security, use SRI hashes:

```html
<script
  type="module"
  src="https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/index.mjs"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

Generate SRI hashes:

```bash
curl https://unpkg.com/@ainative/ai-kit-core@0.1.4/dist/index.mjs | \
  openssl dgst -sha384 -binary | \
  openssl base64 -A
```

## Examples

See `/examples` directory for complete CDN usage examples:

- `examples/cdn-react.html` - React via CDN
- `examples/cdn-vue.html` - Vue via CDN
- `examples/cdn-svelte.html` - Svelte via CDN
- `examples/cdn-vanilla.html` - Vanilla JS via CDN

## Support

- Documentation: https://ainative.studio/ai-kit
- GitHub: https://github.com/AINative-Studio/ai-kit
- Issues: https://github.com/AINative-Studio/ai-kit/issues/65
