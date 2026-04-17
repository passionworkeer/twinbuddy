import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MessageSquare, MapPin, ArrowLeft, Sparkles } from 'lucide-react';
import { BuddyCard } from '../components/BuddyCard';
import { NegotiationLog } from '../components/NegotiationLog';
import type { Persona, Buddy, NegotiationMessage, MatchResult } from '../types/persona';

const MOCK_BUDDIES: Buddy[] = [
  {
    name: '小满',
    mbti: 'ENFP',
    avatar_prompt: '热情活泼的女生，笑容灿烂',
    typical_phrases: ['这个可以有！', '我们去浪吧！'],
    travel_style: '随性自由',
    compatibility_score: 94,
  },
  {
    name: '阿璃',
    mbti: 'ISTJ',
    avatar_prompt: '沉稳内敛，戴金属框眼镜',
    typical_phrases: ['我查过了', '按计划走'],
    travel_style: '精确到分钟',
    compatibility_score: 87,
  },
  {
    name: '小拾',
    mbti: 'INFP',
    avatar_prompt: '温柔安静，眼神柔和',
    typical_phrases: ['我很喜欢这里', '我们可以坐一会儿吗'],
    travel_style: '慢走漫行',
    compatibility_score: 91,
  },
];

type Stage = 'select' | 'negotiating' | 'result';

function buildNegotiationScript(destination: string, buddy: Buddy): NegotiationMessage[] {
  const now = Date.now();
  const msgs: NegotiationMessage[] = [];

  msgs.push({ speaker: 'user', content: `我们这个假期想去 ${destination}，你感兴趣吗？`, timestamp: now });
  msgs.push({ speaker: 'buddy', buddy_name: buddy.name, content: `${buddy.typical_phrases[0]} 说起来 ${destination}，${buddy.mbti === 'ENFP' ? '我真的超好奇那边有什么好玩的！' : buddy.mbti === 'ISTJ' ? '我已经查过了，机票和酒店价格都在合理区间。' : '嗯……${destination}，这个名字听起来很安静。'}`, timestamp: now + 1000 });

  msgs.push({ speaker: 'user', content: `你喜欢 ${destination} 的哪个方面？`, timestamp: now + 2500 });
  msgs.push({
    speaker: 'buddy', buddy_name: buddy.name,
    content: buddy.mbti === 'ENFP'
      ? `当然是那边的夜生活！听说有很多有特色的小酒吧，还有人文艺术区！对了你预算大概多少？`
      : buddy.mbti === 'ISTJ'
      ? `我比较关注景点的可达性和线路规划。当地交通不太拥堵，适合按计划游览。`
      : `我想找一个有故事感的角落，不是那种网红打卡地。能安静坐一会儿就好。`,
    timestamp: now + 3500,
  });

  msgs.push({ speaker: 'user', content: `预算大概人均 3000-4000`，timestamp: now + 5000 });
  msgs.push({
    speaker: 'buddy', buddy_name: buddy.name,
    content: buddy.mbti === 'ENFP'
      ? `可以！我觉得 4 天 3 晚比较合适，第一天到了可以先去老城区逛逛，第二天报个当地一日游，第三天自由探索！`
      : buddy.mbti === 'ISTJ'
      ? `合理。我做了一个初步方案：Day1 抵达后休整，Day2-3 按区域分批游览，Day4 上午购物/特产，下午返程。时间节点我都确认过了。`
      : `听起来很好。我不介意去哪里，但请在行程里留一些不安排的空白时间给我们。`
    ,
    timestamp: now + 6000,
  });

  return msgs;
}

function buildMatchResult(destination: string, buddy: Buddy): MatchResult {
  const plan = buddy.mbti === 'ISTJ'
    ? [
        'Day 1: 抵达后入住酒店休整，晚间周边轻食散步',
        'Day 2: 按计划游览核心景区 A、景区 B，时间节点已确认',
        'Day 3: 城市探索，上午当地博物馆，下午自由活动',
        'Day 4: 上午特产采购，午餐后返程',
      ]
    : buddy.mbti === 'INFP'
    ? [
        'Day 1: 抵达后漫步老城区，找一家咖啡馆坐下',
        'Day 2: 前往自然人文区，随性漫游，不打卡',
        'Day 3: 找一个安静的地方坐一坐，发呆看书均可',
        'Day 4: 带走一份当地的记忆，踏上归程',
      ]
    : [
        'Day 1: 到达即开玩，去最有烟火气的夜市',
        'Day 2: 探索一切有趣的地方！不设限',
        'Day 3: 报一个当地特色体验 tour，认识新朋友',
        'Day 4: 最后一天了，把最想做的再做一遍！',
      ];
  return {
    destination,
    dates: '5月1日 - 5月4日',
    budget: '人均 3500 元',
    consensus: true,
    plan,
    matched_buddies: [buddy.name],
  };
}

