import React, { useState, useEffect, useRef } from 'react';
import type { VideoItem, NegotiationResult, Buddy } from '../../types';
import { RadarChartCard, LocalRadarData } from './RadarChartCard';
import { ChatHistoryOverlay, ChatMessage } from './ChatHistoryOverlay';
import { FullChatHistory } from './FullChatHistory';

interface TwinMatchModalProps {
  result: NegotiationResult | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  backgroundItem: VideoItem | null;
  matchedBuddy?: {
    name: string;
    mbti: string;
    avatar_emoji: string;
    travel_style: string;
    compatibility_score: number;
  } | null;
  // 实时协商消息（分批到达）
  liveMessages?: { speaker: 'user' | 'buddy'; content: string; timestamp: number }[];
}

export const TwinMatchModal: React.FC<TwinMatchModalProps> = ({
  result,
  isLoading,
  onClose,
  onConfirm,
  backgroundItem,
  matchedBuddy,
  liveMessages = []
}) => {
  const [modalStep, setModalStep] = useState<'guide' | 'match'>('match'); // 默认直接进 match 步骤
  const [chatExpanded, setChatExpanded] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 实时消息动画：每当 liveMessages 更新，逐条显示
  useEffect(() => {
    if (liveMessages.length === 0) return;

    // 逐条添加消息，间隔 800ms
    let index = 0;
    const interval = setInterval(() => {
      if (index < liveMessages.length) {
        const msg = liveMessages[index];
        setDisplayedMessages(prev => [...prev, {
          id: Date.now() + index,
          text: msg.content,
          isSelf: msg.speaker === 'user'
        }]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [liveMessages.length]);

  // 自动滚动到最新消息
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  // Loading state: show buddy preview with live chat
  if (isLoading || !result) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1C15] overflow-hidden">
         {/* Background image blurred */}
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

         {/* Top bar */}
         <div className="relative z-10 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,24px)] pb-3">
           <button onClick={onClose} className="p-2">
             <span className="material-symbols-outlined text-white text-2xl">close</span>
           </button>
           <div className="flex items-center gap-2">
             {matchedBuddy && (
               <>
                 <span className="text-lg">{matchedBuddy.avatar_emoji}</span>
                 <span className="text-white font-medium">{matchedBuddy.name}</span>
               </>
             )}
           </div>
           <div className="w-10"></div>
         </div>

         {/* Live chat area */}
         <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-32">
           {displayedMessages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full">
               <div className="w-12 h-12 border-3 border-white/20 border-t-[#4ade80] rounded-full animate-spin mb-4" />
               <p className="text-white/80 font-medium">正在连接搭子...</p>
             </div>
           ) : (
             <div className="space-y-3 pt-4">
               {displayedMessages.map((msg, idx) => (
                 <div
                   key={msg.id}
                   className={`flex items-end gap-2 animate-fade-in ${msg.isSelf ? 'flex-row-reverse' : ''}`}
                   style={{ animationDelay: '0ms' }}
                 >
                   {!msg.isSelf && matchedBuddy && (
                     <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm shrink-0">
                       {matchedBuddy.avatar_emoji}
                     </div>
                   )}
                   <div
                     className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                       msg.isSelf
                         ? 'bg-[#4ade80] text-black rounded-br-sm'
                         : 'bg-white/15 text-white rounded-bl-sm'
                     }`}
                   >
                     {msg.text}
                   </div>
                 </div>
               ))}
               <div ref={messageEndRef} />
             </div>
           )}
         </div>

         {/* Bottom hint */}
         <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-[#0B1C15] via-[#0B1C15]/80 to-transparent pt-8 pb-4 px-4 text-center">
           <p className="text-white/50 text-xs animate-pulse">
             {displayedMessages.length === 0 ? '正在与搭子建立连接...' : '搭子正在回复中...'}
           </p>
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

  // 合并实时消息和最终结果消息
  const resultMessages: ChatMessage[] = result.messages?.map((msg, idx) => ({
    id: 10000 + idx,
    text: msg.content,
    isSelf: msg.speaker === 'user'
  })) || [];

  // 如果有实时消息已显示，不重复显示
  const allMessages = displayedMessages.length > 0
    ? [...displayedMessages, ...resultMessages.filter(rm => !displayedMessages.some(dm => dm.text === rm.text))]
    : resultMessages;

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
        <button onClick={onClose} className="p-2 flex items-center justify-center text-white hover:text-[#4ade80] transition-colors">
          <span className="material-symbols-outlined text-2xl font-light">close</span>
        </button>
        <span className="text-white/90 font-medium tracking-widest text-[15px]">
          {modalStep === 'guide' ? '行程概览' : '契合度分析'}
        </span>
        <div className="w-10"></div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 w-full overflow-y-auto no-scrollbar scroll-smooth pb-32">
        <div className="px-4 max-w-md mx-auto w-full mt-20">
          
          {modalStep === 'guide' && (
            <div className="animate-fade-in">
              {/* Main Title matching travel_guide_full_width_glass_cards */}
              <h1 className="font-headline font-extrabold text-4xl leading-tight text-white mb-8 tracking-tight px-2 drop-shadow-lg">
                {backgroundItem?.title || `${result.destination}旅行攻略`}
              </h1>

              {/* Information Glass Card */}
              <div className="bg-white/10 backdrop-blur-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[12px] p-5 mb-8">
                {/* 4-Column Grid */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/80 mb-1">目的地</span>
                    <span className="text-xs font-semibold text-white truncate">{result.destination || '未知'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/80 mb-1">天数</span>
                    <span className="text-xs font-semibold text-white">2天</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/80 mb-1">气温</span>
                    <span className="text-xs font-semibold text-white">15-25°C</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/80 mb-1">建议人数</span>
                    <span className="text-xs font-semibold text-white">2-4人</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full bg-white/20 my-4"></div>

                {/* Bottom Layout */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4ade80] text-xl icon-fill">terrain</span>
                    <span className="text-sm font-semibold text-white">经典路线与风景</span>
                  </div>
                  <div className="w-24 h-8 opacity-60">
                    <svg fill="none" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 25 Q 15 15, 30 20 T 60 10 T 100 5" stroke="#4ade80" strokeLinecap="round" strokeWidth="2"></path>
                      <circle cx="0" cy="25" fill="#4ade80" r="3"></circle>
                      <circle cx="100" cy="5" fill="#4ade80" r="3"></circle>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Guide List Section */}
              <div className="mb-8 px-2">
                <h2 className="font-headline font-bold text-lg text-white mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4ade80] text-sm">bookmark</span>
                  运动&旅行博主攻略
                </h2>
                <div className="flex flex-col gap-4">
                  {/* Block 1 */}
                  <div className="bg-white/10 backdrop-blur-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[16px] p-4 flex gap-6 items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-white mb-2 leading-snug">新手村的试炼：{result.destination}打卡</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <img className="w-5 h-5 rounded-full object-cover" src="https://api.dicebear.com/7.x/notionists/svg?seed=deer" alt="avatar" />
                        <span className="text-xs text-white/90 font-medium">山野小鹿</span>
                      </div>
                      <p className="text-xs text-white/80 line-clamp-2">适合初级旅行者，沿途风景极佳，补给点丰富，不用担心迷路。</p>
                    </div>
                    <div className="w-24 h-24 shrink-0 rounded-[12px] overflow-hidden">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8RidSWJ0pcmZCoiJOH3-ikUDTeSS6BVnU_vkKNL5IwcFYftFbNsIBuKRWkbjHg3sBVAcPXDSWsmX4It45H9mj3Q50iLcOMQMT-hBTUR44RJ8OK9D4-CYT0GYXiWhzDQ3KTky66pD8EKhCAQ6Zc9HHgp1NGx2sGbDKee6q-vQhOuunqGtQmgSXk9_iNKUJChlJiJqHbd_zb1UDF65xwrvlJmILHY4SNrhSvoqvwTSZVbOzAOWT-u8PxxSI7pdBjAXM21kLHAgj58U" alt="scenery" />
                    </div>
                  </div>

                  {/* Block 2 */}
                  <div className="bg-white/10 backdrop-blur-[32px] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[16px] p-4 flex gap-6 items-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-0 rounded-[16px]"></div>
                    <div className="flex-1 relative z-10">
                      <h3 className="font-bold text-base text-white mb-2 leading-snug">硬核进阶：{result.destination}深度游</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <img className="w-5 h-5 rounded-full object-cover" src="https://api.dicebear.com/7.x/notionists/svg?seed=runner" alt="avatar" />
                        <span className="text-xs text-white/90 font-medium">越野老炮</span>
                      </div>
                      <p className="text-xs text-white/80 line-clamp-2">深度体验当地文化与自然，对体力有一定要求，体验极佳。</p>
                    </div>
                    <div className="w-24 h-24 shrink-0 rounded-[12px] overflow-hidden relative z-10">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeM6nPK_gclhHi_K4xR5nV_9tdFRCkau_G-kCB3-XyTyyN7QSM83Tckqp0JM1Xc2I-TTScuw0pzl1dHQnye8LRn_NVbEetPxfhCL4ZpIchsG3-Z4QrNaUNyn-tN0ujweIr9SPIZbR6B_QsP5FTuqerJMx_VCiIP2vDPGgwG5HqiFkDiNrCcxGyeUVOGW9mzh7FXEnWkFEUVnjqY05Z5YgCdgVYZBnDWKwd7m9KCuQtkyG9MZARU-1nnrGdt96w9T7blLVXPgTAQr8" alt="scenery" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {modalStep === 'match' && (
            <div className="animate-fade-in">
              {/* Main Title matching travel_guide_annotations_applied_final */}
              <h1 className="font-headline font-extrabold text-4xl leading-tight text-white mb-8 tracking-tight px-2 drop-shadow-lg">
                {backgroundItem?.title || `${result.destination}之旅`}
              </h1>

              {!chatExpanded ? (
                <>
                  {/* Radar and Match Cards container */}
                  <RadarChartCard data={radarData} />

                  {/* Chat Overlay Snippet */}
                  {allMessages.length > 0 && (
                    <ChatHistoryOverlay
                      messages={allMessages.slice(-3)}
                      onExpand={() => setChatExpanded(true)}
                    />
                  )}
                </>
              ) : (
                <FullChatHistory
                   messages={allMessages}
                   onCollapse={() => setChatExpanded(false)}
                   result={result}
                />
              )}
            </div>
          )}

        </div>
      </main>

      {/* Action Buttons */}
      <div className="absolute bottom-[40px] left-0 w-full px-6 flex gap-4 z-40 pointer-events-auto pb-[env(safe-area-inset-bottom)]">
        {modalStep === 'guide' ? (
          <>
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-[15px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-colors"
            >
              不感兴趣
            </button>
            <button 
              onClick={() => setModalStep('match')}
              className="flex-1 py-3.5 bg-gradient-to-r from-[#4ade80]/80 to-[#22c55e]/80 backdrop-blur-xl border border-[#4ade80]/50 rounded-2xl text-white font-bold text-[15px] shadow-[0_4px_24px_rgba(74,222,128,0.3)] hover:opacity-90 transition-colors"
            >
              与数字人沟通
            </button>
          </>
        ) : (
          <>
            {!chatExpanded ? (
              <>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-[15px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-colors"
                >
                  不感兴趣
                </button>
                <button 
                  onClick={() => {
                    const links = [
                      'https://v.douyin.com/ANQxLmeC7Q0/',
                      'https://v.douyin.com/2LD36YFoTbE/',
                      'https://v.douyin.com/x2J_D523nu0/?utm_campaign=client_share&app=aweme&utm_medium=ios&tt_from=more&utm_source=more',
                      'https://v.douyin.com/3lV9tMGO13E/'
                    ];
                    const randomLink = links[Math.floor(Math.random() * links.length)];
                    window.open(randomLink, '_blank');
                  }}
                  className="flex-1 py-3.5 bg-[#4ade80]/20 backdrop-blur-xl border border-[#4ade80]/50 rounded-2xl text-[#4ade80] font-bold text-[15px] shadow-[0_4px_24px_rgba(74,222,128,0.1)] hover:bg-[#4ade80]/30 transition-colors"
                >
                  加他好友
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-medium text-[15px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/20 transition-colors"
                >
                  不感兴趣
                </button>
                <button 
                  onClick={() => {
                    const links = [
                      'https://v.douyin.com/ANQxLmeC7Q0/',
                      'https://v.douyin.com/2LD36YFoTbE/',
                      'https://v.douyin.com/x2J_D523nu0/?utm_campaign=client_share&app=aweme&utm_medium=ios&tt_from=more&utm_source=more',
                      'https://v.douyin.com/3lV9tMGO13E/'
                    ];
                    const randomLink = links[Math.floor(Math.random() * links.length)];
                    window.open(randomLink, '_blank');
                  }}
                  className="flex-1 py-3.5 bg-[#4ade80]/20 backdrop-blur-xl border border-[#4ade80]/50 rounded-2xl text-[#4ade80] font-bold text-[15px] shadow-[0_4px_24px_rgba(74,222,128,0.1)] hover:bg-[#4ade80]/30 transition-colors"
                >
                  加他好友
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
