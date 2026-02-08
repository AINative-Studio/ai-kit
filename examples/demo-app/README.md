# AI Kit Demo App

Interactive demonstration of AI Kit's React components and features. This demo showcases all available components with live examples and code snippets.

## Overview

The Demo App is a comprehensive showcase of AI Kit's component library, organized into 8 interactive categories:

1. **Messages** - StreamingMessage with typing animation
2. **Code** - CodeBlock with syntax highlighting and MarkdownRenderer
3. **Tools** - ToolResult and StreamingToolResult displays
4. **Agent** - AgentStatus, ThinkingIndicator, AgentEventStream, AgentResponse
5. **Progress** - StreamingIndicator and ProgressBar components
6. **RLHF** - FeedbackButtons and FeedbackStats for human feedback
7. **Analytics** - Overview, UsageMetrics, CostAnalysis, ModelComparison
8. **Safety** - SafetyGuard for content moderation and PII detection

## Features

- **30+ React Components** - Complete UI component library
- **Live Demos** - Interactive examples with controls
- **Code Examples** - Copy-paste ready TypeScript code
- **8 Categories** - Organized by feature type
- **Responsive Design** - Works on desktop and mobile
- **Dark Theme** - Professional dark color scheme
- **No Backend Required** - Pure client-side demo

## Quick Start

```bash
# Navigate to demo app
cd examples/demo-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Component Categories

### Messages
- **StreamingMessage** - Display AI responses with streaming animation
  - Typing animation effect
  - Role-based styling (user, assistant, system)
  - Streaming state indicators

### Code & Markdown
- **CodeBlock** - Syntax-highlighted code with copy button
  - 100+ language support
  - Line numbers
  - Copy to clipboard
  - Multiple themes (dark, light, monokai)

- **MarkdownRenderer** - GitHub Flavored Markdown rendering
  - Headers (h1, h2, h3)
  - Bold text
  - Lists
  - Blockquotes
  - Paragraphs

### Tools
- **ToolResult** - Display tool execution results
  - Success/error states
  - Execution duration
  - JSON formatting
  - Tool name display

- **StreamingToolResult** - Real-time tool execution progress
  - Progress indicators
  - Status messages
  - Result display
  - Error handling

- **UnknownTool** - Fallback for unregistered tools
  - Expandable JSON view
  - Copy to clipboard
  - Warning message
  - Simple value display

### Agent Components
- **AgentStatus** - Agent execution state display
  - 5 states: idle, thinking, working, done, error
  - Animated indicators
  - Status messages
  - Color coding

- **ThinkingIndicator** - Animated thinking indicators
  - 5 variants: dots, spinner, pulse, wave, brain
  - Size options: small, medium, large
  - Optional labels

- **AgentEventStream** - Real-time event visualization
  - 9 event types: start, step, thought, tool_call, tool_result, text_chunk, final_answer, error, complete
  - Event icons
  - Timestamps (optional)
  - Auto-scroll support
  - JSON formatting for complex data

- **AgentResponse** - Complete multi-step response
  - Step-by-step reasoning
  - Tool call visualization
  - Markdown-formatted final answer
  - Execution metadata (steps, duration)

### Progress Indicators
- **StreamingIndicator** - Loading animations
  - 3 variants: dots, pulse, wave
  - Smooth animations
  - Customizable styling

- **ProgressBar** - Progress indicators
  - Determinate mode (0-100%)
  - Indeterminate mode (loading)
  - Custom colors
  - Optional labels

### RLHF Feedback
- **FeedbackButtons** - Collect user feedback
  - 3 variants: thumbs (binary), stars (1-5), numeric (1-10)
  - Optional comment input
  - Selected state tracking
  - Disabled state support

- **FeedbackStats** - Display feedback statistics
  - Total interactions and feedback
  - Feedback rate
  - Thumbs up/down ratio
  - Average rating with star display

### Analytics & Observability
- **Overview** - Key metrics dashboard
  - 4 metric cards (requests, cost, tokens, users)
  - Change indicators (positive/negative)
  - Icons for visual identification

- **UsageMetrics** - Line chart visualization
  - Dual-line chart (requests and tokens)
  - Time-based data
  - Color-coded legends
  - Responsive SVG

- **CostAnalysis** - Bar chart cost breakdown
  - Cost by model
  - Color-coded bars
  - Total cost display
  - Responsive scaling

- **ModelComparison** - Performance comparison table
  - 6 columns: model, requests, tokens, cost, latency, success rate
  - Success rate color coding
  - Formatted numbers
  - Sortable data

- **UsageDashboard** - Comprehensive analytics
  - 4 metric cards
  - Model usage bar chart
  - Cost over time line chart
  - Date-based filtering

### Safety Guardrails
- **SafetyGuard** - Content safety visualization
  - 4 safety checks: prompt injection, jailbreak, PII, moderation
  - Pass/fail indicators
  - Confidence scores
  - PII masking display
  - Detection pattern details

## Technology Stack

- **React 18** - Latest React with hooks
- **TypeScript** - Full type safety
- **Vite** - Fast build tool with HMR
- **CSS** - Custom styling (no frameworks)
- **ESLint** - Code linting

## Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deployment

**Vercel:**
```bash
vercel deploy --prod
```

**Netlify:**
```bash
netlify deploy --prod
```

**Docker:**
```bash
docker build -t ai-kit-demo .
docker run -p 5173:5173 ai-kit-demo
```

## Project Structure

```
demo-app/
├── src/
│   ├── App.tsx          # Main demo application
│   ├── App.css          # Component styles
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config
└── README.md           # This file
```

## Component API Overview

### StreamingMessage
```tsx
<StreamingMessage
  role="user" | "assistant" | "system"
  content={string}
  streamingState="idle" | "streaming" | "complete"
/>
```

### CodeBlock
```tsx
<CodeBlock
  language={string}
  showLineNumbers={boolean}
  theme="dark" | "light" | "monokai"
>
  {code}
</CodeBlock>
```

### AgentStatus
```tsx
<AgentStatus
  status="idle" | "thinking" | "working" | "done" | "error"
  message={string}
  showAnimation={boolean}
/>
```

### FeedbackButtons
```tsx
<FeedbackButtons
  messageId={string}
  onFeedback={(id, rating, comment?) => void}
  variant="thumbs" | "stars" | "numeric"
  disabled={boolean}
  showComment={boolean}
/>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Performance

- Bundle size: ~180KB (minified + gzipped)
- First Contentful Paint: < 1.0s
- Time to Interactive: < 2.0s
- Lighthouse Score: 94+

## License

MIT - See [LICENSE](../../LICENSE)

## Related Examples

- [Basic Chat](../getting-started/basic-chat/) - Simple chat implementation
- [React Starter](../getting-started/react-starter/) - React starter template
- [React Tools Chat](../chat-apps/react-tools-chat/) - Chat with tool integration

## Support

- **Documentation**: [https://docs.ainative.ai](https://docs.ainative.ai)
- **Discord**: [Join community](https://discord.com/invite/paipalooza)
- **GitHub Issues**: [Report bugs](https://github.com/ainative/ai-kit/issues)

---

**Explore all 30+ components interactively!** Run `npm run dev` to start the demo.
