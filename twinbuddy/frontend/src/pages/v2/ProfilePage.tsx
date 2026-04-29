import { useState } from 'react';
import ShowcaseCarousel from '../../components/v2/ShowcaseCarousel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { profileShowcases } from '../../mocks/v2Showcase';
import { mockProfile, mockSecurityStatus } from '../../mocks/v2ApiMock';
import {
  TRAVEL_BUDGET_OPTIONS,
  V2_STORAGE_KEYS,
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

export default function ProfilePage() {
  const [profile, setProfile] = useLocalStorage<TwinBuddyV2OnboardingData>(V2_STORAGE_KEYS.onboarding, initialProfile);
  const [draftDesc, setDraftDesc] = useState(profile.selfDescription || mockProfile.self_desc);
  const [draftBudget, setDraftBudget] = useState(profile.budget || mockProfile.budget);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const styleEntries = Object.entries(mockProfile.style_vector ?? {});

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        budget: draftBudget as TwinBuddyV2OnboardingData['budget'],
        selfDescription: draftDesc,
      }));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 800);
  };

  const mingDimensions = [
    { label: '认知 (Cognitive)', value: 85, color: 'bg-primary' },
    { label: '表达 (Expression)', value: 92, color: 'bg-tertiary-fixed' },
    { label: '行为 (Behavior)', value: 78, color: 'bg-secondary' },
    { label: '情绪 (Emotion)', value: 88, color: 'bg-secondary-fixed' },
  ];

  return (
    <div className="relative flex flex-col">
      <div className="flex-1 px-container-padding pt-16 pb-[100px]">
        <div className="flex flex-col gap-section-margin pt-8 px-container-padding pb-8">

          {/* Header: Avatar + Identity */}
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
              {mockProfile.city || profile.city || 'TwinBuddy 用户'}
            </h1>
            <p className="font-body-lg text-[18px] text-on-surface-variant mt-2">
              {mockProfile.self_desc || profile.selfDescription || '你还没有补充旅行自我描述。'}
            </p>
            {/* Trust badge */}
            <div className={`mt-4 px-4 py-2 rounded-full border-2 text-sm font-label-caps ${mockSecurityStatus.is_verified ? 'border-outline bg-secondary-container text-on-secondary-container' : 'border-outline bg-surface-container text-on-surface'}`}>
              <span className="material-symbols-outlined text-base align-middle mr-1">
                {mockSecurityStatus.is_verified ? 'verified' : 'pending'}
              </span>
              {mockSecurityStatus.is_verified ? '已实名认证' : '待完成实名认证'}
            </div>
          </section>

          {/* MING 4D Section */}
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

          {/* Personal Summary */}
          <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-container-padding">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">summarize</span>
              <h3 className="font-h2 text-h2 text-on-background">个人摘要</h3>
            </div>
            <dl className="space-y-3">
              {[
                { dt: '常驻城市', dd: mockProfile.city || profile.city || '未填写' },
                { dt: '预算档位', dd: mockProfile.budget || profile.budget || '未填写' },
                { dt: '偏好范围', dd: `${(mockProfile.travel_range || profile.travelRange).length} 项` },
              ].map(({ dt, dd }) => (
                <div key={dt} className="flex items-center justify-between">
                  <dt className="text-on-surface-variant">{dt}</dt>
                  <dd className="font-body-md text-on-surface">{dd}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Profile Edit */}
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
                disabled={isSaving}
                onClick={handleSave}
                type="button"
              >
                {saveSuccess ? '✓ 已保存' : isSaving ? '保存中...' : '保存画像调整'}
              </button>
            </div>
          </section>

          {/* Travel Preferences */}
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

          {/* Style Vector */}
          <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline p-container-padding">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">style</span>
              <h3 className="font-h2 text-h2 text-on-background">Style Vector</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {styleEntries.map(([key, value]) => (
                <div key={key} className="rounded-DEFAULT border-2 border-outline bg-surface-container p-4">
                  <p className="text-xs uppercase tracking-[0.1em] text-on-surface-variant font-label-caps">{key}</p>
                  <p className="mt-2 text-sm text-on-surface">
                    {Array.isArray(value) ? value.join('、') : String(value)}
                  </p>
                </div>
              ))}
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
