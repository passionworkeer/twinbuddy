import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CommunityPage from '../pages/v2/CommunityPage';

const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('CommunityPage', () => {
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
        selfDescription: '想找慢节奏搭子',
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

  it('renders community feed from the backend', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({
      success: true,
      data: {
        items: [
          {
            id: 'post-1',
            author: { nickname: 'Momo', mbti: 'ISFP' },
            content: '周末想在深圳周边慢慢逛。',
            location: '深圳',
            likes_count: 3,
            comments_count: 1,
            comments: [],
            tags: ['深圳', '周末'],
            images: [],
            created_at: Date.now(),
          },
        ],
      },
    }));

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/周末想在深圳周边慢慢逛/i)).toBeInTheDocument();
  });

  it('publishes, likes, and comments using backend APIs', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          items: [
            {
              id: 'post-1',
              author: { nickname: 'Momo', mbti: 'ISFP' },
              content: '周末想在深圳周边慢慢逛。',
              location: '深圳',
              likes_count: 3,
              comments_count: 0,
              comments: [],
              tags: ['深圳', '周末'],
              images: [],
              created_at: Date.now(),
            },
          ],
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          id: 'post-2',
          author: { nickname: 'TwinBuddy 用户', mbti: 'INFJ' },
          content: '测试发布内容',
          location: '深圳',
          likes_count: 0,
          comments_count: 0,
          comments: [],
          tags: ['深圳'],
          images: [],
          created_at: Date.now(),
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          post_id: 'post-1',
          liked: true,
          likes_count: 4,
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          id: 'comment-1',
          user_id: 'user_test',
          author_nickname: 'TwinBuddy 用户',
          content: '我也偏向慢一点。',
          created_at: Date.now(),
        },
      }));

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>,
    );

    await screen.findByText(/周末想在深圳周边慢慢逛/i);

    const textarea = screen.getByPlaceholderText(/发一条旅行计划或偏好动态/i);
    await user.type(textarea, '测试发布内容');
    await user.click(screen.getByRole('button', { name: /发布动态/i }));
    expect(await screen.findByText('测试发布内容')).toBeInTheDocument();

    const likeButton = screen.getByRole('button', { name: '3' });
    await user.click(likeButton);

    await user.type(screen.getAllByPlaceholderText(/补一句你的偏好/i)[0], '我也偏向慢一点。');
    await user.click(screen.getAllByRole('button', { name: /回复/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('我也偏向慢一点。')).toBeInTheDocument();
    });
  });
});
