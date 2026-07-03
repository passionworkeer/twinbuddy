import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import CommunityPage from '../pages/v2/CommunityPage';

describe('CommunityPage', () => {
  beforeEach(() => {
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

  it('renders community feed with mock posts and a publish form', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>,
    );

    // Feed section heading visible
    const headings = screen.getAllByRole('heading');
    const hasFeedHeader = headings.some((h) => /社区|旅行/.test(h.textContent || ''));
    expect(hasFeedHeader).toBeTruthy();

    // Post content from mockCommunityPosts is visible (check for a known keyword)
    // Posts are rendered immediately via useState(mockCommunityPosts)
    const postEls = await screen.findAllByText(/顺德|梧桐山|潮州/i);
    expect(postEls.length).toBeGreaterThan(0);

    // Publish form exists
    const textarea = screen.getByPlaceholderText(/发一条旅行计划或偏好动态/i);
    expect(textarea).toBeInTheDocument();

    // Publish a new post
    await user.type(textarea, '测试发布内容');
    const publishBtn = screen.getByRole('button', { name: /发布动态/i });
    await user.click(publishBtn);
    // Page still renders after publish attempt
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
  });
});
