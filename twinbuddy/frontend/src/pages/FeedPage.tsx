import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/feed/BottomNav';
import { ImmersiveFeedItem } from '../components/immersive-feed/ImmersiveFeedItem';
import type { LocalRadarData } from '../components/immersive-feed/RadarChartCard';
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

// ── Video templates (static, buddy data comes from API) ──

const VIDEO_TEMPLATES = [
  {
    id: 'v1',
    type: 'video',
    cover_url: '/images/chengdu.jpg',
    video_url: '/videos/video1.mp4',
    location: '成都',
    title: '成都宽窄巷子慢生活',
  },
  {
    id: 'v2',
    type: 'video',
    cover_url: '/images/chongqing.jpg',
    video_url: '/videos/video2.mp4',
    location: '重庆',
    title: '重庆夜景洪崖洞',
  },
  {
    id: 'v3',
    type: 'video',
    cover_url: '/images/chuanxi.jpg',
    video_url: '/videos/video3.mp4',
    location: '川西',
    title: '川西雪山草原公路片段',
  },
  {
    id: 'v4',
    type: 'video',
    cover_url: '/images/dali.jpg',
    video_url: '/videos/video4.mp4',
    location: '大理',
    title: '洱海古城日落',
  },
];

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

// ── Feed Page ──────────────────────────────────────────

export default function FeedPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedVideos, setFeedVideos] = useState<VideoItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  
  // Negotiation state keyed by index
  const [negotiations, setNegotiations] = useState<Record<number, NegotiationResult>>({});
  const [loadingNegotiations, setLoadingNegotiations] = useState<Record<number, boolean>>({});

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

  // Load buddies from API, then combine with video templates
  useEffect(() => {
    async function loadFeed() {
      try {
        const buddies = await fetchBuddies(undefined, 4);
        const videosWithBuddies: VideoItem[] = VIDEO_TEMPLATES.map((tpl, i) => ({
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
        // Fallback: use templates without buddies
        setFeedVideos(shuffleVideos(VIDEO_TEMPLATES.map(tpl => ({ ...tpl, buddy: undefined }))));
      } finally {
        setIsFeedLoading(false);
      }
    }
    loadFeed();
  }, []);

  const handleScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / window.innerHeight);
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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

  // Load negotiation result for a specific index/video
  const loadNegotiationResultForIndex = useCallback(async (index: number) => {
    if (loadingNegotiations[index] || negotiations[index]) return; // Already loaded or loading
    
    setLoadingNegotiations(prev => ({ ...prev, [index]: true }));
    const activeVideo = feedVideos[index];
    const destination = activeVideo?.location || '大理';
    const buddyMbti = activeVideo?.buddy?.mbti || 'ENFP';

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.onboarding);
      const obData: OnboardingData | null = stored ? JSON.parse(stored) : null;
      const userPersonaId = obData?.persona_id || undefined;

      const result = await negotiate({
        user_id: obData?.user_id || undefined,
        user_persona_id: userPersonaId,
        buddy_mbti: buddyMbti,
        mbti: obData?.mbti || undefined,
        interests: obData?.interests ?? [],
        voiceText: obData?.voiceText || undefined,
        destination,
      });
      setNegotiations(prev => ({ ...prev, [index]: result }));
    } catch (err) {
      console.error('协商 API 调用失败，使用 Mock 数据:', err);
      setNegotiations(prev => ({ ...prev, [index]: MOCK_NEGOTIATION }));
    } finally {
      setLoadingNegotiations(prev => ({ ...prev, [index]: false }));
    }
  }, [feedVideos, loadingNegotiations, negotiations]);

  // Trigger loading when index changes (with a slight debounce so fast swiping doesn't spam)
  useEffect(() => {
    if (feedVideos.length === 0) return;
    const timer = setTimeout(() => {
      loadNegotiationResultForIndex(currentIndex);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [currentIndex, feedVideos, loadNegotiationResultForIndex]);

  const handleTwinCardConfirm = useCallback((index: number) => {
    const finalResult = negotiations[index] || MOCK_NEGOTIATION;
    const reportId = persistNegotiationResult(finalResult);
    setTimeout(() => {
      navigate('/result', { state: { result: finalResult, reportId } });
    }, 200);
  }, [navigate, negotiations, persistNegotiationResult]);

  const handleReject = useCallback(() => {
    if (feedRef.current) {
        feedRef.current.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  }, []);

  const handleChatExpand = useCallback((index: number) => {
    const finalResult = negotiations[index] || MOCK_NEGOTIATION;
    const reportId = persistNegotiationResult(finalResult);
    navigate(`/result/${reportId}/detail`, {
      state: { result: finalResult, reportId, source: 'feed' },
    });
  }, [navigate, negotiations, persistNegotiationResult]);

  const displayVideos = feedVideos.length > 0 ? feedVideos : MOCK_VIDEOS;

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
        className="fixed top-8 right-4 z-50 p-2 rounded-full bg-black/40 backdrop-blur-xl hover:bg-black/60 transition-colors"
        title="重新测试"
      >
        <RotateCcw className="w-4 h-4 text-white/90" />
      </button>

      <div
        ref={feedRef}
        className="flex-1 w-full h-full snap-y snap-mandatory overflow-y-scroll no-scrollbar scroll-smooth"
      >
        {displayVideos.map((item, i) => {
          const negResult = negotiations[i];
          
          let radarData: LocalRadarData | undefined;
          if (negResult) {
            radarData = {
              matchRate: Math.round(item.buddy?.compatibility_score || 85),
              tags: negResult.plan?.slice(0, 3) || ['旅游契合'],
              dimensions: negResult.radar || []
            };
          }

          let messagesData: ChatMessage[] | undefined;
          if (negResult?.messages) {
            messagesData = negResult.messages.map((msg, idx) => ({
              id: idx,
              text: msg.content,
              isSelf: msg.speaker === 'user'
            })).slice(-3); // Show last 3 messages
          }

          return (
            <ImmersiveFeedItem
              key={item.id + i}
              item={item}
              isActive={currentIndex === i}
              isLoading={loadingNegotiations[i]}
              radarData={radarData}
              messages={messagesData}
              onAccept={() => handleTwinCardConfirm(i)}
              onReject={handleReject}
              onChatExpand={() => handleChatExpand(i)}
            />
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
