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
  it('infers indoorRelaxed preference from indoor-leaning interests', () => {
    const preference = inferGuidePreference(['古镇人文', '街边小吃探店', '慢节奏旅行']);
    expect(preference).toBe('indoorRelaxed');
  });

  it('infers outdoorAdventure preference from outdoor-leaning interests', () => {
    const preference = inferGuidePreference(['爱看山川湖海', '徒步登山', '摄影打卡']);
    expect(preference).toBe('outdoorAdventure');
  });

  it('infers indoorCultural from culture-heavy interests', () => {
    const preference = inferGuidePreference(['古镇人文', '摄影打卡', '详细打卡']);
    expect(preference).toBe('indoorCultural');
  });

  it('infers outdoorNormal from mild outdoor interests', () => {
    const preference = inferGuidePreference(['爱看山川湖海', '自驾自由', '说走就走']);
    expect(preference).toBe('outdoorNormal');
  });

  it('creates location card with indoorRelaxed variant content', () => {
    const locationCard = createLocationCardItem(baseVideo, 'indoorRelaxed');

    expect(locationCard.type).toBe('location_card');
    expect(locationCard.location).toBe('大理');
    expect(locationCard.locationGuide?.preference).toBe('indoorRelaxed');
    expect(locationCard.locationGuide?.version.heading).toContain('室内');
    expect(locationCard.locationGuide?.version.strategies.length).toBeGreaterThan(0);
  });

  it('creates location card with outdoorNormal variant content', () => {
    const locationCard = createLocationCardItem(baseVideo, 'outdoorNormal');

    expect(locationCard.type).toBe('location_card');
    expect(locationCard.locationGuide?.preference).toBe('outdoorNormal');
    expect(locationCard.locationGuide?.version.heading).toContain('户外');
    expect(locationCard.locationGuide?.version.strategies.length).toBeGreaterThan(0);
  });
});
