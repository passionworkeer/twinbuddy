import { Heart, MessageCircle, Rocket, SendHorizonal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  commentTwinBuddyCommunityPost,
  createTwinBuddyCommunityPost,
  fetchTwinBuddyCommunityFeed,
  likeTwinBuddyCommunityPost,
  triggerTwinBuddyCommunityTwinChat,
} from '../../api/client';
import VoiceInputButton from '../../components/stt/VoiceInputButton';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { communityShowcases } from '../../mocks/v2Showcase';
import type { TwinBuddyCommunityPost, TwinBuddyV2OnboardingData } from '../../types';
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

export default function CommunityPage() {
  const [profile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [posts, setPosts] = useState<TwinBuddyCommunityPost[]>([]);
  const [draft, setDraft] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    fetchTwinBuddyCommunityFeed(profile.userId)
      .then((items) => {
        setErrorText('');
        setPosts(items);
      })
      .catch(() => {
        setErrorText('社区动态暂时加载失败，请稍后刷新重试。');
        setPosts([]);
      });
  }, [profile.userId]);

  const hotTags = useMemo(() => ['深圳', '周末', '美食', '慢节奏', '五一'], []);

  const handlePublish = async () => {
    if (!profile.userId || !draft.trim()) return;
    try {
      const created = await createTwinBuddyCommunityPost({
        userId: profile.userId,
        content: draft.trim(),
        location: profile.city || '深圳',
        tags: hotTags.filter((tag) => draft.includes(tag)).slice(0, 3),
      });
      setErrorText('');
      setStatusText('动态已发布，数字分身会把这条内容纳入偏好画像。');
      setPosts((prev) => [created, ...prev]);
      setDraft('');
    } catch {
      setErrorText('发布失败，请稍后再试。');
    }
  };

  const handleLike = async (postId: string) => {
    if (!profile.userId) return;
    try {
      const result = await likeTwinBuddyCommunityPost(postId, profile.userId);
      setErrorText('');
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes_count: result.likes_count } : post)));
    } catch {
      setErrorText('点赞失败，请稍后重试。');
    }
  };

  const handleComment = async (postId: string) => {
    if (!profile.userId || !commentDrafts[postId]?.trim()) return;
    try {
      const comment = await commentTwinBuddyCommunityPost(postId, {
        userId: profile.userId,
        content: commentDrafts[postId].trim(),
      });
      setErrorText('');
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, comment], comments_count: post.comments_count + 1 }
            : post,
        ),
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      setErrorText('评论发送失败，请稍后再试。');
    }
  };

  const handleTwinChat = async (postId: string) => {
    if (!profile.userId) return;
    try {
      const result = await triggerTwinBuddyCommunityTwinChat(postId, profile.userId);
      setErrorText('');
      setStatusText(result.summary);
    } catch {
      setErrorText('代聊发起失败，请稍后再试。');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-4">
        <section className="bg-surface-container-lowest brutalist-card-active rounded-DEFAULT border-2 border-outline p-5 sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline bg-tertiary-container text-on-tertiary-container border-2 border-outline px-3 py-1 text-xs text-[var(--color-tertiary)]">
            <Rocket className="h-3.5 w-3.5" />
            社区广场
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-on-background font-h1 placeholder:text-on-surface-variant">把旅行计划、偏好和找搭子意图公开出来</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant font-body-md">
            这里承接发帖、点赞、评论和“让我的数字人去找 TA 聊”。社区本身也是偏好数据入口，会持续反哺匹配和协商。
          </p>
          {statusText ? (
            <div className="mt-4 rounded-2xl border border-outline bg-secondary-container px-4 py-3 text-sm text-primary font-body-md">
              {statusText}
            </div>
          ) : null}
          {errorText ? (
            <div className="mt-4 rounded-2xl border border-error bg-error-container text-on-error-container border-2 border-error px-4 py-3 text-sm text-error font-body-md">
              {errorText}
            </div>
          ) : null}
        </section>

        <section className="bg-surface-container-lowest brutalist-card-inactive rounded-DEFAULT border-2 border-outline transition-all duration-300 p-5">
          <div className="flex items-center gap-3">
            
            <h3 className="text-lg font-semibold text-on-background font-h1 placeholder:text-on-surface-variant">发布你的旅行信号</h3>
          </div>
          <textarea
            className="border-2 border-outline rounded-DEFAULT bg-surface-container-lowest text-on-background px-4 py-3 placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-4 min-h-28 resize-none"
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
                <SendHorizonal className="h-4 w-4" />
                发布动态
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="bg-surface-container-lowest rounded-lg border-2 border-outline shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-container-padding hover:-translate-y-1 transition-transform duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-gutter">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-outline">
                    <div className="w-full h-full bg-secondary-fixed flex items-center justify-center text-xl font-bold text-on-secondary-fixed">
                      {post.author.nickname.slice(0, 1)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-body-md text-base font-semibold text-on-surface">{post.author.nickname}</span>
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps px-2 py-1 rounded-full uppercase border border-outline-variant">
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
                <div className={`grid gap-2 rounded-lg overflow-hidden border-2 border-outline mb-gutter ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 aspect-square'}`}>
                  {post.images.slice(0, 4).map((img, i) => (
                    <div key={i} className="aspect-square bg-surface-container">
                      <img src={img} alt="Post image" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 text-on-surface-variant">
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors group" onClick={() => handleLike(post.id)} type="button">
                  <Heart className={`h-4 w-4 group-hover:scale-110 transition-transform ${posts.find(p => p.id === post.id) ? 'fill-current' : ''}`} />
                  <span className="font-body-md text-[14px]">{post.likes_count}</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors group" type="button">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
                  <span className="font-body-md text-[14px]">{post.comments_count}</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors group ml-auto" type="button">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
                </button>
              </div>

              {/* Comments */}
              {post.comments_count > 0 && (
                <div className="mt-5 rounded-xl border border-outline bg-surface-container p-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant font-body-md">
                    <MessageCircle className="h-4 w-4" />
                    评论 {post.comments_count}
                  </div>
                  <div className="mt-3 space-y-3">
                    {post.comments.slice(-2).map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-outline bg-surface-container-high border-[1px] px-3 py-2">
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
                  className="border-2 border-outline rounded-lg bg-surface-container-lowest text-on-background px-4 py-3 placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all flex-1"
                  onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                  placeholder="补一句你的偏好，帮助数字分身理解你"
                  value={commentDrafts[post.id] ?? ''}
                />
                <button className="bg-primary text-on-primary font-body-md px-4 py-2 rounded-lg border-2 border-transparent hover:brightness-110 active:scale-95 transition-all" onClick={() => handleComment(post.id)} type="button">
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

      <aside className="hidden bg-surface-container-lowest brutalist-card-inactive rounded-DEFAULT border-2 border-outline transition-all duration-300 p-5 lg:block">
        <ShowcaseCarousel
          title="轮播展示"
          items={communityShowcases}
          className="p-0 border-none bg-transparent shadow-none"
        />
        <div className="rounded-3xl border border-dashed border-outline bg-surface-container p-5">
          <h3 className="text-lg font-semibold text-on-background font-h1 placeholder:text-on-surface-variant">社区数据怎么反哺匹配</h3>
          <ul className="mt-4 space-y-3 text-sm text-on-surface-variant font-body-md">
            <li>发帖内容会更新目的地偏好、预算和旅行风格信号。</li>
            <li>点赞与评论会补足兴趣相似度，帮助 Tab2 更早筛出候选搭子。</li>
            <li>代聊入口会把帖子里的显性意图传给数字分身协商引擎。</li>
          </ul>
        </div>
      </aside>
    </div>
    </div>
  );
}
