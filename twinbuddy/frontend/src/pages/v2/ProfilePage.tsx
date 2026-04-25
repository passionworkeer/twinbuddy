import { BarChart3, Save, Settings2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchTwinBuddyProfile, fetchTwinBuddySecurityStatus, patchTwinBuddyProfile } from '../../api/client';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { profileShowcases } from '../../mocks/v2Showcase';
import {
  TRAVEL_BUDGET_OPTIONS,
  V2_STORAGE_KEYS,
  type TwinBuddySecurityStatus,
  type TwinBuddyV2OnboardingData,
  type TwinBuddyV2Profile,
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

export default function ProfilePage() {
  const [profile, setProfile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [remoteProfile, setRemoteProfile] = useState<TwinBuddyV2Profile | null>(null);
  const [securityStatus, setSecurityStatus] = useState<TwinBuddySecurityStatus | null>(null);
  const [draftDesc, setDraftDesc] = useState(profile.selfDescription);
  const [draftBudget, setDraftBudget] = useState(profile.budget);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile.userId) return;
    fetchTwinBuddyProfile(profile.userId)
      .then((data) => {
        setRemoteProfile(data);
        setDraftDesc(data.self_desc);
        setDraftBudget(data.budget as TwinBuddyV2OnboardingData['budget']);
      })
      .catch(() => {
        setRemoteProfile(null);
      });
    fetchTwinBuddySecurityStatus(profile.userId).then(setSecurityStatus).catch(() => setSecurityStatus(null));
  }, [profile.userId]);

  const styleEntries = Object.entries(remoteProfile?.style_vector ?? {});

  const handleSave = async () => {
    if (!profile.userId) return;
    setIsSaving(true);
    try {
      const next = await patchTwinBuddyProfile(profile.userId, {
        budget: draftBudget,
        selfDescription: draftDesc,
      });
      setRemoteProfile(next);
      setProfile((prev) => ({
        ...prev,
        budget: next.budget as TwinBuddyV2OnboardingData['budget'],
        selfDescription: next.self_desc,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="glass-panel-strong p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[rgba(255,179,182,0.12)] text-[var(--color-primary)]">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{remoteProfile?.city || profile.city || 'TwinBuddy 用户'}</h2>
            <div className="flex flex-wrap gap-2">
              {profile.mbti ? <span className="mbti-badge">{profile.mbti}</span> : null}
              {(remoteProfile?.budget || profile.budget) ? <span className="tag">{remoteProfile?.budget || profile.budget}</span> : null}
              {securityStatus ? (
                <span className={securityStatus.is_verified ? 'tag selected' : 'tag'}>
                  {securityStatus.is_verified ? '已实名' : '待实名'}
                </span>
              ) : null}
              {profile.travelRange.map((range) => (
                <span key={range} className="tag">
                  {range}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
          {remoteProfile?.self_desc || profile.selfDescription || '你还没有补充旅行自我描述。'}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[var(--color-secondary)]" />
            <h3 className="text-lg font-semibold text-white">个人摘要</h3>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-text-secondary)]">常驻城市</dt>
              <dd className="text-white">{remoteProfile?.city || profile.city || '未填写'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-text-secondary)]">预算档位</dt>
              <dd className="text-white">{remoteProfile?.budget || profile.budget || '未填写'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-text-secondary)]">偏好范围</dt>
              <dd className="text-white">{profile.travelRange.length || 0} 项</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-text-secondary)]">安全状态</dt>
              <dd className="text-white">{securityStatus?.is_verified ? '实名认证已完成' : '待完成实名认证'}</dd>
            </div>
          </dl>
        </article>

        <article className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-[var(--color-tertiary)]" />
            <h3 className="text-lg font-semibold text-white">画像微调</h3>
          </div>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {TRAVEL_BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={draftBudget === option.value ? 'tag selected justify-center' : 'tag justify-center'}
                  onClick={() => setDraftBudget(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <textarea
              className="neon-input min-h-28 resize-none"
              onChange={(event) => setDraftDesc(event.target.value)}
              value={draftDesc}
            />
            <button className="btn-primary w-full" disabled={isSaving} onClick={handleSave} type="button">
              <Save className="h-4 w-4" />
              {isSaving ? '保存中' : '保存画像调整'}
            </button>
          </div>
        </article>
      </section>

      <section className="glass-panel p-5">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-[var(--color-secondary)]" />
          <h3 className="text-lg font-semibold text-white">Style Vector</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {styleEntries.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">继续在 AI 助手里聊天后，这里会显示表达风格和偏好关键词。</p>
          ) : (
            styleEntries.map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">{key}</p>
                <p className="mt-2 text-sm text-white">{Array.isArray(value) ? value.join('、') : String(value)}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <ShowcaseCarousel
        title="轮播展示"
        items={profileShowcases}
        className="p-5"
        intervalMs={5600}
      />
    </div>
  );
}
