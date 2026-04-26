import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../pages/v2/HomePage';

const fetchMock = vi.fn();

describe('HomePage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
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

  it('renders rotating showcase and lets prompt buttons fill the composer', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user_id: 'user_test',
            nickname: '深圳引路人',
            mbti: 'INFJ',
            travel_range: ['国内'],
            budget: '舒适',
            self_desc: '想找舒服一点的搭子',
            city: '深圳',
            style_vector: {},
            is_verified: false,
            verification_status: 'unverified',
            updated_at: Date.now(),
          },
        }),
      });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/推荐搭子/i)).toBeInTheDocument();
    expect(screen.getByText(/深圳出发 2 天顺德慢吃线|你最近对“好吃但不赶”的表达更稳定了|你的预算弹性可能比你想象的大/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /预算 2000 左右，推荐 3 天目的地/i }));
    expect(screen.getByDisplayValue(/预算 2000 左右，推荐 3 天目的地/i)).toBeInTheDocument();
  });
});
