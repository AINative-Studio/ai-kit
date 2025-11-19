/**
 * React Integration Example for Streaming Agent
 *
 * This example shows how to integrate StreamingAgentExecutor with React
 * for real-time UI updates.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { z } from 'zod';
import {
  Agent,
  StreamingAgentExecutor,
  ToolDefinition,
  AgentConfig,
  AgentExecutionEvent,
  ThoughtEvent,
  ToolCallEvent,
  ToolResultEvent,
  FinalAnswerEvent,
} from '../src/agents';

// Define some example tools
const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Gets weather for a city',
  parameters: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => ({
    city,
    temperature: 72,
    condition: 'Sunny',
  }),
};

// Event types for UI state
interface UIEvent {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  metadata?: any;
}

interface AgentState {
  isRunning: boolean;
  events: UIEvent[];
  currentStep: number;
  finalAnswer?: string;
  error?: string;
}

/**
 * Custom React hook for streaming agent execution
 */
function useStreamingAgent(agent: Agent) {
  const [state, setState] = useState<AgentState>({
    isRunning: false,
    events: [],
    currentStep: 0,
  });

  const executorRef = useRef<StreamingAgentExecutor | null>(null);
  const abortRef = useRef<boolean>(false);

  const executeAgent = useCallback(
    async (input: string) => {
      // Reset state
      setState({
        isRunning: true,
        events: [],
        currentStep: 0,
      });

      abortRef.current = false;
      executorRef.current = new StreamingAgentExecutor(agent);

      try {
        for await (const event of executorRef.current.stream(input)) {
          // Check if execution was aborted
          if (abortRef.current) {
            break;
          }

          // Convert event to UI event
          const uiEvent = convertToUIEvent(event);

          // Update state with new event
          setState((prev) => ({
            ...prev,
            events: [...prev.events, uiEvent],
            currentStep: 'step' in event ? event.step : prev.currentStep,
            finalAnswer:
              event.type === 'final_answer'
                ? (event as FinalAnswerEvent).answer
                : prev.finalAnswer,
          }));
        }

        // Mark as complete
        setState((prev) => ({ ...prev, isRunning: false }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    },
    [agent]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  return {
    state,
    executeAgent,
    abort,
  };
}

/**
 * Convert agent event to UI-friendly event
 */
function convertToUIEvent(event: AgentExecutionEvent): UIEvent {
  const baseEvent = {
    id: Math.random().toString(36).substring(7),
    timestamp: event.timestamp,
  };

  switch (event.type) {
    case 'step':
      return {
        ...baseEvent,
        type: 'step',
        content: `Starting step ${event.step}`,
        metadata: { step: event.step },
      };

    case 'thought': {
      const thoughtEvent = event as ThoughtEvent;
      return {
        ...baseEvent,
        type: 'thought',
        content: thoughtEvent.content,
        metadata: { step: thoughtEvent.step },
      };
    }

    case 'tool_call': {
      const toolEvent = event as ToolCallEvent;
      return {
        ...baseEvent,
        type: 'tool_call',
        content: `Calling ${toolEvent.toolCall.name}`,
        metadata: {
          toolName: toolEvent.toolCall.name,
          params: toolEvent.toolCall.parameters,
        },
      };
    }

    case 'tool_result': {
      const resultEvent = event as ToolResultEvent;
      const content = resultEvent.result.error
        ? `Error: ${resultEvent.result.error.message}`
        : `Result: ${JSON.stringify(resultEvent.result.result)}`;
      return {
        ...baseEvent,
        type: 'tool_result',
        content,
        metadata: {
          toolName: resultEvent.result.toolName,
          result: resultEvent.result.result,
          error: resultEvent.result.error,
        },
      };
    }

    case 'final_answer': {
      const answerEvent = event as FinalAnswerEvent;
      return {
        ...baseEvent,
        type: 'final_answer',
        content: answerEvent.answer,
        metadata: { step: answerEvent.step },
      };
    }

    case 'error':
      return {
        ...baseEvent,
        type: 'error',
        content: event.error,
        metadata: { code: event.code },
      };

    default:
      return {
        ...baseEvent,
        type: 'unknown',
        content: JSON.stringify(event),
      };
  }
}

/**
 * Event display component
 */
function EventCard({ event }: { event: UIEvent }) {
  const getIcon = () => {
    switch (event.type) {
      case 'step':
        return '📍';
      case 'thought':
        return '💭';
      case 'tool_call':
        return '🔧';
      case 'tool_result':
        return '✅';
      case 'final_answer':
        return '🎯';
      case 'error':
        return '❌';
      default:
        return '•';
    }
  };

  const getBgColor = () => {
    switch (event.type) {
      case 'thought':
        return 'bg-blue-50';
      case 'tool_call':
        return 'bg-purple-50';
      case 'tool_result':
        return 'bg-green-50';
      case 'final_answer':
        return 'bg-yellow-50';
      case 'error':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className={`p-4 rounded-lg ${getBgColor()} mb-2`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <div className="text-sm text-gray-500 mb-1">
            {new Date(event.timestamp).toLocaleTimeString()}
          </div>
          <div className="text-gray-900">{event.content}</div>
          {event.metadata && event.type === 'tool_call' && (
            <div className="mt-2 text-xs text-gray-600">
              <code>{JSON.stringify(event.metadata.params, null, 2)}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main chat interface component
 */
export function StreamingAgentChat() {
  const [input, setInput] = useState('');
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Create agent
  const agent = React.useMemo(() => {
    const config: AgentConfig = {
      id: 'chat-agent',
      name: 'Chat Agent',
      systemPrompt: 'You are a helpful assistant.',
      llm: {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY || '',
      },
      tools: [weatherTool],
      maxSteps: 10,
    };
    return new Agent(config);
  }, []);

  const { state, executeAgent, abort } = useStreamingAgent(agent);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.events]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !state.isRunning) {
      executeAgent(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <h1 className="text-2xl font-bold mb-2">Streaming Agent Chat</h1>
        <p className="text-gray-600">
          Watch the agent think and act in real-time as it processes your request.
        </p>
      </div>

      {/* Events Display */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
        {state.events.length === 0 && !state.isRunning && (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start a conversation below!
          </div>
        )}

        {state.events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {state.isRunning && (
          <div className="flex items-center gap-2 text-gray-500 p-4">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <span>Agent is thinking...</span>
          </div>
        )}

        {state.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {state.error}
          </div>
        )}

        <div ref={eventsEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={state.isRunning}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        {state.isRunning ? (
          <button
            type="button"
            onClick={abort}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        )}
      </form>

      {/* Stats */}
      {state.events.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Step: {state.currentStep} | Events: {state.events.length}
        </div>
      )}
    </div>
  );
}

// Export the hook for custom usage
export { useStreamingAgent };
