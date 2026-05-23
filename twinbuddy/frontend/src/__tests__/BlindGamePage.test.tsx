import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import BlindGamePage from '../pages/v2/BlindGamePage';

const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('BlindGamePage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'INFJ',
        travelRange: ['国内'],
        interests: ['摄影打卡', '美食优先'],
        budget: '舒适',
        selfDescription: '想找节奏稳定的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts the blind game and shows the first A/B round', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({
      success: true,
      data: {
        game_id: 'game_001',
        rounds: [
          {
            id: 'round_1',
            dimension: '作息节奏',
            option_a: '早睡早起',
            option_b: '晚睡晚起',
          },
        ],
      },
    }));

    render(
      <MemoryRouter initialEntries={['/blind-game/buddy-001/neg-001']}>
        <Routes>
          <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/作息节奏/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /早睡早起/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /晚睡晚起/i })).toBeInTheDocument();
  });

  it('advances through rounds and renders the final report', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          game_id: 'game_001',
          rounds: [
            {
              id: 'round_1',
              dimension: '作息节奏',
              option_a: '早睡早起',
              option_b: '晚睡晚起',
            },
            {
              id: 'round_2',
              dimension: '行程风格',
              option_a: '计划周全',
              option_b: '随性自由',
            },
          ],
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          done: false,
          rounds_completed: 1,
          game_id: 'game_001',
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          done: true,
          rounds_completed: 2,
          game_id: 'game_001',
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_choices: { round_1: 'A', round_2: 'B' },
          buddy_choices: { round_1: 'A', round_2: 'A' },
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
            {
              round_id: 'round_2',
              dimension: '行程风格',
              user_choice: 'B',
              buddy_choice: 'A',
              user_label: '随性自由',
              buddy_label: '计划周全',
              matched: false,
            },
          ],
          match_score: 72.5,
          analysis: '你们有明确共识，也有需要协商的点。',
        },
      }));

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/blind-game/buddy-001/neg-001']}>
        <Routes>
          <Route path="/blind-game/:buddyId/:negotiationId" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /早睡早起/i }));
    expect(await screen.findByText(/行程风格/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /随性自由/i }));

    await waitFor(() => {
      expect(screen.getByText(/匹配得分 72.5%/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/你们有明确共识，也有需要协商的点/i)).toBeInTheDocument();
  });

  it('shows an error when no negotiation id is present', async () => {
    render(
      <MemoryRouter initialEntries={['/blind-game']}>
        <Routes>
          <Route path="/blind-game" element={<BlindGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/请从搭子详情卡进入盲选/i)).toBeInTheDocument();
  });
});
