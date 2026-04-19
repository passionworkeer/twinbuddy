import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/feed/BottomNav';
import { TikTokVideo } from '../components/feed/TikTokVideo';
import { TwinMatchModal } from '../components/immersive-feed/TwinMatchModal';
import type { VideoItem, NegotiationResult, NegotiationReportSnapshots } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnboarding } from '../hooks/useOnboarding';
import { usePrecomputedMatch } from '../hooks/usePrecomputedMatch';
import { useCardBuddyPool } from '../hooks/useCardBuddyPool';
import { STORAGE_KEYS } from '../types';
import { negotiate } from '../api/client';
import { createReportId } from '../utils/reportId';
import { RotateCcw } from 'lucide-react';
import MOCK_VIDEOS from '../mocks/videos.json';
import MOCK_NEGOTIATIONS from '../mocks/negotiations.json';

const MOCK_SCENE_CARDS = [
  { id: 'chengdu', location: '成都', title: '成都宽窄巷子茶馆', image: '/images/chengdu.jpg' },
  { id: 'chongqing', location: '重庆', title: '重庆洪崖洞夜景', image: '/images/chongqing.jpg' },
  { id: 'chuanxi', location: '川西', title: '川西雪山草地自驾', image: '/images/chuanxi.jpg' },
  { id: 'dali', location: '大理', title: '大理洱海骑行', image: '/images/dali.jpg' },
  { id: 'lijiang', location: '丽江', title: '丽江古城漫步', image: '/images/lijiang.jpg' },
  { id: 'qingdao', location: '青岛', title: '青岛海边吹风', image: '/images/qingdao.jpg' },
  { id: 'xiamen', location: '厦门', title: '厦门鼓浪屿发呆', image: '/images/xiamen.jpg' },
  { id: 'xian', location: '西安', title: '大唐不夜城夜色', image: '/images/xian.jpg' },
] as unknown as VideoItem[];

import { chooseLocationCardTriggerCount } from '../utils/feedFlow';

