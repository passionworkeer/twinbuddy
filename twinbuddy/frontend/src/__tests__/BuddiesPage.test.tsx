import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import BuddiesPage from '../pages/v2/BuddiesPage';

describe('BuddiesPage', () => {
  beforeEach(() => {
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

  it('renders the page header and buddy inbox items', () => {
    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );

    // Header visible
    expect(screen.getByRole('heading', { name: /探索搭子/i })).toBeInTheDocument();

    // Buddy nicknames from mockBuddyInbox rendered as h3 headings
    const headings = screen.getAllByRole('heading', { level: 3 });
    const buddyNames = ['小满', '阿志', '静静'];
    const foundBuddy = headings.some((h) =>
      buddyNames.some((name) => h.textContent?.includes(name)),
    );
    expect(foundBuddy).toBeTruthy();
  });

  it('renders successfully regardless of verification state', () => {
    // Default mockSecurityStatus has is_verified=true so the gate is hidden
    // but page should still render without crashing
    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );
    const headings = screen.getAllByRole('heading');
    const hasContent = headings.some((h) => h.textContent?.includes('探索'));
    expect(hasContent).toBeTruthy();
  });

  it('displays buddy match scores', () => {
    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );
    // Match scores from mockBuddyInbox (displayed as badge text like "91%")
    const scoreEls = screen.getAllByText(/%/);
    expect(scoreEls.length).toBeGreaterThan(0);
  });

  it('renders without crashing when clicking a buddy card', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );

    // Click the first buddy card
    const headings = screen.getAllByRole('heading', { level: 3 });
    if (headings.length > 0) {
      await user.click(headings[0]);
    }
    // Modal or page should still be present
    expect(screen.getByRole('heading', { name: /探索搭子/i })).toBeInTheDocument();
  });
});
