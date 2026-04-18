import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, Wallet, Heart, ArrowRight, RotateCcw } from 'lucide-react';
import { RadarChart } from '../components/twin-card/RadarChart';
import type { RadarData, NegotiationResult } from '../types';
import { STORAGE_KEYS } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ── Mock Result ───────────────────────────────────────

const MOCK_RESULT: NegotiationResult = {
  destination: '大理',
  dates: '5月10日-5月15日',
  budget: '人均3500元',
  consensus: true,
  plan: [
    '洱海边民宿2晚 — 早起看日出，骑车环湖',
    '古城内民宿3晚 — 慢节奏，逛集市、泡咖啡馆',
    '环洱海骑行1天 — S弯、廊桥、喜洲古镇',
    '苍山徒步半日 — 清碧溪路线，难度适中',
  ],
  matched_buddies: ['小雅', '小鱼'],
  radar: [
    { dimension: '行程节奏', user_score: 90, buddy_score: 45, weight: 0.8 },
    { dimension: '美食偏好', user_score: 85, buddy_score: 80, weight: 0.6 },
    { dimension: '拍照风格', user_score: 75, buddy_score: 95, weight: 0.5 },
    { dimension: '预算控制', user_score: 60, buddy_score: 90, weight: 0.7 },
    { dimension: '冒险精神', user_score: 95, buddy_score: 55, weight: 0.9 },
  ] as RadarData[],
  red_flags: [],
  messages: [
    { speaker: 'user', content: '我想每天换个地方住，体验不同民宿！', timestamp: 1700000000 },
    { speaker: 'buddy', content: '我更想在一个地方多待几天，慢下来感受', timestamp: 1700000010 },
    { speaker: 'user', content: '那我们折中一下，住两家不同风格民宿怎么样？', timestamp: 1700000020 },
    { speaker: 'buddy', content: '好！一家洱海边，一家古城内，完美', timestamp: 1700000030 },
    { speaker: 'user', content: '就这么说定！', timestamp: 1700000040 },
  ],
};

// ── Confetti Particle ──────────────────────────────────

function Confetti() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#ffb3b6', '#affffb', '#eec224', '#a78bfa', '#34d399'][i % 5],
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="-rotate-90" width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={64}
          cy={64}
          r={r}
          fill="none"
          stroke="#ffb3b6"
          strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,179,182,0.6))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-neon-text">{score}</span>
        <span className="text-xs text-neon-text-secondary">兼容度</span>
      </div>
    </div>
  );
}

// ── Result Page ────────────────────────────────────────

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [cardsSeen] = useLocalStorage<string[]>(STORAGE_KEYS.twin_cards_seen, []);
  const [storedResult] = useLocalStorage<NegotiationResult | null>(
    STORAGE_KEYS.negotiation_result,
    null,
  );

  const locationState = location.state as { result?: NegotiationResult } | null;
  const resultData = locationState?.result ?? storedResult ?? MOCK_RESULT;

  // Calculate overall score from radar
  const totalWeight = resultData.radar.reduce((sum: number, d: RadarData) => sum + d.weight, 0);
  const avgScore = Math.round(
    totalWeight > 0
      ? resultData.radar.reduce(
          (sum: number, d: RadarData) => sum + (d.user_score + d.buddy_score) / 2 * d.weight,
          0,
        ) / totalWeight
      : 0,
  );

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleRetry = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-neon-bg flex flex-col pb-24">
      {/* Confetti */}
      {visible && <Confetti />}

      {/* Header */}
      <div className="sticky top-0 z-10 glass-panel-strong border-b border-white/8 px-4 py-3">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-neon-text">搭子匹配结果</h1>
            <p className="text-xs text-neon-text-secondary">TwinBuddy 数字人协商</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-neon-tertiary" />
            <span className="text-xs text-neon-tertiary font-semibold">
              {cardsSeen.length} 张卡片已解锁
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`mx-auto max-w-md w-full px-4 pt-6 space-y-6 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* Hero */}
        <div className="text-center space-y-3 animate-page-enter">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-primary/20 to-neon-secondary/20 border-2 border-neon-primary/30 flex items-center justify-center text-4xl shadow-glow-primary">
              ✨
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neon-secondary/20 border border-neon-secondary/40 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-neon-secondary fill-current" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gradient-primary">
              搭子已就位！
            </h2>
            <p className="mt-1 text-sm text-neon-text-secondary">
              你的数字人和对方已完成协商
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="glass-panel p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <ScoreRing score={avgScore} />
          <div className="mt-4 flex justify-center gap-3">
            {resultData.matched_buddies.map((name) => (
              <div key={name} className="flex items-center gap-1.5 text-sm text-neon-text-secondary">
                <div className="w-5 h-5 rounded-full bg-neon-primary/10 border border-neon-primary/20 flex items-center justify-center text-xs">
                  ✦
                </div>
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Info */}
        <div className="glass-panel p-4 flex items-center justify-around stagger-children">
          <div className="flex flex-col items-center gap-1">
            <MapPin className="w-5 h-5 text-neon-secondary" />
            <span className="text-sm font-semibold text-neon-text">{resultData.destination}</span>
            <span className="text-xs text-neon-text-secondary">目的地</span>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5 text-neon-secondary" />
            <span className="text-sm font-semibold text-neon-text">{resultData.dates}</span>
            <span className="text-xs text-neon-text-secondary">出发日期</span>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="flex flex-col items-center gap-1">
            <Wallet className="w-5 h-5 text-neon-secondary" />
            <span className="text-sm font-semibold text-neon-text">{resultData.budget}</span>
            <span className="text-xs text-neon-text-secondary">预算</span>
          </div>
        </div>

        {/* Radar */}
        <div className="glass-panel p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold text-neon-text-secondary mb-4 text-center uppercase tracking-widest">
            兼容性分析
          </h3>
          <RadarChart data={resultData.radar} size={200} />
        </div>

        {/* Plan */}
        <div className="glass-panel p-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-neon-text-secondary mb-4 uppercase tracking-widest">
            行程安排
          </h3>
          <div className="space-y-3">
            {resultData.plan.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-primary/10 border border-neon-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-neon-primary font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-neon-text leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-neon-text-disabled pb-4">
          数字人已完成协商 · 等待你们的真实故事
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/8 glass-panel-strong px-4 py-4 z-50">
        <div className="mx-auto max-w-md flex gap-3">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-neon-text-secondary hover:text-neon-text hover:border-white/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            重新开始
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-primary to-neon-primary-dark py-3.5 text-sm font-bold text-neon-bg shadow-glow-primary hover:opacity-90 active:scale-[0.98] transition-all">
            <Heart className="w-4 h-4" />
            联系搭子
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
