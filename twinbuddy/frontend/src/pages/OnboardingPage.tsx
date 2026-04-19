import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Sparkles } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { usePrecomputedMatch } from '../hooks/usePrecomputedMatch';
import { MBTI_TYPES, MBTI_LABELS, INTEREST_TAGS, VideoItem } from '../types';
import MOCK_VIDEOS from '../mocks/videos.json';

const LOCATIONS = [
  { id: 'chengdu', name: '成都', image: '/images/chengdu.jpg', desc: '从巷子与茶馆切入，会比打卡清单更像真正的成都。' },
  { id: 'chongqing', name: '重庆', image: '/images/chongqing.jpg', desc: '把夜景和坡地步行拆开体验，体感会轻松很多。' },
  { id: 'chuanxi', name: '川西', image: '/images/chuanxi.jpg', desc: '先保证高质量风景段，再决定是否加码深度点位。' },
  { id: 'dali', name: '大理', image: '/images/dali.jpg', desc: '洱海与古城之间留白体验，比密集打卡更容易出片。' },
  { id: 'lijiang', name: '丽江', image: '/images/lijiang.jpg', desc: '主街和支巷分开逛，既有热闹也能留出安静时段。' },
  { id: 'qingdao', name: '青岛', image: '/images/qingdao.jpg', desc: '海边与街区混搭，比单一打卡更有节奏感。' },
  { id: 'xiamen', name: '厦门', image: '/images/xiamen.jpg', desc: '街角和海风节奏搭配，适合做轻量深度体验。' },
  { id: 'xian', name: '西安', image: '/images/xian.jpg', desc: '大唐不夜城和周边历史片区分时体验，避免同段拥堵。' },
];

// ── Progress Dots ─────────────────────────────────────
// Removed since the new design does not use progress dots

// ── Step 1: MBTI Grid ─────────────────────────────────

