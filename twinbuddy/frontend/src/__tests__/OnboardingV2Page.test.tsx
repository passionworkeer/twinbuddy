import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingV2Page from '../pages/v2/OnboardingV2Page';

const storageKey = 'twinbuddy_v2_onboarding';
const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('OnboardingV2Page', () => {
  beforeEach(() => {
    localStorage.removeItem(storageKey);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
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

  it('completes the onboarding flow and stores backend user id', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({
      success: true,
      data: {
        user_id: 'user_backend',
        nickname: '深圳热情开拓者',
        mbti: 'ENFP',
        travel_range: ['国内长途'],
        budget: '品质',
        self_desc: '一起做攻略，也能互相留白',
        city: '深圳',
        style_vector: { decision_style: 'flexible' },
        is_verified: false,
        verification_status: 'unverified',
        updated_at: Date.now(),
      },
    }));

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
    await user.click(screen.getByRole('button', { name: /国内长途/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.click(screen.getByRole('button', { name: /说走就走/i }));
    await user.click(screen.getByRole('button', { name: /慢节奏旅行/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.click(screen.getByRole('button', { name: /品质/i }));
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
      userId?: string;
      styleVector?: Record<string, unknown>;
    };
    expect(stored.city).toBe('深圳');
    expect(stored.budget).toBe('品质');
    expect(stored.completed).toBe(true);
    expect(stored.userId).toBe('user_backend');
    expect(stored.styleVector).toEqual({ decision_style: 'flexible' });
  });

  it('shows an error instead of silently continuing when backend creation fails', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ detail: 'server failed' }, false, 500));

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
    await user.click(screen.getByRole('button', { name: /国内长途/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.click(screen.getByRole('button', { name: /说走就走/i }));
    await user.click(screen.getByRole('button', { name: /慢节奏旅行/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.click(screen.getByRole('button', { name: /品质/i }));
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.type(screen.getByPlaceholderText(/比如：能一起做攻略/i), '一起做攻略，也能互相留白');
    await user.click(screen.getByRole('button', { name: /继续/i }));
    await user.type(screen.getByPlaceholderText(/例如：深圳/i), '深圳');
    await user.click(screen.getByRole('button', { name: /进入 TwinBuddy/i }));

    expect(await screen.findByText(/server failed/i)).toBeInTheDocument();
    expect(screen.queryByText('home-ready')).not.toBeInTheDocument();
  });
});
