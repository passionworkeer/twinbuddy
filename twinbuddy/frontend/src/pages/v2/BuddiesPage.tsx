import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Navigation } from 'lucide-react';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import BuddyDetailModal from '../../components/v2/BuddyDetailModal';
import { buddyShowcases } from '../../mocks/v2Showcase';
import { mockBuddyCard, mockBuddyInbox, mockSecurityStatus } from '../../mocks/v2ApiMock';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type {
  TwinBuddySecurityStatus,
  TwinBuddyV2BuddyCard,
  TwinBuddyV2BuddyInboxItem,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { V2_STORAGE_KEYS } from '../../types';

const initialProfile: TwinBuddyV2OnboardingData = {
  mbti: 'INTJ',
  travelRange: ['周末短途', '周边城市'],
  interests: ['美食', '城市漫步', '摄影'],
  budget: '舒适',
  selfDescription: '喜欢慢慢走，不赶行程，吃好住好最重要。',
  city: '深圳',
  completed: true,
  userId: 'user_77e92a9e',
  timestamp: Date.now(),
};

export default function BuddiesPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [items] = useState<TwinBuddyV2BuddyInboxItem[]>(mockBuddyInbox);
  const [selectedCard, setSelectedCard] = useState<TwinBuddyV2BuddyCard | null>(null);
  const [securityStatus] = useState<TwinBuddySecurityStatus>(mockSecurityStatus);
  const [errorText, setErrorText] = useState('');
  const [legalName, setLegalName] = useState('');
  const [idNumberTail, setIdNumberTail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const openCard = (_buddyId: string) => {
    setSelectedCard(mockBuddyCard);
  };

  const handleVerify = () => {
    if (!legalName.trim() || !idNumberTail.trim() || isVerifying) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="relative flex flex-col">
      {/* Background Decor */}
      <div className="fixed top-1/4 -right-20 w-80 h-80 bg-primary-fixed blur-[100px] opacity-30 -z-10 rounded-full pointer-events-none"></div>

      {/* Scrollable Content */}
      <div className="flex-1 px-container-padding pt-16 pb-[100px]">
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
          <section className="bg-tertiary-fixed border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center border-2 border-outline shrink-0">
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
                className="w-full bg-surface-container-lowest border-2 border-outline rounded-DEFAULT px-4 py-3 font-body-md text-on-background focus:border-primary outline-none transition-all"
                onChange={(event) => setLegalName(event.target.value)}
                placeholder="真实姓名"
                value={legalName}
              />
              <input
                className="w-full bg-surface-container-lowest border-2 border-outline rounded-DEFAULT px-4 py-3 font-body-md text-on-background focus:border-primary outline-none transition-all"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => setIdNumberTail(event.target.value)}
                placeholder="身份证后四位"
                value={idNumberTail}
              />
              <button
                className="mt-2 w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-DEFAULT border-2 border-outline shadow-[0_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none transition-all uppercase"
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
          <div className="bg-error text-on-error font-body-md p-4 rounded-DEFAULT border-2 border-outline mt-4">
            <p className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              {errorText}
            </p>
          </div>
        )}

        {/* Buddy List */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-h2 text-h2 text-on-background">已预协商 {items.length} 人</h2>
            <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-label-caps uppercase border-2 border-outline">
              Demo
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {items.map((buddy) => (
              <div
                key={buddy.buddy_id}
                onClick={() => openCard(buddy.buddy_id)}
                className="bg-surface-container-lowest border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-outline bg-secondary-fixed flex items-center justify-center text-xl overflow-hidden">
                      {buddy.avatar && buddy.avatar.length > 5 ? (
                        <img src={buddy.avatar} alt={buddy.nickname} className="w-full h-full object-cover" />
                      ) : (
                        buddy.avatar
                      )}
                    </div>
                    <div>
                      <h3 className="font-h2 text-xl text-on-background group-hover:text-secondary transition-colors">{buddy.nickname}</h3>
                      <p className="font-body-md text-sm text-on-surface-variant flex items-center gap-1">
                        {buddy.city} · <span className="font-label-caps bg-tertiary-fixed text-[10px] px-1.5 py-0.5 rounded-sm">{buddy.mbti}</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-primary text-on-primary font-label-caps text-lg px-3 py-1.5 rounded-full border-2 border-outline">
                    {buddy.match_score}%
                  </div>
                </div>

                <div className="font-body-md text-sm text-on-surface-variant line-clamp-2 bg-surface-container p-3 rounded-lg border border-outline group-hover:border-secondary transition-colors">
                  {buddy.preview || `匹配分数 ${buddy.match_score}%，你们的旅行节奏和美食偏好高度一致。`}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Showcase Carousel */}
        <section className="mt-6">
          <ShowcaseCarousel
            title="盲选洞察"
            items={buddyShowcases}
            className="p-container-padding"
            intervalMs={5600}
          />
        </section>
      </div>

      {selectedCard ? <BuddyDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} /> : null}
    </div>
  );
}
