import { ChevronRight, MapPin, Sparkles } from 'lucide-react';
import type { TwinBuddyV2BuddyInboxItem } from '../../types';

interface Props {
  buddy: TwinBuddyV2BuddyInboxItem;
  onOpen: () => void;
}

export default function TwinCard({ buddy, onOpen }: Props) {
  return (
    <article className="twin-card-layer1 twin-glow-ring relative overflow-hidden p-5 sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.08),transparent_30%,rgba(175,255,251,0.05)_60%,rgba(255,179,182,0.08)_100%)]" />
      <div className="absolute inset-y-5 left-0 w-1 rounded-full bg-[linear-gradient(180deg,var(--color-primary),var(--color-secondary))] shadow-[0_0_18px_rgba(255,179,182,0.45)]" />

      <div className="relative z-10 space-y-5 pl-2 sm:pl-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-secondary)]" />
              Layer 1 预览卡
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/12 bg-[rgba(255,255,255,0.06)] text-2xl shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
                {buddy.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-2xl font-extrabold tracking-tight text-white">@{buddy.nickname}</h3>
                  <span className="mbti-badge">{buddy.mbti}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <MapPin className="h-4 w-4 text-[var(--color-secondary)]" />
                  <span>{buddy.city}</span>
                  <span className="text-white/30">·</span>
                  <span>{buddy.status}</span>
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
              {buddy.preview}
            </p>
          </div>

          <div className="min-w-[112px] rounded-[24px] border border-[rgba(255,179,182,0.16)] bg-[rgba(11,19,20,0.34)] px-4 py-3 text-right shadow-[0_10px_26px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">匹配度</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">{buddy.match_score}</p>
            <p className="mt-1 text-xs text-[var(--color-primary-light)]">适合继续协商</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[26px] border border-white/8 bg-[rgba(5,12,15,0.34)] p-4 backdrop-blur-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">数字分身摘要</p>
            <div className="mt-3 space-y-3">
              <div className="bubble-buddy max-w-none">
                我先替你们聊过了，对方对你偏好的旅行节奏接受度不错。
              </div>
              <div className="bubble-user ml-auto">
                那就继续看细节，确认预算和相处方式是否真的舒服。
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-[rgba(5,12,15,0.28)] p-4 backdrop-blur-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">初步共识</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {buddy.highlights.slice(0, 3).map((highlight) => (
                <span key={highlight} className="tag selected">
                  {highlight}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
              点击下方按钮进入 Layer 2，查看完整协商记录、契合雷达与盲选入口。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-[var(--color-text-secondary)]">
            Hackathon 风格 TwinCard
          </span>
          <button className="btn-primary w-full sm:w-auto" onClick={onOpen} type="button">
            了解更多
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