export default function MatchPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const persona = state?.persona as Persona | undefined;

  const [destination, setDestination] = useState('');
  const [stage, setStage] = useState<Stage>('select');
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);

  const handleStartNegotiation = useCallback(async () => {
    if (!destination.trim() || !selectedBuddy) return;
    setIsNegotiating(true);
    setStage('negotiating');
    setIsTyping(true);

    const script = buildNegotiationScript(destination.trim(), selectedBuddy);
    // Show messages progressively with typewriter timing
    const delays = [0, 1000, 2500, 3500, 5000, 6000];
    const msgs: NegotiationMessage[] = [];
    for (let i = 0; i < script.length; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, delays[i] ?? 600));
      msgs.push(script[i]);
      setMessages([...msgs]);
    }
    setIsTyping(false);
    setResult(buildMatchResult(destination.trim(), selectedBuddy));
    setStage('result');
    setIsNegotiating(false);
  }, [destination, selectedBuddy]);

  const handleReset = () => {
    setStage('select');
    setSelectedBuddy(null);
    setMessages([]);
    setResult(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-purple-50 pb-24 dark:from-gray-950 dark:to-purple-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-white">找搭子</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">TwinBuddy Digital Twin</p>
          </div>
          {stage !== 'select' && (
            <button
              onClick={handleReset}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              重新选择
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-6">
        {/* Persona context */}
        {persona && (
          <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-purple-500 dark:text-purple-400">你的数字分身</p>
              <p className="font-bold text-gray-800 dark:text-gray-100">{persona.name ?? '我'} · {persona.mbti_influence ? persona.mbti_influence.match(/[A-Z]{4}/)?.[0] : ''}</p>
            </div>
          </div>
        )}

        {/* Destination input */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <MapPin className="h-4 w-4 text-purple-500" />
            目的地
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              disabled={stage !== 'select'}
              placeholder="例如：厦门、大理、青岛..."
              className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Buddy selection */}
        {stage === 'select' && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              选择搭子
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {MOCK_BUDDIES.map(buddy => (
                <BuddyCard
                  key={buddy.name}
                  buddy={buddy}
                  isSelected={selectedBuddy?.name === buddy.name}
                  onSelect={setSelectedBuddy}
                />
              ))}
            </div>
          </div>
        )}

        {/* Negotiation area */}
        {(stage === 'negotiating' || stage === 'result') && selectedBuddy && (
          <div className="space-y-4">
            {/* Selected buddy summary */}
            <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-white p-4 dark:border-purple-800 dark:bg-gray-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                {selectedBuddy.mbti === 'ISTJ' ? '🧑‍💼' : selectedBuddy.mbti === 'INFP' ? '🌿' : '✨'}
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">{selectedBuddy.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedBuddy.mbti} · {selectedBuddy.travel_style}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{selectedBuddy.compatibility_score}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">契合度</p>
              </div>
            </div>

            {/* Negotiation log */}
            <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-900/80">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <MessageSquare className="h-4 w-4" />
                协商记录
              </p>
              <NegotiationLog
                messages={messages}
                result={result}
                isTyping={isTyping}
              />
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      {stage === 'select' && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200/50 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/90">
          <div className="mx-auto flex max-w-2xl gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-2xl border border-gray-300 px-5 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <button
              onClick={handleStartNegotiation}
              disabled={!destination.trim() || !selectedBuddy}
              className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-40 hover:shadow-2xl hover:shadow-purple-300 active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-5 w-5" />
              <span>与搭子协商</span>
            </button>
          </div>
        </div>
      )}

      {/* Result CTA */}
      {stage === 'result' && result && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200/50 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/90">
          <div className="mx-auto flex max-w-2xl gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-2xl border border-gray-300 px-5 py-3.5 text-sm font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              重新选择
            </button>
            <button
              onClick={() => navigate('/', { state: { persona, matchedBuddy: selectedBuddy, result } })}
              className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-xl hover:shadow-2xl hover:shadow-green-300 active:scale-[0.98] transition-all"
            >
              <MapPin className="h-5 w-5" />
              <span>出发吧！</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
