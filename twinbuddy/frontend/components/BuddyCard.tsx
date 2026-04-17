import type { Buddy } from '../types/persona';

interface Props {
  buddy: Buddy;
  isSelected?: boolean;
  onSelect?: (buddy: Buddy) => void;
}

const MBTI_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  ENFP: { bg: 'from-yellow-50 to-orange-50 dark:from-yellow-950/40 dark:to-orange-950/40', text: 'text-orange-600', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  INFP: { bg: 'from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40', text: 'text-indigo-600', border: 'border-indigo-200 dark:border-indigo-800', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  ISTJ: { bg: 'from-blue-50 to-gray-50 dark:from-blue-950/40 dark:to-gray-950/40', text: 'text-blue-700', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  INTJ: { bg: 'from-slate-50 to-gray-50 dark:from-slate-950/40 dark:to-gray-950/40', text: 'text-slate-700', border: 'border-slate-200 dark:border-slate-800', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' },
  ENTP: { bg: 'from-amber-50 to-red-50 dark:from-amber-950/40 dark:to-red-950/40', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  ISFJ: { bg: 'from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40', text: 'text-teal-600', border: 'border-teal-200 dark:border-teal-800', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  INFJ: { bg: 'from-violet-50 to-pink-50 dark:from-violet-950/40 dark:to-pink-950/40', text: 'text-violet-600', border: 'border-violet-200 dark:border-violet-800', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
  default: { bg: 'from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800', text: 'text-gray-600', border: 'border-gray-200 dark:border-gray-700', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
};

function getMbtiStyle(mbti: string) {
  return MBTI_COLORS[mbti] ?? MBTI_COLORS.default;
}

function CompatibilityBar({ score }: { score: number }) {
  const pct = Math.round(score);
  const color = pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-gray-400';
  const label = pct >= 90 ? '灵魂搭子' : pct >= 75 ? '默契不错' : '可以相处';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">契合度</span>
        <div className="flex items-center gap-1">
          <span className={`font-bold ${pct >= 90 ? 'text-green-600 dark:text-green-400' : pct >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>{pct}%</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500 dark:text-gray-400">{label}</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BuddyCard({ buddy, isSelected = false, onSelect }: Props) {
  const style = getMbtiStyle(buddy.mbti);
  return (
    <button
      onClick={() => onSelect?.(buddy)}
      className={`
        w-full text-left rounded-2xl border-2 p-4 transition-all duration-200
        ${style.border}
        ${style.bg}
        ${isSelected ? 'ring-2 ring-purple-500 shadow-lg scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'}
        cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400
      `}
      aria-pressed={isSelected}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-lg shadow-sm dark:bg-gray-800/80 ${style.text}`}>
            {buddy.avatar_prompt.includes('眼镜') ? '🧑‍💼' :
             buddy.avatar_prompt.includes('温柔') ? '🌿' :
             buddy.avatar_prompt.includes('活泼') ? '✨' : '🧑'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 dark:text-gray-100">{buddy.name}</span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${style.badge}`}>
                {buddy.mbti}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{buddy.avatar_prompt}</p>
          </div>
        </div>
        {isSelected && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-600 dark:bg-purple-900 dark:text-purple-300">
            已选
          </span>
        )}
      </div>

      {/* Typical phrases */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {buddy.typical_phrases.map((phrase, i) => (
          <span
            key={i}
            className="inline-block rounded-full bg-white/70 px-2.5 py-1 text-xs italic text-gray-600 dark:bg-gray-800/60 dark:text-gray-300"
          >
            {phrase}
          </span>
        ))}
      </div>

      {/* Travel style */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span>🚶</span>
        <span>{buddy.travel_style}</span>
      </div>

      {/* Compatibility bar */}
      <CompatibilityBar score={buddy.compatibility_score} />
    </button>
  );
}
