import { describe, expect, it } from 'vitest';
import type { VideoItem } from '../types';
import {
  buildFeedSequence,
  chooseLocationCardTriggerCount,
  shouldTriggerTwinCard,
} from '../utils/feedFlow';

function makeVideo(id: string): VideoItem {
  return {
    id,
    type: 'video',
    cover_url: `/images/${id}.jpg`,
    video_url: `/videos/${id}.mp4`,
    location: '大理',
    title: id,
  };
}

describe('feedFlow', () => {
  it('returns trigger count 2 when random value is below 0.5', () => {
    expect(chooseLocationCardTriggerCount(0.2)).toBe(2);
  });

  it('returns trigger count 3 when random value is 0.5 or above', () => {
    expect(chooseLocationCardTriggerCount(0.5)).toBe(3);
    expect(chooseLocationCardTriggerCount(0.9)).toBe(3);
  });

  it('inserts location card after the configured number of videos', () => {
    const videos = [makeVideo('v1'), makeVideo('v2'), makeVideo('v3'), makeVideo('v4'), makeVideo('v5')];
    const locationCard = {
      ...makeVideo('location-guide-1'),
      type: 'location_card' as const,
      title: '地点卡片',
    };
    const twinCard = {
      ...makeVideo('twin1'),
      type: 'twin_card' as const,
      title: '懂你卡片',
    };

    const itemsAfterTwo = buildFeedSequence(videos, locationCard, twinCard, 2);
    expect(itemsAfterTwo.map((item) => item.id)).toEqual([
      'v1',
      'v2',
      'location-guide-1',
      'v3',
      'v4',
      'v5',
      'twin1',
    ]);

    const itemsAfterThree = buildFeedSequence(videos, locationCard, twinCard, 3);
    expect(itemsAfterThree.map((item) => item.id)).toEqual([
      'v1',
      'v2',
      'v3',
      'location-guide-1',
      'v4',
      'v5',
      'twin1',
    ]);
  });

  it('triggers twin card only after user passes location card index', () => {
    expect(shouldTriggerTwinCard(2, 2)).toBe(false);
    expect(shouldTriggerTwinCard(3, 2)).toBe(true);
  });
});
