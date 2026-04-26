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
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-4">
        <section className="glass-panel-strong p-5 sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(238,194,36,0.28)] bg-[rgba(238,194,36,0.08)] px-3 py-1 text-xs text-[var(--color-tertiary)]">
            <Rocket className="h-3.5 w-3.5" />
            社区广场
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">把旅行计划、偏好和找搭子意图公开出来</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            这里承接发帖、点赞、评论和“让我的数字人去找 TA 聊”。社区本身也是偏好数据入口，会持续反哺匹配和协商。
          </p>
          {statusText ? (
            <div className="mt-4 rounded-2xl border border-[rgba(74,222,128,0.18)] bg-[rgba(74,222,128,0.08)] px-4 py-3 text-sm text-[var(--color-secondary)]">
              {statusText}
            </div>
          ) : null}
          {errorText ? (
            <div className="mt-4 rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(93,32,32,0.24)] px-4 py-3 text-sm text-[var(--color-primary-light)]">
              {errorText}
            </div>
          ) : null}
        </section>

        <section className="glass-panel p-5">
          <div className="flex items-center gap-3">
            
            <h3 className="text-lg font-semibold text-white">发布你的旅行信号</h3>
          </div>
          <textarea
            className="neon-input mt-4 min-h-28 resize-none"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="发一条旅行计划或偏好动态，比如：五一想去顺德慢慢吃，找一个不赶行程的搭子。"
            value={draft}
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {hotTags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3">
              <VoiceInputButton onTranscribed={(text) => setDraft((current) => current.trim() ? `${current.trim()}\n${text}` : text)} />
              <button className="btn-primary" onClick={handlePublish} type="button">
                <SendHorizonal className="h-4 w-4" />
                发布动态
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="glass-panel p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(74,222,128,0.1)] text-sm font-semibold text-[var(--color-primary)]">
                  {post.author.nickname.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">@{post.author.nickname}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {post.location} · {post.author.mbti}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-white">{post.content}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="btn-secondary" onClick={() => handleLike(post.id)} type="button">
                  <Heart className="h-4 w-4" />
                  {post.likes_count}
                </button>
                <button className="btn-secondary" onClick={() => handleTwinChat(post.id)} type="button">
                  
                  让数字人去聊
                </button>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/8 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <MessageCircle className="h-4 w-4" />
                  评论 {post.comments_count}
                </div>
                <div className="mt-3 space-y-3">
                  {post.comments.slice(-2).map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-white/8 bg-white/4 px-3 py-2">
                      <p className="text-xs text-[var(--color-text-secondary)]">@{comment.author_nickname}</p>
                      <p className="mt-1 text-sm text-white">{comment.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    className="neon-input flex-1"
                    onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                    placeholder="补一句你的偏好，帮助数字分身理解你"
                    value={commentDrafts[post.id] ?? ''}
                  />
                  <button className="btn-primary" onClick={() => handleComment(post.id)} type="button">
                    回复
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="hidden glass-panel p-5 lg:block">
        <ShowcaseCarousel
          title="轮播展示"
          items={communityShowcases}
          className="p-0 border-none bg-transparent shadow-none"
        />
        <div className="rounded-3xl border border-dashed border-white/12 bg-black/10 p-5">
          <h3 className="text-lg font-semibold text-white">社区数据怎么反哺匹配</h3>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
            <li>发帖内容会更新目的地偏好、预算和旅行风格信号。</li>
            <li>点赞与评论会补足兴趣相似度，帮助 Tab2 更早筛出候选搭子。</li>
            <li>代聊入口会把帖子里的显性意图传给数字分身协商引擎。</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
