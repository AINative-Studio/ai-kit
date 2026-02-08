# Next.js AI Chatbot

A production-ready AI chatbot application built with Next.js 14, featuring real-time streaming, authentication, message persistence, and cost tracking.

![Next.js AI Chatbot](./docs/screenshot.png)

## Features

- **Server-Side Streaming**: Real-time AI responses with streaming support
- **Authentication**: Secure user authentication with NextAuth.js
- **Message Persistence**: Save and retrieve conversation history
- **Multiple Conversations**: Manage multiple chat sessions
- **Cost Tracking**: Monitor token usage and costs
- **Dark Mode**: Built-in theme switching
- **Mobile Responsive**: Optimized for all screen sizes
- **Accessibility**: WCAG 2.1 AA compliant
- **TypeScript**: Full type safety
- **Testing**: Comprehensive test coverage with Vitest

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **AI Integration**: AI Kit SDK
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- AINative API key ([Get one here](https://ainative.ai))

### Installation

1. Clone the repository:

\`\`\`bash
git clone https://github.com/ainative/ai-kit.git
cd ai-kit/examples/chat-apps/nextjs-chatbot
\`\`\`

2. Install dependencies:

\`\`\`bash
pnpm install
\`\`\`

3. Set up environment variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\`:

\`\`\`env
AINATIVE_API_KEY=your_ainative_api_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
\`\`\`

4. Run the development server:

\`\`\`bash
pnpm dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
nextjs-chatbot/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── chat/            # Chat streaming endpoint
│   │   └── conversations/   # Conversation management
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── chat-interface.tsx   # Main chat interface
│   ├── message-list.tsx     # Message display
│   ├── message-item.tsx     # Individual message
│   ├── chat-input.tsx       # Message input
│   ├── sidebar.tsx          # Conversation sidebar
│   ├── header.tsx           # App header
│   └── ...                  # Other components
├── lib/                     # Utilities and helpers
│   ├── store.ts             # Zustand store
│   ├── auth.ts              # NextAuth configuration
│   └── db.ts                # Database utilities
├── __tests__/               # Test files
│   ├── components/          # Component tests
│   ├── lib/                 # Utility tests
│   └── setup.ts             # Test setup
└── public/                  # Static assets
\`\`\`

## Key Features Explained

### Real-Time Streaming

The app uses Server-Sent Events (SSE) to stream AI responses in real-time:

\`\`\`typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const response = await aikit.chat.completions.create({
        messages,
        stream: true,
      })

      for await (const chunk of response) {
        controller.enqueue(encoder.encode(\`data: \${JSON.stringify(chunk)}\\n\\n\`))
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
\`\`\`

### State Management

Zustand provides lightweight state management with persistence:

\`\`\`typescript
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      createConversation: () => {
        const id = generateId()
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
        }))
        return id
      },
      // ...other actions
    }),
    {
      name: 'chat-storage',
    }
  )
)
\`\`\`

### Cost Tracking

Every message includes token count and cost estimation:

\`\`\`typescript
const metadata = {
  tokenCount: response.usage.total_tokens,
  cost: (response.usage.total_tokens / 1000) * 0.01,
  model: 'gpt-4-turbo-preview',
}
\`\`\`

## Testing

### Run All Tests

\`\`\`bash
pnpm test
\`\`\`

### Run Tests in Watch Mode

\`\`\`bash
pnpm test:watch
\`\`\`

### Run E2E Tests

\`\`\`bash
pnpm test:e2e
\`\`\`

### Test Coverage

\`\`\`bash
pnpm test:coverage
\`\`\`

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:

\`\`\`bash
pnpm install -g vercel
\`\`\`

2. Deploy:

\`\`\`bash
vercel
\`\`\`

3. Set environment variables in Vercel dashboard:
   - \`AINATIVE_API_KEY\`
   - \`NEXTAUTH_URL\`
   - \`NEXTAUTH_SECRET\`

### Deploy to Other Platforms

This app can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): One-click deployment
- **Netlify**: Full Next.js support
- **Railway**: Docker-based deployment
- **AWS**: Using Amplify or EC2
- **Self-hosted**: Using Docker

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| \`AINATIVE_API_KEY\` | Your AINative API key | Yes |
| \`NEXTAUTH_URL\` | App URL for authentication | Yes |
| \`NEXTAUTH_SECRET\` | Secret for JWT encryption | Yes |
| \`DATABASE_URL\` | PostgreSQL connection string | No |
| \`GITHUB_ID\` | GitHub OAuth client ID | No |
| \`GITHUB_SECRET\` | GitHub OAuth client secret | No |

## Performance Optimizations

- **Edge Runtime**: API routes run on edge for low latency
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Automatic font loading with next/font
- **Bundle Analysis**: Analyze bundle size with \`pnpm analyze\`

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus handling
- **Color Contrast**: WCAG AA compliant colors
- **Reduced Motion**: Respects prefers-reduced-motion

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../../CONTRIBUTING.md) for details.

## License

MIT - See [LICENSE](../../../LICENSE) for details.

## Support

- **Documentation**: [https://docs.ainative.ai](https://docs.ainative.ai)
- **Discord**: [Join our community](https://discord.com/invite/paipalooza)
- **Issues**: [GitHub Issues](https://github.com/ainative/ai-kit/issues)

## Acknowledgments

Built with love by the AINative team and powered by AI Kit.
