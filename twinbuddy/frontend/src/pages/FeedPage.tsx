import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/feed/BottomNav';
import { TikTokVideo } from '../components/feed/TikTokVideo';
import { TwinMatchModal } from '../components/immersive-feed/TwinMatchModal';
import type { ChatMessage } from '../components/immersive-feed/ChatHistoryOverlay';
import type {
  VideoItem,
  NegotiationResult,
  OnboardingData,
  NegotiationReportSnapshots,
  PrecomputedMatch,
} from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnboarding } from '../hooks/useOnboarding';
import { usePrecomputedMatch } from '../hooks/usePrecomputedMatch';
import { STORAGE_KEYS } from '../types';
import { negotiate, fetchBuddies } from '../api/client';
import { createReportId } from '../utils/reportId';
import { RotateCcw } from 'lucide-react';
import MOCK_VIDEOS from '../mocks/videos.json';

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

function shuffleVideos(videos: VideoItem[]): VideoItem[] {
  const next = [...videos];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const MOCK_NEGOTIATION: NegotiationResult = {
  destination: '大理',
  dates: '5月10日-5月15日',
  budget: '人均3500元',
  consensus: true,
  plan: ['风景优先', '轻徒步', '特色民宿'],
  matched_buddies: ['小雅', '小鱼'],
  radar: [
    { dimension: '行程节奏', user_score: 90, buddy_score: 85, weight: 0.8 },
    { dimension: '美食偏好', user_score: 85, buddy_score: 80, weight: 0.6 },
    { dimension: '拍照风格', user_score: 75, buddy_score: 95, weight: 0.5 },
    { dimension: '预算控制', user_score: 60, buddy_score: 70, weight: 0.7 },
    { dimension: '冒险精神', user_score: 95, buddy_score: 85, weight: 0.9 },
    { dimension: '随性程度', user_score: 80, buddy_score: 90, weight: 0.8 },
  ],
  red_flags: [],
  messages: [
    { speaker: 'user', content: '这次周末去走个线，风景不错，要不要一起？', timestamp: 1700000000 },
    { speaker: 'buddy', content: '听起来不错！难度大吗？我最近体力还可以，想挑战一下。', timestamp: 1700000010 },
    { speaker: 'user', content: '爬升有点，但竹海那段很舒服的，准备好越野鞋就行。', timestamp: 1700000020 },
    { speaker: 'buddy', content: '好！我这就去准备装备。', timestamp: 1700000030 },
  ],
};

export default function FeedPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedVideos, setFeedVideos] = useState<VideoItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchResult, setMatchResult] = useState<NegotiationResult | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [matchBackground, setMatchBackground] = useState<VideoItem | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

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
  const feedRef = useRef<HTMLDivElement>(null);

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
    const index = Math.round(el.scrollTop / el.clientHeight);
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (isFeedLoading) return;
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isFeedLoading]);

  const triggerMatch = useCallback(async () => {
    if (isNegotiating || showMatchModal || feedVideos.length === 0) return;
    const currentVideo = feedVideos[currentIndex];
    if (!currentVideo) return;

    // 1. 优先使用预计算数据
    const precomputed = getPrecomputed();

    // Determine the background/location based on precomputed or user's choice or fallback
    let bgLocation = MOCK_SCENE_CARDS[Math.floor(Math.random() * MOCK_SCENE_CARDS.length)]; // fallback random
    if (precomputed?.destination) {
      const match = MOCK_SCENE_CARDS.find(c => c.location === precomputed.destination);
      if (match) bgLocation = match;
    } else if (onboardingData?.city) {
      const match = MOCK_SCENE_CARDS.find(c => c.id === onboardingData.city || c.location === onboardingData.city);
      if (match) bgLocation = match;
    }

    setMatchBackground({
      id: bgLocation.id,
      location: bgLocation.location,
      title: bgLocation.title,
      image: (bgLocation as any).image,
    } as any);

    setShowMatchModal(true);

    // 2. 如果预计算已完成，直接使用预计算结果
    if (precomputed?.status === 'ready' && precomputed.negotiationResult) {
      setMatchResult(precomputed.negotiationResult);
      setIsNegotiating(false);
      return;
    }

    // 3. 预计算未完成或失败，实时计算
    setIsNegotiating(true);

    try {
      // 从 localStorage 获取用户 onboarding 数据
      const stored = localStorage.getItem(STORAGE_KEYS.onboarding);
      const obData: OnboardingData | null = stored ? JSON.parse(stored) : null;

      // 获取 top1 搭子（从 100 个搭子中根据用户 MBTI/兴趣匹配）
      let topBuddy = null;
      try {
        const buddies = await fetchBuddies(obData?.user_id, 1);
        topBuddy = (buddies[0] || null) as any;
      } catch (buddyErr) {
        console.error('获取搭子失败:', buddyErr);
      }

      // 真实协商（两个 agent 对话）
      const result = await negotiate({
        user_id: obData?.user_id || undefined,
        user_persona_id: obData?.persona_id || undefined,
        buddy_mbti: topBuddy?.mbti || 'ENFP',
        mbti: obData?.mbti || undefined,
        interests: obData?.interests ?? [],
        voiceText: obData?.voiceText || undefined,
        destination: bgLocation.location,
      });
      setMatchResult(result);
    } catch (err) {
      console.error('协商 API 调用失败，使用 Mock 数据:', err);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMatchResult({
        ...MOCK_NEGOTIATION,
        destination: bgLocation.location
      });
    } finally {
      setIsNegotiating(false);
    }
  }, [currentIndex, feedVideos, isNegotiating, showMatchModal, onboardingData, getPrecomputed]);

  // Auto trigger match on the 3rd or 4th video (index 2 or 3) randomly
  const targetTriggerIndex = useMemo(() => Math.floor(Math.random() * 2) + 2, []);

  useEffect(() => {
    if (currentIndex >= targetTriggerIndex && !hasAutoTriggered && feedVideos.length > 0) {
      setHasAutoTriggered(true);
      triggerMatch();
    }
  }, [currentIndex, hasAutoTriggered, feedVideos.length, triggerMatch, targetTriggerIndex]);

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
        {displayVideos.map((item, i) => (
          <div key={item.id + i} className="h-full w-full snap-start shrink-0">
            <TikTokVideo
              videoUrl={item.video_url || ''}
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
        ))}
      </div>

      <BottomNav />

      {showMatchModal && (
        <TwinMatchModal
          result={matchResult}
          isLoading={isNegotiating}
          onClose={() => setShowMatchModal(false)}
          onConfirm={handleMatchConfirm}
          backgroundItem={matchBackground}
        />
      )}
    </div>
  );
}
