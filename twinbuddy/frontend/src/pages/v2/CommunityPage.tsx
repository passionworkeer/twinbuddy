import { Heart, MessageCircle, Rocket, SendHorizonal, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import VoiceInputButton from '../../components/stt/VoiceInputButton';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { communityShowcases } from '../../mocks/v2Showcase';
import { mockCommunityPosts } from '../../mocks/v2ApiMock';
import type { TwinBuddyCommunityPost, TwinBuddyV2OnboardingData } from '../../types';
import { V2_STORAGE_KEYS } from '../../types';

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

export default function CommunityPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [posts, setPosts] = useState<TwinBuddyCommunityPost[]>(mockCommunityPosts);
  const [draft, setDraft] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [statusText, setStatusText] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twinChatTarget, setTwinChatTarget] = useState<string | null>(null);
  const [twinChatStatus, setTwinChatStatus] = useState<'idle' | 'confirming' | 'sending' | 'done'>('idle');

  const hotTags = useMemo(() => ['深圳', '周末', '美食', '慢节奏', '五一'], []);

  const loadFeed = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPosts(mockCommunityPosts);
      setIsLoading(false);
    }, 500);
  };

  const handlePublish = () => {
    if (!draft.trim()) return;
    const newPost: TwinBuddyCommunityPost = {
      id: `post_${Date.now()}`,
      author: { nickname: '你', mbti: profile.mbti || 'INTJ' },
      content: draft.trim(),
      location: profile.city || '深圳',
      likes_count: 0,
      comments_count: 0,
      comments: [],
      tags: hotTags.filter((tag) => draft.includes(tag)).slice(0, 3),
      images: [],
      created_at: Date.now(),
    };
    setStatusText('动态已发布，数字分身会把这条内容纳入偏好画像。');
    setPublishSuccess(true);
    setPosts((prev) => [newPost, ...prev]);
    setDraft('');
    setTimeout(() => { setStatusText(''); setPublishSuccess(false); }, 3000);
  };

  const handleLike = (postId: string) => {
    setPosts((prev) => prev.map((post) =>
      post.id === postId ? { ...post, likes_count: post.likes_count + 1 } : post,
    ));
  };

  const handleComment = (postId: string) => {
    if (!commentDrafts[postId]?.trim()) return;
    const comment = {
      id: `c_${Date.now()}`,
      user_id: profile.userId!,
      author_nickname: '你',
      content: commentDrafts[postId].trim(),
      created_at: Date.now(),
    };
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment], comments_count: post.comments_count + 1 }
          : post,
      ),
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleTwinChat = (postId: string, authorNickname: string) => {
    setTwinChatTarget(authorNickname);
    setTwinChatStatus('confirming');
  };

  const handleTwinChatConfirm = () => {
    setTwinChatStatus('sending');
    setTimeout(() => {
      setTwinChatStatus('done');
      setTimeout(() => {
        setTwinChatTarget(null);
        setTwinChatStatus('idle');
      }, 4000);
    }, 2000);
  };

  const handleTwinChatCancel = () => {
    setTwinChatTarget(null);
    setTwinChatStatus('idle');
  };

  return (
    <div className="relative flex flex-col">
      {/* FAB: Refresh */}
      <button
        className="fixed bottom-[100px] right-6 w-12 h-12 bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0_0_#000] rounded-full flex items-center justify-center hover:-translate-y-1 hover:shadow-[2px_2px_0_0_#000] transition-all z-40"
        onClick={loadFeed}
        type="button"
        aria-label="刷新动态"
      >
        <RefreshCw className={`h-5 w-5 text-on-surface-variant ${isLoading ? 'animate-spin' : ''}`} />
      </button>

      <div className="flex-1 px-container-padding pt-16 pb-[100px]">
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-outline bg-tertiary-fixed px-3 py-1 text-xs text-on-tertiary-fixed">
                <Rocket className="h-3.5 w-3.5" />
                <span className="font-label-caps text-label-caps uppercase">社区广场</span>
              </div>
              <h2 className="mt-4 font-h2 text-h2 text-on-background leading-tight">把旅行计划、偏好和找搭子意图公开出来</h2>
              <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                这里承接发帖、点赞、评论和"让我的数字人去找 TA 聊"。社区本身也是偏好数据入口，会持续反哺匹配和协商。
              </p>
              {statusText ? (
                <div className="mt-4 rounded-DEFAULT border-2 border-outline bg-secondary-container px-4 py-3 font-body-md text-on-secondary-container">
                  {statusText}
                  {publishSuccess && (
                    <span className="ml-2 inline-flex items-center gap-1 text-sm text-on-tertiary">
                      <CheckCircle2 className="h-4 w-4" />
                      已成功
                    </span>
                  )}
                </div>
              ) : null}
            </section>

            <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline transition-all duration-300 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <h3 className="font-h2 text-h2 text-on-background leading-tight">发布你的旅行信号</h3>
              <textarea
                className="border-2 border-outline rounded-DEFAULT bg-surface-container-lowest text-on-background px-4 py-3 placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-4 min-h-28 resize-none font-body-md"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="发一条旅行计划或偏好动态，比如：五一想去顺德慢慢吃，找一个不赶行程的搭子。"
                value={draft}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {hotTags.map((tag) => (
                    <span key={tag} className="font-label-caps text-label-caps px-3 py-1 rounded-full uppercase border-2 border-outline bg-surface-variant text-on-surface-variant">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <VoiceInputButton onTranscribed={(text) => setDraft((current) => current.trim() ? `${current.trim()}\n${text}` : text)} />
                  <button className="bg-primary text-on-primary font-body-md px-4 py-2 rounded-DEFAULT border-2 border-transparent hover:brightness-110 active:scale-95 transition-all" onClick={handlePublish} type="button">
                    <SendHorizonal className="h-4 w-4 inline mr-1" />
                    发布动态
                  </button>
                </div>
              </div>
            </section>

            <div className="space-y-4">
              {posts.map((post) => (
                <article key={post.id} className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-container-padding hover:-translate-y-1 hover:shadow-[0_4px_0_0_#000] transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-gutter">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-outline bg-secondary-fixed">
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-on-secondary-fixed">
                          {post.author.nickname.slice(0, 1)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-body-md text-base font-semibold text-on-surface">{post.author.nickname}</span>
                          <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps px-2 py-1 rounded-full uppercase border-2 border-outline">
                            {post.author.mbti}
                          </span>
                        </div>
                        <span className="font-body-md text-[13px] text-on-surface-variant">{post.location}</span>
                      </div>
                    </div>
                    <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>

                  {/* Content */}
                  <p className="font-body-md text-base text-on-surface mb-gutter line-clamp-3">
                    {post.content}
                  </p>

                  {/* Image Grid */}
                  {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 rounded-DEFAULT overflow-hidden border-2 border-outline mb-gutter ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {post.images.slice(0, 4).map((img, i) => (
                        <div key={i} className="aspect-square bg-surface-container overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 text-on-surface-variant">
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors group" onClick={() => handleLike(post.id)} type="button">
                      <Heart className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="font-body-md text-[14px]">{post.likes_count}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors group" type="button">
                      <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
                      <span className="font-body-md text-[14px]">{post.comments_count}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors group ml-auto" onClick={() => handleTwinChat(post.id, post.author.nickname)} type="button">
                      <span className="material-symbols-outlined group-hover:scale-110 transition-transform">smart_toy</span>
                      <span className="font-body-md text-[14px]">代聊</span>
                    </button>
                  </div>

                  {/* Comments */}
                  {post.comments_count > 0 && (
                    <div className="mt-5 rounded-DEFAULT border-2 border-outline bg-surface-container p-4">
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant font-body-md">
                        <MessageCircle className="h-4 w-4" />
                        评论 {post.comments_count}
                      </div>
                      <div className="mt-3 space-y-3">
                        {post.comments.slice(-2).map((comment) => (
                          <div key={comment.id} className="rounded-lg border border-outline bg-surface-container-high px-3 py-2">
                            <p className="text-xs text-on-surface-variant font-body-md">@{comment.author_nickname}</p>
                            <p className="mt-1 text-sm text-on-background">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="mt-4 flex gap-3">
                    <input
                      className="border-2 border-outline rounded-DEFAULT bg-surface-container-lowest text-on-background px-4 py-3 placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all flex-1 font-body-md"
                      onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                      placeholder="补一句你的偏好，帮助数字分身理解你"
                      value={commentDrafts[post.id] ?? ''}
                    />
                    <button className="bg-primary text-on-primary font-body-md px-4 py-2 rounded-DEFAULT border-2 border-transparent hover:brightness-110 active:scale-95 transition-all" onClick={() => handleComment(post.id)} type="button">
                      回复
                    </button>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="font-label-caps text-label-caps px-3 py-1 rounded-full uppercase border-2 border-outline bg-surface-variant text-on-surface-variant">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          <aside className="hidden bg-surface-container-lowest rounded-DEFAULT border-2 border-outline transition-all duration-300 p-5 lg:block shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <ShowcaseCarousel
              title="轮播展示"
              items={communityShowcases}
              className="p-0 border-none bg-transparent shadow-none"
            />
            <div className="rounded-DEFAULT border-2 border-dashed border-outline bg-surface-container p-5 mt-4">
              <h3 className="font-h2 text-h2 text-on-background leading-tight">社区数据怎么反哺匹配</h3>
              <ul className="mt-4 space-y-3 font-body-md text-body-md text-on-surface-variant">
                <li>发帖内容会更新目的地偏好、预算和旅行风格信号。</li>
                <li>点赞与评论会补足兴趣相似度，帮助 Tab2 更早筛出候选搭子。</li>
                <li>代聊入口会把帖子里的显性意图传给数字分身协商引擎。</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* TwinChat Modal */}
      {twinChatTarget && twinChatStatus !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-6 w-full max-w-sm shadow-[4px_4px_0_0_#000]">
            {twinChatStatus === 'confirming' && (
              <>
                <p className="font-body-md text-base text-on-surface">
                  让数字分身去和 <span className="font-semibold text-primary">@{twinChatTarget}</span> 聊聊？
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  数字分身会自动分析对方的旅行偏好并发起协商。
                </p>
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    className="px-4 py-2 text-sm border-2 border-outline rounded-DEFAULT text-on-surface-variant hover:bg-surface-container transition-colors"
                    onClick={handleTwinChatCancel}
                    type="button"
                  >
                    取消
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-primary text-on-primary rounded-DEFAULT border-2 border-transparent hover:brightness-110 active:scale-95 transition-all"
                    onClick={handleTwinChatConfirm}
                    type="button"
                  >
                    确认出发
                  </button>
                </div>
              </>
            )}
            {twinChatStatus === 'sending' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="font-body-md text-on-surface-variant">数字分身已出发...</p>
              </div>
            )}
            {twinChatStatus === 'done' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="h-10 w-10 text-tertiary" />
                <p className="font-body-md text-on-surface text-center">
                  代聊已发起，对方将在24小时内收到数字分身协商请求。
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
