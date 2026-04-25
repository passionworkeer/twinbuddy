import { ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchTwinBuddyBuddyCard,
  fetchTwinBuddyBuddyInbox,
  fetchTwinBuddySecurityStatus,
  submitTwinBuddyVerification,
} from '../../api/client';
import BuddyDetailModal from '../../components/v2/BuddyDetailModal';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { buddyInbox as fallbackInbox } from '../../mocks/buddyInbox';
import { buddyShowcases } from '../../mocks/v2Showcase';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type {
  TwinBuddySecurityStatus,
  TwinBuddyV2BuddyCard,
  TwinBuddyV2BuddyInboxItem,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { V2_STORAGE_KEYS } from '../../types';

const initialProfile: TwinBuddyV2OnboardingData = {
  mbti: '',
  travelRange: [],
  budget: '',
  selfDescription: '',
  city: '',
  completed: false,
  timestamp: 0,
};

function buildFallbackInbox(): TwinBuddyV2BuddyInboxItem[] {
  return fallbackInbox.map((item) => ({
    buddy_id: item.id,
    nickname: item.nickname,
    mbti: item.mbti,
    avatar: '✨',
    city: item.city,
    match_score: item.matchScore,
    negotiation_id: `neg-${item.id}`,
    status: item.status,
    preview: item.summary,
    highlights: item.highlights,
    conflicts: [],
  }));
}

export default function BuddiesPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [items, setItems] = useState<TwinBuddyV2BuddyInboxItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<TwinBuddyV2BuddyCard | null>(null);
  const [securityStatus, setSecurityStatus] = useState<TwinBuddySecurityStatus | null>(null);
  const [legalName, setLegalName] = useState('');
  const [idNumberTail, setIdNumberTail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const loadInbox = () => {
    if (!profile.userId) {
      setItems(buildFallbackInbox());
      return Promise.resolve();
    }
    return fetchTwinBuddyBuddyInbox(profile.userId)
      .then(setItems)
      .catch(() => {
        setItems(buildFallbackInbox());
      });
  };

  useEffect(() => {
    if (!profile.userId) {
      setItems(buildFallbackInbox());
      return;
    }

    fetchTwinBuddySecurityStatus(profile.userId)
      .then((status) => {
        setSecurityStatus(status);
        if (status.is_verified) {
          return loadInbox();
        }
        setItems([]);
        return Promise.resolve();
      })
      .catch(() => {
        setItems(buildFallbackInbox());
      });
  }, [profile.userId]);

  const openCard = async (buddyId: string, negotiationId: string) => {
    try {
      const card = await fetchTwinBuddyBuddyCard(buddyId, negotiationId);
      setSelectedCard(card);
    } catch {
      setSelectedCard(null);
    }
  };

  const handleVerify = async () => {
    if (!profile.userId || !legalName.trim() || !idNumberTail.trim() || isVerifying) return;
    setIsVerifying(true);
    try {
      const nextStatus = await submitTwinBuddyVerification({
        userId: profile.userId,
        legalName: legalName.trim(),
        idNumberTail: idNumberTail.trim(),
      });
      setSecurityStatus(nextStatus);
      await loadInbox();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="glass-panel-strong p-5">
        <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(175,255,251,0.08)] px-3 py-1 text-xs text-[var(--color-secondary)]">
                <Sparkles className="h-3.5 w-3.5" />
                数字分身汇报
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">今日已完成 3 位候选搭子的预协商</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {securityStatus?.is_verified
                  ? '数字分身已经先替你筛过一轮，下面这些都是更值得继续了解的对象。'
                  : '上线前的安全底线是实名认证。认证通过后，Tab2 才会解锁真正的搭子动态和预协商结果。'}
              </p>
            </div>
          </div>
      </section>

      {profile.userId && securityStatus && !securityStatus.is_verified ? (
        <section className="glass-panel p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h3 className="text-xl font-semibold text-white">完成实名认证后解锁搭子动态</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                这是陌生人见面产品的上线前提。认证后你才能查看预协商结果、开始盲选，并在正式认识后上报行程。
              </p>
              <div className="mt-5 grid gap-3">
                <input
                  className="neon-input"
                  onChange={(event) => setLegalName(event.target.value)}
                  placeholder="真实姓名"
                  value={legalName}
                />
                <input
                  className="neon-input"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setIdNumberTail(event.target.value)}
                  placeholder="身份证后四位"
                  value={idNumberTail}
                />
                <button className="btn-primary w-full sm:w-auto" disabled={isVerifying} onClick={handleVerify} type="button">
                  {isVerifying ? '认证中' : '完成认证并解锁搭子'}
                </button>
              </div>
            </div>
            <aside className="rounded-[28px] border border-white/8 bg-black/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">安全说明</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                <li>未认证用户无法进入真正的搭子推荐与盲选流程。</li>
                <li>认证后会同步解锁行程上报和紧急联系人能力。</li>
                <li>前端只展示脱敏状态，敏感信息不会在页面回显。</li>
              </ul>
            </aside>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          <ShowcaseCarousel
            title="轮播展示"
            items={buddyShowcases}
            className="p-5"
          />
          {items.map((buddy) => (
            <article key={buddy.buddy_id} className="glass-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{buddy.avatar}</span>
                    <h3 className="text-lg font-semibold text-white">@{buddy.nickname}</h3>
                    <span className="mbti-badge">{buddy.mbti}</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">{buddy.city}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{buddy.preview}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-[var(--color-text-secondary)]">匹配度</p>
                  <p className="text-3xl font-semibold text-[var(--color-primary)]">{buddy.match_score}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {buddy.highlights.map((highlight) => (
                  <span key={highlight} className="tag">
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                  {buddy.status}
                </span>
                <button className="btn-secondary text-sm" onClick={() => openCard(buddy.buddy_id, buddy.negotiation_id)} type="button">
                  查看协商摘要
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedCard ? <BuddyDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} /> : null}
    </div>
  );
}
