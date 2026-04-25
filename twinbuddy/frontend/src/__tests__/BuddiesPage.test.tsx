import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BuddiesPage from '../pages/v2/BuddiesPage';

const fetchMock = vi.fn();

describe('BuddiesPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'twinbuddy_v2_onboarding',
      JSON.stringify({
        mbti: 'INFJ',
        travelRange: ['国内'],
        budget: '舒适',
        selfDescription: '想找节奏稳的搭子',
        city: '深圳',
        completed: true,
        timestamp: Date.now(),
        userId: 'user_test',
      }),
    );
  });

  it('loads buddy inbox from API', async () => {
    fetchMock
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
      });

    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('@小满')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('88')).toBeInTheDocument();
    });
  });

  it('shows verification gate and unlocks inbox after submit', async () => {
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
      });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/完成实名认证后解锁搭子动态/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/真实姓名/i), '王小明');
    await user.type(screen.getByPlaceholderText(/身份证后四位/i), '1234');
    await user.click(screen.getByRole('button', { name: /完成认证并解锁搭子/i }));

    expect(await screen.findByText('@小满')).toBeInTheDocument();
  });

  it('opens the buddy detail modal and can continue into blind game', async () => {
    fetchMock
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
                highlights: ['周末短途', '会做攻略'],
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
            profile: {
              buddy_id: 'buddy-001',
              nickname: '小满',
              mbti: 'ENFJ',
              avatar: '🌟',
              city: '深圳',
              summary: '适合一起慢慢逛吃。',
            },
            negotiation_summary: {
              negotiation_id: 'neg-001',
              match_score: 88,
              consensus: ['周末短途', '会做攻略'],
              conflicts: ['拍照诉求略高'],
              report_intro: '预算与节奏已经初步对齐。',
            },
            radar_chart: [],
            actions: [
              { id: 'blind-game', label: '开始 6 轮盲选' },
              { id: 'skip', label: '先跳过' },
              { id: 'wechat', label: '进一步认识' },
            ],
          },
        }),
      });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/buddies']}>
        <Routes>
          <Route path="/buddies" element={<BuddiesPage />} />
          <Route path="/blind-game/:buddyId/:negotiationId" element={<div>blind-game-route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /了解更多/i }));
    expect(await screen.findByText(/与 @小满 的预协商已经完成/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /开始 6 轮盲选/i }));
    expect(await screen.findByText('blind-game-route')).toBeInTheDocument();
  });

  it('shows a visible error when buddy detail loading fails', async () => {
    fetchMock
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
        ok: false,
        json: async () => ({ detail: 'service unavailable' }),
      });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BuddiesPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /了解更多/i }));
    expect(await screen.findByText(/协商摘要加载失败/i)).toBeInTheDocument();
  });
});
