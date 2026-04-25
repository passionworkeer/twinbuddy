import { MessageCircleMore, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchTwinBuddyConversations,
  fetchTwinBuddyRoomMessages,
  sendTwinBuddyRoomMessage,
} from '../../api/client';
import VoiceInputButton from '../../components/stt/VoiceInputButton';
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
  const [errorText, setErrorText] = useState('');
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);

  useEffect(() => {
    if (!profile.userId) return;
    fetchTwinBuddyConversations(profile.userId)
      .then((items) => {
        setErrorText('');
        setConversations(items);
        if (items[0]) {
          setActiveRoomId(items[0].room_id);
        }
      })
      .catch(() => {
        setErrorText('私信列表加载失败，请稍后刷新重试。');
        setConversations([]);
      });
  }, [profile.userId]);

  useEffect(() => {
    if (!activeRoomId) return;
    fetchTwinBuddyRoomMessages(activeRoomId)
      .then((items) => {
        setErrorText('');
        setRoomMessages(items);
      })
      .catch(() => {
        setErrorText('聊天记录加载失败，请稍后重试。');
        setRoomMessages([]);
      });
  }, [activeRoomId]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.room_id === activeRoomId) ?? null,
    [activeRoomId, conversations],
  );

  const handleSend = async () => {
    if (!profile.userId || !activeRoomId || !input.trim()) return;
    try {
      const sent = await sendTwinBuddyRoomMessage({
        roomId: activeRoomId,
        senderId: profile.userId,
        content: input.trim(),
      });
      setErrorText('');
      setRoomMessages((prev) => [...prev, sent]);
      setInput('');
    } catch {
      setErrorText('消息发送失败，请稍后重试。');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className={`glass-panel p-5 ${showThreadOnMobile ? 'hidden lg:block' : 'block'}`}>
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
              onClick={() => {
                setActiveRoomId(conversation.room_id);
                setShowThreadOnMobile(true);
              }}
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

      <section className={`glass-panel-strong p-5 ${showThreadOnMobile ? 'block' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">
            {activeConversation ? `${activeConversation.peer_user.nickname} · 聊天中` : '聊天窗口'}
          </h3>
          <button className="btn-ghost px-0 text-sm lg:hidden" onClick={() => setShowThreadOnMobile(false)} type="button">
            返回列表
          </button>
        </div>

        {errorText ? (
          <div className="mt-4 rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(93,32,32,0.24)] px-4 py-3 text-sm text-[var(--color-primary-light)]">
            {errorText}
          </div>
        ) : null}

        <div className="mt-5 flex max-h-[42dvh] flex-col gap-3 overflow-y-auto pr-1">
          {roomMessages.map((message) => (
            <div
              key={message.id}
              className={message.sender_id === profile.userId ? 'bubble-user' : 'bubble-buddy'}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--color-text-secondary)]"
              onChange={(event) => setInput(event.target.value)}
              placeholder="发条消息，看看当前 MVP 聊天链路"
              value={input}
            />
            <VoiceInputButton
              onTranscribed={(text) => setInput((current) => current.trim() ? `${current.trim()}\n${text}` : text)}
            />
            <button className="btn-icon" onClick={handleSend} type="button">
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
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
