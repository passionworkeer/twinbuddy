import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, Wallet, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import type { NegotiationResult, TwinCardLayer } from '../../types';
import { RadarChart } from './RadarChart';

interface Props {
  result: NegotiationResult;
  userName?: string;
  buddyName?: string;
  onConfirm?: () => void;
  onViewDetails?: () => void;
}

// ── Red Flags Panel ───────────────────────────────────

function RedFlagsPanel({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="red-flag-badge">
          <AlertTriangle className="w-3 h-3" />
          注意事项
        </span>
      </div>
      <div className="space-y-1.5">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-neon-text-secondary">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            {flag}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Negotiation Thread ────────────────────────────────

function NegotiationThread({ messages }: { messages: NegotiationResult['messages'] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-neon-text-secondary uppercase tracking-widest">
        数字人协商记录
      </h4>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scroll-x">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.speaker === 'user' ? 'bubble-user' : 'bubble-buddy'}
          >
            <p className="text-sm text-neon-text leading-relaxed">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Layer 1: Preview ──────────────────────────────────

function Layer1Preview({
  result,
  userName = '你的数字人',
  buddyName = '搭子的数字人',
  onViewDetails,
}: {
  result: NegotiationResult;
  userName?: string;
  buddyName?: string;
  onViewDetails: () => void;
}) {
  const [messages] = useState(() => result.messages.slice(0, 3));

  return (
    <div className="twin-card-layer1 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-primary/30 to-neon-secondary/20 border border-neon-primary/30 flex items-center justify-center text-lg shadow-glow-primary twin-glow-ring">
            🌈
          </div>
          <div>
            <p className="text-sm font-semibold text-neon-text">{userName}</p>
            <p className="text-xs text-neon-text-secondary">已确认</p>
          </div>
        </div>
        <div className="text-neon-text-secondary mx-1 font-bold">×</div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-secondary/20 to-neon-primary/20 border border-neon-secondary/30 flex items-center justify-center text-lg shadow-glow-secondary twin-glow-ring">
            🎨
          </div>
          <div>
            <p className="text-sm font-semibold text-neon-text">{buddyName}</p>
            <p className="text-xs text-neon-text-secondary">已确认</p>
          </div>
        </div>
      </div>

      {/* Mini chat */}
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs p-2 rounded-xl max-w-[85%] ${msg.speaker === 'user'
                ? 'ml-auto bg-neon-primary/10 border border-neon-primary/20 text-neon-text'
                : 'mr-auto bg-white/4 border border-white/6 text-neon-text-secondary'
              }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Quick info */}
      <div className="flex items-center gap-3 text-xs text-neon-text-secondary">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-neon-secondary" />
          {result.destination}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-neon-secondary" />
          {result.dates}
        </span>
        <span className="flex items-center gap-1">
          <Wallet className="w-3 h-3 text-neon-secondary" />
          {result.budget}
        </span>
      </div>

      <button
        onClick={onViewDetails}
        className="w-full btn-secondary text-sm py-3 flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        查看协商详情
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Layer 2: Negotiation Detail ───────────────────────

function Layer2Detail({
  result,
  onCollapse,
  onConfirm,
}: {
  result: NegotiationResult;
  onCollapse: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="twin-card-layer2 p-5 space-y-5">
      {/* Collapse button */}
      <button onClick={onCollapse} className="btn-ghost text-xs flex items-center gap-1 mx-auto">
        <ChevronUp className="w-4 h-4" />
        收起
      </button>

      {/* Radar Chart */}
      <div className="flex flex-col items-center">
        <div className="p-4 rounded-2xl bg-neon-surface/40 border border-white/6 shadow-inner-glow">
          <RadarChart data={result.radar} size={220} />
        </div>
      </div>

      {/* Plan */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-neon-text-secondary uppercase tracking-widest">
          行程安排
        </h4>
        <div className="space-y-1.5">
          {result.plan.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neon-text">
              <div className="w-5 h-5 rounded-full bg-neon-primary/10 border border-neon-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-neon-primary font-bold">{i + 1}</span>
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Negotiation thread */}
      <NegotiationThread messages={result.messages} />

      {/* Red flags */}
      <RedFlagsPanel flags={result.red_flags} />

      {/* Confirm CTA */}
      <button onClick={onConfirm} className="btn-primary w-full py-4 text-base">
        <CheckCircle className="w-5 h-5" />
        确认搭子，去旅行
      </button>
    </div>
  );
}

// ── Layer 3: Success State ─────────────────────────────

const SPARKLE_COLORS = ['#ffb3b6', '#affffb', '#eec224', '#fca5a5', '#a78bfa'];
const SPARKLE_COUNT = 12;

function Sparkles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Generate sparkles once per component instance — stable across re-renders
  const sparkles = useMemo(() => Array.from({ length: SPARKLE_COUNT }, (_, i) => {
    const angle = (360 / SPARKLE_COUNT) * i;
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * (30 + Math.random() * 20);
    const ty = Math.sin(rad) * (30 + Math.random() * 20) - 20;
    const size = 4 + Math.random() * 6;
    const color = SPARKLE_COLORS[i % SPARKLE_COLORS.length];
    const dur = 1.0 + Math.random() * 0.8;
    const delay = i * 80;
    return { tx, ty, size, color, dur, delay };
  }), []);

  return (
    <>
      {sparkles.map((s, i) => (
        <div
          key={i}
          className="sparkle"
          style={{
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size * 1.5}px ${s.color}`,
            top: '50%',
            left: '50%',
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            '--tx': `${s.tx}px`,
            '--ty': `${s.ty}px`,
            '--sparkle-dur': `${s.dur}s`,
            animationDelay: `${s.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

function Layer3Success({ destination, dates }: { destination: string; dates: string }) {
  return (
    <div className="twin-card-layer3 p-8 flex flex-col items-center gap-5 text-center">
      <div className="relative flex items-center justify-center">
        {/* Outer ring pulse */}
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            border: '2px solid rgba(175,255,251,0.3)',
            animation: 'twinCardGlow 2s ease-in-out infinite',
          }}
        />
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-secondary/30 to-neon-primary/20 border-2 border-neon-secondary/40 flex items-center justify-center text-4xl shadow-glow-secondary relative z-10">
          ✨
          <Sparkles />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-neon-secondary/20 border border-neon-secondary/40 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-neon-secondary" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gradient-secondary">搭子已就位！</h3>
        <p className="mt-1 text-sm text-neon-text-secondary">
          你的数字人已和对方达成共识
        </p>
      </div>
      <div className="glass-panel p-4 w-full space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-neon-secondary" />
          <span className="text-neon-text">{destination}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-neon-secondary" />
          <span className="text-neon-text">{dates}</span>
        </div>
      </div>
      <p className="text-xs text-neon-text-disabled max-w-xs">
        对方也收到了你们的搭子卡片，接下来等你们的真实故事
      </p>
    </div>
  );
}

// ── TwinCard ──────────────────────────────────────────

export function TwinCard({ result, userName, buddyName, onConfirm, onViewDetails }: Props) {
  const [layer, setLayer] = useState<TwinCardLayer>(1);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
      return;
    }
    setLayer(2);
  };
  const handleCollapse = () => setLayer(1);
  const handleConfirm = () => {
    setLayer(3);
    onConfirm?.();
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {layer === 1 && (
        <Layer1Preview
          result={result}
          userName={userName}
          buddyName={buddyName}
          onViewDetails={handleViewDetails}
        />
      )}
      {layer === 2 && (
        <Layer2Detail
          result={result}
          onCollapse={handleCollapse}
          onConfirm={handleConfirm}
        />
      )}
      {layer === 3 && (
        <Layer3Success destination={result.destination} dates={result.dates} />
      )}
    </div>
  );
}
