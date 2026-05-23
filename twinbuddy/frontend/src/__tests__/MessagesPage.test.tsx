import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MessagesPage from '../pages/v2/MessagesPage';

const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('MessagesPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'INTJ',
        travelRange: ['国内'],
        interests: ['摄影打卡', '美食优先'],
        budget: '舒适',
        selfDescription: '想找能一起慢慢玩的搭子',
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

  it('renders the messages page with backend conversations', async () => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse({
      success: true,
      data: {
        items: [
          {
            room_id: 'room-01',
            peer_user: { id: 'buddy-001', nickname: '小满', mbti: 'ENFJ' },
            last_message: '这周末如果去顺德，你更想吃还是拍？',
            unread_count: 0,
          },
        ],
      },
    }));

    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('小满')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/搜索对话/i)).toBeInTheDocument();
  });

  it('loads room messages and sends a real message', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          items: [
            {
              room_id: 'room-01',
              peer_user: { id: 'buddy-001', nickname: '小满', mbti: 'ENFJ' },
              last_message: '这周末如果去顺德，你更想吃还是拍？',
              unread_count: 0,
            },
          ],
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          items: [
            {
              id: 'msg-1',
              sender_id: 'buddy-001',
              content: '这周末如果去顺德，你更想吃还是拍？',
              type: 'text',
              created_at: Date.now(),
            },
          ],
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          id: 'msg-2',
          sender_id: 'user_test',
          content: '我更想先吃，再慢慢拍。',
          type: 'text',
          created_at: Date.now(),
        },
      }));

    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByText('小满'));
    expect(await screen.findByText(/这周末如果去顺德/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/输入消息/i);
    fireEvent.change(input, { target: { value: '我更想先吃，再慢慢拍。' } });
    fireEvent.click(screen.getByRole('button', { name: /发送消息/i }));

    await waitFor(() => {
      expect(screen.getAllByText('我更想先吃，再慢慢拍。').length).toBeGreaterThan(0);
    });
  });
});
