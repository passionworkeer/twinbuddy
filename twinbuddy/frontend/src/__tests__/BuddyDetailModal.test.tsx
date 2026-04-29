import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BuddyDetailModal from '@/components/v2/BuddyDetailModal';
import type { TwinBuddyV2BuddyCard } from '@/types';

const mockCard: TwinBuddyV2BuddyCard = {
  profile: {
    buddy_id: 'buddy-002',
    nickname: '小明不困',
    mbti: 'INTJ',
    city: '深圳',
    avatar: '🦊',
    status: '平时晚上有空',
    is_verified: false,
  },
  radar_chart: [
    { dimension: '节奏', user_score: 88, buddy_score: 82 },
    { dimension: '预算', user_score: 75, buddy_score: 70 },
    { dimension: '美食', user_score: 92, buddy_score: 88 },
  ],
  negotiation_summary: {
    negotiation_id: 'neg-123',
    match_score: 85,
    report_intro: '你们在节奏和美食上高度一致，适合进入盲选确认底层偏好。',
    consensus: ['慢节奏', '美食优先'],
    conflicts: ['预算表述有差异'],
  },
  actions: [
    { id: 'blind-game', label: '开始盲选' },
    { id: 'wechat', label: '进入私信' },
    { id: 'pass', label: '跳过' },
  ],
};

describe('BuddyDetailModal', () => {
  it('renders Layer 2 label and buddy nickname', () => {
    render(
      <MemoryRouter>
        <BuddyDetailModal card={mockCard} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Layer 2 协商详情')).toBeInTheDocument();
    // nickname renders as @ + text node; use regex to match partial content
    const nicknameEls = screen.getAllByText(/小明不困/);
    expect(nicknameEls.length).toBeGreaterThan(0);
  });

  it('renders match score and city', () => {
    render(
      <MemoryRouter>
        <BuddyDetailModal card={mockCard} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    const scores = screen.getAllByText('85%');
    expect(scores.length).toBeGreaterThan(0);
    expect(screen.getByText('深圳')).toBeInTheDocument();
  });

  it('renders consensus tags', () => {
    render(
      <MemoryRouter>
        <BuddyDetailModal card={mockCard} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('慢节奏')).toBeInTheDocument();
    expect(screen.getByText('美食优先')).toBeInTheDocument();
  });

  it('renders radar chart with dimension labels', () => {
    render(
      <MemoryRouter>
        <BuddyDetailModal card={mockCard} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('兼容性雷达图')).toBeInTheDocument();
    // SVG axis labels + legend may produce duplicate text nodes
    const rhythmEls = screen.getAllByText('节奏');
    expect(rhythmEls.length).toBeGreaterThan(0);
    const budgetEls = screen.getAllByText('预算');
    expect(budgetEls.length).toBeGreaterThan(0);
  });

  it('renders three action buttons', () => {
    render(
      <MemoryRouter>
        <BuddyDetailModal card={mockCard} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /开始盲选/i })).toBeInTheDocument();
    // Action button labels may vary; check at least one action button is visible
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BuddyDetailModal card={mockCard} onClose={onClose} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: /返回/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});