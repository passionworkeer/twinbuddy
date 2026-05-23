import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { answerBlindGame, fetchBlindGameReport, startBlindGame } from '../../api/client';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { V2_STORAGE_KEYS } from '../../types';
import type {
  BlindGameReport,
  BlindGameRound,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { EMPTY_ONBOARDING_PROFILE } from '../../utils/twinbuddyProfile';

export default function BlindGamePage() {
  const navigate = useNavigate();
  const { negotiationId } = useParams();
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, EMPTY_ONBOARDING_PROFILE);
  const [gameId, setGameId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<BlindGameRound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, 'A' | 'B'>>({});
  const [report, setReport] = useState<BlindGameReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadGame() {
      if (!profile.userId) {
        if (mounted) {
          setErrorText('请先完成 onboarding 创建画像后再进入盲选。');
          setIsLoading(false);
        }
        return;
      }
      if (!negotiationId) {
        if (mounted) {
          setErrorText('请从搭子详情卡进入盲选。');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorText('');
      try {
        const result = await startBlindGame({
          userId: profile.userId,
          negotiationId,
        });
        if (!mounted) return;
        setGameId(result.game_id);
        setRounds(result.rounds);
        setCurrentIndex(0);
        setSelectedChoices({});
        setReport(null);
      } catch (error) {
        if (!mounted) return;
        if (error instanceof Error) {
          setErrorText(error.message || '盲选启动失败，请稍后重试。');
        } else {
          setErrorText('盲选启动失败，请稍后重试。');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGame();

    return () => {
      mounted = false;
    };
  }, [negotiationId, profile.userId]);

  const currentRound = rounds[currentIndex] ?? null;
  const progressLabel = rounds.length > 0 ? `${currentIndex + 1} / ${rounds.length}` : '0 / 0';

  const handleSelect = async (choice: 'A' | 'B') => {
    if (!gameId || !currentRound || isSubmitting) return;

    setIsSubmitting(true);
    setErrorText('');
    try {
      const result = await answerBlindGame({
        gameId,
        roundId: currentRound.id,
        choice,
      });
      const nextChoices = {
        ...selectedChoices,
        [currentRound.id]: choice,
      };
      setSelectedChoices(nextChoices);

      if (result.done) {
        const nextReport = await fetchBlindGameReport(gameId);
        setReport(nextReport);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorText(error.message || '提交选择失败，请稍后重试。');
      } else {
        setErrorText('提交选择失败，请稍后重试。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (errorText && !currentRound && !report) {
    return (
      <div className="bg-background fixed inset-0 z-50 flex flex-col justify-center items-center px-container-padding text-center gap-4">
        <div className="rounded-DEFAULT border-2 border-outline bg-error text-on-error px-4 py-3 text-sm max-w-md">
          {errorText}
        </div>
        <button
          type="button"
          onClick={() => navigate('/buddies')}
          className="px-5 py-3 rounded-full border-2 border-outline bg-surface-container text-on-surface"
        >
          返回搭子列表
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col overflow-hidden">
      <div className="fixed top-10 right-10 w-64 h-64 bg-primary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-secondary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>

      <header className="px-container-padding pt-8 pb-4 flex flex-col gap-6 z-10 relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full border-2 border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 bg-surface-container rounded-full pr-5 pl-3 py-1.5 border border-outline-variant">
            <div className="flex flex-col text-left">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Blind Game</span>
              <span className="font-body-md text-sm font-semibold text-on-surface leading-none mt-1">第 {progressLabel} 轮</span>
            </div>
          </div>

          <div className="w-12 h-12"></div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="font-label-caps text-label-caps text-primary uppercase">
              当前进度 {progressLabel}
            </span>
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">默契验证</span>
          </div>
          <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden relative border border-outline-variant">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${rounds.length > 0 ? ((report ? rounds.length : currentIndex) / rounds.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col px-container-padding pb-8 z-10 overflow-y-auto">
        {errorText ? (
          <div className="rounded-DEFAULT border-2 border-outline bg-error text-on-error px-4 py-3 text-sm mb-4">
            {errorText}
          </div>
        ) : null}

        {report ? (
          <div className="flex flex-col gap-6 flex-grow pb-8">
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 bg-secondary text-on-secondary border-2 border-outline px-5 py-3 rounded-full text-lg font-label-caps">
                <CheckCircle2 className="h-5 w-5" />
                默契报告已生成
              </div>
              <h2 className="font-question-serif text-[32px] text-on-surface mt-6 leading-snug">
                匹配得分 {report.match_score}%
              </h2>
              <p className="font-body-md text-on-surface-variant mt-3 max-w-xl mx-auto">
                {report.analysis}
              </p>
            </div>

            <section className="bg-surface-container-lowest border-2 border-outline rounded-DEFAULT p-container-padding shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="font-h2 text-h2 text-on-background">每一轮的选择对照</h3>
              <div className="mt-4 flex flex-col gap-3">
                {report.per_round_result.map((item) => (
                  <div key={item.round_id} className="rounded-DEFAULT border-2 border-outline bg-surface-container p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-label-caps text-label-caps uppercase text-secondary">{item.dimension}</span>
                      <span className={`text-xs font-label-caps px-3 py-1 rounded-full border-2 ${item.matched ? 'bg-secondary text-on-secondary border-outline' : 'bg-surface-container-lowest text-on-surface border-outline'}`}>
                        {item.matched ? '命中' : '分歧'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                      <div>
                        <p className="text-on-surface-variant">你的选择</p>
                        <p className="mt-1 text-on-surface">{item.user_label}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant">对方选择</p>
                        <p className="mt-1 text-on-surface">{item.buddy_label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : currentRound ? (
          <div className="flex flex-col items-center gap-6 flex-grow pb-8">
            <div className="w-full max-w-2xl bg-surface-container-lowest border-2 border-outline rounded-DEFAULT p-container-padding shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-8">
              <p className="font-label-caps text-label-caps uppercase text-secondary">第 {progressLabel} 轮</p>
              <h2 className="font-question-serif text-[32px] text-on-surface mt-3 leading-snug">
                {currentRound.dimension}
              </h2>
              <p className="font-body-md text-on-surface-variant mt-3">
                请选择更贴近你真实旅行风格的选项，数字分身会据此完成默契验证。
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void handleSelect('A')}
                  disabled={isSubmitting}
                  className="rounded-DEFAULT border-2 border-outline bg-surface-container px-5 py-5 text-left hover:border-primary transition-colors disabled:opacity-60"
                >
                  <span className="font-label-caps text-label-caps uppercase text-secondary">A</span>
                  <p className="mt-3 text-on-surface text-lg">{currentRound.option_a}</p>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSelect('B')}
                  disabled={isSubmitting}
                  className="rounded-DEFAULT border-2 border-outline bg-surface-container px-5 py-5 text-left hover:border-primary transition-colors disabled:opacity-60"
                >
                  <span className="font-label-caps text-label-caps uppercase text-secondary">B</span>
                  <p className="mt-3 text-on-surface text-lg">{currentRound.option_b}</p>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
