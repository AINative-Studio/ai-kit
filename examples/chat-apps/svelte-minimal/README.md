# Svelte Minimalist Chat

A clean, performant Svelte chat application focused on simplicity and accessibility.

## Features

- **Minimal UI**: Clean, distraction-free interface
- **SvelteKit SSR**: Server-side rendering
- **Streaming Responses**: Real-time AI responses
- **Keyboard Shortcuts**: Full keyboard navigation
- **Accessibility**: WCAG 2.1 AAA compliant
- **Performance**: < 50KB bundle size
- **Lightweight**: Minimal dependencies

## Keyboard Shortcuts

- \`Ctrl/Cmd + N\`: New conversation
- \`Ctrl/Cmd + K\`: Focus search
- \`Ctrl/Cmd + /\`: Show shortcuts
- \`Esc\`: Clear input
- \`↑/↓\`: Navigate messages

## Tech Stack

- **Framework**: SvelteKit
- **UI**: Vanilla CSS (no frameworks)
- **State**: Svelte stores
- **Testing**: Vitest + @testing-library/svelte

## Getting Started

\`\`\`bash
cd examples/chat-apps/svelte-minimal
pnpm install
pnpm dev
\`\`\`

## Performance Metrics

- **Bundle Size**: 45KB (gzipped)
- **FCP**: < 0.8s
- **TTI**: < 1.5s
- **Lighthouse**: 100/100

## Accessibility

- Semantic HTML
- ARIA labels
- Focus management
- Screen reader tested
- Reduced motion support
- High contrast mode

## License

MIT
