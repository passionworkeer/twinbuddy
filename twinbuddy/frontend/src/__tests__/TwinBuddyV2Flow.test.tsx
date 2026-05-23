import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const fetchMock = vi.fn();

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('TwinBuddy V2 flow', () => {
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
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the app and shows the home page for completed onboarding', async () => {
    render(<App />);
    expect(await screen.findByText(/推荐搭子/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buddies/i })).toBeInTheDocument();
  });

  it('navigates between bottom tabs', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({
        success: true,
        data: {
          user_id: 'user_test',
          nickname: '深圳热情开拓者',
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
      }))
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
              comments_count: 1,
              comments: [],
              tags: ['深圳', '周末'],
              images: [],
              created_at: Date.now(),
            },
          ],
        },
      }));

    const user = userEvent.setup();
    render(<App />);

    const profileLink = screen.getByRole('link', { name: /Profile$/i });
    await user.click(profileLink);
    expect((await screen.findAllByText(/Style Vector/i)).length).toBeGreaterThan(0);

    const communityLink = screen.getByRole('link', { name: /Community/i });
    await user.click(communityLink);
    const headings = await screen.findAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });
});
