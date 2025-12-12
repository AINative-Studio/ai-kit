import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, afterEach, vi, beforeEach } from 'vitest';
import { StreamingMessage } from '../components/StreamingMessage';
import { StreamingMessageProps } from '../types';

describe('StreamingMessage', () => {
  const defaultProps: StreamingMessageProps = {
    role: 'assistant',
    content: 'Hello, world!',
    animationType: 'none', // Skip animation for most tests to ensure content is immediately available
  };

  describe('Basic Rendering', () => {
    test('renders message with default props', () => {
      render(<StreamingMessage {...defaultProps} />);
      expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    test('renders with correct role', () => {
      const { rerender } = render(<StreamingMessage {...defaultProps} role="user" />);
      expect(screen.getByTestId('streaming-message')).toHaveAttribute('data-role', 'user');

      rerender(<StreamingMessage {...defaultProps} role="assistant" />);
      expect(screen.getByTestId('streaming-message')).toHaveAttribute('data-role', 'assistant');

      rerender(<StreamingMessage {...defaultProps} role="system" />);
      expect(screen.getByTestId('streaming-message')).toHaveAttribute('data-role', 'system');
    });

    test('renders display name when provided', () => {
      render(<StreamingMessage {...defaultProps} displayName="AI Assistant" />);
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    test('renders default role name when display name not provided', () => {
      render(<StreamingMessage {...defaultProps} role="assistant" />);
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<StreamingMessage {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('streaming-message')).toHaveClass('custom-class');
    });

    test('applies custom styles', () => {
      const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };
      render(<StreamingMessage {...defaultProps} style={customStyle} />);
      expect(screen.getByTestId('streaming-message')).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });

    test('renders with custom testId', () => {
      render(<StreamingMessage {...defaultProps} testId="custom-test-id" />);
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Avatar Rendering', () => {
    test('renders image avatar when avatar is a string URL', () => {
      render(<StreamingMessage {...defaultProps} avatar="https://example.com/avatar.jpg" />);
      const avatar = screen.getByAltText(/assistant avatar/i);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('renders custom avatar element', () => {
      const CustomAvatar = <div data-testid="custom-avatar">CA</div>;
      render(<StreamingMessage {...defaultProps} avatar={CustomAvatar} />);
      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });

    test('does not render avatar when not provided', () => {
      render(<StreamingMessage {...defaultProps} />);
      expect(screen.queryByAltText(/avatar/i)).not.toBeInTheDocument();
    });
  });

  describe('Timestamp Rendering', () => {
    test('renders timestamp when showTimestamp is true and metadata has timestamp', () => {
      const metadata = { timestamp: new Date('2024-01-01T12:00:00') };
      render(
        <StreamingMessage
          {...defaultProps}
          showTimestamp={true}
          metadata={metadata}
        />
      );
      expect(screen.getByText(/12:00/)).toBeInTheDocument();
    });

    test('does not render timestamp when showTimestamp is false', () => {
      const metadata = { timestamp: new Date('2024-01-01T12:00:00') };
      render(
        <StreamingMessage
          {...defaultProps}
          showTimestamp={false}
          metadata={metadata}
        />
      );
      expect(screen.queryByText(/12:00/)).not.toBeInTheDocument();
    });

    test('does not render timestamp when metadata is missing', () => {
      render(<StreamingMessage {...defaultProps} showTimestamp={true} />);
      expect(screen.queryByText(/:/)).not.toBeInTheDocument();
    });
  });

  describe('Streaming States', () => {
    test('displays streaming indicator when streaming', () => {
      render(<StreamingMessage {...defaultProps} streamingState="streaming" />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    test('does not display streaming indicator when idle', () => {
      render(<StreamingMessage {...defaultProps} streamingState="idle" />);
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    test('does not display streaming indicator when complete', () => {
      render(<StreamingMessage {...defaultProps} streamingState="complete" />);
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    test('displays error message when streamingState is error', () => {
      render(<StreamingMessage {...defaultProps} streamingState="error" />);
      expect(screen.getByRole('alert')).toHaveTextContent(/error occurred/i);
    });

    test('hides streaming indicator when showStreamingIndicator is false', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          streamingState="streaming"
          showStreamingIndicator={false}
        />
      );
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    test('renders markdown when enableMarkdown is true', () => {
      const markdownContent = '# Heading\n\nThis is **bold** text.';
      render(<StreamingMessage {...defaultProps} content={markdownContent} enableMarkdown={true} />);
      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    test('renders plain text when enableMarkdown is false', () => {
      const markdownContent = '# Heading\n\nThis is **bold** text.';
      render(<StreamingMessage {...defaultProps} content={markdownContent} enableMarkdown={false} />);
      const content = screen.getByTestId('message-content');
      expect(content.textContent).toContain('# Heading');
      expect(content.textContent).toContain('**bold**');
    });

    test('renders inline code correctly', () => {
      const content = 'Here is `inline code` example.';
      render(<StreamingMessage {...defaultProps} content={content} enableMarkdown={true} />);
      expect(screen.getByText('inline code')).toBeInTheDocument();
    });

    test('renders lists correctly', () => {
      const content = '- Item 1\n- Item 2\n- Item 3';
      render(<StreamingMessage {...defaultProps} content={content} enableMarkdown={true} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    test('renders blockquotes correctly', () => {
      const content = '> This is a quote';
      render(<StreamingMessage {...defaultProps} content={content} enableMarkdown={true} />);
      expect(screen.getByText('This is a quote')).toBeInTheDocument();
    });

    test('renders links correctly', () => {
      const content = '[Click here](https://example.com)';
      render(<StreamingMessage {...defaultProps} content={content} enableMarkdown={true} />);
      const link = screen.getByText('Click here');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('Code Block Rendering', () => {
    test('renders code blocks with syntax highlighting', () => {
      const codeContent = '```javascript\nconst x = 42;\n```';
      const { container } = render(<StreamingMessage {...defaultProps} content={codeContent} enableMarkdown={true} />);
      // Syntax highlighter splits code into multiple elements, so use textContent
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('42');
    });

    test('renders code block with language label', () => {
      const codeContent = '```python\nprint("Hello")\n```';
      render(<StreamingMessage {...defaultProps} content={codeContent} enableMarkdown={true} />);
      expect(screen.getByText(/python/i)).toBeInTheDocument();
    });

    test('renders code block with enableCodeCopy prop', () => {
      const codeContent = '```javascript\nconst x = 42;\n```';
      render(
        <StreamingMessage
          {...defaultProps}
          content={codeContent}
          enableMarkdown={true}
          enableCodeCopy={true}
        />
      );
      // The CodeBlock component is rendered within the markdown
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    test('displays content immediately when animationType is none', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          content="Quick message"
          animationType="none"
        />
      );
      expect(screen.getByText('Quick message')).toBeInTheDocument();
    });

    test('displays content immediately when animationType is fade', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          content="Fade message"
          animationType="fade"
        />
      );
      expect(screen.getByText('Fade message')).toBeInTheDocument();
    });

    test('animates content with typewriter effect', async () => {
      vi.useFakeTimers();

      const { rerender } = render(
        <StreamingMessage
          {...defaultProps}
          content="H"
          animationType="typewriter"
          animationSpeed={10}
        />
      );

      rerender(
        <StreamingMessage
          {...defaultProps}
          content="Hello"
          animationType="typewriter"
          animationSpeed={10}
        />
      );

      // Initially might not show full content
      expect(screen.getByTestId('message-content').textContent).toBeTruthy();

      // After animation completes
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(screen.getByText('Hello')).toBeInTheDocument();

      vi.useRealTimers();
    });

    test('handles content updates during animation', async () => {
      vi.useFakeTimers();

      const { rerender } = render(
        <StreamingMessage
          {...defaultProps}
          content="Start"
          animationType="smooth"
          animationSpeed={10}
        />
      );

      rerender(
        <StreamingMessage
          {...defaultProps}
          content="Start and continue"
          animationType="smooth"
          animationSpeed={10}
        />
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(screen.getByText('Start and continue')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Callbacks', () => {
    test('calls onStreamingComplete when streaming completes', async () => {
      const onStreamingComplete = vi.fn();
      const { rerender } = render(
        <StreamingMessage
          {...defaultProps}
          streamingState="streaming"
          onStreamingComplete={onStreamingComplete}
        />
      );

      rerender(
        <StreamingMessage
          {...defaultProps}
          streamingState="complete"
          onStreamingComplete={onStreamingComplete}
        />
      );

      // The callback should be called synchronously or in next tick
      await waitFor(() => {
        expect(onStreamingComplete).toHaveBeenCalled();
      });
    });

    test('calls onError when streaming state is error', async () => {
      const onError = vi.fn();
      render(
        <StreamingMessage
          {...defaultProps}
          streamingState="error"
          onError={onError}
        />
      );

      // The callback should be called synchronously or in next tick
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    test('calls onContentUpdate after animation completes', async () => {
      vi.useFakeTimers();

      const onContentUpdate = vi.fn();
      const { rerender } = render(
        <StreamingMessage
          {...defaultProps}
          content="Initial"
          animationType="typewriter"
          animationSpeed={10}
          onContentUpdate={onContentUpdate}
        />
      );

      rerender(
        <StreamingMessage
          {...defaultProps}
          content="Initial content"
          animationType="typewriter"
          animationSpeed={10}
          onContentUpdate={onContentUpdate}
        />
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(onContentUpdate).toHaveBeenCalledWith('Initial content');

      vi.useRealTimers();
    });
  });

  describe('Metadata Display', () => {
    test('displays model information when provided', () => {
      const metadata = { model: 'gpt-4' };
      render(<StreamingMessage {...defaultProps} metadata={metadata} />);
      expect(screen.getByText(/Model: gpt-4/i)).toBeInTheDocument();
    });

    test('displays tokens used when provided', () => {
      const metadata = { tokensUsed: 150 };
      render(<StreamingMessage {...defaultProps} metadata={metadata} />);
      expect(screen.getByText(/Tokens: 150/i)).toBeInTheDocument();
    });

    test('displays both model and tokens when provided', () => {
      const metadata = { model: 'gpt-4', tokensUsed: 200 };
      render(<StreamingMessage {...defaultProps} metadata={metadata} />);
      expect(screen.getByText(/Model: gpt-4/i)).toBeInTheDocument();
      expect(screen.getByText(/Tokens: 200/i)).toBeInTheDocument();
    });

    test('does not display metadata section when not provided', () => {
      render(<StreamingMessage {...defaultProps} />);
      expect(screen.queryByText(/Model:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tokens:/i)).not.toBeInTheDocument();
    });
  });

  describe('Role Colors', () => {
    test('applies custom role colors', () => {
      const customColors = {
        user: '#ff0000',
        assistant: '#00ff00',
        system: '#0000ff',
      };
      render(
        <StreamingMessage
          {...defaultProps}
          role="user"
          roleColors={customColors}
        />
      );
      expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
    });

    test('uses default role colors when custom colors not provided', () => {
      render(<StreamingMessage {...defaultProps} role="assistant" />);
      expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes for streaming indicator', () => {
      render(<StreamingMessage {...defaultProps} streamingState="streaming" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
      expect(indicator).toHaveAttribute('aria-label', 'Streaming in progress');
    });

    test('has proper ARIA attributes for error state', () => {
      render(<StreamingMessage {...defaultProps} streamingState="error" />);
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    test('avatar has proper alt text', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          avatar="https://example.com/avatar.jpg"
          displayName="Bot"
        />
      );
      const avatar = screen.getByAltText('Bot avatar');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty content', () => {
      render(<StreamingMessage {...defaultProps} content="" />);
      expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
    });

    test('handles very long content', () => {
      const longContent = 'a'.repeat(10000);
      render(<StreamingMessage {...defaultProps} content={longContent} />);
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });

    test('handles content with special characters', () => {
      const specialContent = '<script>alert("xss")</script>';
      render(<StreamingMessage {...defaultProps} content={specialContent} enableMarkdown={false} animationType="none" />);
      // When markdown is disabled, special characters are preserved (HTML-escaped by React but shown as text)
      expect(screen.getByTestId('message-content').textContent).toContain('<script>');
    });

    test('handles rapid state changes', async () => {
      const { rerender } = render(
        <StreamingMessage {...defaultProps} streamingState="idle" />
      );

      rerender(<StreamingMessage {...defaultProps} streamingState="streaming" />);
      rerender(<StreamingMessage {...defaultProps} streamingState="complete" />);
      rerender(<StreamingMessage {...defaultProps} streamingState="error" />);

      expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
    });

    test('cleans up timers on unmount', () => {
      vi.useFakeTimers();

      const { unmount } = render(
        <StreamingMessage
          {...defaultProps}
          content="Test"
          animationType="typewriter"
        />
      );

      unmount();
      expect(vi.getTimerCount()).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Responsive Design', () => {
    test('renders with responsive layout', () => {
      render(<StreamingMessage {...defaultProps} />);
      const message = screen.getByTestId('streaming-message');
      expect(message).toHaveStyle({ display: 'flex', flexDirection: 'column' });
    });

    test('handles long words with word wrapping', () => {
      const longWord = 'a'.repeat(100);
      render(<StreamingMessage {...defaultProps} content={longWord} />);
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
    });
  });
});
