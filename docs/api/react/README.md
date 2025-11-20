# @ainative/ai-kit-react API Reference

React hooks and components for AI Kit

## Installation

```bash
npm install @ainative/ai-kit-react
```

## Overview

The React package provides:

- **Hooks**: `useAIStream`, `useConversation`
- **Components**: `ChatInterface`, `MessageList`, `UsageDashboard`, `CodeBlock`
- **Component Registry**: Custom tool result rendering

## Modules

- [Hooks](./hooks.md) - React hooks for AI functionality
- [Components](./components.md) - Pre-built UI components
- [Component Registry](./registry.md) - Custom component registration

## Quick Start

```typescript
import { useAIStream } from '@ainative/ai-kit-react';

function ChatApp() {
  const {
    messages,
    isStreaming,
    send,
    reset
  } = useAIStream({
    endpoint: '/api/chat',
    model: 'gpt-4'
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => send('Hello!')}>Send</button>
    </div>
  );
}
```

## See Also

- [Core Package](../core/README.md)
- [Next.js Package](../nextjs/README.md)
