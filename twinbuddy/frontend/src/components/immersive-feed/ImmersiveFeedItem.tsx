import React, { useRef, useEffect } from 'react';
import type { VideoItem } from '../../types';
import { RadarChartCard, LocalRadarData } from './RadarChartCard';
import { ChatHistoryOverlay, ChatMessage } from './ChatHistoryOverlay';

export interface ImmersiveFeedItemProps {
  item: VideoItem;
  isActive: boolean;
  radarData?: LocalRadarData;
  messages?: ChatMessage[];
  onReject?: () => void;
  onAccept?: () => void;
  onChatExpand?: () => void;
  isLoading?: boolean;
}

export const ImmersiveFeedItem: React.FC<ImmersiveFeedItemProps> = ({
  item,
  isActive,
  radarData,
  messages,
  onReject,
  onAccept,
  onChatExpand,
  isLoading
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive) {
      if (item.type === 'video' && videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(e => console.log('Auto-play blocked:', e));
      }
    } else {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive, item]);

  return (
    <div className="relative h-screen w-screen overflow-hidden dark-screen snap-start shrink-0">
      {/* Background (Video or Image) */}
      <div className="absolute inset-0 z-0">
        {item.type === 'video' ? (
          <video 
            ref={videoRef}
            src={item.video_url}
            poster={item.cover_url}
            className="w-full h-full object-cover" 
            loop
            playsInline
          />
        ) : (
          <img 
            src={item.cover_url} 
            className="w-full h-full object-cover" 
            alt={item.title} 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-[#0B1C15] z-10"></div>
      </div>

      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-4 pt-6 pb-2 w-full absolute top-0 z-40 text-white/70 text-[17px] font-medium drop-shadow-md">
        <button className="p-2 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-2xl font-light">menu</span>
        </button>
        <div className="flex-1 flex gap-5 overflow-x-auto no-scrollbar items-center px-4">
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">团购</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">经验</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">北京</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">关注</span>
          <span className="whitespace-nowrap cursor-pointer hover:text-white transition-colors">商城</span>
          <div className="flex flex-col items-center cursor-pointer text-white font-semibold relative">
            <span>推荐</span>
            <div className="h-[2px] w-5 bg-white rounded-full mt-1"></div>
          </div>
        </div>
        <button className="p-2 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-2xl font-light">search</span>
        </button>
      </nav>

      {/* Data Layers over Video */}
      <main className="relative z-20 h-full w-full overflow-y-auto pb-48 no-scrollbar scroll-smooth">
        <div className="px-4 max-w-md mx-auto w-full mt-24">
          
          <div className="mb-6 flex flex-col pt-4">
            <h1 className="text-white text-2xl font-bold font-headline leading-tight drop-shadow-lg">
              {item.title || `${item.location}之旅`}
            </h1>
            {item.buddy && (
              <p className="text-white/80 text-sm mt-1">与 {item.buddy.name} {item.buddy.avatar_emoji} 匹配的行程</p>
            )}
          </div>

          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-white/20 border-t-[#4ade80] rounded-full animate-spin mb-4" />
                <p className="text-white/60 text-sm">正在与搭子协商细节...</p>
             </div>
          ) : (
            <>
              {/* Radar and Match Cards container */}
              <RadarChartCard data={radarData} />
              
              {/* Chat Overlay */}
              {messages && messages.length > 0 && (
                <ChatHistoryOverlay messages={messages} onExpand={onChatExpand} />
              )}
            </>
          )}

        </div>
      </main>

      {/* Action Buttons */}
      {!isLoading && (
        <div className="absolute bottom-[110px] left-0 w-full px-6 flex gap-4 z-40 pointer-events-auto">
          <button 
            onClick={onReject}
            className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-[15px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-colors"
          >
            不感兴趣
          </button>
          <button 
            onClick={onAccept}
            className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-[15px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-colors"
          >
            去看看详情
          </button>
        </div>
      )}
    </div>
  );
};
