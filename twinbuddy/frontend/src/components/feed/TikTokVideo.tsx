import { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import type { Buddy } from '../../types';
import { MBTI_LABELS } from '../../types';

interface Props {
  videoUrl: string;
  buddy?: Buddy;
  location: string;
  title: string;
  description?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  liked: boolean;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onTwinCard: () => void;
}

// ── Progress Bar ───────────────────────────────────

function ProgressBar({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    video.addEventListener('timeupdate', update);
    return () => video.removeEventListener('timeupdate', update);
  }, [videoRef]);

  return (
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-20">
      <div
        className="h-full bg-neon-primary transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Play/Pause Indicator ────────────────────────────

function PlayIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-pause-fade">
        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[18px] border-r-white border-b-[10px] border-b-transparent mr-1" />
      </div>
    </div>
  );
}

// ── Right Action Bar ────────────────────────────────

function ActionBar({
  liked,
  likeCount,
  commentCount,
  shareCount,
  onLike,
  onComment,
  onShare,
  onTwinCard,
}: Omit<Props, 'videoUrl' | 'buddy' | 'location' | 'title' | 'isActive'>) {
  const fmt = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)}w` : String(n));

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-primary/30 to-neon-secondary/20 border-2 border-neon-primary/40 flex items-center justify-center text-2xl shadow-glow-primary">
        🌈
      </div>

      {/* Like */}
      <button
        onClick={onLike}
        className={`action-btn ${liked ? 'liked' : ''}`}
        aria-label="点赞"
      >
        <Heart
          className={`w-7 h-7 ${liked
            ? 'fill-current text-neon-primary'
            : 'text-white hover:text-neon-primary/80'
          } drop-shadow-lg transition-all duration-150`}
        />
        <span className="text-xs text-white font-medium drop-shadow-md">{fmt(likeCount)}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onComment}
        className="action-btn"
        aria-label="评论"
      >
        <MessageCircle className="w-7 h-7 text-white hover:text-neon-secondary/80 transition-colors duration-150 drop-shadow-lg" />
        <span className="text-xs text-white font-medium drop-shadow-md">{fmt(commentCount)}</span>
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="action-btn"
        aria-label="分享"
      >
        <Share2 className="w-7 h-7 text-white hover:text-neon-secondary/80 transition-colors duration-150 drop-shadow-lg" />
        <span className="text-xs text-white font-medium drop-shadow-md">{fmt(shareCount)}</span>
      </button>

      {/* TwinCard */}
      <button
        onClick={onTwinCard}
        className="flex flex-col items-center gap-0.5 mt-1 group action-btn"
        aria-label="懂你卡片"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-tertiary/40 to-neon-primary/20 border-2 border-neon-tertiary/50 flex items-center justify-center shadow-lg group-hover:shadow-glow-tertiary transition-all duration-200">
          <Sparkles className="w-6 h-6 text-neon-tertiary group-hover:animate-spin-slow transition-transform duration-300" />
        </div>
        <span className="text-[10px] text-neon-tertiary font-bold drop-shadow-md">懂你</span>
      </button>
    </div>
  );
}

// ── Bottom Info Overlay ─────────────────────────────

function BottomInfo({ buddy, location, title, description }: { buddy?: Buddy; location: string; title: string; description?: string }) {
  return (
    <div className="absolute bottom-20 left-4 right-16 z-10">
      {buddy ? (
        <div className="mb-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="mbti-badge">{buddy.mbti}</span>
            <span className="text-xs text-white/60">{MBTI_LABELS[buddy.mbti]}</span>
          </div>
          <p className="text-white font-bold text-xl leading-tight drop-shadow-lg">@{buddy.name}</p>
          <p className="text-white/80 text-sm mt-1 drop-shadow-md">{buddy.travel_style}</p>
          {description && (
            <p className="text-white/60 text-xs mt-1.5 leading-relaxed line-clamp-2 drop-shadow-md">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {buddy.typical_phrases.slice(0, 2).map((phrase) => (
              <span
                key={phrase}
                className="text-xs text-white/70 bg-white/10 rounded-full px-2 py-0.5 backdrop-blur-sm"
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-white/60 text-sm">📍 {location}</span>
          </div>
          <p className="text-white font-bold text-xl leading-tight drop-shadow-lg">{title}</p>
          {description && (
            <p className="text-white/60 text-xs mt-1 leading-relaxed line-clamp-2 drop-shadow-md">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main TikTokVideo Component ──────────────────────

export function TikTokVideo({
  videoUrl,
  buddy,
  location,
  title,
  description,
  likeCount,
  commentCount,
  shareCount,
  liked,
  isActive,
  onLike,
  onComment,
  onShare,
  onTwinCard,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [showPlayIndicator, setShowPlayIndicator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [videoAspect, setVideoAspect] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  const playIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log('[TikTokVideo] Rendered, isActive:', isActive, 'videoUrl:', videoUrl);

  // Detect video orientation
  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth && video.videoHeight) {
      const ratio = video.videoWidth / video.videoHeight;
      if (ratio > 1.1) {
        setVideoAspect('landscape');
      } else if (ratio < 0.9) {
        setVideoAspect('portrait');
      } else {
        setVideoAspect('square');
      }
    }
    setIsLoading(false);
  }, []);

  // Auto-play / pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    console.log('[TikTokVideo] useEffect, video:', !!video, 'videoUrl:', videoUrl, 'isActive:', isActive);
    if (!video || !videoUrl) return;

    if (isActive) {
      // 确保视频元数据加载完成后再播放
      const playVideo = () => {
        console.log('[TikTokVideo] playVideo called');
        video.play().catch((err) => {
          console.warn('[TikTokVideo] playback error:', err.name, err.message);
        });
        setPaused(false);
      };

      // 如果视频已经加载了元数据，立即播放
      if (video.readyState >= 1) {
        playVideo();
      } else {
        // 否则等待元数据加载
        video.addEventListener('loadedmetadata', playVideo, { once: true });
      }
    } else {
      video.pause();
    }
  }, [isActive, videoUrl]);

  const handleTap = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }

    setShowPlayIndicator(true);
    if (playIndicatorTimer.current) clearTimeout(playIndicatorTimer.current);
    playIndicatorTimer.current = setTimeout(() => setShowPlayIndicator(false), 600);
  }, []);

  const handleRetry = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!liked) onLike();
  }, [liked, onLike]);

  // Double-click detection
  const lastTapRef = useRef(0);
  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleClick();
    } else {
      handleTap();
    }
    lastTapRef.current = now;
  }, [handleTap, handleDoubleClick]);

  return (
    <div
      className="feed-item relative overflow-hidden bg-black cursor-pointer"
      onClick={handleClick}
    >
      <ProgressBar videoRef={videoRef} />
      <PlayIndicator visible={showPlayIndicator} />

      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className={`
          absolute
          ${videoAspect === 'landscape'
            ? 'w-full h-full object-contain bg-black'  // 横屏：保持比例，黑色背景
            : 'inset-0 w-full h-full object-cover'    // 竖屏：填充裁剪
          }
        `}
        style={videoAspect === 'landscape' ? { maxHeight: '100%' } : {}}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={handleMetadata}
        onCanPlayThrough={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setLoadError('视频加载失败');
        }}
        onStalled={() => setLoadError('视频加载缓慢，请检查网络')}
        onWaiting={() => {
          if (!loadError) setIsLoading(true);
        }}
        onPlaying={() => {
          setIsLoading(false);
          setLoadError(null);
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 via-40% to-black/10 to-transparent pointer-events-none" />

      {/* Bottom info */}
      <BottomInfo buddy={buddy} location={location} title={title} description={description} />

      {/* Right action bar */}
      <div className="absolute right-3 bottom-24 z-10" onClick={(e) => e.stopPropagation()}>
        <ActionBar
          liked={liked}
          likeCount={likeCount}
          commentCount={commentCount}
          shareCount={shareCount}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onTwinCard={onTwinCard}
        />
      </div>

      {/* Loading spinner — only shown while video is loading and no error */}
      {isLoading && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-10 h-10 border-2 border-white/20 border-t-neon-primary/80 rounded-full animate-spin shadow-glow-primary/50" />
        </div>
      )}

      {/* Error overlay */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 backdrop-blur-sm">
          <p className="text-white/80 text-sm mb-4">{loadError}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRetry();
            }}
            className="px-4 py-2 rounded-full bg-neon-primary/80 text-white text-sm font-medium hover:bg-neon-primary transition-colors"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
}
