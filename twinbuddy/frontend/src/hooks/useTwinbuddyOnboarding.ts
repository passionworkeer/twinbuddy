import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  V2_STORAGE_KEYS,
  type TravelRangeOption,
  type TwinBuddyV2OnboardingData,
} from '../types';

const initialData: TwinBuddyV2OnboardingData = {
  mbti: '',
  travelRange: [],
  interests: [],
  budget: '',
  selfDescription: '',
  city: '',
  completed: false,
  timestamp: 0,
};

export function useTwinbuddyOnboarding() {
  const [data, setData, clearData] = useLocalStorage<TwinBuddyV2OnboardingData>(
    V2_STORAGE_KEYS.onboarding,
    initialData,
  );

  const step = useMemo(() => {
    if (!data.mbti) return 0;
    if (data.travelRange.length === 0) return 1;
    if (data.interests.length === 0) return 2;
    if (!data.budget) return 3;
    if (!data.selfDescription.trim()) return 4;
    if (!data.city.trim()) return 5;
    return 6;
  }, [data]);

  const setMbti = useCallback((mbti: string) => {
    setData((prev) => ({ ...prev, mbti }));
  }, [setData]);

  const toggleTravelRange = useCallback((range: TravelRangeOption) => {
    setData((prev) => {
      const exists = prev.travelRange.includes(range);
      return {
        ...prev,
        travelRange: exists
          ? prev.travelRange.filter((item) => item !== range)
          : [...prev.travelRange, range],
      };
    });
  }, [setData]);

  const toggleInterest = useCallback((interest: string) => {
    setData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((item) => item !== interest)
          : [...prev.interests, interest],
      };
    });
  }, [setData]);

  const setBudget = useCallback((budget: TwinBuddyV2OnboardingData['budget']) => {
    setData((prev) => ({ ...prev, budget }));
  }, [setData]);

  const setSelfDescription = useCallback((selfDescription: string) => {
    setData((prev) => ({ ...prev, selfDescription }));
  }, [setData]);

  const setCity = useCallback((city: string) => {
    setData((prev) => ({ ...prev, city }));
  }, [setData]);

  const complete = useCallback((payload?: { userId?: string; styleVector?: Record<string, unknown> }) => {
    const completedAt = Date.now();
    const nextValue: TwinBuddyV2OnboardingData = {
      ...data,
      completed: true,
      timestamp: completedAt,
      userId: payload?.userId ?? data.userId,
      styleVector: payload?.styleVector ?? data.styleVector,
    };

    try {
      window.localStorage.setItem(V2_STORAGE_KEYS.onboarding, JSON.stringify(nextValue));
    } catch {
      // Ignore storage failures and still update in-memory state.
    }

    setData((prev) => ({
      ...prev,
      completed: true,
      timestamp: completedAt,
      userId: payload?.userId ?? prev.userId,
      styleVector: payload?.styleVector ?? prev.styleVector,
    }));
  }, [data, setData]);

  return {
    data,
    step,
    setMbti,
    toggleTravelRange,
    toggleInterest,
    setBudget,
    setSelfDescription,
    setCity,
    complete,
    clearData,
  };
}
