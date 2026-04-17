import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Mic } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { MBTI_TYPES, MBTI_LABELS, INTEREST_TAGS } from '../types';

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
                transition-all duration-200 border relative overflow-hidden
                ${selected
                  ? 'border-neon-primary bg-neon-primary/15 shadow-glow-primary neon-card-active'
                  : 'border-white/5 bg-white/4 hover:border-neon-primary/30 hover:bg-white/6 hover:shadow-[0_0_12px_rgba(255,179,182,0.1)]'
                }
              `}
            >
              {selected && (
                <div className="absolute inset-0 bg-gradient-to-br from-neon-primary/10 to-transparent pointer-events-none rounded-2xl" />
              )}
              <span className={`text-xs font-bold tracking-widest relative z-[1] ${selected ? 'text-neon-primary' : 'text-neon-text'}`}>
                {mbti}
              </span>
              <span className={`text-[10px] leading-tight text-center relative z-[1] ${selected ? 'text-neon-primary/80' : 'text-neon-text-secondary'}`}>
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

function InterestTags({ values, onToggle }: { values: string[]; onToggle: (i: string) => void }) {
  return (
    <div className="space-y-4 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">你向往哪种旅行？</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">
          选择你感兴趣的标签（可多选）
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map((tag) => {
          const selected = values.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`tag flex-shrink-0 ${selected ? 'selected' : ''}`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type VoiceState = 'idle' | 'recording' | 'transcribed';

function VoiceOrText({ text, onChange }: { text: string; onChange: (t: string) => void }) {
  const [voiceState, setVoiceState] = useState<VoiceState>(text ? 'transcribed' : 'idle');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'zh-CN';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onChange(transcript);
        setVoiceState('transcribed');
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        setVoiceState('idle');
      };

      rec.onend = () => {
        if (voiceState === 'recording') setVoiceState('idle');
      };

      setRecognition(rec);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    if (!recognition) {
      // Fallback for browsers without Speech API
      setVoiceState('recording');
      setTimeout(() => {
        onChange('');
        setVoiceState('idle');
      }, 100);
      return;
    }
    setVoiceState('recording');
    try {
      recognition.start();
    } catch {
      setVoiceState('idle');
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">用一句话描述<br />你理想的搭子</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">说点什么，或者直接跳过</p>
      </div>

      {/* Primary: text input */}
      <textarea
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/6 px-4 py-3
                   text-neon-text text-sm resize-none placeholder:text-neon-text-disabled
                   focus:border-neon-primary focus:outline-none focus:shadow-glow-primary transition-all"
        rows={3}
        placeholder="描述你理想的搭子，比如：喜欢慢节奏、会拍照、能吃辣..."
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />

      {!text && voiceState === 'idle' && (
        <p className="text-xs text-neon-text-disabled text-center -mt-2">说点什么，或者直接跳过</p>
      )}

      {/* Voice recording button */}
      <button
        onClick={handleStart}
        disabled={voiceState === 'transcribed'}
        className={`}
          relative flex items-center justify-center rounded-full
          transition-all duration-200
          ${voiceState === 'recording'
            ? 'w-28 h-28 bg-red-500/20 border-2 border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.5)] animate-neon-pulse'
            : 'w-24 h-24 bg-neon-primary/10 border-2 border-neon-primary/40 hover:border-neon-primary hover:shadow-glow-primary'
          }
        `}
      >
        <Mic className={`w-10 h-10 ${voiceState === 'recording' ? 'text-red-400' : 'text-neon-primary'}`} />
        {voiceState === 'recording' && (
          <span className="absolute -bottom-6 text-xs text-red-400 animate-pulse">录音中...</span>
        )}
      </button>

      {voiceState === 'recording' && (
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

      {voiceState === 'transcribed' && text && (
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

// ── Step 4: Destination Input ─────────────────────────

function DestinationInput({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-4 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">你想去哪？</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">输入你的目的地（可选）</p>
      </div>
      <div>
        <input
          type="text"
          className="w-full max-w-sm mx-auto block rounded-2xl border border-white/10 bg-white/6 px-4 py-3
                     text-neon-text text-base placeholder:text-neon-text-disabled
                     focus:border-neon-primary focus:outline-none focus:shadow-glow-primary transition-all"
          placeholder="例如：成都、重庆、大理..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="mt-2 text-xs text-neon-text-disabled text-center">
          直接输入目的地名称，不限于预设列表
        </p>
      </div>
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
    } else if (step === TOTAL_STEPS - 1) {
      // On step 3, complete onboarding to advance to step 4
      completeOnboarding();
    }
  }, [step, completeOnboarding, navigate]);

  const handleBack = useCallback(() => {
    if (step === 1) navigate('/');
  }, [step, navigate]);

  // canProceed checks the requirements for the step we are CURRENTLY on.
  // step comes from currentStep() which reflects the visible step.
  const canProceed = () => {
    switch (step) {
      case 1: return !!data.mbti;
      case 2: return data.interests.length > 0;
      case 3: return true; // voice/text optional
      case 4: return true; // city optional
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
          <VoiceOrText text={data.voiceText} onChange={setVoiceText} />
        )}
        {step === 4 && (
          <DestinationInput value={data.city} onChange={setCity} />
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
                {step === 4 && (
          <button onClick={completeOnboarding} className="mt-3 w-full py-3 text-center text-sm text-neon-text-secondary hover:text-neon-text transition-colors">随便看看</button>
        )}
        <p className="mt-3 text-center text-xs text-neon-text-disabled">
          数据仅本地存储，不会上传至服务器
        </p>
      </div>
    </div>
  );
}
