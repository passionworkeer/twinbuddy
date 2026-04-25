import { ArrowRight, Check, MapPin, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTwinBuddyProfile } from '../../api/client';
import { useTwinbuddyOnboarding } from '../../hooks/useTwinbuddyOnboarding';
import {
  MBTI_LABELS,
  MBTI_TYPES,
  TRAVEL_BUDGET_OPTIONS,
  TRAVEL_RANGE_OPTIONS,
} from '../../types';

const stepTitles = [
  '你的 MBTI 是？',
  '你通常去哪里旅行？',
  '你的旅行预算区间？',
  '一句话介绍你和谁旅行最舒服',
  '你的出发城市？',
];

function StepHeader({ current }: { current: number }) {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,179,182,0.28)] bg-[rgba(255,179,182,0.08)] px-3 py-1 text-xs text-[var(--color-primary-light)]">
        <Sparkles className="h-3.5 w-3.5" />
        3 分钟完成数字分身初始化
      </div>

      <div className="space-y-2">
        <p className="text-sm text-[var(--color-text-secondary)]">Step {current + 1} / 5</p>
        <h2 className="text-3xl font-semibold text-white">{stepTitles[current]}</h2>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {stepTitles.map((title, index) => (
          <div
            key={title}
            className={`h-2 rounded-full transition ${
              index <= current ? 'bg-[var(--color-primary)]' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function OnboardingV2Page() {
  const navigate = useNavigate();
  const { data, setMbti, toggleTravelRange, setBudget, setSelfDescription, setCity, complete } =
    useTwinbuddyOnboarding();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAdvance = useMemo(() => {
    if (step === 0) return Boolean(data.mbti);
    if (step === 1) return data.travelRange.length > 0;
    if (step === 2) return Boolean(data.budget);
    if (step === 3) return data.selfDescription.trim().length >= 4;
    if (step === 4) return data.city.trim().length >= 2;
    return false;
  }, [data, step]);

  const handleNext = async () => {
    if (!canAdvance) return;
    if (step === 4) {
      setIsSubmitting(true);
      try {
        const profile = await createTwinBuddyProfile({
          userId: data.userId,
          mbti: data.mbti,
          travelRange: data.travelRange,
          budget: data.budget,
          selfDescription: data.selfDescription,
          city: data.city,
        });
        complete({ userId: profile.user_id, styleVector: profile.style_vector });
      } catch {
        complete();
      } finally {
        setIsSubmitting(false);
      }
      navigate('/home', { replace: true });
      return;
    }
    setStep((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg-base)] px-4 py-6 text-[var(--color-text-primary)] sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[-8rem] h-80 bg-[radial-gradient(circle_at_top,rgba(255,179,182,0.24),transparent_65%)]" />
        <div className="absolute bottom-10 right-[-5rem] h-52 w-52 rounded-full bg-[rgba(175,255,251,0.1)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-6">
        <StepHeader current={step} />

        <section className="glass-panel-strong space-y-5 p-5 sm:p-6">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MBTI_TYPES.map((mbti) => {
                const selected = data.mbti === mbti;
                return (
                  <button
                    key={mbti}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-[var(--color-primary)] bg-[rgba(255,179,182,0.12)] shadow-[0_0_20px_rgba(255,179,182,0.12)]'
                        : 'border-white/8 bg-white/4 hover:border-white/20 hover:bg-white/6'
                    }`}
                    onClick={() => setMbti(mbti)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-white">{mbti}</span>
                      {selected ? <Check className="h-4 w-4 text-[var(--color-primary)]" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{MBTI_LABELS[mbti]}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text-secondary)]">多选，后续会影响匹配范围和动态推荐。</p>
              <div className="flex flex-wrap gap-3">
                {TRAVEL_RANGE_OPTIONS.map((option) => {
                  const selected = data.travelRange.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selected
                          ? 'border-[var(--color-secondary)] bg-[rgba(175,255,251,0.12)] text-[var(--color-secondary)]'
                          : 'border-white/10 bg-white/4 text-white hover:border-white/20'
                      }`}
                      onClick={() => toggleTravelRange(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {TRAVEL_BUDGET_OPTIONS.map((option) => {
                const selected = data.budget === option.value;
                return (
                  <button
                    key={option.value}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-[var(--color-tertiary)] bg-[rgba(238,194,36,0.12)]'
                        : 'border-white/8 bg-white/4 hover:border-white/20'
                    }`}
                    onClick={() => setBudget(option.value)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-white">{option.label}</span>
                      {selected ? <Check className="h-4 w-4 text-[var(--color-tertiary)]" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{option.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <label className="block space-y-3">
              <span className="text-sm text-[var(--color-text-secondary)]">
                限 30 字左右，后续会写进你的数字分身提示词。
              </span>
              <textarea
                className="neon-input min-h-32 resize-none"
                maxLength={40}
                onChange={(event) => setSelfDescription(event.target.value)}
                placeholder="比如：能一起做攻略，也能给彼此留白。"
                value={data.selfDescription}
              />
              <div className="text-right text-xs text-[var(--color-text-secondary)]">
                {data.selfDescription.length} / 40
              </div>
            </label>
          )}

          {step === 4 && (
            <label className="block space-y-3">
              <span className="text-sm text-[var(--color-text-secondary)]">
                出发城市会用于匹配同城搭子和内容排序。
              </span>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  className="neon-input pl-11"
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="例如：深圳"
                  value={data.city}
                />
              </div>
            </label>
          )}
        </section>

        <div className="flex items-center justify-between gap-3">
          <button
            className="btn-ghost px-0 text-sm"
            onClick={() => (step === 0 ? navigate('/') : setStep((prev) => prev - 1))}
            type="button"
          >
            {step === 0 ? '稍后再说' : '返回上一步'}
          </button>

          <button
            className="btn-primary min-w-36"
            disabled={!canAdvance || isSubmitting}
            onClick={handleNext}
            type="button"
          >
            {step === 4 ? (isSubmitting ? '创建画像中...' : '进入 TwinBuddy') : '继续'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
