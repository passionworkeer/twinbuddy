import React, { useState, useEffect } from 'react';
import type { VideoItem, NegotiationResult, Buddy } from '../../types';
import { RadarChartCard, LocalRadarData } from './RadarChartCard';
import { ChatHistoryOverlay, ChatMessage } from './ChatHistoryOverlay';
import { FullChatHistory } from './FullChatHistory';

interface TwinMatchModalProps {
  result: NegotiationResult | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  backgroundItem: VideoItem | null; // One of the 8 mock images + desc
}

export const TwinMatchModal: React.FC<TwinMatchModalProps> = ({
  result,
  isLoading,
  onClose,
  onConfirm,
  backgroundItem
}) => {
  const [chatExpanded, setChatExpanded] = useState(false);

  // If loading, show the glassmorphic spinner
  if (isLoading || !result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1C15] overflow-hidden">
         {/* Background image blurred slightly to show we are loading a match */}
         {backgroundItem && (
           <div className="absolute inset-0 z-0">
             <img 
               src={backgroundItem.cover_url} 
               className="w-full h-full object-cover blur-sm opacity-50" 
               alt="" 
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-[#0B1C15]"></div>
           </div>
         )}
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-[#4ade80] rounded-full animate-spin mb-4" />
            <p className="text-white/80 font-medium text-sm tracking-widest animate-pulse">正在与可能的搭子对暗号...</p>
         </div>
      </div>
    );
  }

  const radarData: LocalRadarData = {
    matchRate: Math.round(
       // Use matched_buddies scores or default to 85. We can approximate compatibility by picking random near 90 or reading dimension
       result.radar?.reduce((acc, curr) => acc + (curr.user_score + curr.buddy_score) / 2, 0) / (result.radar?.length || 1) || 88
    ),
    tags: result.plan?.slice(0, 3) || ['旅游契合'],
    dimensions: result.radar || []
  };

  const messagesData: ChatMessage[] = result.messages?.map((msg, idx) => ({
    id: idx,
    text: msg.content,
    isSelf: msg.speaker === 'user'
  })) || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-[100vw] overflow-hidden animate-slide-up bg-[#0B1C15]">
      {/* Background (Image) */}
      <div className="absolute inset-0 z-0">
        <img 
          src={backgroundItem?.cover_url} 
          className="w-full h-full object-cover" 
          alt={backgroundItem?.title || '旅行'} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-[#0B1C15] z-10" />
      </div>

      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,24px)] pb-4 w-full absolute top-0 z-40 text-white/70">
        <button onClick={onClose} className="p-2 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-2xl font-light">close</span>
        </button>
        <span className="text-white font-medium tracking-widest text-[15px]">匹配成功</span>
        <div className="w-10"></div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 w-full overflow-y-auto no-scrollbar scroll-smooth pb-32">
        <div className="px-4 max-w-md mx-auto w-full mt-24">
          
          {/* Main Description */}
          <div className="mb-6 flex flex-col pt-4">
            <h1 className="text-white text-2xl font-bold font-headline leading-tight drop-shadow-lg">
              {backgroundItem?.title || `${result.destination}之旅`}
            </h1>
            <p className="text-white/80 text-sm mt-2 leading-relaxed">
              {backgroundItem?.description || '根据您的测试，这是您的一份潜在出行蓝图，相关的契合度已由AI推演。'}
            </p>
          </div>

          {!chatExpanded ? (
            <>
              {/* Radar and Match Cards container */}
              <RadarChartCard data={radarData} />
              
              {/* Chat Overlay Snippet */}
              {messagesData.length > 0 && (
                <ChatHistoryOverlay 
                  messages={messagesData.slice(-3)} 
                  onExpand={() => setChatExpanded(true)} 
                />
              )}
            </>
          ) : (
            <FullChatHistory 
               messages={messagesData} 
               onCollapse={() => setChatExpanded(false)} 
            />
          )}

        </div>
      </main>

      {/* Action Buttons */}
      <div className="absolute bottom-[40px] left-0 w-full px-6 flex gap-4 z-40 pointer-events-auto pb-[env(safe-area-inset-bottom)]">
        <button 
          onClick={onClose}
          className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-[15px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-colors"
        >
          不感兴趣
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-[15px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-colors"
        >
          去看看详情
        </button>
      </div>
    </div>
  );
};
