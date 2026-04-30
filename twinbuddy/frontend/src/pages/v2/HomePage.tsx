import { MessageSquareText, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import VoiceInputButton from '../../components/stt/VoiceInputButton';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { homeShowcases } from '../../mocks/v2Showcase';
import { mockChatHistory } from '../../mocks/v2ApiMock';
import {
  V2_STORAGE_KEYS,
  type TwinBuddyV2ChatMessage,
  type TwinBuddyV2OnboardingData,
} from '../../types';

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

const prompts = [
  '如果我不想太赶，又希望能吃得好，适合找什么样的搭子？',
  '第一次见面适合去哪种城市短途，不会太尴尬？',
];

function appendVoiceText(currentValue: string, nextText: string) {
  return currentValue.trim() ? '\n' : nextText;
}

export default function HomePage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [messages, setMessages] = useState<TwinBuddyV2ChatMessage[]>(mockChatHistory.items);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hint, setHint] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const placeholderText = useMemo(() => {
    return profile.city ? '出发的心愿...' : '聊聊你的想法...';
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
    setIsSending(true);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? { ...item, content: '好的，我帮你记下了。你的旅行偏好我会同步给数字分身，后续匹配搭子时会重点参考这个方向。' }
            : item,
        ),
      );
      setIsSending(false);
    }, 1500);
  };

  return (
    <div className="relative flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Page background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-secondary-fixed opacity-20 blur-[100px]" />
        <div className="absolute bottom-32 left-0 w-60 h-60 rounded-full bg-tertiary-fixed opacity-15 blur-[80px]" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-container-padding pt-16 pb-[110px]">

        {/* ── Hero Section ── */}
        <section className="mb-10">
          <div className="mb-1">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
              {new Date().getHours() < 12 ? '早安' : new Date().getHours() < 18 ? '下午好' : '晚上好'}
            </span>
          </div>
          <h1 className="font-h1 text-[36px] text-on-background leading-[1.15] tracking-[-0.03em]">
            嘿，{profile.city || '旅行者'}
          </h1>
          <p className="font-h2 text-h2 text-secondary leading-tight mt-1">
            今天想去哪儿？
          </p>

          {/* Quick stats bar */}
          <div className="flex items-center gap-4 mt-5 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full border border-outline">
              <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
              <span className="font-label-caps text-label-caps text-on-surface">{profile.mbti}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full border border-outline">
              <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
              <span className="font-label-caps text-label-caps text-on-surface">{profile.city}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full border border-secondary">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="font-label-caps text-label-caps">已认证</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-full border-2 border-primary shadow-[0_4px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[0_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase"
            >
              <span className="material-symbols-outlined text-base">psychology_alt</span>
              测试 MBTI
            </Link>
            <button
              onClick={() => setInput('适合第一次见面的路线？')}
              className="inline-flex items-center gap-2 bg-surface-container-low text-on-surface font-label-caps text-label-caps px-5 py-2.5 rounded-full border-2 border-outline shadow-[0_4px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[0_2px_0_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase"
              type="button"
            >
              <span className="material-symbols-outlined text-base">explore</span>
              推荐路线
            </button>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-outline-variant" />
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MessageSquareText className="h-4 w-4" />
            <span className="font-label-caps text-label-caps uppercase text-[10px] tracking-widest">行程沟通</span>
          </div>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* ── Chat Section ── */}
        <section className="flex flex-col gap-4 mb-10">
          <div
            ref={chatContainerRef}
            className="flex flex-col gap-3 max-h-[45dvh] overflow-y-auto hide-scrollbar"
          >
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl border-2 ${
                      isUser
                        ? 'bg-primary text-on-primary border-primary rounded-tr-sm shadow-[0_4px_0_0_rgba(0,0,0,0.15)]'
                        : 'bg-surface-container-lowest text-on-background border-outline-variant rounded-tl-sm shadow-[0_4px_0_0_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    <div className={`font-label-caps text-[10px] mb-1 uppercase tracking-wider ${
                      isUser ? 'text-on-primary/60' : 'text-on-surface-variant'
                    }`}>
                      {isUser ? '你' : 'TwinBuddy AI'}
                    </div>
                    <p className="font-body-md text-[15px] whitespace-pre-wrap leading-relaxed">
                      {message.content || (isUser ? '' : '...')}
                    </p>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-surface-container-lowest border-2 border-outline-variant rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt chips */}
          <div className="flex flex-col gap-2">
            <span className="font-label-caps text-label-caps text-[10px] text-outline uppercase tracking-widest">试试问</span>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  className="text-left bg-surface-container border-2 border-outline px-4 py-2.5 rounded-full hover:border-secondary hover:text-on-background transition-colors"
                  onClick={() => setInput(prompt)}
                  type="button"
                >
                  <span className="font-body-md text-sm text-on-surface-variant">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-outline-variant" />
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">explore</span>
            <span className="font-label-caps text-label-caps uppercase text-[10px] tracking-widest">为你匹配</span>
          </div>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* ── Horizontal Scroll Carousel ── */}
        <section className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-h2 text-h2 text-on-background">推荐搭子</h2>
            <Link
              to="/buddies"
              className="flex items-center gap-1 font-label-caps text-label-caps text-secondary hover:text-on-background transition-colors"
            >
              查看全部
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory hide-scrollbar pb-2 -mx-container-padding px-container-padding">
            {homeShowcases.map((item) => (
              <article
                key={item.id}
                className="flex-shrink-0 w-[200px] snap-center bg-surface-container-lowest rounded-DEFAULT border-2 border-outline shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-video bg-secondary-fixed overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-on-secondary-fixed opacity-20">terrain</span>
                    </div>
                  )}
                  {item.metricValue && (
                    <div className="absolute top-2 right-2 bg-primary text-on-primary font-label-caps text-label-caps text-[10px] px-2.5 py-1 rounded-full border-2 border-outline shadow-[2px_2px_0_0_rgba(0,0,0,0.15)]">
                      {item.metricValue}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <p className="font-label-caps text-label-caps text-[9px] text-secondary uppercase tracking-widest mb-0.5">{item.eyebrow}</p>
                  <h3 className="font-h2 text-[14px] leading-snug text-on-background line-clamp-2">{item.title}</h3>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="font-label-caps text-label-caps text-[8px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-outline">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ── Floating Input Bar ── */}
      <div className="fixed bottom-[88px] left-0 right-0 px-container-padding z-40 md:bottom-[88px] pointer-events-none">
        <div className="max-w-screen-md mx-auto pointer-events-auto">
          {hint && (
            <div className="mb-1 text-center">
              <span className="inline-block font-label-caps text-label-caps text-[10px] text-on-secondary-container bg-secondary-container border-2 border-secondary px-3 py-1 rounded-full">
                {hint}
              </span>
            </div>
          )}
          <div className="bg-surface-container-lowest rounded-full border-2 border-outline shadow-[0_4px_0_0_#000] flex items-center px-1.5 py-1.5 gap-1 transition-all focus-within:shadow-[0_2px_0_0_#000] focus-within:-translate-y-0.5">
            <VoiceInputButton
              disabled={isSending}
              onTranscribed={(text) => setInput((current) => appendVoiceText(current, text))}
            />
            <input
              type="text"
              placeholder={placeholderText}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-base text-on-background placeholder:text-outline py-2 px-2 outline-none"
            />
            <button
              disabled={!input.trim() || isSending}
              onClick={handleSend}
              className="bg-primary text-on-primary w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-tint transition-colors active:scale-95 shrink-0 disabled:opacity-30"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
