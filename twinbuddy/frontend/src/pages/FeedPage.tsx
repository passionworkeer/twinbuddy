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
} from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnboarding } from '../hooks/useOnboarding';
import { STORAGE_KEYS } from '../types';
import { negotiate, fetchBuddies } from '../api/client';
import { createReportId } from '../utils/reportId';
import { RotateCcw } from 'lucide-react';
import MOCK_VIDEOS from '../mocks/videos.json';

const MOCK_SCENE_CARDS = [
  { id: 'sc1', type: 'image', cover_url: '/images/丽江古城夜景.jpg', video_url: '', location: '丽江', title: '丽江古城夜景漫步', description: '主街和支巷分开逛，既有热闹也能留出安静时段。' },
  { id: 'sc2', type: 'image', cover_url: '/images/大唐不夜城.jpg', video_url: '', location: '西安', title: '大唐不夜城夜色', description: '大唐不夜城和周边历史片区分时体验，避免同段拥堵。' },
  { id: 'sc3', type: 'image', cover_url: '/images/川西雪山草原.jpg', video_url: '', location: '川西', title: '川西雪山草原', description: '先保证高质量风景段，再决定是否加码深度点位。' },
  { id: 'sc4', type: 'image', cover_url: '/images/成都宽窄巷子.jpg', video_url: '', location: '成都', title: '成都宽窄巷子', description: '从巷子与茶馆切入，会比打卡清单更像真正的成都。' },
  { id: 'sc5', type: 'image', cover_url: '/images/洱海古城.jpg', video_url: '', location: '大理', title: '大理洱海古城', description: '洱海与古城之间留白体验，比密集打卡更容易出片。' },
  { id: 'sc6', type: 'image', cover_url: '/images/重庆夜景洪崖洞.jpg', video_url: '', location: '重庆', title: '重庆夜景洪崖洞', description: '把夜景和坡地步行拆开体验，体感会轻松很多。' },
  { id: 'sc7', type: 'image', cover_url: '/images/青岛海边.jpg', video_url: '', location: '青岛', title: '青岛海边轻攻略', description: '海边与街区混搭，比单一打卡更有节奏感。' },
  { id: 'sc8', type: 'image', cover_url: '/images/鼓浪屿 – 竖屏版.jpg', video_url: '', location: '厦门', title: '鼓浪屿慢拍路线', description: '街角和海风节奏搭配，适合做轻量深度体验。' }
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
  const feedRef = useRef<HTMLDivElement>(null);

  const handleRestart = useCallback(() => {
    if (confirm('确定要重新测试吗？这将清除当前数据。')) {
      clearData();
      navigate('/onboarding');
    }
  }, [clearData, navigate]);

  useEffect(() => {
    async function loadFeed() {
      // Check if we have preloaded videos in session storage
      const preloadedVideosStr = sessionStorage.getItem('twinbuddy_preloaded_feed');
      
      if (preloadedVideosStr) {
        try {
          const preloadedVideos = JSON.parse(preloadedVideosStr);
          if (Array.isArray(preloadedVideos) && preloadedVideos.length > 0) {
            setFeedVideos(preloadedVideos);
            setIsFeedLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse preloaded videos", e);
        }
      }

      try {
        const buddies = await fetchBuddies(undefined, 8);
        const videosWithBuddies: VideoItem[] = (MOCK_VIDEOS as VideoItem[]).map((tpl, i) => ({
          ...tpl,
          buddy: buddies[i]
            ? {
                name: String(buddies[i].name ?? ''),
                mbti: String(buddies[i].mbti ?? 'ENFP'),
                avatar_emoji: String(buddies[i].avatar_emoji ?? ''),
                typical_phrases: (buddies[i].typical_phrases as string[]) ?? [],
                travel_style: String(buddies[i].travel_style ?? ''),
                compatibility_score: Number((buddies[i] as Record<string, unknown>).compatibility_score ?? 80),
              }
            : undefined,
        }));
        setFeedVideos(shuffleVideos(videosWithBuddies));
      } catch {
        setFeedVideos(shuffleVideos(MOCK_VIDEOS as VideoItem[]));
      } finally {
        setIsFeedLoading(false);
      }
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
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const triggerMatch = useCallback(async () => {
    if (isNegotiating || showMatchModal) return;
    
    // Select random background from 8 mocks
    const randomBg = MOCK_SCENE_CARDS[Math.floor(Math.random() * MOCK_SCENE_CARDS.length)];
    setMatchBackground(randomBg);
    setShowMatchModal(true);
    setIsNegotiating(true);

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.onboarding);
      const obData: OnboardingData | null = stored ? JSON.parse(stored) : null;
      
      const activeVideo = feedVideos[currentIndex] || randomBg;

      const result = await negotiate({
        user_id: obData?.user_id || undefined,
        user_persona_id: obData?.persona_id || undefined,
        buddy_mbti: activeVideo.buddy?.mbti || 'ENFP',
        mbti: obData?.mbti || undefined,
        interests: obData?.interests ?? [],
        voiceText: obData?.voiceText || undefined,
        destination: randomBg.location,
      });
      setMatchResult(result);
    } catch (err) {
      console.error('协商 API 调用失败，使用 Mock 数据:', err);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMatchResult({
        ...MOCK_NEGOTIATION,
        destination: randomBg.location
      });
    } finally {
      setIsNegotiating(false);
    }
  }, [currentIndex, feedVideos, isNegotiating, showMatchModal]);

  // Auto trigger match on the 3rd video (index 2)
  useEffect(() => {
    if (currentIndex >= 2 && !hasAutoTriggered && feedVideos.length > 0) {
      setHasAutoTriggered(true);
      triggerMatch();
    }
  }, [currentIndex, hasAutoTriggered, feedVideos.length, triggerMatch]);

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
