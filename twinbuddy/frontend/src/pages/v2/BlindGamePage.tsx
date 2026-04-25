import { ArrowLeft, CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { answerBlindGame, fetchBlindGameReport, reportTwinBuddyTrip, startBlindGame } from '../../api/client';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { BlindGameReport, BlindGameRound, TwinBuddyV2OnboardingData } from '../../types';
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

export default function BlindGamePage() {
  const { buddyId, negotiationId } = useParams<{ buddyId: string; negotiationId: string }>();
  const navigate = useNavigate();
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [gameId, setGameId] = useState('');
  const [rounds, setRounds] = useState<BlindGameRound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [report, setReport] = useState<BlindGameReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [tripDestination, setTripDestination] = useState(profile.city || '深圳周边');
  const [departDate, setDepartDate] = useState('2026-05-01');
  const [returnDate, setReturnDate] = useState('2026-05-03');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [tripStatusText, setTripStatusText] = useState('');

  useEffect(() => {
    if (!profile.userId || !negotiationId) return;
    startBlindGame({ userId: profile.userId, negotiationId })
      .then((data) => {
        setGameId(data.game_id);
        setRounds(data.rounds);
      })
      .finally(() => setIsLoading(false));
  }, [negotiationId, profile.userId]);

  const currentRound = rounds[currentIndex];
  const progress = useMemo(() => ((currentIndex + (report ? rounds.length : 0)) / Math.max(rounds.length, 1)) * 100, [currentIndex, report, rounds.length]);

  const handleChoice = async (choice: 'A' | 'B') => {
    if (!gameId || !currentRound || isAnswering) return;
    setIsAnswering(true);
    const result = await answerBlindGame({ gameId, roundId: currentRound.id, choice });
    if (result.done) {
      const nextReport = await fetchBlindGameReport(gameId);
      setReport(nextReport);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
    setIsAnswering(false);
  };

  if (isLoading) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[var(--color-bg-base)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,20,19,0.7),rgba(7,18,15,0.95))]" />
        <LoaderCircle className="relative z-10 h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (report) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-bg-base)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(17,24,24,0.25),rgba(6,17,15,0.94)_42%,rgba(7,22,18,1))]" />
        <div className="absolute left-[-4rem] top-28 h-56 w-56 rounded-full bg-[rgba(111,160,141,0.16)] blur-3xl" />
        <div className="absolute bottom-24 right-[-3rem] h-72 w-72 rounded-full bg-[rgba(255,120,86,0.12)] blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
          <button className="btn-ghost px-0 text-white/80" onClick={() => navigate('/buddies')} type="button">
            <ArrowLeft className="h-4 w-4" />
            返回搭子动态
          </button>

          <section className="twin-card-layer3 space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-[rgba(175,255,251,0.14)] p-3 text-[var(--color-secondary)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">盲选已完成</p>
                <h2 className="text-3xl font-semibold text-white">你和 {buddyId} 的匹配度是 {report.match_score}%</h2>
              </div>
            </div>

            <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">阶段</span>
                  <span className="mt-1 text-sm font-semibold text-white">Layer 3 揭晓</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">对象</span>
                  <span className="mt-1 text-sm font-semibold text-white">{buddyId}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">轮次</span>
                  <span className="mt-1 text-sm font-semibold text-white">{report.per_round_result.length} 轮</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70">结论</span>
                  <span className="mt-1 text-sm font-semibold text-white">{report.match_score}%</span>
                </div>
              </div>
              <div className="my-4 h-px w-full bg-white/15" />
              <p className="text-sm leading-7 text-white/80">{report.analysis}</p>
            </section>

            <div className="grid gap-3">
              {report.per_round_result.map((item, index) => (
                <div key={item.round_id} className="glass-card rounded-[18px] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)]">Round {index + 1}</p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{item.dimension}</h3>
                    </div>
                    <span className={item.matched ? 'tag selected' : 'red-flag-badge'}>
                      {item.matched ? '一致' : '差异'}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-xs text-[var(--color-text-secondary)]">你的选择</p>
                      <p className="mt-2 text-sm text-white">{item.user_label}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
                      <p className="text-xs text-[var(--color-text-secondary)]">TA 的选择</p>
                      <p className="mt-2 text-sm text-white">{item.buddy_label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="btn-secondary w-full" onClick={() => setShowTripForm((prev) => !prev)} type="button">
                正式认识 TA
              </button>
              <button className="btn-primary w-full" onClick={() => navigate('/buddies')} type="button">
                再看其他搭子
              </button>
            </div>

            {showTripForm ? (
              <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
                <h3 className="text-xl font-semibold text-white">行程安全上报</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  正式认识后，建议先上报一个基础行程和紧急联系人。上报完成后再进入私信继续沟通更稳。
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input className="neon-input" onChange={(event) => setTripDestination(event.target.value)} placeholder="目的地" value={tripDestination} />
                  <input className="neon-input" onChange={(event) => setDepartDate(event.target.value)} placeholder="出发日期" value={departDate} />
                  <input className="neon-input" onChange={(event) => setReturnDate(event.target.value)} placeholder="返程日期" value={returnDate} />
                  <input className="neon-input" onChange={(event) => setContactName(event.target.value)} placeholder="紧急联系人姓名" value={contactName} />
                  <input className="neon-input sm:col-span-2" onChange={(event) => setContactPhone(event.target.value)} placeholder="紧急联系人手机号" value={contactPhone} />
                </div>
                {tripStatusText ? <p className="mt-4 text-sm text-[var(--color-secondary)]">{tripStatusText}</p> : null}
                <button
                  className="btn-primary mt-4 w-full"
                  onClick={async () => {
                    if (!profile.userId) return;
                    const result = await reportTwinBuddyTrip({
                      userAId: profile.userId,
                      userBId: buddyId || 'buddy-001',
                      destination: tripDestination,
                      departDate,
                      returnDate,
                      emergencyContactName: contactName,
                      emergencyContactPhone: contactPhone,
                    });
                    setTripStatusText(`安全上报已完成，紧急联系人已脱敏存档（${result.emergency_contact_masked}）。`);
                    navigate('/messages');
                  }}
                  type="button"
                >
                  完成上报并进入私信
                </button>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-bg-base)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(17,24,24,0.2),rgba(6,17,15,0.9)_40%,rgba(7,22,18,1))]" />
      <div className="absolute -left-10 top-28 h-48 w-48 rounded-full bg-[rgba(111,160,141,0.14)] blur-3xl" />
      <div className="absolute bottom-20 right-[-2rem] h-64 w-64 rounded-full bg-[rgba(255,120,86,0.12)] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        <button className="btn-ghost px-0 text-white/80" onClick={() => navigate('/buddies')} type="button">
          <ArrowLeft className="h-4 w-4" />
          返回搭子动态
        </button>

        <section className="glass-card rounded-[20px] p-5 shadow-[0_16px_44px_rgba(0,0,0,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Layer 3 / 6 轮盲选</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">{currentRound?.dimension}</h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                双方同时作答，互不知晓，全部结束后再统一揭晓匹配分析。
              </p>
            </div>
            <div className="rounded-[18px] border border-white/15 bg-black/15 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">进度</p>
              <p className="mt-1 text-2xl font-bold text-white">{Math.min(currentIndex + 1, rounds.length)}/{Math.max(rounds.length, 1)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-[rgba(255,179,182,0.12)] p-3 text-[var(--color-primary)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">6 轮盲选游戏</p>
              <h3 className="text-xl font-semibold text-white">选择更贴近你真实旅行偏好的答案</h3>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>

          {currentRound ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                className="glass-card rounded-[20px] min-h-52 p-5 text-left shadow-[0_14px_36px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-white/25"
                disabled={isAnswering}
                onClick={() => handleChoice('A')}
                type="button"
              >
                <p className="text-sm text-[var(--color-text-secondary)]">选项 A</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{currentRound.option_a}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  选择更贴近你真实旅行偏好的答案，不需要迎合对方。
                </p>
              </button>

              <button
                className="glass-card rounded-[20px] min-h-52 p-5 text-left shadow-[0_14px_36px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-white/25"
                disabled={isAnswering}
                onClick={() => handleChoice('B')}
                type="button"
              >
                <p className="text-sm text-[var(--color-text-secondary)]">选项 B</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{currentRound.option_b}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  系统会在全部答完后统一揭晓双方答案和匹配分析。
                </p>
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
