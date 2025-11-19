import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, afterEach, vi, beforeEach } from 'vitest';
import { StreamingToolResult } from '../../src/components/StreamingToolResult';
import { ToolExecutionStatus, ToolResultData } from '../../src/types';

// Mock timers for transition tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('StreamingToolResult', () => {
  const mockToolResult: ToolResultData = {
    toolCallId: 'call_123',
    toolName: 'web_search',
    result: { data: 'Search results here' },
    metadata: {
      durationMs: 1500,
      timestamp: '2025-01-01T00:00:00Z',
    },
  };


  describe('Basic Rendering', () => {
    test('renders with idle state', () => {
      const status: ToolExecutionStatus = {
        state: 'idle',
        toolName: 'test_tool',
      };

      render(<StreamingToolResult status={status} />);

      expect(screen.getByTestId('streaming-tool-result')).toBeInTheDocument();
      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'idle');
      expect(screen.getByText('Waiting to execute...')).toBeInTheDocument();
    });

    test('renders with executing state', () => {
      const status: ToolExecutionStatus = {
        state: 'executing',
        toolName: 'web_search',
        message: 'Searching the web...',
      };

      render(<StreamingToolResult status={status} />);

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'executing');
      expect(screen.getByText('Searching the web...')).toBeInTheDocument();
      expect(screen.getByTestId('streaming-tool-result-progress')).toBeInTheDocument();
    });

    test('renders with success state', () => {
      const status: ToolExecutionStatus = {
        state: 'success',
        toolName: 'web_search',
      };

      render(<StreamingToolResult status={status} result={mockToolResult} />);

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'success');
      expect(screen.getByTestId('streaming-tool-result-result-content')).toBeInTheDocument();
      expect(screen.getByText('Result:')).toBeInTheDocument();
    });

    test('renders with error state', () => {
      const status: ToolExecutionStatus = {
        state: 'error',
        toolName: 'web_search',
        error: 'Network connection failed',
      };

      render(<StreamingToolResult status={status} />);

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'error');
      expect(screen.getByTestId('streaming-tool-result-error-content')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      expect(screen.getByText('Execution Failed')).toBeInTheDocument();
    });

    test('applies custom className and style', () => {
      const status: ToolExecutionStatus = { state: 'idle' };
      const customStyle = { backgroundColor: 'red' };

      render(
        <StreamingToolResult
          status={status}
          className="custom-class"
          style={customStyle}
        />
      );

      const element = screen.getByTestId('streaming-tool-result');
      expect(element).toHaveClass('custom-class');
      // Style is merged with default styles
      expect(element.style.backgroundColor).toBeTruthy();
    });

    test('uses custom testId', () => {
      const status: ToolExecutionStatus = { state: 'idle' };

      render(<StreamingToolResult status={status} testId="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Progress Updates', () => {
    test('shows indeterminate progress when no progress value', () => {
      const status: ToolExecutionStatus = {
        state: 'executing',
        toolName: 'test_tool',
      };

      render(<StreamingToolResult status={status} />);

      const progressBar = screen.getByTestId('streaming-tool-result-progress-bar');
      expect(progressBar).toHaveAttribute('data-mode', 'indeterminate');
    });

    test('shows determinate progress when progress value provided', () => {
      const status: ToolExecutionStatus = {
        state: 'executing',
        toolName: 'test_tool',
        progress: 75,
      };

      render(<StreamingToolResult status={status} />);

      const progressBar = screen.getByTestId('streaming-tool-result-progress-bar');
      expect(progressBar).toHaveAttribute('data-mode', 'determinate');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    test('updates progress value', () => {
      const { rerender } = render(
        <StreamingToolResult
          status={{ state: 'executing', progress: 25 }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result-progress-bar')).toHaveAttribute(
        'aria-valuenow',
        '25'
      );

      rerender(
        <StreamingToolResult
          status={{ state: 'executing', progress: 75 }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result-progress-bar')).toHaveAttribute(
        'aria-valuenow',
        '75'
      );
    });

    test('hides progress when showProgress is false', () => {
      const status: ToolExecutionStatus = {
        state: 'executing',
        toolName: 'test_tool',
      };

      render(<StreamingToolResult status={status} showProgress={false} />);

      expect(screen.queryByTestId('streaming-tool-result-progress')).not.toBeInTheDocument();
    });

    test('uses custom progress color', () => {
      const status: ToolExecutionStatus = {
        state: 'executing',
        toolName: 'test_tool',
      };

      render(<StreamingToolResult status={status} progressColor="#10b981" />);

      // Progress bar uses the color prop internally
      expect(screen.getByTestId('streaming-tool-result-progress')).toBeInTheDocument();
    });
  });

  describe('Completion Transitions', () => {
    test('transitions from executing to success', async () => {
      const { rerender } = render(
        <StreamingToolResult
          status={{ state: 'executing', toolName: 'test' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'executing');

      rerender(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test' }}
          result={mockToolResult}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'success');

      // Fast-forward timers for transition
      act(() => {
        vi.advanceTimersByTime(300);
      });
    });

    test('transitions from executing to error', async () => {
      const { rerender } = render(
        <StreamingToolResult
          status={{ state: 'executing', toolName: 'test' }}
        />
      );

      rerender(
        <StreamingToolResult
          status={{ state: 'error', toolName: 'test', error: 'Failed' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'error');
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    test('calls onComplete when execution succeeds', () => {
      const onComplete = vi.fn();

      render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test' }}
          result={mockToolResult}
          onComplete={onComplete}
        />
      );

      expect(onComplete).toHaveBeenCalledWith(mockToolResult);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    test('does not call onComplete multiple times for same success state', () => {
      const onComplete = vi.fn();

      const { rerender } = render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test' }}
          result={mockToolResult}
          onComplete={onComplete}
        />
      );

      rerender(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test' }}
          result={mockToolResult}
          onComplete={onComplete}
        />
      );

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error States', () => {
    test('renders error with error message', () => {
      const status: ToolExecutionStatus = {
        state: 'error',
        error: 'API key invalid',
      };

      render(<StreamingToolResult status={status} />);

      expect(screen.getByTestId('streaming-tool-result-error-content')).toBeInTheDocument();
      expect(screen.getByText('API key invalid')).toBeInTheDocument();
    });

    test('renders error from result object', () => {
      const errorResult: ToolResultData = {
        ...mockToolResult,
        error: {
          message: 'Connection timeout',
          code: 'TIMEOUT',
        },
      };

      render(
        <StreamingToolResult
          status={{ state: 'error' }}
          result={errorResult}
        />
      );

      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      expect(screen.getByText('Error Code: TIMEOUT')).toBeInTheDocument();
    });

    test('renders default error message when no error provided', () => {
      render(<StreamingToolResult status={{ state: 'error' }} />);

      expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    });

    test('calls onError when execution fails', () => {
      const onError = vi.fn();

      render(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed!' }}
          onError={onError}
        />
      );

      expect(onError).toHaveBeenCalledWith('Failed!');
      expect(onError).toHaveBeenCalledTimes(1);
    });

    test('does not call onError multiple times for same error state', () => {
      const onError = vi.fn();

      const { rerender } = render(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed!' }}
          onError={onError}
        />
      );

      rerender(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed!' }}
          onError={onError}
        />
      );

      expect(onError).toHaveBeenCalledTimes(1);
    });

    test('has proper ARIA role for error', () => {
      render(<StreamingToolResult status={{ state: 'error', error: 'Failed' }} />);

      expect(screen.getByTestId('streaming-tool-result-error-content')).toHaveAttribute(
        'role',
        'alert'
      );
    });
  });

  describe('Retry Functionality', () => {
    test('shows retry button when enableRetry is true and onRetry provided', () => {
      const onRetry = vi.fn();

      render(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed' }}
          enableRetry
          onRetry={onRetry}
        />
      );

      expect(screen.getByTestId('streaming-tool-result-retry-button')).toBeInTheDocument();
    });

    test('does not show retry button when enableRetry is false', () => {
      const onRetry = vi.fn();

      render(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed' }}
          enableRetry={false}
          onRetry={onRetry}
        />
      );

      expect(screen.queryByTestId('streaming-tool-result-retry-button')).not.toBeInTheDocument();
    });

    test('does not show retry button when onRetry not provided', () => {
      render(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed' }}
          enableRetry
        />
      );

      expect(screen.queryByTestId('streaming-tool-result-retry-button')).not.toBeInTheDocument();
    });

    test('calls onRetry when retry button clicked', () => {
      const onRetry = vi.fn();

      render(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed' }}
          enableRetry
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByTestId('streaming-tool-result-retry-button');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Display Options', () => {
    test('shows tool name when showToolName is true', () => {
      render(
        <StreamingToolResult
          status={{ state: 'idle', toolName: 'my_tool' }}
          showToolName
        />
      );

      expect(screen.getByTestId('streaming-tool-result-tool-name')).toBeInTheDocument();
      expect(screen.getByText('my_tool')).toBeInTheDocument();
    });

    test('hides tool name when showToolName is false', () => {
      render(
        <StreamingToolResult
          status={{ state: 'idle', toolName: 'my_tool' }}
          showToolName={false}
        />
      );

      expect(screen.queryByTestId('streaming-tool-result-tool-name')).not.toBeInTheDocument();
    });

    test('shows status message when showStatusMessage is true', () => {
      render(
        <StreamingToolResult
          status={{ state: 'executing', message: 'Processing...' }}
          showStatusMessage
        />
      );

      expect(screen.getByTestId('streaming-tool-result-status-message')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    test('hides status message when showStatusMessage is false', () => {
      render(
        <StreamingToolResult
          status={{ state: 'executing', message: 'Processing...' }}
          showStatusMessage={false}
        />
      );

      expect(screen.queryByTestId('streaming-tool-result-status-message')).not.toBeInTheDocument();
    });

    test('shows duration from durationMs', () => {
      render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test', durationMs: 2500 }}
          result={mockToolResult}
          showDuration
        />
      );

      expect(screen.getByTestId('streaming-tool-result-duration')).toBeInTheDocument();
      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });

    test('shows duration in milliseconds for short durations', () => {
      render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test', durationMs: 500 }}
          result={mockToolResult}
          showDuration
        />
      );

      expect(screen.getByText('500ms')).toBeInTheDocument();
    });

    test('calculates duration from startTime and endTime', () => {
      render(
        <StreamingToolResult
          status={{
            state: 'success',
            toolName: 'test',
            startTime: '2025-01-01T00:00:00.000Z',
            endTime: '2025-01-01T00:00:03.500Z',
          }}
          result={mockToolResult}
          showDuration
        />
      );

      expect(screen.getByTestId('streaming-tool-result-duration')).toBeInTheDocument();
      expect(screen.getByText('3.50s')).toBeInTheDocument();
    });

    test('hides duration when showDuration is false', () => {
      render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test', durationMs: 1000 }}
          result={mockToolResult}
          showDuration={false}
        />
      );

      expect(screen.queryByTestId('streaming-tool-result-duration')).not.toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    test('uses custom renderResult function', () => {
      const renderResult = vi.fn(() => <div>Custom Result</div>);

      render(
        <StreamingToolResult
          status={{ state: 'success' }}
          result={mockToolResult}
          renderResult={renderResult}
        />
      );

      expect(renderResult).toHaveBeenCalledWith(mockToolResult);
      expect(screen.getByText('Custom Result')).toBeInTheDocument();
    });

    test('uses custom renderError function', () => {
      const renderError = vi.fn(() => <div>Custom Error</div>);

      render(
        <StreamingToolResult
          status={{ state: 'error', error: 'Failed' }}
          renderError={renderError}
        />
      );

      expect(renderError).toHaveBeenCalledWith('Failed');
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has aria-label for idle state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'idle', toolName: 'test_tool' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute(
        'aria-label',
        'test_tool execution status'
      );
    });

    test('has aria-label for executing state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'executing', toolName: 'test_tool' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute(
        'aria-label',
        'test_tool is executing'
      );
    });

    test('has aria-label for success state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test_tool' }}
          result={mockToolResult}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute(
        'aria-label',
        'test_tool completed successfully'
      );
    });

    test('has aria-label for error state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'error', toolName: 'test_tool' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute(
        'aria-label',
        'test_tool failed with error'
      );
    });

    test('uses custom ariaLabel when provided', () => {
      render(
        <StreamingToolResult
          status={{ state: 'idle' }}
          ariaLabel="Custom accessibility label"
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute(
        'aria-label',
        'Custom accessibility label'
      );
    });

    test('has aria-live polite for real-time updates', () => {
      render(
        <StreamingToolResult
          status={{ state: 'executing' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('aria-live', 'polite');
    });

    test('has aria-busy true when executing', () => {
      render(
        <StreamingToolResult
          status={{ state: 'executing' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('aria-busy', 'true');
    });

    test('has aria-busy false when not executing', () => {
      render(
        <StreamingToolResult
          status={{ state: 'success' }}
          result={mockToolResult}
        />
      );

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('aria-busy', 'false');
    });

    test('status message has aria-live for screen reader updates', () => {
      render(
        <StreamingToolResult
          status={{ state: 'executing', message: 'Loading...' }}
        />
      );

      expect(screen.getByTestId('streaming-tool-result-status-message')).toHaveAttribute(
        'aria-live',
        'polite'
      );
    });
  });

  describe('Async State Management', () => {
    test('resets callbacks when transitioning back to executing', () => {
      const onComplete = vi.fn();
      const onError = vi.fn();

      const { rerender } = render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test' }}
          result={mockToolResult}
          onComplete={onComplete}
          onError={onError}
        />
      );

      expect(onComplete).toHaveBeenCalledTimes(1);

      // Transition back to executing
      rerender(
        <StreamingToolResult
          status={{ state: 'executing', toolName: 'test' }}
          onComplete={onComplete}
          onError={onError}
        />
      );

      // Transition to success again - should call onComplete again
      rerender(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test' }}
          result={mockToolResult}
          onComplete={onComplete}
          onError={onError}
        />
      );

      expect(onComplete).toHaveBeenCalledTimes(2);
    });

    test('handles rapid state changes', () => {
      const { rerender } = render(
        <StreamingToolResult status={{ state: 'idle' }} />
      );

      rerender(<StreamingToolResult status={{ state: 'executing' }} />);
      rerender(<StreamingToolResult status={{ state: 'success' }} result={mockToolResult} />);

      expect(screen.getByTestId('streaming-tool-result')).toHaveAttribute('data-state', 'success');
    });
  });

  describe('Result Display', () => {
    test('displays string result directly', () => {
      const stringResult: ToolResultData = {
        ...mockToolResult,
        result: 'Simple string result',
      };

      render(
        <StreamingToolResult
          status={{ state: 'success' }}
          result={stringResult}
        />
      );

      expect(screen.getByText('Simple string result')).toBeInTheDocument();
    });

    test('displays object result as formatted JSON', () => {
      const objectResult: ToolResultData = {
        ...mockToolResult,
        result: { key: 'value', nested: { data: 123 } },
      };

      render(
        <StreamingToolResult
          status={{ state: 'success' }}
          result={objectResult}
        />
      );

      const resultContent = screen.getByTestId('streaming-tool-result-result-content');
      expect(resultContent).toBeInTheDocument();
      expect(resultContent.textContent).toContain('key');
      expect(resultContent.textContent).toContain('value');
    });
  });

  describe('State Badges', () => {
    test('shows correct badge for idle state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'idle', toolName: 'test' }}
        />
      );

      const badge = screen.getByTestId('streaming-tool-result-state-badge');
      expect(badge).toHaveTextContent(/idle/i);
    });

    test('shows correct badge for executing state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'executing', toolName: 'test' }}
        />
      );

      const badge = screen.getByTestId('streaming-tool-result-state-badge');
      expect(badge).toHaveTextContent(/executing/i);
    });

    test('shows correct badge for success state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'success', toolName: 'test' }}
          result={mockToolResult}
        />
      );

      const badge = screen.getByTestId('streaming-tool-result-state-badge');
      expect(badge).toHaveTextContent(/success/i);
    });

    test('shows correct badge for error state', () => {
      render(
        <StreamingToolResult
          status={{ state: 'error', toolName: 'test' }}
        />
      );

      const badge = screen.getByTestId('streaming-tool-result-state-badge');
      expect(badge).toHaveTextContent(/error/i);
    });
  });
});
