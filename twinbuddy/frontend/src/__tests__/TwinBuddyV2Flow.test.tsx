import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const fetchMock = vi.fn();

describe('TwinBuddy V2 flow', () => {
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
    window.history.pushState({}, '', '/buddies');
  });

  it('unlocks buddies, then navigates through community and messages', async () => {
    fetchMock
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user_id: 'user_test',
            is_verified: true,
            verification_status: 'verified',
            real_name_masked: '王**',
            id_number_tail: '1234',
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
                buddy_id: 'buddy-001',
                nickname: '小满',
                mbti: 'ENFJ',
                avatar: '🌟',
                city: '深圳',
                match_score: 88,
                negotiation_id: 'neg-001',
                status: '等待你决定',
                preview: '数字分身已经帮你们对齐预算与节奏。',
                highlights: ['周末短途'],
                conflicts: ['拍照诉求略高'],
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
                id: 'post-1',
                author: { nickname: 'Momo', mbti: 'ISFP' },
                content: '周末想在深圳周边走走吃吃。',
                images: [],
                tags: ['深圳', '周末'],
                location: '深圳',
                likes_count: 3,
                comments_count: 0,
                comments: [],
                created_at: Date.now(),
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

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText(/完成实名认证后解锁搭子动态/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/真实姓名/i), '王小明');
    await user.type(screen.getByPlaceholderText(/身份证后四位/i), '1234');
    await user.click(screen.getByRole('button', { name: /完成认证并解锁搭子/i }));
    expect(await screen.findByText('@小满')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /^社区$/i }));
    expect(await screen.findByText(/周末想在深圳周边走走吃吃/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /^私信$/i }));
    expect((await screen.findAllByText(/这周末如果去顺德，你更想吃还是拍？/i)).length).toBeGreaterThan(0);
  });
});
