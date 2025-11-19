/**
 * UnknownTool - Fallback component for unknown tool results
 * Displays tool results when no registered component is found
 */

import React, { useState } from 'react';

export interface UnknownToolProps {
  /**
   * Tool name
   */
  toolName: string;

  /**
   * Tool result data (will be displayed as JSON)
   */
  result: any;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Show raw JSON
   * @default true
   */
  showRawJson?: boolean;

  /**
   * Test ID for testing
   * @default 'unknown-tool'
   */
  testId?: string;
}

/**
 * UnknownTool component
 * Renders unknown tool results with JSON formatting
 */
export const UnknownTool: React.FC<UnknownToolProps> = ({
  toolName,
  result,
  className = '',
  showRawJson = true,
  testId = 'unknown-tool',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(result, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine if result is simple enough to display inline
  const isSimpleResult =
    typeof result === 'string' ||
    typeof result === 'number' ||
    typeof result === 'boolean' ||
    result === null;

  return (
    <div
      className={`unknown-tool ${className}`}
      data-testid={testId}
      data-tool-name={toolName}
    >
      <style>{`
        .unknown-tool {
          padding: 16px;
          margin: 8px 0;
          border-radius: 8px;
          border: 2px dashed #e5e7eb;
          background-color: #f9fafb;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .unknown-tool-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .unknown-tool-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .unknown-tool-icon {
          width: 20px;
          height: 20px;
          background-color: #fbbf24;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }

        .unknown-tool-name {
          font-weight: 600;
          font-size: 14px;
          color: #374151;
        }

        .unknown-tool-badge {
          background-color: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .unknown-tool-actions {
          display: flex;
          gap: 8px;
        }

        .unknown-tool-button {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px 12px;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .unknown-tool-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .unknown-tool-button:active {
          transform: scale(0.95);
        }

        .unknown-tool-button.copied {
          background: #d1fae5;
          border-color: #10b981;
          color: #065f46;
        }

        .unknown-tool-content {
          margin-top: 12px;
        }

        .unknown-tool-simple {
          padding: 12px;
          background: white;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          color: #1f2937;
          border: 1px solid #e5e7eb;
        }

        .unknown-tool-json {
          background: #1e293b;
          border-radius: 6px;
          overflow: hidden;
        }

        .unknown-tool-json-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .unknown-tool-json-label {
          font-size: 12px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
        }

        .unknown-tool-json-content {
          padding: 16px;
          overflow-x: auto;
          max-height: 400px;
          transition: max-height 0.3s ease;
        }

        .unknown-tool-json-content.collapsed {
          max-height: 120px;
        }

        .unknown-tool-json-content pre {
          margin: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.5;
          color: #e2e8f0;
        }

        .unknown-tool-message {
          padding: 12px;
          background: #fef3c7;
          border-radius: 6px;
          font-size: 13px;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .unknown-tool-message-title {
          font-weight: 600;
          margin-bottom: 4px;
        }
      `}</style>

      {/* Header */}
      <div className="unknown-tool-header">
        <div className="unknown-tool-title">
          <div className="unknown-tool-icon">?</div>
          <span className="unknown-tool-name">{toolName}</span>
          <span className="unknown-tool-badge">Unknown Tool</span>
        </div>
        {showRawJson && !isSimpleResult && (
          <div className="unknown-tool-actions">
            <button
              className="unknown-tool-button"
              onClick={toggleExpand}
              aria-label={isExpanded ? 'Collapse JSON' : 'Expand JSON'}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
            <button
              className={`unknown-tool-button ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy JSON'}
              data-testid="copy-button"
            >
              {copied ? ' Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Warning message */}
      <div className="unknown-tool-message">
        <div className="unknown-tool-message-title">No registered component</div>
        <div>
          The tool "{toolName}" does not have a registered UI component. Displaying raw
          result data.
        </div>
      </div>

      {/* Content */}
      {showRawJson && (
        <div className="unknown-tool-content">
          {isSimpleResult ? (
            <div className="unknown-tool-simple" data-testid="simple-result">
              {String(result)}
            </div>
          ) : (
            <div className="unknown-tool-json">
              <div className="unknown-tool-json-header">
                <span className="unknown-tool-json-label">JSON Result</span>
              </div>
              <div
                className={`unknown-tool-json-content ${isExpanded ? '' : 'collapsed'}`}
                data-testid="json-result"
              >
                <pre>{formattedJson}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnknownTool;
