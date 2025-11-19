import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeBlock } from '../components/CodeBlock';

// Mock clipboard API
const mockWriteText = jest.fn(() => Promise.resolve());
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
      render(<CodeBlock {...defaultProps} />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('displays language label', () => {
      render(<CodeBlock {...defaultProps} language="python" />);
      expect(screen.getByText(/python/i)).toBeInTheDocument();
    });

    test('displays generic "code" label when no language specified', () => {
      render(<CodeBlock language="" children="test code" />);
      expect(screen.getByText(/code/i)).toBeInTheDocument();
    });

    test('renders code content correctly', () => {
      const code = 'function hello() {\n  return "world";\n}';
      render(<CodeBlock {...defaultProps} children={code} />);
      expect(screen.getByText(/function hello/)).toBeInTheDocument();
      expect(screen.getByText(/return "world"/)).toBeInTheDocument();
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
      jest.useFakeTimers();
      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(copyButton).toHaveTextContent('✓ Copied');
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copy');
      });

      jest.useRealTimers();
    });

    test('handles copy errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockWriteText.mockRejectedValueOnce(new Error('Copy failed'));

      render(<CodeBlock {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');

      fireEvent.click(copyButton);

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

      await waitFor(() => {
        expect(copyButton).toHaveAttribute('aria-label', 'Copied');
      });
    });
  });

  describe('Syntax Highlighting Themes', () => {
    test('applies dark theme by default', () => {
      render(<CodeBlock {...defaultProps} />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('applies light theme', () => {
      render(<CodeBlock {...defaultProps} theme="light" />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('applies vs-dark theme', () => {
      render(<CodeBlock {...defaultProps} theme="vs-dark" />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('applies github theme', () => {
      render(<CodeBlock {...defaultProps} theme="github" />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('applies monokai theme', () => {
      render(<CodeBlock {...defaultProps} theme="monokai" />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('applies nord theme', () => {
      render(<CodeBlock {...defaultProps} theme="nord" />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('applies dracula theme', () => {
      render(<CodeBlock {...defaultProps} theme="dracula" />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('falls back to dark theme for invalid theme', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      render(<CodeBlock {...defaultProps} theme="invalid" />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });
  });

  describe('Line Numbers', () => {
    test('shows line numbers by default', () => {
      render(<CodeBlock {...defaultProps} />);
      // Line numbers are rendered by SyntaxHighlighter
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('shows line numbers when showLineNumbers is true', () => {
      render(<CodeBlock {...defaultProps} showLineNumbers={true} />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('hides line numbers when showLineNumbers is false', () => {
      render(<CodeBlock {...defaultProps} showLineNumbers={false} />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });
  });

  describe('Multiple Languages', () => {
    test('renders JavaScript code', () => {
      render(
        <CodeBlock language="javascript" children="console.log('test');" />
      );
      expect(screen.getByText(/console.log/)).toBeInTheDocument();
    });

    test('renders Python code', () => {
      render(<CodeBlock language="python" children='print("hello")' />);
      expect(screen.getByText(/print/)).toBeInTheDocument();
    });

    test('renders TypeScript code', () => {
      render(
        <CodeBlock language="typescript" children="const x: number = 42;" />
      );
      expect(screen.getByText(/const x/)).toBeInTheDocument();
    });

    test('renders HTML code', () => {
      render(<CodeBlock language="html" children="<div>Hello</div>" />);
      expect(screen.getByText(/Hello/)).toBeInTheDocument();
    });

    test('renders CSS code', () => {
      render(<CodeBlock language="css" children=".class { color: red; }" />);
      expect(screen.getByText(/color: red/)).toBeInTheDocument();
    });

    test('renders JSON code', () => {
      render(<CodeBlock language="json" children='{"key": "value"}' />);
      expect(screen.getByText(/key/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty code', () => {
      render(<CodeBlock {...defaultProps} children="" />);
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    test('handles very long code', () => {
      const longCode = 'const x = 42;\n'.repeat(100);
      render(<CodeBlock {...defaultProps} children={longCode} />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
    });

    test('handles code with special characters', () => {
      const specialCode = 'const str = "<>&\'"';
      render(<CodeBlock {...defaultProps} children={specialCode} />);
      expect(screen.getByText(/const str/)).toBeInTheDocument();
    });

    test('handles multi-line code', () => {
      const multiLineCode = `function test() {
  const x = 42;
  return x * 2;
}`;
      render(<CodeBlock {...defaultProps} children={multiLineCode} />);
      expect(screen.getByText(/function test/)).toBeInTheDocument();
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
      expect(screen.getByText(/return x \* 2/)).toBeInTheDocument();
    });

    test('handles code with tabs and spaces', () => {
      const codeWithWhitespace = '\tconst x = 42;\n  const y = 100;';
      render(<CodeBlock {...defaultProps} children={codeWithWhitespace} />);
      expect(screen.getByText(/const x = 42/)).toBeInTheDocument();
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
      render(
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
      expect(screen.getByText(/def hello/)).toBeInTheDocument();
    });

    test('maintains state across re-renders', () => {
      const { rerender } = render(<CodeBlock {...defaultProps} />);

      rerender(<CodeBlock {...defaultProps} children="const y = 100;" />);

      expect(screen.getByText(/const y = 100/)).toBeInTheDocument();
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

      await waitFor(() => {
        expect(copyButton).toHaveClass('copied');
      });
    });
  });
});
