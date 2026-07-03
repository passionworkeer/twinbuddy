import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RadarChart } from '@/components/twin-card/RadarChart';
import type { RadarData } from '@/types';

const mockRadarData: RadarData[] = [
  { dimension: '节奏', user_score: 90, buddy_score: 85 },
  { dimension: '预算', user_score: 75, buddy_score: 80 },
  { dimension: '美食', user_score: 95, buddy_score: 90 },
  { dimension: '社交', user_score: 60, buddy_score: 65 },
];

describe('RadarChart', () => {
  it('renders SVG and legend when data is provided', () => {
    render(<RadarChart data={mockRadarData} size={240} />);
    expect(screen.getByLabelText('兼容性雷达图')).toBeInTheDocument();
    const rhythmLabels = screen.getAllByText('节奏');
    expect(rhythmLabels.length).toBeGreaterThan(0);
    const foodLabels = screen.getAllByText('美食');
    expect(foodLabels.length).toBeGreaterThan(0);
  });

  it('renders computed average score in legend', () => {
    render(<RadarChart data={mockRadarData} size={240} />);
    // Legend entries use flex layout, may render as multiple text nodes
    const scores = screen.getAllByText(/%/);
    expect(scores.length).toBe(mockRadarData.length);
  });

  it('renders data point circles for each dimension', () => {
    const { container } = render(<RadarChart data={mockRadarData} size={240} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(mockRadarData.length);
  });

  it('returns null when data is empty', () => {
    const { container } = render(<RadarChart data={[]} size={240} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when data is undefined', () => {
    const { container } = render(<RadarChart data={undefined as any} size={240} />);
    expect(container.firstChild).toBeNull();
  });
});