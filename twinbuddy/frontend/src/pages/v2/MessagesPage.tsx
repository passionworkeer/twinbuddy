import { useEffect, useState } from 'react';
import { fetchTwinBuddyConversations } from '../../api/client';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type {
  TwinBuddyConversationItem,
  TwinBuddyV2OnboardingData,
} from '../../types';
import { V2_STORAGE_KEYS } from '../../types';

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

export default function MessagesPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [conversations, setConversations] = useState<TwinBuddyConversationItem[]>([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [errorText, setErrorText] = useState('');

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

  return (
    <div className="relative flex flex-col">
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
          className="w-full bg-surface-container-lowest border-2 border-primary rounded-full py-4 pl-12 pr-4 font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-4 focus:ring-secondary-container transition-shadow shadow-[0_4px_0_0_#000] focus:shadow-[0_2px_0_0_#000] focus:translate-y-[2px]"
          placeholder="搜索对话..."
        />
      </div>

      {/* Messages List */}
      <div className="flex flex-col gap-card-gap pb-8">
        {conversations.map((chat) => (
          <button
            key={chat.room_id}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left group transition-all ${
              chat.room_id === activeRoomId
                ? 'bg-surface-container-lowest border-2 border-primary shadow-[0_4px_0_0_#000] hover:translate-y-[-2px] hover:shadow-[0_6px_0_0_#000]'
                : 'bg-surface-container-low border-2 border-transparent hover:border-outline-variant hover:bg-surface-container-lowest'
            }`}
            onClick={() => setActiveRoomId(chat.room_id)}
            type="button"
          >
            <div className="relative shrink-0">
              <div className={`w-16 h-16 rounded-full border-2 ${
                chat.unread_count > 0 ? 'border-primary' : 'border-outline-variant'
              } bg-secondary-fixed flex items-center justify-center overflow-hidden`}>
                <span className="font-h2 text-h2 text-on-secondary-fixed">
                  {chat.peer_user.nickname.slice(0, 1)}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-secondary border-2 border-surface-container-lowest rounded-full"></div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`font-body-lg text-body-lg truncate ${chat.unread_count > 0 ? 'font-bold text-primary' : 'font-medium text-on-surface'}`}>
                  {chat.peer_user.nickname}
                </h3>
                {chat.unread_count > 0 && (
                  <span className="bg-secondary text-on-secondary rounded-full px-2 py-0.5 border-2 border-outline font-label-caps text-label-caps shrink-0 ml-2">
                    {chat.unread_count}
                  </span>
                )}
              </div>
              <p className="font-body-md text-base text-on-surface-variant line-clamp-1">{chat.last_message}</p>
            </div>
          </button>
        ))}

        {conversations.length === 0 && !errorText && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-surface-container rounded-full border-2 border-outline flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-outline-variant">chat_bubble</span>
            </div>
            <h3 className="font-h2 text-2xl text-on-surface mb-2">暂无私信</h3>
            <p className="font-body-md text-on-surface-variant">在社区认识搭子后，就可以开始聊天了。</p>
          </div>
        )}

        {errorText && (
          <div className="rounded-xl border-2 border-error bg-error-container px-4 py-3 text-sm text-error font-body-md">
            {errorText}
          </div>
        )}
      </div>
    </div>
    </div>
    </div>
  );
}
