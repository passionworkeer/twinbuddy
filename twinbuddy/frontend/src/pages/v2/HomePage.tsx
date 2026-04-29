import { MessageSquareText, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchTwinBuddyChatHistory,
  fetchTwinBuddyProfile,
  streamTwinBuddyChat,
} from '../../api/client';
import VoiceInputButton from '../../components/stt/VoiceInputButton';
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
  interests: [],
  budget: '',
  selfDescription: '',
  city: '',
  completed: false,
  timestamp: 0,
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
  const [conversationId, setConversationId] = useLocalStorage<string>(V2_STORAGE_KEYS.chatConversation, '');
  const [remoteProfileSummary, setRemoteProfileSummary] = useState('');
  const [messages, setMessages] = useState<TwinBuddyV2ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hint, setHint] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile.userId) return;
    fetchTwinBuddyProfile(profile.userId)
      .then((data) => {
        setRemoteProfileSummary('· · ');
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const placeholderText = useMemo(() => {
    if (profile.city) {
      return "出发的心愿...";
    }
    return '聊聊你的想法...';
  }, [profile.city]);

  const handleSend = async () => {
    if (!profile.userId || !input.trim() || isSending) return;
    const text = input.trim();
    const userMessage: TwinBuddyV2ChatMessage = {
      id: "local-user-",
      role: 'user',
      content: text,
      created_at: Date.now(),
    };
    const assistantId = "local-assistant-";
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
                item.id === assistantId ? { ...item, content: chunk } : item,
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
    <div className="relative flex flex-col h-screen overflow-y-auto">
      {/* Background Decor */}
      <div className="fixed -top-10 -left-10 w-64 h-64 bg-tertiary-fixed blur-[80px] opacity-40 -z-10 rounded-full pointer-events-none"></div>
      <div className="fixed top-20 -right-10 w-64 h-64 bg-secondary-fixed blur-[80px] opacity-40 -z-10 rounded-full pointer-events-none"></div>

      {/* Scrollable Content */}
      <div className="flex-1 px-container-padding pt-16 pb-[100px]">
        {/* Header */}
        <section className="relative">
          <h1 className="font-h1 text-h1 text-on-background leading-tight mb-2">
            嘿 {profile.userId ? profile.city || '旅行者' : '旅行者'}!<br />今天想去哪儿？
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[85%]">
            {remoteProfileSummary ? remoteProfileSummary : '发现与你频率一致的旅行搭子，开启新冒险。'}
          </p>

          <div className="flex gap-4 mt-6">
            <Link to="/onboarding" className="bg-primary text-on-primary font-label-caps text-label-caps px-6 py-3 rounded-full hover:bg-surface-tint transition-colors uppercase border-2 border-primary">
              测试 MBTI
            </Link>
            <button onClick={() => setInput('适合第一次见面的路线？')} className="bg-secondary-container text-on-secondary-container font-label-caps text-label-caps px-6 py-3 rounded-full hover:brightness-95 transition-colors uppercase border-2 border-secondary">
              推荐路线
            </button>
          </div>
        </section>

        {/* Chat History */}
        <section className="flex flex-col gap-4 mt-8">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-6 w-6 text-primary" />
            <h2 className="font-h2 text-[26px] text-on-background leading-none">行程沟通</h2>
          </div>

          <div ref={chatContainerRef} className="flex flex-col gap-4 min-h-[120px] max-h-[50dvh] overflow-y-auto hide-scrollbar pb-4">
            {messages.length === 0 ? (
              <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] self-start max-w-[90%]">
                <p className="font-body-md text-base text-on-background">
                  你好呀，我是你的专属探索助手。你可以把你的周末计划抛给我，或者告诉我你不想干嘛，我们会自动更新匹配条件。
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="self-end border-2 border-outline-variant bg-surface-container-lowest p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-[85%]"
                >
                  <div className="font-label-caps text-[10px] opacity-60 mb-1 uppercase tracking-wider text-on-surface-variant">
                    {message.role === 'user' ? 'You' : 'TwinBuddy AI'}
                  </div>
                  <p className="font-body-md text-base whitespace-pre-wrap text-on-background">
                    {message.content || (message.role === 'assistant' ? '...' : '')}
                  </p>
                </div>
              ))
            )}

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    className="bg-surface-container border-2 border-outline-variant px-4 py-2 rounded-full font-body-md text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors text-left"
                    onClick={() => setInput(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recommended Carousel */}
        <section className="flex flex-col gap-gutter mt-4 mb-24">
          <div className="flex items-end justify-between">
            <h2 className="font-h2 text-[26px] text-on-background leading-none">推荐搭子</h2>
            <Link to="/buddies" className="font-label-caps text-label-caps text-primary hover:text-surface-tint uppercase transition-colors">
              查看全部
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-card-gap snap-x snap-mandatory hide-scrollbar pb-4 -mx-container-padding px-container-padding mt-4">
            {homeShowcases.slice(0, 3).map((item, idx) => (
              <article key={idx} className="flex-shrink-0 w-[240px] snap-center bg-surface-container-lowest rounded-xl border-2 border-outline-variant shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-transform hover:-translate-y-1 duration-300">
                <div className="h-[320px] w-full relative border-b-2 border-outline-variant">
                  <div className="w-full h-full bg-secondary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-on-secondary-fixed opacity-30">explore</span>
                  </div>
                  <div className="absolute top-base right-base bg-primary-container text-on-primary-container font-label-caps text-label-caps px-3 py-1.5 rounded-full border-2 border-outline shadow-[2px_2px_0px_#000]">
                    {item.metricValue}
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1 bg-surface-container-lowest">
                  <p className="font-label-caps text-[10px] text-outline uppercase tracking-wider">{item.eyebrow}</p>
                  <h3 className="font-h2 text-[20px] leading-tight text-on-background">{item.title}</h3>
                  {item.tags && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] bg-secondary-fixed-dim text-on-secondary-fixed px-2 py-0.5 rounded-full border border-outline">
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

      {/* Floating Input Bar */}
      <div className="fixed bottom-[88px] left-0 right-0 px-container-padding z-40 md:hidden pointer-events-none">
        <div className="max-w-screen-md mx-auto pointer-events-auto">
          {hint && (
             <div className="w-full text-center font-label-caps text-[10px] text-primary bg-secondary-fixed border-2 border-secondary px-3 py-1 rounded-t-xl mx-auto mb-[-2px] inline-block w-auto">
               {hint}
             </div>
          )}
          <div className="bg-surface-container-lowest rounded-full border-2 border-outline shadow-[0_4px_0_0_#000] flex items-center p-2 transition-all focus-within:shadow-[0_2px_0_0_#000] focus-within:translate-y-[2px]">
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
              disabled={!profile.userId || !input.trim() || isSending}
              onClick={handleSend}
              className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-tint transition-colors active:scale-95 shrink-0 disabled:opacity-50"
            >
              <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
