import React, { useMemo } from 'react';
import type { RadarData as ApiRadarData } from '../../types/index';

export interface LocalRadarData {
  matchRate: number;
  tags: string[];
  dimensions: ApiRadarData[];
}

interface RadarChartCardProps {
  data?: LocalRadarData;
}

export const RadarChartCard: React.FC<RadarChartCardProps> = ({ data }) => {
  const defaultData: LocalRadarData = data || {
    matchRate: 85,
    tags: [
      '共同偏好：山野徒步、露营',
      '旅行节奏：特种兵式打卡',
      '消费观念：AA制 / 注重体验'
    ],
    dimensions: [
      { dimension: '节奏', user_score: 90, buddy_score: 80, weight: 1 },
      { dimension: '美食', user_score: 85, buddy_score: 85, weight: 1 },
      { dimension: '拍照', user_score: 75, buddy_score: 90, weight: 1 },
      { dimension: '预算', user_score: 60, buddy_score: 70, weight: 1 },
      { dimension: '冒险', user_score: 95, buddy_score: 85, weight: 1 },
      { dimension: '随性', user_score: 80, buddy_score: 80, weight: 1 },
    ],
  };

  const points = useMemo(() => {
    // Generate 6 points based on the dimensions
    const center = 100;
    const radius = 60;
    const computedPoints = defaultData.dimensions.map((dim, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const val = (dim.user_score + dim.buddy_score) / 2 / 100;
      const x = center + radius * val * Math.cos(angle);
      const y = center + radius * val * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return computedPoints;
  }, [defaultData.dimensions]);

  return (
    <>
      <div className="mb-4 flex justify-center items-center py-2">
        <svg height="320" viewBox="0 0 200 200" width="320" xmlns="http://www.w3.org/2000/svg">
          {/* Grid Polygons */}
          <polygon fill="none" points="100,40 151.96,70 151.96,130 100,160 48.04,130 48.04,70" stroke="rgba(255,255,255,0.3)" strokeWidth="1"></polygon>
          <polygon fill="none" points="100,60 134.64,80 134.64,120 100,140 65.36,120 65.36,80" stroke="rgba(255,255,255,0.2)" strokeWidth="1"></polygon>
          <polygon fill="none" points="100,80 117.32,90 117.32,110 100,120 82.68,110 82.68,90" stroke="rgba(255,255,255,0.1)" strokeWidth="1"></polygon>
          
          {/* Axes */}
          <line stroke="rgba(255,255,255,0.3)" strokeWidth="1" x1="100" x2="100" y1="100" y2="40"></line>
          <line stroke="rgba(255,255,255,0.3)" strokeWidth="1" x1="100" x2="151.96" y1="100" y2="70"></line>
          <line stroke="rgba(255,255,255,0.3)" strokeWidth="1" x1="100" x2="151.96" y1="100" y2="130"></line>
          <line stroke="rgba(255,255,255,0.3)" strokeWidth="1" x1="100" x2="100" y1="100" y2="160"></line>
          <line stroke="rgba(255,255,255,0.3)" strokeWidth="1" x1="100" x2="48.04" y1="100" y2="130"></line>
          <line stroke="rgba(255,255,255,0.3)" strokeWidth="1" x1="100" x2="48.04" y1="100" y2="70"></line>
          
          {/* Data Polygon */}
          <polygon fill="rgba(74, 222, 128, 0.5)" points={points.join(' ')} stroke="#4ade80" strokeWidth="2"></polygon>
          
          {/* Center Point */}
          <circle cx="100" cy="100" fill="#4ade80" r="2"></circle>
          
          {/* Data Points */}
          {points.map((p, i) => {
            const [x, y] = p.split(',');
            return <circle key={i} cx={x} cy={y} fill="#ffffff" r="3"></circle>;
          })}
          
          {/* Labels - Static mapped for 6 dimensions */}
          <text fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="middle" x="100" y="25">{defaultData.dimensions[0]?.dimension || '维度1'}</text>
          <text alignmentBaseline="middle" fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="start" x="160" y="70">{defaultData.dimensions[1]?.dimension || '维度2'}</text>
          <text alignmentBaseline="middle" fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="start" x="160" y="130">{defaultData.dimensions[2]?.dimension || '维度3'}</text>
          <text fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="middle" x="100" y="180">{defaultData.dimensions[3]?.dimension || '维度4'}</text>
          <text alignmentBaseline="middle" fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="end" x="40" y="130">{defaultData.dimensions[4]?.dimension || '维度5'}</text>
          <text alignmentBaseline="middle" fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="end" x="40" y="70">{defaultData.dimensions[5]?.dimension || '维度6'}</text>
        </svg>
      </div>

      <div className="bg-black/40 backdrop-blur-xl rounded-[16px] border border-white/10 p-5 flex items-center justify-center gap-8 mb-4">
        <div className="flex flex-col items-center justify-center border-r border-white/10 pr-8">
          <span className="text-4xl font-bold text-[#4ade80] leading-none">{defaultData.matchRate}%</span>
          <span className="text-[11px] text-white/70 mt-2 whitespace-nowrap">旅行契合度</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {defaultData.tags.map((tag, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span>
              <p className="text-sm text-white/90 leading-none">{tag}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
