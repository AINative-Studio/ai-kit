import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../components/Hero';

describe('Hero Component', () => {
  it('renders the hero heading', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('displays the main CTA button', () => {
    render(<Hero />);
    const ctaButton = screen.getByRole('button', { name: /get started/i });
    expect(ctaButton).toBeInTheDocument();
  });

  it('renders the hero description', () => {
    render(<Hero />);
    const description = screen.getByText(/build powerful AI applications/i);
    expect(description).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    const { container } = render(<Hero />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('meets accessibility requirements', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAccessibleName();
  });
});
