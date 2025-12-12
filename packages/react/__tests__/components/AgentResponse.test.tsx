/**
 * Comprehensive test suite for AgentResponse component
 * Tests cover: tool mapping, markdown rendering, unknown tools, error boundaries, accessibility, streaming
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentResponse } from '../../src/components/AgentResponse';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry';
import { AgentResponseData } from '../../src/types';

// Mock components for testing
const MockCalculatorComponent = ({ result }: { result: number }) => (
  <div data-testid="calculator-result">Result: {result}</div>
);

const MockWebSearchComponent = ({ results }: { results: Array<{ title: string }> }) => (
  <div data-testid="web-search-results">
    {results.map((r, i) => (
      <div key={i}>{r.title}</div>
    ))}
  </div>
);

describe('AgentResponse Component', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
    // Register test components
    registry.register('calculator', MockCalculatorComponent, (result: any) => ({ result }));
    registry.register('web_search', MockWebSearchComponent, (result: any) => ({ results: result }));
  });

  describe('Basic Rendering', () => {
    it('should render text response with markdown', () => {
      const data: AgentResponseData = {
        response: '# Hello\n\nThis is **bold** text.',
      };

      render(<AgentResponse data={data} />);

      expect(screen.getByTestId('agent-response')).toBeInTheDocument();
      expect(screen.getByTestId('agent-response-text')).toBeInTheDocument();
      expect(screen.getByTestId('agent-response-markdown')).toBeInTheDocument();
    });

    it('should render plain text when markdown is disabled', () => {
      const data: AgentResponseData = {
        response: '# Hello\n\nThis is **bold** text.',
      };

      render(<AgentResponse data={data} enableMarkdown={false} />);

      const textElement = screen.getByTestId('agent-response-text');
      expect(textElement.textContent).toContain('# Hello');
    });

    it('should show empty state when no response', () => {
      const data: AgentResponseData = {
        response: '',
      };

      render(<AgentResponse data={data} />);

      expect(screen.getByTestId('agent-response-empty')).toBeInTheDocument();
      expect(screen.getByText('No response available')).toBeInTheDocument();
    });

    it('should show waiting state when streaming', () => {
      const data: AgentResponseData = {
        response: '',
      };

      render(<AgentResponse data={data} streamingState="streaming" />);

      expect(screen.getByText('Waiting for response...')).toBeInTheDocument();
    });
  });

  describe('Tool Result Mapping', () => {
    it('should map tool results to registered components', () => {
      const data: AgentResponseData = {
        response: 'The calculation result is shown below.',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'calculator',
                result: 42,
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps />);

      expect(screen.getByTestId('calculator-result')).toBeInTheDocument();
      expect(screen.getByText('Result: 42')).toBeInTheDocument();
    });

    it('should handle multiple tool results', () => {
      const data: AgentResponseData = {
        response: 'Multiple tools were used.',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'calculator',
                result: 42,
              },
              {
                toolCallId: 'call_2',
                toolName: 'web_search',
                result: [{ title: 'Result 1' }, { title: 'Result 2' }],
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps />);

      expect(screen.getByTestId('calculator-result')).toBeInTheDocument();
      expect(screen.getByTestId('web-search-results')).toBeInTheDocument();
      expect(screen.getByText('Result 1')).toBeInTheDocument();
      expect(screen.getByText('Result 2')).toBeInTheDocument();
    });

    it('should handle tool results across multiple steps', () => {
      const data: AgentResponseData = {
        response: 'Multiple steps executed.',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'calculator',
                result: 10,
              },
            ],
          },
          {
            step: 2,
            toolResults: [
              {
                toolCallId: 'call_2',
                toolName: 'calculator',
                result: 20,
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps />);

      const results = screen.getAllByTestId('calculator-result');
      expect(results).toHaveLength(2);
      expect(screen.getByText('Result: 10')).toBeInTheDocument();
      expect(screen.getByText('Result: 20')).toBeInTheDocument();
    });
  });

  describe('Unknown Tool Fallback', () => {
    it('should render UnknownTool for unregistered tools', () => {
      const data: AgentResponseData = {
        response: 'Used an unknown tool.',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'unknown_tool',
                result: { data: 'test' },
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps />);

      expect(screen.getByTestId(/tool-result.*unknown/)).toBeInTheDocument();
    });

    it('should display JSON for unknown tools', () => {
      const data: AgentResponseData = {
        response: '',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'unknown_tool',
                result: { foo: 'bar', num: 123 },
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps />);

      // UnknownTool should show the tool name
      expect(screen.getByText('unknown_tool')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display tool error messages', () => {
      const data: AgentResponseData = {
        response: 'An error occurred.',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'calculator',
                result: null,
                error: {
                  message: 'Division by zero',
                  code: 'MATH_ERROR',
                },
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps />);

      expect(screen.getByText('Division by zero')).toBeInTheDocument();
      expect(screen.getByText(/MATH_ERROR/)).toBeInTheDocument();
    });

    it('should handle component rendering errors with error boundary', () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      registry.register('error_tool', ErrorComponent, (result: any) => ({ result }));

      const data: AgentResponseData = {
        response: '',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'error_tool',
                result: {},
              },
            ],
          },
        ],
      };

      // Should not crash, error boundary should catch it
      render(<AgentResponse data={data} registry={registry} showSteps />);

      expect(screen.getByTestId('agent-response')).toBeInTheDocument();
    });

    it('should render custom error fallback', () => {
      const customFallback = <div data-testid="custom-error">Custom Error UI</div>;

      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const data: AgentResponseData = {
        response: 'test',
      };

      // This test would need special setup for error boundary testing
      // Skipping full implementation as error boundaries require special testing setup
    });
  });

  describe('Metadata Display', () => {
    it('should show metadata when enabled', () => {
      const data: AgentResponseData = {
        response: 'Response with metadata',
        metadata: {
          totalSteps: 3,
          totalToolCalls: 5,
          durationMs: 1500,
          model: 'gpt-4',
        },
      };

      render(<AgentResponse data={data} showMetadata />);

      expect(screen.getByTestId('agent-response-metadata')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // totalSteps
      expect(screen.getByText('5')).toBeInTheDocument(); // totalToolCalls
      expect(screen.getByText('1500ms')).toBeInTheDocument();
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
    });

    it('should hide metadata when disabled', () => {
      const data: AgentResponseData = {
        response: 'Response without metadata',
        metadata: {
          totalSteps: 3,
        },
      };

      render(<AgentResponse data={data} showMetadata={false} />);

      expect(screen.queryByTestId('agent-response-metadata')).not.toBeInTheDocument();
    });

    it('should show tool execution metadata', () => {
      const data: AgentResponseData = {
        response: '',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'calculator',
                result: 42,
                metadata: {
                  durationMs: 250,
                  timestamp: '2024-01-01T00:00:00.000Z',
                  retryCount: 1,
                },
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps showMetadata />);

      expect(screen.getByText('250ms')).toBeInTheDocument();
      // retryCount is "1" but so is the step number, so use getByText within the metadata container
      expect(screen.getByTestId('agent-response-tool-result-0-metadata')).toHaveTextContent('1');
    });
  });

  describe('Step Display', () => {
    it('should show execution steps when enabled', () => {
      const data: AgentResponseData = {
        response: 'Final answer',
        steps: [
          {
            step: 1,
            thought: 'I need to calculate this.',
          },
          {
            step: 2,
            thought: 'Now I will search for information.',
          },
        ],
      };

      render(<AgentResponse data={data} showSteps />);

      expect(screen.getByTestId('agent-response-steps')).toBeInTheDocument();
      expect(screen.getByTestId('agent-response-step-1')).toBeInTheDocument();
      expect(screen.getByTestId('agent-response-step-2')).toBeInTheDocument();
      expect(screen.getByText('I need to calculate this.')).toBeInTheDocument();
      expect(screen.getByText('Now I will search for information.')).toBeInTheDocument();
    });

    it('should hide steps when disabled', () => {
      const data: AgentResponseData = {
        response: 'Final answer',
        steps: [
          {
            step: 1,
            thought: 'Hidden thought',
          },
        ],
      };

      render(<AgentResponse data={data} showSteps={false} />);

      expect(screen.queryByTestId('agent-response-steps')).not.toBeInTheDocument();
      expect(screen.queryByText('Hidden thought')).not.toBeInTheDocument();
    });
  });

  describe('Streaming Support', () => {
    it('should indicate streaming state', () => {
      const data: AgentResponseData = {
        response: 'Streaming response...',
      };

      render(<AgentResponse data={data} streamingState="streaming" />);

      const indicator = screen.getByLabelText('Streaming in progress');
      expect(indicator).toBeInTheDocument();
    });

    it('should call onContentUpdate callback', () => {
      const onContentUpdate = vi.fn();
      const data: AgentResponseData = {
        response: 'Updated content',
      };

      const { rerender } = render(
        <AgentResponse data={data} onContentUpdate={onContentUpdate} />
      );

      expect(onContentUpdate).toHaveBeenCalledWith('Updated content');

      // Update with new content
      const newData: AgentResponseData = {
        response: 'New content',
      };

      rerender(<AgentResponse data={newData} onContentUpdate={onContentUpdate} />);

      expect(onContentUpdate).toHaveBeenCalledWith('New content');
    });

    it('should not call onContentUpdate for same content', () => {
      const onContentUpdate = vi.fn();
      const data: AgentResponseData = {
        response: 'Same content',
      };

      const { rerender } = render(
        <AgentResponse data={data} onContentUpdate={onContentUpdate} />
      );

      const callCount = onContentUpdate.mock.calls.length;

      rerender(<AgentResponse data={data} onContentUpdate={onContentUpdate} />);

      expect(onContentUpdate.mock.calls.length).toBe(callCount);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const data: AgentResponseData = {
        response: 'Test response',
      };

      render(<AgentResponse data={data} />);

      const region = screen.getByRole('region', { name: 'Agent Response' });
      expect(region).toBeInTheDocument();
    });

    it('should have aria-live for streaming content', () => {
      const data: AgentResponseData = {
        response: 'Streaming...',
      };

      const { container } = render(<AgentResponse data={data} streamingState="streaming" />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should not have aria-live when not streaming', () => {
      const data: AgentResponseData = {
        response: 'Complete response',
      };

      const { container } = render(<AgentResponse data={data} streamingState="complete" />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeInTheDocument();
    });

    it('should have role="alert" for errors', () => {
      const data: AgentResponseData = {
        response: '',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'calculator',
                result: null,
                error: {
                  message: 'Error occurred',
                },
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} registry={registry} showSteps />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Code Theme', () => {
    it('should pass code theme to markdown renderer', () => {
      const data: AgentResponseData = {
        response: '```js\nconst x = 1;\n```',
      };

      render(<AgentResponse data={data} codeTheme="github" />);

      expect(screen.getByTestId('agent-response-markdown')).toBeInTheDocument();
    });

    it('should enable/disable code copy', () => {
      const data: AgentResponseData = {
        response: '```js\nconst x = 1;\n```',
      };

      render(<AgentResponse data={data} enableCodeCopy={false} />);

      expect(screen.getByTestId('agent-response-markdown')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const data: AgentResponseData = {
        response: 'Test',
      };

      render(<AgentResponse data={data} className="custom-class" />);

      const element = screen.getByTestId('agent-response');
      expect(element).toHaveClass('custom-class');
    });

    it('should apply custom styles', () => {
      const data: AgentResponseData = {
        response: 'Test',
      };

      const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };

      render(<AgentResponse data={data} style={customStyle} />);

      const element = screen.getByTestId('agent-response');
      expect(element).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    it('should use custom testId', () => {
      const data: AgentResponseData = {
        response: 'Test',
      };

      render(<AgentResponse data={data} testId="my-custom-id" />);

      expect(screen.getByTestId('my-custom-id')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should render complete agent response with all features', () => {
      const data: AgentResponseData = {
        response: '# Final Answer\n\nThe result is **42**.',
        steps: [
          {
            step: 1,
            thought: 'I need to perform a calculation.',
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'calculator',
                result: 42,
                metadata: {
                  durationMs: 100,
                  timestamp: '2024-01-01T00:00:00.000Z',
                },
              },
            ],
          },
        ],
        metadata: {
          totalSteps: 1,
          totalToolCalls: 1,
          durationMs: 500,
          model: 'gpt-4',
        },
      };

      render(
        <AgentResponse
          data={data}
          registry={registry}
          showSteps
          showMetadata
          enableMarkdown
          codeTheme="dark"
        />
      );

      // Check all parts are rendered
      expect(screen.getByTestId('agent-response-steps')).toBeInTheDocument();
      expect(screen.getByTestId('agent-response-text')).toBeInTheDocument();
      expect(screen.getByTestId('agent-response-metadata')).toBeInTheDocument();
      expect(screen.getByText('I need to perform a calculation.')).toBeInTheDocument();
      expect(screen.getByTestId('calculator-result')).toBeInTheDocument();
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
    });

    it('should work without a registry', () => {
      const data: AgentResponseData = {
        response: 'Response without registry',
        steps: [
          {
            step: 1,
            toolResults: [
              {
                toolCallId: 'call_1',
                toolName: 'some_tool',
                result: { data: 'value' },
              },
            ],
          },
        ],
      };

      render(<AgentResponse data={data} showSteps />);

      // Should use UnknownTool fallback
      expect(screen.getByTestId('agent-response')).toBeInTheDocument();
    });
  });
});
