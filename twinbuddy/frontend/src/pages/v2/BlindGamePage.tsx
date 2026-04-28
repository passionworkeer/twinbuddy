import { RefreshCcw, Handshake, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchTwinBuddyBlindGameResult, postTwinBuddyBlindGameAction } from '../../api/client';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { TwinBuddyV2BlindGameResult, TwinBuddyV2OnboardingData } from '../../types';
import { V2_STORAGE_KEYS } from '../../types';

const mockDailyResult: TwinBuddyV2BlindGameResult = {
  isAvailable: true,
  dailyMatches: 3,
  remainingMatches: 3,
  matchedProfile: {
    id: 'mock-1',
    age: 24,
    gender: 'female',
    interests: ['独立摄影', '咖啡探店', '城市漫步'],
    mbti: 'INFP',
    traits: ['细节控', '随性', '喜欢记录'],
    commonTags: ['周末短途', '摄影'],
    blindDescription: '一位喜欢在城市角落寻找光影的 INFPs，期待一个能一起挥霍周末午后时光的搭子。',
  },
  icebreakerQuestions: [
    '如果你可以拥有一种超能力去旅行，你希望是什么？',
    '去过的地方里，哪个城市的咖啡最让你难忘？',
  ],
};

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

export default function BlindGamePage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [result, setResult] = useState<TwinBuddyV2BlindGameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [actionStatus, setActionStatus] = useState<string>('');
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      if (!profile.userId) {
        if (mounted) {
          setResult(mockDailyResult);
          setLoading(false);
          setErrorText('当前未登录，展示演示数据。');
        }
        return;
      }
      try {
        const res = await fetchTwinBuddyBlindGameResult(profile.userId);
        if (mounted) {
          setResult({ ...res, isAvailable: true });
          setErrorText('');
        }
      } catch (err) {
        if (mounted) {
          setResult(mockDailyResult);
          setErrorText('盲盒数据加载失败，已切换到演示模式。');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [profile.userId]);

  const handleAction = async (actionType: 'accept' | 'reject') => {
    if (!profile.userId || !result?.matchedProfile) return;
    setActionStatus(actionType === 'accept' ? 'sending' : 'rejecting');
    try {
      await postTwinBuddyBlindGameAction(profile.userId, result.matchedProfile.id, actionType);
      if (actionType === 'accept') {
        setActionStatus('accepted');
        setShowQuestions(true);
      } else {
        setActionStatus('rejected');
        // reload for next
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch {
      setErrorText('操作失败，请重试');
      setActionStatus('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="px-container-padding flex flex-col gap-section-margin relative h-full pt-8 pb-[100px]">
      
      <div className="fixed top-20 -left-10 w-72 h-72 bg-secondary-fixed blur-[80px] opacity-40 -z-10 rounded-full pointer-events-none"></div>

      <header className="mb-2 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-primary mb-4 border-2 border-primary shadow-[2px_2px_0px_#000]">
          <RefreshCcw className="h-8 w-8" />
        </div>
        <h1 className="font-h1 text-[32px] text-on-background leading-none mb-2">盲盒匹配</h1>
        <p className="font-body-md text-base text-on-surface-variant max-w-[80%] mx-auto">
          每天 3 次心跳盲选机会。隐藏照片和具体信息，仅凭数字分身的灵魂速写相遇。
        </p>
        <div className="mt-4 inline-block bg-surface-container border-2 border-outline rounded-full px-4 py-1.5 font-label-caps text-xs uppercase tracking-wider text-on-surface">
          今日剩余机会: <span className="font-bold text-primary">{result?.remainingMatches ?? 0}</span> / {result?.dailyMatches ?? 3}
        </div>
      </header>

      {errorText && (
        <div className="bg-error-container text-on-error-container font-body-md p-3 rounded-xl border border-error text-center text-sm">
          {errorText}
        </div>
      )}

      {result?.isAvailable && result.matchedProfile ? (
        <section className="max-w-md mx-auto w-full relative">
          
          {/* Card */}
          <div className="bg-surface-container-lowest border-2 border-primary rounded-[24px] overflow-hidden shadow-[8px_8px_0px_#000] transition-all relative z-10 p-6 flex flex-col items-center text-center">
            
            <div className="w-24 h-24 rounded-full border-4 border-outline-variant bg-surface-variant flex items-center justify-center mb-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-outline-variant to-surface-container-high opacity-50"></div>
              <span className="text-4xl relative z-10">🤔</span>
            </div>

            <h2 className="font-h2 text-[28px] text-on-background mb-4">神秘搭子</h2>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {result.matchedProfile.mbti && (
                 <span className="bg-primary-container text-on-primary-container border-2 border-primary px-3 py-1 rounded-full font-label-caps text-[10px] uppercase shadow-[2px_2px_0px_#000]">
                   {result.matchedProfile.mbti}
                 </span>
              )}
              {result.matchedProfile.age && (
                 <span className="bg-secondary-container text-on-secondary-container border-2 border-outline px-3 py-1 rounded-full font-label-caps text-[10px] uppercase shadow-[2px_2px_0px_#000]">
                   {result.matchedProfile.age} 岁
                 </span>
              )}
            </div>

            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant w-full mb-6">
              <p className="font-body-lg text-on-surface text-left italic">
                "{result.matchedProfile.blindDescription}"
              </p>
            </div>

            <div className="w-full">
              <h4 className="font-label-caps text-xs text-outline mb-2 text-left uppercase">他们说...</h4>
              <div className="flex flex-wrap gap-2">
                {result.matchedProfile.traits?.map((t: string) => (
                  <span key={t} className="bg-surface-container-highest text-on-surface text-xs font-body-md px-2 py-1 rounded border border-outline-variant">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full mt-4">
              <h4 className="font-label-caps text-xs text-outline mb-2 text-left uppercase">共同点</h4>
              <div className="flex flex-wrap gap-2">
                {result.matchedProfile.commonTags?.map((tag: string) => (
                  <span key={tag} className="bg-tertiary-container text-on-tertiary-container text-xs font-body-md px-2 py-1 rounded border border-tertiary shadow-[1px_1px_0px_#000]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 justify-center relative z-20">
            {actionStatus === 'accepted' ? (
              <div className="bg-primary text-on-primary border-2 border-primary shadow-[4px_4px_0px_#000] px-6 py-4 rounded-full font-label-caps flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-6 w-6" />
                已打招呼
              </div>
            ) : actionStatus === 'rejected' ? (
              <div className="bg-surface-variant text-on-surface-variant border-2 border-outline px-6 py-4 rounded-full font-label-caps flex items-center gap-2 text-lg">
                寻找下一个
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={!!actionStatus}
                  className="flex-1 bg-surface-container-lowest text-on-surface border-2 border-outline shadow-[4px_4px_0px_#000] rounded-full py-4 font-label-caps text-base hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-0 active:shadow-[0_0_0_#000] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="h-5 w-5" />
                  不太合适
                </button>
                <button
                  onClick={() => handleAction('accept')}
                  disabled={!!actionStatus}
                  className="flex-1 bg-primary text-on-primary border-2 border-primary shadow-[4px_4px_0px_#000] rounded-full py-4 font-label-caps text-base hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] active:translate-y-0 active:shadow-[0_0_0_#000] transition-all flex items-center justify-center gap-2"
                >
                  <Handshake className="h-5 w-5" />
                  打个招呼
                </button>
              </>
            )}
          </div>

          {/* Icebreaker Questions Slide Down */}
          {showQuestions && result.icebreakerQuestions && (
             <div className="absolute top-full left-0 right-0 mt-4 bg-tertiary-container text-on-tertiary-container border-2 border-tertiary rounded-2xl p-5 shadow-[4px_4px_0px_#000] animate-in fade-in slide-in-from-top-4 duration-300">
               <h3 className="font-label-caps text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                 <span className="material-symbols-outlined text-base">chat_bubble</span>
                 破冰问题参考
               </h3>
               <ul className="flex flex-col gap-3 font-body-md text-sm">
                 {result.icebreakerQuestions.map((q, i) => (
                   <li key={i} className="bg-surface-container-lowest p-3 rounded-lg border border-outline border-opacity-50">
                     {q}
                   </li>
                 ))}
               </ul>
             </div>
          )}

        </section>
      ) : (
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-surface-container rounded-full border-2 border-outline flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-outline-variant">hourglass_empty</span>
          </div>
          <h2 className="font-h2 text-2xl text-on-surface mb-2">今日盲盒已售罄</h2>
          <p className="font-body-md text-on-surface-variant max-w-xs">
            明天再来抽取新的隐秘搭档吧。
          </p>
        </section>
      )}
    </div>
  );
}
