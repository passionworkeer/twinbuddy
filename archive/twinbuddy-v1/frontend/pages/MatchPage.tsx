/**
 * MatchPage.tsx — Buddy matching and negotiation page
 *
 * Flow:
 *  1. User fills in trip preferences (destination, dates, budget, travel style)
 *  2. 3 matched buddy cards are displayed
 *  3. User clicks "开始协商" → animated NegotiationLog plays
 *  4. Final trip plan is revealed
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Wallet,
  Zap,
  ArrowLeft,
  ChevronDown,
  Users,
} from 'lucide-react';
import { BuddyCard } from '../components/BuddyCard';
import { NegotiationLog } from '../components/NegotiationLog';
import type { Buddy, NegotiationMessage, MatchResult } from '../types/persona';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_BUDDIES: Buddy[] = [
  {
    name: '小满',
    mbti: 'ENFP',
    avatar_prompt: '热情活泼的女生，短发微卷，戴彩色耳环，笑容灿烂',
    typical_phrases: ['这个可以有！', '我们去浪吧！'],
    travel_style: '随性自由，不爱做攻略',
    compatibility_score: 94,
  },
  {
    name: '阿璃',
    mbti: 'ISTJ',
    avatar_prompt: '沉稳内敛的男生，金属框眼镜，穿深色衬衫，背双肩包',
    typical_phrases: ['我查过了', '按计划走'],
    travel_style: '行前规划，精确到分钟',
    compatibility_score: 87,
  },
  {
    name: '小拾',
    mbti: 'INFP',
    avatar_prompt: '温柔安静的女生，长发及腰，穿棉麻长裙，眼神柔和',
    typical_phrases: ['我很喜欢这里', '我们可以坐一会儿吗'],
    travel_style: '慢走漫行，喜欢安静的地方',
    compatibility_score: 91,
  },
];

function buildNegotiationMsgs(
  destination: string,
  dates: string,
  budget: string,
  travelStyle: string,
  buddyNames: string[],
): NegotiationMessage[] {
  const ts = Date.now();
  const buddyGradients: Record<string, string> = {
    小满: 'from-amber-400 to-orange-400',
    阿璃: 'from-blue-400 to-cyan-400',
    小拾: 'from-violet-400 to-purple-400',
  };

  return [
    {
      speaker: 'user',
      content: `大家好，我想去${destination}，${dates}，预算${budget}，${travelStyle}！`,
      timestamp: ts,
    },
    {
      speaker: 'buddy',
      buddy_name: '小满',
      content: `${destination}！！我超想去！！✨✨ 火锅、串串、熊猫基地，这几个必须有！要不我们晚上去逛夜市？`,
      timestamp: ts + 2000,
    },
    {
      speaker: 'buddy',
      buddy_name: '阿璃',
      content: `我查过了。${destination}主要景点：熊猫基地（早上8点最佳）、武侯祠、宽窄巷子、锦里。建议每天不超过2个景点，避免过度疲劳。`,
      timestamp: ts + 4500,
    },
    {
      speaker: 'buddy',
      buddy_name: '小拾',
      content: `嗯……我很喜欢${destination}。之前一个人去过一次，有一间很安静的小茶馆，在老街那边，很适合坐一下午。`,
      timestamp: ts + 7000,
    },
    {
      speaker: 'buddy',
      buddy_name: '小满',
      content: `好！那小拾说的老街茶馆必须安排！阿璃你负责行程，小拾负责找好吃的店，我负责发现好玩的地方！分工明确！`,
      timestamp: ts + 9500,
    },
    {
      speaker: 'buddy',
      buddy_name: '阿璃',
      content: `合理的。我整理一下：D1抵达日+宽窄巷子+火锅，D2熊猫基地（早8点）+东郊记忆，D3武侯祠+锦里夜景，D4都江堰或三星堆二选一，D5老街茶馆+人民公园+返程。预算${budget}足够。`,
      timestamp: ts + 12000,
    },
  ];
}

// ── Travel style options ───────────────────────────────────────────────────────

const TRAVEL_STYLE_OPTIONS = [
  '随性自由，不爱做攻略',
  '行前规划，精确到分钟',
  '慢走漫行，喜欢安静的地方',
  '暴走打卡，热门景点全要',
  '深度体验，拒绝走马观花',
];

const BUDGET_OPTIONS = [
  '2000-4000元',
  '4000-6000元',
  '6000-10000元',
  '10000元以上',
];

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Form field components ──────────────────────────────────────────────────────

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MatchPage() {
  const navigate = useNavigate();

  // Trip preference form
  const [destination, setDestination] = useState('成都');
  const [startDate, setStartDate] = useState('2024-07-15');
  const [endDate, setEndDate] = useState('2024-07-19');
  const [budget, setBudget] = useState('4000-6000元');
  const [travelStyle, setTravelStyle] = useState('随性自由，不爱做攻略');

  // UI state
  const [selectedBuddyNames, setSelectedBuddyNames] = useState<Set<string>>(
    new Set(['小满', '阿璃', '小拾']),
  );
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [negotiationKey, setNegotiationKey] = useState(0); // force remount

  // Derived
  const selectedBuddies = MOCK_BUDDIES.filter((b) => selectedBuddyNames.has(b.name));

  const handleBuddyToggle = (buddy: Buddy) => {
    setSelectedBuddyNames((prev) => {
      const next = new Set(prev);
      if (next.has(buddy.name)) {
        if (next.size > 1) next.delete(buddy.name); // keep at least 1
      } else {
        next.add(buddy.name);
      }
      return next;
    });
  };

  const datesLabel = startDate && endDate
    ? `${startDate} ~ ${endDate}`
    : '选择日期';

  const negotiationMessages: NegotiationMessage[] = showNegotiation
    ? buildNegotiationMsgs(destination, datesLabel, budget, travelStyle, Array.from(selectedBuddyNames))
    : [];

  const mockResult: MatchResult = {
    destination,
    dates: `${startDate} ~ ${endDate}`,
    budget,
    consensus: true,
    plan: [
      `D1 抵达日 → 宽窄巷子 + 火锅`,
      `D2 熊猫基地（早8点）→ 东郊记忆 → 夜景`,
      `D3 武侯祠 → 锦里夜景`,
      `D4 都江堰 或 三星堆（二选一）`,
      `D5 老街茶馆 → 人民公园鹤鸣茶社 → 返程`,
    ],
    matched_buddies: Array.from(selectedBuddyNames),
  };

  const handleStartNegotiation = () => {
    setShowNegotiation(true);
    setNegotiationKey((k) => k + 1);
    // Scroll to negotiation section
    setTimeout(() => {
      document.getElementById('negotiation-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 px-4 py-8 dark:from-gray-950 dark:to-purple-950 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              找搭子
            </h1>
            <p className="text-xs text-gray-400">发现与你契合的旅行伙伴</p>
          </div>
        </div>

        {/* ── Step 1: Trip preferences ── */}
        <Section
          title="设置你的旅行偏好"
          subtitle="AI 会根据这些信息为你匹配合适的搭子"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Destination */}
            <Field label="目的地" icon={<MapPin className="h-3.5 w-3.5" />}>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="例如：成都、重庆、西安"
                className="
                  w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
                  text-sm text-gray-800 placeholder-gray-300
                  focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
                  dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-600
                  dark:focus:border-purple-500 dark:focus:ring-purple-900
                "
              />
            </Field>

            {/* Dates */}
            <Field label="出行日期" icon={<Calendar className="h-3.5 w-3.5" />}>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="
                    flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5
                    text-xs text-gray-800
                    focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
                    dark:border-gray-700 dark:bg-gray-800 dark:text-white
                    dark:focus:border-purple-500 dark:focus:ring-purple-900
                  "
                />
                <span className="text-xs text-gray-300">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="
                    flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5
                    text-xs text-gray-800
                    focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
                    dark:border-gray-700 dark:bg-gray-800 dark:text-white
                    dark:focus:border-purple-500 dark:focus:ring-purple-900
                  "
                />
              </div>
            </Field>

            {/* Budget */}
            <Field label="预算范围" icon={<Wallet className="h-3.5 w-3.5" />}>
              <div className="relative">
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="
                    w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
                    text-sm text-gray-800
                    focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
                    dark:border-gray-700 dark:bg-gray-800 dark:text-white
                    dark:focus:border-purple-500 dark:focus:ring-purple-900
                  "
                >
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>

            {/* Travel style */}
            <Field label="旅行风格" icon={<Zap className="h-3.5 w-3.5" />}>
              <div className="relative">
                <select
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="
                    w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
                    text-sm text-gray-800
                    focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100
                    dark:border-gray-700 dark:bg-gray-800 dark:text-white
                    dark:focus:border-purple-500 dark:focus:ring-purple-900
                  "
                >
                  {TRAVEL_STYLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Step 2: Matched buddies ── */}
        <Section
          title={`为你匹配了 ${MOCK_BUDDIES.length} 位搭子`}
          subtitle="点击卡片可取消选择，至少保留一位"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {MOCK_BUDDIES.map((buddy) => (
              <BuddyCard
                key={buddy.name}
                buddy={buddy}
                selected={selectedBuddyNames.has(buddy.name)}
                onSelect={handleBuddyToggle}
              />
            ))}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="h-3.5 w-3.5" />
            已选择 {selectedBuddyNames.size} 位搭子，将与他们协商行程
          </p>
        </Section>

        {/* ── Step 3: Start negotiation ── */}
        {!showNegotiation ? (
          <button
            onClick={handleStartNegotiation}
            disabled={selectedBuddyNames.size === 0}
            className={`
              group relative flex w-full items-center justify-center gap-2 rounded-2xl py-4
              px-6 text-base font-bold transition-all duration-200
              ${selectedBuddyNames.size === 0
                ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 hover:scale-[1.01] active:scale-[0.99] dark:shadow-purple-900/30 dark:hover:shadow-purple-800/50'
              }
            `}
          >
            <Zap className="h-5 w-5" />
            <span>开始协商行程</span>
            {!showNegotiation && (
              <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            )}
          </button>
        ) : (
          <div id="negotiation-section" className="space-y-4">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
                搭子协商中...
              </h2>
            </div>

            {/* Negotiation log (keyed to force remount on new negotiation) */}
            <NegotiationLog
              key={negotiationKey}
              messages={negotiationMessages}
              result={mockResult}
            />
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 dark:text-gray-600">
          TwinBuddy · AI 搭子匹配 · 隐私优先
        </p>
      </div>
    </div>
  );
}
