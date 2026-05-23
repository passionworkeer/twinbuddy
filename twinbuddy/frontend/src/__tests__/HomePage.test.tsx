import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import HomePage from '../pages/v2/HomePage';

const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('HomePage', () => {
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
        selfDescription: '想找舒服一点的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
    localStorage.removeItem('twinbuddy_v2_chat_conversation');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page and shows the showcase carousel', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/推荐搭子/i)).toBeInTheDocument();
    const showcaseItems = screen.getAllByText(/深圳出发/i);
    expect(showcaseItems.length).toBeGreaterThan(0);
  });

  it('handles a backend response attempt when sending chat', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({
      success: true,
      data: {
        conversation_id: 'conv-001',
      },
    }));

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText(/出发的心愿|聊聊你的想法/i), '推荐一个周末路线');
    await user.click(screen.getByRole('button', { name: /发送首页消息/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(screen.getByText(/发送失败|HTTP 200/)).toBeInTheDocument();
  });
});
