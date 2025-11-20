# React Chat with Tools

A powerful React chat application featuring integrated tools for calculator, weather, and web search functionality.

![React Tools Chat](./docs/screenshot.png)

## Features

- **Integrated Tools**: Calculator, weather lookup, and web search
- **Real-time Tool Execution**: Watch tools execute in real-time
- **Message Formatting**: Full markdown support with code syntax highlighting
- **Export Conversations**: Download chat history as markdown
- **Local Storage**: Persistent conversation history
- **Modern UI**: Clean, responsive interface built with React 18
- **TypeScript**: Full type safety throughout
- **Testing**: Comprehensive test coverage

## Available Tools

### 1. Calculator
Perform mathematical calculations including:
- Basic arithmetic (+, -, *, /)
- Advanced functions (sqrt, sin, cos, log)
- Constants (pi, e)
- Exponents and more

Example: "Calculate sqrt(144) + 10"

### 2. Weather
Get current weather information:
- Temperature and conditions
- Humidity and wind speed
- Support for Celsius and Fahrenheit

Example: "What's the weather in London?"

### 3. Web Search
Search the internet for information:
- Top search results
- Relevant snippets
- Direct links

Example: "Search for recent AI developments"

## Tech Stack

- **Framework**: React 18 with Vite
- **UI**: Tailwind CSS
- **State Management**: Zustand
- **Markdown**: react-markdown with remark-gfm
- **Code Highlighting**: prism-react-renderer
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite

## Getting Started

### Installation

\`\`\`bash
cd examples/chat-apps/react-tools-chat
pnpm install
\`\`\`

### Environment Setup

Create \`.env.local\`:

\`\`\`env
VITE_AINATIVE_API_KEY=your_api_key_here
VITE_WEATHER_API_KEY=your_weather_api_key (optional)
VITE_SEARCH_API_KEY=your_search_api_key (optional)
\`\`\`

### Development

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

\`\`\`bash
pnpm build
pnpm preview
\`\`\`

## Project Structure

\`\`\`
react-tools-chat/
├── src/
│   ├── components/        # React components
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── ToolsPanel.tsx
│   │   └── ...
│   ├── tools/            # Tool implementations
│   │   ├── calculator.ts
│   │   ├── weather.ts
│   │   └── web-search.ts
│   ├── lib/              # Utilities
│   │   ├── store.ts      # Zustand store
│   │   └── aikit.ts      # AI Kit integration
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
├── __tests__/            # Test files
└── public/               # Static assets
\`\`\`

## Tool Integration

Each tool follows a standard interface:

\`\`\`typescript
export const toolName = {
  name: 'tool_name',
  description: 'What the tool does',

  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description',
      },
    },
    required: ['param1'],
  },

  execute: async (input: ToolInput): Promise<ToolOutput> => {
    // Tool implementation
    return result
  },
}
\`\`\`

## Adding Custom Tools

1. Create a new tool file in \`src/tools/\`:

\`\`\`typescript
// src/tools/my-tool.ts
export const myTool = {
  name: 'my_tool',
  description: 'Description of what it does',
  parameters: { /* ... */ },
  execute: async (input) => {
    // Implementation
  },
}
\`\`\`

2. Register the tool in \`src/lib/tools.ts\`:

\`\`\`typescript
import { myTool } from './tools/my-tool'

export const tools = [
  calculator,
  weather,
  webSearch,
  myTool, // Add your tool
]
\`\`\`

## Testing

\`\`\`bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
\`\`\`

## Export Conversations

Click the export button to download conversations as markdown:

\`\`\`markdown
# Chat Export

## You
*2024-11-20 10:30:00*

What's the weather in Paris?

## Assistant
*2024-11-20 10:30:05*

The current weather in Paris is...

**Tools Used:**
- weather: success
\`\`\`

## Deployment

### Vercel

\`\`\`bash
vercel
\`\`\`

### Netlify

\`\`\`bash
netlify deploy --prod
\`\`\`

### Docker

\`\`\`bash
docker build -t react-tools-chat .
docker run -p 3000:3000 react-tools-chat
\`\`\`

## Performance

- **Bundle Size**: < 200KB (gzipped)
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Lighthouse Score**: 95+

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../../CONTRIBUTING.md)

## License

MIT - See [LICENSE](../../../LICENSE)
