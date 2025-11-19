import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StreamingMessageProps } from '../types';
import { StreamingIndicator } from './StreamingIndicator';
import { CodeBlock } from './CodeBlock';

/**
 * StreamingMessage - Displays AI messages with streaming support, animations, and markdown rendering
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  role,
  content,
  streamingState = 'idle',
  animationType = 'smooth',
  animationSpeed = 30,
  enableMarkdown = true,
  codeTheme = 'dark',
  showStreamingIndicator = true,
  className = '',
  style,
  avatar,
  displayName,
  showTimestamp = false,
  metadata,
  onStreamingComplete,
  onContentUpdate,
  onError,
  enableCodeCopy = true,
  roleColors,
  testId = 'streaming-message',
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const previousContentRef = useRef('');
  const animationFrameRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Default role colors
  const defaultRoleColors = {
    user: '#3b82f6',
    assistant: '#10b981',
    system: '#f59e0b',
  };

  const mergedRoleColors = { ...defaultRoleColors, ...roleColors };

  // Handle typewriter animation
  useEffect(() => {
    if (animationType === 'none' || animationType === 'fade') {
      setDisplayedContent(content);
      previousContentRef.current = content;
      return;
    }

    if (animationType === 'typewriter' || animationType === 'smooth') {
      const previousContent = previousContentRef.current;
      const newChars = content.slice(previousContent.length);

      if (newChars.length > 0) {
        setIsAnimating(true);
        let currentIndex = 0;

        const animateChar = () => {
          if (currentIndex < newChars.length) {
            setDisplayedContent(previousContent + newChars.slice(0, currentIndex + 1));
            currentIndex++;
            timeoutRef.current = setTimeout(animateChar, animationSpeed);
          } else {
            setIsAnimating(false);
            previousContentRef.current = content;
            if (onContentUpdate) {
              onContentUpdate(content);
            }
          }
        };

        animateChar();
      } else if (content.length < previousContent.length) {
        // Handle content reduction (e.g., deletion)
        setDisplayedContent(content);
        previousContentRef.current = content;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [content, animationType, animationSpeed, onContentUpdate]);

  // Handle streaming completion
  useEffect(() => {
    if (streamingState === 'complete' && previousContentRef.current === content) {
      if (onStreamingComplete) {
        onStreamingComplete();
      }
    }
  }, [streamingState, content, onStreamingComplete]);

  // Handle errors
  useEffect(() => {
    if (streamingState === 'error' && onError) {
      onError(new Error('Streaming error occurred'));
    }
  }, [streamingState, onError]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (streamingState === 'streaming' && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [displayedContent, streamingState]);

  const isStreaming = streamingState === 'streaming' || isAnimating;

  // Render avatar
  const renderAvatar = () => {
    if (!avatar) return null;

    if (typeof avatar === 'string') {
      return (
        <img
          src={avatar}
          alt={`${displayName || role} avatar`}
          className="message-avatar"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      );
    }

    return <div className="message-avatar">{avatar}</div>;
  };

  // Render timestamp
  const renderTimestamp = () => {
    if (!showTimestamp || !metadata?.timestamp) return null;

    const time = new Date(metadata.timestamp).toLocaleTimeString();
    return (
      <span className="message-timestamp" style={{ fontSize: '12px', opacity: 0.6 }}>
        {time}
      </span>
    );
  };

  // Custom components for markdown rendering
  const markdownComponents = useMemo(
    () => ({
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const codeString = String(children).replace(/\n$/, '');

        if (!inline && language) {
          return (
            <CodeBlock
              language={language}
              theme={codeTheme}
              enableCopy={enableCodeCopy}
              showLineNumbers={true}
            >
              {codeString}
            </CodeBlock>
          );
        }

        return (
          <code
            className={className}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            }}
            {...props}
          >
            {children}
          </code>
        );
      },
    }),
    [codeTheme, enableCodeCopy]
  );

  const roleColor = mergedRoleColors[role];

  return (
    <div
      ref={containerRef}
      className={`streaming-message streaming-message-${role} ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        backgroundColor: role === 'user' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)',
        borderLeft: `4px solid ${roleColor}`,
        transition: 'all 0.3s ease',
        ...style,
      }}
      data-testid={testId}
      data-role={role}
      data-streaming-state={streamingState}
    >
      <style>{`
        .streaming-message {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
        }

        .streaming-message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .message-display-name {
          font-weight: 600;
          font-size: 14px;
        }

        .message-content {
          word-wrap: break-word;
          overflow-wrap: break-word;
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

        .streaming-message.fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .message-content p {
          margin: 0.5rem 0;
        }

        .message-content p:first-child {
          margin-top: 0;
        }

        .message-content p:last-child {
          margin-bottom: 0;
        }

        .message-content ul,
        .message-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .message-content li {
          margin: 0.25rem 0;
        }

        .message-content blockquote {
          margin: 1rem 0;
          padding-left: 1rem;
          border-left: 3px solid rgba(0, 0, 0, 0.2);
          color: rgba(0, 0, 0, 0.7);
        }

        .message-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }

        .message-content th,
        .message-content td {
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 8px 12px;
          text-align: left;
        }

        .message-content th {
          background-color: rgba(0, 0, 0, 0.05);
          font-weight: 600;
        }

        .message-content a {
          color: ${roleColor};
          text-decoration: none;
        }

        .message-content a:hover {
          text-decoration: underline;
        }

        .message-metadata {
          display: flex;
          gap: 12px;
          font-size: 12px;
          opacity: 0.6;
          margin-top: 4px;
        }
      `}</style>

      {/* Header with avatar and display name */}
      <div className="streaming-message-header">
        {renderAvatar()}
        {displayName && (
          <span className="message-display-name" style={{ color: roleColor }}>
            {displayName}
          </span>
        )}
        {!displayName && (
          <span className="message-display-name" style={{ color: roleColor }}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        )}
        {renderTimestamp()}
      </div>

      {/* Message content */}
      <div className="message-content" data-testid="message-content">
        {enableMarkdown ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {displayedContent}
          </ReactMarkdown>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{displayedContent}</div>
        )}
      </div>

      {/* Streaming indicator */}
      {isStreaming && showStreamingIndicator && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StreamingIndicator variant="dots" testId="streaming-indicator" />
        </div>
      )}

      {/* Error state */}
      {streamingState === 'error' && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '14px',
            padding: '8px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderRadius: '4px',
          }}
          role="alert"
        >
          An error occurred during streaming
        </div>
      )}

      {/* Metadata */}
      {metadata && (metadata.model || metadata.tokensUsed) && (
        <div className="message-metadata">
          {metadata.model && <span>Model: {metadata.model}</span>}
          {metadata.tokensUsed && <span>Tokens: {metadata.tokensUsed}</span>}
        </div>
      )}
    </div>
  );
};

export default StreamingMessage;
