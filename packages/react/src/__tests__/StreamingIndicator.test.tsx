import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StreamingIndicator } from '../components/StreamingIndicator';

describe('StreamingIndicator', () => {
  describe('Dots Variant', () => {
    test('renders dots variant by default', () => {
      render(<StreamingIndicator />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.querySelectorAll('.streaming-dot')).toHaveLength(3);
    });

    test('renders dots variant when explicitly specified', () => {
      render(<StreamingIndicator variant="dots" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator.querySelectorAll('.streaming-dot')).toHaveLength(3);
    });

    test('has proper ARIA attributes for dots variant', () => {
      render(<StreamingIndicator variant="dots" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
      expect(indicator).toHaveAttribute('aria-label', 'Streaming in progress');
    });

    test('applies animation to dots', () => {
      render(<StreamingIndicator variant="dots" />);
      const indicator = screen.getByTestId('streaming-indicator');
      const dots = indicator.querySelectorAll('.streaming-dot');

      dots.forEach(dot => {
        expect(dot).toHaveClass('streaming-dot');
      });
    });
  });

  describe('Pulse Variant', () => {
    test('renders pulse variant', () => {
      render(<StreamingIndicator variant="pulse" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.querySelector('.pulse-container')).toBeInTheDocument();
    });

    test('has pulse core and ring elements', () => {
      render(<StreamingIndicator variant="pulse" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator.querySelector('.pulse-core')).toBeInTheDocument();
      expect(indicator.querySelector('.pulse-ring')).toBeInTheDocument();
    });

    test('has proper ARIA attributes for pulse variant', () => {
      render(<StreamingIndicator variant="pulse" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
      expect(indicator).toHaveAttribute('aria-label', 'Streaming in progress');
    });
  });

  describe('Wave Variant', () => {
    test('renders wave variant', () => {
      render(<StreamingIndicator variant="wave" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.querySelectorAll('.wave-bar')).toHaveLength(4);
    });

    test('has proper ARIA attributes for wave variant', () => {
      render(<StreamingIndicator variant="wave" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
      expect(indicator).toHaveAttribute('aria-label', 'Streaming in progress');
    });

    test('applies animation to wave bars', () => {
      render(<StreamingIndicator variant="wave" />);
      const indicator = screen.getByTestId('streaming-indicator');
      const bars = indicator.querySelectorAll('.wave-bar');

      expect(bars.length).toBe(4);
      bars.forEach(bar => {
        expect(bar).toHaveClass('wave-bar');
      });
    });
  });

  describe('Styling', () => {
    test('applies custom className', () => {
      render(<StreamingIndicator className="custom-class" />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveClass('streaming-indicator');
      expect(indicator).toHaveClass('custom-class');
    });

    test('applies custom styles', () => {
      const customStyle = { backgroundColor: 'rgb(255, 0, 0)', padding: '20px' };
      render(<StreamingIndicator style={customStyle} />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
      expect(indicator).toHaveStyle({ padding: '20px' });
    });

    test('merges custom styles with default styles', () => {
      const customStyle = { marginTop: '10px' };
      render(<StreamingIndicator style={customStyle} />);
      const indicator = screen.getByTestId('streaming-indicator');
      expect(indicator).toHaveStyle({ marginTop: '10px' });
      expect(indicator).toHaveStyle({ display: 'inline-flex' });
    });
  });

  describe('Test ID', () => {
    test('uses default testId', () => {
      render(<StreamingIndicator />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    test('uses custom testId', () => {
      render(<StreamingIndicator testId="custom-indicator" />);
      expect(screen.getByTestId('custom-indicator')).toBeInTheDocument();
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has status role for screen readers', () => {
      render(<StreamingIndicator />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('has descriptive aria-label', () => {
      render(<StreamingIndicator />);
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Streaming in progress');
    });

    test('maintains accessibility across all variants', () => {
      const variants: Array<'dots' | 'pulse' | 'wave'> = ['dots', 'pulse', 'wave'];

      variants.forEach(variant => {
        const { unmount } = render(<StreamingIndicator variant={variant} />);
        const indicator = screen.getByRole('status');
        expect(indicator).toHaveAttribute('aria-label', 'Streaming in progress');
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined variant gracefully', () => {
      render(<StreamingIndicator variant={undefined} />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    test('handles invalid variant gracefully', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      render(<StreamingIndicator variant="invalid" />);
      const indicator = screen.queryByTestId('streaming-indicator');
      // Should render nothing for invalid variant
      expect(indicator).not.toBeInTheDocument();
    });

    test('renders correctly with empty className', () => {
      render(<StreamingIndicator className="" />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    test('renders correctly with no optional props', () => {
      render(<StreamingIndicator />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });
  });

  describe('CSS Animations', () => {
    test('includes animation keyframes for dots variant', () => {
      const { container } = render(<StreamingIndicator variant="dots" />);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('@keyframes pulse-dot');
      expect(style?.textContent).toContain('animation: pulse-dot');
    });

    test('includes animation keyframes for pulse variant', () => {
      const { container } = render(<StreamingIndicator variant="pulse" />);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('@keyframes pulse-ring');
      expect(style?.textContent).toContain('animation: pulse-ring');
    });

    test('includes animation keyframes for wave variant', () => {
      const { container } = render(<StreamingIndicator variant="wave" />);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('@keyframes wave');
      expect(style?.textContent).toContain('animation: wave');
    });
  });

  describe('Rendering Consistency', () => {
    test('renders same variant consistently across multiple renders', () => {
      const { rerender } = render(<StreamingIndicator variant="dots" />);
      expect(screen.getByTestId('streaming-indicator').querySelectorAll('.streaming-dot')).toHaveLength(3);

      rerender(<StreamingIndicator variant="dots" />);
      expect(screen.getByTestId('streaming-indicator').querySelectorAll('.streaming-dot')).toHaveLength(3);
    });

    test('switches variants correctly', () => {
      const { rerender } = render(<StreamingIndicator variant="dots" />);
      expect(screen.getByTestId('streaming-indicator').querySelectorAll('.streaming-dot')).toHaveLength(3);

      rerender(<StreamingIndicator variant="pulse" />);
      expect(screen.getByTestId('streaming-indicator').querySelector('.pulse-container')).toBeInTheDocument();
      expect(screen.queryByTestId('streaming-indicator')?.querySelectorAll('.streaming-dot')).toHaveLength(0);

      rerender(<StreamingIndicator variant="wave" />);
      expect(screen.getByTestId('streaming-indicator').querySelectorAll('.wave-bar')).toHaveLength(4);
    });
  });
});
