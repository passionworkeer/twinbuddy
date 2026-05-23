import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../pages/v2/ProfilePage';

const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'ENFP',
        travelRange: ['周边城市'],
        interests: ['摄影打卡', '美食优先'],
        budget: '经济',
        selfDescription: '喜欢会做攻略的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  it('loads remote profile and security status', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_id: 'user_test',
          nickname: '深圳热情开拓者',
          mbti: 'ENFP',
          travel_range: ['周边城市'],
          budget: '经济',
          self_desc: '喜欢会做攻略的搭子',
          city: '深圳',
          style_vector: { decision_style: 'flexible' },
          is_verified: false,
          verification_status: 'unverified',
          updated_at: Date.now(),
        },
      }))
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_id: 'user_test',
          is_verified: false,
          verification_status: 'unverified',
          real_name_masked: '',
          id_number_tail: '',
        },
      }));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Style Vector/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('深圳').length).toBeGreaterThan(0);
    expect(screen.getByText('待完成实名认证')).toBeInTheDocument();
  });

  it('saves profile edits through the backend', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_id: 'user_test',
          nickname: '深圳热情开拓者',
          mbti: 'ENFP',
          travel_range: ['周边城市'],
          budget: '经济',
          self_desc: '喜欢会做攻略的搭子',
          city: '深圳',
          style_vector: { decision_style: 'flexible' },
          is_verified: true,
          verification_status: 'verified',
          updated_at: Date.now(),
        },
      }))
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
          user_id: 'user_test',
          nickname: '深圳热情开拓者',
          mbti: 'ENFP',
          travel_range: ['周边城市'],
          budget: '舒适',
          self_desc: '新描述',
          city: '深圳',
          style_vector: { decision_style: 'flexible' },
          is_verified: true,
          verification_status: 'verified',
          updated_at: Date.now(),
        },
      }));

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    const textarea = await screen.findByDisplayValue('喜欢会做攻略的搭子');
    await user.clear(textarea);
    await user.type(textarea, '新描述');
    await user.click(screen.getByRole('button', { name: /舒适/i }));
    await user.click(screen.getByRole('button', { name: /保存画像调整/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
    expect(await screen.findByText(/已保存/i)).toBeInTheDocument();
  });
});
