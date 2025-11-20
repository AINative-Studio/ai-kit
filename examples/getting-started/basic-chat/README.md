# Basic Chat Example

A simple chat interface using AI Kit.

## Features

- Real-time streaming responses
- Message history
- Cost tracking
- Error handling

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   VITE_API_ENDPOINT=http://localhost:3000/api/chat
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Usage

1. Type a message in the input field
2. Press Enter or click Send
3. Watch the AI response stream in real-time

## Code Overview

- `src/App.tsx` - Main chat component using `useAIStream` hook
- `src/main.tsx` - Application entry point
- `vite.config.ts` - Vite configuration

## Key Concepts

This example demonstrates:
- Using the `useAIStream` hook
- Handling streaming responses
- Displaying message history
- Tracking usage and costs
- Basic error handling
