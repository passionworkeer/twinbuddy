import { useState, useRef, useEffect, useCallback } from 'react';
import { mockConversations } from '../../mocks/v2ApiMock';
import type {
  TwinBuddyConversationItem,
  TwinBuddyV2ChatMessage,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { V2_STORAGE_KEYS } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const initialProfile: TwinBuddyV2OnboardingData = {
  mbti: 'INTJ',
  travelRange: ['周末短途', '周边城市'],
  interests: ['美食', '城市漫步', '摄影'],
  budget: '舒适',
  selfDescription: '喜欢慢慢走，不赶行程，吃好住好最重要。',
  city: '深圳',
  completed: true,
  userId: 'user_77e92a9e',
  timestamp: Date.now(),
};

// Build a 3-message mock thread from a conversation item
const buildMockThread = (chat: TwinBuddyConversationItem): TwinBuddyV2ChatMessage[] => [
  {
    id: `${chat.room_id}-1`,
    role: 'assistant',
    content: `你好呀，我是小满的旅行搭子。我们已经完成了预协商，你有什么想确认的可以随时问。`,
    created_at: Date.now() - 3600000 * 3,
  },
  {
    id: `${chat.room_id}-2`,
    role: 'user',
    content: `好的，我想了解一下你们的行程节奏偏好。`,
    created_at: Date.now() - 3600000 * 2.5,
  },
  {
    id: `${chat.room_id}-3`,
    role: 'assistant',
    content: chat.last_message,
    created_at: Date.now() - 3600000 * 2,
  },
];

// Initialize messages for all conversations
const initMessages = (
  convs: TwinBuddyConversationItem[]
): Record<string, TwinBuddyV2ChatMessage[]> => {
  const map: Record<string, TwinBuddyV2ChatMessage[]> = {};
  for (const c of convs) {
    map[c.room_id] = buildMockThread(c);
  }
  return map;
};

export default function MessagesPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(
    V2_STORAGE_KEYS.onboarding,
    initialProfile
  );
  const [conversations] = useState<TwinBuddyConversationItem[]>(mockConversations);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, TwinBuddyV2ChatMessage[]>>(() =>
    initMessages(mockConversations)
  );
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scroll to bottom whenever messages for the active room change
  useEffect(() => {
    if (activeRoomId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeRoomId, messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (activeRoomId) {
      // Small tick to let the DOM render first
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [activeRoomId]);

  const activeConversation = conversations.find((c) => c.room_id === activeRoomId) ?? null;

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeRoomId) return;

    const userMsg: TwinBuddyV2ChatMessage = {
      id: `${activeRoomId}-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: Date.now(),
    };

    // Optimistically add user message
    setMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] ?? []), userMsg],
    }));
    setDraft('');
    setIsSending(true);

    // Simulate AI reply after 1200ms
    setTimeout(() => {
      const buddyReply: TwinBuddyV2ChatMessage = {
        id: `${activeRoomId}-${Date.now()}-r`,
        role: 'assistant',
        content: `好的，这个问题我已经记下来了。我来帮你查一下具体的安排，晚点给你一个完整的回复。`,
        created_at: Date.now(),
      };
      setMessages((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] ?? []), buddyReply],
      }));
      setIsSending(false);
    }, 1200);
  }, [draft, activeRoomId]);

  const handleClose = () => {
    setActiveRoomId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex flex-col">
      {/* Background blobs — solid surface colors, no glassmorphism */}
      <div className="fixed top-10 right-10 w-64 h-64 bg-primary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-secondary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>

      <div className="flex-1 px-container-padding pt-16 pb-[100px]">
        <div className="max-w-3xl mx-auto flex flex-col gap-section-margin">
          <header className="flex items-center justify-between">
            <h1 className="font-h1 text-h1 text-primary">消息</h1>
          </header>

          {/* Search Bar (Neo-Brutalist) */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input
              type="text"
              className="w-full bg-surface-container-lowest border-2 border-outline rounded-full py-4 pl-12 pr-4 font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              placeholder="搜索对话..."
            />
          </div>

          {/* Messages List */}
          <div className="flex flex-col gap-card-gap pb-8">
            {conversations.map((chat) => (
              <button
                key={chat.room_id}
                className={`w-full flex items-center gap-4 p-4 rounded-DEFAULT text-left group transition-all ${
                  chat.room_id === activeRoomId
                    ? 'bg-surface-container-lowest border-2 border-primary shadow-[0_4px_0_0_#000] hover:-translate-y-[-2px] hover:shadow-[0_6px_0_0_#000]'
                    : 'bg-surface-container-low border-2 border-transparent hover:border-outline-variant hover:bg-surface-container-lowest'
                }`}
                onClick={() => setActiveRoomId(chat.room_id)}
                type="button"
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full border-2 ${
                      chat.unread_count > 0 ? 'border-primary' : 'border-outline-variant'
                    } bg-secondary-fixed flex items-center justify-center overflow-hidden`}
                  >
                    <span className="font-h2 text-h2 text-on-secondary-fixed">
                      {chat.peer_user.nickname.slice(0, 1)}
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-secondary border-2 border-surface-container-lowest rounded-full"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3
                      className={`font-body-lg text-body-lg truncate ${
                        chat.unread_count > 0
                          ? 'font-bold text-primary'
                          : 'font-medium text-on-surface'
                      }`}
                    >
                      {chat.peer_user.nickname}
                    </h3>
                    {chat.unread_count > 0 && (
                      <span className="bg-secondary text-on-secondary rounded-full px-2 py-0.5 border-2 border-outline font-label-caps text-label-caps shrink-0 ml-2">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="font-body-md text-base text-on-surface-variant line-clamp-1">
                    {chat.last_message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chat Detail Panel ── */}
      {activeRoomId && activeConversation && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-container-lowest">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-container-padding py-4 border-b-2 border-outline bg-surface-container-lowest">
            {/* Close / back button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-surface-container border-2 border-outline flex items-center justify-center hover:border-primary transition-colors"
              aria-label="关闭对话"
            >
              <span className="material-symbols-outlined text-on-surface text-body-lg">close</span>
            </button>

            {/* Buddy avatar + info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed border-2 border-outline flex items-center justify-center shrink-0">
                <span className="font-h2 text-h2 text-on-secondary-fixed">
                  {activeConversation.peer_user.nickname.slice(0, 1)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-body-lg text-body-lg font-bold text-on-surface truncate">
                  {activeConversation.peer_user.nickname}
                </p>
                <span className="font-label-caps text-label-caps text-outline">
                  {activeConversation.peer_user.mbti}
                </span>
              </div>
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-container-padding py-6 flex flex-col gap-4">
            {messages[activeRoomId]?.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] flex flex-col gap-1 ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Sender label */}
                    <span
                      className={`font-label-caps text-label-caps ${
                        isUser ? 'text-outline text-right' : 'text-outline text-left'
                      }`}
                    >
                      {isUser ? profile.mbti : activeConversation.peer_user.nickname}
                    </span>

                    {/* Bubble */}
                    <div
                      className={`px-4 py-3 rounded-DEFAULT font-body-md text-body-md ${
                        isUser
                          ? 'bg-primary text-on-primary rounded-tr-sm'
                          : 'bg-surface-container border-2 border-outline text-on-surface rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-label-caps text-label-caps text-outline text-left">
                    {activeConversation.peer_user.nickname}
                  </span>
                  <div className="px-4 py-3 rounded-DEFAULT rounded-tl-sm bg-surface-container border-2 border-outline flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="border-t-2 border-outline px-container-padding py-4 bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                className="flex-1 bg-surface-container border-2 border-outline rounded-DEFAULT px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                placeholder="输入消息..."
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || isSending}
                className="w-12 h-12 rounded-DEFAULT bg-primary border-2 border-outline shadow-[0_4px_0_0_#000] flex items-center justify-center hover:shadow-[0_6px_0_0_#000] hover:-translate-y-[-2px] active:shadow-[0_2px_0_0_#000] active:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-[0_4px_0_0_#000] disabled:hover:translate-y-[0]"
                aria-label="发送消息"
              >
                <span className="material-symbols-outlined text-on-primary text-body-lg">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
