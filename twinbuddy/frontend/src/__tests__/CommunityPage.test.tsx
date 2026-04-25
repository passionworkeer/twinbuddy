import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommunityPage from '../pages/v2/CommunityPage';

const fetchMock = vi.fn();

describe('CommunityPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'INFJ',
        travelRange: ['国内'],
        budget: '舒适',
        selfDescription: '想找慢节奏搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  it('loads feed and supports publishing a new post', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [
              {
                id: 'post_seed_1',
                author: { nickname: 'Momo', mbti: 'ISFP' },
                content: '周末想在深圳周边走走吃吃。',
                tags: ['深圳', '周末'],
                location: '深圳',
                likes_count: 3,
                comments_count: 1,
                comments: [],
                created_at: Date.now(),
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'post_new_1',
            author: { nickname: '深圳引路人', mbti: 'INFJ' },
            content: '五一想去顺德慢慢吃。',
            tags: ['顺德', '美食'],
            location: '深圳',
            likes_count: 0,
            comments_count: 0,
            comments: [],
            created_at: Date.now(),
          },
        }),
      });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/周末想在深圳周边走走吃吃/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/发一条旅行计划或偏好动态/i), '五一想去顺德慢慢吃。');
    await user.click(screen.getByRole('button', { name: /发布动态/i }));

    expect(await screen.findByText(/五一想去顺德慢慢吃/i)).toBeInTheDocument();
  });
});
