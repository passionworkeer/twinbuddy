import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [noSupport, setNoSupport] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const seedTranscriptRef = useRef('');
  const finalTranscriptRef = useRef('');
  const liveTranscriptRef = useRef(text);

  useEffect(() => {
    if (!isRecordingRef.current) {
      finalTranscriptRef.current = text ? `${text.trim()} ` : '';
      liveTranscriptRef.current = text;
      setVoiceState(text ? 'transcribed' : 'idle');
    }
  }, [text]);

  // ── Init Speech Recognition ──────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'zh-CN';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interim = '';

        for (let i = 0; i < event.results.length; i += 1) {
          const chunk = event.results[i][0]?.transcript ?? '';
          if (!chunk) continue;
          if (event.results[i].isFinal) {
            finalText += chunk;
          } else {
            interim += chunk;
          }
        }

        const prefix = seedTranscriptRef.current ? `${seedTranscriptRef.current} ` : '';
        finalTranscriptRef.current = `${prefix}${finalText}`;

        const merged = `${finalTranscriptRef.current}${interim}`.trim();
        liveTranscriptRef.current = merged;
        onChange(merged);
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition error:', event.error);
        isRecordingRef.current = false;
        setVoiceState(liveTranscriptRef.current ? 'transcribed' : 'idle');
      };

      rec.onend = () => {
        if (isRecordingRef.current) {
          window.setTimeout(() => {
            if (!isRecordingRef.current || !recognitionRef.current) return;
            try {
              recognitionRef.current.start();
            } catch {
              isRecordingRef.current = false;
              setVoiceState(liveTranscriptRef.current ? 'transcribed' : 'idle');
            }
          }, 120);
          return;
        }
        setVoiceState(liveTranscriptRef.current ? 'transcribed' : 'idle');
      };

      recognitionRef.current = rec;

      return () => {
        isRecordingRef.current = false;
        try {
          rec.stop();
        } catch {
          // ignore
        }
      };
    } else {
      setNoSupport(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start/Stop handler ──────────────────────────────
  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      return;
    }

    seedTranscriptRef.current = text.trim();
    finalTranscriptRef.current = seedTranscriptRef.current ? `${seedTranscriptRef.current} ` : '';
    liveTranscriptRef.current = text.trim();
    isRecordingRef.current = true;
    setVoiceState('recording');

    try {
      recognition.start();
    } catch {
      isRecordingRef.current = false;
      setVoiceState(text ? 'transcribed' : 'idle');
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 stagger-children">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-text">用一句话描述<br />你理想的搭子</h2>
        <p className="mt-1 text-sm text-neon-text-secondary">说点什么，或者直接跳过</p>
      </div>

      {/* Primary: text input — text rendered in dark color so user can edit it */}
      <textarea
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/6 px-4 py-3
                   text-gray-800 text-sm resize-none placeholder:text-gray-400
                   focus:border-neon-primary focus:outline-none focus:shadow-glow-primary transition-all"
        rows={3}
        placeholder="描述你理想的搭子，比如：喜欢慢节奏、会拍照、能吃辣..."
        value={text}
        onChange={(e) => {
          onChange(e.target.value);
          if (!isRecordingRef.current) {
            finalTranscriptRef.current = e.target.value ? `${e.target.value.trim()} ` : '';
            liveTranscriptRef.current = e.target.value;
            setVoiceState(e.target.value ? 'transcribed' : 'idle');
          }
        }}
      />

      {!text && voiceState === 'idle' && (
        <p className="text-xs text-neon-text-disabled text-center -mt-2">说点什么，或者直接跳过</p>
      )}

      {/* Voice recording button */}
      <button
        onClick={handleMicClick}
        disabled={noSupport}
        className={`
          relative flex items-center justify-center rounded-full
          transition-all duration-200 select-none
          ${voiceState === 'recording'
            ? 'w-28 h-28 bg-red-500/20 border-2 border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.5)] animate-neon-pulse'
            : 'w-24 h-24 bg-neon-primary/10 border-2 border-neon-primary/40 hover:border-neon-primary hover:shadow-glow-primary'
          }
        `}
      >
        <Mic className={`w-10 h-10 ${voiceState === 'recording' ? 'text-red-400' : 'text-neon-primary'}`} />
        {voiceState === 'recording' && (
          <span className="absolute -bottom-6 text-xs text-red-400 animate-pulse">录音中，点击停止</span>
        )}
        {voiceState === 'idle' && !noSupport && (
          <span className="absolute -bottom-6 text-xs text-neon-text-secondary">点击说话</span>
        )}
        {noSupport && (
          <span className="absolute -bottom-6 text-xs text-neon-text-disabled">浏览器不支持</span>
        )}
      </button>

      {/* Audio waveform visualizer during recording */}
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

      {/* Transcribed result — user can still edit in textarea above */}
      {voiceState === 'transcribed' && text && (
        <div className="w-full max-w-sm animate-fade-in">
          <div className="glass-panel p-4">
            <p className="text-sm text-gray-800 leading-relaxed font-medium">"{text}"</p>
            <p className="mt-2 text-xs text-neon-text-secondary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-neon-tertiary" />
              已识别，你可以在上方修改文本
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
  } = useOnboarding();

  const TOTAL_STEPS = 4;

  // 显式步骤状态：由用户操作驱动，第 1/2 步会基于数据自动前进。
  const [step, setStep] = useState(1);

  // 标记是否正在回退，用于防止回退时触发自动前进
  const isNavigatingBack = useRef(false);

  // 选中 MBTI 后自动进入第 2 步（但回退时不触发）
  useEffect(() => {
    if (data.mbti && step < 2 && !isNavigatingBack.current) {
      setStep(2);
    }
  }, [data.mbti, step]);

  // 不再基于 interests.length 自动跳转，让用户可以多选后再手动继续

  // React 18 batching: completeOnboarding() updates state, then navigate() in
  // the same synchronous tick may not trigger re-render. Use useEffect to
  // ensure navigation fires after the state commit.
  useEffect(() => {
    if (data.completed) {
      navigate('/feed');
    }
  }, [data.completed, navigate]);

  const handleNext = useCallback(async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      try {
        await completeOnboarding();
      } catch (err) {
        console.error('[OnboardingPage] completeOnboarding error:', err);
        // Fallback: force navigation directly so user isn't stuck
        navigate('/feed');
      }
    }
  }, [step, completeOnboarding, navigate]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      isNavigatingBack.current = true;
      setStep((s) => s - 1);
      // 清除标记，让后续前进操作正常进行
      setTimeout(() => { isNavigatingBack.current = false; }, 100);
    } else {
      navigate('/');
    }
  }, [step, navigate]);

  // canProceed checks the requirements for the step we are CURRENTLY on.
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
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#11131e' }}>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
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
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-4 max-w-lg mx-auto w-full">
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
      <div className="relative z-10 px-6 pb-8 pt-4 max-w-lg mx-auto w-full">
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full btn-primary py-4 ${!canProceed() ? 'opacity-40' : ''}`}
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
        <p className="mt-3 text-center text-xs" style={{ color: '#5a5a70' }}>
          数据仅本地存储，不会上传至服务器
        </p>
      </div>
    </div>
  );
}
