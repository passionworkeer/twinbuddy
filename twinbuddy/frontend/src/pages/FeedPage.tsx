import { useState, useCallback, useRef, useEffect } from 'react';
import { TikTokVideo } from '../components/feed/TikTokVideo';
import BottomNav from '../components/feed/BottomNav';
import { TwinCard } from '../components/twin-card/TwinCard';
import type { VideoItem, NegotiationResult } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../types';

// ── API Client ────────────────────────────────────────

const API_BASE = 'http://localhost:8000';

async function fetchWithTimeout(url: string, ms = 3000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeed(city?: string): Promise<VideoItem[]> {
  const url = city
    ? `${API_BASE}/api/feed?city=${encodeURIComponent(city)}`
    : `${API_BASE}/api/feed`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: { success: boolean; data: VideoItem[] } = await res.json();
  if (!json.success) throw new Error('API success=false');
  return json.data;
}

async function fetchNegotiation(
  destination: string,
  buddy_mbti?: string,
): Promise<NegotiationResult> {
  const res = await fetchWithTimeout(`${API_BASE}/api/negotiate`, 8000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: { success: boolean; data: NegotiationResult } = await res.json();
  if (!json.success) throw new Error('Negotiate API success=false');
  return { ...json.data, destination, ...(buddy_mbti ? { buddy_mbti } : {}) };
}

// ── Mock Videos (real local files) ─────────────────

const MOCK_VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    type: 'video',
    cover_url: '/images/chengdu.jpg',
    video_url: '/videos/3a25a0d3ce7e5939c065f297e17b461d_裁剪版.mp4',
    location: '成都',
    title: '成都火锅的正确打开方式',
    description: '以成都宽窄巷子经典历史街巷、红灯笼与传统川西庭院为主线，串联古建筑群落、绿树掩映的石板小径以及幽静的茶馆与地道小吃摊位，融合了清代川西民居风格与现代都市生活气息，多幽深庭院、青砖黛瓦、精美木雕和花鸟画廊，文化氛围浓厚、节奏悠闲流畅。这里是感受成都"慢生活"精髓的最佳去处，漫步其间可品尝正宗川菜火锅、听街头川剧、逛老字号店铺，还能体验老成都的市井烟火气与文艺气质完美融合。',
    buddy: {
      name: '小雅',
      mbti: 'ENFP',
      avatar_emoji: '🌈',
      typical_phrases: ['说走就走！', '这也太美了吧！'],
      travel_style: '随性探索型',
      compatibility_score: 92,
    },
  },
  {
    id: 'v2',
    type: 'video',
    cover_url: '/images/chuanxi.jpg',
    video_url: '/videos/40f98311ef12a26d5bb92ffb668a7029_裁剪版.mp4',
    location: '川西',
    title: '川西小环线自驾日记',
    description: '以川西雪山与广袤草原为主线，串联高山牧场、藏式村落与起伏草甸段落，多开阔山谷、碎石小径和野花遍野的高原景观，视野极致开阔、节奏壮阔磅礴。这里拥有四姑娘山、贡嘎雪峰等雄伟雪山，康定草原上飘荡的藏歌，以及独特的藏族唐卡、酥油茶文化和牦牛牧民生活，是中国最美的高原风光圣地之一。',
    buddy: {
      name: '小鱼',
      mbti: 'INFP',
      avatar_emoji: '🌙',
      typical_phrases: ['这里好安静', '我们慢慢走'],
      travel_style: '诗意漫游者',
      compatibility_score: 88,
    },
  },
  {
    id: 'v3',
    type: 'video',
    cover_url: '/images/dali.jpg',
    video_url: '/videos/7c2e35507979c9cedd5f558bfc33d674.mp4',
    location: '大理',
    title: '洱海边的日落',
    description: '以大理洱海与古城墙、苍山为主线，串联湖岸古道、山麓林径与白族村落段落，多碧波荡漾的湖水，白墙黛瓦的民居和苍山十九峰的壮丽背景，湖光山色交辉、节奏诗意舒缓。这里是云南最浪漫的旅行胜地，拥有"高原明珠"洱海、千年白族古城、大理国历史遗迹和风花雪月四景。',
    buddy: {
      name: '阿泽',
      mbti: 'INTJ',
      avatar_emoji: '🏔️',
      typical_phrases: ['计划好了', '按部就班'],
      travel_style: '精密计划型',
      compatibility_score: 76,
    },
  },
  {
    id: 'v4',
    type: 'video',
    cover_url: '/images/lijiang.jpg',
    video_url: '/videos/842636456c2fe795f0e186a012984110.mp4',
    location: '丽江',
    title: '古城夜景',
    description: '以丽江古城夜景与灯火水道、纳西古建筑为主线，串联石板街巷、山景夜径与古桥流水段落，多彩灯倒影、木楼飞檐和玉龙雪山远景，氛围梦幻浪漫、节奏轻快灵动。这里是联合国世界文化遗产，拥有千年纳西东巴文化、独特的水车与小桥流水景观、酒吧街的夜生活。',
    buddy: {
      name: '苗苗',
      mbti: 'ESFP',
      avatar_emoji: '🎭',
      typical_phrases: ['太浪漫了！', '快拍快拍！'],
      travel_style: '舞台明星型',
      compatibility_score: 83,
    },
  },
  {
    id: 'v5',
    type: 'video',
    cover_url: '/images/qingdao.jpg',
    video_url: '/videos/9b39ec3f9eef4dd5ce7856d95048de03.mp4',
    location: '青岛',
    title: '海边日落巡航',
    description: '以青岛海滨沙滩与德式红顶建筑为主线，串联海岸线、山海交汇段落与啤酒文化街区，多金色沙滩、碧蓝海浪和欧式风情建筑，视野开阔、节奏轻松惬意。这里是"东方瑞士"，拥有德国殖民时期遗留的红瓦绿树建筑、栈桥与八大关别墅区、崂山道教文化和闻名世界的青岛啤酒。',
    buddy: {
      name: '阳哥',
      mbti: 'ESTP',
      avatar_emoji: '🌊',
      typical_phrases: ['走！', '下一个目的地！'],
      travel_style: '活力冒险型',
      compatibility_score: 79,
    },
  },
  {
    id: 'v6',
    type: 'video',
    cover_url: '/images/chongqing.jpg',
    video_url: '/videos/a54607e868cf9bb618ae181b773b6e32_裁剪版.mp4',
    location: '重庆',
    title: '山城的夜',
    description: '以重庆洪崖洞与山城立体夜景、长江为主线，串联层层叠叠的灯光街道、江岸夜道与悬崖栈道段落，多霓虹高楼、火锅烟火气和立体城市景观，视觉冲击强烈、节奏震撼激昂。这里是"8D魔幻城市"，拥有洪崖洞的千层灯海、长江索道、解放碑商圈和火锅文化。',
    buddy: {
      name: '小雪',
      mbti: 'ISFJ',
      avatar_emoji: '❄️',
      typical_phrases: ['注意安全', '我帮你拿'],
      travel_style: '暖心守护型',
      compatibility_score: 85,
    },
  },
  {
    id: 'v7',
    type: 'video',
    cover_url: '/images/xian.jpg',
    video_url: '/videos/d8b9eaa06194ea9b49c46a3691aec26f_裁剪版.mp4',
    location: '西安',
    title: '大唐不夜城',
    description: '以西安大唐不夜城与唐风宫殿、古城墙为主线，串联灯市古街、历史建筑与大雁塔广场段落，多金碧辉煌的宫灯、石板大道和盛唐文化再现，历史氛围浓郁、节奏庄重华丽。这里是西安最梦幻的夜游地标，复原了大唐盛世建筑群、丝绸之路文化元素和不夜城灯会。',
    buddy: {
      name: '阿文',
      mbti: 'ENTP',
      avatar_emoji: '🎭',
      typical_phrases: ['你有没有想过', '这个角度不一样'],
      travel_style: '智趣探索型',
      compatibility_score: 90,
    },
  },
  {
    id: 'v8',
    type: 'video',
    cover_url: '/images/xiamen.jpg',
    video_url: '/videos/抖音2026417-371186_裁剪版.mp4',
    location: '厦门',
    title: '鼓浪屿漫步',
    description: '以厦门鼓浪屿殖民风建筑与海岛海岸为主线，串联热带绿植小径、海滨栈道与钢琴博物馆段落，多彩色洋房、碧海蓝天和异国风情小巷，浪漫清新、节奏悠然自在。这里是"音乐之岛"，拥有万国建筑博览群、钢琴博物馆、闽南文化与海鲜美食。',
    buddy: {
      name: '小岛',
      mbti: 'INFP',
      avatar_emoji: '🏝️',
      typical_phrases: ['好惬意', '这种感觉真好'],
      travel_style: '慢生活型',
      compatibility_score: 91,
    },
  },
];

