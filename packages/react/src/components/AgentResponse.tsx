/**
 * AgentResponse - Main component for rendering agent responses
 * Automatically maps tool results to registered components and renders markdown for text
 */

import React, { useEffect, useRef } from 'react';
import { ComponentRegistry } from '../registry/ComponentRegistry';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolResult } from './ToolResult';
import { AgentResponseData, StreamingState } from '../types';

export interface AgentResponseProps {
  /**
   * Agent response data
   */
  data: AgentResponseData;

  /**
   * Component registry for tool rendering
   */
  registry?: ComponentRegistry;

  /**
   * Enable markdown rendering for text content
   * @default true
   */
  enableMarkdown?: boolean;

  /**
   * Code block theme
   * @default 'dark'
   */
  codeTheme?: 'dark' | 'light' | 'vs-dark' | 'github' | 'monokai' | 'nord' | 'dracula';

  /**
   * Enable code copy in code blocks
   * @default true
   */
  enableCodeCopy?: boolean;

  /**
   * Show metadata
   * @default false
   */
  showMetadata?: boolean;

  /**
   * Show execution steps
   * @default false
   */
  showSteps?: boolean;

  /**
   * Streaming state
   */
  streamingState?: StreamingState;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Custom inline styles
   */
  style?: React.CSSProperties;

  /**
   * Error fallback component
   */
  errorFallback?: React.ReactNode;

  /**
   * Callback when content updates (for streaming)
   */
  onContentUpdate?: (content: string) => void;

  /**
   * Test ID for testing
   * @default 'agent-response'
   */
  testId?: string;
}

/**
 * Error boundary for AgentResponse
 */
class AgentResponseErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error) => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AgentResponse rendering error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="agent-response-error"
          style={{
            padding: '20px',
            margin: '16px 0',
            borderRadius: '8px',
            border: '2px solid #fee2e2',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          }}
          role="alert"
        >
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '12px' }}>
            Error Rendering Agent Response
          </div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            {this.state.error?.message}
          </div>
          <div style={{ fontSize: '12px', color: '#7f1d1d', fontFamily: 'monospace' }}>
            Check the console for more details.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * AgentResponse component
 * Renders agent responses with automatic tool-to-component mapping
 */
