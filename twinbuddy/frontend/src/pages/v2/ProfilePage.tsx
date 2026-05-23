import { useEffect, useMemo, useState } from 'react';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { fetchTwinBuddyProfile, fetchTwinBuddySecurityStatus, patchTwinBuddyProfile } from '../../api/client';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { profileShowcases } from '../../mocks/v2Showcase';
import {
  TRAVEL_BUDGET_OPTIONS,
  V2_STORAGE_KEYS,
  type TwinBuddySecurityStatus,
  type TwinBuddyV2OnboardingData,
  type TwinBuddyV2Profile,
} from '../../types';
import { EMPTY_ONBOARDING_PROFILE, getVerificationBadgeCopy, mergeProfileIntoOnboarding } from '../../utils/twinbuddyProfile';

export default function ProfilePage() {
  const [profile, setProfile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, EMPTY_ONBOARDING_PROFILE);
  const [remoteProfile, setRemoteProfile] = useState<TwinBuddyV2Profile | null>(null);
  const [securityStatus, setSecurityStatus] = useState<TwinBuddySecurityStatus | null>(null);
  const [draftDesc, setDraftDesc] = useState(profile.selfDescription);
  const [draftBudget, setDraftBudget] = useState(profile.budget);
  const [isLoading, setIsLoading] = useState(Boolean(profile.userId));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!profile.userId) {
        setIsLoading(false);
        setRemoteProfile(null);
        setSecurityStatus(null);
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const [nextProfile, nextSecurityStatus] = await Promise.all([
          fetchTwinBuddyProfile(profile.userId),
          fetchTwinBuddySecurityStatus(profile.userId),
        ]);
        if (!mounted) return;

        setRemoteProfile(nextProfile);
        setSecurityStatus(nextSecurityStatus);
        setDraftDesc(nextProfile.self_desc);
        setDraftBudget(nextProfile.budget as TwinBuddyV2OnboardingData['budget']);
        setProfile((prev) => mergeProfileIntoOnboarding(prev, nextProfile));
      } catch (error) {
        if (!mounted) return;
        setRemoteProfile(null);
        setSecurityStatus(null);
        if (error instanceof Error) {
          setErrorText(error.message || '画像加载失败，请稍后重试。');
        } else {
          setErrorText('画像加载失败，请稍后重试。');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [profile.userId, setProfile]);

  useEffect(() => {
    if (!remoteProfile) {
      setDraftDesc(profile.selfDescription);
      setDraftBudget(profile.budget);
      return;
    }

    setDraftDesc(remoteProfile.self_desc);
    setDraftBudget(remoteProfile.budget as TwinBuddyV2OnboardingData['budget']);
  }, [profile.budget, profile.selfDescription, remoteProfile]);

  const displayProfile = remoteProfile;
  const displayCity = displayProfile?.city || profile.city || 'TwinBuddy 用户';
  const displayDescription = displayProfile?.self_desc || profile.selfDescription || '你还没有补充旅行自我描述。';
  const displayBudget = displayProfile?.budget || profile.budget || '未填写';
  const displayTravelRange = displayProfile?.travel_range ?? profile.travelRange;
  const displayStyleVector = displayProfile?.style_vector ?? profile.styleVector ?? {};
  const styleEntries = Object.entries(displayStyleVector);
  const verificationBadge = useMemo(() => getVerificationBadgeCopy(securityStatus), [securityStatus]);

  const handleSave = async () => {
    if (!profile.userId) {
      setErrorText('请先完成 onboarding 生成画像后再保存。');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorText('');

    try {
      const nextProfile = await patchTwinBuddyProfile(profile.userId, {
        budget: draftBudget,
        selfDescription: draftDesc,
      });
      setRemoteProfile(nextProfile);
      setProfile((prev) => mergeProfileIntoOnboarding(prev, nextProfile));
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorText(error.message || '保存失败，请稍后重试。');
      } else {
        setErrorText('保存失败，请稍后重试。');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const mingDimensions = [
    { label: '认知 (Cognitive)', value: 85, color: 'bg-primary' },
    { label: '表达 (Expression)', value: 92, color: 'bg-tertiary-fixed' },
    { label: '行为 (Behavior)', value: 78, color: 'bg-secondary' },
    { label: '情绪 (Emotion)', value: 88, color: 'bg-secondary-fixed' },
  ];

  return (
    <div className="relative flex flex-col">
      <div className="flex-1 px-container-padding pt-14 pb-[100px]">
        <div className="flex flex-col gap-section-margin pt-8 px-container-padding pb-8">
          {errorText ? (
            <div className="rounded-DEFAULT border-2 border-outline bg-error text-on-error px-4 py-3 text-sm">
              {errorText}
            </div>
          ) : null}

          {!profile.userId && !isLoading ? (
            <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-container-padding">
              <h2 className="font-h2 text-h2 text-on-background">先完成画像初始化</h2>
              <p className="mt-3 text-sm text-on-surface-variant">
                当前还没有可用的真实用户画像，请先回到 onboarding 创建你的 TwinBuddy profile。
              </p>
            </section>
          ) : null}

          <section className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-outline overflow-hidden bg-secondary-fixed shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-on-secondary-fixed">
                  {profile.mbti ? profile.mbti[0] : '?'}
                </div>
              </div>
              {profile.mbti && (
                <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary font-label-caps text-label-caps px-4 py-2 rounded-full border-2 border-outline uppercase">
                  {profile.mbti}
                </div>
              )}
            </div>
            <h1 className="font-h1 text-[48px] font-bold text-on-background leading-[1.1] tracking-[-0.04em]">
              {displayCity}
            </h1>
            <p className="font-body-lg text-[18px] text-on-surface-variant mt-2">
              {isLoading ? '正在同步真实画像...' : displayDescription}
            </p>
            <div className={`mt-4 px-4 py-2 rounded-full border-2 text-sm font-label-caps ${securityStatus?.is_verified ? 'border-outline bg-secondary-container text-on-secondary-container' : 'border-outline bg-surface-container text-on-surface'}`}>
              <span className="material-symbols-outlined text-base align-middle mr-1">
                {securityStatus?.is_verified ? 'verified' : 'pending'}
              </span>
              {verificationBadge}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-container-padding shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-container rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="font-h2 text-h2 text-on-background">MING 4D 认知模型</h2>
              <span className="material-symbols-outlined text-secondary text-3xl">psychology</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter relative z-10">
              {mingDimensions.map(({ label, value, color }) => (
                <div key={label} className="bg-surface-container p-4 rounded-DEFAULT border-2 border-outline-variant hover:border-secondary transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label-caps text-label-caps text-secondary uppercase">{label}</span>
                    <span className="font-body-md font-bold text-secondary">{value}%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden border border-outline">
                    <div className={`h-full ${color} rounded-r-full`} style={{ width: `${value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-container-padding">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">summarize</span>
              <h3 className="font-h2 text-h2 text-on-background">个人摘要</h3>
            </div>
            <dl className="space-y-3">
              {[
                { dt: '常驻城市', dd: displayCity },
                { dt: '预算档位', dd: displayBudget },
                { dt: '偏好范围', dd: `${displayTravelRange.length} 项` },
              ].map(({ dt, dd }) => (
                <div key={dt} className="flex items-center justify-between">
                  <dt className="text-on-surface-variant">{dt}</dt>
                  <dd className="font-body-md text-on-surface">{dd}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-container-padding">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">edit_note</span>
              <h3 className="font-h2 text-h2 text-on-background">画像微调</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {TRAVEL_BUDGET_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`px-4 py-3 rounded-full border-2 font-body-md text-sm text-left transition ${
                      draftBudget === option.value
                        ? 'border-secondary bg-secondary text-on-secondary'
                        : 'border-outline bg-surface-container text-on-surface hover:border-secondary'
                    }`}
                    onClick={() => setDraftBudget(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border-2 border-outline rounded-DEFAULT bg-surface-container-lowest text-on-background px-4 py-3 placeholder:text-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all min-h-28 resize-none font-body-md"
                onChange={(event) => setDraftDesc(event.target.value)}
                placeholder="一句话介绍你和谁旅行最舒服"
                value={draftDesc}
              />
              <button
                className="w-full bg-primary text-on-primary font-body-md px-4 py-3 rounded-full border-2 border-outline shadow-[0_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[0_2px_0_0_#000] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50"
                disabled={isSaving || !profile.userId}
                onClick={handleSave}
                type="button"
              >
                {saveSuccess ? '✓ 已保存' : isSaving ? '保存中...' : '保存画像调整'}
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-h2 text-h2 text-on-background">旅行偏好</h2>
            <div className="flex flex-wrap gap-3">
              {(profile.interests ?? []).length > 0
                ? profile.interests.map((tag) => (
                    <div key={tag} className="px-6 py-3 bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps rounded-full border-2 border-outline flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">label</span>
                      {tag}
                    </div>
                  ))
                : ['自然风光', '深度人文', '地道美食', '摄影打卡', '夜生活'].map((tag) => (
                    <div key={tag} className="px-6 py-3 bg-surface-container text-on-surface font-label-caps text-label-caps rounded-full border-2 border-outline flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">label</span>
                      {tag}
                    </div>
                  ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-container-padding">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">style</span>
              <h3 className="font-h2 text-h2 text-on-background">Style Vector</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {styleEntries.length > 0 ? styleEntries.map(([key, value]) => (
                <div key={key} className="rounded-DEFAULT border-2 border-outline bg-surface-container p-4">
                  <p className="text-xs uppercase tracking-[0.1em] text-on-surface-variant font-label-caps">{key}</p>
                  <p className="mt-2 text-sm text-on-surface">
                    {Array.isArray(value) ? value.join('、') : String(value)}
                  </p>
                </div>
              )) : (
                <div className="rounded-DEFAULT border-2 border-outline bg-surface-container p-4 text-sm text-on-surface-variant">
                  暂无 style vector 数据，先通过首页聊天和画像设置来逐步丰富你的数字分身。
                </div>
              )}
            </div>
          </section>

          <ShowcaseCarousel
            title="人格快照"
            items={profileShowcases}
            className="p-container-padding"
            intervalMs={5600}
          />
        </div>
      </div>
    </div>
  );
}
