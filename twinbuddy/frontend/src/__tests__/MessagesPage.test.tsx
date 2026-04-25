import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessagesPage from '../pages/v2/MessagesPage';

const fetchMock = vi.fn();

describe('MessagesPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'ENFP',
        travelRange: ['国内'],
        budget: '经济',
        selfDescription: '想找能一起聊天的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  it('loads conversations and room messages', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [
              {
                room_id: 'room-01',
                peer_user: { id: 'buddy-001', nickname: '小满', mbti: 'ENFJ' },
                last_message: '这周末如果去顺德，你更想吃还是拍？',
                unread_count: 1,
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
        }),
      });

    render(
      <MemoryRouter>
        <MessagesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('小满')).toBeInTheDocument();
    expect(await screen.findByText('这周末如果去顺德，你更想吃还是拍？')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/发条消息/i), '收到');
    expect(screen.getByDisplayValue('收到')).toBeInTheDocument();
  });
});
