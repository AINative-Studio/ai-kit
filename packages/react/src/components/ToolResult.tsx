/**
 * ToolResult - Renders individual tool execution results
 * Uses ComponentRegistry to map tools to their registered components
 */

import React from 'react';
import { ComponentRegistry } from '../registry/ComponentRegistry';
import { UnknownTool } from './UnknownTool';
import { ToolResultData } from '../types';

export interface ToolResultProps {
  /**
   * Tool name
   */
  toolName: string;

  /**
   * Tool result data
   */
  result: any;

  /**
   * Tool call ID
   */
  toolCallId?: string;

  /**
   * Error information
   */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  /**
   * Execution metadata
   */
  metadata?: {
    durationMs?: number;
    timestamp?: string;
    retryCount?: number;
  };

  /**
   * Component registry for rendering
   */
  registry?: ComponentRegistry;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Show metadata
   * @default false
   */
  showMetadata?: boolean;

  /**
   * Test ID for testing
   * @default 'tool-result'
   */
  testId?: string;
}

/**
 * Error boundary for tool result rendering
 */
class ToolResultErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ToolResult rendering error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="tool-result-error"
          style={{
            padding: '16px',
            margin: '8px 0',
            borderRadius: '8px',
            border: '2px solid #fee2e2',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          }}
          role="alert"
        >
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>
            Component Rendering Error
          </div>
          <div style={{ fontSize: '14px' }}>{this.state.error?.message}</div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ToolResult component
 * Renders tool results using registered components or fallback
 */
export const ToolResult: React.FC<ToolResultProps> = ({
  toolName,
  result,
  toolCallId: _toolCallId,
  error,
  metadata,
  registry,
  className = '',
  showMetadata = false,
  testId = 'tool-result',
}) => {
  // If there's an error, render error state
  if (error) {
    return (
      <div
        className={`tool-result tool-result-error ${className}`}
        data-testid={`${testId}-error`}
        data-tool-name={toolName}
      >
        <style>{`
          .tool-result-error {
            padding: 16px;
            margin: 8px 0;
            border-radius: 8px;
            border: 2px solid #fee2e2;
            background-color: #fef2f2;
          }

          .tool-result-error-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }

          .tool-result-error-icon {
            width: 24px;
            height: 24px;
            background-color: #dc2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }

          .tool-result-error-title {
            font-weight: 600;
            color: #991b1b;
            font-size: 14px;
          }

          .tool-result-error-message {
            color: #991b1b;
            font-size: 14px;
            line-height: 1.5;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #fecaca;
          }

          .tool-result-error-code {
            font-family: monospace;
            font-size: 12px;
            color: #7f1d1d;
            margin-top: 8px;
          }
        `}</style>

        <div className="tool-result-error-header">
          <div className="tool-result-error-icon">!</div>
          <div className="tool-result-error-title">
            Tool Error: {toolName}
          </div>
        </div>

        <div className="tool-result-error-message">
          {error.message}
          {error.code && (
            <div className="tool-result-error-code">Code: {error.code}</div>
          )}
        </div>
      </div>
    );
  }

  // Lookup component from registry
  const lookupResult = registry?.lookup(toolName);
  const RegisteredComponent = lookupResult?.component;
  const mapProps = lookupResult?.mapProps;

  return (
    <div
      className={`tool-result ${className}`}
      data-testid={testId}
      data-tool-name={toolName}
    >
      <style>{`
        .tool-result {
          margin: 8px 0;
        }

        .tool-result-metadata {
          display: flex;
          gap: 16px;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .tool-result-metadata-item {
          display: flex;
          gap: 4px;
        }

        .tool-result-metadata-label {
          font-weight: 600;
        }

        .tool-result-metadata-value {
          font-family: monospace;
        }
      `}</style>

      <ToolResultErrorBoundary>
        {RegisteredComponent && mapProps ? (
          // Render registered component with mapped props
          <RegisteredComponent {...mapProps(result)} />
        ) : (
          // Fallback to UnknownTool component
          <UnknownTool
            toolName={toolName}
            result={result}
            testId={`${testId}-unknown`}
          />
        )}
      </ToolResultErrorBoundary>

      {/* Metadata section */}
      {showMetadata && metadata && (
        <div className="tool-result-metadata" data-testid={`${testId}-metadata`}>
          {metadata.durationMs !== undefined && (
            <div className="tool-result-metadata-item">
              <span className="tool-result-metadata-label">Duration:</span>
              <span className="tool-result-metadata-value">
                {metadata.durationMs}ms
              </span>
            </div>
          )}
          {metadata.timestamp && (
            <div className="tool-result-metadata-item">
              <span className="tool-result-metadata-label">Time:</span>
              <span className="tool-result-metadata-value">
                {new Date(metadata.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
          {metadata.retryCount !== undefined && metadata.retryCount > 0 && (
            <div className="tool-result-metadata-item">
              <span className="tool-result-metadata-label">Retries:</span>
              <span className="tool-result-metadata-value">
                {metadata.retryCount}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolResult;
