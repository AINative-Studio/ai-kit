import React, { useEffect, useState, useRef } from 'react';
import { StreamingToolResultProps, ToolExecutionState } from '../types';
import { ProgressBar } from './ProgressBar';

/**
 * StreamingToolResult - Displays tool execution status with real-time updates
 *
 * Features:
 * - Progress indicator during tool execution
 * - Real-time status updates with smooth transitions
 * - Error state with optional retry functionality
 * - Success state with formatted result display
 * - Accessible loading states (aria-live)
 * - Customizable progress UI and result rendering
 * - Automatic duration tracking and display
 *
 * @example
 * ```tsx
 * const [status, setStatus] = useState<ToolExecutionStatus>({
 *   state: 'executing',
 *   toolName: 'web_search',
 *   message: 'Searching...',
 *   progress: 50,
 * });
 *
 * <StreamingToolResult
 *   status={status}
 *   result={toolResult}
 *   enableRetry
 *   onRetry={() => retryExecution()}
 *   onComplete={(result) => console.log('Done:', result)}
 * />
 * ```
 */
export const StreamingToolResult: React.FC<StreamingToolResultProps> = ({
  status,
  result,
  progressColor = '#3b82f6',
  showProgress = true,
  showStatusMessage = true,
  showToolName = true,
  showDuration = true,
  enableRetry = false,
  onRetry,
  onComplete,
  onError,
  renderResult,
  renderError,
  className = '',
  style,
  testId = 'streaming-tool-result',
  ariaLabel,
}) => {
  const [previousState, setPreviousState] = useState<ToolExecutionState>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasCalledComplete = useRef(false);
  const hasCalledError = useRef(false);

  // Handle state transitions
  useEffect(() => {
    if (status.state !== previousState) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousState(status.state);
      }, 300);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [status.state, previousState]);

  // Call onComplete when execution succeeds
  useEffect(() => {
    if (status.state === 'success' && result && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete?.(result);
    }
  }, [status.state, result, onComplete]);

  // Call onError when execution fails
  useEffect(() => {
    if (status.state === 'error' && status.error && !hasCalledError.current) {
      hasCalledError.current = true;
      onError?.(status.error);
    }
  }, [status.state, status.error, onError]);

  // Reset callbacks when state changes from terminal states
  useEffect(() => {
    if (status.state === 'executing' || status.state === 'idle') {
      hasCalledComplete.current = false;
      hasCalledError.current = false;
    }
  }, [status.state]);

  // Calculate duration display
  const getDurationDisplay = (): string | null => {
    if (!showDuration) return null;

    const { startTime, endTime, durationMs } = status;

    if (durationMs !== undefined) {
      if (durationMs < 1000) {
        return `${durationMs}ms`;
      }
      return `${(durationMs / 1000).toFixed(2)}s`;
    }

    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const duration = end - start;
      if (duration < 1000) {
        return `${duration}ms`;
      }
      return `${(duration / 1000).toFixed(2)}s`;
    }

    return null;
  };

  // Render tool name header
  const renderToolName = () => {
    if (!showToolName || !status.toolName) return null;

    return (
      <div
        className="tool-result-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              fontFamily: 'monospace',
            }}
            data-testid={`${testId}-tool-name`}
          >
            {status.toolName}
          </span>
          {renderStateIndicator()}
        </div>
        {getDurationDisplay() && (
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'monospace',
            }}
            data-testid={`${testId}-duration`}
          >
            {getDurationDisplay()}
          </span>
        )}
      </div>
    );
  };

  // Render state indicator badge
  const renderStateIndicator = () => {
    const stateConfig = {
      idle: { label: 'Idle', color: '#9ca3af', bg: '#f3f4f6' },
      executing: { label: 'Executing', color: '#3b82f6', bg: '#dbeafe' },
      success: { label: 'Success', color: '#10b981', bg: '#d1fae5' },
      error: { label: 'Error', color: '#ef4444', bg: '#fee2e2' },
    };

    const config = stateConfig[status.state];

    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: config.color,
          backgroundColor: config.bg,
          padding: '2px 8px',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
        data-testid={`${testId}-state-badge`}
      >
        {config.label}
      </span>
    );
  };

  // Render status message
  const renderStatusMessage = () => {
    if (!showStatusMessage || !status.message) return null;

    return (
      <div
        style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '12px',
          fontStyle: 'italic',
        }}
        data-testid={`${testId}-status-message`}
        aria-live="polite"
      >
        {status.message}
      </div>
    );
  };

  // Render progress indicator
  const renderProgress = () => {
    if (!showProgress || status.state !== 'executing') return null;

    return (
      <div style={{ marginBottom: '16px' }} data-testid={`${testId}-progress`}>
        <ProgressBar
          mode={status.progress !== undefined ? 'determinate' : 'indeterminate'}
          value={status.progress}
          color={progressColor}
          height="6px"
          showLabel={status.progress !== undefined}
          labelPosition="right"
          testId={`${testId}-progress-bar`}
        />
      </div>
    );
  };

  // Render success result
  const renderSuccessResult = () => {
    if (status.state !== 'success' || !result) return null;

    if (renderResult) {
      return (
        <div className="tool-result-content" data-testid={`${testId}-result-content`}>
          {renderResult(result)}
        </div>
      );
    }

    // Default result rendering
    return (
      <div
        className="tool-result-content"
        style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: '400px',
          overflow: 'auto',
        }}
        data-testid={`${testId}-result-content`}
      >
        <div style={{ marginBottom: '8px', fontWeight: 600, color: '#059669' }}>
          Result:
        </div>
        {typeof result.result === 'string' ? (
          <div>{result.result}</div>
        ) : (
          <pre style={{ margin: 0, fontSize: '13px' }}>
            {JSON.stringify(result.result, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  // Render error state
  const renderErrorState = () => {
    if (status.state !== 'error') return null;

    const errorMessage = status.error || result?.error?.message || 'An unknown error occurred';

    if (renderError) {
      return (
        <div className="tool-result-error" data-testid={`${testId}-error-content`}>
          {renderError(errorMessage)}
        </div>
      );
    }

    // Default error rendering
    return (
      <div
        className="tool-result-error"
        style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '16px',
        }}
        data-testid={`${testId}-error-content`}
        role="alert"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, marginTop: '2px' }}
          >
            <circle cx="10" cy="10" r="9" fill="#ef4444" />
            <path
              d="M10 6v4m0 4h.01"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#dc2626',
                marginBottom: '8px',
              }}
            >
              Execution Failed
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#991b1b',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              data-testid={`${testId}-error-message`}
            >
              {errorMessage}
            </div>
            {result?.error?.code && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#b91c1c',
                  marginTop: '8px',
                  fontFamily: 'monospace',
                }}
              >
                Error Code: {result.error.code}
              </div>
            )}
          </div>
        </div>
        {enableRetry && onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
            data-testid={`${testId}-retry-button`}
          >
            Retry
          </button>
        )}
      </div>
    );
  };

  // Determine ARIA label
  const getAriaLabel = (): string => {
    if (ariaLabel) return ariaLabel;

    const toolName = status.toolName || 'Tool';
    switch (status.state) {
      case 'executing':
        return `${toolName} is executing`;
      case 'success':
        return `${toolName} completed successfully`;
      case 'error':
        return `${toolName} failed with error`;
      default:
        return `${toolName} execution status`;
    }
  };

  return (
    <>
      <style>{`
        .streaming-tool-result {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
        }

        .streaming-tool-result.transitioning {
          opacity: 0.7;
        }

        .tool-result-content::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .tool-result-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .tool-result-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .tool-result-content::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .streaming-tool-result {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      <div
        className={`streaming-tool-result ${isTransitioning ? 'transitioning' : ''} ${className}`}
        style={{
          padding: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          transition: 'opacity 0.3s ease',
          ...style,
        }}
        data-testid={testId}
        data-state={status.state}
        aria-label={getAriaLabel()}
        aria-live="polite"
        aria-busy={status.state === 'executing'}
      >
        {renderToolName()}
        {renderStatusMessage()}
        {renderProgress()}
        {renderSuccessResult()}
        {renderErrorState()}

        {/* Idle state */}
        {status.state === 'idle' && (
          <div
            style={{
              fontSize: '14px',
              color: '#9ca3af',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '16px',
            }}
            data-testid={`${testId}-idle-message`}
          >
            Waiting to execute...
          </div>
        )}
      </div>
    </>
  );
};

export default StreamingToolResult;
