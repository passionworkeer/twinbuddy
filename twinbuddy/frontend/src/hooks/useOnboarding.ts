import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { saveOnboarding } from '../api/client';
import { STORAGE_KEYS, type OnboardingData } from '../types';

const INITIAL_DATA: OnboardingData = {
  mbti: '',
  interests: [],
  voiceText: '',
  city: '',
  completed: false,
  timestamp: 0,
};

export function useOnboarding() {
  const [data, setData, clearData] = useLocalStorage<OnboardingData>(
    STORAGE_KEYS.onboarding,
    INITIAL_DATA,
  );

  const updateMbti = useCallback((mbti: string) => {
    setData((prev) => ({ ...prev, mbti }));
  }, [setData]);

  const toggleInterest = useCallback((interest: string) => {
    setData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  }, [setData]);

  const setVoiceText = useCallback((text: string) => {
    setData((prev) => ({ ...prev, voiceText: text }));
  }, [setData]);

  const setCity = useCallback((city: string) => {
    setData((prev) => ({ ...prev, city }));
  }, [setData]);

  const completeOnboarding = useCallback(async (): Promise<{ user_id: string; persona_id: string } | null> => {
    // 生成本地 ID（不等待 API）
    const user_id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const persona_id = `persona_${data.mbti.toLowerCase()}_${Math.random().toString(36).slice(2, 8)}`;

    // 立即更新本地状态
    setData((prev) => ({
      ...prev,
      user_id,
      persona_id,
      completed: true,
      timestamp: Date.now(),
    }));

    // 后台调用 API（不阻塞 UI）
    saveOnboarding({ ...data, user_id, persona_id }).catch((error) => {
      console.error('Onboarding API 调用失败:', error);
    });

    return { user_id, persona_id };
  }, [data, setData]);

  // Determine which step the user is currently on (1-4)
  // Step 2: mbti selected (on interests step)
  // Step 3: mbti + interests filled (on voice/text step — optional)
  // Step 4: completed (on city step — optional)
  const currentStep = useCallback((): number => {
    if (data.mbti && data.interests.length > 0) {
      // Both required fields filled — still on step 3 (voice/text), city is optional
      // Step 4 only reached when completed
      return data.completed ? 4 : 3;
    }
    if (data.mbti) return 2;
    if (data.completed) return 4;
    return 1;
  }, [data]);

  // Whether the user can advance from a given step
  // Step 1: requires MBTI selection
  // Step 2: requires at least 1 interest
  // Step 3: ALWAYS allowed (voice and text are optional)
  // Step 4: ALWAYS allowed (city is optional)
  const canAdvance = useCallback((step: number): boolean => {
    switch (step) {
      case 1: return !!data.mbti;
      case 2: return data.interests.length > 0;
      case 3: return true; // voice/text optional — always allowed
      case 4: return true; // city optional — always allowed to finish
      default: return true;
    }
  }, [data]);

  return {
    data,
    updateMbti,
    toggleInterest,
    setVoiceText,
    setCity,
    completeOnboarding,
    currentStep,
    canAdvance,
    clearData,
    isCompleted: data.completed,
  };
}