function shuffleVideos(videos: VideoItem[]): VideoItem[] {
  const next = [...videos];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

// 根据用户 MBTI 和目的地查找匹配的 mock 数据
type MockNegotiationRecord = {
  pair_id: string;
  user_mbti: string;
  buddy_mbti: string;
  destination: string;
  radar: NegotiationResult['radar'];
  red_flags: NegotiationResult['red_flags'];
  messages: NegotiationResult['messages'];
  consensus: boolean;
  dates: string;
  budget: string;
  plan: NegotiationResult['plan'];
};

function findMockNegotiation(userMbti: string, destination: string): NegotiationResult | null {
  const records = MOCK_NEGOTIATIONS as MockNegotiationRecord[];
  // 精确匹配
  const exact = records.find(r => r.user_mbti === userMbti && r.destination === destination);
  if (exact) return { ...exact, matched_buddies: [] };
  // 按目的地匹配
  const byDest = records.filter(r => r.destination === destination);
  if (byDest.length > 0) return { ...byDest[0], matched_buddies: [] };
  // 没有匹配数据时，保留用户选择的 destination，只替换其他字段
  if (records.length > 0) {
    const fallback = records[Math.floor(Math.random() * records.length)];
    return {
      ...fallback,
      destination, // 保留用户选择的城市
      matched_buddies: [],
    };
  }
  return null;
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedVideos, setFeedVideos] = useState<VideoItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchResult, setMatchResult] = useState<NegotiationResult | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [matchBackground, setMatchBackground] = useState<VideoItem | null>(null);
  const [lastTriggerVideoIndex, setLastTriggerVideoIndex] = useState(0);
  const [nextTriggerInterval, setNextTriggerInterval] = useState(() => chooseLocationCardTriggerCount());
  const [matchedBuddy, setMatchedBuddy] = useState<{
    name: string;
    mbti: string;
    avatar_emoji: string;
    travel_style: string;
    compatibility_score: number;
  } | null>(null);

  const [, setNegotiationReports] = useLocalStorage<NegotiationReportSnapshots>(
    STORAGE_KEYS.negotiation_reports,
    {},
  );
  const [, setLatestReportId] = useLocalStorage<string | null>(
    STORAGE_KEYS.latest_report_id,
    null,
  );
  const [, setStoredNegotiationResult] = useLocalStorage<NegotiationResult | null>(
    STORAGE_KEYS.negotiation_result,
    null,
  );

  const { clearData, data: onboardingData } = useOnboarding();
  const { getPrecomputed, clearPrecomputed } = usePrecomputedMatch();
  const { pool: cardBuddyPool, index: cardBuddyIndex, currentBuddy, advanceIndex, initPool } = useCardBuddyPool();
  const feedRef = useRef<HTMLDivElement>(null);

  // 用 ref 存储最新的值，避免闭包 stale 问题
  const cardBuddyPoolRef = useRef(cardBuddyPool);
  useEffect(() => { cardBuddyPoolRef.current = cardBuddyPool; }, [cardBuddyPool]);
  const lastTriggerRef = useRef(lastTriggerVideoIndex);
  useEffect(() => { lastTriggerRef.current = lastTriggerVideoIndex; }, [lastTriggerVideoIndex]);
  const nextIntervalRef = useRef(nextTriggerInterval);
  useEffect(() => { nextIntervalRef.current = nextTriggerInterval; }, [nextTriggerInterval]);
  const triggerMatchRef = useRef<((options?: { isAuto?: boolean }) => void) | null>(null);

  const handleRestart = useCallback(() => {
    if (confirm('确定要重新测试吗？这将清除当前数据。')) {
      clearPrecomputed();
      clearData();
      navigate('/onboarding');
    }
  }, [clearData, clearPrecomputed, navigate]);

  useEffect(() => {
    async function loadFeed() {
      // 视频直接用本地 mock，随机播放
      setFeedVideos(shuffleVideos([...(MOCK_VIDEOS as VideoItem[])]));
      setIsFeedLoading(false);
    }
    loadFeed();
  }, []);

  const handleScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

    // 滚动到底部附近：追加新一轮随机视频（无限循环）
    if (isNearBottom && !isFeedLoading) {
      setFeedVideos(prev => [...prev, ...shuffleVideos([...(MOCK_VIDEOS as VideoItem[])])]);
    }

    const index = Math.round(scrollTop / clientHeight);
    setCurrentIndex(index);

    // ── 自动触发判断 ─────────────────────────────────────
    if (
      !isNegotiating &&
      !showMatchModal &&
      feedVideos.length > 0 &&
      index - lastTriggerRef.current >= nextIntervalRef.current
    ) {
      lastTriggerRef.current = index;
      setLastTriggerVideoIndex(index);
      setNextTriggerInterval(chooseLocationCardTriggerCount());
      triggerMatchRef.current?.({ isAuto: true });
    }
  }, [isFeedLoading, isNegotiating, showMatchModal, feedVideos.length]);

  useEffect(() => {
    if (isFeedLoading) return;
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isFeedLoading]);

  const triggerMatch = useCallback(async (options?: { isAuto?: boolean }) => {
    if (isNegotiating || showMatchModal || feedVideos.length === 0) return;

    // 从搭子池取搭子（用 ref 读取最新数据）
    let buddy = cardBuddyPoolRef.current.length > 0 ? cardBuddyPoolRef.current[cardBuddyIndex] : null;

    // 1. 优先使用预计算数据中的搭子（onboarding期间预计算好的）
    const precomputed = getPrecomputed();

    // Determine the background/location based on precomputed or user's choice or fallback
    // 优先使用 onboardingData.city（用户最新选择），其次 precomputed.destination，最后随机
    let bgLocation = MOCK_SCENE_CARDS[Math.floor(Math.random() * MOCK_SCENE_CARDS.length)];
    const userLocation = onboardingData?.city || precomputed?.destination;

    console.log('[triggerMatch] 城市匹配调试:', {
      precomputed,
      onboardingCity: onboardingData?.city,
      userLocation,
    });

    if (userLocation) {
      const match = MOCK_SCENE_CARDS.find(c => c.id === userLocation || c.location === userLocation);
      if (match) {
        bgLocation = match;
        console.log('[triggerMatch] 匹配到用户选择:', bgLocation.location);
      } else {
        console.log('[triggerMatch] 未找到匹配的卡片，使用随机:', bgLocation.location);
      }
    } else {
      console.log('[triggerMatch] 没有用户选择，使用随机:', bgLocation.location);
    }

    setMatchBackground({
      id: bgLocation.id,
      location: bgLocation.location,
      title: bgLocation.title,
      cover_url: (bgLocation as any).image,
    } as any);

    // 自动触发时推进池子 index（手动触发不推进）
    if (options?.isAuto) {
      advanceIndex();
    }

    setShowMatchModal(true);

    // 立即显示搭子预览
    if (buddy) {
      setMatchedBuddy({
        name: buddy.name || '神秘搭子',
        mbti: buddy.mbti || 'ENFP',
        avatar_emoji: buddy.avatar_emoji || '👋',
        travel_style: buddy.travel_style || '',
        compatibility_score: buddy.compatibility_score || 80,
      });
    } else if (precomputed?.topBuddy) {
      const precomputedBuddy = precomputed.topBuddy as any;
      setMatchedBuddy({
        name: precomputedBuddy.name || '神秘搭子',
        mbti: precomputedBuddy.mbti || 'ENFP',
        avatar_emoji: precomputedBuddy.avatar_emoji || '👋',
        travel_style: precomputedBuddy.travel_style || '',
        compatibility_score: precomputedBuddy.compatibility_score || 80,
      });
    } else {
      // 默认搭子
      setMatchedBuddy({
        name: '小满',
        mbti: 'ENFP',
        avatar_emoji: '😊',
        travel_style: '随性探索型',
        compatibility_score: 85,
      });
    }

    setIsNegotiating(true);
    setTimeout(() => {
      // 直接使用 mock 数据，不调用 API
      const mockRecord = findMockNegotiation(
        onboardingData?.mbti || 'ENFP',
        bgLocation.location
      );
      // 如果没有匹配的 mock 数据，生成默认结果
      const finalResult = mockRecord || {
        destination: bgLocation.location,
        dates: '5月10日-5月15日',
        budget: '人均3500元',
        consensus: true,
        plan: ['风景优先', '轻徒步', '特色民宿'],
        matched_buddies: ['小满'],
        radar: [
          { dimension: '行程节奏', user_score: 85, buddy_score: 80, weight: 0.8 },
          { dimension: '美食偏好', user_score: 80, buddy_score: 85, weight: 0.6 },
          { dimension: '拍照风格', user_score: 90, buddy_score: 75, weight: 0.5 },
          { dimension: '预算控制', user_score: 70, buddy_score: 75, weight: 0.7 },
          { dimension: '冒险精神', user_score: 85, buddy_score: 90, weight: 0.9 },
        ],
        red_flags: [],
        messages: [
          { speaker: 'user', content: '我们周末去旅行吧！', timestamp: 1700000000 },
          { speaker: 'buddy', content: '听起来不错！我也想出去走走。', timestamp: 1700000010 },
          { speaker: 'user', content: '那就说定了！', timestamp: 1700000020 },
          { speaker: 'buddy', content: '好的，期待这次旅行！', timestamp: 1700000030 },
        ],
      };
      setMatchResult(finalResult);
      setIsNegotiating(false);
    }, 1500);
  }, [cardBuddyIndex, feedVideos, isNegotiating, showMatchModal, onboardingData, getPrecomputed]);

  // 同步 triggerMatchRef
  useEffect(() => {
    triggerMatchRef.current = triggerMatch;
  }, [triggerMatch]);

  // ── mount 时初始化搭子池 ────────────────────────────────
  useEffect(() => {
    if (!isFeedLoading) {
      initPool(onboardingData ?? null);
    }
  }, [isFeedLoading, onboardingData, initPool]);

  const persistNegotiationResult = useCallback((result: NegotiationResult): string => {
    const reportId = createReportId();
    setNegotiationReports((prev) => ({
      ...prev,
      [reportId]: result,
    }));
    setLatestReportId(reportId);
    setStoredNegotiationResult(result);
    return reportId;
  }, [setLatestReportId, setNegotiationReports, setStoredNegotiationResult]);

  const handleMatchConfirm = useCallback(() => {
    if (!matchResult) return;
    const reportId = persistNegotiationResult(matchResult);
    setTimeout(() => {
      navigate('/result', { state: { result: matchResult, reportId } });
    }, 200);
  }, [matchResult, navigate, persistNegotiationResult]);

  const displayVideos = feedVideos.length > 0 ? feedVideos : MOCK_VIDEOS as VideoItem[];

  if (isFeedLoading) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/20 border-t-[#4ade80] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white h-[100dvh] w-[100vw] overflow-hidden flex flex-col relative relative">
      <button
        onClick={handleRestart}
        className="fixed top-[120px] right-4 z-50 p-2 rounded-full bg-black/40 backdrop-blur-xl hover:bg-black/60 transition-colors pointer-events-auto"
        title="重新测试"
      >
        <RotateCcw className="w-4 h-4 text-white/90" />
      </button>

      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,44px)] pb-2 w-full absolute top-0 z-40 text-white/90 text-[16px] drop-shadow-md pointer-events-none">
        <button className="p-2 flex items-center justify-center text-white pointer-events-auto">
          <span className="material-symbols-outlined text-[28px] font-light">menu</span>
        </button>
        <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar items-center justify-center px-2 pointer-events-auto">
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">团购</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">经验</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">北京</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">关注</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">商城</span>
          <div className="flex flex-col items-center cursor-pointer text-white font-bold relative">
            <span className="whitespace-nowrap text-[17px]">推荐</span>
            <div className="h-[3px] w-6 bg-white rounded-full mt-1.5"></div>
          </div>
        </div>
        <button className="p-2 flex items-center justify-center text-white pointer-events-auto">
          <span className="material-symbols-outlined text-[28px] font-light">search</span>
        </button>
      </nav>

      <div
        ref={feedRef}
        className="flex-1 w-full h-full snap-y snap-mandatory overflow-y-scroll no-scrollbar scroll-smooth"
      >
        {displayVideos.map((item, i) => {
          const isNearActive = Math.abs(currentIndex - i) <= 1;
          return (
            <div key={item.id + i} className="h-full w-full snap-start shrink-0">
              <TikTokVideo
                videoUrl={item.video_url || ''}
                isNearActive={isNearActive}
                buddy={item.buddy}
                location={item.location}
                title={item.title || ''}
                description={item.description}
                likeCount={Math.floor(Math.random() * 50000) + 1000}
                commentCount={Math.floor(Math.random() * 5000) + 100}
                shareCount={Math.floor(Math.random() * 2000) + 50}
                liked={false}
                isActive={currentIndex === i && !showMatchModal}
                onLike={() => {}}
                onComment={() => {}}
                onShare={() => {}}
                onTwinCard={triggerMatch}
              />
            </div>
          );
        })}
      </div>

      <BottomNav />

      {showMatchModal && (
        <TwinMatchModal
          result={matchResult}
          isLoading={isNegotiating}
          onClose={() => {
            setShowMatchModal(false);
          }}
          onConfirm={handleMatchConfirm}
          backgroundItem={matchBackground}
          matchedBuddy={matchedBuddy}
        />
      )}
    </div>
  );
}
