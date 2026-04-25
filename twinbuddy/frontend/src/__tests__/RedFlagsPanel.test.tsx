import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RedFlagsPanel from '@/components/twin-card/RedFlagsPanel';

describe('RedFlagsPanel', () => {
  it('renders the panel heading and description', () => {
    render(<RedFlagsPanel items={[]} />);
    expect(screen.getByText(/需要留意/i)).toBeInTheDocument();
    expect(screen.getByText(/这些不是一票否决/i)).toBeInTheDocument();
  });

  it('renders all conflict items as list entries', () => {
    const items = ['预算差距大', '节奏偏好相反', '目的地不一致'];
    render(<RedFlagsPanel items={items} />);
    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('renders each item inside a bordered card', () => {
    const { container } = render(<RedFlagsPanel items={['预算差距']} />);
    const entries = container.querySelectorAll('li');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toHaveTextContent('预算差距');
  });

  it('handles empty items gracefully with section still rendered', () => {
    render(<RedFlagsPanel items={[]} />);
    expect(screen.getByText(/这些不是一票否决/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeInTheDocument();
  });
});