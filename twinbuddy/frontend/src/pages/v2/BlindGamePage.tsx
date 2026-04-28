import { RefreshCcw, Handshake, CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { V2_STORAGE_KEYS } from '../../types';
import type { TwinBuddyV2OnboardingData } from '../../types';

interface BlindGameResult {
  isAvailable: boolean;
  dailyMatches?: number;
  remainingMatches?: number;
  matchedProfile?: {
    id: string;
    age: number;
    gender: string;
    interests: string[];
    mbti: string;
    traits: string[];
    commonTags: string[];
    blindDescription: string;
  };
  icebreakerQuestions?: string[];
}

const mockDailyResult: BlindGameResult = {
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
    blindDescription: '一位喜欢在城市角落寻找光影的 INFP，期待一个能一起挥霍周末午后时光的搭子。',
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
  const navigate = useNavigate();
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [result, setResult] = useState<BlindGameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText] = useState('');
  const [actionStatus, setActionStatus] = useState<string>('');
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const loadData = async () => {
      if (mounted) {
        setResult(mockDailyResult);
        setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [profile.userId]);

  const handleAction = (actionType: 'accept' | 'reject') => {
    if (!result?.matchedProfile) return;
    if (actionType === 'accept') {
      setActionStatus('accepted');
      setShowQuestions(true);
    } else {
      setActionStatus('rejected');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Background blobs */}
      <div className="fixed top-10 right-10 w-64 h-64 bg-primary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-secondary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>

      {/* Game Header */}
      <header className="px-container-padding pt-8 pb-4 flex flex-col gap-6 z-10 relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 bg-surface-container rounded-full pr-5 pl-1.5 py-1.5 border border-outline-variant">
            <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-secondary-fixed flex items-center justify-center">
              <span className="font-h2 text-h2 text-on-secondary-fixed">?</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">神秘搭子</span>
              <span className="font-body-md text-sm font-semibold text-on-surface leading-none mt-1">Blind Match</span>
            </div>
          </div>

          <div className="w-12 h-12"></div>
        </div>

        {/* Remaining matches */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="font-label-caps text-label-caps text-primary uppercase">
              今日剩余 {result?.remainingMatches ?? 0} / {result?.dailyMatches ?? 3}
            </span>
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">盲选机会</span>
          </div>
          <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden relative border border-outline-variant">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((result?.remainingMatches ?? 0) / (result?.dailyMatches ?? 3)) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Card Content */}
      <div className="flex-grow flex flex-col px-container-padding pb-8 z-10">
        {errorText && (
          <div className="bg-error-container text-on-error-container font-body-md p-3 rounded-xl border border-error text-center text-sm">
            {errorText}
          </div>
        )}

        {result?.isAvailable && result.matchedProfile ? (
          <div className="flex flex-col items-center gap-6 flex-grow">
            {/* Mystery Avatar */}
            <div className="w-40 h-40 rounded-full border-4 border-primary shadow-[8px_8px_0_0_#000] bg-secondary-fixed flex items-center justify-center mt-8">
              <span className="text-7xl font-bold text-on-secondary-fixed opacity-50">?</span>
            </div>

            {/* Name + Tags */}
            <div className="text-center">
              <h2 className="font-question-serif text-[32px] text-on-surface mb-4 leading-snug">
                {result.matchedProfile.blindDescription}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                {result.matchedProfile.mbti && (
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps px-3 py-1 rounded-full border-2 border-primary shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {result.matchedProfile.mbti}
                  </span>
                )}
                {result.matchedProfile.age && (
                  <span className="bg-surface-container text-on-surface font-label-caps text-label-caps px-3 py-1 rounded-full border-2 border-outline">
                    {result.matchedProfile.age} 岁
                  </span>
                )}
              </div>
            </div>

            {/* Traits */}
            {result.matchedProfile.traits && result.matchedProfile.traits.length > 0 && (
              <div className="w-full max-w-sm">
                <h4 className="font-label-caps text-xs text-outline mb-2 text-left uppercase">他们说...</h4>
                <div className="flex flex-wrap gap-2">
                  {result.matchedProfile.traits.map((t: string) => (
                    <span key={t} className="bg-surface-container text-on-surface text-xs font-body-md px-2 py-1 rounded border border-outline-variant">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Common Tags */}
            {result.matchedProfile.commonTags && result.matchedProfile.commonTags.length > 0 && (
              <div className="w-full max-w-sm">
                <h4 className="font-label-caps text-xs text-outline mb-2 text-left uppercase">共同点</h4>
                <div className="flex flex-wrap gap-2">
                  {result.matchedProfile.commonTags.map((tag: string) => (
                    <span key={tag} className="bg-secondary-container text-on-secondary-container text-xs font-body-md px-2 py-1 rounded border border-outline">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Icebreaker Questions */}
            {showQuestions && result.icebreakerQuestions && (
              <div className="w-full max-w-sm bg-tertiary-container text-on-tertiary-container border-2 border-primary rounded-DEFAULT p-container-padding shadow-[4px_4px_0_0_#000]">
                <h3 className="font-label-caps text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">chat_bubble</span>
                  破冰问题参考
                </h3>
                <ul className="flex flex-col gap-3 font-body-md text-sm">
                  {result.icebreakerQuestions.map((q: string, i: number) => (
                    <li key={i} className="bg-surface-container-lowest p-3 rounded-lg border border-outline text-on-surface">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow text-center">
            <div className="w-20 h-20 bg-surface-container rounded-full border-2 border-outline flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-outline-variant">hourglass_empty</span>
            </div>
            <h2 className="font-h2 text-2xl text-on-surface mb-2">今日盲盒已售罄</h2>
            <p className="font-body-md text-on-surface-variant max-w-xs">明天再来抽取新的隐秘搭档吧。</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {result?.isAvailable && result.matchedProfile && (
        <div className="px-container-padding pb-8 z-20">
          <div className="flex gap-4 justify-center">
            {actionStatus === 'accepted' ? (
              <div className="bg-secondary text-on-secondary border-2 border-primary shadow-[4px_4px_0_0_#000] px-6 py-4 rounded-full font-label-caps flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-6 w-6" />
                已打招呼
              </div>
            ) : actionStatus === 'rejected' ? (
              <div className="bg-surface-container text-on-surface border-2 border-outline px-6 py-4 rounded-full font-label-caps text-lg">
                寻找下一个...
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={!!actionStatus}
                  className="flex-1 max-w-[200px] bg-surface-container-lowest text-on-surface border-2 border-outline shadow-[4px_4px_0_0_#000] rounded-full py-4 font-label-caps hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] active:translate-y-0 active:shadow-[0_0_0_0_#000] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="h-5 w-5" />
                  不合适
                </button>
                <button
                  onClick={() => handleAction('accept')}
                  disabled={!!actionStatus}
                  className="flex-1 max-w-[200px] bg-primary text-on-primary border-2 border-primary shadow-[4px_4px_0_0_#000] rounded-full py-4 font-label-caps hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] active:translate-y-0 active:shadow-[0_0_0_0_#000] transition-all flex items-center justify-center gap-2"
                >
                  <Handshake className="h-5 w-5" />
                  打个招呼
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
