import React from 'react';
import { ChatMessage } from './ChatHistoryOverlay';

export const FullChatHistory: React.FC<{
  messages: ChatMessage[];
  onCollapse: () => void;
}> = ({ messages, onCollapse }) => {

  return (
    <div className="w-full relative mt-8 mb-[120px] transition-all">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-white font-headline text-lg tracking-wide">搭子沟通记录</h2>
         <button onClick={onCollapse} className="text-white/60 text-sm py-1 px-3 border border-white/10 rounded-full hover:bg-white/10">
           收起内容 <span className="material-symbols-outlined text-[14px] align-middle">expand_less</span>
         </button>
      </div>

      <div className="w-full bg-[#0B1C15]/50 backdrop-blur-[10px] rounded-[16px] border border-white/10 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => {
            if (!msg.isSelf) {
              return (
                <div key={index} className="flex gap-3 justify-start items-start">
                  <div className="w-8 h-8 rounded-xl bg-white/20 shrink-0 mt-1 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=user&backgroundColor=1E2A23" alt="avatar" className="w-full h-full object-cover" />
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
                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=self&backgroundColor=2D4537" alt="avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};
