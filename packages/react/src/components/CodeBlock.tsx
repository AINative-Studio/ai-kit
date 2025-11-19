import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vsDark,
  vs,
  github,
  nord,
  dracula,
  atomDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeBlockProps } from '../types';

const themeMap = {
  dark: atomDark,
  light: vs,
  'vs-dark': vsDark,
  github: github,
  monokai: atomDark,
  nord: nord,
  dracula: dracula,
};

/**
 * CodeBlock - Displays code with syntax highlighting and copy functionality
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  children,
  theme = 'dark',
  enableCopy = true,
  className = '',
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const selectedTheme = themeMap[theme] || themeMap.dark;

  return (
    <div className={`code-block-container ${className}`} style={{ position: 'relative' }}>
      <style>{`
        .code-block-container {
          margin: 1rem 0;
          border-radius: 8px;
          overflow: hidden;
          background: #1e1e1e;
        }
        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .code-block-language {
          font-size: 12px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
        }
        .code-block-copy-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 4px 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .code-block-copy-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .code-block-copy-button:active {
          transform: scale(0.95);
        }
        .code-block-copy-button.copied {
          background: rgba(76, 175, 80, 0.3);
          border-color: rgba(76, 175, 80, 0.5);
          color: #4caf50;
        }
        .syntax-highlighter {
          margin: 0 !important;
          border-radius: 0 !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
      `}</style>

      <div className="code-block-header">
        <span className="code-block-language">{language || 'code'}</span>
        {enableCopy && (
          <button
            className={`code-block-copy-button ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy code'}
            data-testid="copy-button"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>

      <SyntaxHighlighter
        language={language || 'text'}
        style={selectedTheme}
        showLineNumbers={showLineNumbers}
        className="syntax-highlighter"
        customStyle={{
          margin: 0,
          padding: '1rem',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
