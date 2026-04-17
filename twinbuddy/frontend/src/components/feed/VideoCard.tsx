import React from 'react';
import { Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import type { VideoItem, Buddy } from '../../types';
import { MBTI_LABELS } from '../../types';

type EventHandler = (e: React.MouseEvent) => void;

interface Props {
  item: VideoItem;
  onLike: EventHandler;
  onComment: EventHandler;
  onShare: EventHandler;
  onTwinCard: EventHandler;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

// ── Interaction Bar ───────────────────────────────────

function InteractionBar({
  liked,
  likeCount,
  commentCount,
  shareCount,
  onLike,
  onComment,
  onShare,
  onTwinCard,
}: Omit<Props, 'item'>) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-primary/30 to-neon-secondary/20 border-2 border-neon-primary/40 flex items-center justify-center text-2xl shadow-glow-primary">
        🌈
      </div>

      {/* Like */}
      <button
        onClick={onLike}
        className={`btn-icon ${liked ? 'liked animate-heart-burst' : ''}`}
        aria-label="点赞"
      >
        <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
      </button>
      <span className="text-xs text-neon-text-secondary">{likeCount}</span>

      {/* Comment */}
      <button onClick={onComment} className="btn-icon" aria-label="评论">
        <MessageCircle className="w-6 h-6" />
      </button>
      <span className="text-xs text-neon-text-secondary">{commentCount}</span>

      {/* Share */}
      <button onClick={onShare} className="btn-icon" aria-label="分享">
        <Share2 className="w-6 h-6" />
      </button>
      <span className="text-xs text-neon-text-secondary">{shareCount}</span>

      {/* TwinCard trigger */}
      <button
        onClick={onTwinCard}
        className="flex flex-col items-center gap-0.5 mt-2 group"
        aria-label="懂你卡片"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-tertiary/30 to-neon-primary/20 border border-neon-tertiary/40 flex items-center justify-center group-hover:shadow-glow-tertiary transition-all duration-200">
          <Sparkles className="w-5 h-5 text-neon-tertiary" />
        </div>
        <span className="text-[10px] text-neon-tertiary font-medium">懂你</span>
      </button>
    </div>
  );
}

// ── Video Card ────────────────────────────────────────

export function VideoCard({
  item,
  onLike,
  onComment,
  onShare,
  onTwinCard,
  liked,
  likeCount,
  commentCount,
  shareCount,
}: Props) {
  const buddy: Buddy | undefined = item.buddy;

  return (
    <div className="feed-item relative overflow-hidden">
      {/* Background cover */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.cover_url})` }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-neon-bg/30" />
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-4 right-16 z-10">
        {buddy && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="mbti-badge">{buddy.mbti}</span>
              <span className="text-xs text-white/60">{MBTI_LABELS[buddy.mbti]}</span>
            </div>
            <p className="text-white font-bold text-lg">{buddy.name}</p>
            <p className="text-white/70 text-sm mt-0.5">{buddy.travel_style}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {buddy.typical_phrases.slice(0, 2).map((phrase) => (
                <span key={phrase} className="text-xs text-white/50 bg-white/10 rounded-full px-2 py-0.5">
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}

        {!buddy && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/60 text-sm">{item.location}</span>
            </div>
            <p className="text-white font-bold text-xl leading-tight">{item.title}</p>
          </div>
        )}
      </div>

      {/* Right interaction bar */}
      <div className="absolute right-3 bottom-24 z-10">
        <InteractionBar
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
    </div>
  );
}
