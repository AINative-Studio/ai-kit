# Vue Chat Assistant

A modern Vue 3 chat assistant with multi-agent support, voice input, and SSR capabilities.

## Features

- **Multi-Agent Support**: Switch between different AI agents
- **Voice Input**: Speech-to-text integration
- **SSR with Nuxt 3**: Server-side rendering for SEO
- **Typing Indicators**: Real-time typing feedback
- **Message Reactions**: React to messages with emojis
- **Theme Customization**: Customizable color schemes
- **Composition API**: Modern Vue 3 patterns
- **Pinia State Management**: Type-safe store

## Tech Stack

- **Framework**: Nuxt 3 / Vue 3
- **State**: Pinia
- **UI**: Vue composables with @vueuse
- **AI**: AI Kit SDK
- **Testing**: Vitest + @vue/test-utils

## Getting Started

\`\`\`bash
cd examples/chat-apps/vue-assistant
pnpm install
pnpm dev
\`\`\`

## Project Structure

\`\`\`
vue-assistant/
├── components/       # Vue components
├── composables/      # Vue composables
├── stores/          # Pinia stores
├── pages/           # Nuxt pages
├── server/          # Server routes
└── plugins/         # Nuxt plugins
\`\`\`

## Multi-Agent Configuration

Configure different agents in \`agents.config.ts\`:

\`\`\`typescript
export const agents = [
  {
    id: 'general',
    name: 'General Assistant',
    systemPrompt: 'You are a helpful assistant',
    model: 'gpt-4-turbo-preview',
  },
  {
    id: 'technical',
    name: 'Technical Expert',
    systemPrompt: 'You are a technical expert',
    model: 'gpt-4-turbo-preview',
  },
]
\`\`\`

## Voice Input

Voice input uses Web Speech API:

\`\`\`vue
<script setup>
const { isListening, transcript, start, stop } = useSpeechRecognition()
</script>
\`\`\`

## License

MIT
