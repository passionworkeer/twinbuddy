import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

describe('TwinBuddy V2 flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
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
    window.history.pushState({}, '', '/');
  });

  it('loads the app and shows the home page for completed onboarding', async () => {
    render(<App />);
    // HomePage renders the "推荐搭子" heading
    expect(await screen.findByText(/推荐搭子/i)).toBeInTheDocument();
    // Bottom nav is present
    expect(screen.getByRole('link', { name: /Buddies/i })).toBeInTheDocument();
  });

  it('navigates between bottom tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Go to Profile tab
    const profileLink = screen.getByRole('link', { name: /Profile$/i });
    await user.click(profileLink);
    expect(await screen.findByText(/Style Vector/i)).toBeInTheDocument();

    // Go to Community tab
    const communityLink = screen.getByRole('link', { name: /Community/i });
    await user.click(communityLink);
    // Community page has multiple headings — verify any heading renders
    const headings = await screen.findAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });
});
