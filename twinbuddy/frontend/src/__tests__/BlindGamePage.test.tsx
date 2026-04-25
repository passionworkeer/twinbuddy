import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BlindGamePage from '../pages/v2/BlindGamePage';

const fetchMock = vi.fn();

describe('BlindGamePage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
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

  it('loads rounds and progresses after answering', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            game_id: 'game_test',
            rounds: [
              { id: 'round_1', dimension: '作息节奏', option_a: '早睡早起', option_b: '晚睡晚起' },
              { id: 'round_2', dimension: '行程风格', option_a: '计划周全', option_b: '随性自由' },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { done: false, rounds_completed: 1, game_id: 'game_test' },
        }),
      });

    render(
      <MemoryRouter initialEntries={['/blind-game/buddy-001/neg-001']}>
        <Routes>
          <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('作息节奏')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /早睡早起/i }));
    expect(await screen.findByText('行程风格')).toBeInTheDocument();
  });

  it('reveals trip safety form after blind report', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            game_id: 'game_test',
            rounds: [{ id: 'round_1', dimension: '作息节奏', option_a: '早睡早起', option_b: '晚睡晚起' }],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { done: true, rounds_completed: 1, game_id: 'game_test' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user_choices: { round_1: 'A' },
            buddy_choices: { round_1: 'A' },
            per_round_result: [
              {
                round_id: 'round_1',
                dimension: '作息节奏',
                user_choice: 'A',
                buddy_choice: 'A',
                user_label: '早睡早起',
                buddy_label: '早睡早起',
                matched: true,
              },
            ],
            match_score: 96,
            analysis: '节奏一致，适合进入正式认识。',
          },
        }),
      });

    render(
      <MemoryRouter initialEntries={['/blind-game/buddy-001/neg-001']}>
        <Routes>
          <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /早睡早起/i }));
    await user.click(await screen.findByRole('button', { name: /正式认识 TA/i }));
    expect(await screen.findByText(/行程安全上报/i)).toBeInTheDocument();
  });
});
