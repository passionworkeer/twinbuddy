import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../pages/v2/HomePage';

describe('HomePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'INFJ',
        travelRange: ['国内'],
        budget: '舒适',
        selfDescription: '想找舒服一点的搭子',
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

  it('renders the page and shows the showcase carousel', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/推荐搭子/i)).toBeInTheDocument();
    const showcaseItems = screen.getAllByText(/深圳出发/i);
    expect(showcaseItems.length).toBeGreaterThan(0);
  });

  it('uses prompt text and sends a message without timer leaks', () => {
    const { unmount } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const promptButton = screen.getByRole('button', {
      name: /如果我不想太赶，又希望能吃得好，适合找什么样的搭子？/i,
    });

    act(() => {
      fireEvent.click(promptButton);
    });

    const input = screen.getByPlaceholderText(/出发的心愿|聊聊你的想法/i) as HTMLInputElement;
    expect(input.value).toContain('如果我不想太赶');

    act(() => {
      fireEvent.change(input, { target: { value: '推荐一个周末路线' } });
    });

    const sendButton = screen.getAllByRole('button').at(-1) as HTMLButtonElement;
    act(() => {
      fireEvent.click(sendButton);
    });

    unmount();

    expect(() => {
      vi.runOnlyPendingTimers();
    }).not.toThrow();
  });
});
