import type { RadarData } from '../../types';

interface Props {
  data: RadarData[];
  size?: number;
}

export function RadarChart({ data, size = 240 }: Props) {
  if (!data || data.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = (size / 2) * 0.78;
  const n = data.length;

  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const mid = (d.user_score + d.buddy_score) / 2 / 100;
    return {
      x: cx + Math.cos(angle) * maxRadius,
      y: cy + Math.sin(angle) * maxRadius,
      mx: cx + Math.cos(angle) * maxRadius * mid,
      my: cy + Math.sin(angle) * maxRadius * mid,
    };
  });

  const polygonPath =
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.mx.toFixed(1)},${p.my.toFixed(1)}`)
      .join(' ') + ' Z';

  const rings = [0.25, 0.5, 0.75, 1.0].map((scale) => {
    const r = maxRadius * scale;
    return (
      <polygon
        key={scale}
        points={data.map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
        }).join(' ')}
        stroke="var(--color-outline-variant)"
        strokeWidth="1"
        fill="none"
      />
    );
  });

  const axes = data.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={(cx + Math.cos(angle) * maxRadius).toFixed(1)}
        y2={(cy + Math.sin(angle) * maxRadius).toFixed(1)}
        stroke="var(--color-outline)"
        strokeWidth="1"
      />
    );
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label="兼容性雷达图"
      >
        {rings}
        {axes}

        {/* Data area */}
        <path
          d={polygonPath}
          stroke="var(--color-primary)"
          strokeWidth="2"
          fill="var(--color-primary)"
          fillOpacity="0.15"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.mx}
            cy={p.my}
            r="4"
            fill="var(--color-primary)"
            stroke="var(--color-surface-container-lowest)"
            strokeWidth="2"
          />
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill="var(--color-primary)" />

        {/* Axis labels */}
        {points.map((_, i) => {
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
              fill="var(--color-on-surface-variant)"
              fontFamily="Inter, sans-serif"
            >
              {data[i].dimension}
            </text>
          );
        })}
      </svg>

      {/* Neo-Brutalist legend pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {data.map((d) => (
          <div
            key={d.dimension}
            className="flex items-center gap-1.5 rounded-full border-2 border-outline bg-surface-container px-3 py-1.5"
          >
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
              {d.dimension}
            </span>
            <span className="font-h2 text-on-surface text-[11px] font-semibold">
              {Math.round((d.user_score + d.buddy_score) / 2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
