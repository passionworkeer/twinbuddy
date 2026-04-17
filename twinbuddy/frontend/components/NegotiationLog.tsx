/**
 * NegotiationLog.tsx — Animated chat bubble component
 * Displays a sequence of negotiation messages with typewriter effect,
 * auto-scrolls to bottom, and shows the final trip plan when complete.
 */

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin, Calendar, Wallet, Users } from 'lucide-react';
import type { NegotiationMessage, MatchResult } from '../types/persona';

// ── Individual bubble ─────────────────────────────────────────────────────────

interface BubbleProps {
  message: NegotiationMessage;
  /** Characters revealed so far (0 = not started yet) */
  revealed: number;
}

const BUDDY_GRADIENTS = [
  'from-purple-400 to-pink-400',
  'from-blue-400 to-cyan-400',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-400',
];

function getBuddyGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BUDDY_GRADIENTS[Math.abs(hash) % BUDDY_GRADIENTS.length]!;
}

function Bubble({ message, revealed }: BubbleProps) {
  const isUser = message.speaker === 'user';

  if (revealed === 0 && !isUser) {
    // Not yet revealed — show a subtle typing indicator
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`
          flex items-center gap-2 rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-gray-100 dark:bg-gray-800'
            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700'
          }
        `}>
          {!isUser && message.buddy_name && (
            <span className="text-xs font-semibold text-gray-400">{message.buddy_name}</span>
          )}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayText = message.content.slice(0, revealed);
  const isComplete = revealed >= message.content.length;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[80%] sm:max-w-[70%] flex flex-col gap-0.5
        ${isUser ? 'items-end' : 'items-start'}
      `}>
        {/* Buddy name label */}
        {!isUser && message.buddy_name && (
          <span className="ml-3 mb-0.5 text-xs font-semibold text-gray-400">
            {message.buddy_name}
          </span>
        )}

        {/* Bubble */}
        <div className={`
          rounded-2xl px-4 py-3 text-sm leading-relaxed
          transition-all duration-150
          ${isUser
            ? 'rounded-tr-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
            : `rounded-tl-md bg-gradient-to-r ${getBuddyGradient(message.buddy_name ?? 'x')} text-white shadow-sm`
          }
          ${!isComplete && !isUser ? 'opacity-90' : ''}
        `}>
          {displayText}
          {!isComplete && (
            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-white/60 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Final plan card ───────────────────────────────────────────────────────────

interface PlanCardProps {
  result: MatchResult;
}

function PlanCard({ result }: PlanCardProps) {
  return (
    <div className="mt-6 animate-fade-in rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        <h3 className="font-bold text-emerald-700 dark:text-emerald-400">
          协商完成！达成共识
        </h3>
      </div>

      {/* Meta grid */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <MapPin className="h-4 w-4" />, label: '目的地', value: result.destination },
          { icon: <Calendar className="h-4 w-4" />, label: '日期', value: result.dates },
          { icon: <Wallet className="h-4 w-4" />, label: '预算', value: result.budget },
          { icon: <Users className="h-4 w-4" />, label: '搭子', value: result.matched_buddies.join('、') },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl bg-white/70 p-3 dark:bg-emerald-900/20"
          >
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              {icon}
              <span>{label}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Plan items */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">行程安排</p>
        {result.plan.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="
              mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center
              rounded-full bg-emerald-500 text-[10px] font-bold text-white
            ">
              {i + 1}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200">{item}</p>
          </div>
        ))}
      </div>

      {/* Matched buddies avatars */}
      <div className="mt-5 flex items-center gap-2">
        <p className="text-xs text-gray-400">你的搭子：</p>
        <div className="flex -space-x-2">
          {result.matched_buddies.map((name) => {
            const emojis: Record<string, string> = { 小满: '🌈', 阿璃: '🗺️', 小拾: '🌙' };
            return (
              <div
                key={name}
                title={name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-purple-100 to-pink-100 text-xs shadow-sm dark:border-gray-900"
              >
                {emojis[name] ?? '✨'}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  messages: NegotiationMessage[];
  /** Shown after all messages have been revealed */
  result?: MatchResult;
}

export function NegotiationLog({ messages, result }: Props) {
  const [revealedCounts, setRevealedCounts] = useState<number[]>(
    messages.map(() => 0),
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Typing speed in ms per character
  const TYPING_INTERVAL = 28;
  const BETWEEN_DELAY = 400; // ms pause between messages

  useEffect(() => {
    // Reset on new messages
    setRevealedCounts(messages.map(() => 0));

    let msgIdx = 0;
    let charIdx = 0;
    let started = false;

    const tick = () => {
      setRevealedCounts((prev) => {
        const next = [...prev];
        if (msgIdx >= messages.length) return next;

        const msg = messages[msgIdx]!;
        if (charIdx === 0) {
          // Starting a new message — delay before it appears
          charIdx = 1; // mark as "visible"
          next[msgIdx] = 1;
        } else {
          next[msgIdx] = charIdx;
          if (charIdx < msg.content.length) {
            charIdx++;
          } else {
            // Move to next message
            msgIdx++;
            charIdx = 0;
            if (msgIdx < messages.length) {
              next[msgIdx] = 1; // start next message
            }
          }
        }
        return next;
      });
    };

    // Kick off first message after a short pause
    const startTimer = setTimeout(() => {
      tick();
      const interval = setInterval(tick, TYPING_INTERVAL);
      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(startTimer);
  }, [messages]);

  // Auto-scroll to bottom on each update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const allRevealed = revealedCounts.every(
    (count, i) => count >= messages[i]!.content.length,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Chat container */}
      <div
        ref={containerRef}
        className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"
        style={{ maxHeight: '520px', overflowY: 'auto' }}
      >
        {messages.map((msg, i) => (
          <Bubble key={i} message={msg} revealed={revealedCounts[i] ?? 0} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Status indicator */}
      {!allRevealed && (
        <p className="text-center text-xs text-gray-400">
          协商中...
        </p>
      )}

      {/* Final result */}
      {allRevealed && result && <PlanCard result={result} />}
    </div>
  );
}
