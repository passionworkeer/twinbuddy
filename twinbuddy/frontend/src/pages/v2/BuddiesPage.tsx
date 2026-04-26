import { useEffect, useState } from 'react';
import {
  fetchTwinBuddyBuddyCard,
  fetchTwinBuddyBuddyInbox,
  fetchTwinBuddySecurityStatus,
  submitTwinBuddyVerification,
} from '../../api/client';
import TwinCard from '../../components/twin-card/TwinCard';
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
  interests: [],
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
  const [errorText, setErrorText] = useState('');
  const [legalName, setLegalName] = useState('');
  const [idNumberTail, setIdNumberTail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const loadInbox = () => {
    if (!profile.userId) {
      setItems(buildFallbackInbox());
      return Promise.resolve();
    }
    return fetchTwinBuddyBuddyInbox(profile.userId)
      .then((nextItems) => {
        setErrorText('');
        setItems(nextItems);
      })
      .catch(() => {
        setErrorText('搭子动态暂时加载失败，已切换到演示数据。');
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
        setErrorText('');
        setItems([]);
        return Promise.resolve();
      })
      .catch(() => {
        setErrorText('实名认证状态读取失败，已切换到演示数据。');
        setItems(buildFallbackInbox());
      });
  }, [profile.userId]);

  const openCard = async (buddyId: string, negotiationId: string) => {
    try {
      const card = await fetchTwinBuddyBuddyCard(buddyId, negotiationId);
      setErrorText('');
      setSelectedCard(card);
    } catch {
      setErrorText('协商摘要加载失败，请稍后再试。');
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
    } catch {
      setErrorText('实名认证失败，请确认信息后重试。');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="glass-panel-strong p-5">
        <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(74,222,128,0.12)] px-3 py-1 text-xs text-[var(--color-secondary)]">
                
                数字分身汇报
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">今日已完成 {items.length || 3} 位候选搭子的预协商</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                {securityStatus?.is_verified
                  ? '数字分身已经先替你筛过一轮，下面这些都是更值得继续了解的对象。'
                  : '上线前的安全底线是实名认证。认证通过后，Tab2 才会解锁真正的搭子动态和预协商结果。'}
              </p>
            </div>
          </div>
      </section>

      {errorText ? (
        <section className="rounded-[24px] border border-[rgba(248,113,113,0.2)] bg-[rgba(93,32,32,0.24)] px-4 py-3 text-sm text-[var(--color-primary-light)]">
          {errorText}
        </section>
      ) : null}

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
                  maxLength={4}
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
            title="推荐搭子"
            items={buddyShowcases}
            className="p-5"
          />
          {items.map((buddy) => (
            <TwinCard
              key={buddy.buddy_id}
              buddy={buddy}
              onOpen={() => openCard(buddy.buddy_id, buddy.negotiation_id)}
            />
          ))}
        </div>
      )}

      {selectedCard ? <BuddyDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} /> : null}
    </div>
  );
}
