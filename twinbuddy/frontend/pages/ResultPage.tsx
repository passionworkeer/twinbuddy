import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Shield, BarChart2, RotateCcw } from 'lucide-react';
import { PersonaCard } from '../components/PersonaCard';
import type { Persona } from '../types/persona';

// ── Keyword watermark for atmospheric decoration ────────────────────────────
const KEYWORD_SHADOW_LINES = [
  '深夜食堂 · 树洞 · 未寄出',
  '山海 · 红豆 · 同桌',
  '七里香 · 三分糖 · 第二杯半价',
  '公路旅行 · 猫 · 跑步',
  '逆风如解意 · 召唤师',
];

// ── Keyword-powered poetic footer ───────────────────────────────────────────
const POETIC_CLOSINGS = [
  '也许在某个深夜食堂，我们找到了那个愿意一起三分糖的人',
  '山海有相逢，红豆寄相思，愿你找到那个愿意一起公路旅行的同桌',
  '七里香飘，未寄出的信，愿树洞懂你，召唤师寻见懂你的马',
  '谷雨时节，工位之外，愿有人陪你跑步，猫在膝上',
];

function getClosingLine(persona?: Persona): string {
  const idx = persona ? Math.abs(persona.mbti_influence?.length ?? 0) % POETIC_CLOSINGS.length : 0;
  return POETIC_CLOSINGS[idx];
}

// Hard-rules layer rendered as special cards
function HardRulesCard({ rules }: { rules: string[] }) {
  if (!rules?.length) return null;
  return (
    <div className="rounded-2xl border-2 border-red-400 bg-gradient-to-br from-red-50 to-orange-50 p-5 dark:from-red-950/40 dark:to-orange-950/40">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">🚫</span>
        <div>
          <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-300">
            硬规则
          </span>
          <span className="ml-1 text-xs text-red-500 font-medium">⚠ 不可违反</span>
        </div>
      </div>
      <ul className="space-y-2">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const bg = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <BarChart2 className={`h-5 w-5 ${color}`} />
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">置信度</span>
          <span className={`text-sm font-bold ${color}`}>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${bg}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          基于 {score >= 0.8 ? '高质量多源数据' : score >= 0.6 ? '中等质量数据' : '有限数据'} 推断
        </p>
      </div>
    </div>
  );
}

function DataSourceBadge({ sources }: { sources: string[] }) {
  const labelMap: Record<string, string> = {
    douyin_json: '抖音数据',
    mbti_txt: 'MBTI 测试',
    chat_logs: '聊天记录',
    photo: '个人照片',
  };
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300"
        >
          {s === 'douyin_json' && '📱'}
          {s === 'mbti_txt' && '🧠'}
          {s === 'chat_logs' && '💬'}
          {s === 'photo' && '📷'}
          {labelMap[s] ?? s}
        </span>
      ))}
    </div>
  );
}

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const persona = state?.persona as Persona | undefined;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!persona) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 px-4">
        <p className="text-gray-500 dark:text-gray-400">未找到人格数据，请先上传文件</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-white font-semibold hover:bg-purple-600 transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> 返回上传
        </button>
      </div>
    );
  }

  const layerCards = [
    { layer: 0, data: persona.identity, isLayer0: false },
    { layer: 1, data: persona.speaking_style },
    { layer: 2, data: persona.emotion_decision },
    { layer: 3, data: persona.social_behavior },
    { layer: 4, data: { emoji: '🧳', title: '旅行风格', content: persona.travel_style } },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 pb-24 dark:from-gray-950 dark:to-purple-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">人格分析报告</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">TwinBuddy Digital Twin</p>
          </div>
          <ConfidenceMeter score={persona.confidence_score} />
        </div>
      </div>

      {/* Decorative keyword watermark (background layer) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {KEYWORD_SHADOW_LINES.map((line, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 text-center"
            style={{
              top: `${15 + i * 14}%`,
              opacity: 0.025,
              fontSize: `${0.75 + (i % 3) * 0.15}rem`,
              letterSpacing: '0.3em',
              color: '#ffb3b6',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              paddingLeft: '1rem',
              paddingRight: '1rem',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div className={`mx-auto max-w-2xl space-y-6 px-4 pt-6 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ position: 'relative', zIndex: 1 }}>

        {/* Soul fingerprint */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center text-white shadow-xl">
          <p className="text-sm font-medium opacity-80">灵魂指纹</p>
          <p className="mt-2 text-lg font-bold leading-relaxed italic">
            "{persona.soul_fingerprint}"
          </p>
        </div>

        {/* Hard rules */}
        <HardRulesCard rules={persona.layer0_hard_rules} />

        {/* MBTI influence */}
        {persona.mbti_influence && (
          <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
            <p className="mb-1 text-xs font-bold text-blue-600 dark:text-blue-400">MBTI 如何影响你的行为</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{persona.mbti_influence}</p>
          </div>
        )}

        {/* Persona layer cards */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="px-2">人格画像 · 5层模型</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </h2>
          {layerCards.map((card, i) => (
            <PersonaCard
              key={card.layer}
              layer={card.layer}
              data={card.data}
              isLayer0={card.isLayer0}
              delay={i * 120}
            />
          ))}
        </div>

        {/* Data sources */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">数据来源</p>
          <DataSourceBadge sources={persona.data_sources_used} />
        </div>

        {/* Keyword-powered poetic closing */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-200/20 bg-gradient-to-br from-purple-50/5 to-pink-50/5 px-6 py-5 text-center dark:from-purple-950/20 dark:to-pink-950/20">
          {/* Keyword tags floating */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {['深夜食堂', '树洞', '七里香', '三分糖', '公路旅行', '红豆', '未寄出', '召唤师', '逆风如解意'].map((kw, i) => (
              <span
                key={kw}
                aria-hidden="true"
                className="absolute text-xs font-medium"
                style={{
                  top: `${10 + (i * 37) % 75}%`,
                  left: `${5 + (i * 53) % 85}%`,
                  opacity: 0.12,
                  color: i % 3 === 0 ? '#ffb3b6' : i % 3 === 1 ? '#affffb' : '#eec224',
                  fontSize: `${0.6 + (i % 4) * 0.08}rem`,
                  letterSpacing: '0.1em',
                }}
              >
                {kw}
              </span>
            ))}
          </div>
          <p className="relative text-sm italic leading-relaxed text-purple-200/80 dark:text-purple-300/70">
            {getClosingLine(persona)}
          </p>
          <p className="relative mt-2 text-xs text-purple-300/40 dark:text-purple-400/30">
            TwinBuddy · Hackathon Edition
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200/50 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-2xl border border-gray-300 px-5 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> 重新上传
          </button>
          <button
            onClick={() => navigate('/match', { state: { persona } })}
            className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 active:scale-[0.98] transition-all"
          >
            <Heart className="h-5 w-5" />
            <span>开始找搭子</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
