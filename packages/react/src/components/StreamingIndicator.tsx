import React from 'react';
import { StreamingIndicatorProps } from '../types';

/**
 * StreamingIndicator - Displays an animated indicator while streaming is in progress
 */
export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  variant = 'dots',
  className = '',
  style,
  testId = 'streaming-indicator',
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    ...style,
  };

  const dotStyles: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    opacity: 0.6,
  };

  if (variant === 'dots') {
    return (
      <div
        className={`streaming-indicator ${className}`}
        style={baseStyles}
        data-testid={testId}
        role="status"
        aria-label="Streaming in progress"
      >
        <style>{`
          @keyframes pulse-dot {
            0%, 80%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .streaming-dot {
            animation: pulse-dot 1.4s ease-in-out infinite;
          }
          .streaming-dot:nth-child(1) {
            animation-delay: 0s;
          }
          .streaming-dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          .streaming-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
        `}</style>
        <span className="streaming-dot" style={dotStyles} />
        <span className="streaming-dot" style={dotStyles} />
        <span className="streaming-dot" style={dotStyles} />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`streaming-indicator ${className}`}
        style={baseStyles}
        data-testid={testId}
        role="status"
        aria-label="Streaming in progress"
      >
        <style>{`
          @keyframes pulse-ring {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(1.2);
              opacity: 0;
            }
          }
          .pulse-container {
            position: relative;
            width: 16px;
            height: 16px;
          }
          .pulse-core {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: currentColor;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          .pulse-ring {
            position: absolute;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid currentColor;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: pulse-ring 1.5s ease-out infinite;
          }
        `}</style>
        <div className="pulse-container">
          <div className="pulse-core" />
          <div className="pulse-ring" />
        </div>
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div
        className={`streaming-indicator ${className}`}
        style={baseStyles}
        data-testid={testId}
        role="status"
        aria-label="Streaming in progress"
      >
        <style>{`
          @keyframes wave {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-8px);
            }
          }
          .wave-bar {
            width: 3px;
            height: 16px;
            background-color: currentColor;
            border-radius: 2px;
            animation: wave 1.2s ease-in-out infinite;
          }
          .wave-bar:nth-child(1) {
            animation-delay: 0s;
          }
          .wave-bar:nth-child(2) {
            animation-delay: 0.1s;
          }
          .wave-bar:nth-child(3) {
            animation-delay: 0.2s;
          }
          .wave-bar:nth-child(4) {
            animation-delay: 0.3s;
          }
        `}</style>
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
        <div className="wave-bar" />
      </div>
    );
  }

  return null;
};

export default StreamingIndicator;
