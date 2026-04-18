import type { VideoItem } from '../types';

export const MIN_LOCATION_TRIGGER_COUNT = 2;
export const MAX_LOCATION_TRIGGER_COUNT = 3;

export function chooseLocationCardTriggerCount(randomValue: number = Math.random()): number {
  return randomValue < 0.5 ? MIN_LOCATION_TRIGGER_COUNT : MAX_LOCATION_TRIGGER_COUNT;
}

export function shouldTriggerTwinCard(currentIndex: number, locationCardIndex: number): boolean {
  return currentIndex >= locationCardIndex + 1;
}

export function buildFeedSequence(
  videos: VideoItem[],
  locationCard: VideoItem,
  twinCard: VideoItem,
  locationTriggerCount: number,
): VideoItem[] {
  const maxAllowed = Math.min(MAX_LOCATION_TRIGGER_COUNT, videos.length);
  const safeTriggerCount = Math.max(MIN_LOCATION_TRIGGER_COUNT, Math.min(locationTriggerCount, maxAllowed));

  return [
    ...videos.slice(0, safeTriggerCount),
    locationCard,
    ...videos.slice(safeTriggerCount),
    twinCard,
  ];
}