// ── Mock Stats ──────────────────────────────────────

const MOCK_LIKE_COUNTS: Record<string, number> = {
  v1: 2847, v2: 1532, v3: 982, v4: 3421, v5: 1203, v6: 2156, v7: 876, v8: 445,
};

const MOCK_COMMENT_COUNTS: Record<string, number> = {
  v1: 342, v2: 218, v3: 156, v4: 489, v5: 201, v6: 334, v7: 167, v8: 89,
};

const MOCK_SHARE_COUNTS: Record<string, number> = {
  v1: 89, v2: 67, v3: 45, v4: 134, v5: 78, v6: 92, v7: 34, v8: 28,
};

// ── Negotiation Mock ────────────────────────────────

const MOCK_NEGOTIATION: NegotiationResult = {
  destination: '大理',
  dates: '5月10日-5月15日',
  budget: '人均3500元',
  consensus: true,
  plan: ['洱海边民宿2晚', '古城内民宿3晚', '环洱海骑行1天', '苍山徒步半日'],
  matched_buddies: ['小雅', '小鱼'],
  radar: [
    { dimension: '行程节奏', user_score: 90, buddy_score: 45, weight: 0.8 },
    { dimension: '美食偏好', user_score: 85, buddy_score: 80, weight: 0.6 },
    { dimension: '拍照风格', user_score: 75, buddy_score: 95, weight: 0.5 },
    { dimension: '预算控制', user_score: 60, buddy_score: 90, weight: 0.7 },
    { dimension: '冒险精神', user_score: 95, buddy_score: 55, weight: 0.9 },
  ],
  red_flags: [],
  messages: [
    { speaker: 'user', content: '我想每天换个地方住，体验不同民宿！', timestamp: 1700000000 },
    { speaker: 'buddy', content: '我更想在一个地方多待几天，慢下来感受', timestamp: 1700000010 },
    { speaker: 'user', content: '那我们折中一下，住两家不同风格民宿怎么样？', timestamp: 1700000020 },
    { speaker: 'buddy', content: '好！一家洱海边，一家古城内，完美', timestamp: 1700000030 },
    { speaker: 'user', content: '就这么说定！', timestamp: 1700000040 },
  ],
};

