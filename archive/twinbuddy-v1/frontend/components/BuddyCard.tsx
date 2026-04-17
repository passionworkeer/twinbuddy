/**
 * BuddyCard.tsx — Single buddy card component
 * Shows MBTI badge, compatibility score, avatar, name, travel style, and phrase tags.
 */

import type { Buddy } from '../types/persona';
import { MapPin, MessageCircle } from 'lucide-react';

// ── MBTI → gradient/color mapping ───────────────────────────────────────────

const MBTI_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ENFP: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', label: '热情开拓者' },
  ISTJ: { bg: 'bg-blue-100 dark:bg-blue-900/40',  text: 'text-blue-700 dark:text-blue-300',  label: '严谨规划者' },
  INFP: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', label: '诗意漫游者' },
  default: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', label: '' },
};

function getMbtiStyle(mbti: string) {
  return MBTI_STYLES[mbti] ?? MBTI_STYLES['default'];
}

// ── Score color ───────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-500';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-yellow-500';
  return 'text-orange-500';
}

function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-emerald-400';
  if (score >= 80) return 'bg-green-400';
  if (score >= 70) return 'bg-yellow-400';
  return 'bg-orange-400';
}

// ── Avatar emoji derived from MBTI ────────────────────────────────────────────

const AVATAR_EMOJI: Record<string, string> = {
  ENFP: '🌈',
  ISTJ: '🗺️',
  INFP: '🌙',
  default: '✨',
};

function getAvatarEmoji(mbti: string): string {
  return AVATAR_EMOJI[mbti] ?? AVATAR_EMOJI['default'];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  buddy: Buddy;
  /** Called when user selects this buddy for negotiation */
  onSelect?: (buddy: Buddy) => void;
  /** Whether this card is in "selected" state */
  selected?: boolean;
}

export function BuddyCard({ buddy, onSelect, selected = false }: Props) {
  const mbtiStyle = getMbtiStyle(buddy.mbti);
  const avatar = getAvatarEmoji(buddy.mbti);

  return (
    <div
      onClick={onSelect ? () => onSelect(buddy) : undefined}
      className={`
        relative flex flex-col gap-4 rounded-2xl border p-5
        transition-all duration-200 cursor-pointer select-none
        ${selected
          ? 'border-purple-400 bg-purple-50 shadow-lg shadow-purple-200 dark:bg-purple-950/30 dark:shadow-purple-900/30'
          : 'border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-purple-800'
        }
      `}
    >
      {/* Selected checkmark badge */}
      {selected && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Top row: MBTI badge + compatibility */}
      <div className="flex items-center justify-between gap-2">
        {/* MBTI badge */}
        <div className="flex items-center gap-2">
          <span className={`
            inline-flex items-center gap-1 rounded-full px-3 py-1
            text-xs font-bold tracking-wide ${mbtiStyle.bg} ${mbtiStyle.text}
          `}>
            <span>{buddy.mbti}</span>
            {mbtiStyle.label && (
              <span className="opacity-70">·{mbtiStyle.label}</span>
            )}
          </span>
        </div>

        {/* Compatibility score */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${getScoreColor(buddy.compatibility_score)}`}>
            {buddy.compatibility_score}%
          </span>
          <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${getScoreBarColor(buddy.compatibility_score)}`}
              style={{ width: `${buddy.compatibility_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle row: avatar + name */}
      <div className="flex items-center gap-3">
        {/* Avatar bubble */}
        <div className="
          flex h-12 w-12 shrink-0 items-center justify-center
          rounded-full bg-gradient-to-br from-purple-100 to-pink-100
          text-2xl shadow-inner
          dark:from-purple-900/50 dark:to-pink-900/50
        ">
          {avatar}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {buddy.name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate italic">{buddy.travel_style}</span>
          </p>
        </div>
      </div>

      {/* Bottom: phrase tags */}
      <div className="flex flex-wrap gap-1.5">
        {buddy.typical_phrases.slice(0, 3).map((phrase) => (
          <span
            key={phrase}
            className="
              inline-flex items-center gap-1 rounded-full px-2.5 py-0.5
              bg-gray-50 text-xs text-gray-500
              border border-gray-100
              dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700
            "
          >
            <MessageCircle className="h-2.5 w-2.5 shrink-0 opacity-60" />
            <span className="truncate max-w-[140px]">{phrase}</span>
          </span>
        ))}
      </div>

      {/* Mobile tap hint */}
      {onSelect && (
        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 sm:hidden">
          点击选择这位搭子
        </p>
      )}
    </div>
  );
}
