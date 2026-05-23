import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BuddiesPage from '../pages/v2/BuddiesPage';

const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('BuddiesPage', () => {
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
  });

  it('loads verified buddy inbox from the backend', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_id: 'user_test',
          is_verified: true,
          verification_status: 'verified',
          real_name_masked: '王**',
          id_number_tail: '****',
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          items: [
            {
              buddy_id: 'buddy-001',
              nickname: '小满',
              mbti: 'ENFP',
              avatar: '✨',
              city: '深圳',
              match_score: 91,
              negotiation_id: 'neg-001',
              status: 'ready',
              preview: '一起慢慢吃和逛。',
              highlights: ['慢节奏', '美食优先'],
              conflicts: ['预算表述不同'],
            },
          ],
        },
      }));

    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('小满')).toBeInTheDocument();
    expect(screen.getByText(/已预协商 1 人/i)).toBeInTheDocument();
  });

  it('submits verification and then loads inbox', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_id: 'user_test',
          is_verified: false,
          verification_status: 'unverified',
          real_name_masked: '',
          id_number_tail: '',
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_id: 'user_test',
          is_verified: true,
          verification_status: 'verified',
          real_name_masked: '李**',
          id_number_tail: '****',
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          items: [
            {
              buddy_id: 'buddy-002',
              nickname: '阿杰',
              mbti: 'ISTJ',
              avatar: '📍',
              city: '广州',
              match_score: 88,
              negotiation_id: 'neg-002',
              status: 'ready',
              preview: '计划清晰，适合周边城市。',
              highlights: ['计划先行'],
              conflicts: ['节奏不同'],
            },
          ],
        },
      }));

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText(/真实姓名/i), '李小雨');
    await user.type(screen.getByPlaceholderText(/身份证后四到六位/i), '1234');
    await user.click(screen.getByRole('button', { name: /提交认证并解锁/i }));

    expect(await screen.findByText('阿杰')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
