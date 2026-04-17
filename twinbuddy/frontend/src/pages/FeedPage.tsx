import { useState, useCallback, useRef, useEffect } from 'react';
import { VideoCard } from '../components/feed/VideoCard';
import BottomNav from '../components/feed/BottomNav';
import { TwinCard } from '../components/twin-card/TwinCard';
import type { VideoItem, NegotiationResult } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../types';

// ── Mock Data ─────────────────────────────────────────

const MOCK_VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    type: 'video',
    cover_url: 'https://images.unsplash.com/photo-1537531383496-f4749c6c3aa2?w=800&q=80',
    video_url: '',
    location: '成都',
    title: '成都火锅的正确打开方式',
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
    cover_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    video_url: '',
    location: '川西',
    title: '川西小环线自驾日记',
    buddy: {
      name: '小鱼',
      mbti: 'INFP',
      avatar_emoji: '🌙',
      typical_phrases: ['这里好安静', '我们慢慢走'],
      travel_style: '诗意漫游者',
      compatibility_score: 88,
    },
  },
];

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

// ── TwinCard Overlay ───────────────────────────────────

function TwinCardOverlay({
  result,
  onClose,
  onConfirm,
}: {
  result: NegotiationResult;
  onClose: () => void;
  onConfirm: () => void;
}) {
  // Close on backdrop click
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

// ── Feed Page ──────────────────────────────────────────

export default function FeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedItems, setLikedItems] = useLocalStorage<Record<string, boolean>>(
    STORAGE_KEYS.video_likes,
    {},
  );
  const [likeCounts] = useState<Record<string, number>>({
    v1: 2847,
    v2: 1532,
    twin1: 0,
  });
  const [commentCounts] = useState<Record<string, number>>({ v1: 342, v2: 218, twin1: 0 });
  const [shareCounts] = useState<Record<string, number>>({ v1: 89, v2: 67, twin1: 0 });

  const [showTwinCard, setShowTwinCard] = useState(false);
  const [cardsSeen, setCardsSeen] = useLocalStorage<string[]>(
    STORAGE_KEYS.twin_cards_seen,
    [],
  );

  const feedRef = useRef<HTMLDivElement>(null);

  // Show twin card after 2nd video
  const triggerTwinCard = useCallback(() => {
    if (!cardsSeen.includes('twin1')) {
      setCardsSeen((prev) => [...prev, 'twin1']);
      setTimeout(() => setShowTwinCard(true), 300);
    }
  }, [cardsSeen, setCardsSeen]);

  // Handle snap scroll
  const handleScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / window.innerHeight);
    setCurrentIndex(index);
    if (index >= 2 && !cardsSeen.includes('twin1')) {
      triggerTwinCard();
    }
  }, [cardsSeen, triggerTwinCard]);

  // Attach scroll listener
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Initial twin card trigger after mount
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

  const handleLike = useCallback(() => {
    // Like handled by VideoCard internal state
  }, []);

  const handleComment = useCallback(() => {
    // Future: open comment modal
  }, []);

  const handleShare = useCallback(() => {
    // Future: native share API
  }, []);

  const handleTwinCard = useCallback(() => {
    setShowTwinCard(true);
  }, []);

  const handleTwinCardConfirm = useCallback(() => {
    setShowTwinCard(false);
    // Navigate to result after short delay
    setTimeout(() => {
      window.location.href = '/result';
    }, 800);
  }, []);

  const items: VideoItem[] = [
    ...MOCK_VIDEOS,
    {
      id: 'twin1',
      type: 'twin_card',
      cover_url: '',
      video_url: '',
      location: '大理',
      title: '懂你卡片 · 大理之约',
      buddy: MOCK_VIDEOS[0].buddy,
    },
  ];

  return (
    <div className="relative">
      {/* Feed container */}
      <div
        ref={feedRef}
        className="feed-container"
      >
        {items.map((item) => (
          <VideoCard
            key={item.id}
            item={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onTwinCard={handleTwinCard}
            liked={!!likedItems[item.id]}
            likeCount={likeCounts[item.id] ?? 0}
            commentCount={commentCounts[item.id] ?? 0}
            shareCount={shareCounts[item.id] ?? 0}
          />
        ))}
      </div>

      {/* Scroll progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-white/5">
        <div
          className="h-full bg-neon-primary/60 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* TwinCard Overlay */}
      {showTwinCard && (
        <TwinCardOverlay
          result={MOCK_NEGOTIATION}
          onClose={() => setShowTwinCard(false)}
          onConfirm={handleTwinCardConfirm}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
