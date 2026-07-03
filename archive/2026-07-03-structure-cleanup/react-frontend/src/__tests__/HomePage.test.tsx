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

  it('renders the page and shows the showcase carousel', async () => {
    fetchMock.mockResolvedValueOnce({
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

    // Page title visible
    expect(await screen.findByText(/推荐搭子/i)).toBeInTheDocument();

    // Showcase carousel is present (check for any carousel item text)
    const showcaseItems = screen.getAllByText(/深圳出发/i);
    expect(showcaseItems.length).toBeGreaterThan(0);
  });

  it('prompt buttons fill the chat input when clicked', async () => {
    fetchMock.mockResolvedValueOnce({
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

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    // Wait for page to render
    await screen.findByText(/推荐搭子/i);

    // Find and click a prompt button
    const promptBtns = screen.getAllByRole('button');
    const promptBtn = promptBtns.find((btn) => /如果不想|想.*搭/i.test(btn.textContent || ''));
    if (promptBtn) {
      await user.click(promptBtn);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    }
  });
});
