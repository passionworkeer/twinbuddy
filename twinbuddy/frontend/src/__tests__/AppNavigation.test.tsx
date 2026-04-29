import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

const storageKey = 'twinbuddy_v2_onboarding';

describe('App navigation shell', () => {
  beforeEach(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        mbti: 'INFJ',
        travelRange: ['国内'],
        budget: '舒适',
        selfDescription: '想找能一起慢慢玩的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
      }),
    );
    window.history.pushState({}, '', '/');
  });

  it('redirects completed users into the new shell', async () => {
    render(<App />);
    expect(await screen.findByText(/今天想去哪儿/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buddies/i })).toBeInTheDocument();
  });

  it('switches tabs through the bottom navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: /Profile$/i }));
    expect(await screen.findByText(/Style Vector/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Messages$/i }));
    expect(await screen.findByText(/暂无私信/i)).toBeInTheDocument();
  });
});