export const AgentResponse: React.FC<AgentResponseProps> = ({
  data,
  registry,
  enableMarkdown = true,
  codeTheme = 'dark',
  enableCodeCopy = true,
  showMetadata = false,
  showSteps = false,
  streamingState = 'idle',
  className = '',
  style,
  errorFallback,
  onContentUpdate,
  testId = 'agent-response',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousResponseRef = useRef<string>('');

  // Handle content updates for streaming
  useEffect(() => {
    if (data.response && data.response !== previousResponseRef.current) {
      previousResponseRef.current = data.response;
      if (onContentUpdate) {
        onContentUpdate(data.response);
      }
    }
  }, [data.response, onContentUpdate]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streamingState === 'streaming' && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [data.response, streamingState]);

  const isStreaming = streamingState === 'streaming';
  const hasSteps = data.steps && data.steps.length > 0;
  const hasResponse = data.response && data.response.trim().length > 0;

  return (
    <AgentResponseErrorBoundary fallback={errorFallback}>
      <div
        ref={containerRef}
        className={`agent-response ${className}`}
        data-testid={testId}
        data-streaming-state={streamingState}
        style={style}
        role="region"
        aria-label="Agent Response"
        aria-live={isStreaming ? 'polite' : 'off'}
      >
        <style>{`
          .agent-response {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
          }

          .agent-response-section {
            margin-bottom: 16px;
          }

          .agent-response-section:last-child {
            margin-bottom: 0;
          }

          .agent-response-steps {
            margin-bottom: 24px;
          }

          .agent-response-step {
            padding: 16px;
            margin-bottom: 12px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background-color: #f9fafb;
          }

          .agent-response-step-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }

          .agent-response-step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #3b82f6;
            color: white;
            font-size: 12px;
            font-weight: bold;
          }

          .agent-response-thought {
            padding: 12px;
            margin-bottom: 12px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #8b5cf6;
            color: #4b5563;
            font-size: 14px;
            font-style: italic;
          }

          .agent-response-thought-label {
            font-weight: 600;
            color: #7c3aed;
            margin-bottom: 4px;
            font-style: normal;
          }

          .agent-response-tool-calls {
            margin-top: 12px;
          }

          .agent-response-tool-results {
            margin-top: 8px;
          }

          .agent-response-text {
            padding: 0;
          }

          .agent-response-metadata {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            padding: 12px 16px;
            margin-top: 16px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            font-size: 13px;
            color: #6b7280;
          }

          .agent-response-metadata-item {
            display: flex;
            gap: 6px;
          }

          .agent-response-metadata-label {
            font-weight: 600;
          }

          .agent-response-metadata-value {
            font-family: monospace;
          }

          .agent-response-empty {
            padding: 20px;
            text-align: center;
            color: #9ca3af;
            font-style: italic;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px dashed #e5e7eb;
          }

          .agent-response-streaming-indicator {
            display: inline-block;
            width: 6px;
            height: 6px;
            margin-left: 8px;
            background-color: #3b82f6;
            border-radius: 50%;
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.2);
            }
          }
        `}</style>

        {/* Execution Steps */}
        {showSteps && hasSteps && (
          <div className="agent-response-steps" data-testid={`${testId}-steps`}>
            {data.steps!.map((step, index) => (
              <div
                key={index}
                className="agent-response-step"
                data-testid={`${testId}-step-${step.step}`}
              >
                <div className="agent-response-step-header">
                  <div className="agent-response-step-number">{step.step}</div>
                  <span>Step {step.step}</span>
                </div>

                {/* Thought */}
                {step.thought && (
                  <div className="agent-response-thought">
                    <div className="agent-response-thought-label">Thinking:</div>
                    {step.thought}
                  </div>
                )}

                {/* Tool Results */}
                {step.toolResults && step.toolResults.length > 0 && (
                  <div className="agent-response-tool-results">
                    {step.toolResults.map((toolResult, resultIndex) => (
                      <ToolResult
                        key={`${toolResult.toolCallId}-${resultIndex}`}
                        toolName={toolResult.toolName}
                        result={toolResult.result}
                        toolCallId={toolResult.toolCallId}
                        error={toolResult.error}
                        metadata={toolResult.metadata}
                        registry={registry}
                        showMetadata={showMetadata}
                        testId={`${testId}-tool-result-${resultIndex}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Final Response Text */}
        {hasResponse && (
          <div className="agent-response-section agent-response-text" data-testid={`${testId}-text`}>
            {enableMarkdown ? (
              <MarkdownRenderer
                content={data.response}
                codeTheme={codeTheme}
                enableCodeCopy={enableCodeCopy}
                testId={`${testId}-markdown`}
              />
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>{data.response}</div>
            )}
            {isStreaming && (
              <span
                className="agent-response-streaming-indicator"
                aria-label="Streaming in progress"
              />
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasResponse && !hasSteps && (
          <div className="agent-response-empty" data-testid={`${testId}-empty`}>
            {isStreaming ? 'Waiting for response...' : 'No response available'}
          </div>
        )}

        {/* Metadata */}
        {showMetadata && data.metadata && (
          <div className="agent-response-metadata" data-testid={`${testId}-metadata`}>
            {data.metadata.totalSteps !== undefined && (
              <div className="agent-response-metadata-item">
                <span className="agent-response-metadata-label">Steps:</span>
                <span className="agent-response-metadata-value">
                  {data.metadata.totalSteps}
                </span>
              </div>
            )}
            {data.metadata.totalToolCalls !== undefined && (
              <div className="agent-response-metadata-item">
                <span className="agent-response-metadata-label">Tool Calls:</span>
                <span className="agent-response-metadata-value">
                  {data.metadata.totalToolCalls}
                </span>
              </div>
            )}
            {data.metadata.durationMs !== undefined && (
              <div className="agent-response-metadata-item">
                <span className="agent-response-metadata-label">Duration:</span>
                <span className="agent-response-metadata-value">
                  {data.metadata.durationMs}ms
                </span>
              </div>
            )}
            {data.metadata.model && (
              <div className="agent-response-metadata-item">
                <span className="agent-response-metadata-label">Model:</span>
                <span className="agent-response-metadata-value">
                  {data.metadata.model}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </AgentResponseErrorBoundary>
  );
};

export default AgentResponse;
