import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import OnboardingV2Page from '../pages/v2/OnboardingV2Page';

const storageKey = 'twinbuddy_v2_onboarding';

describe('OnboardingV2Page', () => {
  beforeEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('requires each step before continuing', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <OnboardingV2Page />
      </MemoryRouter>,
    );

    const nextButton = screen.getByRole('button', { name: /继续/i });
    expect(nextButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /ENFP/i }));
    expect(nextButton).toBeEnabled();
  });

  it('completes the five-step flow and redirects home', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingV2Page />} />
          <Route path="/home" element={<div>home-ready</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /ENFP/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    // step 1: travel range
    await user.click(screen.getByRole('button', { name: /国内长途/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    // step 2: interests (need ≥ 2)
    await user.click(screen.getByRole('button', { name: /说走就走/i }));
    await user.click(screen.getByRole('button', { name: /慢节奏旅行/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    // step 3: budget
    await user.click(screen.getByRole('button', { name: /品质/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.type(screen.getByPlaceholderText(/比如：能一起做攻略/i), '一起做攻略，也能互相留白');
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.type(screen.getByPlaceholderText(/例如：深圳/i), '深圳');
    await user.click(screen.getByRole('button', { name: /进入 TwinBuddy/i }));

    expect(await screen.findByText('home-ready')).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as {
      city?: string;
      completed?: boolean;
      budget?: string;
    };
    expect(stored.city).toBe('深圳');
    expect(stored.budget).toBe('品质');
    expect(stored.completed).toBe(true);
  });
});
