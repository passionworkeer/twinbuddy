import { describe, expect, it } from 'vitest';
import { inferGuidePreference } from '../utils/scenePreference';
import { createLocationCardItem } from '../mocks/locationGuides';
import type { VideoItem } from '../types';

const baseVideo: VideoItem = {
  id: 'v4',
  type: 'video',
  cover_url: '/images/dali.jpg',
  video_url: '/videos/video4.mp4',
  location: '大理',
  title: '洱海古城日落',
};

describe('scene preference and guide mapping', () => {
  it('infers indoor preference from indoor-leaning interests', () => {
    const preference = inferGuidePreference(['古镇人文', '街边小吃探店', '慢节奏旅行']);
    expect(preference).toBe('indoor');
  });

  it('infers outdoor preference from outdoor-leaning interests', () => {
    const preference = inferGuidePreference(['爱看山川湖海', '徒步登山', '摄影打卡']);
    expect(preference).toBe('outdoor');
  });

  it('creates location card with indoor variant content', () => {
    const locationCard = createLocationCardItem(baseVideo, 'indoor');

    expect(locationCard.type).toBe('location_card');
    expect(locationCard.location).toBe('大理');
    expect(locationCard.locationGuide?.preference).toBe('indoor');
    expect(locationCard.locationGuide?.version.heading).toContain('室内');
    expect(locationCard.locationGuide?.version.strategies.length).toBeGreaterThan(0);
  });
});
