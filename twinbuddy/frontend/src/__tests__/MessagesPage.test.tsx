import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MessagesPage from '../pages/v2/MessagesPage';

describe('MessagesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
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

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders the messages page with conversations from mock data', () => {
    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>,
    );

    const headings = screen.getAllByRole('heading');
    const hasHeader = headings.some((h) => /消息/.test(h.textContent || ''));
    expect(hasHeader).toBeTruthy();

    const buddyNames = ['小满', '阿志', '静静'];
    const nameEls = screen.getAllByText((content) =>
      buddyNames.some((name) => content.includes(name)),
    );
    expect(nameEls.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/搜索对话/i)).toBeInTheDocument();
  });

  it('cleans up pending timers on unmount after send', () => {
    const { unmount } = render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('小满'));
    vi.runOnlyPendingTimers();

    const input = screen.getByPlaceholderText(/输入消息/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '你好' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    unmount();

    expect(() => {
      vi.runOnlyPendingTimers();
    }).not.toThrow();
  });
});
