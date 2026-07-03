import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import MessagesPage from '../pages/v2/MessagesPage';

describe('MessagesPage', () => {
  beforeEach(() => {
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'INTJ',
        travelRange: ['国内'],
        budget: '舒适',
        selfDescription: '想找能一起慢慢玩的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  it('renders the messages page with conversations from mock data', () => {
    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>,
    );

    // Header "消息"
    const headings = screen.getAllByRole('heading');
    const hasHeader = headings.some((h) => /消息/.test(h.textContent || ''));
    expect(hasHeader).toBeTruthy();

    // At least one conversation name from mockConversations
    const buddyNames = ['小满', '阿志', '静静'];
    const nameEls = screen.getAllByText((content) =>
      buddyNames.some((name) => content.includes(name)),
    );
    expect(nameEls.length).toBeGreaterThan(0);

    // Search bar
    expect(screen.getByPlaceholderText(/搜索对话/i)).toBeInTheDocument();
  });
});
