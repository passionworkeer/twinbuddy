import { MessageCircleMore, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchTwinBuddyConversations,
  fetchTwinBuddyRoomMessages,
  sendTwinBuddyRoomMessage,
} from '../../api/client';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { messageShowcases } from '../../mocks/v2Showcase';
import type {
  TwinBuddyConversationItem,
  TwinBuddyRoomMessage,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { V2_STORAGE_KEYS } from '../../types';

const initialProfile: TwinBuddyV2OnboardingData = {
  mbti: '',
  travelRange: [],
  budget: '',
  selfDescription: '',
  city: '',
  completed: false,
  timestamp: 0,
};

export default function MessagesPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [conversations, setConversations] = useState<TwinBuddyConversationItem[]>([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [roomMessages, setRoomMessages] = useState<TwinBuddyRoomMessage[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!profile.userId) return;
    fetchTwinBuddyConversations(profile.userId)
      .then((items) => {
        setConversations(items);
        if (items[0]) {
          setActiveRoomId(items[0].room_id);
        }
      })
      .catch(() => {
        setConversations([]);
      });
  }, [profile.userId]);

  useEffect(() => {
    if (!activeRoomId) return;
    fetchTwinBuddyRoomMessages(activeRoomId)
      .then(setRoomMessages)
      .catch(() => setRoomMessages([]));
  }, [activeRoomId]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.room_id === activeRoomId) ?? null,
    [activeRoomId, conversations],
  );

  const handleSend = async () => {
    if (!profile.userId || !activeRoomId || !input.trim()) return;
    const sent = await sendTwinBuddyRoomMessage({
      roomId: activeRoomId,
      senderId: profile.userId,
      content: input.trim(),
    });
    setRoomMessages((prev) => [...prev, sent]);
    setInput('');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-panel p-5">
        <div className="flex items-center gap-3">
          <MessageCircleMore className="h-5 w-5 text-[var(--color-secondary)]" />
          <h2 className="text-xl font-semibold text-white">私信列表</h2>
        </div>

        <div className="mt-5 space-y-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.room_id}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                conversation.room_id === activeRoomId
                  ? 'border-[rgba(255,179,182,0.28)] bg-[rgba(255,179,182,0.08)]'
                  : 'border-white/8 bg-white/4 hover:border-[rgba(255,179,182,0.28)]'
              }`}
              onClick={() => setActiveRoomId(conversation.room_id)}
              type="button"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">{conversation.peer_user.nickname}</span>
                {conversation.unread_count > 0 ? (
                  <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-[var(--color-bg-base)]">
                    {conversation.unread_count}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{conversation.last_message}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel-strong p-5">
        <h3 className="text-xl font-semibold text-white">
          {activeConversation ? `${activeConversation.peer_user.nickname} · 聊天中` : '聊天窗口'}
        </h3>
        <div className="mt-5 space-y-3">
          {roomMessages.map((message) => (
            <div
              key={message.id}
              className={message.sender_id === profile.userId ? 'bubble-user' : 'bubble-buddy'}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
          <input
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--color-text-secondary)]"
            onChange={(event) => setInput(event.target.value)}
            placeholder="发条消息，看看当前 MVP 聊天链路"
            value={input}
          />
          <button className="btn-icon" onClick={handleSend} type="button">
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>

        <ShowcaseCarousel
          title="轮播展示"
          items={messageShowcases}
          className="mt-5 p-5"
          intervalMs={5200}
        />
      </section>
    </div>
  );
}
