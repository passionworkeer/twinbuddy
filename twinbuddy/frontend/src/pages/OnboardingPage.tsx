import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Mic } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { MBTI_TYPES, MBTI_LABELS, INTEREST_TAGS, CITIES } from '../types';

// ── Progress Dots ─────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const state = idx < current ? 'completed' : idx === current ? 'active' : 'pending';
        return (
          <div
            key={i}
            className={`step-dot ${state === 'completed' ? 'completed' : ''} ${state === 'active' ? 'active' : ''}`}
          />
        );
      })}
    </div>
  );
}

// ── Step 1: MBTI Grid ─────────────────────────────────

function MBTIGrid({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  return (
    <div className="space-y-4 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">你是哪种旅行者？</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">选择你的 MBTI 类型</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MBTI_TYPES.map((mbti) => {
          const selected = value === mbti;
          return (
            <button
              key={mbti}
              onClick={() => onChange(mbti)}
              className={`
                flex flex-col items-center gap-0.5 rounded-2xl p-3
                transition-all duration-200 border
                ${selected
                  ? 'border-neon-primary bg-neon-primary/10 shadow-glow-primary'
                  : 'border-white/5 bg-white/4 hover:border-neon-primary/30 hover:bg-white/6'
                }
              `}
            >
              <span className={`text-xs font-bold tracking-widest ${selected ? 'text-neon-primary' : 'text-neon-text'}`}>
                {mbti}
              </span>
              <span className={`text-[10px] leading-tight text-center ${selected ? 'text-neon-primary/80' : 'text-neon-text-secondary'}`}>
                {MBTI_LABELS[mbti]}
              </span>
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-center text-sm text-neon-text-secondary animate-fade-in">
          <span className="mbti-badge">{value}</span>
          <span className="ml-2">{MBTI_LABELS[value]}</span>
        </p>
      )}
    </div>
  );
}

// ── Step 2: Interest Tags ─────────────────────────────

const MAX_INTERESTS = 8;

function InterestTags({ values, onToggle }: { values: string[]; onToggle: (i: string) => void }) {
  return (
    <div className="space-y-4 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">你向往哪种旅行？</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">
          选择 {values.length}/{MAX_INTERESTS} 个标签
        </p>
      </div>
      <div className="tags-scroll gap-2 pb-1">
        {INTEREST_TAGS.map((tag) => {
          const selected = values.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => selected || values.length < MAX_INTERESTS ? onToggle(tag) : undefined}
              disabled={!selected && values.length >= MAX_INTERESTS}
              className={`tag flex-shrink-0 ${selected ? 'selected' : ''}`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {values.map((v) => (
            <span key={v} className="tag selected text-xs">{v}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Voice Recorder ───────────────────────────

type VoiceState = 'idle' | 'recording' | 'transcribed';

function VoiceRecorder({ text, onTranscribe }: { text: string; onTranscribe: (t: string) => void }) {
  const [state, setState] = useState<VoiceState>(text ? 'transcribed' : 'idle');

  const handleStart = () => {
    setState('recording');
    // Simulated transcription after 2.5s
    setTimeout(() => {
      const simulated = '我想去一个节奏慢的地方，最好能拍照发朋友圈，吃当地美食，不用太累，轻松玩就好';
      onTranscribe(simulated);
      setState('transcribed');
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center gap-6 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">用一句话描述<br />你理想的搭子</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">按住说话，AI 会读懂你的旅行风格</p>
      </div>

      <button
        onClick={handleStart}
        disabled={state === 'transcribed'}
        className={`
          relative flex items-center justify-center rounded-full
          transition-all duration-200
          ${state === 'recording'
            ? 'w-28 h-28 bg-red-500/20 border-2 border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.5)] animate-neon-pulse'
            : 'w-24 h-24 bg-neon-primary/10 border-2 border-neon-primary/40 hover:border-neon-primary hover:shadow-glow-primary'
          }
        `}
      >
        <Mic className={`w-10 h-10 ${state === 'recording' ? 'text-red-400' : 'text-neon-primary'}`} />
        {state === 'recording' && (
          <span className="absolute -bottom-6 text-xs text-red-400 animate-pulse">录音中...</span>
        )}
      </button>

      {state === 'recording' && (
        <div className="flex items-end gap-1 h-8">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-neon-primary/60"
              style={{
                height: `${8 + Math.abs(Math.sin(Date.now() / 200 + i * 0.8)) * 24}px`,
                animation: `slideUp 600ms ease-in-out ${i * 80}ms infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {state === 'transcribed' && (
        <div className="w-full max-w-sm animate-fade-in">
          <div className="glass-panel p-4">
            <p className="text-sm text-neon-text leading-relaxed">"{text}"</p>
            <p className="mt-2 text-xs text-neon-text-secondary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-neon-tertiary" />
              AI 已识别你的旅行偏好
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: City Selection ────────────────────────────

function CityCards({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-4 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">你想去哪？</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">选择一个目的地</p>
      </div>
      <div className="tags-scroll gap-3 pb-1">
        {CITIES.map((city) => {
          const selected = value === city.id;
          return (
            <button
              key={city.id}
              onClick={() => onChange(city.id)}
              className={`
                city-card group
                bg-gradient-to-br ${city.gradient}
                ${selected ? 'selected' : ''}
              `}
            >
              <div className="city-card-overlay" />
              <span className="city-card-name">{city.name}</span>
              <span className="absolute right-2 top-1.5 text-base">{city.emoji}</span>
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-center text-sm text-neon-text-secondary animate-fade-in">
          目标：{CITIES.find((c) => c.id === value)?.emoji}{' '}
          {CITIES.find((c) => c.id === value)?.name}
        </p>
      )}
    </div>
  );
}

// ── Main OnboardingPage ───────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const {
    data,
    updateMbti,
    toggleInterest,
    setVoiceText,
    setCity,
    completeOnboarding,
    currentStep,
  } = useOnboarding();

  const step = currentStep();
  const TOTAL_STEPS = 4;

  const handleNext = useCallback(() => {
    if (step === TOTAL_STEPS) {
      completeOnboarding();
      navigate('/feed');
    }
  }, [step, completeOnboarding, navigate]);

  const handleBack = useCallback(() => {
    if (step === 1) navigate('/');
  }, [step, navigate]);

  const canProceed = () => {
    switch (step) {
      case 1: return !!data.mbti;
      case 2: return data.interests.length > 0;
      case 3: return true; // voice is optional
      case 4: return !!data.city;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-neon-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        {step > 1 ? (
          <button onClick={handleBack} className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div />
        )}
        <ProgressDots total={TOTAL_STEPS} current={step} />
        <div className="w-8" />
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4 max-w-lg mx-auto w-full">
        {step === 1 && (
          <MBTIGrid value={data.mbti} onChange={updateMbti} />
        )}
        {step === 2 && (
          <InterestTags values={data.interests} onToggle={toggleInterest} />
        )}
        {step === 3 && (
          <VoiceRecorder text={data.voiceText} onTranscribe={setVoiceText} />
        )}
        {step === 4 && (
          <CityCards value={data.city} onChange={setCity} />
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 pt-4 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 btn-primary py-4 ${!canProceed() ? 'opacity-40' : ''}`}
          >
            {step < TOTAL_STEPS ? (
              <>
                继续 <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                开始刷搭子
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-neon-text-disabled">
          数据仅本地存储，不会上传至服务器
        </p>
      </div>
    </div>
  );
}
