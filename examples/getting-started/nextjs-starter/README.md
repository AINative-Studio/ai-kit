# Next.js Starter with AI Kit

A complete Next.js 14 starter template with AI Kit integration.

## Features

- Next.js 14 App Router
- AI Kit React hooks
- Streaming chat interface
- TypeScript
- Tailwind CSS
- API routes with streaming support

## Quick Start

1. Clone and install:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your ANTHROPIC_API_KEY
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextjs-starter/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # Streaming chat API
│   ├── page.tsx              # Main chat page
│   └── layout.tsx            # Root layout
├── .env.local                # Environment variables
├── package.json
└── tailwind.config.ts
```

## Key Files

### `app/page.tsx`
Main chat interface using `useAIStream` hook.

### `app/api/chat/route.ts`
API route that handles streaming responses from Anthropic.

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Remember to set environment variables in Vercel dashboard.

## Customization

### Change the model:
Edit `app/api/chat/route.ts`:
```typescript
model: 'claude-sonnet-4', // or 'gpt-4', etc.
```

### Add tools:
See the tool-usage example for adding custom tools.

### Styling:
Modify `tailwind.config.ts` and component classes.

## Learn More

- [AI Kit Documentation](https://docs.ainative.studio)
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API](https://docs.anthropic.com)
