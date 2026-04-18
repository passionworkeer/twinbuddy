import { useState } from 'react';
import type { RadarData } from '../../types';

interface Props {
  data: RadarData[];
  size?: number;
}

const DIMENSION_COLORS = [
  '#ffb3b6', // primary pink
  '#affffb', // secondary cyan
  '#eec224', // tertiary gold
  '#a78bfa', // purple
  '#34d399', // emerald
];

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  dimension: string;
  userScore: number;
  buddyScore: number;
}

export function RadarChart({ data, size = 240 }: Props) {
  if (!data || data.length === 0) return null;

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, dimension: '', userScore: 0, buddyScore: 0,
  });

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = (size / 2) * 0.78;
  const n = data.length;

  // Compute vertex positions
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxRadius,
      y: cy + Math.sin(angle) * maxRadius,
      // Midpoint on the axis (average of user and buddy scores)
      mx: cx + Math.cos(angle) * (maxRadius * ((d.user_score + d.buddy_score) / 2 / 100)),
      my: cy + Math.sin(angle) * (maxRadius * ((d.user_score + d.buddy_score) / 2 / 100)),
    };
  });

  // Build the polygon path string (closing back to first point)
  const polygonPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.mx.toFixed(1)},${p.my.toFixed(1)}`)
    .join(' ') + ' Z';

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0].map((scale) => {
    const r = maxRadius * scale;
    return (
      <polygon
        key={scale}
        points={data.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
        }).join(' ')}
        className="radar-grid-line"
        strokeWidth="1"
      />
    );
  });

  // Axis lines from center
  const axes = data.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={(cx + Math.cos(angle) * maxRadius).toFixed(1)}
        y2={(cy + Math.sin(angle) * maxRadius).toFixed(1)}
        className="radar-axis"
        strokeWidth="1"
      />
    );
  });

  return (
    <div className="flex flex-col items-center gap-3 relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label="兼容性雷达图"
      >
        {/* Grid */}
        {rings}

        {/* Axes */}
        {axes}

        {/* Data polygon */}
        <path
          d={polygonPath}
          className="radar-area-fill"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.mx}
            cy={p.my}
            r="4"
            fill={DIMENSION_COLORS[i % DIMENSION_COLORS.length]}
            stroke="#11131e"
            strokeWidth="2"
            className="radar-point"
            style={{ filter: `drop-shadow(0 0 6px ${DIMENSION_COLORS[i % DIMENSION_COLORS.length]})` }}
            onMouseEnter={(e) => {
              const rect = (e.target as SVGCircleElement).ownerSVGElement!.getBoundingClientRect();
              const svgX = (e.target as SVGCircleElement).cx.baseVal.value;
              const svgY = (e.target as SVGCircleElement).cy.baseVal.value;
              const scaleX = rect.width / size;
              const scaleY = rect.height / size;
              setTooltip({
                visible: true,
                x: svgX * scaleX + 12,
                y: svgY * scaleY - 8,
                dimension: data[i].dimension,
                userScore: data[i].user_score,
                buddyScore: data[i].buddy_score,
              });
            }}
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
          />
        ))}

        {/* Axis labels */}
        {points.map((p, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const labelRadius = maxRadius + 20;
          const lx = cx + Math.cos(angle) * labelRadius;
          const ly = cy + Math.sin(angle) * labelRadius;
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="#a0a0b8"
              fontFamily="Inter, sans-serif"
            >
              {data[i].dimension}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill="rgba(255,179,182,0.2)" stroke="rgba(255,179,182,0.4)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="2" fill="rgba(255,179,182,0.6)" />
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="radar-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-semibold text-neon-primary">{tooltip.dimension}</div>
          <div className="flex gap-3 mt-1">
            <span className="text-[#818cf8]">你 {tooltip.userScore}%</span>
            <span className="text-[#34d399]">搭 {tooltip.buddyScore}%</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        {data.map((d, i) => (
          <div key={d.dimension} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: DIMENSION_COLORS[i % DIMENSION_COLORS.length],
                boxShadow: `0 0 4px ${DIMENSION_COLORS[i % DIMENSION_COLORS.length]}`,
              }}
            />
            <span className="text-neon-text-secondary">{d.dimension}</span>
            <span className="text-neon-text font-semibold">
              {Math.round((d.user_score + d.buddy_score) / 2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
