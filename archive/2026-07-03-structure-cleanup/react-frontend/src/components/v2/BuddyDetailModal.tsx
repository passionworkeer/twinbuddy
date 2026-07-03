import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Compass, MapPin, MessageCircleMore, ShieldAlert, X } from 'lucide-react';
import { RadarChart } from '../twin-card/RadarChart';
import NegotiationThread from '../twin-card/NegotiationThread';
import RedFlagsPanel from '../twin-card/RedFlagsPanel';
import type { TwinBuddyV2BuddyCard } from '../../types';

interface Props {
  card: TwinBuddyV2BuddyCard;
  onClose: () => void;
}

export default function BuddyDetailModal({ card, onClose }: Props) {
  const navigate = useNavigate();

  const handleAction = (actionId: string) => {
    if (actionId === 'blind-game') {
      onClose();
      navigate(`/blind-game/${card.profile.buddy_id}/${card.negotiation_summary.negotiation_id}`);
      return;
    }
    if (actionId === 'wechat') {
      onClose();
      navigate('/messages');
      return;
    }
    onClose();
    navigate('/buddies');
  };

  const initials = card.profile.nickname?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="fixed inset-0 z-40 flex flex-col">
      {/* Solid Neo-Brutalist sheet — no glassmorphism, no dark overlay */}
      <div className="relative flex flex-col h-[100dvh] bg-surface-container-lowest rounded-t-[28px] border-t-2 border-outline overflow-hidden">

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-container-padding pb-3 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
          <button
            className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-2 text-sm font-label-caps text-label-caps text-on-surface border-2 border-outline shadow-[0_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all"
            onClick={onClose}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </button>
          <div className="flex items-center gap-5 overflow-x-auto text-sm font-medium no-scrollbar">
            <span className="whitespace-nowrap text-on-surface/60">概览</span>
            <span className="whitespace-nowrap text-on-surface">协商</span>
            <span className="whitespace-nowrap text-on-surface/60">盲选</span>
          </div>
          <button
            className="flex items-center justify-center rounded-full bg-surface-container w-11 h-11 text-on-surface border-2 border-outline shadow-[0_2px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_#000] active:translate-y-0.5 active:shadow-none transition-all"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Scrollable content */}
        <main className="relative flex-1 overflow-y-auto px-container-padding pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] pt-3 no-scrollbar">
          <div className="mx-auto max-w-5xl space-y-gutter-margin">

            {/* Title section */}
            <section className="px-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-container border-2 border-outline px-3 py-1 text-xs font-label-caps text-label-caps text-on-surface uppercase tracking-widest">
                <Compass className="h-3.5 w-3.5 text-secondary" />
                Layer 2 协商详情
              </div>
              <h2 className="mt-4 font-h1 text-h1 text-on-background leading-tight">
                与 @{card.profile.nickname} 的预协商已经完成
              </h2>
            </section>

            {/* Stats card — Neo-Brutalist sheet style */}
            <section className="bg-surface-container border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              {/* Buddy avatar + info row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-outline flex items-center justify-center text-xl font-h2 shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="font-h2 text-xl text-on-background">{card.profile.nickname}</p>
                  <p className="font-body-md text-sm text-on-surface-variant">{card.profile.city} · {card.profile.mbti}</p>
                </div>
                <div className="ml-auto">
                  <span className="bg-primary text-on-primary font-label-caps text-label-caps px-3 py-1.5 rounded-full border-2 border-outline">
                    {card.negotiation_summary.match_score}%
                  </span>
                </div>
              </div>

              {/* 4-col stats */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {[
                  { label: '对象', value: `@${card.profile.nickname}` },
                  { label: '城市', value: card.profile.city },
                  { label: '人格', value: card.profile.mbti },
                  { label: '匹配度', value: `${card.negotiation_summary.match_score}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex-1 min-w-0 bg-surface-container-lowest border-2 border-outline rounded-DEFAULT p-3">
                    <span className="text-[10px] font-label-caps text-label-caps uppercase text-on-surface-variant block">{label}</span>
                    <span className="mt-0.5 text-sm font-h2 text-on-background block truncate">{value}</span>
                  </div>
                ))}
              </div>

              <div className="my-4 h-px w-full bg-outline" />

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span className="font-body-md text-sm text-on-surface">{card.profile.summary ?? '适合从同城或周边轻量见面开始'}</span>
              </div>
            </section>

            <div className="grid gap-gutter-margin xl:grid-cols-[1.02fr_0.98fr]">

              {/* Left column */}
              <div className="space-y-gutter-margin">

                {/* Match score + report */}
                <section className="bg-surface-container border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-widest text-[10px]">协商结论</p>
                      <p className="mt-1 font-h1 text-h1 text-on-background">{card.negotiation_summary.match_score}%</p>
                    </div>
                    <span className="rounded-full bg-primary text-on-primary font-label-caps text-label-caps px-3 py-1 border-2 border-outline">
                      适合进入盲选
                    </span>
                  </div>
                  <p className="mt-4 font-body-md text-sm leading-7 text-on-surface">{card.negotiation_summary.report_intro}</p>
                </section>

                {/* Negotiation thread */}
                <section className="bg-surface-container border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2">
                    <MessageCircleMore className="h-4 w-4 text-primary" />
                    <p className="font-h2 text-xl text-on-background">数字分身协商记录</p>
                  </div>
                  <div className="mt-4">
                    <NegotiationThread
                      consensus={card.negotiation_summary.consensus}
                      conflicts={card.negotiation_summary.conflicts}
                    />
                  </div>
                </section>

                {/* Red flags */}
                <section className="bg-surface-container border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-tertiary-fixed" />
                    <p className="font-h2 text-xl text-on-background">仍需留意</p>
                  </div>
                  <div className="mt-4">
                    <RedFlagsPanel items={card.negotiation_summary.conflicts} />
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div className="space-y-gutter-margin">

                {/* Radar chart */}
                <section className="bg-surface-container border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <p className="font-h2 text-xl text-on-background">契合雷达</p>
                  <div className="mt-4 flex justify-center">
                    <RadarChart data={card.radar_chart} size={240} />
                  </div>
                </section>

                {/* Consensus tags */}
                <section className="bg-surface-container border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <p className="font-h2 text-xl text-on-background">已经达成的共识</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.negotiation_summary.consensus.map((item) => (
                      <span key={item} className="bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps px-3 py-1.5 rounded-full border-2 border-outline">
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Next steps */}
                <section className="bg-surface-container border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <p className="font-h2 text-xl text-on-background">下一步怎么走</p>
                  <ul className="mt-4 space-y-3 font-body-md text-sm leading-7 text-on-surface">
                    <li>先完成 6 轮盲选，再决定是否进入正式私信。</li>
                    <li>如果盲选结果稳定，就用安全上报作为第一次见面的默认流程。</li>
                    <li>如果今天不想推进，也可以先跳过，后面随时再回来继续。</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </main>

        {/* Footer action buttons */}
        <footer className="relative shrink-0 border-t-2 border-outline bg-surface-container-lowest px-container-padding pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              className="bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-DEFAULT border-2 border-outline shadow-[0_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[0_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase w-full"
              onClick={() => handleAction('blind-game')}
              type="button"
            >
              开始盲选
            </button>
            <button
              className="bg-surface-container text-on-surface font-label-caps text-label-caps py-4 rounded-DEFAULT border-2 border-outline shadow-[0_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[0_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase w-full"
              onClick={() => handleAction('wechat')}
              type="button"
            >
              私信
            </button>
            <button
              className="bg-surface-container-lowest text-on-surface font-label-caps text-label-caps py-4 rounded-DEFAULT border-2 border-outline shadow-[0_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[0_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase w-full"
              onClick={() => handleAction('pass')}
              type="button"
            >
              跳过
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
