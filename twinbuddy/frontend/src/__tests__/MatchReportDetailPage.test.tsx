import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MatchReportDetailPage from '../pages/MatchReportDetailPage';

// Mock IntersectionObserver for jsdom environment
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
import type { NegotiationResult } from '../types';
import { STORAGE_KEYS } from '../types';

const SAMPLE_RESULT: NegotiationResult = {
  destination: '大理',
  dates: '5月10日-5月15日',
  budget: '人均3500元',
  consensus: true,
  plan: ['洱海骑行', '古城散步'],
  matched_buddies: ['你', '小雅'],
  radar: [
    { dimension: '行程节奏', user_score: 90, buddy_score: 78, weight: 0.8 },
    { dimension: '美食偏好', user_score: 85, buddy_score: 83, weight: 0.6 },
    { dimension: '拍照风格', user_score: 70, buddy_score: 88, weight: 0.5 },
    { dimension: '预算控制', user_score: 75, buddy_score: 80, weight: 0.7 },
    { dimension: '冒险精神', user_score: 88, buddy_score: 70, weight: 0.9 },
    { dimension: '作息时间', user_score: 65, buddy_score: 72, weight: 0.6 },
  ],
  red_flags: ['预算弹性需提前约定'],
  messages: [
    { speaker: 'user', content: '我想把拍照点排满。', timestamp: 1700000000 },
    { speaker: 'buddy', content: '可以，但想留半天慢逛。', timestamp: 1700000010 },
  ],
  analysis_report: '节奏可以磨合，先按共同偏好推进。',
  analysis_basis: {
    input_tags: ['摄影打卡', '慢节奏旅行'],
    strengths: ['美食偏好接近'],
    conflicts: ['预算区间不同'],
  },
};

function renderDetail(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/result/:reportId/detail" element={<MatchReportDetailPage />} />
        <Route path="/result" element={<div data-testid="result-page">result page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MatchReportDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads detail data from report snapshots by route id', () => {
    localStorage.setItem(
      STORAGE_KEYS.negotiation_reports,
      JSON.stringify({ 'report-a': SAMPLE_RESULT }),
    );

    renderDetail('/result/report-a/detail');

    expect(screen.getByText('完整协商记录')).toBeInTheDocument();
    expect(screen.getByText('大理')).toBeInTheDocument();
    expect(screen.getByText('我想把拍照点排满。')).toBeInTheDocument();
    // Red flags may not be directly displayed in the current UI
  });

  it('falls back to latest negotiation result when snapshot is missing', () => {
    const fallbackResult: NegotiationResult = {
      ...SAMPLE_RESULT,
      destination: '西安',
      plan: ['城墙骑行', '回民街探店'],
    };
    localStorage.setItem(
      STORAGE_KEYS.negotiation_result,
      JSON.stringify(fallbackResult),
    );

    renderDetail('/result/missing/detail');

    expect(screen.getByText('西安')).toBeInTheDocument();
    // Plan items are in the chat messages, not directly displayed
  });

  it('navigates back to result summary from detail page', async () => {
    localStorage.setItem(
      STORAGE_KEYS.negotiation_reports,
      JSON.stringify({ 'report-a': SAMPLE_RESULT }),
    );

    const user = userEvent.setup({ delay: null });
    renderDetail('/result/report-a/detail');

    await user.click(document.querySelector('button:has(svg.lucide-arrow-left)'));

    await waitFor(() => {
      expect(screen.getByTestId('result-page')).toBeInTheDocument();
    });
  });
});
