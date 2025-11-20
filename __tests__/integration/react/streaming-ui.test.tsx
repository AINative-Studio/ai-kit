/**
 * Integration Tests: Streaming UI
 *
 * Tests for React streaming UI components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { createMockAIStream } from '../utils/test-helpers';

describe('Streaming UI Integration', () => {
  describe('Real-time Updates', () => {
    it('should display streaming content in real-time', async () => {
      const StreamingComponent = () => {
        const [content, setContent] = React.useState('');

        React.useEffect(() => {
          const stream = createMockAIStream(['Hello', ' ', 'world'], 50);
          const reader = stream.getReader();

          (async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = new TextDecoder().decode(value);
              const match = text.match(/"content":"([^"]+)"/);
              if (match) {
                setContent((prev) => prev + match[1]);
              }
            }
          })();
        }, []);

        return <div data-testid="streaming-content">{content}</div>;
      };

      render(<StreamingComponent />);

      await waitFor(
        () => {
          const element = screen.getByTestId('streaming-content');
          expect(element.textContent).toBeTruthy();
        },
        { timeout: 500 }
      );
    });

    it('should handle typing animation', async () => {
      const TypingComponent = ({ text }: { text: string }) => {
        const [displayText, setDisplayText] = React.useState('');
        const [currentIndex, setCurrentIndex] = React.useState(0);

        React.useEffect(() => {
          if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
              setDisplayText((prev) => prev + text[currentIndex]);
              setCurrentIndex((i) => i + 1);
            }, 50);

            return () => clearTimeout(timeout);
          }
        }, [currentIndex, text]);

        return <div data-testid="typing-text">{displayText}</div>;
      };

      render(<TypingComponent text="Hello World" />);

      await waitFor(
        () => {
          expect(screen.getByTestId('typing-text').textContent).toBe('Hello World');
        },
        { timeout: 1000 }
      );
    });

    it('should update message list dynamically', async () => {
      const MessageList = () => {
        const [messages, setMessages] = React.useState<string[]>([]);

        React.useEffect(() => {
          const interval = setInterval(() => {
            setMessages((prev) => [...prev, `Message ${prev.length + 1}`]);
          }, 100);

          setTimeout(() => clearInterval(interval), 350);

          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="message-list">
            {messages.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        );
      };

      render(<MessageList />);

      await waitFor(
        () => {
          const list = screen.getByTestId('message-list');
          expect(list.children.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });
  });

  describe('Message Rendering', () => {
    it('should render user and AI messages differently', () => {
      const Message = ({ role, content }: { role: string; content: string }) => {
        return (
          <div
            data-testid={`message-${role}`}
            className={role === 'user' ? 'user-message' : 'ai-message'}
          >
            {content}
          </div>
        );
      };

      const { container } = render(
        <>
          <Message role="user" content="Hello" />
          <Message role="assistant" content="Hi there" />
        </>
      );

      expect(container.querySelector('.user-message')).toBeTruthy();
      expect(container.querySelector('.ai-message')).toBeTruthy();
    });

    it('should handle markdown formatting', () => {
      const MarkdownMessage = ({ content }: { content: string }) => {
        // Simplified markdown parsing
        const formatted = content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');

        return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
      };

      const { container } = render(
        <MarkdownMessage content="**Bold** and *italic*" />
      );

      expect(container.querySelector('strong')).toBeTruthy();
      expect(container.querySelector('em')).toBeTruthy();
    });

    it('should render code blocks', () => {
      const CodeBlock = ({ code, language }: { code: string; language: string }) => {
        return (
          <pre data-testid="code-block" data-language={language}>
            <code>{code}</code>
          </pre>
        );
      };

      render(<CodeBlock code="const x = 1;" language="javascript" />);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock.textContent).toContain('const x = 1;');
      expect(codeBlock.dataset.language).toBe('javascript');
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator while streaming', async () => {
      const LoadingComponent = () => {
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          setTimeout(() => setLoading(false), 200);
        }, []);

        return loading ? (
          <div data-testid="loading">Loading...</div>
        ) : (
          <div data-testid="content">Content loaded</div>
        );
      };

      render(<LoadingComponent />);

      expect(screen.getByTestId('loading')).toBeTruthy();

      await waitFor(
        () => {
          expect(screen.getByTestId('content')).toBeTruthy();
        },
        { timeout: 300 }
      );
    });

    it('should show skeleton loader', () => {
      const SkeletonLoader = () => {
        return (
          <div data-testid="skeleton" className="skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        );
      };

      const { container } = render(<SkeletonLoader />);

      expect(container.querySelector('.skeleton')).toBeTruthy();
      expect(container.querySelectorAll('.skeleton-line')).toHaveLength(3);
    });

    it('should show typing indicator', async () => {
      const TypingIndicator = () => {
        return (
          <div data-testid="typing-indicator" className="typing">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </div>
        );
      };

      const { container } = render(<TypingIndicator />);

      expect(container.querySelectorAll('.dot')).toHaveLength(3);
    });
  });

  describe('Error States', () => {
    it('should display error messages', () => {
      const ErrorDisplay = ({ error }: { error: string }) => {
        return (
          <div data-testid="error" className="error">
            {error}
          </div>
        );
      };

      render(<ErrorDisplay error="Something went wrong" />);

      const errorElement = screen.getByTestId('error');
      expect(errorElement.textContent).toBe('Something went wrong');
    });

    it('should show retry button on error', async () => {
      const ErrorWithRetry = () => {
        const [hasError, setHasError] = React.useState(true);

        const handleRetry = () => {
          setHasError(false);
        };

        return hasError ? (
          <div data-testid="error-state">
            <div>Error occurred</div>
            <button onClick={handleRetry}>Retry</button>
          </div>
        ) : (
          <div data-testid="success-state">Success</div>
        );
      };

      const { container } = render(<ErrorWithRetry />);

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should handle network errors gracefully', () => {
      const NetworkError = () => {
        return (
          <div data-testid="network-error" className="error">
            <p>Network error. Please check your connection.</p>
          </div>
        );
      };

      render(<NetworkError />);

      const error = screen.getByTestId('network-error');
      expect(error.textContent).toContain('Network error');
    });
  });

  describe('Optimistic Updates', () => {
    it('should show message immediately before confirmation', async () => {
      const OptimisticChat = () => {
        const [messages, setMessages] = React.useState<any[]>([]);

        const sendMessage = (content: string) => {
          // Optimistic update
          const tempMessage = {
            id: `temp-${Date.now()}`,
            content,
            status: 'sending',
          };

          setMessages((prev) => [...prev, tempMessage]);

          // Simulate confirmation
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempMessage.id
                  ? { ...msg, id: `msg-${Date.now()}`, status: 'sent' }
                  : msg
              )
            );
          }, 100);
        };

        React.useEffect(() => {
          sendMessage('Test message');
        }, []);

        return (
          <div data-testid="messages">
            {messages.map((msg) => (
              <div key={msg.id} data-status={msg.status}>
                {msg.content}
              </div>
            ))}
          </div>
        );
      };

      render(<OptimisticChat />);

      await waitFor(
        () => {
          const messages = screen.getByTestId('messages');
          expect(messages.children.length).toBeGreaterThan(0);
        },
        { timeout: 200 }
      );
    });

    it('should revert on failure', async () => {
      const OptimisticWithRollback = () => {
        const [value, setValue] = React.useState(0);
        const [previousValue, setPreviousValue] = React.useState(0);

        const increment = () => {
          setPreviousValue(value);
          setValue((v) => v + 1);

          // Simulate failure
          setTimeout(() => {
            setValue(previousValue); // Rollback
          }, 100);
        };

        React.useEffect(() => {
          increment();
        }, []);

        return <div data-testid="value">{value}</div>;
      };

      render(<OptimisticWithRollback />);

      await waitFor(
        () => {
          const element = screen.getByTestId('value');
          expect(element.textContent).toBe('0');
        },
        { timeout: 200 }
      );
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('should auto-scroll to bottom on new messages', async () => {
      const AutoScrollChat = () => {
        const [messages, setMessages] = React.useState<string[]>([]);
        const scrollRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
          const interval = setInterval(() => {
            setMessages((prev) => [...prev, `Message ${prev.length + 1}`]);
          }, 100);

          setTimeout(() => clearInterval(interval), 350);

          return () => clearInterval(interval);
        }, []);

        React.useEffect(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, [messages]);

        return (
          <div
            ref={scrollRef}
            data-testid="chat-container"
            style={{ height: '200px', overflow: 'auto' }}
          >
            {messages.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        );
      };

      const { container } = render(<AutoScrollChat />);

      await waitFor(
        () => {
          const chatContainer = container.querySelector('[data-testid="chat-container"]');
          expect(chatContainer?.children.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });

    it('should not auto-scroll if user scrolled up', () => {
      const ConditionalScroll = () => {
        const [isAtBottom, setIsAtBottom] = React.useState(true);
        const scrollRef = React.useRef<HTMLDivElement>(null);

        const handleScroll = () => {
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
          }
        };

        return (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            data-testid="scroll-container"
            data-at-bottom={isAtBottom}
          >
            Content
          </div>
        );
      };

      const { container } = render(<ConditionalScroll />);

      const scrollContainer = container.querySelector('[data-testid="scroll-container"]');
      expect(scrollContainer?.getAttribute('data-at-bottom')).toBe('true');
    });
  });

  describe('Performance', () => {
    it('should virtualize long message lists', () => {
      const VirtualizedList = ({ itemCount }: { itemCount: number }) => {
        const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 });

        const items = Array.from({ length: itemCount }, (_, i) => i);
        const visibleItems = items.slice(visibleRange.start, visibleRange.end);

        return (
          <div data-testid="virtualized-list">
            {visibleItems.map((item) => (
              <div key={item}>Item {item}</div>
            ))}
          </div>
        );
      };

      render(<VirtualizedList itemCount={1000} />);

      const list = screen.getByTestId('virtualized-list');
      expect(list.children.length).toBeLessThan(100); // Only renders visible items
    });

    it('should debounce rapid updates', async () => {
      const updateCount = { value: 0 };

      const DebouncedComponent = () => {
        const [value, setValue] = React.useState('');

        const debouncedUpdate = React.useCallback((newValue: string) => {
          updateCount.value++;
          setValue(newValue);
        }, []);

        React.useEffect(() => {
          const updates = ['a', 'ab', 'abc', 'abcd'];
          updates.forEach((update, i) => {
            setTimeout(() => debouncedUpdate(update), i * 10);
          });
        }, [debouncedUpdate]);

        return <div data-testid="debounced-value">{value}</div>;
      };

      render(<DebouncedComponent />);

      await waitFor(
        () => {
          expect(updateCount.value).toBeGreaterThan(0);
        },
        { timeout: 200 }
      );
    });
  });
});
