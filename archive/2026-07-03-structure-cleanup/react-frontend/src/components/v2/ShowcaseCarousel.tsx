import { useRotatingShowcase } from '../../hooks/useRotatingShowcase';

export interface ShowcaseItem {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  metricLabel?: string;
  metricValue?: string;
  tags?: string[];
  imageUrl?: string;
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
    <section
      className={`bg-surface-container-lowest rounded-DEFAULT border-2 border-outline shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden ${className}`.trim()}
    >
      {/* ── Image header ─────────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden">
        {activeItem.imageUrl ? (
          <img
            src={activeItem.imageUrl}
            alt={activeItem.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container">
            <span className="material-symbols-outlined text-5xl text-outline-variant">
              image
            </span>
          </div>
        )}

        {/* Metric badge on image */}
        {activeItem.metricValue && activeItem.imageUrl && (
          <div className="absolute top-3 right-3">
            <span className="bg-primary text-on-primary font-label-caps text-label-caps inline-block whitespace-nowrap rounded-full border-2 border-outline px-3 py-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
              {activeItem.metricValue}
            </span>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────── */}
      <div className="px-container-padding pb-5 pt-4">
        {/* Section label */}
        <p className="font-label-caps text-label-caps text-secondary uppercase tracking-widest text-[10px]">
          {title}
        </p>

        {/* Eyebrow */}
        <p className="mt-3 font-label-caps text-label-caps text-[10px] uppercase tracking-widest text-secondary">
          {activeItem.eyebrow}
        </p>

        {/* Title */}
        <h3 className="font-h2 text-h2 text-on-background mt-1 leading-tight">
          {activeItem.title}
        </h3>

        {/* Body */}
        <p className="font-body-md text-[14px] text-on-surface-variant mt-2">
          {activeItem.body}
        </p>

        {/* Tags */}
        {activeItem.tags && activeItem.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeItem.tags.map((tag) => (
              <span
                key={tag}
                className="bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps text-[10px] rounded-full border border-outline px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metric block (when no image) */}
        {activeItem.metricValue && !activeItem.imageUrl && (
          <div className="bg-surface-container text-on-surface mt-4 rounded-DEFAULT border-2 border-outline px-4 py-3 font-label-caps text-label-caps">
            {activeItem.metricLabel && (
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                {activeItem.metricLabel}
              </p>
            )}
            <p className="mt-1 text-xl font-semibold text-on-surface">
              {activeItem.metricValue}
            </p>
          </div>
        )}

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="mt-5 flex gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                aria-label={`切换到 ${item.title}`}
                className={`rounded-full transition-all ${
                  index === activeIndex
                    ? 'bg-primary h-2.5 w-6'
                    : 'bg-outline-variant h-2.5 w-2.5'
                }`}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
