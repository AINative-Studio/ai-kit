import React, { useEffect, useState } from 'react';
import { ProgressBarProps } from '../types';

/**
 * ProgressBar - Animated progress indicator with determinate and indeterminate modes
 *
 * Features:
 * - Determinate mode: Shows specific progress percentage
 * - Indeterminate mode: Shows continuous animation
 * - Customizable colors and sizes
 * - Optional label with configurable position
 * - Accessible with ARIA attributes
 * - Smooth animations and transitions
 *
 * @example
 * ```tsx
 * // Determinate progress
 * <ProgressBar mode="determinate" value={75} showLabel />
 *
 * // Indeterminate loading
 * <ProgressBar mode="indeterminate" />
 *
 * // Custom styled
 * <ProgressBar
 *   value={50}
 *   color="#10b981"
 *   height="8px"
 *   showLabel
 *   labelPosition="top"
 * />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  mode = 'indeterminate',
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  height = '4px',
  width = '100%',
  borderRadius = '4px',
  showLabel = false,
  labelPosition = 'right',
  labelFormatter,
  animationDuration = '300ms',
  className = '',
  style,
  testId = 'progress-bar',
  ariaLabel,
}) => {
  const [displayValue, setDisplayValue] = useState(mode === 'determinate' ? value : 0);

  // Smooth value transitions for determinate mode
  useEffect(() => {
    if (mode === 'determinate') {
      setDisplayValue(Math.min(100, Math.max(0, value)));
    }
  }, [value, mode]);

  const normalizedHeight = typeof height === 'number' ? `${height}px` : height;
  const normalizedWidth = typeof width === 'number' ? `${width}px` : width;
  const normalizedRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;

  // Format label text
  const formatLabel = (val: number): string => {
    if (labelFormatter) {
      return labelFormatter(val);
    }
    return `${Math.round(val)}%`;
  };

  // Determine ARIA attributes
  const ariaProps = {
    role: 'progressbar',
    'aria-label': ariaLabel || (mode === 'indeterminate' ? 'Loading' : `Progress: ${Math.round(displayValue)}%`),
    'aria-valuenow': mode === 'determinate' ? displayValue : undefined,
    'aria-valuemin': mode === 'determinate' ? 0 : undefined,
    'aria-valuemax': mode === 'determinate' ? 100 : undefined,
    'aria-live': 'polite' as const,
    'aria-busy': mode === 'indeterminate' || displayValue < 100,
  };

  // Render label
  const renderLabel = () => {
    if (!showLabel || mode === 'indeterminate') return null;

    const labelContent = formatLabel(displayValue);
    const labelStyle: React.CSSProperties = {
      fontSize: '14px',
      fontWeight: 500,
      color: '#374151',
      whiteSpace: 'nowrap',
    };

    if (labelPosition === 'inside') {
      return (
        <span
          style={{
            ...labelStyle,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            fontSize: '12px',
          }}
          data-testid={`${testId}-label`}
        >
          {labelContent}
        </span>
      );
    }

    return (
      <span style={labelStyle} data-testid={`${testId}-label`}>
        {labelContent}
      </span>
    );
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: labelPosition === 'right' || labelPosition === 'top' || labelPosition === 'bottom' ? '8px' : undefined,
    flexDirection:
      labelPosition === 'top' ? 'column-reverse' :
      labelPosition === 'bottom' ? 'column' :
      'row',
    width: normalizedWidth,
    ...style,
  };

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: labelPosition === 'inside' ? normalizedWidth : '100%',
    height: normalizedHeight,
    backgroundColor,
    borderRadius: normalizedRadius,
    overflow: 'hidden',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: color,
    borderRadius: normalizedRadius,
    transition: mode === 'determinate' ? `width ${animationDuration} ease-in-out` : 'none',
    width: mode === 'determinate' ? `${displayValue}%` : '100%',
  };

  return (
    <>
      <style>{`
        @keyframes progress-indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .progress-bar-indeterminate {
          animation: progress-indeterminate 1.5s ease-in-out infinite;
          width: 25%;
        }

        @keyframes progress-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .progress-bar-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: progress-shimmer 2s ease-in-out infinite;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
      `}</style>

      <div
        className={`progress-bar ${className}`}
        style={containerStyle}
        data-testid={testId}
        data-mode={mode}
        {...ariaProps}
      >
        {labelPosition === 'top' && renderLabel()}

        <div className="progress-bar-track" style={trackStyle}>
          <div
            className={mode === 'indeterminate' ? 'progress-bar-indeterminate' : ''}
            style={fillStyle}
            data-testid={`${testId}-fill`}
          >
            {mode === 'determinate' && <div className="progress-bar-shimmer" />}
          </div>
          {labelPosition === 'inside' && renderLabel()}
        </div>

        {labelPosition === 'right' && renderLabel()}
        {labelPosition === 'bottom' && renderLabel()}
      </div>
    </>
  );
};

export default ProgressBar;
