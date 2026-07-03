import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import BlindGamePage from '../pages/v2/BlindGamePage';

describe('BlindGamePage', () => {
  beforeEach(() => {
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'INFJ',
        travelRange: ['国内'],
        budget: '舒适',
        selfDescription: '想找节奏稳定的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  it('loads the blind match card and shows profile details', async () => {
    render(
      <MemoryRouter initialEntries={['/blind-game/buddy-001/neg-001']}>
        <Routes>
          <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Loading spinner should appear then card loads
    expect(await screen.findByText(/今日剩余/i)).toBeInTheDocument();
    expect(screen.getByText('Blind Match')).toBeInTheDocument();
    // MBTI badge
    expect(screen.getByText('INFP')).toBeInTheDocument();
    // Traits section
    expect(screen.getByText(/细节控/i)).toBeInTheDocument();
    expect(screen.getByText(/随性/i)).toBeInTheDocument();
    expect(screen.getByText(/喜欢记录/i)).toBeInTheDocument();
  });

  it('shows accept and reject action buttons', async () => {
    render(
      <MemoryRouter initialEntries={['/blind-game/buddy-001/neg-001']}>
        <Routes>
          <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText(/今日剩余/i);
    expect(screen.getByRole('button', { name: /打个招呼/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /不合适/i })).toBeInTheDocument();
  });

  it('reveals icebreaker questions after accepting', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/blind-game/buddy-001/neg-001']}>
        <Routes>
          <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText(/今日剩余/i);
    await user.click(screen.getByRole('button', { name: /打个招呼/i }));
    expect(await screen.findByText(/已打招呼/i)).toBeInTheDocument();
    expect(screen.getByText(/破冰问题参考/i)).toBeInTheDocument();
  });
});
