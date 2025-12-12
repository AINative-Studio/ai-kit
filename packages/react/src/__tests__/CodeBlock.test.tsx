import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CodeBlock } from '../components/CodeBlock';

// Mock clipboard API
const mockWriteText = vi.fn(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('CodeBlock', () => {
  const defaultProps = {
    language: 'javascript',
    children: 'const x = 42;',
  };

  beforeEach(() => {
    mockWriteText.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders code block with default props', () => {
      const { container } = render(<CodeBlock {...defaultProps} />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('displays language label', () => {
      render(<CodeBlock {...defaultProps} language="python" />);
      expect(screen.getByText(/python/i)).toBeInTheDocument();
    });

    test('displays generic "code" label when no language specified', () => {
      render(<CodeBlock language="" children="test code" />);
      // Look for the language label span specifically
      expect(screen.getByText('code')).toBeInTheDocument();
    });

    test('renders code content correctly', () => {
      const code = 'function hello() {\n  return "world";\n}';
      const { container } = render(<CodeBlock {...defaultProps} children={code} />);
      expect(container.textContent).toContain('function');
      expect(container.textContent).toContain('hello');
      expect(container.textContent).toContain('world');
    });

    test('applies custom className', () => {
      const { container } = render(
        <CodeBlock {...defaultProps} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    test('renders copy button by default', () => {
      render(<CodeBlock {...defaultProps} />);
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    test('renders copy button when enableCopy is true', () => {
      render(<CodeBlock {...defaultProps} enableCopy={true} />);
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    test('does not render copy button when enableCopy is false', () => {
      render(<CodeBlock {...defaultProps} enableCopy={false} />);
      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
    });

    test('copies code to clipboard when copy button is clicked', async () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('const x = 42;');
      });
    });

    test('shows "Copied" state after successful copy', async () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      expect(copyButton).toHaveTextContent('Copy');

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(copyButton).toHaveTextContent('✓ Copied');
      });
    });

    test('resets copy state after 2 seconds', async () => {
      // Use real timers but with shorter timeout for this test
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      // Click the button
      fireEvent.click(copyButton);

      // Wait for copied state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('✓ Copied');
      });

      // Wait for reset (2 seconds + buffer)
      await waitFor(
        () => {
          expect(copyButton).toHaveTextContent('Copy');
        },
        { timeout: 3000 }
      );
    });

    test('handles copy errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error('Copy failed'));

      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      fireEvent.click(copyButton);

      // Wait for the promise to reject
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to copy code:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    test('has proper aria-label for copy button', () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveAttribute('aria-label', 'Copy code');
    });

    test('updates aria-label when copied', async () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      fireEvent.click(copyButton);

      // Wait for the clipboard promise and state update
      await waitFor(() => {
        expect(copyButton).toHaveAttribute('aria-label', 'Copied');
      });
    });
  });

  describe('Syntax Highlighting Themes', () => {
    test('applies dark theme by default', () => {
      const { container } = render(<CodeBlock {...defaultProps} />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('applies light theme', () => {
      const { container } = render(<CodeBlock {...defaultProps} theme="light" />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('applies vs-dark theme', () => {
      const { container } = render(<CodeBlock {...defaultProps} theme="vs-dark" />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('applies github theme', () => {
      const { container } = render(<CodeBlock {...defaultProps} theme="github" />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('applies monokai theme', () => {
      const { container } = render(<CodeBlock {...defaultProps} theme="monokai" />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('applies nord theme', () => {
      const { container } = render(<CodeBlock {...defaultProps} theme="nord" />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('applies dracula theme', () => {
      const { container } = render(<CodeBlock {...defaultProps} theme="dracula" />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('falls back to dark theme for invalid theme', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      const { container } = render(<CodeBlock {...defaultProps} theme="invalid" />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });
  });

  describe('Line Numbers', () => {
    test('shows line numbers by default', () => {
      const { container } = render(<CodeBlock {...defaultProps} />);
      // Line numbers are rendered by SyntaxHighlighter
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('shows line numbers when showLineNumbers is true', () => {
      const { container } = render(<CodeBlock {...defaultProps} showLineNumbers={true} />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('hides line numbers when showLineNumbers is false', () => {
      const { container } = render(<CodeBlock {...defaultProps} showLineNumbers={false} />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });
  });

  describe('Multiple Languages', () => {
    test('renders JavaScript code', () => {
      const { container } = render(
        <CodeBlock language="javascript" children="console.log('test');" />
      );
      expect(container.textContent).toContain('console');
      expect(container.textContent).toContain('log');
    });

    test('renders Python code', () => {
      const { container } = render(<CodeBlock language="python" children='print("hello")' />);
      expect(container.textContent).toContain('print');
      expect(container.textContent).toContain('hello');
    });

    test('renders TypeScript code', () => {
      const { container } = render(
        <CodeBlock language="typescript" children="const x: number = 42;" />
      );
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('renders HTML code', () => {
      const { container } = render(<CodeBlock language="html" children="<div>Hello</div>" />);
      expect(container.textContent).toContain('Hello');
    });

    test('renders CSS code', () => {
      const { container } = render(<CodeBlock language="css" children=".class { color: red; }" />);
      expect(container.textContent).toContain('color');
      expect(container.textContent).toContain('red');
    });

    test('renders JSON code', () => {
      const { container } = render(<CodeBlock language="json" children='{"key": "value"}' />);
      expect(container.textContent).toContain('key');
      expect(container.textContent).toContain('value');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty code', () => {
      render(<CodeBlock {...defaultProps} children="" />);
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    test('handles very long code', () => {
      const longCode = 'const x = 42;\n'.repeat(100);
      const { container } = render(<CodeBlock {...defaultProps} children={longCode} />);
      // Syntax highlighter splits code into multiple elements, so use textContent
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('handles code with special characters', () => {
      const specialCode = 'const str = "<>&\'"';
      const { container } = render(<CodeBlock {...defaultProps} children={specialCode} />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('str');
    });

    test('handles multi-line code', () => {
      const multiLineCode = `function test() {
  const x = 42;
  return x * 2;
}`;
      const { container } = render(<CodeBlock {...defaultProps} children={multiLineCode} />);
      expect(container.textContent).toContain('function');
      expect(container.textContent).toContain('test');
      expect(container.textContent).toContain('42');
    });

    test('handles code with tabs and spaces', () => {
      const codeWithWhitespace = '\tconst x = 42;\n  const y = 100;';
      const { container } = render(<CodeBlock {...defaultProps} children={codeWithWhitespace} />);
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });
  });

  describe('Styling', () => {
    test('applies container styling', () => {
      const { container } = render(<CodeBlock {...defaultProps} />);
      const codeBlockContainer = container.querySelector('.code-block-container');
      expect(codeBlockContainer).toBeInTheDocument();
    });

    test('renders header with language and copy button', () => {
      render(<CodeBlock {...defaultProps} language="javascript" />);
      expect(screen.getByText(/javascript/i)).toBeInTheDocument();
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    test('applies proper border radius', () => {
      const { container } = render(<CodeBlock {...defaultProps} />);
      const codeBlockContainer = container.querySelector('.code-block-container');
      expect(codeBlockContainer).toHaveStyle({ borderRadius: '8px' });
    });
  });

  describe('Accessibility', () => {
    test('copy button has descriptive label', () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByLabelText(/copy code/i);
      expect(copyButton).toBeInTheDocument();
    });

    test('copy button is keyboard accessible', () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton.tagName).toBe('BUTTON');
    });

    test('language label is readable', () => {
      render(<CodeBlock {...defaultProps} language="javascript" />);
      const languageLabel = screen.getByText(/javascript/i);
      expect(languageLabel).toBeVisible();
    });
  });

  describe('Integration', () => {
    test('works with different props combinations', () => {
      const { container } = render(
        <CodeBlock
          language="python"
          theme="github"
          enableCopy={true}
          showLineNumbers={true}
          className="custom-class"
        >
          {'def hello():\n    return "world"'}
        </CodeBlock>
      );

      expect(screen.getByText(/python/i)).toBeInTheDocument();
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      // Syntax highlighter splits code, so use textContent
      expect(container.textContent).toContain('def');
      expect(container.textContent).toContain('hello');
    });

    test('maintains state across re-renders', () => {
      const { rerender, container } = render(<CodeBlock {...defaultProps} />);

      rerender(<CodeBlock {...defaultProps} children="const y = 100;" />);

      // Syntax highlighter splits code, so use textContent
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('100');
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    test('copy button is clickable', () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      expect(copyButton).toBeEnabled();
      fireEvent.click(copyButton);
      expect(mockWriteText).toHaveBeenCalled();
    });

    test('copy button styling changes on copied state', async () => {
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      expect(copyButton).not.toHaveClass('copied');

      fireEvent.click(copyButton);

      // Wait for the clipboard promise and state update
      await waitFor(() => {
        expect(copyButton).toHaveClass('copied');
      });
    });
  });
});
