import { ArrowRight, Check, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTwinBuddyProfile } from '../../api/client';
import { useTwinbuddyOnboarding } from '../../hooks/useTwinbuddyOnboarding';
import {
  MBTI_LABELS,
  MBTI_TYPES,
  TRAVEL_BUDGET_OPTIONS,
  TRAVEL_RANGE_OPTIONS,
  INTEREST_TAGS,
} from '../../types';

const stepTitles = [
  '你的 MBTI 是？',
  '你通常去哪里旅行？',
  '你的旅行偏好是什么？',
  '你的旅行预算区间？',
  '一句话介绍你和谁旅行最舒服',
  '你的出发城市？',
];

function StepHeader({ current }: { current: number }) {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full border-2 border-outline bg-tertiary-container text-on-tertiary-container px-3 py-1 text-xs">
        3 分钟完成数字分身初始化
      </div>

      <div className="space-y-2">
        <p className="text-sm text-on-surface-variant">Step {current + 1} / 6</p>
        <h2 className="text-3xl font-semibold text-on-background">{stepTitles[current]}</h2>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {stepTitles.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition ${
              index <= current ? 'bg-primary' : 'bg-surface-variant'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function OnboardingV2Page() {
  const navigate = useNavigate();
  const { data, setMbti, toggleTravelRange, toggleInterest, setBudget, setSelfDescription, setCity, complete } =
    useTwinbuddyOnboarding();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAdvance = useMemo(() => {
    if (step === 0) return Boolean(data.mbti);
    if (step === 1) return data.travelRange.length > 0;
    if (step === 2) return data.interests.length >= 2;
    if (step === 3) return Boolean(data.budget);
    if (step === 4) return data.selfDescription.trim().length >= 4;
    if (step === 5) return data.city.trim().length >= 2;
    return false;
  }, [data, step]);

  const handleNext = async () => {
    if (!canAdvance) return;
    if (step === 5) {
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background blobs */}
      <div className="fixed -top-20 -left-20 w-80 h-80 bg-tertiary-fixed blur-[80px] opacity-30 -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed top-1/4 right-[-8rem] w-80 h-80 bg-secondary-fixed blur-[80px] opacity-30 -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed bottom-10 right-[-5rem] w-52 h-52 bg-primary-fixed-dim blur-[60px] opacity-40 -z-10 rounded-full"></div>

      <div className="relative mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <StepHeader current={step} />

        <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline space-y-5 p-5 sm:p-6">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MBTI_TYPES.map((mbti) => {
                const selected = data.mbti === mbti;
                return (
                  <button
                    key={mbti}
                    className={`rounded-DEFAULT border-2 p-4 text-left transition ${
                      selected
                        ? 'border-primary bg-surface-container shadow-[4px_4px_0_0_#000]'
                        : 'border-outline-variant bg-surface-container hover:border-primary'
                    }`}
                    onClick={() => setMbti(mbti)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-on-surface">{mbti}</span>
                      {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">{MBTI_LABELS[mbti]}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">多选，后续会影响匹配范围和动态推荐。</p>
              <div className="flex flex-wrap gap-3">
                {TRAVEL_RANGE_OPTIONS.map((option) => {
                  const selected = data.travelRange.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      className={`rounded-full border-2 px-4 py-2 text-sm transition ${
                        selected
                          ? 'border-primary bg-secondary text-on-secondary'
                          : 'border-outline bg-surface-container text-on-surface hover:border-primary'
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
              <p className="text-sm text-on-surface-variant">选 2~4 个你的旅行偏好，用于精准匹配搭子风格。</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map((tag) => {
                  const selected = data.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      className={`rounded-full border-2 px-3 py-1.5 text-sm transition ${
                        selected
                          ? 'border-primary bg-secondary-fixed text-on-secondary-fixed'
                          : 'border-outline bg-surface-container text-on-surface hover:border-primary'
                      }`}
                      onClick={() => toggleInterest(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-on-surface-variant">
                已选 {data.interests.length} / 建议至少 2 个
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {TRAVEL_BUDGET_OPTIONS.map((option) => {
                const selected = data.budget === option.value;
                return (
                  <button
                    key={option.value}
                    className={`w-full rounded-DEFAULT border-2 p-4 text-left transition ${
                      selected
                        ? 'border-primary bg-surface-container shadow-[4px_4px_0_0_#000]'
                        : 'border-outline hover:border-primary'
                    }`}
                    onClick={() => setBudget(option.value)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-on-surface">{option.label}</span>
                      {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">{option.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <label className="block space-y-3">
              <span className="text-sm text-on-surface-variant">
                限 30 字左右，后续会写进你的数字分身提示词。
              </span>
              <textarea
                className="w-full border-2 border-outline rounded-DEFAULT bg-surface-container-lowest text-on-background px-4 py-3 placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-32 resize-none font-body-md"
                maxLength={40}
                onChange={(event) => setSelfDescription(event.target.value)}
                placeholder="比如：能一起做攻略，也能给彼此留白。"
                value={data.selfDescription}
              />
              <div className="text-right text-xs text-on-surface-variant">
                {data.selfDescription.length} / 40
              </div>
            </label>
          )}

          {step === 5 && (
            <label className="block space-y-3">
              <span className="text-sm text-on-surface-variant">
                出发城市会用于匹配同城搭子和内容排序。
              </span>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="w-full border-2 border-outline rounded-DEFAULT bg-surface-container-lowest text-on-background pl-11 pr-4 py-3 placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="例如：深圳"
                  value={data.city}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['深圳', '广州', '成都', '重庆', '上海', '北京', '杭州', '武汉'].map((c) => (
                  <button
                    key={c}
                    className={`rounded-full border-2 px-3 py-1 text-sm transition ${
                      data.city === c
                        ? 'border-primary bg-secondary text-on-secondary'
                        : 'border-outline bg-surface-container text-on-surface hover:border-primary'
                    }`}
                    onClick={() => setCity(c)}
                    type="button"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>
          )}
        </section>

        {/* Bottom nav */}
        <div className="flex items-center justify-between gap-3">
          <button
            className="text-sm text-on-surface-variant hover:text-primary transition-colors"
            onClick={() => (step === 0 ? navigate('/') : setStep((prev) => prev - 1))}
            type="button"
          >
            {step === 0 ? '稍后再说' : '返回上一步'}
          </button>

          <button
            className="bg-primary text-on-primary font-body-md px-6 py-3 rounded-full border-2 border-primary shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            disabled={!canAdvance || isSubmitting}
            onClick={handleNext}
            type="button"
          >
            {step === 5 ? (isSubmitting ? '创建画像中...' : '进入 TwinBuddy') : '继续'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
