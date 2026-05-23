import { useEffect, useRef, useState } from 'react';
import type {
  TwinBuddyConversationItem,
  TwinBuddyRoomMessage,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { V2_STORAGE_KEYS } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  fetchTwinBuddyConversations,
  fetchTwinBuddyRoomMessages,
  sendTwinBuddyRoomMessage,
} from '../../api/client';
import { EMPTY_ONBOARDING_PROFILE } from '../../utils/twinbuddyProfile';

export default function MessagesPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(
    V2_STORAGE_KEYS.onboarding,
    EMPTY_ONBOARDING_PROFILE,
  );
  const [conversations, setConversations] = useState<TwinBuddyConversationItem[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, TwinBuddyRoomMessage[]>>({});
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(Boolean(profile.userId));
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorText, setErrorText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      if (!profile.userId) {
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      setIsLoadingConversations(true);
      setErrorText('');
      try {
        const items = await fetchTwinBuddyConversations(profile.userId);
        if (!mounted) return;
        setConversations(items);
      } catch (error) {
        if (!mounted) return;
        setConversations([]);
        if (error instanceof Error) {
          setErrorText(error.message || '会话列表加载失败，请稍后重试。');
        } else {
          setErrorText('会话列表加载失败，请稍后重试。');
        }
      } finally {
        if (mounted) {
          setIsLoadingConversations(false);
        }
      }
    }

    void loadConversations();

    return () => {
      mounted = false;
    };
  }, [profile.userId]);

  useEffect(() => {
    if (activeRoomId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeRoomId, messages, isSending]);

  useEffect(() => {
    if (focusTimeoutRef.current !== null) {
      window.clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    if (activeRoomId) {
      focusTimeoutRef.current = window.setTimeout(() => {
        inputRef.current?.focus();
        focusTimeoutRef.current = null;
      }, 80);
    }

    return () => {
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
    };
  }, [activeRoomId]);

  const loadRoomMessages = async (roomId: string) => {
    setIsLoadingMessages(true);
    setErrorText('');
    try {
      const roomMessages = await fetchTwinBuddyRoomMessages(roomId);
      setMessages((prev) => ({
        ...prev,
        [roomId]: roomMessages,
      }));
    } catch (error) {
      if (error instanceof Error) {
        setErrorText(error.message || '消息加载失败，请稍后重试。');
      } else {
        setErrorText('消息加载失败，请稍后重试。');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleOpenConversation = async (roomId: string) => {
    setActiveRoomId(roomId);
    if (!messages[roomId]) {
      await loadRoomMessages(roomId);
    }
  };

  const activeConversation = conversations.find((c) => c.room_id === activeRoomId) ?? null;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeRoomId || !profile.userId || isSending) return;

    setIsSending(true);
    setErrorText('');
    try {
      const sentMessage = await sendTwinBuddyRoomMessage({
        roomId: activeRoomId,
        senderId: profile.userId,
        content: text,
      });
      setMessages((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] ?? []), sentMessage],
      }));
      setConversations((prev) => prev.map((item) => (
        item.room_id === activeRoomId
          ? { ...item, last_message: sentMessage.content }
          : item
      )));
      setDraft('');
    } catch (error) {
      if (error instanceof Error) {
        setErrorText(error.message || '发送失败，请稍后重试。');
      } else {
        setErrorText('发送失败，请稍后重试。');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setActiveRoomId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="relative flex flex-col">
      <div className="fixed top-10 right-10 w-64 h-64 bg-primary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed bottom-20 left-10 w-80 h-80 bg-secondary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>

      <div className="flex-1 px-container-padding pt-14 pb-[100px]">
        <div className="max-w-3xl mx-auto flex flex-col gap-section-margin">
          <header className="flex items-center justify-between">
            <h1 className="font-h1 text-h1 text-primary">消息</h1>
          </header>

          {errorText ? (
            <div className="rounded-DEFAULT border-2 border-outline bg-error text-on-error px-4 py-3 text-sm">
              {errorText}
            </div>
          ) : null}

          {!profile.userId ? (
            <div className="rounded-DEFAULT border-2 border-outline bg-surface-container-lowest px-4 py-4 text-sm text-on-surface-variant">
              先完成 onboarding 创建画像，才能进入真实私信会话。
            </div>
          ) : null}

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

          <div className="flex flex-col gap-card-gap pb-8">
            {isLoadingConversations ? (
              <div className="rounded-DEFAULT border-2 border-outline bg-surface-container-lowest px-4 py-4 text-sm text-on-surface-variant">
                正在同步真实会话列表...
              </div>
            ) : null}

            {!isLoadingConversations && conversations.length === 0 && profile.userId ? (
              <div className="rounded-DEFAULT border-2 border-outline bg-surface-container-lowest px-4 py-4 text-sm text-on-surface-variant">
                还没有可展示的私信会话，等数字分身帮你解锁新的对话关系。
              </div>
            ) : null}

            {conversations.map((chat) => (
              <button
                key={chat.room_id}
                className={`w-full flex items-center gap-4 p-4 rounded-DEFAULT text-left group transition-all ${
                  chat.room_id === activeRoomId
                    ? 'bg-surface-container-lowest border-2 border-primary shadow-[0_4px_0_0_#000] hover:-translate-y-[-2px] hover:shadow-[0_6px_0_0_#000]'
                    : 'bg-surface-container-low border-2 border-transparent hover:border-outline-variant hover:bg-surface-container-lowest'
                }`}
                onClick={() => void handleOpenConversation(chat.room_id)}
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

      {activeRoomId && activeConversation && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-container-lowest">
          <div className="flex items-center gap-3 px-container-padding py-4 border-b-2 border-outline bg-surface-container-lowest">
            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-surface-container border-2 border-outline flex items-center justify-center hover:border-primary transition-colors"
              aria-label="关闭对话"
            >
              <span className="material-symbols-outlined text-on-surface text-body-lg">close</span>
            </button>

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

          <div className="flex-1 overflow-y-auto px-container-padding py-6 flex flex-col gap-4">
            {isLoadingMessages ? (
              <div className="text-sm text-on-surface-variant">正在加载聊天内容...</div>
            ) : null}

            {(messages[activeRoomId] ?? []).map((msg) => {
              const isUser = msg.sender_id === profile.userId;
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
                    <span
                      className={`font-label-caps text-label-caps ${
                        isUser ? 'text-outline text-right' : 'text-outline text-left'
                      }`}
                    >
                      {isUser ? profile.mbti || '你' : activeConversation.peer_user.nickname}
                    </span>

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

            {isSending && (
              <div className="flex justify-end">
                <div className="flex flex-col gap-1 items-end">
                  <span className="font-label-caps text-label-caps text-outline text-right">
                    {profile.mbti || '你'}
                  </span>
                  <div className="px-4 py-3 rounded-DEFAULT rounded-tr-sm bg-primary text-on-primary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-on-primary animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-2 h-2 rounded-full bg-on-primary animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-2 h-2 rounded-full bg-on-primary animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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
                onClick={() => void handleSend()}
                disabled={!draft.trim() || isSending || !profile.userId}
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
