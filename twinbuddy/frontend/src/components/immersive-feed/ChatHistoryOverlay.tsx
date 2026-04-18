import React from 'react';

export interface ChatMessage {
  id: string | number;
  text: string;
  isSelf: boolean;
}

interface ChatHistoryOverlayProps {
  messages: ChatMessage[];
  onExpand?: () => void;
}

export const ChatHistoryOverlay: React.FC<ChatHistoryOverlayProps> = ({ messages, onExpand }) => {
  return (
    <div className="w-full bg-[#0B1C15]/50 backdrop-blur-[10px] rounded-[16px] border border-white/10 p-4 mb-6 relative h-[160px] overflow-hidden" onClick={onExpand}>
      <div className="flex flex-col gap-4 h-full [mask-image:linear-gradient(to_bottom,black_40%,transparent_90%)] [-webkit-mask-image:linear-gradient(to_bottom,black_40%,transparent_90%)]">
        {messages.map((msg, index) => {
          if (!msg.isSelf) {
            return (
              <div key={index} className="flex gap-3 justify-start items-start">
                <div className="w-8 h-8 rounded-xl bg-white/20 shrink-0 mt-1 overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=user" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="bg-[#1E2A23]/80 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-2.5 w-full max-w-[90%] border border-white/5 overflow-hidden">
                  <p className="text-sm text-white/90 leading-snug truncate">{msg.text}</p>
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className="flex gap-3 justify-end items-start">
                <div className="bg-[#2D4537]/80 backdrop-blur-md rounded-2xl rounded-tr-sm px-4 py-2.5 w-full max-w-[90%] border border-white/10 overflow-hidden">
                  <p className="text-sm text-white leading-snug truncate">{msg.text}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/20 shrink-0 mt-1 overflow-hidden">
                   <img src="https://api.dicebear.com/7.x/notionists/svg?seed=self" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Ambient Hint */}
      {onExpand && (
        <div className="absolute bottom-3 left-0 w-full flex justify-center items-center gap-1 text-white/60 text-xs animate-float-subtle whitespace-nowrap z-10 cursor-pointer">
          <span className="material-symbols-outlined text-[16px]">keyboard_double_arrow_down</span>
          <span>点击展开聊天记录</span>
        </div>
      )}
    </div>
  );
};
