import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NegotiationThread from '@/components/twin-card/NegotiationThread';

describe('NegotiationThread', () => {
  it('renders section heading and badge', () => {
    render(<NegotiationThread consensus={['节奏接近']} conflicts={['预算差距']} />);
    expect(screen.getByText('数字分身协商记录')).toBeInTheDocument();
    expect(screen.getByText('已完成预协商')).toBeInTheDocument();
  });

  it('renders three messages (buddy, user, buddy) from consensus and conflicts', () => {
    const { container } = render(
      <NegotiationThread
        consensus={['节奏接近', '目的地一致']}
        conflicts={['预算差距较大']}
      />,
    );
    const messages = container.querySelectorAll('[class*="bubble-"]');
    expect(messages).toHaveLength(3);
  });

  it('includes first consensus item in first message', () => {
    render(<NegotiationThread consensus={['节奏接近']} conflicts={[]} />);
    expect(screen.getByText(/节奏接近/)).toBeInTheDocument();
  });

  it('renders a subtitle describing the purpose', () => {
    render(<NegotiationThread consensus={[]} conflicts={['预算差距']} />);
    expect(screen.getByText(/把高概率踩雷点先聊掉/)).toBeInTheDocument();
  });

  it('handles empty consensus and conflicts gracefully', () => {
    const { container } = render(<NegotiationThread consensus={[]} conflicts={[]} />);
    const messages = container.querySelectorAll('[class*="bubble-"]');
    expect(messages).toHaveLength(3);
  });
});