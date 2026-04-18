import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TikTokVideo } from '../components/feed/TikTokVideo';
import { VideoCard } from '../components/feed/VideoCard';
import BottomNav from '../components/feed/BottomNav';
import { TwinCard } from '../components/twin-card/TwinCard';
import type { VideoItem, NegotiationResult, OnboardingData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnboarding } from '../hooks/useOnboarding';
import { STORAGE_KEYS } from '../types';
import { fetchFeed, negotiate } from '../api/client';
import { RotateCcw } from 'lucide-react';

// ── Mock Data (fallback when API unavailable) ──────────

const MOCK_VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    type: 'video',
    cover_url: 'https://images.unsplash.com/photo-1537531383496-f4749c6c3aa2?w=800&q=80',
    video_url: '/videos/video1.mp4',
    location: '成都',
    title: '川西自驾之旅',
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
    video_url: '/videos/video2.mp4',
    location: '川西',
    title: '成都美食探店',
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
    cover_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    video_url: '/videos/video3.mp4',
    location: '成都',
    title: '成都citywalk',
    buddy: {
      name: '阿泽',
      mbti: 'ESTP',
      avatar_emoji: '☀️',
      typical_phrases: ['冲冲冲！', '这家必去！'],
      travel_style: '行动派',
      compatibility_score: 85,
    },
  },
  {
    id: 'v4',
    type: 'video',
    cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    video_url: '/videos/video4.mp4',
    location: '川西',
    title: '慢节奏生活',
    buddy: {
      name: '小林',
      mbti: 'INFJ',
      avatar_emoji: '🍃',
      typical_phrases: ['慢慢来', '感受当下'],
      travel_style: '深度慢游',
      compatibility_score: 90,
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
  isLoading,
  onClose,
  onConfirm,
}: {
  result: NegotiationResult;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdrop}
        role="dialog"
        aria-modal="true"
        aria-label="加载中"
      >
        <div className="w-full max-w-md pb-24 px-4 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-neon-primary/30 border-t-neon-primary rounded-full animate-spin mb-4" />
          <p className="text-neon-text-secondary text-sm">双数字人协商中...</p>
        </div>
      </div>
    );
  }

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
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedVideos, setFeedVideos] = useState<VideoItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const isFeedLoadingRef = useRef(true);
  isFeedLoadingRef.current = isFeedLoading;
  const [feedError, setFeedError] = useState<string | null>(null);
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
  // Ref to always read current showTwinCard value (avoids stale closure in scroll handler)
  const showTwinCardRef = useRef(showTwinCard);
  showTwinCardRef.current = showTwinCard;
  const [negotiationResult, setNegotiationResult] = useState<NegotiationResult | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [cardsSeen, setCardsSeen] = useLocalStorage<string[]>(
    STORAGE_KEYS.twin_cards_seen,
    [],
  );
  const [, setStoredNegotiationResult] = useLocalStorage<NegotiationResult | null>(
    STORAGE_KEYS.negotiation_result,
    null,
  );

  // 重新测试功能
  const { clearData } = useOnboarding();
  const handleRestart = useCallback(() => {
    if (confirm('确定要重新测试吗？这将清除当前数据。')) {
      clearData();
      navigate('/onboarding');
    }
  }, [clearData, navigate]);

  const feedRef = useRef<HTMLDivElement>(null);

  // 直接使用本地 mock 视频（不调 API）
  useEffect(() => {
    setFeedVideos(MOCK_VIDEOS);
    // 延迟一点设置 isFeedLoading 为 false，确保在 re-render 之后
    setTimeout(() => setIsFeedLoading(false), 0);
  }, []);

  // Show twin card after 2nd video (index >= 2)
  const triggerTwinCard = useCallback(() => {
    if (!showTwinCardRef.current) {
      setCardsSeen((prev) => {
        if (!prev.includes('twin1')) {
          return [...prev, 'twin1'];
        }
        return prev;
      });
      setShowTwinCard(true);
    }
  }, []); // intentionally no deps — reads from ref to avoid stale closure

  // Handle snap scroll
  const handleScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / window.innerHeight);
    setCurrentIndex(index);
    // 滚动到第3个视频时强制显示卡片
    if (index >= 2) {
      triggerTwinCard();
    }
  }, [triggerTwinCard]);

  // Attach scroll listener
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, showTwinCard]);

  // Initial twin card trigger after mount (fallback if no scroll)
  useEffect(() => {
    console.log('[Feed] Timer setup, showTwinCard:', showTwinCard, 'isFeedLoading:', isFeedLoading);
    const timer = setTimeout(() => {
      console.log('[Feed] Timer fired, showTwinCardRef:', showTwinCardRef.current, 'isFeedLoadingRef:', isFeedLoadingRef.current);
      if (!showTwinCardRef.current && !isFeedLoadingRef.current) {
        triggerTwinCard();
      }
    }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load onboarding data for negotiation
  const loadNegotiationResult = useCallback(async (destination: string, buddyMbti: string) => {
    setIsNegotiating(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.onboarding);
      const onboardingData: OnboardingData | null = stored ? JSON.parse(stored) : null;
      const userPersonaId = onboardingData?.persona_id || undefined;

      const result = await negotiate({
        user_id: onboardingData?.user_id || undefined,
        user_persona_id: userPersonaId,
        buddy_mbti: buddyMbti,
        mbti: onboardingData?.mbti || undefined,
        interests: onboardingData?.interests ?? [],
        voiceText: onboardingData?.voiceText || undefined,
        destination,
      });
      setNegotiationResult(result);
      setStoredNegotiationResult(result);
    } catch (err) {
      console.error('协商 API 调用失败，使用 Mock 数据:', err);
      setNegotiationResult(MOCK_NEGOTIATION);
      setStoredNegotiationResult(MOCK_NEGOTIATION);
    } finally {
      setIsNegotiating(false);
    }
  }, [setStoredNegotiationResult]);

  // When TwinCard overlay is opened, load real negotiation result
  const handleTwinCard = useCallback(() => {
    setShowTwinCard(true);
    // Find the twin_card item to get destination and buddy MBTI
    const twinItem = feedVideos.find((v) => v.type === 'twin_card');
    const destination = twinItem?.location || 'dali';
    const buddyMbti = twinItem?.buddy?.mbti || 'ENFP';
    loadNegotiationResult(destination, buddyMbti);
  }, [feedVideos, loadNegotiationResult]);

  const handleTwinCardConfirm = useCallback(() => {
    const finalResult = negotiationResult ?? MOCK_NEGOTIATION;
    setStoredNegotiationResult(finalResult);
    setShowTwinCard(false);
    setNegotiationResult(finalResult);
    setTimeout(() => {
      navigate('/result', { state: { result: finalResult } });
    }, 200);
  }, [navigate, negotiationResult, setStoredNegotiationResult]);

  // Use API feed data, fallback to mock
  const displayVideos = feedVideos.length > 0 ? feedVideos : MOCK_VIDEOS;
  console.log('[Feed] displayVideos count:', displayVideos.length, 'types:', displayVideos.map(v => v.type));

  // Build items list: videos + twin_card
  const twinCardItem: VideoItem = {
    id: 'twin1',
    type: 'twin_card',
    cover_url: '',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    location: '大理',
    title: '懂你卡片 · 大理之约',
    buddy: displayVideos[0]?.buddy,
  };

  const items: VideoItem[] = [...displayVideos, twinCardItem];

  // Show loading skeleton on first load
  if (isFeedLoading) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neon-primary/30 border-t-neon-primary rounded-full animate-spin" />
          <p className="text-neon-text-secondary text-sm">正在加载搭子...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Feed container */}
      <div
        ref={feedRef}
        className="feed-container"
      >
        {feedError && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-30 bg-neon-primary/20 text-neon-primary text-xs px-3 py-1.5 rounded-full">
            {feedError}
          </div>
        )}
        {/* 重新测试按钮 */}
        <button
          onClick={handleRestart}
          className="fixed top-4 right-4 z-30 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          title="重新测试"
        >
          <RotateCcw className="w-4 h-4 text-neon-text-secondary" />
        </button>
        {items.map((item, index) =>
          item.type === 'twin_card' ? (
            <VideoCard
              key={item.id}
              item={item}
              onLike={() => {}}
              onComment={() => {}}
              onShare={() => {}}
              onTwinCard={handleTwinCard}
              liked={!!likedItems[item.id]}
              likeCount={likeCounts[item.id] ?? 0}
              commentCount={commentCounts[item.id] ?? 0}
              shareCount={shareCounts[item.id] ?? 0}
            />
          ) : (
            <TikTokVideo
              key={item.id}
              videoUrl={item.video_url || ''}
              buddy={item.buddy}
              location={item.location}
              title={item.title}
              liked={!!likedItems[item.id]}
              isActive={currentIndex === index}
              likeCount={likeCounts[item.id] ?? 0}
              commentCount={commentCounts[item.id] ?? 0}
              shareCount={shareCounts[item.id] ?? 0}
              onLike={() => {}}
              onComment={() => {}}
              onShare={() => {}}
              onTwinCard={handleTwinCard}
            />
          ),
        )}
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
          result={negotiationResult ?? MOCK_NEGOTIATION}
          isLoading={isNegotiating}
          onClose={() => {
            setShowTwinCard(false);
            setNegotiationResult(null);
          }}
          onConfirm={handleTwinCardConfirm}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
