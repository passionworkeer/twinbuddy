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
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(10,15,16,0.2),rgba(6,17,15,0.84)_38%,rgba(7,22,18,0.96))]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(31,53,48,0.85),rgba(11,19,21,0.4)_38%,rgba(11,28,21,0.95))]" />
        <div className="absolute -left-12 top-28 h-56 w-56 rounded-full bg-[rgba(116,162,143,0.16)] blur-3xl" />
        <div className="absolute bottom-20 right-[-2rem] h-64 w-64 rounded-full bg-[rgba(255,120,86,0.12)] blur-3xl" />
      </div>

      <div className="relative z-10 flex h-[100dvh] flex-col">
        <header className="flex shrink-0 items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+1rem)] text-white/80 sm:px-6">
          <button className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-sm text-white" onClick={onClose} type="button">
            <ChevronLeft className="h-4 w-4" />
            返回
          </button>
          <div className="flex items-center gap-5 overflow-x-auto text-sm font-medium no-scrollbar">
            <span className="whitespace-nowrap text-white/70">概览</span>
            <span className="whitespace-nowrap text-white">协商</span>
            <span className="whitespace-nowrap text-white/70">盲选</span>
          </div>
          <button className="btn-icon h-11 w-11" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </header>

        <main className="relative flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] pt-3 no-scrollbar sm:px-6">
          <div className="mx-auto max-w-5xl space-y-5">
            <section className="px-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/80">
                <Compass className="h-3.5 w-3.5 text-[var(--color-secondary)]" />
                Layer 2 协商详情
              </div>
              <h2 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                与 @{card.profile.nickname} 的预协商已经完成
              </h2>
            </section>

            <section className="glass-card rounded-[20px] p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">对象</span>
                  <span className="mt-1 text-sm font-semibold text-white">@{card.profile.nickname}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">城市</span>
                  <span className="mt-1 text-sm font-semibold text-white">{card.profile.city}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">人格</span>
                  <span className="mt-1 text-sm font-semibold text-white">{card.profile.mbti}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">匹配度</span>
                  <span className="mt-1 text-sm font-semibold text-white">{card.negotiation_summary.match_score}%</span>
                </div>
              </div>
              <div className="my-4 h-px w-full bg-white/15" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[var(--color-primary)]" />
                  <span className="text-sm font-semibold text-white">适合从同城或周边轻量见面开始</span>
                </div>
                <div className="hidden w-24 opacity-70 sm:block">
                  <svg fill="none" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 22 Q 15 10, 30 16 T 60 8 T 100 12" stroke="#ff7856" strokeLinecap="round" strokeWidth="2" />
                    <circle cx="0" cy="22" fill="#ff7856" r="3" />
                    <circle cx="100" cy="12" fill="#ff7856" r="3" />
                  </svg>
                </div>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-5">
                <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/70">协商结论</p>
                      <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                        {card.negotiation_summary.match_score}%
                      </p>
                    </div>
                    <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs text-[var(--color-secondary)]">
                      适合进入盲选
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/80">{card.negotiation_summary.report_intro}</p>
                </section>

                <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center gap-2">
                    <MessageCircleMore className="h-4 w-4 text-[var(--color-primary)]" />
                    <p className="text-sm font-semibold text-white">数字分身协商记录</p>
                  </div>
                  <div className="mt-4">
                    <NegotiationThread
                      consensus={card.negotiation_summary.consensus}
                      conflicts={card.negotiation_summary.conflicts}
                    />
                  </div>
                </section>

                <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#ff8a6d]" />
                    <p className="text-sm font-semibold text-white">仍需留意</p>
                  </div>
                  <div className="mt-4">
                    <RedFlagsPanel items={card.negotiation_summary.conflicts} />
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                  <p className="text-sm font-semibold text-white">契合雷达</p>
                  <div className="mt-4 flex justify-center">
                    <RadarChart data={card.radar_chart} size={240} />
                  </div>
                </section>

                <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                  <p className="text-sm font-semibold text-white">已经达成的共识</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.negotiation_summary.consensus.map((item) => (
                      <span key={item} className="tag selected">
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                  <p className="text-sm font-semibold text-white">下一步怎么走</p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-white/80">
                    <li>先完成 6 轮盲选，再决定是否进入正式私信。</li>
                    <li>如果盲选结果稳定，就用安全上报作为第一次见面的默认流程。</li>
                    <li>如果今天不想推进，也可以先跳过，后面随时再回来继续。</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative shrink-0 border-t border-white/10 bg-black/35 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 backdrop-blur-2xl sm:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3">
            {card.actions.map((action) => (
              <button
                key={action.id}
                className={action.id === 'blind-game' ? 'btn-primary w-full' : 'btn-secondary w-full border-white/20 text-white'}
                onClick={() => handleAction(action.id)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
