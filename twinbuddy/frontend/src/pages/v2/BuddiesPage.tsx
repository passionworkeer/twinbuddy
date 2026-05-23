import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Navigation } from 'lucide-react';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import BuddyDetailModal from '../../components/v2/BuddyDetailModal';
import { buddyShowcases } from '../../mocks/v2Showcase';
import {
  fetchTwinBuddyBuddyCard,
  fetchTwinBuddyBuddyInbox,
  fetchTwinBuddySecurityStatus,
  submitTwinBuddyVerification,
} from '../../api/client';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type {
  TwinBuddySecurityStatus,
  TwinBuddyV2BuddyCard,
  TwinBuddyV2BuddyInboxItem,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { V2_STORAGE_KEYS } from '../../types';
import { EMPTY_ONBOARDING_PROFILE } from '../../utils/twinbuddyProfile';

export default function BuddiesPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, EMPTY_ONBOARDING_PROFILE);
  const [items, setItems] = useState<TwinBuddyV2BuddyInboxItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<TwinBuddyV2BuddyCard | null>(null);
  const [securityStatus, setSecurityStatus] = useState<TwinBuddySecurityStatus | null>(null);
  const [errorText, setErrorText] = useState('');
  const [legalName, setLegalName] = useState('');
  const [idNumberTail, setIdNumberTail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(profile.userId));
  const [isCardLoading, setIsCardLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSecurityAndInbox() {
      if (!profile.userId) {
        setIsLoading(false);
        setItems([]);
        setSecurityStatus(null);
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const status = await fetchTwinBuddySecurityStatus(profile.userId);
        if (!mounted) return;
        setSecurityStatus(status);

        if (!status.is_verified) {
          setItems([]);
          return;
        }

        const inboxItems = await fetchTwinBuddyBuddyInbox(profile.userId);
        if (!mounted) return;
        setItems(inboxItems);
      } catch (error) {
        if (!mounted) return;
        setItems([]);
        if (error instanceof Error) {
          if (error.message.includes('403') || error.message.includes('实名认证')) {
            setSecurityStatus({
              user_id: profile.userId,
              is_verified: false,
              verification_status: 'unverified',
              real_name_masked: '',
              id_number_tail: '',
            });
            setErrorText('完成实名认证后才能查看正式搭子协商结果。');
          } else {
            setErrorText(error.message || '搭子数据加载失败，请稍后重试。');
          }
        } else {
          setErrorText('搭子数据加载失败，请稍后重试。');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSecurityAndInbox();

    return () => {
      mounted = false;
    };
  }, [profile.userId]);

  const openCard = async (buddyId: string, negotiationId: string) => {
    setIsCardLoading(true);
    setErrorText('');
    try {
      const card = await fetchTwinBuddyBuddyCard(buddyId, negotiationId);
      setSelectedCard(card);
    } catch (error) {
      if (error instanceof Error) {
        setErrorText(error.message || '搭子详情加载失败，请稍后重试。');
      } else {
        setErrorText('搭子详情加载失败，请稍后重试。');
      }
    } finally {
      setIsCardLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!profile.userId) {
      setErrorText('请先完成 onboarding 生成画像后再认证。');
      return;
    }
    if (!legalName.trim() || !idNumberTail.trim() || isVerifying) return;

    setIsVerifying(true);
    setErrorText('');

    try {
      const status = await submitTwinBuddyVerification({
        userId: profile.userId,
        legalName: legalName.trim(),
        idNumberTail: idNumberTail.trim(),
      });
      setSecurityStatus(status);
      const inboxItems = await fetchTwinBuddyBuddyInbox(profile.userId);
      setItems(inboxItems);
      setLegalName('');
      setIdNumberTail('');
    } catch (error) {
      if (error instanceof Error) {
        setErrorText(error.message || '认证失败，请稍后重试。');
      } else {
        setErrorText('认证失败，请稍后重试。');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const introText = useMemo(() => {
    if (!profile.userId) {
      return '先完成你的数字画像，才能进入真实搭子协商。';
    }
    if (securityStatus?.is_verified) {
      return '数字分身已经替你评估了所有潜在匹配，下面是最符合你偏好的对象。';
    }
    return '完成实名认证安全底线，解锁正式搭子协商。';
  }, [profile.userId, securityStatus?.is_verified]);

  return (
    <div className="relative flex flex-col">
      <div className="fixed top-1/4 -right-20 w-80 h-80 bg-primary-fixed blur-[100px] opacity-30 -z-10 rounded-full pointer-events-none"></div>

      <div className="flex-1 px-container-padding pt-14 pb-[100px]">
        <header className="mb-2">
          <div className="flex items-center gap-3 mb-2">
            <Navigation className="h-8 w-8 text-primary" />
            <h1 className="font-h1 text-h1 text-on-background leading-none">探索搭子</h1>
          </div>
          <p className="font-body-md text-base text-on-surface-variant max-w-[85%]">{introText}</p>
        </header>

        {!profile.userId && (
          <section className="bg-surface-container-lowest border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-4">
            <h2 className="font-h2 text-[22px] text-on-background leading-tight mb-2">先完成画像初始化</h2>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
              当前还没有可用的真实用户画像，请先完成 onboarding，系统才能为你生成可协商的搭子列表。
            </p>
          </section>
        )}

        {profile.userId && !securityStatus?.is_verified && (
          <section className="bg-tertiary-fixed border-2 border-outline rounded-DEFAULT p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-4">
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
                maxLength={6}
                onChange={(event) => setIdNumberTail(event.target.value)}
                placeholder="身份证后四到六位"
                value={idNumberTail}
              />
              <button
                className="mt-2 w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-DEFAULT border-2 border-outline shadow-[0_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none transition-all uppercase disabled:opacity-60"
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

        <section className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-h2 text-h2 text-on-background">
              已预协商 {items.length} 人
            </h2>
            {isLoading ? (
              <div className="bg-surface-container text-on-surface px-3 py-1 rounded-full text-[10px] font-label-caps uppercase border-2 border-outline">
                加载中
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {!isLoading && securityStatus?.is_verified && items.length === 0 ? (
              <div className="bg-surface-container-lowest border-2 border-outline rounded-DEFAULT p-5 text-sm text-on-surface-variant">
                暂时还没有可展示的搭子结果，稍后再来看看新的协商对象。
              </div>
            ) : null}

            {items.map((buddy) => (
              <div
                key={buddy.buddy_id}
                onClick={() => void openCard(buddy.buddy_id, buddy.negotiation_id)}
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

        <section className="mt-6">
          <ShowcaseCarousel
            title="盲选洞察"
            items={buddyShowcases}
            className="p-container-padding"
            intervalMs={5600}
          />
        </section>
      </div>

      {isCardLoading ? (
        <div className="fixed inset-x-0 bottom-[120px] mx-auto w-fit rounded-full border-2 border-outline bg-surface-container-lowest px-4 py-2 text-sm text-on-surface shadow-[0_4px_0_0_#000]">
          正在加载搭子详情...
        </div>
      ) : null}

      {selectedCard ? <BuddyDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} /> : null}
    </div>
  );
}
