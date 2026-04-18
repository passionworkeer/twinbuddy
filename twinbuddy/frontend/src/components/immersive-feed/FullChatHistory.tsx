import React from 'react';
import { ChatMessage } from './ChatHistoryOverlay';

export const FullChatHistory: React.FC<{
  messages: ChatMessage[];
  onCollapse: () => void;
  result?: any; // To pass NegotiationResult
}> = ({ messages, onCollapse, result }) => {

  const radarData = result?.radar || [
    { dimension: '体能储备', user_score: 90, buddy_score: 94, weight: 1 },
    { dimension: '路线偏好', user_score: 85, buddy_score: 91, weight: 1 },
    { dimension: '消费观念', user_score: 95, buddy_score: 95, weight: 1 },
  ];

  const planData = result?.plan || [
    '上午 08:00 出发 - 德清站集合，包车前往徒步起点。',
    '下午 13:00 挑战绝望坡 - 连续爬升500米，需注意节奏，登顶后休息。',
    '傍晚 17:00 抵达营地 - 扎营，准备晚餐，看日落星空。'
  ];

  const buddyName = result?.matched_buddies?.[0] || '山野行者';

  return (
    <div className="w-full relative mt-8 mb-[120px] transition-all">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-white font-headline text-lg tracking-wide">搭子沟通记录</h2>
         <button onClick={onCollapse} className="text-white/60 text-sm py-1 px-3 border border-white/10 rounded-full hover:bg-white/10">
           收起内容 <span className="material-symbols-outlined text-[14px] align-middle">expand_less</span>
         </button>
      </div>

      <div className="w-full bg-[#0B1C15]/50 backdrop-blur-[10px] rounded-[16px] border border-white/10 p-4 mb-6">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => {
            if (!msg.isSelf) {
              return (
                <div key={index} className="flex gap-3 justify-start items-start">
                  <div className="w-8 h-8 rounded-xl bg-white/20 shrink-0 mt-1 overflow-hidden">
                    <img src="/images/girl.png" alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-[#1E2A23]/80 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-2.5 w-full max-w-[90%] border border-white/5 overflow-hidden">
                    <p className="text-sm text-white/90 leading-snug">{msg.text}</p>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={index} className="flex gap-3 justify-end items-start">
                  <div className="bg-[#2D4537]/80 backdrop-blur-md rounded-2xl rounded-tr-sm px-4 py-2.5 w-full max-w-[90%] border border-white/10 overflow-hidden">
                    <p className="text-sm text-white leading-snug">{msg.text}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/20 shrink-0 mt-1 overflow-hidden">
                    <img src="/images/man.png" alt="avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Dimensional Analysis Card */}
      <div className="w-full bg-[#0B1C15]/50 backdrop-blur-[10px] rounded-[16px] border border-white/10 p-5 mb-6">
        <h2 className="text-white font-semibold text-lg mb-4">各维度匹配详情</h2>
        <div className="flex flex-col gap-5">
          {radarData.slice(0, 3).map((dim: any, idx: number) => {
            const score = Math.round((dim.user_score + dim.buddy_score) / 2) || 90;
            const icons = ['🏃', '🗺️', '💰'];
            const descs = [
              '体力充沛，轻松应对较高强度旅行。',
              '偏爱自然与探索，不走寻常路。',
              '消费观一致，注重性价比。'
            ];
            return (
              <div key={idx}>
                <div className="flex justify-between text-white/90 text-sm mb-1">
                  <span>{icons[idx % 3]} {dim.dimension}</span>
                  <span className="text-[#4ade80] font-bold">{score}分</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                  <div className="bg-[#4ade80] h-1.5 rounded-full" style={{ width: `${score}%` }}></div>
                </div>
                <p className="text-white/60 text-xs">{descs[idx % 3]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proposed Itinerary Card */}
      <div className="w-full bg-[#0B1C15]/50 backdrop-blur-[10px] rounded-[16px] border border-white/10 p-5 mb-6">
        <h2 className="text-white font-semibold text-lg mb-4">行程路线时间轴</h2>
        <div className="mb-4">
          <div className="inline-block bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-black text-xs font-bold px-3 py-1 rounded-full mb-3">
            行程概览
          </div>
          <div className="relative pl-6 border-l border-dashed border-white/30 ml-3 space-y-6">
            {planData.map((item: string, idx: number) => {
              const parts = item.split(/ - | — |：/);
              const title = parts[0] || `阶段 ${idx + 1}`;
              const desc = parts.slice(1).join(' - ') || item;
              return (
                <div key={idx} className="relative">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 bg-[#4ade80] rounded-full ring-4 ring-[#0B1C15]"></div>
                  <h3 className="text-white/90 text-sm font-semibold mb-1">{title}</h3>
                  <p className="text-white/60 text-xs">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Companion Profile Card */}
      <div className="w-full bg-[#0B1C15]/50 backdrop-blur-[10px] rounded-[16px] border border-white/10 p-5 mt-10 relative mb-12">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <img alt="Avatar" className="w-16 h-16 rounded-full border-2 border-[#4ade80] object-cover" src="/images/girl.png" />
        </div>
        <div className="pt-8 text-center">
          <h2 className="text-white font-bold text-lg mb-1">{buddyName}</h2>
          <p className="text-white/70 text-xs mb-4">"在山野中寻找内心的宁静，无惧风雨。"</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="bg-white/10 text-white/80 text-[10px] px-2 py-1 rounded-md border border-white/5">#硬核越野</span>
            <span className="bg-white/10 text-white/80 text-[10px] px-2 py-1 rounded-md border border-white/5">#装备控</span>
            <span className="bg-white/10 text-white/80 text-[10px] px-2 py-1 rounded-md border border-white/5">#INTJ</span>
            <span className="bg-white/10 text-white/80 text-[10px] px-2 py-1 rounded-md border border-white/5">#摄影爱好者</span>
          </div>
        </div>
      </div>
    </div>
  );
};
