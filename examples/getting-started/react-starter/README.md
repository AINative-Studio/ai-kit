# React Starter with AI Kit

A React + Vite starter template with AI Kit integration.

## Features

- React 18
- Vite for fast development
- TypeScript
- AI Kit React hooks
- Clean, modern UI

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env`:
   ```bash
   VITE_API_ENDPOINT=http://localhost:3001/api/chat
   ```

3. Start the backend (in another terminal):
   ```bash
   cd server
   npm install
   npm start
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```

## Project Structure

```
react-starter/
├── src/
│   ├── App.tsx           # Main chat component
│   ├── App.css           # Styles
│   └── main.tsx          # Entry point
├── server/               # Backend API
│   └── index.ts          # Express server with streaming
├── package.json
└── vite.config.ts
```

## Features Demonstrated

- `useAIStream` hook
- Real-time streaming
- Error handling with retry
- Usage tracking
- Message history
- Typing indicators

## Backend

The included Express server provides:
- Streaming chat endpoint
- CORS support
- Error handling
- Anthropic API integration

## Customization

### Change API endpoint:
Edit `.env`:
```
VITE_API_ENDPOINT=https://your-api.com/chat
```

### Add more features:
- Conversation persistence
- User authentication
- File uploads
- Multi-modal support

## Learn More

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [AI Kit Documentation](https://docs.ainative.studio)
