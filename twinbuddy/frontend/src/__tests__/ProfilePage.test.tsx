import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfilePage from '../pages/v2/ProfilePage';

const fetchMock = vi.fn();

describe('ProfilePage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'ENFP',
        travelRange: ['周边城市'],
        budget: '经济',
        selfDescription: '喜欢会做攻略的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  it('loads remote profile and allows editing draft text', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
            interests: ['摄影', '美食'],
            updated_at: Date.now(),
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user_id: 'user_test',
            is_verified: false,
            verification_status: 'unverified',
            real_name_masked: '',
            id_number_tail: '',
          },
        }),
      });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Style Vector/i)).toBeInTheDocument();
    const user = userEvent.setup();
    const textarea = screen.getByDisplayValue('喜欢会做攻略的搭子');
    await user.clear(textarea);
    await user.type(textarea, '新描述');
    expect(screen.getByDisplayValue('新描述')).toBeInTheDocument();
  });
});
