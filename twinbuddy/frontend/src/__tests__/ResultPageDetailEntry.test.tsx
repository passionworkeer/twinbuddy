import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import ResultPage from '../pages/ResultPage';
import type { NegotiationResult } from '../types';

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
  red_flags: [],
  messages: [
    { speaker: 'user', content: '我想拍日出。', timestamp: 1700000000 },
    { speaker: 'buddy', content: '可以早起一次。', timestamp: 1700000010 },
  ],
};

function DetailProbe() {
  const { reportId } = useParams();
  return <div data-testid="detail-view">{reportId}</div>;
}

describe('ResultPage detail entry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('navigates to dedicated detail route when clicking 查看协商详情', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/result',
            state: { result: SAMPLE_RESULT, reportId: 'report-state-1' },
          },
        ]}
      >
        <Routes>
          <Route path="/result" element={<ResultPage />} />
          <Route path="/result/:reportId/detail" element={<DetailProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /查看协商详情/i }));

    await waitFor(() => {
      expect(screen.getByTestId('detail-view')).toHaveTextContent('report-state-1');
    });
  });
});
