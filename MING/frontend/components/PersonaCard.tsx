import { useEffect, useRef } from 'react';
import type { PersonaLayer } from '../types/persona';

interface Props {
  layer: number;
  data: PersonaLayer;
  isLayer0?: boolean;
  delay?: number;
}

const LAYER_META: Record<number, { badge: string; gradient: string; tagColor: string }> = {
  0: { badge: '硬规则', gradient: 'from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40', tagColor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  1: { badge: '身份层', gradient: 'from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40', tagColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  2: { badge: '表达层', gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40', tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  3: { badge: '决策层', gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40', tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  4: { badge: '社交层', gradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40', tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

export function PersonaCard({ layer, data, isLayer0 = false, delay = 0 }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const meta = LAYER_META[layer] ?? LAYER_META[1];

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`
        relative overflow-hidden rounded-2xl border-2 p-5
        ${isLayer0 || layer === 0 ? 'border-red-400 dark:border-red-600' : 'border-transparent'}
        bg-gradient-to-br ${meta.gradient}
        shadow-sm hover:shadow-md transition-shadow
      `}
    >
      {/* Layer badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{data.emoji}</span>
          <div>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.tagColor}`}>
              {meta.badge}
            </span>
            {layer === 0 && (
              <span className="ml-1 text-xs text-red-500 font-medium">⚠ 不可违反</span>
            )}
          </div>
        </div>
        <span className="text-xs font-mono text-gray-400">Layer {layer}</span>
      </div>

      <h3 className="mb-2 text-base font-bold text-gray-800 dark:text-gray-100">
        {data.title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {data.content}
      </p>
    </div>
  );
}
