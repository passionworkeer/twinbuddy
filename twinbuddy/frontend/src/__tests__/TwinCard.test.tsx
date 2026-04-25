import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TwinCard from '@/components/twin-card/TwinCard';
import type { TwinBuddyV2BuddyInboxItem } from '@/types';

const mockBuddy: TwinBuddyV2BuddyInboxItem = {
  buddy_id: 'buddy-001',
  nickname: '小圆不甜',
  mbti: 'ENFP',
  city: '广州',
  avatar: '🧃',
  status: '周末有空',
  preview: '我比较喜欢慢节奏的旅行，不想每天跑太多地方。',
  highlights: ['慢节奏', '美食', '拍照好看'],
  match_score: 87,
  is_verified: false,
};

describe('TwinCard', () => {
  it('renders buddy nickname, city, and match score', () => {
    render(<TwinCard buddy={mockBuddy} onOpen={vi.fn()} />);
    expect(screen.getByText(/@小圆不甜/i)).toBeInTheDocument();
    expect(screen.getByText('广州')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();
  });

  it('renders preview text and highlights', () => {
    render(<TwinCard buddy={mockBuddy} onOpen={vi.fn()} />);
    expect(screen.getByText(/慢节奏的旅行/)).toBeInTheDocument();
    mockBuddy.highlights.forEach((h) => {
      expect(screen.getByText(h)).toBeInTheDocument();
    });
  });

  it('renders MBTI badge', () => {
    render(<TwinCard buddy={mockBuddy} onOpen={vi.fn()} />);
    expect(screen.getByText('ENFP')).toBeInTheDocument();
  });

  it('calls onOpen when the action button is clicked', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<TwinCard buddy={mockBuddy} onOpen={onOpen} />);
    await user.click(screen.getByRole('button', { name: /了解更多/i }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('renders avatar emoji', () => {
    render(<TwinCard buddy={mockBuddy} onOpen={vi.fn()} />);
    expect(screen.getByText('🧃')).toBeInTheDocument();
  });

  it('renders layer-1 preview card label', () => {
    render(<TwinCard buddy={mockBuddy} onOpen={vi.fn()} />);
    expect(screen.getByText('Layer 1 预览卡')).toBeInTheDocument();
  });
});