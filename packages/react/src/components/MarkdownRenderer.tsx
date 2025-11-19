/**
 * MarkdownRenderer - Renders markdown content with syntax highlighting
 * Used by AgentResponse to display text-based responses
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

export interface MarkdownRendererProps {
  /**
   * Markdown content to render
   */
  content: string;

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
   * Additional CSS class name
   */
  className?: string;

  /**
   * Enable GitHub Flavored Markdown
   * @default true
   */
  enableGfm?: boolean;

  /**
   * Custom component overrides
   */
  components?: any;

  /**
   * Test ID for testing
   * @default 'markdown-renderer'
   */
  testId?: string;
}

/**
 * MarkdownRenderer component
 * Renders markdown with code syntax highlighting
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  codeTheme = 'dark',
  enableCodeCopy = true,
  className = '',
  enableGfm = true,
  components: customComponents,
  testId = 'markdown-renderer',
}) => {
  // Custom components for markdown rendering
  const markdownComponents = useMemo(
    () => ({
      ...customComponents,
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const codeString = String(children).replace(/\n$/, '');

        // Render code blocks with syntax highlighting
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

        // Render inline code
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
    [codeTheme, enableCodeCopy, customComponents]
  );

  const remarkPlugins = useMemo(() => {
    return enableGfm ? [remarkGfm] : [];
  }, [enableGfm]);

  return (
    <div className={`markdown-renderer ${className}`} data-testid={testId}>
      <style>{`
        .markdown-renderer {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
        }

        .markdown-renderer p {
          margin: 0.5rem 0;
        }

        .markdown-renderer p:first-child {
          margin-top: 0;
        }

        .markdown-renderer p:last-child {
          margin-bottom: 0;
        }

        .markdown-renderer h1,
        .markdown-renderer h2,
        .markdown-renderer h3,
        .markdown-renderer h4,
        .markdown-renderer h5,
        .markdown-renderer h6 {
          margin: 1.5rem 0 0.5rem 0;
          font-weight: 600;
          line-height: 1.3;
        }

        .markdown-renderer h1 {
          font-size: 2rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .markdown-renderer h2 {
          font-size: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.3rem;
        }

        .markdown-renderer h3 {
          font-size: 1.25rem;
        }

        .markdown-renderer h4 {
          font-size: 1.1rem;
        }

        .markdown-renderer h5,
        .markdown-renderer h6 {
          font-size: 1rem;
        }

        .markdown-renderer ul,
        .markdown-renderer ol {
          margin: 0.5rem 0;
          padding-left: 2rem;
        }

        .markdown-renderer li {
          margin: 0.25rem 0;
        }

        .markdown-renderer blockquote {
          margin: 1rem 0;
          padding-left: 1rem;
          border-left: 4px solid #e5e7eb;
          color: #6b7280;
          font-style: italic;
        }

        .markdown-renderer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          overflow-x: auto;
          display: block;
        }

        .markdown-renderer th,
        .markdown-renderer td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }

        .markdown-renderer th {
          background-color: #f9fafb;
          font-weight: 600;
        }

        .markdown-renderer tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .markdown-renderer a {
          color: #3b82f6;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .markdown-renderer a:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        .markdown-renderer hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 2rem 0;
        }

        .markdown-renderer img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .markdown-renderer pre {
          margin: 0;
          padding: 0;
        }

        .markdown-renderer strong {
          font-weight: 600;
        }

        .markdown-renderer em {
          font-style: italic;
        }

        .markdown-renderer del {
          text-decoration: line-through;
        }
      `}</style>

      <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
