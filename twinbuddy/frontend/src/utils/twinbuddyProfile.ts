import type {
  TwinBuddySecurityStatus,
  TwinBuddyV2OnboardingData,
  TwinBuddyV2Profile,
} from '../types';

export const EMPTY_ONBOARDING_PROFILE: TwinBuddyV2OnboardingData = {
  mbti: '',
  travelRange: [],
  interests: [],
  budget: '',
  selfDescription: '',
  city: '',
  completed: false,
  timestamp: 0,
};

export function mergeProfileIntoOnboarding(
  current: TwinBuddyV2OnboardingData,
  profile: TwinBuddyV2Profile,
): TwinBuddyV2OnboardingData {
  return {
    ...current,
    mbti: profile.mbti,
    travelRange: profile.travel_range as TwinBuddyV2OnboardingData['travelRange'],
    budget: profile.budget as TwinBuddyV2OnboardingData['budget'],
    selfDescription: profile.self_desc,
    city: profile.city,
    userId: profile.user_id,
    styleVector: profile.style_vector,
    completed: current.completed || Boolean(profile.user_id),
    timestamp: profile.updated_at,
  };
}

export function getVerificationBadgeCopy(status: TwinBuddySecurityStatus | null): string {
  if (!status) {
    return '待完成实名认证';
  }
  return status.is_verified ? '已实名认证' : '待完成实名认证';
}