// ── TwinCard Overlay ─────────────────────────────────

function TwinCardOverlay({
  result,
  onClose,
  onConfirm,
}: {
  result: NegotiationResult;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="懂你卡片"
    >
      <div className="w-full max-w-md pb-8 px-4 animate-slide-up">
        <TwinCard
          result={result}
          userName="你的数字人"
          buddyName="搭子的数字人"
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
}

// ── Feed Page ────────────────────────────────────────

export default function FeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedVideos, setFeedVideos] = useState<VideoItem[]>(MOCK_VIDEOS);
  const [likedItems, setLikedItems] = useLocalStorage<Record<string, boolean>>(
    STORAGE_KEYS.onboarding,
    {},
  );
  const [showTwinCard, setShowTwinCard] = useState(false);
  const [negotiationResult, setNegotiationResult] = useState<NegotiationResult | null>(null);
  const [cardsSeen, setCardsSeen] = useLocalStorage<string[]>(
    STORAGE_KEYS.twin_cards_seen,
    [],
  );

  const feedRef = useRef<HTMLDivElement>(null);

  // Fetch feed from API on mount, fallback to MOCK_VIDEOS on error
  useEffect(() => {
    let cancelled = false;
    fetchFeed()
      .then((data) => {
        if (!cancelled) setFeedVideos(data);
      })
      .catch((err) => {
        console.error('[FeedPage] fetchFeed failed, using mock data:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const triggerTwinCard = useCallback(() => {
    if (!cardsSeen.includes('twin1')) {
      setCardsSeen((prev) => [...prev, 'twin1']);
      setTimeout(() => setShowTwinCard(true), 300);
    }
  }, [cardsSeen, setCardsSeen]);

  const handleScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / window.innerHeight);
    setCurrentIndex(index);
    if (index >= 2 && !cardsSeen.includes('twin1')) {
      triggerTwinCard();
    }
  }, [cardsSeen, triggerTwinCard]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Initial twin card
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cardsSeen.includes('twin1')) {
        setCardsSeen((prev) => [...prev, 'twin1']);
        setShowTwinCard(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = useCallback((id: string) => {
    setLikedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, [setLikedItems]);

  const handleComment = useCallback((_id: string) => {
    // TODO: comment modal
  }, []);

  const handleShare = useCallback((_id: string) => {
    // TODO: native share
  }, []);

  const handleTwinCard = useCallback((id: string) => {
    const video = feedVideos.find((v) => v.id === id);
    const destination = video?.location ?? '大理';
    const buddy_mbti = video?.buddy?.mbti;

    // Fetch negotiation result from API, fallback to MOCK_NEGOTIATION
    fetchNegotiation(destination, buddy_mbti)
      .then((result) => {
        setNegotiationResult(result);
        setShowTwinCard(true);
      })
      .catch((err) => {
        console.error('[FeedPage] fetchNegotiation failed, using mock:', err);
        setNegotiationResult(MOCK_NEGOTIATION);
        setShowTwinCard(true);
      });
  }, [feedVideos]);

  const handleTwinCardConfirm = useCallback(() => {
    setShowTwinCard(false);
    setTimeout(() => {
      window.location.href = '/result';
    }, 800);
  }, []);

  return (
    <div className="relative">
      {/* Feed */}
      <div ref={feedRef} className="feed-container">
        {feedVideos.map((item, index) => (
          <TikTokVideo
            key={item.id}
            videoUrl={item.video_url}
            buddy={item.buddy}
            location={item.location}
            title={item.title}
            description={item.description}
            likeCount={MOCK_LIKE_COUNTS[item.id] ?? 0}
            commentCount={MOCK_COMMENT_COUNTS[item.id] ?? 0}
            shareCount={MOCK_SHARE_COUNTS[item.id] ?? 0}
            liked={!!likedItems[item.id]}
            isActive={currentIndex === index}
            onLike={() => handleLike(item.id)}
            onComment={() => handleComment(item.id)}
            onShare={() => handleShare(item.id)}
            onTwinCard={() => handleTwinCard(item.id)}
          />
        ))}
      </div>

      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-white/5 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-neon-primary to-neon-secondary/60 transition-all duration-300 shadow-[0_0_8px_rgba(255,179,182,0.6)]"
          style={{ width: `${((currentIndex + 1) / feedVideos.length) * 100}%` }}
        />
      </div>

      {/* TwinCard Overlay */}
      {showTwinCard && (
        <TwinCardOverlay
          result={negotiationResult ?? MOCK_NEGOTIATION}
          onClose={() => setShowTwinCard(false)}
          onConfirm={handleTwinCardConfirm}
        />
      )}

      <BottomNav />
    </div>
  );
}
