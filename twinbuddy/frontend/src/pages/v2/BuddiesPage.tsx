import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
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
    negotiation_id: "eg-\\",
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
    <div className="relative flex flex-col overflow-y-auto h-screen">
      {/* Background Decor */}
      <div className="fixed top-1/4 -right-20 w-80 h-80 bg-primary-fixed blur-[100px] opacity-30 -z-10 rounded-full pointer-events-none"></div>

      {/* Scrollable Content */}
      <div className="flex-1 px-container-padding pt-8 pb-[100px]">
        <header className="mb-2">
        <div className="flex items-center gap-3 mb-2">
          <Navigation className="h-8 w-8 text-primary" />
          <h1 className="font-h1 text-h1 text-on-background leading-none">探索搭子</h1>
        </div>
        <p className="font-body-md text-base text-on-surface-variant max-w-[85%]">
           {securityStatus?.is_verified
            ? '数字分身已经替你评估了所有潜在匹配，下面是最符合你偏好的对象。'
            : '完成实名认证安全底线，解锁正式搭子协商。'}
        </p>
      </header>

      {/* Security Intro Banner (Neo-Brutalist) */}
      {!securityStatus?.is_verified && (
        <section className="bg-tertiary-fixed border-2 border-primary rounded-2xl p-5 shadow-[4px_4px_0px_#000]">
          <div className="flex items-start gap-4">
            <div className="bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary shrink-0 shadow-[2px_2px_0px_#000]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-h2 text-[22px] text-on-background leading-tight mb-1">实名认证</h2>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                这是陌生人见面产品的核心安全底线。实名后，你才能开启真正的匹配与协商。
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="mt-5 flex flex-col gap-3">
             <input
               className="w-full bg-surface-container-lowest border-2 border-primary rounded-xl px-4 py-3 font-body-md text-on-background focus:outline-none focus:shadow-[2px_2px_0px_#000] focus:-translate-y-0.5 transition-all outline-none"
               onChange={(event) => setLegalName(event.target.value)}
               placeholder="真实姓名"
               value={legalName}
             />
             <input
               className="w-full bg-surface-container-lowest border-2 border-primary rounded-xl px-4 py-3 font-body-md text-on-background focus:outline-none focus:shadow-[2px_2px_0px_#000] focus:-translate-y-0.5 transition-all outline-none"
               inputMode="numeric"
               maxLength={4}
               onChange={(event) => setIdNumberTail(event.target.value)}
               placeholder="身份证后四位"
               value={idNumberTail}
             />
             <button 
               className="mt-2 w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-xl border-2 border-primary shadow-[4px_4px_0px_#000] hover:bg-surface-tint hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-0 active:shadow-[0_0_0_#000] transition-all uppercase"
               disabled={isVerifying} 
               onClick={handleVerify} 
               type="button"
             >
               {isVerifying ? '认证中...' : '提交认证并解锁'}
             </button>
          </div>
        </section>
      )}

      {errorText && (
        <div className="bg-error text-on-error font-body-md p-4 rounded-xl border-2 border-primary shadow-[4px_4px_0px_#000] mt-4">
          <p className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            {errorText}
          </p>
        </div>
      )}

      {/* The Map / List */}
      {(securityStatus?.is_verified || !profile.userId) && (
        <section className="flex flex-col gap-4 mt-2">
          
          <div className="flex items-center justify-between">
            <h2 className="font-h2 text-[24px] text-on-background">已预协商 {items.length || 0} 人</h2>
            <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-label-caps uppercase border border-primary">
              Live
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {items.map((buddy) => (
              <div 
                key={buddy.buddy_id} 
                onClick={() => openCard(buddy.buddy_id, buddy.negotiation_id)}
                className="bg-surface-container-lowest border-2 border-primary rounded-xl p-5 shadow-[4px_4px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-primary bg-secondary-fixed flex items-center justify-center text-xl overflow-hidden shadow-[2px_2px_0px_#000]">
                      {buddy.avatar.length > 5 ? <img src={buddy.avatar} alt="avatar" className="w-full h-full object-cover" /> : buddy.avatar}
                    </div>
                    <div>
                      <h3 className="font-h2 text-xl text-on-background group-hover:text-primary transition-colors">{buddy.nickname}</h3>
                      <p className="font-body-md text-sm text-on-surface-variant flex items-center gap-1">
                        {buddy.city} • <span className="font-label-caps bg-tertiary-fixed text-[10px] px-1.5 py-0.5 rounded-sm">{buddy.mbti}</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary text-on-primary font-label-caps text-lg px-3 py-1.5 rounded-full border-2 border-primary shadow-[2px_2px_0px_#000]">
                    {buddy.match_score}%
                  </div>
                </div>

                <div className="font-body-md text-sm text-on-surface-variant line-clamp-2 bg-surface-container p-3 rounded-lg border border-outline-variant group-hover:border-primary transition-colors">
                  {buddy.preview}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      </div>

      {selectedCard ? <BuddyDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} /> : null}
    </div>
  );
}
