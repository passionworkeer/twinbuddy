import type { ReactNode } from 'react';
import { useRotatingShowcase } from '../../hooks/useRotatingShowcase';

export interface ShowcaseItem {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  metricLabel?: string;
  metricValue?: string;
  tags?: string[];
}

interface Props {
  title: string;
  items: ShowcaseItem[];
  className?: string;
  intervalMs?: number;
}

export default function ShowcaseCarousel({
  title,
  items,
  className = '',
  intervalMs = 4800,
}: Props) {
  const { activeIndex, activeItem, setActiveIndex } = useRotatingShowcase(items, intervalMs);

  if (!activeItem) return null;

  return (
    <section className={`glass-panel ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-2 text-sm text-[var(--color-secondary)]">{activeItem.eyebrow}</p>
        </div>
      </div>

      <h3 className="mt-4 text-xl font-semibold text-white">{activeItem.title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{activeItem.body}</p>

      {activeItem.metricValue ? (
        <div className="mt-5 rounded-3xl border border-white/8 bg-black/10 px-4 py-3">
          <p className="text-xs text-[var(--color-text-secondary)]">{activeItem.metricLabel || '指标'}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-primary)]">{activeItem.metricValue}</p>
        </div>
      ) : null}

      {activeItem.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeItem.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {items.length > 1 ? (
        <div className="mt-5 flex gap-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              aria-label={`切换到 ${item.title}`}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-[var(--color-primary)]' : 'w-2.5 bg-white/20'}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
