import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
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

  const completeOnboarding = useCallback(() => {
    setData((prev) => ({
      ...prev,
      completed: true,
      timestamp: Date.now(),
    }));
  }, [setData]);

  const currentStep = useCallback((): number => {
    if (data.mbti && data.interests.length > 0 && data.city) return 4;
    if (data.mbti && data.interests.length > 0) return 3;
    if (data.mbti) return 2;
    if (data.completed) return 4;
    return 1;
  }, [data]);

  const canAdvance = useCallback((step: number): boolean => {
    switch (step) {
      case 1: return !!data.mbti;
      case 2: return data.interests.length > 0;
      case 3: return !!data.city;
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
