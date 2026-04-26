import { MessageSquareText, SendHorizonal, Sparkles, Stars } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchTwinBuddyChatHistory,
  fetchTwinBuddyProfile,
  streamTwinBuddyChat,
} from '../../api/client';
import VoiceInputButton from '../../components/stt/VoiceInputButton';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { homeShowcases } from '../../mocks/v2Showcase';
import {
  V2_STORAGE_KEYS,
  type TwinBuddyV2ChatMessage,
  type TwinBuddyV2OnboardingData,
} from '../../types';

const initialProfile: TwinBuddyV2OnboardingData = {
  mbti: '',
  travelRange: [],
  budget: '',
  selfDescription: '',
  city: '',
  completed: false,
  timestamp: 0,
};

const prompts = [
  '帮我规划一个深圳出发的周末轻松旅行',
  '适合第一次和新搭子见面的旅行节奏是什么？',
  '预算 2000 左右，推荐 3 天目的地',
  '如果我不想太赶，又希望能吃得好，适合找什么样的搭子？',
  '第一次见面适合去哪种城市短途，不会太尴尬？',
];

function appendVoiceText(currentValue: string, nextText: string) {
  return currentValue.trim() ? `${currentValue.trim()}\n${nextText}` : nextText;
}

export default function HomePage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [conversationId, setConversationId] = useLocalStorage<string>(V2_STORAGE_KEYS.chatConversation, '');
  const [remoteProfileSummary, setRemoteProfileSummary] = useState('');
  const [messages, setMessages] = useState<TwinBuddyV2ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hint, setHint] = useState('');

  useEffect(() => {
    if (!profile.userId) return;
    fetchTwinBuddyProfile(profile.userId)
      .then((data) => {
        setRemoteProfileSummary(`${data.nickname} · ${data.budget} · ${data.city}`);
      })
      .catch(() => {
        setRemoteProfileSummary('');
      });
  }, [profile.userId]);

  useEffect(() => {
    if (!conversationId) return;
    fetchTwinBuddyChatHistory(conversationId)
      .then((history) => {
        setMessages(history.items);
      })
      .catch(() => {
        setMessages([]);
      });
  }, [conversationId]);

  const placeholderText = useMemo(() => {
    if (profile.city) {
      return `问我：从 ${profile.city} 出发，适合你的周末路线怎么排？`;
    }
    return '问我：这个周末适合怎么玩？';
  }, [profile.city]);

  const handleSend = async () => {
    if (!profile.userId || !input.trim() || isSending) return;
    const text = input.trim();
    const userMessage: TwinBuddyV2ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: Date.now(),
    };
    const assistantId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', created_at: Date.now() + 1 },
    ]);
    setInput('');
    setHint('');
    setIsSending(true);

    try {
      const result = await streamTwinBuddyChat(
        { userId: profile.userId, message: text, conversationId: conversationId || undefined },
        {
          onMeta: (nextConversationId) => setConversationId(nextConversationId),
          onMessage: (chunk) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantId ? { ...item, content: `${item.content}${chunk}` } : item,
              ),
            );
          },
          onPreferenceHint: (nextHint) => setHint(nextHint),
        },
      );
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }
    } catch {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? { ...item, content: '当前聊天服务暂时不可用，稍后我再继续。' }
            : item,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="glass-panel-accent p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-xs text-[var(--color-secondary)]">
              <Sparkles className="h-3.5 w-3.5" />
              AI 助手
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {profile.city || '你的城市'} 的旅行灵感已经准备好了
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
              这里已经承接了 Tab1 的流式对话、偏好提取和历史消息恢复。你现在可以直接聊路线、节奏、预算，也可以用语音更快把长句子说出来。
              {remoteProfileSummary ? ` 当前画像：${remoteProfileSummary}。` : ''}
            </p>
          </div>
          </div>
          <div className="hidden rounded-3xl border border-white/8 bg-black/20 p-4 sm:block">
            <Stars className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[1.3fr_0.9fr]">
        <article className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[rgba(74,222,128,0.12)] p-2 text-[var(--color-primary)]">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">旅行顾问对话区</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">支持流式对话、历史恢复和语音补充输入。</p>
            </div>
          </div>

          <div className="mt-5 flex max-h-[46dvh] flex-col gap-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <>
                <div className="bubble-buddy">
                  你好呀，我会先快速了解你一点旅行偏好。你一般更喜欢周末出行还是小长假？
                </div>
                <div className="bubble-user">我更偏向周末短途，节奏不要太赶。</div>
                <div className="bubble-buddy">
                  收到，这种回答会直接更新你的 style vector 和匹配约束。
                </div>
              </>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={message.role === 'user' ? 'bubble-user' : 'bubble-buddy'}>
                  {message.content || (message.role === 'assistant' ? '...' : '')}
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-3xl border border-white/8 bg-black/10 p-4">
            <textarea
              className="min-h-24 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-[var(--color-text-secondary)]"
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholderText}
              value={input}
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-[var(--color-text-secondary)]">
                {hint || '每条对话都会更新你的偏好画像。'}
              </div>
              <div className="flex items-center justify-end gap-3">
                <VoiceInputButton
                  disabled={isSending}
                  onTranscribed={(text) => setInput((current) => appendVoiceText(current, text))}
                />
                <button className="btn-primary" disabled={!profile.userId || !input.trim() || isSending} onClick={handleSend} type="button">
                  <SendHorizonal className="h-4 w-4" />
                  {isSending ? '发送中' : '发送'}
                </button>
              </div>
            </div>
          </div>
        </article>

        <div className="space-y-4">
          <ShowcaseCarousel
            title="轮播展示"
            items={homeShowcases}
            accent={<Stars className="h-5 w-5 text-[var(--color-primary)]" />}
            className="p-5"
          />

          <aside className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-white">建议你先问</h3>
            <div className="mt-4 flex flex-col gap-3">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-left text-sm text-[var(--color-text-secondary)] transition hover:border-[rgba(74,222,128,0.28)] hover:text-white"
                  onClick={() => setInput(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
