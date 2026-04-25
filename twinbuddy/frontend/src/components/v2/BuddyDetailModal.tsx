import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { RadarChart } from '../twin-card/RadarChart';
import type { TwinBuddyV2BuddyCard } from '../../types';

interface Props {
  card: TwinBuddyV2BuddyCard;
  onClose: () => void;
}

export default function BuddyDetailModal({ card, onClose }: Props) {
  const navigate = useNavigate();

  const handleAction = (actionId: string) => {
    if (actionId === 'blind-game') {
      navigate(`/blind-game/${card.profile.buddy_id}/${card.negotiation_summary.negotiation_id}`);
      return;
    }
    if (actionId === 'wechat') {
      navigate('/messages');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="twin-card-layer2 relative w-full max-w-xl overflow-hidden rounded-[28px] p-5 sm:p-6">
        <button className="btn-icon absolute right-4 top-4" onClick={onClose} type="button">
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,179,182,0.25)] bg-[rgba(255,179,182,0.08)] px-3 py-1 text-xs text-[var(--color-primary-light)]">
              数字分身协商报告
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-2xl">
                {card.profile.avatar}
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">@{card.profile.nickname}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {card.profile.mbti} · {card.profile.city}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{card.profile.summary}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-white/8 bg-black/10 p-4">
              <h4 className="text-sm font-semibold text-white">契合雷达</h4>
              <div className="mt-4 flex justify-center">
                <RadarChart data={card.radar_chart} size={220} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/8 bg-black/10 p-4">
                <p className="text-sm text-[var(--color-text-secondary)]">匹配度</p>
                <p className="mt-2 text-4xl font-semibold text-[var(--color-primary)]">
                  {card.negotiation_summary.match_score}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {card.negotiation_summary.report_intro}
                </p>
              </div>

              <div className="rounded-3xl border border-white/8 bg-black/10 p-4">
                <h4 className="text-sm font-semibold text-white">已经达成的共识</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {card.negotiation_summary.consensus.map((item) => (
                    <span key={item} className="tag selected">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/8 bg-black/10 p-4">
                <h4 className="text-sm font-semibold text-white">仍需留意</h4>
                <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                  {card.negotiation_summary.conflicts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {card.actions.map((action) => (
              <button
                key={action.id}
                className={action.id === 'blind-game' ? 'btn-primary w-full' : 'btn-secondary w-full'}
                onClick={() => handleAction(action.id)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
