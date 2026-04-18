import { Sparkles } from 'lucide-react';
import type { VideoItem } from '../../types';

interface Props {
  item: VideoItem;
  onTwinCard: () => void;
}

export function LocationGuideCard({ item, onTwinCard }: Props) {
  const guide = item.locationGuide;
  const highlights = guide?.version.highlights ?? [];
  const strategies = guide?.version.strategies ?? [];

  return (
    <div className="feed-item relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.cover_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-5 pb-24 pt-8">
        <div className="text-white/90 text-sm tracking-wide">目的地灵感</div>
        <h2 className="mt-2 text-4xl font-black leading-tight text-white">{item.location}</h2>
        <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-white/80">
          {guide?.description ?? item.description}
        </p>

        <div className="mt-6 glass-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-neon-text-secondary">{guide?.preferenceLabel ?? '场景推荐'}</p>
              <p className="text-lg font-bold text-neon-text">{guide?.version.heading ?? '旅行建议'}</p>
            </div>
            <Sparkles className="h-5 w-5 text-neon-tertiary" />
          </div>

          <p className="mt-2 text-sm text-neon-text-secondary">{guide?.version.summary}</p>

          {highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {highlights.map((itemText) => (
                <span
                  key={itemText}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neon-text"
                >
                  {itemText}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 glass-panel p-4">
          <p className="text-xs text-neon-text-secondary">预写攻略</p>
          <ul className="mt-2 space-y-2">
            {strategies.map((strategy) => (
              <li key={strategy} className="text-sm leading-relaxed text-neon-text">
                {strategy}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto">
          <button
            onClick={onTwinCard}
            className="btn-primary w-full"
            aria-label="继续看匹配结果"
          >
            继续看匹配结果
          </button>
        </div>
      </div>
    </div>
  );
}