function MBTIGrid({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto animate-fade-in -mt-12">
      <div className="text-center mb-10 space-y-2 sm:space-y-3">
        <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
          在自己眼中<br />你是怎样的人
        </h2>
        <p className="font-body text-sm sm:text-base text-gray-700">
          选择你的 MBTI 类型
        </p>
      </div>
      <div className="w-full flex flex-wrap justify-center gap-3">
        {MBTI_TYPES.map((mbti) => {
          const selected = value === mbti;
          return (
            <button
              key={mbti}
              onClick={() => onChange(mbti)}
              className={`px-5 py-3 rounded-full backdrop-blur-[12px] border transition-colors group flex items-center gap-2
                ${selected 
                  ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(255,181,159,0.4)]' 
                  : 'bg-white/50 border-gray-300 text-gray-800 hover:bg-white/80'
                }`}
            >
              <span className={`font-headline text-lg font-bold transition-colors ${selected ? 'text-white' : 'text-gray-800 group-hover:text-primary'}`}>
                {mbti}
              </span>
              <span className={`font-body text-xs transition-colors ${selected ? 'text-white/90' : 'text-gray-600'}`}>
                {MBTI_LABELS[mbti]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Interest Tags ─────────────────────────────

function InterestTags({ values, onToggle }: { values: string[]; onToggle: (i: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto animate-fade-in -mt-12">
      <div className="text-center mb-10 space-y-2">
        <h2 className="font-headline text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
          选择你喜欢的旅行方式
        </h2>
        <p className="font-body text-sm text-gray-700">（可多选）</p>
      </div>
      <div className="w-full flex flex-wrap justify-center gap-3 mb-10">
        {INTEREST_TAGS.map((tag) => {
          const selected = values.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`px-5 py-2.5 rounded-full backdrop-blur-[12px] border text-sm font-body transition-colors
                ${selected 
                  ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(255,181,159,0.4)]' 
                  : 'bg-white/50 border-gray-300 text-gray-800 hover:bg-white/80'
                }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 3: Voice or Text ─────────────────────────────

type VoiceState = 'idle' | 'connecting' | 'recording' | 'transcribed' | 'error';

// Vite proxy 不支持 WebSocket，开发环境直连后端端口
const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000';

function VoiceOrText({ text, onChange }: { text: string; onChange: (t: string) => void }) {

  const [voiceState, setVoiceState] = useState<VoiceState>(text ? 'transcribed' : 'idle');
  const [noSupport, setNoSupport] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (typeof AudioWorkletNode === 'undefined') setNoSupport(true);
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  const finalTextRef = useRef(text ? `${text.trim()} ` : '');
  const wsConnectedRef = useRef(false);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 同步外部 text → local ref（用户可能在录音期间编辑 textarea）
  useEffect(() => {
    if (!isRecordingRef.current) {
      finalTextRef.current = text ? `${text.trim()} ` : '';
    }
  }, [text]);

  const cleanup = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
      wsConnectedRef.current = false;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* ignore */ }
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch { /* ignore */ }
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setInterimText('');
  }, []);

  // ── Audio + WebSocket STT ────────────────────────────
  const startRecording = useCallback(async () => {
    finalTextRef.current = text.trim() ? `${text.trim()} ` : '';
    setInterimText('');
    setVoiceState('connecting');
    isRecordingRef.current = true;

    try {
      // 1. 麦克风权限 + AudioContext
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = ctx;

      // 2. AudioWorklet
      await ctx.audioWorklet.addModule('/audio-processor.js');

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = new AudioWorkletNode(ctx, 'pcm-processor');
      processorRef.current = processor;

      // 3. WebSocket（直连后端，跳过 Vite proxy）
      const wsUrl = `${WS_BASE}/api/stt/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      // 连接超时 5s
      openTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
          ws.close();
          isRecordingRef.current = false;
          setVoiceState('error');
          cleanup();
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(openTimeoutRef.current!);
        openTimeoutRef.current = null;
        wsConnectedRef.current = true;
        // WebSocket 就绪后才连接音频管线，避免首帧丢失
        source.connect(processor);
        processor.connect(ctx.destination);
        // AudioWorklet → WebSocket
        // FIX BUG 3: Use wsConnectedRef (set here in onopen) instead of ws.readyState.
        // AudioWorklet port messages can fire before onopen fires, making
        // readyState unreliable as a guard.
        processor.port.onmessage = (e: MessageEvent) => {
          if (wsConnectedRef.current && isRecordingRef.current) {
            ws.send(e.data as ArrayBuffer);
          }
        };
        setVoiceState('recording');
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'text') {
          finalTextRef.current += msg.content;
          const allFinal = finalTextRef.current.trim();
          setInterimText(msg.content);
          onChange(allFinal);
          setShowBadge(true);
        } else if (msg.type === 'done') {
          const allFinal = finalTextRef.current.trim();
          onChange(allFinal);
          isRecordingRef.current = false;
          setVoiceState(allFinal ? 'transcribed' : 'idle');
          cleanup();
        } else if (msg.type === 'error') {
          isRecordingRef.current = false;
          setVoiceState('error');
          cleanup();
        }
      };

      ws.onerror = () => {
        clearTimeout(openTimeoutRef.current!);
        openTimeoutRef.current = null;
        wsConnectedRef.current = false;
        isRecordingRef.current = false;
        setVoiceState('error');
        cleanup();
      };

      ws.onclose = () => {
        clearTimeout(openTimeoutRef.current!);
        openTimeoutRef.current = null;
        wsConnectedRef.current = false;
        if (isRecordingRef.current) {
          isRecordingRef.current = false;
          const hasText = !!finalTextRef.current.trim();
          setVoiceState(hasText ? 'transcribed' : 'idle');
          if (hasText) setShowBadge(true);
        }
        cleanup();
      };

    } catch (err: unknown) {
      isRecordingRef.current = false;
      if ((err as Error).name === 'NotAllowedError') {
        setVoiceState('error');
      } else if ((err as Error).name === 'NotFoundError') {
        setVoiceState('error');
      } else if ((err as Error).name === 'NotReadableError') {
        setVoiceState('error');
      } else {
        setVoiceState('error');
      }
      cleanup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    // FIX BUG 3: Use wsConnectedRef — same timing reason as AudioWorklet send above
    if (wsRef.current && wsConnectedRef.current) {
      wsRef.current.send(new ArrayBuffer(0));
    }
    // transcribed 状态由 onclose 统一设置，不在此处设置
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // ── Start/Stop handler ──────────────────────────────
  const handleMicClick = () => {
    if (voiceState === 'recording') {
      stopRecording();
      return;
    }
    if (voiceState === 'idle' || voiceState === 'transcribed' || voiceState === 'error') {
      startRecording();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto animate-fade-in -mt-12">
      <div className="text-center mb-10 space-y-2">
        <h2 className="font-headline text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">用一句话描述<br />你理想的搭子</h2>
        <p className="font-body text-sm text-gray-700">说点什么，或者直接跳过</p>
      </div>

      {/* Textarea: shows live interim preview during recording */}
      <div className="w-full flex flex-col items-center gap-6">
        <div className="relative w-full max-w-sm">
          {/* Interim preview layer — gray text rendered behind textarea */}
          <div
            className="absolute inset-0 rounded-2xl border border-transparent px-4 py-3 text-sm text-gray-400 pointer-events-none whitespace-pre-wrap break-all overflow-hidden"
            aria-hidden="true"
          >
            {interimText}
          </div>
          {/* Actual editable textarea — transparent bg so interim shows through */}
          <textarea
            className="relative w-full rounded-2xl border border-gray-300 bg-white/50 backdrop-blur-[12px] px-4 py-3
                       text-gray-800 text-sm resize-none placeholder:text-gray-500
                       focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all hover:bg-white/80"
            rows={3}
            placeholder="描述你理想的搭子，比如：喜欢慢节奏、会拍照、能吃辣..."
            value={text}
            onChange={(e) => {
              if (!isRecordingRef.current) {
                finalTextRef.current = e.target.value ? `${e.target.value.trim()} ` : '';
                setVoiceState(e.target.value ? 'transcribed' : 'idle');
                // 手动输入不显示"已识别"徽章，只有语音识别结果才显示
              }
              onChange(e.target.value);
            }}
          />
        </div>

        {/* Voice recording button */}
        <button
          onClick={handleMicClick}
          disabled={noSupport || voiceState === 'connecting'}
          className={`
            relative flex items-center justify-center rounded-full
            transition-all duration-300 select-none
            ${voiceState === 'recording'
              ? 'w-24 h-24 bg-red-100 border-2 border-red-500 shadow-[0_0_30px_rgba(249,86,48,0.5)] animate-pulse'
              : voiceState === 'connecting'
              ? 'w-20 h-20 bg-gray-100 border border-gray-300'
              : 'w-20 h-20 bg-white/50 backdrop-blur-[12px] border border-gray-300 hover:border-primary hover:shadow-[0_0_20px_rgba(255,181,159,0.3)] hover:bg-white/80'
            }
          `}
        >
          <Mic className={`w-8 h-8 ${voiceState === 'recording' ? 'text-red-500' : voiceState === 'connecting' ? 'text-gray-400 animate-pulse' : 'text-primary'}`} />
          {voiceState === 'recording' && (
            <span className="absolute -bottom-8 text-xs text-red-500 animate-pulse font-body whitespace-nowrap">录音中，点击停止</span>
          )}
          {voiceState === 'connecting' && (
            <span className="absolute -bottom-8 text-xs text-gray-500 animate-pulse font-body whitespace-nowrap">正在连接…</span>
          )}
          {voiceState === 'idle' && !noSupport && (
            <span className="absolute -bottom-8 text-xs text-gray-600 font-body whitespace-nowrap">
              {text ? '继续录音' : '点击说话'}
            </span>
          )}
          {(voiceState === 'transcribed' || voiceState === 'error') && !noSupport && (
            <span className="absolute -bottom-8 text-xs text-gray-600 font-body whitespace-nowrap">
              {voiceState === 'error' ? '点击重试' : (text ? '继续录音' : '点击说话')}
            </span>
          )}
          {noSupport && (
            <span className="absolute -bottom-8 text-xs text-gray-400 font-body">浏览器不支持</span>
          )}
        </button>

        {/* Audio waveform visualizer during recording */}
        {voiceState === 'recording' && (
          <div className="flex items-end gap-1 h-8 mt-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-primary/80"
                style={{
                  height: `${8 + Math.abs(Math.sin(Date.now() / 200 + i * 0.8)) * 24}px`,
                  animation: `slideUp 600ms ease-in-out ${i * 80}ms infinite alternate`,
                }}
              />
            ))}
          </div>
        )}

        {/* Transcribed result — user can still edit in textarea above */}
        {showBadge && text && (
          <div className="w-full max-w-sm animate-fade-in mt-2">
            <div className="bg-white/80 backdrop-blur-[12px] rounded-xl p-4 border border-primary/30 shadow-[0_0_15px_rgba(255,181,159,0.15)]">
              <p className="mt-1 text-xs text-gray-700 flex items-center justify-center gap-1 font-body">
                <Sparkles className="w-3 h-3 text-primary" />
                已识别，你可以在上方修改文本
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 4: Destination Cards (Horizontal Scroll) ────────

function DestinationInput({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // 使用 IntersectionObserver 监听哪个卡片滚动到了中间
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.getAttribute('data-id');
            if (id && id !== value) {
              onChange(id);
            }
          }
        });
      },
      {
        root: scrollRef.current,
        threshold: 0.5,
      }
    );

    const cards = scrollRef.current?.querySelectorAll('.destination-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [onChange, value]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'auto'; // Disable smooth scroll while dragging
      scrollRef.current.classList.add('active');
      startX.current = e.pageX - scrollRef.current.offsetLeft;
      scrollLeft.current = scrollRef.current.scrollLeft;
    }
  };

  const handleMouseLeaveOrUp = () => {
    isDown.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
      scrollRef.current.classList.remove('active');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // adjust scrolling speed
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] -mx-4 sm:-mx-6 animate-fade-in -mt-4 overflow-hidden">
      <div className="text-center mb-8 space-y-2 w-full">
        <h2 className="font-headline text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
          你的目的地是
        </h2>
        <p className="font-body text-sm text-white/60">
          左右滑动选择你心仪的城市
        </p>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="w-full flex flex-col items-center">
        <div 
          ref={scrollRef}
          className="w-full overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar flex cursor-grab active:cursor-grabbing" 
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            paddingLeft: 'calc(50% - 120px)', // w-60 = 240px, half is 120px
            paddingRight: 'calc(50% - 120px)'
          }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-4 w-max shrink-0 items-center">
          {LOCATIONS.map((loc) => {
            const selected = value === loc.id;
            return (
              <div
                key={loc.id}
                data-id={loc.id}
                onClick={() => {
                  if (!isDown.current) {
                    onChange(loc.id);
                    // scroll to center
                    const el = document.querySelector(`[data-id="${loc.id}"]`) as HTMLElement;
                    if (el && scrollRef.current) {
                      scrollRef.current.scrollTo({
                        left: el.offsetLeft - scrollRef.current.clientWidth / 2 + el.clientWidth / 2,
                        behavior: 'smooth'
                      });
                    }
                  }
                }}
                className={`
                  destination-card snap-center relative shrink-0 w-60 aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer
                  transition-all duration-300 ease-out transform flex flex-col select-none
                  ${selected ? 'scale-100 opacity-100 shadow-2xl z-10 border border-white/30' : 'scale-90 opacity-50 hover:opacity-80 border border-transparent'}
                `}
              >
                <div className="absolute inset-0 w-full h-full">
                  <img 
                    src={loc.image} 
                    alt={loc.name} 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable="false"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end">
                  <h3 className="font-headline text-2xl font-bold mb-1.5 text-white drop-shadow-md">
                    {loc.name}
                  </h3>
                  <p className="font-body text-xs text-white/90 leading-relaxed drop-shadow-sm">
                    {loc.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex gap-2 justify-center mt-2 mb-6">
        {LOCATIONS.map((loc) => (
          <div 
            key={loc.id} 
            className={`h-1.5 rounded-full transition-all duration-300 ${value === loc.id ? 'w-6 bg-white/90' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>
      
      <div className="w-full max-w-xs px-6 mt-2 opacity-0 h-0 overflow-hidden">
        {/* Hidden but kept for logic */}
        <input
          type="text"
          className="w-full block rounded-full border border-gray-300 bg-white/50 backdrop-blur-[12px] px-6 py-3
                     text-gray-800 text-sm placeholder:text-gray-600 text-center
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all hover:bg-white/80"
          placeholder="输入其他目的地..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
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

  const { startPrecomputation, clearPrecomputed } = usePrecomputedMatch();

  const TOTAL_STEPS = 4;

  // 显式步骤状态：由用户操作驱动，第 1/2 步会基于数据自动前进。
  const [step, setStep] = useState(1);

  // ── 预计算触发器 ─────────────────────────────────────────────
  // 当用户选择城市后立即开始预计算（不等完成 onboarding）
  // 这样用户在滑动视频时，后台已经在计算搭子匹配和协商
  const precomputeTriggeredRef = useRef(false);

  const triggerPrecomputation = useCallback(() => {
    if (precomputeTriggeredRef.current) return;
    if (!data.mbti || data.interests.length === 0) return;

    precomputeTriggeredRef.current = true;

    // 随机打乱视频列表
    const shuffled = [...(MOCK_VIDEOS as VideoItem[])];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    sessionStorage.setItem('twinbuddy_preloaded_feed', JSON.stringify(shuffled));

    // 清除旧的预计算数据，然后启动新的预计算
    clearPrecomputed();
    // 立即启动预计算（不等待 onboarding 完成）
    startPrecomputation(data);
  }, [data, startPrecomputation, clearPrecomputed]);

  // 用户选择城市后立即触发预计算
  useEffect(() => {
    if (step === 4 && data.city && !precomputeTriggeredRef.current) {
      // 延迟一点确保数据已更新
      const timer = setTimeout(triggerPrecomputation, 200);
      return () => clearTimeout(timer);
    }
  }, [step, data.city, triggerPrecomputation]);

  // 完成 onboarding 时检查是否已触发预计算
  useEffect(() => {
    if (!data.completed) return;
    // 确保预计算已触发
    if (!precomputeTriggeredRef.current) {
      triggerPrecomputation();
    }
  }, [data.completed, triggerPrecomputation]);

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
        // `completeOnboarding` will trigger a state change `data.completed = true` 
        // which triggers the useEffect below to navigate to `/feed`
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
    <div className="h-screen overflow-hidden flex flex-col bg-background text-on-surface font-body antialiased pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] onboarding-container">
      {/* Background Image with Gradient Overlay */}
      <div
        className={`fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ${step === 4 ? 'scale-105 filter blur-[2px] brightness-75' : ''}`}
        style={{
          backgroundImage: "url('/images/back.jpg')"
        }}
      />
      <div className={`fixed inset-0 z-0 transition-all duration-700 ${step === 4 ? 'bg-black/60' : 'bg-white/40'}`} />

      {/* TopAppBar */}
      <header className="relative z-20 shrink-0 flex justify-between items-center w-full px-6 py-4">
        {step > 1 ? (
          <button onClick={handleBack} className={`${step === 4 ? 'text-white' : 'text-gray-800'} hover:opacity-80 transition-opacity scale-95 duration-200`}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <div className="w-6"></div>
        )}
        <div className="text-center">
          <h1 className={`${step === 4 ? 'text-white' : 'text-gray-800'} font-headline text-xl font-bold tracking-tight drop-shadow-sm`}>拼途旅行</h1>
        </div>
        <div className="w-6"></div>
      </header>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex flex-col flex-1 min-h-0 w-full px-4 sm:px-6 pt-6 sm:pt-10 pb-12 max-w-4xl mx-auto items-center overflow-x-hidden overflow-y-auto">
        
        {step === 1 && <MBTIGrid value={data.mbti} onChange={updateMbti} />}
        {step === 2 && <InterestTags values={data.interests} onToggle={toggleInterest} />}
        {step === 3 && <VoiceOrText text={data.voiceText} onChange={setVoiceText} />}
        {step === 4 && <DestinationInput value={data.city} onChange={setCity} />}

        {/* Footer Actions */}
        <div className={`mt-auto flex flex-col items-center w-full max-w-sm space-y-4 pt-6 z-20 ${step === 4 ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : ''}`}>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`w-full max-w-[200px] py-3 px-6 rounded-full bg-white/90 backdrop-blur-[12px] border border-primary/30 text-gray-800 hover:text-primary font-body text-sm hover:bg-white transition-all duration-300 shadow-[0_0_15px_rgba(255,181,159,0.15)] 
              ${!canProceed() ? 'opacity-40 cursor-not-allowed shadow-none' : ''}`}
          >
            {step < TOTAL_STEPS ? '继续' : '开始刷搭子'}
          </button>
          <p className="font-body text-[10px] text-gray-700 tracking-wider">
            数据仅本地存储，不会上传至服务器
          </p>
        </div>

        {step === 4 && (
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center space-y-4 z-20 px-6">
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full max-w-sm py-4 px-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-body text-sm hover:bg-white/30 transition-all duration-300
                ${!canProceed() ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              开始刷搭子
            </button>
            <p className="font-body text-[10px] text-white/50 tracking-wider">
              数据仅本地存储，不会上传至服务器
            </p>
          </div>
        )}
      </main>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
