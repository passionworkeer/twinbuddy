import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, Wallet, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import type { NegotiationResult, TwinCardLayer } from '../../types';
import { RadarChart } from './RadarChart';

interface Props {
  result: NegotiationResult;
  userName?: string;
  buddyName?: string;
  onConfirm?: () => void;
}

// ── Red Flags Panel ───────────────────────────────────

function RedFlagsPanel({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-neon-tertiary flex items-center gap-1.5 uppercase tracking-widest">
        <AlertTriangle className="w-3.5 h-3.5" />
        注意事项
      </h4>
      <div className="space-y-1.5">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-neon-text-secondary">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-tertiary mt-1.5 flex-shrink-0" />
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
      <div className="space-y-2 max-h-48 overflow-y-auto scroll-x">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg-bubble ${msg.speaker === 'user' ? 'user' : 'buddy'}`}
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
  buddyName = 'TA的数字人',
  onExpand,
}: {
  result: NegotiationResult;
  userName?: string;
  buddyName?: string;
  onExpand: () => void;
}) {
  const [messages] = useState(() => result.messages.slice(0, 3));

  return (
    <div className="glass-panel p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-primary/30 to-neon-secondary/20 border border-neon-primary/30 flex items-center justify-center text-lg">
            🌈
          </div>
          <div>
            <p className="text-sm font-semibold text-neon-text">{userName}</p>
            <p className="text-xs text-neon-text-secondary">已确认</p>
          </div>
        </div>
        <div className="text-neon-text-secondary mx-1">×</div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-secondary/20 to-neon-primary/20 border border-neon-secondary/30 flex items-center justify-center text-lg">
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
        onClick={onExpand}
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
    <div className="glass-panel-strong p-5 space-y-5 animate-slide-up">
      {/* Collapse button */}
      <button onClick={onCollapse} className="btn-ghost text-xs flex items-center gap-1 mx-auto">
        <ChevronUp className="w-4 h-4" />
        收起
      </button>

      {/* Radar Chart */}
      <div className="flex flex-col items-center">
        <RadarChart data={result.radar} size={220} />
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

function Layer3Success({ destination, dates }: { destination: string; dates: string }) {
  return (
    <div className="glass-panel-strong p-8 flex flex-col items-center gap-5 text-center animate-page-enter">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-primary/30 to-neon-secondary/20 border-2 border-neon-primary/40 flex items-center justify-center text-4xl shadow-glow-primary">
          ✨
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neon-secondary/20 border border-neon-secondary/40 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-neon-secondary" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gradient-primary">搭子已就位！</h3>
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

export function TwinCard({ result, userName, buddyName, onConfirm }: Props) {
  const [layer, setLayer] = useState<TwinCardLayer>(1);

  const handleExpand = () => setLayer(2);
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
          onExpand={handleExpand}
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
