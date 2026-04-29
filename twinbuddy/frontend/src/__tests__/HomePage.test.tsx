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
    // Use first() to handle multiple cards with similar titles
    expect(screen.getAllByText(/深圳出发 2 天顺德慢吃线|你最近对“好吃但不赶”的表达更稳定了|你的预算弹性可能比你想象的大/i)[0]).toBeInTheDocument();

    const user = userEvent.setup();
    // Click the first prompt button to fill the input
    await user.click(screen.getByRole('button', { name: /如果我不想太赶，又希望能吃得好/i }));
    expect(screen.getByDisplayValue(/如果我不想太赶，又希望能吃得好/i)).toBeInTheDocument();
  });
});
