import { useEffect, useRef, useState } from 'react';
import type { NegotiationMessage, MatchResult } from '../types/persona';

interface Props {
  messages: NegotiationMessage[];
  result: MatchResult | null;
  isTyping?: boolean;
}

function TypewriterText({ text, speed = 30, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    const type = () => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        timerRef.current = setTimeout(type, speed + Math.random() * 20);
      } else {
        onDone?.();
      }
    };
    timerRef.current = setTimeout(type, speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text, speed, onDone]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

function MessageBubble({ msg, showTyping }: { msg: NegotiationMessage; showTyping: boolean }) {
  const isUser = msg.speaker === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 text-sm
          ${isUser
            ? 'rounded-br-md bg-purple-500 text-white'
            : 'rounded-bl-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
          }
          ${showTyping && !isUser ? 'min-w-[60px]' : ''}
          shadow-sm
        `}
      >
        {!isUser && msg.buddy_name && (
          <p className="mb-1 text-xs font-bold text-purple-500 dark:text-purple-400">{msg.buddy_name}</p>
        )}
        {showTyping && !isUser ? (
          <TypewriterText text={msg.content} speed={25} />
        ) : (
          <p className="leading-relaxed">{msg.content}</p>
        )}
        <p className={`mt-1 text-xs ${isUser ? 'text-purple-200' : 'text-gray-400'} text-right`}>
          {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function FinalPlanCard({ result }: { result: MatchResult }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/40 dark:to-pink-950/40">
      <div className="bg-white/60 p-4 dark:bg-gray-900/60">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">✓</span>
          <span className="font-bold text-gray-800 dark:text-gray-100">行程已确认</span>
          {result.consensus && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">全员共识</span>
          )}
        </div>
        <div className="mb-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">目的地</p>
            <p className="font-bold text-gray-800 dark:text-gray-100">{result.destination}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">日期</p>
            <p className="font-bold text-gray-800 dark:text-gray-100">{result.dates}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">预算</p>
            <p className="font-bold text-gray-800 dark:text-gray-100">{result.budget}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">行程安排</p>
          <ol className="space-y-1.5">
            {result.plan.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600 dark:bg-purple-900 dark:text-purple-300">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        {result.matched_buddies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.matched_buddies.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
                👥 {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NegotiationLog({ messages, result, isTyping = false }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [typingBuddyIdx, setTypingBuddyIdx] = useState(-1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, result]);

  useEffect(() => {
    if (isTyping && messages.length > 0) {
      setTypingBuddyIdx(messages.length - 1);
    }
  }, [isTyping, messages.length]);

  if (messages.length === 0 && !result) {
    return (
      <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
        <p className="text-sm">选择搭子后开始协商...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          msg={msg}
          showTyping={isTyping && i === typingBuddyIdx}
        />
      ))}
      {result && <FinalPlanCard result={result} />}
      <div ref={bottomRef} />
    </div>
  );
}
